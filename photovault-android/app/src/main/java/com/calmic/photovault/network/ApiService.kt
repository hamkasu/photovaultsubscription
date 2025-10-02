package com.calmic.photovault.network

import com.calmic.photovault.network.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Authentication
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>
    
    @POST("auth/logout")
    suspend fun logout(): Response<Unit>
    
    @GET("auth/user")
    suspend fun getCurrentUser(): Response<UserResponse>
    
    // Photos
    @Multipart
    @POST("upload")
    suspend fun uploadPhoto(
        @Part file: MultipartBody.Part,
        @Part("metadata") metadata: RequestBody
    ): Response<PhotoUploadResponse>
    
    @GET("gallery/photos")
    suspend fun getPhotos(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): Response<PhotoListResponse>
    
    @GET("photo/{id}")
    suspend fun getPhoto(@Path("id") photoId: Long): Response<PhotoDetailResponse>
    
    @DELETE("photo/{id}")
    suspend fun deletePhoto(@Path("id") photoId: Long): Response<Unit>
    
    @POST("photo/{id}/enhance")
    suspend fun enhancePhoto(
        @Path("id") photoId: Long,
        @Body settings: EnhancementRequest
    ): Response<PhotoDetailResponse>
    
    // Family Vaults
    @GET("family/vaults")
    suspend fun getFamilyVaults(): Response<VaultListResponse>
    
    @GET("family/vault/{id}")
    suspend fun getVaultDetails(@Path("id") vaultId: Long): Response<VaultDetailResponse>
    
    @POST("family/vault")
    suspend fun createVault(@Body request: CreateVaultRequest): Response<VaultDetailResponse>
    
    @POST("family/vault/{id}/invite")
    suspend fun inviteMember(
        @Path("id") vaultId: Long,
        @Body request: InviteMemberRequest
    ): Response<Unit>
    
    @GET("family/vault/{id}/photos")
    suspend fun getVaultPhotos(
        @Path("id") vaultId: Long,
        @Query("page") page: Int = 1
    ): Response<PhotoListResponse>
    
    @POST("family/vault/{id}/photos")
    suspend fun addPhotosToVault(
        @Path("id") vaultId: Long,
        @Body request: AddPhotosRequest
    ): Response<Unit>
    
    // Face Detection
    @POST("api/photo-detection/extract")
    suspend fun detectFaces(
        @Body request: FaceDetectionRequest
    ): Response<FaceDetectionResponse>
}
