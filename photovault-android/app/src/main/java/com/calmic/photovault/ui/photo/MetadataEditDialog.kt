package com.calmic.photovault.ui.photo

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.databinding.DialogMetadataEditBinding

class MetadataEditDialog(
    private val photo: Photo,
    private val onSave: (Photo) -> Unit
) : DialogFragment() {
    
    private lateinit var binding: DialogMetadataEditBinding
    
    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        binding = DialogMetadataEditBinding.inflate(LayoutInflater.from(context))
        
        // Pre-fill existing data
        binding.editDescription.setText(photo.description ?: "")
        binding.editTags.setText(photo.tags ?: "")
        binding.editPeople.setText(photo.people ?: "")
        binding.editLocation.setText(photo.location ?: "")
        
        return AlertDialog.Builder(requireContext())
            .setTitle("Edit Photo Metadata")
            .setView(binding.root)
            .setPositiveButton("Save") { _, _ ->
                saveMetadata()
            }
            .setNegativeButton("Cancel", null)
            .create()
    }
    
    private fun saveMetadata() {
        val updatedPhoto = photo.copy(
            description = binding.editDescription.text.toString().takeIf { it.isNotBlank() },
            tags = binding.editTags.text.toString().takeIf { it.isNotBlank() },
            people = binding.editPeople.text.toString().takeIf { it.isNotBlank() },
            location = binding.editLocation.text.toString().takeIf { it.isNotBlank() }
        )
        
        onSave(updatedPhoto)
    }
}
