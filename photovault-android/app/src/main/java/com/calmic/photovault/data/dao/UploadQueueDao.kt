package com.calmic.photovault.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.calmic.photovault.data.model.UploadQueueItem
import com.calmic.photovault.data.model.UploadStatus

@Dao
interface UploadQueueDao {
    
    @Query("SELECT * FROM upload_queue WHERE status = :status ORDER BY priority DESC, id ASC")
    suspend fun getQueueItemsByStatus(status: UploadStatus): List<UploadQueueItem>
    
    @Query("SELECT * FROM upload_queue ORDER BY priority DESC, id ASC")
    fun getAllQueueItems(): LiveData<List<UploadQueueItem>>
    
    @Query("SELECT * FROM upload_queue WHERE photoId = :photoId")
    suspend fun getQueueItemByPhotoId(photoId: Long): UploadQueueItem?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQueueItem(item: UploadQueueItem): Long
    
    @Update
    suspend fun updateQueueItem(item: UploadQueueItem)
    
    @Delete
    suspend fun deleteQueueItem(item: UploadQueueItem)
    
    @Query("DELETE FROM upload_queue WHERE photoId = :photoId")
    suspend fun deleteQueueItemByPhotoId(photoId: Long)
    
    @Query("UPDATE upload_queue SET status = :status WHERE id = :itemId")
    suspend fun updateStatus(itemId: Long, status: UploadStatus)
    
    @Query("UPDATE upload_queue SET status = :status, retryCount = retryCount + 1, lastAttempt = :timestamp, errorMessage = :error WHERE id = :itemId")
    suspend fun updateRetry(itemId: Long, status: UploadStatus, timestamp: Long, error: String?)
    
    @Query("SELECT COUNT(*) FROM upload_queue WHERE status = 'PENDING' OR status = 'FAILED'")
    suspend fun getPendingCount(): Int
}
