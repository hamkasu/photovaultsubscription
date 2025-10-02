package com.calmic.photovault.data.repository

import android.content.Context
import com.calmic.photovault.network.ApiService
import com.calmic.photovault.network.model.LoginRequest
import com.calmic.photovault.network.model.RegisterRequest
import com.calmic.photovault.util.PreferenceManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UserRepository(
    private val context: Context,
    private val apiService: ApiService
) {
    
    suspend fun login(username: String, password: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(LoginRequest(username, password))
            
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                
                // Save token and user info
                PreferenceManager.saveAuthToken(context, loginResponse.token)
                PreferenceManager.saveUserId(context, loginResponse.user.id)
                PreferenceManager.saveUsername(context, loginResponse.user.username)
                
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message() ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun register(username: String, email: String, password: String, fullName: String?): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.register(RegisterRequest(username, email, password, fullName))
            
            if (response.isSuccessful && response.body() != null) {
                val registerResponse = response.body()!!
                
                // Save token and user info
                PreferenceManager.saveAuthToken(context, registerResponse.token)
                PreferenceManager.saveUserId(context, registerResponse.user.id)
                PreferenceManager.saveUsername(context, registerResponse.user.username)
                
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message() ?: "Registration failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            apiService.logout()
            PreferenceManager.clearAuthData(context)
            Result.success(Unit)
        } catch (e: Exception) {
            // Clear local data even if server request fails
            PreferenceManager.clearAuthData(context)
            Result.success(Unit)
        }
    }
    
    fun isLoggedIn(): Boolean {
        return PreferenceManager.getAuthToken(context) != null
    }
}
