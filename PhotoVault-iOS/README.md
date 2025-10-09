# StoryKeep Digitizer - iOS App

A professional photo digitalization app built with React Native and Expo, designed to preserve family memories by digitizing physical photographs.

## Features

### Core "Digitizer" Features

#### 1. Smart Camera Capture
- **Auto-detection** of photo edges/borders in real-time viewfinder
- **Visual guides/overlay** to help frame the physical photo
- **Auto-capture** when photo is properly aligned
- **Batch capture mode** for multiple photos in one session
- **Flash control** for different lighting conditions (off/on/auto)

#### 2. Automatic Photo Extraction
- **Perspective correction** to fix camera angle distortion
- **Auto-crop** to isolate just the photo content
- **Edge detection** to separate photo from background
- **Server-side processing** using advanced AI algorithms

#### 3. Quick Enhancement Pipeline
- **One-tap auto-enhance** (brightness, contrast, sharpness)
- **Denoise** for old/damaged photos
- **Before/after preview** capability
- **High-quality processing** maintaining original details

#### 4. Upload & Sync
- **Direct upload** to backend server
- **Offline queue** - capture photos without internet, upload later
- **Progress tracking** for batch uploads
- **Retry mechanism** for failed uploads
- **Background processing** of upload queue

### Additional Features

- **User Authentication** - Secure login and registration
- **Dashboard** - View stats, photos, and upload queue
- **Photo Management** - Organized gallery and albums
- **Real-time Stats** - Track storage, photos, and albums

## Tech Stack

- **React Native** with Expo SDK
- **Expo Camera** for professional camera controls
- **Expo Image Manipulator** for client-side processing
- **AsyncStorage** for offline queue management
- **React Navigation** for seamless navigation
- **Axios** for API communication

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Scan QR code with Expo Go app (iOS) or Camera app to test

## Project Structure

```
PhotoVault-iOS/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   └── CameraScreen.js
│   ├── services/         # Business logic services
│   │   ├── ApiService.js
│   │   ├── PhotoProcessingService.js
│   │   └── UploadQueueService.js
│   ├── config/          # Configuration files
│   │   └── api.js
│   └── utils/           # Utility functions
├── App.js               # Main app entry
└── app.json            # Expo configuration
```

## Usage

### Digitizing Photos

1. **Login/Register** - Create an account or login
2. **Open Camera** - Tap "Digitalize Photos" from home screen
3. **Frame Photo** - Position physical photo within guide box
4. **Capture** - Camera will auto-detect and capture
5. **Batch Mode** - Enable to capture multiple photos
6. **Auto Upload** - Photos are queued and uploaded automatically

### Camera Controls

- **Flash Toggle** - Tap flash icon (off/on/auto)
- **Guide Overlay** - Tap grid icon to show/hide framing guides
- **Batch Mode** - Tap albums icon to enable batch capture
- **Scan Mode** - Tap scan icon for AI-powered photo detection

### Upload Queue

- **Offline Support** - Photos are queued when offline
- **Auto Upload** - Queue processes automatically when online
- **Manual Trigger** - Tap "Process Upload Queue" to manually sync
- **Retry Failed** - Retry failed uploads with one tap

## Backend Integration

The app connects to the StoryKeep backend at:
- Production: `https://web-production-535bd.up.railway.app`

### API Endpoints Used

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `POST /api/upload` - Upload photos
- `POST /api/detect-and-extract` - AI photo detection
- `GET /api/photos` - List user photos
- `GET /api/dashboard` - Get dashboard stats

## Camera Features

### Smart Detection
- Real-time edge detection overlay
- Visual guides for proper framing
- Auto-capture when aligned

### Batch Mode
- Capture multiple photos in succession
- Session counter
- Automatic queue management

### Flash Control
- Off - No flash
- On - Always flash
- Auto - Flash when needed

## Offline Capabilities

The app fully supports offline operation:

1. **Capture Photos** - Works without internet
2. **Queue Management** - Photos stored locally
3. **Auto Sync** - Uploads when connection restored
4. **Retry Logic** - Failed uploads retry automatically

## Performance

- **Optimized Image Processing** - Efficient client-side enhancement
- **Smart Upload Queue** - Background processing
- **Cache Management** - Automatic cleanup
- **Memory Efficient** - Handles large photo batches

## Future Enhancements

- [ ] Advanced edge detection with ML
- [ ] Real-time perspective correction preview
- [ ] Manual crop/rotate tools
- [ ] AI-powered colorization
- [ ] Family vault integration
- [ ] Cloud backup settings

## License

Part of the StoryKeep platform by Calmic Sdn Bhd
