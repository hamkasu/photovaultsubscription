package com.calmic.photovault.ui.camera

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.camera.EdgeDetector
import com.calmic.photovault.camera.ImageEnhancer
import com.calmic.photovault.data.model.EnhancementSettings
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.databinding.ActivityCameraBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class CameraActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityCameraBinding
    private lateinit var app: PhotoVaultApplication
    
    private var camera: Camera? = null
    private var imageCapture: ImageCapture? = null
    private var preview: Preview? = null
    
    private val edgeDetector = EdgeDetector()
    private val imageEnhancer = ImageEnhancer()
    
    private var flashEnabled = false
    private var gridEnabled = false
    private var edgeDetectionEnabled = true
    private var batchModeEnabled = false
    private var batchPhotos = mutableListOf<File>()
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            setupCamera()
        } else {
            Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as PhotoVaultApplication
        
        // Check OpenCV initialization
        if (!app.isOpenCVInitialized) {
            Toast.makeText(this, "Image processing unavailable", Toast.LENGTH_LONG).show()
            Log.e(TAG, "OpenCV not initialized, image enhancement disabled")
        }
        
        // Check and request permissions
        if (checkPermissions()) {
            setupCamera()
        } else {
            requestPermissions()
        }
        
        setupControls()
    }
    
    private fun checkPermissions(): Boolean {
        val permissions = mutableListOf(Manifest.permission.CAMERA)
        
        // SDK-aware storage permission
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        
        return permissions.all { 
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED 
        }
    }
    
    private fun requestPermissions() {
        val permissions = mutableListOf(Manifest.permission.CAMERA)
        
        // SDK-aware storage permission
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        
        requestPermissionLauncher.launch(permissions.toTypedArray())
    }
    
    private fun setupCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            
            // Preview
            preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }
            
            // Image capture
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .build()
            
            // Select back camera
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    imageCapture
                )
                
                // Enable tap to focus
                setupTapToFocus()
                
            } catch (e: Exception) {
                Log.e(TAG, "Camera binding failed", e)
                Toast.makeText(this, "Camera initialization failed", Toast.LENGTH_SHORT).show()
                finish()
            }
            
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun setupControls() {
        binding.btnClose.setOnClickListener { finish() }
        
        binding.btnCapturePhoto.setOnClickListener {
            capturePhoto()
        }
        
        binding.btnFlash.setOnClickListener {
            toggleFlash()
        }
        
        binding.btnGrid.setOnClickListener {
            toggleGrid()
        }
        
        binding.btnEdgeDetection.setOnClickListener {
            toggleEdgeDetection()
        }
        
        binding.btnBatchMode.setOnClickListener {
            toggleBatchMode()
        }
    }
    
    private fun setupTapToFocus() {
        binding.previewView.setOnTouchListener { _, event ->
            val factory = binding.previewView.meteringPointFactory
            val point = factory.createPoint(event.x, event.y)
            val action = FocusMeteringAction.Builder(point).build()
            camera?.cameraControl?.startFocusAndMetering(action)
            true
        }
    }
    
    private fun capturePhoto() {
        val imageCapture = imageCapture ?: return
        
        val photoFile = File(
            getOutputDirectory(),
            SimpleDateFormat(FILENAME_FORMAT, Locale.US)
                .format(System.currentTimeMillis()) + ".jpg"
        )
        
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
        
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    lifecycleScope.launch {
                        processAndSavePhoto(photoFile)
                    }
                }
                
                override fun onError(exc: ImageCaptureException) {
                    Log.e(TAG, "Photo capture failed: ${exc.message}", exc)
                    Toast.makeText(this@CameraActivity, "Capture failed", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }
    
    private suspend fun processAndSavePhoto(photoFile: File) = withContext(Dispatchers.IO) {
        try {
            val bitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
            
            // Detect edges if enabled and OpenCV is available
            var detectedCorners: List<android.graphics.Point>? = null
            if (edgeDetectionEnabled && app.isOpenCVInitialized) {
                try {
                    val detection = edgeDetector.detectPhotoEdges(bitmap)
                    detection?.let {
                        detectedCorners = it.corners
                        withContext(Dispatchers.Main) {
                            binding.edgeOverlay.drawDetectedEdges(it.corners)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Edge detection failed", e)
                }
            }
            
            // Enhancement settings (declared at wider scope)
            var enhancementSettings: EnhancementSettings? = null
            var isEnhanced = false
            
            // Auto-enhance if OpenCV is available
            val enhancedBitmap = if (app.isOpenCVInitialized) {
                try {
                    enhancementSettings = EnhancementSettings(
                        autoCorrect = true,
                        perspectiveCorrection = detectedCorners != null,
                        denoise = true,
                        sharpen = true
                    )
                    
                    val result = imageEnhancer.enhancePhoto(
                        bitmap,
                        enhancementSettings!!,
                        detectedCorners
                    )
                    isEnhanced = true
                    result
                } catch (e: Exception) {
                    Log.e(TAG, "Image enhancement failed", e)
                    bitmap  // Use original if enhancement fails
                }
            } else {
                bitmap  // Use original if OpenCV not available
            }
            
            // Save enhanced photo
            val enhancedFile = File(
                getOutputDirectory(),
                "enhanced_${photoFile.name}"
            )
            
            enhancedFile.outputStream().use { out ->
                enhancedBitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
            }
            
            // Serialize enhancement settings to JSON
            val enhancementJson = enhancementSettings?.let { settings ->
                com.google.gson.Gson().toJson(settings)
            }
            
            // Save to database
            val photo = Photo(
                localUri = enhancedFile.absolutePath,
                originalUri = photoFile.absolutePath,
                fileName = enhancedFile.name,
                mimeType = "image/jpeg",
                fileSize = enhancedFile.length(),
                capturedAt = System.currentTimeMillis(),
                isEnhanced = isEnhanced,
                enhancementSettings = enhancementJson
            )
            
            val photoId = app.photoRepository.savePhoto(photo)
            
            if (batchModeEnabled) {
                batchPhotos.add(enhancedFile)
                withContext(Dispatchers.Main) {
                    binding.tvBatchCount.text = "Batch: ${batchPhotos.size} photos"
                    Toast.makeText(this@CameraActivity, "Photo ${batchPhotos.size} captured", Toast.LENGTH_SHORT).show()
                }
            } else {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@CameraActivity, "Photo saved", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Photo processing failed", e)
            withContext(Dispatchers.Main) {
                Toast.makeText(this@CameraActivity, "Processing failed", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun toggleFlash() {
        flashEnabled = !flashEnabled
        camera?.cameraControl?.enableTorch(flashEnabled)
        binding.btnFlash.alpha = if (flashEnabled) 1.0f else 0.5f
    }
    
    private fun toggleGrid() {
        gridEnabled = !gridEnabled
        binding.gridOverlay.visibility = if (gridEnabled) View.VISIBLE else View.GONE
        binding.btnGrid.alpha = if (gridEnabled) 1.0f else 0.5f
    }
    
    private fun toggleEdgeDetection() {
        edgeDetectionEnabled = !edgeDetectionEnabled
        binding.edgeOverlay.visibility = if (edgeDetectionEnabled) View.VISIBLE else View.GONE
        binding.btnEdgeDetection.alpha = if (edgeDetectionEnabled) 1.0f else 0.5f
    }
    
    private fun toggleBatchMode() {
        batchModeEnabled = !batchModeEnabled
        binding.tvBatchCount.visibility = if (batchModeEnabled) View.VISIBLE else View.GONE
        binding.btnBatchMode.alpha = if (batchModeEnabled) 1.0f else 0.5f
        
        if (!batchModeEnabled && batchPhotos.isNotEmpty()) {
            Toast.makeText(this, "${batchPhotos.size} photos saved", Toast.LENGTH_SHORT).show()
            batchPhotos.clear()
        }
    }
    
    private fun getOutputDirectory(): File {
        val mediaDir = externalMediaDirs.firstOrNull()?.let {
            File(it, "PhotoVault").apply { mkdirs() }
        }
        return if (mediaDir != null && mediaDir.exists()) mediaDir else filesDir
    }
    
    companion object {
        private const val TAG = "CameraActivity"
        private const val FILENAME_FORMAT = "yyyy-MM-dd-HH-mm-ss-SSS"
    }
}
