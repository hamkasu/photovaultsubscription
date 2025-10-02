# PhotoVault Android Client - Complete Setup Guide

## 📱 Overview

PhotoVault Android is a professional photo digitization and management app that connects to the PhotoVault backend. It features advanced camera capabilities, AI-powered enhancement, and family vault sharing.

### ✨ Key Features

- **📸 Advanced Camera**: Edge detection, batch capture, manual controls, grid overlay
- **🎨 AI Enhancement**: Perspective correction, color restoration, denoising, sharpening
- **💾 Offline-First**: Capture and store locally, sync when online
- **👨‍👩‍👧‍👦 Family Vaults**: Share photos with family members
- **🔍 Smart Organization**: Search, filter, tag photos with metadata
- **⬆️ Background Upload**: Automatic sync via WorkManager

### 📊 Technical Stack

- **Language**: Kotlin
- **Architecture**: MVVM + Repository Pattern
- **Camera**: CameraX
- **Image Processing**: OpenCV 4.12.0
- **Database**: Room (SQLite)
- **Network**: Retrofit + OkHttp
- **Image Loading**: Glide
- **Background Tasks**: WorkManager
- **Min SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

1. **Android Studio** - Hedgehog (2023.1.1) or later
   - Download: https://developer.android.com/studio
   
2. **JDK 17** - Required for Gradle
   - Usually bundled with Android Studio
   
3. **Android SDK 34** - Install via Android Studio SDK Manager
   - Tools → SDK Manager → SDK Platforms → Android 14.0 (API 34)
   
4. **Internet Connection** - For downloading dependencies

### Step 1: Clone and Open Project

```bash
# Navigate to the Android project directory
cd photovault-android

# Open in Android Studio
# File → Open → Select 'photovault-android' folder
```

### Step 2: Configure Backend URL

Update the backend URL in `app/build.gradle`:

```gradle
android {
    buildTypes {
        release {
            buildConfigField "String", "API_BASE_URL", 
                "\"https://YOUR-REPLIT-DOMAIN.replit.dev\""
        }
        debug {
            buildConfigField "String", "API_BASE_URL", 
                "\"https://YOUR-REPLIT-DOMAIN.replit.dev\""
        }
    }
}
```

Replace `YOUR-REPLIT-DOMAIN` with your actual PhotoVault backend domain.

### Step 3: Sync Project

```
File → Sync Project with Gradle Files
```

Android Studio will automatically:
- Download all dependencies (including OpenCV 4.12.0)
- Configure build tools
- Index project files

**Note**: OpenCV 4.12.0 is fetched automatically from Maven Central - no manual AAR download needed!

### Step 4: Build Project

```
Build → Make Project
```

Or use keyboard shortcut: **Ctrl+F9** (Windows/Linux) or **Cmd+F9** (Mac)

### Step 5: Run on Device

1. **Connect Android Device** (USB Debugging enabled) or **Start Emulator**
2. Click **Run** button (green play icon) or press **Shift+F10**
3. Select target device
4. App will install and launch automatically

---

## 🏗️ Project Architecture

### Directory Structure

```
photovault-android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/calmic/photovault/
│   │   │   │   ├── camera/          # Edge detection & enhancement
│   │   │   │   ├── data/            # Room database, DAOs, entities
│   │   │   │   ├── network/         # Retrofit API service
│   │   │   │   ├── ui/              # Activities & UI components
│   │   │   │   │   ├── auth/        # Login, Register
│   │   │   │   │   ├── camera/      # Camera Activity
│   │   │   │   │   ├── gallery/     # Gallery, Photo Detail
│   │   │   │   │   ├── photo/       # Photo detail & editing
│   │   │   │   │   └── vault/       # Family Vaults
│   │   │   │   ├── util/            # Upload worker, helpers
│   │   │   │   └── PhotoVaultApplication.kt
│   │   │   ├── res/
│   │   │   │   ├── layout/          # XML layouts
│   │   │   │   ├── drawable/        # Icons, images
│   │   │   │   ├── menu/            # Menu resources
│   │   │   │   └── values/          # Strings, colors, themes
│   │   │   └── AndroidManifest.xml
│   ├── build.gradle                 # App-level build config
│   └── proguard-rules.pro          # ProGuard configuration
├── build.gradle                     # Project-level build config
├── settings.gradle                  # Gradle settings
└── gradle.properties               # Gradle properties
```

### Core Components

#### 1. Application Class
**`PhotoVaultApplication.kt`** - Initializes:
- OpenCV library
- Room database
- Retrofit API client
- Photo repository
- User repository

#### 2. Data Layer

**Database Entities:**
- `Photo` - Local photo storage with metadata
- `UploadQueue` - Upload queue management
- `FamilyVault` - Family vault information

**DAOs (Data Access Objects):**
- `PhotoDao` - Photo CRUD operations
- `UploadQueueDao` - Queue management
- `FamilyVaultDao` - Vault operations

**Repositories:**
- `PhotoRepository` - Photo business logic
- `UserRepository` - Authentication & user management

#### 3. Network Layer

**`ApiService.kt`** - Retrofit interface defining endpoints:
```kotlin
@POST("/auth/login")
suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

@Multipart
@POST("/upload")
suspend fun uploadPhoto(@Part photo: MultipartBody.Part): Response<UploadResponse>

@GET("/family/vaults")
suspend fun getFamilyVaults(): Response<VaultsResponse>
```

#### 4. UI Layer (MVVM Pattern)

**Activities:**
- `MainActivity` - Home screen, navigation hub
- `LoginActivity` / `RegisterActivity` - Authentication
- `CameraActivity` - Photo capture & enhancement
- `GalleryActivity` - Photo grid with filters
- `PhotoDetailActivity` - Full photo view & editing
- `VaultListActivity` - Family vaults list
- `VaultDetailActivity` - Vault photos & members

**Adapters:**
- `GalleryAdapter` - RecyclerView adapter for photo grid
- `VaultAdapter` - RecyclerView adapter for vault list

#### 5. Image Processing

**`EdgeDetector.kt`** - OpenCV-based edge detection:
- Detects photo borders in camera preview
- Uses Canny edge detection + contour finding
- Identifies rectangular shapes (photos)

**`ImageEnhancer.kt`** - Auto-enhancement pipeline:
- Perspective correction (dewarp)
- CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Color restoration
- Denoising (fastNlMeansDenoisingColored)
- Unsharp masking (sharpening)

#### 6. Background Processing

**`UploadWorker.kt`** - WorkManager implementation:
- Uploads queued photos to backend
- Retries on failure with exponential backoff
- Runs only when network available
- Updates photo upload status

---

## 🔧 Configuration

### API Endpoints

All endpoints defined in `ApiService.kt`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/upload` | POST | Upload photo with metadata |
| `/gallery/photos` | GET | Get user's photos |
| `/photo/{id}` | GET | Get photo details |
| `/family/vaults` | GET | Get family vaults |
| `/family/vault/{id}` | POST | Create vault |
| `/family/vault/{id}/photos` | GET | Get vault photos |
| `/family/vault/{id}/invite` | POST | Invite member |
| `/api/photo-detection/extract` | POST | Face detection |

### Permissions

Defined in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
    android:maxSdkVersion="32" />
```

### Database Schema

**Photo Table:**
```kotlin
@Entity(tableName = "photos")
data class Photo(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val fileName: String,
    val localUri: String,
    val fileSize: Long,
    val capturedAt: Long,
    val isUploaded: Boolean = false,
    val uploadedAt: Long? = null,
    val serverId: Int? = null,
    val isEnhanced: Boolean = false,
    val description: String? = null,
    val tags: String? = null,
    val people: String? = null,
    val location: String? = null,
    val vaultId: Int? = null
)
```

---

## 🎯 Features Deep Dive

### Camera Module

**Advanced Features:**
- **Edge Detection**: Real-time photo border detection using OpenCV
- **Grid Overlay**: 3x3 grid for composition
- **Manual Controls**: Tap-to-focus, exposure adjustment
- **Batch Mode**: Capture multiple photos rapidly
- **Flash Control**: Off, On, Torch modes
- **Auto-Enhancement**: Apply enhancement pipeline after capture

**How It Works:**
1. User opens camera
2. CameraX provides preview stream
3. EdgeDetector analyzes frames for photo borders
4. User taps capture
5. High-resolution photo saved locally
6. ImageEnhancer processes image (optional)
7. Photo saved to Room database
8. Queued for upload

### Gallery Module

**Features:**
- Photo grid (3 columns)
- Filter chips: All, Uploaded, Pending, Enhanced
- Search by filename, tags, people, description
- Sort by date or name
- Upload status indicators

**Implementation:**
```kotlin
// Filter photos
private fun applyFilter() {
    filteredPhotos = when (currentFilter) {
        FilterType.ALL -> allPhotos
        FilterType.UPLOADED -> allPhotos.filter { it.isUploaded }
        FilterType.PENDING -> allPhotos.filter { !it.isUploaded }
        FilterType.ENHANCED -> allPhotos.filter { it.isEnhanced }
    }
    adapter.submitList(filteredPhotos)
    updatePhotoCount()
}
```

### Family Vaults

**Capabilities:**
- Create vaults with name and description
- Invite members via email
- View vault photos
- Add photos to vaults
- Download for offline viewing

**Workflow:**
1. User creates vault
2. Backend generates unique vault ID
3. User invites family members
4. Members receive email invitation
5. Members can view/add photos to vault

### Background Upload

**WorkManager Implementation:**
```kotlin
val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
    )
    .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        WorkRequest.MIN_BACKOFF_MILLIS,
        TimeUnit.MILLISECONDS
    )
    .build()

WorkManager.getInstance(context).enqueue(uploadRequest)
```

**Features:**
- Runs only when network available
- Exponential backoff on failure
- Automatic retry
- Updates UI on completion

---

## ✅ Testing Checklist

### Pre-Flight Checks
- [ ] Backend is running and accessible
- [ ] Device has internet connection
- [ ] Camera permission granted
- [ ] Storage permission granted (if needed)

### Authentication Flow
- [ ] Register new user successfully
- [ ] Login with valid credentials
- [ ] Token persists after app restart
- [ ] Logout clears session
- [ ] Invalid credentials show error

### Camera & Capture
- [ ] Camera preview loads
- [ ] Edge detection highlights photo borders
- [ ] Grid overlay toggles on/off
- [ ] Tap-to-focus works
- [ ] Flash modes work (Off, On, Torch)
- [ ] Batch mode captures multiple photos
- [ ] Photos save to local storage
- [ ] Enhanced photos look better than originals

### Gallery & Organization
- [ ] All photos display in grid
- [ ] Filter chips work (All, Uploaded, Pending, Enhanced)
- [ ] Search finds photos by keywords
- [ ] Sort by date/name works
- [ ] Photo count updates correctly
- [ ] Tap photo opens detail view

### Photo Details & Editing
- [ ] Full image displays
- [ ] Metadata shown correctly
- [ ] Edit metadata dialog works
- [ ] Tags, people, location save
- [ ] Share photo works
- [ ] Delete removes photo from database

### Family Vaults
- [ ] Vault list loads from server
- [ ] Create new vault succeeds
- [ ] Tap vault opens detail view
- [ ] Vault photos display
- [ ] Invite member sends email
- [ ] Add photos to vault works
- [ ] Download for offline viewing

### Background Upload
- [ ] Photos queue for upload
- [ ] Upload happens in background
- [ ] Upload status updates in gallery
- [ ] Failed uploads retry automatically
- [ ] Upload works when app is closed

---

## 🐛 Troubleshooting

### Build Errors

#### Problem: "Could not resolve org.opencv:opencv:4.12.0"
**Solution:**
1. Check internet connection
2. Verify Maven Central is accessible
3. Sync project: `File → Sync Project with Gradle Files`
4. Clean build: `Build → Clean Project` then rebuild

#### Problem: "SDK location not found"
**Solution:**
Create `local.properties` in project root:
```properties
sdk.dir=/path/to/Android/Sdk
```

#### Problem: "Execution failed for task ':app:mergeDebugResources'"
**Solution:**
1. Check for duplicate resources in `res/` folders
2. Clean build: `Build → Clean Project`
3. Invalidate caches: `File → Invalidate Caches → Invalidate and Restart`

### Runtime Errors

#### Problem: "OpenCV initialization failed"
**Cause:** OpenCV library not loaded properly

**Solution:**
1. Check Gradle synced successfully
2. Verify `org.opencv:opencv:4.12.0` in dependencies
3. Clean and rebuild project
4. Uninstall app and reinstall

#### Problem: "Unable to resolve host" / "Network error"
**Cause:** Cannot connect to backend

**Solution:**
1. Verify backend is running: Open backend URL in browser
2. Check `API_BASE_URL` in `build.gradle` matches Replit domain
3. Ensure device has internet (not just WiFi connected)
4. Check firewall/network restrictions
5. Try from different network

#### Problem: "Permission denied" for camera
**Cause:** Camera permission not granted

**Solution:**
1. Grant permission when prompted
2. Or manually: `Settings → Apps → PhotoVault → Permissions → Camera → Allow`
3. Restart app after granting

#### Problem: "SQLiteException: no such table"
**Cause:** Database schema mismatch

**Solution:**
1. Uninstall app completely
2. Clean project: `Build → Clean Project`
3. Rebuild and install fresh

### Performance Issues

#### Problem: "App is slow/laggy"
**Solutions:**
- Enable R8/ProGuard minification in release build
- Use release build for testing performance
- Check device has sufficient storage
- Reduce image quality in camera settings
- Enable image caching in Glide

#### Problem: "Camera preview is choppy"
**Solutions:**
- Disable edge detection temporarily
- Reduce preview resolution
- Close background apps
- Test on physical device (not emulator)

---

## 🚢 Building for Release

### 1. Configure Signing

Create `keystore.properties` in project root:
```properties
storePassword=yourStorePassword
keyPassword=yourKeyPassword
keyAlias=yourKeyAlias
storeFile=path/to/keystore.jks
```

Update `app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 
                'proguard-rules.pro'
        }
    }
}
```

### 2. Build Release APK

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

### 3. Build App Bundle (for Play Store)

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

---

## 📈 Performance Optimization

### Best Practices Implemented

1. **Image Loading** - Glide with caching
2. **Database Queries** - LiveData with Room
3. **Background Work** - WorkManager with constraints
4. **Memory Management** - Bitmap recycling, weak references
5. **Network Calls** - Coroutines with proper error handling
6. **UI Responsiveness** - RecyclerView with ViewBinding

### Recommended Improvements

- Implement pagination for large photo galleries
- Add database indices for faster queries
- Use DiffUtil for RecyclerView updates
- Implement WorkManager periodic sync
- Add Crashlytics for crash reporting
- Implement analytics (Firebase/MixPanel)

---

## 🔐 Security Considerations

### Implemented

- JWT token authentication
- HTTPS for all network calls
- Secure local storage (Room database)
- ProGuard obfuscation in release builds
- Input validation on forms

### Recommended Additions

- Certificate pinning for API calls
- Encrypted SharedPreferences for tokens
- Biometric authentication
- SQL injection prevention (parameterized queries)
- Runtime permissions best practices

---

## 📚 Resources

### Official Documentation
- [Android Developer Docs](https://developer.android.com)
- [CameraX Guide](https://developer.android.com/training/camerax)
- [OpenCV Android](https://opencv.org/android/)
- [Room Database](https://developer.android.com/training/data-storage/room)
- [WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Retrofit](https://square.github.io/retrofit/)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

### Libraries Used
- **CameraX** v1.3.1 - Camera functionality
- **OpenCV** v4.12.0 - Image processing
- **Room** v2.6.1 - Local database
- **Retrofit** v2.9.0 - REST API client
- **Glide** v4.16.0 - Image loading
- **WorkManager** v2.9.0 - Background tasks
- **Material Components** v1.11.0 - UI components

---

## 🆘 Getting Help

### Common Issues
- Check this guide's **Troubleshooting** section first
- Review Android Studio **Logcat** for error messages
- Check **Backend logs** on Replit for API errors

### Support Channels
- **Android Studio**: Built-in Logcat and debugger
- **Backend API**: Check PhotoVault Flask server logs on Replit
- **OpenCV**: Verify library version matches (4.12.0)
- **Build Issues**: Run `./gradlew clean build --stacktrace`

---

## 🎉 Success!

Once setup is complete, you should have:
- ✅ Fully functional Android app
- ✅ Connected to PhotoVault backend
- ✅ Camera with edge detection
- ✅ Auto-enhancement pipeline
- ✅ Gallery with search/filter
- ✅ Family vault sharing
- ✅ Background upload system

**Next Steps:**
1. Test all features using the checklist above
2. Customize branding (colors, logo, app name)
3. Add your own enhancements
4. Build release version for distribution
5. Publish to Google Play Store (optional)

---

## 📝 Version History

- **v1.0.0** (Current)
  - Initial release
  - OpenCV 4.12.0 integration
  - Complete feature set
  - Offline-first architecture
  - Family vault support

---

**Happy coding! 📱✨**
