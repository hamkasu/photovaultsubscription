package com.calmic.photovault.ui.vault

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import com.calmic.photovault.databinding.DialogCreateVaultBinding

class CreateVaultDialog(
    private val onCreate: (name: String, description: String) -> Unit
) : DialogFragment() {
    
    private lateinit var binding: DialogCreateVaultBinding
    
    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        binding = DialogCreateVaultBinding.inflate(LayoutInflater.from(context))
        
        return AlertDialog.Builder(requireContext())
            .setTitle("Create Family Vault")
            .setView(binding.root)
            .setPositiveButton("Create") { _, _ ->
                createVault()
            }
            .setNegativeButton("Cancel", null)
            .create()
    }
    
    private fun createVault() {
        val name = binding.editVaultName.text.toString()
        val description = binding.editVaultDescription.text.toString()
        
        if (name.isBlank()) {
            binding.editVaultName.error = "Name is required"
            return
        }
        
        onCreate(name, description)
    }
}
