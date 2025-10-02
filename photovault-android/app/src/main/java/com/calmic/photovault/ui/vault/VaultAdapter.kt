package com.calmic.photovault.ui.vault

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.calmic.photovault.data.model.FamilyVault
import com.calmic.photovault.databinding.ItemVaultBinding
import java.text.SimpleDateFormat
import java.util.*

class VaultAdapter(
    private val onVaultClick: (FamilyVault) -> Unit
) : ListAdapter<FamilyVault, VaultAdapter.VaultViewHolder>(VaultDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VaultViewHolder {
        val binding = ItemVaultBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return VaultViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: VaultViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class VaultViewHolder(
        private val binding: ItemVaultBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(vault: FamilyVault) {
            binding.textVaultName.text = vault.name
            binding.textVaultDescription.text = vault.description ?: "No description"
            binding.textPhotoCount.text = "${vault.photoCount} photos"
            
            val sdf = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
            binding.textCreatedDate.text = "Created ${sdf.format(Date(vault.createdAt))}"
            
            binding.root.setOnClickListener {
                onVaultClick(vault)
            }
        }
    }
    
    private class VaultDiffCallback : DiffUtil.ItemCallback<FamilyVault>() {
        override fun areItemsTheSame(oldItem: FamilyVault, newItem: FamilyVault): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: FamilyVault, newItem: FamilyVault): Boolean {
            return oldItem == newItem
        }
    }
}
