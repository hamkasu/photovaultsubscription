# PhotoVault iOS App

A professional React Native/Expo mobile application for PhotoVault that connects to your web backend.

## Features

### ✅ Completed Features

1. **Authentication**
   - Login with username/password
   - Register new account
   - Secure token storage with Expo SecureStore
   - Auto-authentication on app start

2. **Camera & Photo Capture**
   - Native camera integration with Expo Camera
   - Front/back camera toggle
   - Flash control (on/off/auto)
   - Photo compression and optimization
   - Direct upload to backend

3. **Photo Gallery**
   - Grid view with 3 columns
   - Pull to refresh
   - Infinite scroll pagination
   - Photo detail view with metadata
   - Share functionality
   - Delete photos

4. **Photo Enhancement**
   - One-tap enhance (CLAHE, denoise, auto-levels)
   - Sharpen photos
   - Colorize black & white photos
   - Side-by-side comparison view
   - Real-time preview

5. **Family Vaults**
   - View all family vaults
   - Join vault with invite code
   - View vault members and photo count
   - Modal join interface

6. **Upload from Device**
   - Pick photos from gallery
   - Image cropping and editing
   - Upload with metadata

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **HTTP Client**: Axios
- **Secure Storage**: Expo SecureStore
- **Camera**: Expo Camera
- **Image Manipulation**: Expo Image Manipulator
- **Image Picker**: Expo Image Picker

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS testing)
- Expo Go app (for physical device testing)

### Installation

1. Install dependencies:
```bash
cd PhotoVault-iOS
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Project Structure

```
PhotoVault-iOS/
├── App.js                      # Main app entry
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js     # Navigation configuration
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── CameraScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── GalleryScreen.js
│   │   ├── PhotoViewScreen.js
│   │   ├── EnhancementScreen.js
│   │   └── VaultsScreen.js
│   └── services/
│       └── api.js              # API service & endpoints
├── package.json
└── app.json
```

## API Integration

The app connects to your PhotoVault backend at:
```
https://486dcd23-ba9e-407a-a5ea-a8bcc256543b-00-28roak2gjiezj.riker.replit.dev
```

### Available API Endpoints

- **Auth**: `/auth/login`, `/auth/register`
- **Photos**: `/upload`, `/gallery/photos`, `/api/photos/{id}/enhance`
- **Enhancement**: `/api/photos/{id}/sharpen`, `/api/colorization/colorize`
- **Vaults**: `/api/family/vaults`, `/api/family/vault/join`

## Key Features Detail

### Authentication Flow
- JWT tokens stored securely in Expo SecureStore
- Auto-login on app restart if token exists
- Token included in all API requests via Axios interceptors

### Camera Capture
- Captures high-quality photos
- Compresses to 2048px max width
- Uploads with source metadata (camera/gallery)
- Shows success/error alerts

### Photo Enhancement
- Enhance: CLAHE + denoise + auto-levels + brightness/contrast
- Sharpen: Unsharp mask with configurable parameters
- Colorize: DNN-based colorization for B&W photos
- Compare: Side-by-side original vs enhanced view

### Family Vaults
- List all accessible vaults
- Join with invite code
- View vault stats (photos, members)
- Navigate to vault details (to be implemented)

## Testing

To test the complete flow:

1. **Register/Login**
   - Open app → Login screen
   - Register new account or login
   - Should navigate to Dashboard

2. **Capture Photo**
   - Tap Camera → Grant permissions
   - Take photo → Auto uploads
   - View in Gallery

3. **Enhance Photo**
   - Open photo from Gallery
   - Tap Edit → Opens Enhancement screen
   - Try Enhance/Sharpen/Colorize
   - Compare original vs enhanced

4. **Join Vault**
   - Dashboard → Family Vaults
   - Tap Join icon
   - Enter invite code
   - Should show in vault list

## Next Steps

### To Be Implemented
- [ ] Vault detail view with vault photos
- [ ] Upload photos to specific vault
- [ ] Create new vault
- [ ] Offline photo queue with sync
- [ ] Push notifications
- [ ] In-app purchases for storage plans

## Troubleshooting

### Camera not working
- Check camera permissions in device settings
- Restart the app

### Photos not uploading
- Check internet connection
- Verify backend server is running
- Check auth token in SecureStore

### Navigation issues
- Clear app data and restart
- Re-install the app

## Support

For issues or questions, contact support@calmic.com.my
