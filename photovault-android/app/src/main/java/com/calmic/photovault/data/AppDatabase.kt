package com.calmic.photovault.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.calmic.photovault.data.dao.FamilyVaultDao
import com.calmic.photovault.data.dao.PhotoDao
import com.calmic.photovault.data.dao.UploadQueueDao
import com.calmic.photovault.data.model.FamilyVault
import com.calmic.photovault.data.model.Photo
import com.calmic.photovault.data.model.UploadQueueItem

@Database(
    entities = [Photo::class, UploadQueueItem::class, FamilyVault::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    
    abstract fun photoDao(): PhotoDao
    abstract fun uploadQueueDao(): UploadQueueDao
    abstract fun familyVaultDao(): FamilyVaultDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "photovault_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
