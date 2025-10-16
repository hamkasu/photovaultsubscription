# iOS Sharpen CSRF Fix - Railway Deployment Guide

## 🐛 Problem
The iOS app's sharpen feature was failing on Railway production with:
- **Error**: "The CSRF token is missing"
- **Status Code**: 400 Bad Request
- **Logs**: `INFO:flask_wtf.csrf:The CSRF token is missing.`

## 🔍 Root Cause
The sharpen endpoint `/api/photos/<int:photo_id>/sharpen` in `photovault/routes/photo.py` was missing the `@csrf.exempt` decorator. This caused it to reject mobile API requests that use JWT authentication instead of CSRF tokens.

## ✅ Solution
Added `@csrf.exempt` decorator to the sharpen endpoint to allow both web and mobile API requests:

```python
@photo_bp.route('/api/photos/<int:photo_id>/sharpen', methods=['POST'])
@csrf.exempt  # ← Added this line
@login_required
def sharpen_photo_api(photo_id):
    ...
```

**File Changed**: `photovault/routes/photo.py` (line 1567)

## 📦 Deploy to Railway

### Step 1: Push Changes to GitHub
```bash
# Stage the fix
git add photovault/routes/photo.py

# Commit with descriptive message
git commit -m "Fix: Add @csrf.exempt to sharpen endpoint for iOS app compatibility"

# Push to main branch (Railway auto-deploys from main)
git push origin main
```

### Step 2: Verify Railway Deployment
1. Go to your Railway dashboard: https://railway.app/
2. Select your PhotoVault project
3. Click on the **"Deployments"** tab
4. Wait for the new deployment to show "✓ Success" (usually 2-3 minutes)

### Step 3: Test iOS App
1. Open StoryKeep app on your iPhone
2. Navigate to a photo
3. Tap **"Enhance Photo"** → **"Sharpen"**
4. Adjust intensity slider
5. Tap **"Sharpen"**
6. ✅ Should see "Photo sharpened successfully!" instead of error

## 🔧 What This Fix Does
- **Before**: Sharpen endpoint rejected mobile requests due to missing CSRF token
- **After**: Endpoint accepts both:
  - Web requests (with CSRF token from browser forms)
  - Mobile API requests (with JWT Bearer token in Authorization header)

## 📊 Expected Behavior After Fix
- iOS sharpen requests will succeed with 200 OK status
- Railway logs will show successful sharpen operations instead of CSRF errors
- Users can sharpen photos from the iOS app without errors

## 🚨 Important Notes
- This fix only affects the **production Railway environment**
- Local Replit environment already has this fix applied
- The mobile API endpoint in `mobile_api.py` already had `@csrf.exempt` but wasn't being used
- Both endpoints now support mobile requests properly

## 📝 Related Files
- **Fixed File**: `photovault/routes/photo.py`
- **Related Endpoint**: `photovault/routes/mobile_api.py` (already had @csrf.exempt)
- **iOS App Code**: `StoryKeep-iOS/src/services/api.js` (sharpen API call)
