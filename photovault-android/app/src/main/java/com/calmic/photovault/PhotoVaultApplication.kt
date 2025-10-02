package com.calmic.photovault

import android.app.Application
import android.util.Log
import androidx.work.Configuration
import androidx.work.WorkManager
import com.calmic.photovault.data.AppDatabase
import com.calmic.photovault.data.repository.PhotoRepository
import com.calmic.photovault.data.repository.UserRepository
import com.calmic.photovault.network.ApiService
import com.calmic.photovault.network.RetrofitClient
import org.opencv.android.OpenCVLoader

class PhotoVaultApplication : Application(), Configuration.Provider {
    
    lateinit var database: AppDatabase
        private set
    
    lateinit var apiService: ApiService
        private set
    
    lateinit var photoRepository: PhotoRepository
        private set
    
    lateinit var userRepository: UserRepository
        private set
    
    var isOpenCVInitialized = false
        private set
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize OpenCV
        if (OpenCVLoader.initDebug()) {
            Log.i(TAG, "OpenCV initialized successfully")
            isOpenCVInitialized = true
        } else {
            Log.e(TAG, "OpenCV initialization failed")
            isOpenCVInitialized = false
        }
        
        // Initialize database
        database = AppDatabase.getDatabase(this)
        
        // Initialize network
        apiService = RetrofitClient.getInstance(this)
        
        // Initialize repositories
        photoRepository = PhotoRepository(database.photoDao(), database.uploadQueueDao(), apiService)
        userRepository = UserRepository(this, apiService)
    }
    
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build()
    
    companion object {
        private const val TAG = "PhotoVaultApp"
    }
}
