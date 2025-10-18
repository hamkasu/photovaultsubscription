# Railway OpenCV System Libraries Fix

## Problem
Railway deployment was failing with this error:
```
ImportError: libGL.so.1: cannot open shared object file: No such file or directory
```

This occurred when the app tried to import cv2 (OpenCV) in `photovault/utils/face_detection.py`.

## Root Cause
OpenCV requires system libraries (even the headless version) that aren't installed by default in Railway's Docker environment. The missing library `libGL.so.1` is part of the OpenGL/Mesa graphics libraries.

## Solution
Updated `nixpacks.toml` to install required Nix packages during the build phase:

```toml
[phases.setup]
nixPkgs = ["libGL", "glib", "libsm", "libxext", "libxrender", "gcc"]
```

### System Packages Installed:
- **libGL**: Provides libGL.so.1 (OpenGL library) required by OpenCV
- **glib**: GLib library required by OpenCV
- **libsm**: X11 Session Management library
- **libxext**: X11 extensions library
- **libxrender**: X11 Render extension library
- **gcc**: GNU Compiler Collection (includes libgomp for parallel processing)

## Deployment Instructions

### Step 1: Push to GitHub
```bash
git add nixpacks.toml
git commit -m "Fix Railway OpenCV system dependencies"
git push origin main
```

### Step 2: Railway Auto-Deploy
Railway will automatically detect the changes and:
1. Rebuild the container with the new system packages
2. Install all Python dependencies (including opencv-python-headless)
3. Run the release script (python release.py)
4. Start the application with gunicorn

### Step 3: Verify Deployment
Once Railway finishes deploying:
1. Check the deployment logs for any errors
2. Visit your Railway URL
3. Test features that use OpenCV:
   - Photo upload with face detection
   - Image enhancement
   - Photo digitization

## What This Fixes
✅ Face detection during photo upload  
✅ Image enhancement features  
✅ Photo digitization/extraction  
✅ Any other OpenCV-dependent features  

## Note
This only needs to be deployed once. After Railway rebuilds with these system libraries, all OpenCV features will work correctly in production.

The local Replit environment already has these libraries, so no changes are needed for local development.
