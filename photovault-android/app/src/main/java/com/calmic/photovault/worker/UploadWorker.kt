package com.calmic.photovault.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.data.model.UploadStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UploadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val app = applicationContext as PhotoVaultApplication
            val uploadQueueDao = app.database.uploadQueueDao()
            val photoRepository = app.photoRepository
            
            // Get pending uploads
            val pendingItems = uploadQueueDao.getQueueItemsByStatus(UploadStatus.PENDING)
            
            var successCount = 0
            var failCount = 0
            
            for (item in pendingItems) {
                // Skip if retry count is too high
                if (item.retryCount >= 3) {
                    failCount++
                    continue
                }
                
                val result = photoRepository.uploadPhoto(item.photoId)
                
                if (result.isSuccess) {
                    successCount++
                } else {
                    failCount++
                }
            }
            
            // Retry failed uploads
            val failedItems = uploadQueueDao.getQueueItemsByStatus(UploadStatus.FAILED)
            for (item in failedItems.filter { it.retryCount < 3 }) {
                val result = photoRepository.uploadPhoto(item.photoId)
                if (result.isSuccess) {
                    successCount++
                }
            }
            
            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}
