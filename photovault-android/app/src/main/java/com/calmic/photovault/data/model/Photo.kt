package com.calmic.photovault.data.model

import android.os.Parcelable
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.parcelize.Parcelize

@Parcelize
@Entity(tableName = "photos")
data class Photo(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val serverId: Long? = null,
    val localUri: String,
    val thumbnailUri: String? = null,
    val originalUri: String? = null,
    val fileName: String,
    val mimeType: String,
    val fileSize: Long,
    val capturedAt: Long = System.currentTimeMillis(),
    val uploadedAt: Long? = null,
    val isUploaded: Boolean = false,
    val isEnhanced: Boolean = false,
    val enhancementSettings: String? = null,
    val metadata: String? = null,
    val vaultId: Long? = null,
    val tags: String? = null,
    val people: String? = null,
    val location: String? = null,
    val description: String? = null
) : Parcelable

@Parcelize
@Entity(tableName = "upload_queue")
data class UploadQueueItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val photoId: Long,
    val status: UploadStatus = UploadStatus.PENDING,
    val retryCount: Int = 0,
    val lastAttempt: Long? = null,
    val errorMessage: String? = null,
    val priority: Int = 0
) : Parcelable

enum class UploadStatus {
    PENDING,
    UPLOADING,
    COMPLETED,
    FAILED
}

@Parcelize
@Entity(tableName = "family_vaults")
data class FamilyVault(
    @PrimaryKey
    val id: Long,
    val name: String,
    val description: String?,
    val ownerId: Long,
    val createdAt: Long,
    val photoCount: Int = 0,
    val isSynced: Boolean = false
) : Parcelable

@Parcelize
data class User(
    val id: Long,
    val username: String,
    val email: String,
    val fullName: String?
) : Parcelable

@Parcelize
data class EnhancementSettings(
    val brightness: Float = 1.0f,
    val contrast: Float = 1.0f,
    val saturation: Float = 1.0f,
    val autoCorrect: Boolean = true,
    val perspectiveCorrection: Boolean = true,
    val denoise: Boolean = true,
    val sharpen: Boolean = true
) : Parcelable
