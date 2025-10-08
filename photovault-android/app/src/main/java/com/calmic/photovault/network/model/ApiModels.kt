package com.calmic.photovault.network.model

import com.google.gson.annotations.SerializedName

// Authentication
data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    @SerializedName("full_name") val fullName: String?
)

data class LoginResponse(
    val token: String,
    val user: UserResponse
)

data class RegisterResponse(
    val token: String,
    val user: UserResponse
)

data class UserResponse(
    val id: Long,
    val username: String,
    val email: String,
    @SerializedName("full_name") val fullName: String?
)

// Photos
data class PhotoUploadResponse(
    val id: Long,
    val filename: String,
    val url: String,
    val thumbnailUrl: String?
)

data class PhotoListResponse(
    val photos: List<PhotoDetailResponse>,
    val total: Int,
    val page: Int,
    val perPage: Int
)

data class PhotoDetailResponse(
    val id: Long,
    val filename: String,
    val url: String,
    val thumbnailUrl: String?,
    val originalUrl: String?,
    val capturedAt: String?,
    val uploadedAt: String,
    val metadata: Map<String, Any>?,
    val tags: List<String>?,
    val people: List<String>?,
    val vaultId: Long?
)

data class EnhancementRequest(
    val brightness: Float,
    val contrast: Float,
    val saturation: Float,
    val autoCorrect: Boolean,
    val perspectiveCorrection: Boolean,
    val denoise: Boolean,
    val sharpen: Boolean
)

// Family Vaults
data class VaultListResponse(
    val vaults: List<VaultDetailResponse>
)

data class VaultDetailResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val ownerId: Long,
    val createdAt: String,
    val photoCount: Int,
    val members: List<VaultMember>?
)

data class VaultMember(
    val id: Long,
    val username: String,
    val role: String
)

data class CreateVaultRequest(
    val name: String,
    val description: String?
)

data class InviteMemberRequest(
    val email: String
)

data class AddPhotosRequest(
    val photoIds: List<Long>
)

// Face Detection
data class FaceDetectionRequest(
    val photoId: Long
)

data class FaceDetectionResponse(
    val faces: List<DetectedFace>,
    val count: Int
)

data class DetectedFace(
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val confidence: Float
)
