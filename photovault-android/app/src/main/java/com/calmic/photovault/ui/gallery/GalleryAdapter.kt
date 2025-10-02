package com.calmic.photovault.ui.gallery

import android.net.Uri
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.calmic.photovault.R
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.databinding.ItemPhotoGridBinding

class GalleryAdapter(
    private val onPhotoClick: (Photo) -> Unit
) : ListAdapter<Photo, GalleryAdapter.PhotoViewHolder>(PhotoDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PhotoViewHolder {
        val binding = ItemPhotoGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return PhotoViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: PhotoViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class PhotoViewHolder(
        private val binding: ItemPhotoGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(photo: Photo) {
            // Load thumbnail or full image
            val imageUri = photo.thumbnailUri ?: photo.localUri
            
            Glide.with(binding.root.context)
                .load(Uri.parse(imageUri))
                .centerCrop()
                .placeholder(R.drawable.placeholder_photo)
                .into(binding.imageView)
            
            // Show upload status indicator
            binding.uploadIndicator.visibility = if (photo.isUploaded) {
                android.view.View.VISIBLE
            } else {
                android.view.View.GONE
            }
            
            // Show enhancement indicator
            binding.enhancedIndicator.visibility = if (photo.isEnhanced) {
                android.view.View.VISIBLE
            } else {
                android.view.View.GONE
            }
            
            binding.root.setOnClickListener {
                onPhotoClick(photo)
            }
        }
    }
    
    private class PhotoDiffCallback : DiffUtil.ItemCallback<Photo>() {
        override fun areItemsTheSame(oldItem: Photo, newItem: Photo): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: Photo, newItem: Photo): Boolean {
            return oldItem == newItem
        }
    }
}
