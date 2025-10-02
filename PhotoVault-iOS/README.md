# PhotoVault iOS - Camera Module

## Overview
Complete camera implementation for PhotoVault iOS with real-time edge detection and image enhancement.

## Features Implemented

### 📸 Camera Capture
- **Live Preview**: AVFoundation-based camera with full-screen preview
- **High-Quality Capture**: Photo output with maximum quality prioritization
- **Real-time Frame Processing**: CVPixelBuffer stream for edge detection

### 🔍 Edge Detection
- **Vision Framework**: Automatic rectangle detection for photo edges
- **Live Overlay**: Green corners and lines showing detected photo boundaries
- **Confidence Threshold**: 60% minimum confidence for reliable detection
- **Toggle Control**: Enable/disable edge detection on demand

### 🎨 Image Enhancement
- **Perspective Correction**: Automatic de-skewing using detected corners
- **Auto Enhancement**: Color, brightness, contrast, and exposure adjustment
- **Denoise**: Noise reduction for clearer images
- **Sharpen**: Luminance sharpening for crisp results
- **Color Restoration**: Vibrance and highlight/shadow adjustments for faded photos

### 💾 Local Storage
- **Core Data**: Photo metadata persistence
- **File System**: JPEG images stored in Documents directory
- **Offline-First**: All photos saved locally first
- **Upload Queue**: Ready for background sync implementation

## Architecture

### MVVM Pattern
```
CameraView (View)
    ↓
CameraViewModel (ViewModel)
    ↓
CameraManager, EdgeDetector, ImageEnhancer (Services)
    ↓
CoreDataStack (Data Layer)
```

### Key Components

#### Services
- **CameraManager**: AVFoundation session management
- **EdgeDetector**: Vision framework rectangle detection
- **ImageEnhancer**: Core Image filter pipeline

#### Views
- **CameraView**: Main camera interface with controls
- **EdgeOverlayView**: Visual feedback for detected edges
- **PhotoPreviewView**: Enhanced photo preview with save/retake
- **SettingsView**: Camera and app configuration

#### Data Layer
- **CoreDataStack**: Persistent storage management
- **Photo Model**: Swift struct for photo data
- **PhotoEntity**: Core Data managed object

## How to Use

### 1. Open in Xcode
```bash
cd PhotoVault-iOS
open PhotoVault.xcodeproj
```

### 2. Required Permissions
Already configured in Info.plist:
- Camera Usage (`NSCameraUsageDescription`)
- Photo Library (`NSPhotoLibraryUsageDescription`)

### 3. Run on Device
Camera functionality requires a physical iOS device (not simulator).

### 4. Capture Flow
1. Point camera at physical photo
2. Green edges appear when photo detected
3. Tap capture button
4. Review enhanced photo
5. Save or retake

## Project Structure

```
PhotoVault-iOS/
├── App/
│   └── PhotoVaultApp.swift              # App entry point
├── Core/
│   ├── Data/
│   │   ├── Local/
│   │   │   ├── CoreDataStack.swift      # Core Data setup
│   │   │   ├── Entities/
│   │   │   │   └── PhotoEntity.swift    # Photo entity
│   │   │   └── PhotoVault.xcdatamodeld  # Data model
│   │   └── Models/
│   │       └── Photo.swift              # Photo model
├── Features/
│   └── Camera/
│       ├── Services/
│       │   ├── CameraManager.swift      # AVFoundation manager
│       │   ├── EdgeDetector.swift       # Vision detection
│       │   └── ImageEnhancer.swift      # Core Image filters
│       ├── ViewModels/
│       │   └── CameraViewModel.swift    # Business logic
│       └── Views/
│           ├── CameraView.swift         # Main camera UI
│           ├── PhotoPreviewView.swift   # Preview UI
│           └── SettingsView.swift       # Settings UI
└── Info.plist                           # Permissions & config
```

## Technologies

### Apple Frameworks
- **SwiftUI**: Modern declarative UI
- **AVFoundation**: Camera capture and preview
- **Vision**: ML-powered edge detection
- **Core Image**: Image processing and filters
- **Core Data**: Local persistence
- **Combine**: Reactive programming

### Features
- **Swift Concurrency**: async/await for clean async code
- **@MainActor**: UI updates on main thread
- **Property Wrappers**: @Published, @StateObject, @AppStorage

## Next Steps

### Phase 2: Backend Integration
- [ ] API client with URLSession
- [ ] Authentication flow
- [ ] Upload queue service
- [ ] Background tasks for sync

### Phase 3: Gallery
- [ ] Photo grid view
- [ ] Search and filter
- [ ] Metadata editing
- [ ] Face detection integration

### Phase 4: Family Vaults
- [ ] Vault listing and creation
- [ ] Member management
- [ ] Shared photo viewing

### Phase 5: iOS Polish
- [ ] Widgets
- [ ] Shortcuts
- [ ] Face ID/Touch ID
- [ ] iPad optimization

## Testing

### Manual Testing Checklist
- [ ] Camera permissions prompt
- [ ] Live preview displays
- [ ] Edge detection works on physical photos
- [ ] Capture button works
- [ ] Enhancement pipeline executes
- [ ] Preview displays enhanced photo
- [ ] Save stores to Core Data
- [ ] Settings toggle edge detection

### Known Limitations
- Requires physical iOS device (camera)
- Edge detection works best with:
  - Good lighting
  - Clear photo boundaries
  - Rectangular photos
  - Contrasting background

## Performance

### Optimizations
- Async edge detection (doesn't block UI)
- Background context for Core Data
- Image caching in file system
- Video frame processing on dedicated queue

### Memory Management
- Weak references in closures
- Task cancellation on view disappear
- Proper Core Data context handling

## License
Copyright © 2025 Calmic Sdn Bhd. All rights reserved.
