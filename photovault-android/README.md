# PhotoVault Android App

Native Android application for PhotoVault - A professional legacy photo digitizer with advanced camera features and AI-powered enhancement.

## Features

### 📸 Advanced Camera Mode
- **High-resolution capture** optimized for photographing physical photos
- **Auto-detection** of photo edges/borders in viewfinder using OpenCV
- **Grid overlay** and alignment guides for perfect framing
- **Manual focus** and exposure controls via tap-to-focus
- **Batch capture mode** for rapid succession photography
- Flash control with torch mode

### 🎨 Auto-Enhancement Pipeline
- **Perspective correction** (de-skewing) using detected corners
- **Auto-cropping** of detected photos
- **Brightness/contrast adjustment** with CLAHE algorithm
- **Color restoration** for faded legacy photos
- **Denoise** using fastNlMeansDenoisingColored
- **Scratch/dust removal** through advanced filtering
- **Sharpening** for crisp results

### 💾 Offline-First Design
- Capture and store photos locally in Room database
- Upload queue with automatic retry mechanism
- WorkManager for background uploads when internet available
- Local gallery for review before upload
- Seamless sync with PhotoVault backend

### 📤 Upload & Organization
- Batch upload to PhotoVault server
- Add metadata (date, location, people, tags)
- Organize into family vaults
- Progress tracking and error handling
- Automatic resume on network reconnection

### 👨‍👩‍👧‍👦 Family Vault Access
- View shared family photos
- Download for offline viewing
- Invite family members via email
- Multi-vault support

### 🔐 Essential Features
- User authentication with JWT tokens
- Photo gallery with timeline view
- Search and filtering by tags/people
- Face detection integration using backend API
- Secure local storage with encryption

## Tech Stack

- **Language**: Kotlin
- **Minimum SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)
- **Architecture**: MVVM with Repository pattern

### Libraries
- **CameraX**: Modern camera API with advanced controls
- **OpenCV**: Edge detection and image processing
- **Room**: Local database for offline storage
- **WorkManager**: Background upload queue
- **Retrofit**: REST API client
- **Glide**: Image loading and caching
- **Material Design 3**: Modern UI components

## Building

### Prerequisites
- Android Studio Hedgehog or later
- JDK 17
- Android SDK 34
- OpenCV Android SDK

### Setup
1. Clone the repository
2. Open in Android Studio
3. Update `local.properties` with your Android SDK path
4. Update API base URL in `build.gradle`:
   - Debug: Points to `http://10.0.2.2:5000` (localhost from emulator)
   - Release: Points to your production server

### Build Commands
```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Install on device
./gradlew installDebug
```

## Configuration

### API Endpoint
Update the API base URL in `app/build.gradle`:
```gradle
buildTypes {
    debug {
        buildConfigField "String", "API_BASE_URL", "\"http://your-server:5000\""
    }
    release {
        buildConfigField "String", "API_BASE_URL", "\"https://photovault.calmic.com\""
    }
}
```

### OpenCV Setup
The app uses OpenCV 4.8.0 for image processing. **Critical setup required:**

1. **Download OpenCV Android SDK**:
   - Download from https://opencv.org/releases/ (version 4.8.0)
   - Extract the SDK

2. **Add to project**:
   - Copy `opencv/build/outputs/aar/opencv-4.8.0.aar` to `app/libs/`
   - Create the `libs` directory if it doesn't exist

3. **Alternative - Use Maven** (uncomment in build.gradle):
   ```gradle
   implementation 'com.quickbirdstudios:opencv:4.5.3.0'
   ```

**Important**: The app will run without OpenCV but edge detection and auto-enhancement will be disabled.

## Project Structure

```
app/src/main/java/com/calmic/photovault/
├── camera/                 # Camera and image processing
│   ├── EdgeDetector.kt    # Photo edge detection
│   └── ImageEnhancer.kt   # Image enhancement pipeline
├── data/
│   ├── dao/               # Room DAOs
│   ├── model/             # Data models
│   └── repository/        # Data repositories
├── network/               # API service and models
├── ui/
│   ├── auth/             # Authentication screens
│   ├── camera/           # Camera activity and overlay
│   └── MainActivity.kt   # Main entry point
├── util/                 # Utilities
└── worker/               # Background workers
```

## Permissions

The app requires the following permissions:
- `CAMERA` - For camera access
- `READ_EXTERNAL_STORAGE` - For accessing photos (Android 12 and below)
- `READ_MEDIA_IMAGES` - For accessing photos (Android 13+)
- `INTERNET` - For API communication
- `ACCESS_NETWORK_STATE` - For checking connectivity

## Usage

1. **Launch App**: Login or register an account
2. **Capture Photos**: Tap the camera button
3. **Position Photo**: Align the physical photo in the viewfinder
4. **Auto-Detection**: Green overlay shows detected edges
5. **Capture**: Tap the capture button
6. **Enhancement**: Photo is automatically enhanced
7. **Batch Mode**: Enable for multiple rapid captures
8. **Upload**: Photos are queued for upload automatically

## API Integration

The app integrates with the PhotoVault Flask backend:
- Authentication endpoints: `/auth/login`, `/auth/register`
- Photo upload: `/upload`
- Gallery: `/gallery/photos`
- Family vaults: `/family/vaults`
- Face detection: `/api/photo-detection/extract`

## Offline Capabilities

- All captured photos are stored locally first
- Upload queue manages background sync
- Photos remain accessible even without internet
- Automatic retry on network errors
- Conflict resolution for concurrent edits

## Performance

- Image processing is done on background threads
- CameraX ensures smooth preview and capture
- WorkManager handles efficient background uploads
- Glide provides memory-efficient image loading
- Room database optimized with indices

## Security

- JWT token-based authentication
- Tokens stored securely in SharedPreferences
- HTTPS for all API communications
- Local photos encrypted at rest
- No sensitive data in logs

## Contributing

This is a native Android implementation of PhotoVault. For backend development, see the main PhotoVault repository.

## License

Copyright (c) 2025 Calmic Sdn Bhd. All rights reserved.
