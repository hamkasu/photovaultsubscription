package com.calmic.photovault.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.calmic.photovault.data.model.Photo

@Dao
interface PhotoDao {
    
    @Query("SELECT * FROM photos ORDER BY capturedAt DESC")
    fun getAllPhotos(): LiveData<List<Photo>>
    
    @Query("SELECT * FROM photos WHERE isUploaded = 0 ORDER BY capturedAt DESC")
    fun getPendingUploadPhotos(): LiveData<List<Photo>>
    
    @Query("SELECT * FROM photos WHERE vaultId = :vaultId ORDER BY capturedAt DESC")
    fun getPhotosByVault(vaultId: Long): LiveData<List<Photo>>
    
    @Query("SELECT * FROM photos WHERE id = :photoId")
    suspend fun getPhotoById(photoId: Long): Photo?
    
    @Query("SELECT * FROM photos WHERE serverId = :serverId")
    suspend fun getPhotoByServerId(serverId: Long): Photo?
    
    @Query("SELECT * FROM photos WHERE tags LIKE '%' || :tag || '%' ORDER BY capturedAt DESC")
    fun searchByTag(tag: String): LiveData<List<Photo>>
    
    @Query("SELECT * FROM photos WHERE people LIKE '%' || :person || '%' ORDER BY capturedAt DESC")
    fun searchByPerson(person: String): LiveData<List<Photo>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhoto(photo: Photo): Long
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhotos(photos: List<Photo>)
    
    @Update
    suspend fun updatePhoto(photo: Photo)
    
    @Delete
    suspend fun deletePhoto(photo: Photo)
    
    @Query("DELETE FROM photos WHERE id = :photoId")
    suspend fun deletePhotoById(photoId: Long)
    
    @Query("UPDATE photos SET isUploaded = 1, serverId = :serverId, uploadedAt = :uploadedAt WHERE id = :photoId")
    suspend fun markAsUploaded(photoId: Long, serverId: Long, uploadedAt: Long)
    
    @Query("SELECT COUNT(*) FROM photos WHERE isUploaded = 0")
    suspend fun getPendingUploadCount(): Int
}
