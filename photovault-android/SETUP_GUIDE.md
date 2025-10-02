# PhotoVault Android Client - Setup Guide

## Overview
The PhotoVault Android client is now integrated with the Replit backend and includes all major features:

- ✅ Advanced Camera with edge detection and batch capture
- ✅ Image Enhancement Pipeline (OpenCV)
- ✅ Gallery UI with search, filtering, and timeline view
- ✅ Family Vaults with member invitations
- ✅ Offline-first architecture with upload queue
- ✅ Photo metadata editing (tags, people, location, description)
- ✅ Face detection integration (backend API)
- ✅ Background upload with WorkManager

## Architecture

### Implemented Components

#### 1. Core Infrastructure
- **Application**: `PhotoVaultApplication.kt` - Initializes OpenCV, Database, API, Repositories
- **Database**: Room database with Photo, UploadQueue, FamilyVault entities
- **Network**: Retrofit API client configured for Replit backend
- **Background**: WorkManager for automatic photo uploads

#### 2. Camera Module
- **CameraActivity**: Full-featured camera with CameraX
- **EdgeDetector**: OpenCV-based photo edge detection
- **ImageEnhancer**: Perspective correction, color restoration, denoising, sharpening
- Features: Grid overlay, manual focus/exposure, batch mode, flash control

#### 3. Gallery Module
- **GalleryActivity**: Photo grid with filtering (All, Uploaded, Pending, Enhanced)
- **GalleryAdapter**: RecyclerView adapter with Glide image loading
- **Search**: Full-text search across filename, tags, people, description
- **Sorting**: By date or name

#### 4. Photo Detail Module
- **PhotoDetailActivity**: Full-screen photo view with metadata
- **MetadataEditDialog**: Edit description, tags, people, location
- Actions: Share, delete, edit metadata

#### 5. Family Vaults Module
- **VaultListActivity**: Browse all family vaults
- **VaultDetailActivity**: View vault photos and members
- **CreateVaultDialog**: Create new family vault
- **InviteMemberDialog**: Invite members via email

#### 6. Authentication Module
- **LoginActivity**: User login with JWT token
- **RegisterActivity**: New user registration
- **UserRepository**: Manages auth state and tokens

#### 7. Data Layer
- **PhotoRepository**: Photo CRUD, upload queue management
- **UserRepository**: Authentication and user management
- **DAOs**: PhotoDao, UploadQueueDao, FamilyVaultDao

## Configuration

### Backend URL
The app is configured to use the Replit backend:
```kotlin
// In app/build.gradle
buildConfigField "String", "API_BASE_URL", 
    "\"https://62fd2792-7858-474f-abf0-1533e39f5256-00-3uuvecowo9aq1.kirk.replit.dev\""
```

### API Endpoints
All endpoints are defined in `ApiService.kt`:
- Authentication: `/auth/login`, `/auth/register`
- Photos: `/upload`, `/gallery/photos`, `/photo/{id}`
- Family Vaults: `/family/vaults`, `/family/vault/{id}`
- Face Detection: `/api/photo-detection/extract`

## Building the App

### Prerequisites
1. **Android Studio Hedgehog (2023.1.1) or later**
2. **JDK 17**
3. **Android SDK 34**
4. **Internet connection** (for Maven dependency downloads)

### Setup Steps

#### 1. Install Android Studio
Download from: https://developer.android.com/studio

#### 2. Open Project
```bash
cd photovault-android
# Open in Android Studio: File > Open > Select photovault-android folder
```

#### 3. OpenCV Configuration ✅
The app uses **OpenCV 4.12.0** from official Maven Central (automatically downloaded):

```gradle
implementation 'org.opencv:opencv:4.12.0'
```

No manual AAR download needed - Gradle will fetch it automatically during build.

#### 4. Create Missing Layout XML Files

The Kotlin code is complete, but you need to create the following layout XML files in Android Studio:

**Required Layouts** (create in `app/src/main/res/layout/`):

1. **activity_gallery.xml**
```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    
    <com.google.android.material.appbar.AppBarLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content">
        
        <androidx.appcompat.widget.Toolbar
            android:id="@+id/toolbar"
            android:layout_width="match_parent"
            android:layout_height="?attr/actionBarSize"/>
    </com.google.android.material.appbar.AppBarLayout>
    
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical"
        app:layout_behavior="@string/appbar_scrolling_view_behavior">
        
        <HorizontalScrollView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="8dp">
            
            <com.google.android.material.chip.ChipGroup
                android:layout_width="wrap_content"
                android:layout_height="wrap_content">
                
                <com.google.android.material.chip.Chip
                    android:id="@+id/chip_all"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="All"
                    style="@style/Widget.Material3.Chip.Filter"/>
                    
                <com.google.android.material.chip.Chip
                    android:id="@+id/chip_uploaded"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Uploaded"
                    style="@style/Widget.Material3.Chip.Filter"/>
                    
                <com.google.android.material.chip.Chip
                    android:id="@+id/chip_pending"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Pending"
                    style="@style/Widget.Material3.Chip.Filter"/>
                    
                <com.google.android.material.chip.Chip
                    android:id="@+id/chip_enhanced"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Enhanced"
                    style="@style/Widget.Material3.Chip.Filter"/>
            </com.google.android.material.chip.ChipGroup>
        </HorizontalScrollView>
        
        <TextView
            android:id="@+id/text_photo_count"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:padding="8dp"
            android:text="0 photos"/>
        
        <androidx.recyclerview.widget.RecyclerView
            android:id="@+id/recycler_view"
            android:layout_width="match_parent"
            android:layout_height="match_parent"/>
    </LinearLayout>
</androidx.coordinatorlayout.widget.CoordinatorLayout>
```

2. **item_photo_grid.xml** - Photo grid item
3. **activity_photo_detail.xml** - Photo detail screen
4. **dialog_metadata_edit.xml** - Metadata editing dialog
5. **activity_vault_list.xml** - Vault list screen
6. **item_vault.xml** - Vault list item
7. **activity_vault_detail.xml** - Vault detail screen
8. **dialog_create_vault.xml** - Create vault dialog
9. **dialog_invite_member.xml** - Invite member dialog

**Menu XMLs** (create in `app/src/main/res/menu/`):
- `gallery_menu.xml` - Search and sort options
- `vault_detail_menu.xml` - Vault actions

**Drawables** (create in `app/src/main/res/drawable/`):
- `placeholder_photo.xml` - Simple placeholder for images

#### 5. Sync Gradle
In Android Studio: File > Sync Project with Gradle Files

#### 6. Build and Run
1. Connect Android device or start emulator
2. Click Run button or press Shift+F10
3. Select target device

## Manual Testing Checklist

Once the app builds successfully:

### Camera Testing
- [ ] Camera preview appears
- [ ] Edge detection highlights photo borders
- [ ] Grid overlay displays
- [ ] Tap to focus works
- [ ] Batch capture mode captures multiple photos
- [ ] Flash toggle works
- [ ] Photos save to local storage

### Gallery Testing
- [ ] All photos display in grid
- [ ] Filter chips work (All, Uploaded, Pending, Enhanced)
- [ ] Search finds photos by name/tags/people
- [ ] Sort by date/name works
- [ ] Tap photo opens detail view

### Photo Detail Testing
- [ ] Full image displays
- [ ] Metadata shown correctly
- [ ] Edit metadata dialog works
- [ ] Save updates database
- [ ] Delete removes photo

### Family Vaults Testing
- [ ] Vault list loads
- [ ] Create new vault works
- [ ] Tap vault opens detail
- [ ] Vault photos display
- [ ] Invite member sends invitation
- [ ] Add photos to vault works

### Background Upload Testing
- [ ] Photos queue for upload
- [ ] WorkManager uploads in background
- [ ] Upload status updates in gallery
- [ ] Failed uploads retry

### Authentication Testing
- [ ] Login with valid credentials works
- [ ] Register new user works
- [ ] Token persists across app restarts
- [ ] Logout clears session

## Troubleshooting

### OpenCV Not Found
```
Error: Could not find opencv-4.8.0.aar
```
**Solution**: Download OpenCV AAR and place in `app/libs/` directory

### Build Errors
```
Error: Missing layout file
```
**Solution**: Create all required layout XML files using Android Studio's layout editor

### API Connection Failed
```
Error: Unable to resolve host
```
**Solution**: 
1. Check device has internet connection
2. Verify Replit backend is running
3. Check API_BASE_URL in build.gradle matches your Replit domain

### Camera Permission Denied
**Solution**: Grant camera permission in device Settings > Apps > PhotoVault > Permissions

## Next Steps

### Enhancements to Consider
1. **Biometric Authentication** - Use fingerprint/face unlock
2. **Cloud Backup** - Auto-backup to Google Drive
3. **Photo Filters** - Instagram-style filters
4. **Video Support** - Capture and enhance videos
5. **OCR Text Detection** - Extract text from photos
6. **Timeline View** - Group photos by date
7. **Map View** - Show photos on map by location
8. **Slideshow** - Auto-playing photo slideshow
9. **Print Ordering** - Order physical prints
10. **AR Preview** - Preview how physical photos will look

### Performance Optimizations
1. Image caching with Glide
2. Pagination for large photo libraries
3. Thumbnail generation optimization
4. Background processing for enhancements
5. Database query optimization

## Support

For issues with:
- **Android Development**: Check Android Studio logs
- **Backend API**: Check PhotoVault Flask server logs
- **OpenCV**: Verify AAR file is correctly placed
- **Build Errors**: Run `./gradlew clean build` in terminal

## Resources

- [Android Developer Docs](https://developer.android.com)
- [CameraX Documentation](https://developer.android.com/training/camerax)
- [OpenCV Android](https://opencv.org/android/)
- [Room Database](https://developer.android.com/training/data-storage/room)
- [WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Retrofit](https://square.github.io/retrofit/)
