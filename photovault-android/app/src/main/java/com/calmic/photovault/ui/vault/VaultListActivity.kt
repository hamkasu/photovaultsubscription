package com.calmic.photovault.ui.vault

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.data.model.FamilyVault
import com.calmic.photovault.databinding.ActivityVaultListBinding
import kotlinx.coroutines.launch

class VaultListActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityVaultListBinding
    private lateinit var app: PhotoVaultApplication
    private lateinit var adapter: VaultAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVaultListBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as PhotoVaultApplication
        
        setupToolbar()
        setupRecyclerView()
        loadVaults()
        setupFab()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Family Vaults"
    }
    
    private fun setupRecyclerView() {
        adapter = VaultAdapter { vault ->
            openVaultDetail(vault)
        }
        
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(this@VaultListActivity)
            this.adapter = this@VaultListActivity.adapter
        }
    }
    
    private fun loadVaults() {
        binding.progressBar.visibility = android.view.View.VISIBLE
        
        lifecycleScope.launch {
            try {
                // Fetch vaults from server
                val result = app.apiService.getFamilyVaults()
                if (result.isSuccessful && result.body() != null) {
                    val vaults = result.body()!!.vaults
                    adapter.submitList(vaults)
                    
                    // Save to local database
                    vaults.forEach { vault ->
                        app.database.familyVaultDao().insertVault(vault)
                    }
                } else {
                    // Load from local cache if server fails
                    app.database.familyVaultDao().getAllVaults().observe(this@VaultListActivity) { vaults ->
                        adapter.submitList(vaults)
                    }
                    Toast.makeText(this@VaultListActivity, "Using cached vaults", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                // Load from local cache on error
                app.database.familyVaultDao().getAllVaults().observe(this@VaultListActivity) { vaults ->
                    adapter.submitList(vaults)
                }
                Toast.makeText(this@VaultListActivity, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = android.view.View.GONE
            }
        }
    }
    
    private fun setupFab() {
        binding.fabCreateVault.setOnClickListener {
            showCreateVaultDialog()
        }
    }
    
    private fun showCreateVaultDialog() {
        val dialog = CreateVaultDialog { name, description ->
            createVault(name, description)
        }
        dialog.show(supportFragmentManager, "create_vault")
    }
    
    private fun createVault(name: String, description: String) {
        lifecycleScope.launch {
            try {
                val result = app.apiService.createVault(
                    com.calmic.photovault.network.model.CreateVaultRequest(name, description)
                )
                
                if (result.isSuccessful && result.body() != null) {
                    Toast.makeText(this@VaultListActivity, "Vault created successfully", Toast.LENGTH_SHORT).show()
                    loadVaults() // Refresh list
                } else {
                    Toast.makeText(this@VaultListActivity, "Failed to create vault", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@VaultListActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun openVaultDetail(vault: FamilyVault) {
        val intent = Intent(this, VaultDetailActivity::class.java).apply {
            putExtra("vault", vault)
        }
        startActivity(intent)
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
