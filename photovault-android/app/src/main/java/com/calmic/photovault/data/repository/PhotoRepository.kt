package com.calmic.photovault.data.repository

import android.content.Context
import androidx.lifecycle.LiveData
import com.calmic.photovault.data.dao.PhotoDao
import com.calmic.photovault.data.dao.UploadQueueDao
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.data.model.UploadQueueItem
import com.calmic.photovault.data.model.UploadStatus
import com.calmic.photovault.network.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class PhotoRepository(
    private val photoDao: PhotoDao,
    private val uploadQueueDao: UploadQueueDao,
    private val apiService: ApiService
) {
    
    fun getAllPhotos(): LiveData<List<Photo>> = photoDao.getAllPhotos()
    
    fun getPendingUploadPhotos(): LiveData<List<Photo>> = photoDao.getPendingUploadPhotos()
    
    fun getPhotosByVault(vaultId: Long): LiveData<List<Photo>> = photoDao.getPhotosByVault(vaultId)
    
    suspend fun savePhoto(photo: Photo): Long = withContext(Dispatchers.IO) {
        val photoId = photoDao.insertPhoto(photo)
        
        // Add to upload queue
        val queueItem = UploadQueueItem(
            photoId = photoId,
            status = UploadStatus.PENDING
        )
        uploadQueueDao.insertQueueItem(queueItem)
        
        photoId
    }
    
    suspend fun uploadPhoto(photoId: Long): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val photo = photoDao.getPhotoById(photoId) ?: return@withContext Result.failure(Exception("Photo not found"))
            val queueItem = uploadQueueDao.getQueueItemByPhotoId(photoId) ?: return@withContext Result.failure(Exception("Queue item not found"))
            
            // Update status to uploading
            uploadQueueDao.updateStatus(queueItem.id, UploadStatus.UPLOADING)
            
            // Prepare file
            val file = File(photo.localUri)
            if (!file.exists()) {
                uploadQueueDao.updateRetry(queueItem.id, UploadStatus.FAILED, System.currentTimeMillis(), "File not found")
                return@withContext Result.failure(Exception("File not found"))
            }
            
            val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            
            // Prepare metadata
            val metadata = buildString {
                append("{")
                photo.tags?.let { append("\"tags\":\"$it\",") }
                photo.people?.let { append("\"people\":\"$it\",") }
                photo.location?.let { append("\"location\":\"$it\",") }
                photo.description?.let { append("\"description\":\"$it\",") }
                photo.vaultId?.let { append("\"vault_id\":$it,") }
                append("\"captured_at\":\"${photo.capturedAt}\"")
                append("}")
            }
            val metadataBody = metadata.toRequestBody("application/json".toMediaTypeOrNull())
            
            // Upload
            val response = apiService.uploadPhoto(body, metadataBody)
            
            if (response.isSuccessful && response.body() != null) {
                val uploadResponse = response.body()!!
                
                // Update photo with server ID
                photoDao.markAsUploaded(photoId, uploadResponse.id, System.currentTimeMillis())
                
                // Remove from queue
                uploadQueueDao.deleteQueueItemByPhotoId(photoId)
                
                Result.success(Unit)
            } else {
                uploadQueueDao.updateRetry(queueItem.id, UploadStatus.FAILED, System.currentTimeMillis(), response.message())
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            val queueItem = uploadQueueDao.getQueueItemByPhotoId(photoId)
            queueItem?.let {
                uploadQueueDao.updateRetry(it.id, UploadStatus.FAILED, System.currentTimeMillis(), e.message)
            }
            Result.failure(e)
        }
    }
    
    suspend fun updatePhoto(photo: Photo) = withContext(Dispatchers.IO) {
        photoDao.updatePhoto(photo)
    }
    
    suspend fun deletePhoto(photoId: Long) = withContext(Dispatchers.IO) {
        val photo = photoDao.getPhotoById(photoId)
        photo?.let {
            // Delete from server if uploaded
            if (it.isUploaded && it.serverId != null) {
                try {
                    apiService.deletePhoto(it.serverId)
                } catch (e: Exception) {
                    // Ignore server errors
                }
            }
            
            // Delete local file
            val file = File(it.localUri)
            if (file.exists()) {
                file.delete()
            }
            
            // Delete from database
            photoDao.deletePhoto(it)
            uploadQueueDao.deleteQueueItemByPhotoId(photoId)
        }
    }
}
