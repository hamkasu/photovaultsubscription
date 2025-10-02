package com.calmic.photovault.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.calmic.photovault.data.model.FamilyVault

@Dao
interface FamilyVaultDao {
    
    @Query("SELECT * FROM family_vaults ORDER BY createdAt DESC")
    fun getAllVaults(): LiveData<List<FamilyVault>>
    
    @Query("SELECT * FROM family_vaults WHERE id = :vaultId")
    suspend fun getVaultById(vaultId: Long): FamilyVault?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVault(vault: FamilyVault)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVaults(vaults: List<FamilyVault>)
    
    @Update
    suspend fun updateVault(vault: FamilyVault)
    
    @Delete
    suspend fun deleteVault(vault: FamilyVault)
    
    @Query("UPDATE family_vaults SET photoCount = :count WHERE id = :vaultId")
    suspend fun updatePhotoCount(vaultId: Long, count: Int)
}
