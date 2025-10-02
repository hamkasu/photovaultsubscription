package com.calmic.photovault.ui.gallery

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SearchView
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.R
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.databinding.ActivityGalleryBinding
import com.calmic.photovault.ui.photo.PhotoDetailActivity
import kotlinx.coroutines.launch

class GalleryActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityGalleryBinding
    private lateinit var app: PhotoVaultApplication
    private lateinit var adapter: GalleryAdapter
    
    private var allPhotos = listOf<Photo>()
    private var filteredPhotos = listOf<Photo>()
    private var currentFilter = FilterType.ALL
    
    enum class FilterType {
        ALL, UPLOADED, PENDING, ENHANCED
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGalleryBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as PhotoVaultApplication
        
        setupToolbar()
        setupRecyclerView()
        loadPhotos()
        setupFilterButtons()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Gallery"
    }
    
    private fun setupRecyclerView() {
        adapter = GalleryAdapter { photo ->
            openPhotoDetail(photo)
        }
        
        binding.recyclerView.apply {
            layoutManager = GridLayoutManager(this@GalleryActivity, 3)
            this.adapter = this@GalleryActivity.adapter
        }
    }
    
    private fun loadPhotos() {
        app.photoRepository.getAllPhotos().observe(this) { photos ->
            allPhotos = photos
            applyFilter()
        }
    }
    
    private fun setupFilterButtons() {
        binding.chipAll.setOnClickListener {
            currentFilter = FilterType.ALL
            applyFilter()
        }
        
        binding.chipUploaded.setOnClickListener {
            currentFilter = FilterType.UPLOADED
            applyFilter()
        }
        
        binding.chipPending.setOnClickListener {
            currentFilter = FilterType.PENDING
            applyFilter()
        }
        
        binding.chipEnhanced.setOnClickListener {
            currentFilter = FilterType.ENHANCED
            applyFilter()
        }
    }
    
    private fun applyFilter() {
        filteredPhotos = when (currentFilter) {
            FilterType.ALL -> allPhotos
            FilterType.UPLOADED -> allPhotos.filter { it.isUploaded }
            FilterType.PENDING -> allPhotos.filter { !it.isUploaded }
            FilterType.ENHANCED -> allPhotos.filter { it.isEnhanced }
        }
        
        adapter.submitList(filteredPhotos)
        
        // Update chip states
        binding.chipAll.isChecked = currentFilter == FilterType.ALL
        binding.chipUploaded.isChecked = currentFilter == FilterType.UPLOADED
        binding.chipPending.isChecked = currentFilter == FilterType.PENDING
        binding.chipEnhanced.isChecked = currentFilter == FilterType.ENHANCED
        
        // Update count
        binding.textPhotoCount.text = "${filteredPhotos.size} photos"
    }
    
    private fun searchPhotos(query: String) {
        val searchQuery = query.lowercase()
        filteredPhotos = allPhotos.filter { photo ->
            photo.fileName.lowercase().contains(searchQuery) ||
            photo.tags?.lowercase()?.contains(searchQuery) == true ||
            photo.people?.lowercase()?.contains(searchQuery) == true ||
            photo.description?.lowercase()?.contains(searchQuery) == true
        }
        adapter.submitList(filteredPhotos)
        binding.textPhotoCount.text = "${filteredPhotos.size} photos"
    }
    
    private fun openPhotoDetail(photo: Photo) {
        val intent = Intent(this, PhotoDetailActivity::class.java).apply {
            putExtra("photo", photo)
        }
        startActivity(intent)
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.gallery_menu, menu)
        
        val searchItem = menu.findItem(R.id.action_search)
        val searchView = searchItem?.actionView as? SearchView
        
        searchView?.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String): Boolean {
                searchPhotos(query)
                return true
            }
            
            override fun onQueryTextChange(newText: String): Boolean {
                if (newText.isEmpty()) {
                    applyFilter()
                } else {
                    searchPhotos(newText)
                }
                return true
            }
        })
        
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            R.id.action_sort_date -> {
                sortByDate()
                true
            }
            R.id.action_sort_name -> {
                sortByName()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun sortByDate() {
        filteredPhotos = filteredPhotos.sortedByDescending { it.capturedAt }
        adapter.submitList(filteredPhotos)
        Toast.makeText(this, "Sorted by date", Toast.LENGTH_SHORT).show()
    }
    
    private fun sortByName() {
        filteredPhotos = filteredPhotos.sortedBy { it.fileName }
        adapter.submitList(filteredPhotos)
        Toast.makeText(this, "Sorted by name", Toast.LENGTH_SHORT).show()
    }
}
