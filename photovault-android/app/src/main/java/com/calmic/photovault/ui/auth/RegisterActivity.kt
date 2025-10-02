package com.calmic.photovault.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.calmic.photovault.PhotoVaultApplication
import com.calmic.photovault.databinding.ActivityRegisterBinding
import com.calmic.photovault.ui.MainActivity
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityRegisterBinding
    private lateinit var app: PhotoVaultApplication
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as PhotoVaultApplication
        
        setupUI()
    }
    
    private fun setupUI() {
        binding.btnRegister.setOnClickListener {
            val username = binding.etUsername.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()
            val fullName = binding.etFullName.text.toString().trim()
            
            if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill all required fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            performRegister(username, email, password, fullName.ifEmpty { null })
        }
        
        binding.tvLogin.setOnClickListener {
            finish()
        }
    }
    
    private fun performRegister(username: String, email: String, password: String, fullName: String?) {
        binding.btnRegister.isEnabled = false
        
        lifecycleScope.launch {
            val result = app.userRepository.register(username, email, password, fullName)
            
            if (result.isSuccess) {
                Toast.makeText(this@RegisterActivity, "Registration successful", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this@RegisterActivity, MainActivity::class.java))
                finish()
            } else {
                Toast.makeText(
                    this@RegisterActivity,
                    "Registration failed: ${result.exceptionOrNull()?.message}",
                    Toast.LENGTH_SHORT
                ).show()
                binding.btnRegister.isEnabled = true
            }
        }
    }
}
