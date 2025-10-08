package com.calmic.photovault.ui.photo

import android.net.Uri
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.R
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.databinding.ActivityPhotoDetailBinding
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class PhotoDetailActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityPhotoDetailBinding
    private lateinit var app: PhotoVaultApplication
    private lateinit var photo: Photo
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPhotoDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as PhotoVaultApplication
        
        photo = intent.getParcelableExtra("photo") ?: run {
            Toast.makeText(this, "Photo not found", Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        
        setupToolbar()
        displayPhoto()
        setupButtons()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = photo.fileName
    }
    
    private fun displayPhoto() {
        // Load full resolution image
        Glide.with(this)
            .load(Uri.parse(photo.localUri))
            .placeholder(R.drawable.placeholder_photo)
            .into(binding.imageView)
        
        // Display metadata
        binding.textFileName.text = photo.fileName
        binding.textFileSize.text = formatFileSize(photo.fileSize)
        binding.textCapturedDate.text = formatDate(photo.capturedAt)
        
        binding.textUploadStatus.text = if (photo.isUploaded) {
            "Uploaded ${photo.uploadedAt?.let { formatDate(it) } ?: ""}"
        } else {
            "Not uploaded"
        }
        
        binding.textEnhancementStatus.text = if (photo.isEnhanced) {
            "Enhanced"
        } else {
            "Original"
        }
        
        // Display optional metadata
        photo.description?.let {
            binding.textDescription.text = it
        }
        
        photo.tags?.let {
            binding.textTags.text = "Tags: $it"
        }
        
        photo.people?.let {
            binding.textPeople.text = "People: $it"
        }
        
        photo.location?.let {
            binding.textLocation.text = "Location: $it"
        }
    }
    
    private fun setupButtons() {
        binding.btnEditMetadata.setOnClickListener {
            showMetadataEditDialog()
        }
        
        binding.btnShare.setOnClickListener {
            sharePhoto()
        }
        
        binding.btnDelete.setOnClickListener {
            confirmDelete()
        }
    }
    
    private fun showMetadataEditDialog() {
        val dialog = MetadataEditDialog(photo) { updatedPhoto ->
            photo = updatedPhoto
            lifecycleScope.launch {
                // Update photo in database
                app.photoRepository.updatePhoto(updatedPhoto)
                displayPhoto()
            }
        }
        dialog.show(supportFragmentManager, "metadata_edit")
    }
    
    private fun sharePhoto() {
        // Implement photo sharing
        Toast.makeText(this, "Share functionality coming soon", Toast.LENGTH_SHORT).show()
    }
    
    private fun confirmDelete() {
        AlertDialog.Builder(this)
            .setTitle("Delete Photo")
            .setMessage("Are you sure you want to delete this photo?")
            .setPositiveButton("Delete") { _, _ ->
                deletePhoto()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun deletePhoto() {
        lifecycleScope.launch {
            try {
                app.photoRepository.deletePhoto(photo.id)
                Toast.makeText(this@PhotoDetailActivity, "Photo deleted", Toast.LENGTH_SHORT).show()
                finish()
            } catch (e: Exception) {
                Toast.makeText(this@PhotoDetailActivity, "Failed to delete: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun formatFileSize(bytes: Long): String {
        return when {
            bytes >= 1024 * 1024 -> String.format("%.2f MB", bytes / (1024.0 * 1024.0))
            bytes >= 1024 -> String.format("%.2f KB", bytes / 1024.0)
            else -> "$bytes B"
        }
    }
    
    private fun formatDate(timestamp: Long): String {
        val sdf = SimpleDateFormat("MMM dd, yyyy 'at' hh:mm a", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
