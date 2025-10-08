package com.calmic.photovault.ui.vault

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import com.calmic.photovault.data.model.FamilyVault
import com.calmic.photovault.databinding.DialogInviteMemberBinding

class InviteMemberDialog(
    private val vault: FamilyVault,
    private val onInvite: (email: String) -> Unit
) : DialogFragment() {
    
    private lateinit var binding: DialogInviteMemberBinding
    
    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        binding = DialogInviteMemberBinding.inflate(LayoutInflater.from(context))
        
        binding.textVaultName.text = "Invite member to ${vault.name}"
        
        return AlertDialog.Builder(requireContext())
            .setTitle("Invite Family Member")
            .setView(binding.root)
            .setPositiveButton("Send Invitation") { _, _ ->
                sendInvitation()
            }
            .setNegativeButton("Cancel", null)
            .create()
    }
    
    private fun sendInvitation() {
        val email = binding.editEmail.text.toString()
        
        if (email.isBlank()) {
            binding.editEmail.error = "Email is required"
            return
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.editEmail.error = "Invalid email address"
            return
        }
        
        onInvite(email)
    }
}
