package com.calmic.photovault.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.work.*
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.databinding.ActivityMainBinding
import com.calmic.photovault.ui.auth.LoginActivity
import com.calmic.photovault.ui.camera.CameraActivity
import com.calmic.photovault.worker.UploadWorker
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var app: PhotoVaultApplication
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            openCamera()
        } else {
            Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as PhotoVaultApplication
        
        // Check if user is logged in
        if (!app.userRepository.isLoggedIn()) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        setupUI()
        scheduleUploadWorker()
    }
    
    private fun setupUI() {
        binding.btnCapture.setOnClickListener {
            checkPermissionsAndOpenCamera()
        }
        
        binding.btnGallery.setOnClickListener {
            startActivity(Intent(this, com.calmic.photovault.ui.gallery.GalleryActivity::class.java))
        }
        
        binding.btnVaults.setOnClickListener {
            startActivity(Intent(this, com.calmic.photovault.ui.vault.VaultListActivity::class.java))
        }
    }
    
    private fun checkPermissionsAndOpenCamera() {
        val permissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.READ_EXTERNAL_STORAGE
        )
        
        if (permissions.all { ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED }) {
            openCamera()
        } else {
            requestPermissionLauncher.launch(permissions)
        }
    }
    
    private fun openCamera() {
        startActivity(Intent(this, CameraActivity::class.java))
    }
    
    private fun scheduleUploadWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val uploadWorkRequest = PeriodicWorkRequestBuilder<UploadWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()
        
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "photo_upload",
            ExistingPeriodicWorkPolicy.KEEP,
            uploadWorkRequest
        )
    }
}
