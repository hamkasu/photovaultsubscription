package com.calmic.photovault.ui.vault

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.R
import com.calmic.photovault.data.model.FamilyVault
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.databinding.ActivityVaultDetailBinding
import com.calmic.photovault.ui.gallery.GalleryAdapter
import com.calmic.photovault.ui.photo.PhotoDetailActivity
import kotlinx.coroutines.launch

class VaultDetailActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityVaultDetailBinding
    private lateinit var app: PhotoVaultApplication
    private lateinit var vault: FamilyVault
    private lateinit var adapter: GalleryAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVaultDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as PhotoVaultApplication
        
        vault = intent.getParcelableExtra("vault") ?: run {
            Toast.makeText(this, "Vault not found", Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        
        setupToolbar()
        setupRecyclerView()
        loadVaultPhotos()
        setupButtons()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = vault.name
    }
    
    private fun setupRecyclerView() {
        adapter = GalleryAdapter { photo ->
            openPhotoDetail(photo)
        }
        
        binding.recyclerView.apply {
            layoutManager = GridLayoutManager(this@VaultDetailActivity, 3)
            this.adapter = this@VaultDetailActivity.adapter
        }
    }
    
    private fun loadVaultPhotos() {
        binding.progressBar.visibility = android.view.View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val result = app.apiService.getVaultPhotos(vault.id)
                if (result.isSuccessful && result.body() != null) {
                    val photos = result.body()!!.photos
                    adapter.submitList(photos)
                    binding.textPhotoCount.text = "${photos.size} photos"
                } else {
                    // Load from local database
                    app.photoRepository.getPhotosByVault(vault.id).observe(this@VaultDetailActivity) { photos ->
                        adapter.submitList(photos)
                        binding.textPhotoCount.text = "${photos.size} photos"
                    }
                }
            } catch (e: Exception) {
                // Load from local database on error
                app.photoRepository.getPhotosByVault(vault.id).observe(this@VaultDetailActivity) { photos ->
                    adapter.submitList(photos)
                    binding.textPhotoCount.text = "${photos.size} photos"
                }
                Toast.makeText(this@VaultDetailActivity, "Network error", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = android.view.View.GONE
            }
        }
    }
    
    private fun setupButtons() {
        binding.fabAddPhotos.setOnClickListener {
            addPhotosToVault()
        }
        
        binding.btnInviteMember.setOnClickListener {
            showInviteMemberDialog()
        }
    }
    
    private fun addPhotosToVault() {
        Toast.makeText(this, "Select photos from gallery coming soon", Toast.LENGTH_SHORT).show()
    }
    
    private fun showInviteMemberDialog() {
        val dialog = InviteMemberDialog(vault) { email ->
            inviteMember(email)
        }
        dialog.show(supportFragmentManager, "invite_member")
    }
    
    private fun inviteMember(email: String) {
        lifecycleScope.launch {
            try {
                val result = app.apiService.inviteMember(
                    vault.id,
                    com.calmic.photovault.network.model.InviteMemberRequest(email)
                )
                
                if (result.isSuccessful) {
                    Toast.makeText(this@VaultDetailActivity, "Invitation sent to $email", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@VaultDetailActivity, "Failed to send invitation", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@VaultDetailActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun openPhotoDetail(photo: Photo) {
        val intent = Intent(this, PhotoDetailActivity::class.java).apply {
            putExtra("photo", photo)
        }
        startActivity(intent)
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.vault_detail_menu, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            R.id.action_download_all -> {
                downloadAllPhotos()
                true
            }
            R.id.action_vault_settings -> {
                openVaultSettings()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun downloadAllPhotos() {
        Toast.makeText(this, "Downloading all photos for offline viewing...", Toast.LENGTH_SHORT).show()
        // Implement offline download
    }
    
    private fun openVaultSettings() {
        Toast.makeText(this, "Vault settings coming soon", Toast.LENGTH_SHORT).show()
    }
}
