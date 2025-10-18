# Railway OpenCV System Libraries Fix

## Problem
Railway deployment was failing with this error:
```
ImportError: libGL.so.1: cannot open shared object file: No such file or directory
```

This occurred when the app tried to import cv2 (OpenCV) in `photovault/utils/face_detection.py`.

## Root Cause
OpenCV requires system libraries (even the headless version) that aren't installed by default in Railway's build environment. The missing library `libGL.so.1` is part of the OpenGL/Mesa graphics libraries.

## Solution
Created a `Dockerfile` with all required system dependencies. Railway automatically detects and uses Dockerfile when present.

### System Packages Installed:
- **libgl1**: OpenGL library (provides libGL.so.1)
- **libglib2.0-0**: GLib library required by OpenCV
- **libsm6**: X11 Session Management library
- **libxext6**: X11 extensions library
- **libxrender1**: X11 Render extension library
- **libgomp1**: GNU OpenMP library (parallel processing)

## Deployment Instructions

### Step 1: Push to GitHub
```bash
git add Dockerfile .dockerignore RAILWAY_OPENCV_FIX.md
git commit -m "Fix Railway OpenCV dependencies using Dockerfile"
git push origin main
```

### Step 2: Railway Auto-Deploy
Railway will automatically detect the Dockerfile and:
1. Build a Docker image with all required system libraries
2. Install all Python dependencies (including opencv-python-headless)
3. Run the release script (python release.py) on startup
4. Start the application with gunicorn on the assigned PORT

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

## Why Dockerfile Instead of Nixpacks?

Initially attempted to use `nixpacks.toml` with Nix packages, but encountered:
- Case-sensitive package naming issues
- Some packages not available in Nix (e.g., exact libsm package name)
- More complex configuration

**Dockerfile approach is:**
- ✅ More reliable and straightforward
- ✅ Uses standard Debian packages (apt-get)
- ✅ Easier to debug and maintain
- ✅ Automatically detected by Railway

## Note
- This only needs to be deployed once
- After Railway rebuilds with the Dockerfile, all OpenCV features will work correctly
- The local Replit environment already has these libraries, so no changes needed for local development
- The `nixpacks.toml` file is no longer needed (Railway will use Dockerfile instead)
