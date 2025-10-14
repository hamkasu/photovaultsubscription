# Profile Picture Cache Fix - Railway Deployment Guide

## Problem
Profile pictures were not updating on the Dashboard after being changed. The image showed correctly on the Profile screen but the Dashboard showed the old cached image.

## Root Cause
React Native's Image component caches images by their URL. When you upload a new profile picture with the same filename (e.g., `avatar.jpg`), the URL stays the same, so React Native shows the cached old image instead of the new one.

## Solution
Added cache-busting mechanism using a timestamp query parameter that updates when profile data is refreshed.

## Files Changed
- `StoryKeep-iOS/src/screens/DashboardScreen.js`:
  - Added `profileCacheKey` state variable
  - Updates cache key when profile data refreshes (useFocusEffect)
  - Appends cache key to image URL: `?t=${profileCacheKey}`

## How It Works
1. When user uploads new profile picture and returns to Dashboard
2. `useFocusEffect` detects screen focus and calls `authAPI.getProfile()`
3. Profile data is updated with new `setUserData(profileData)`
4. Cache key is updated with `setProfileCacheKey(Date.now())`
5. New URL with updated timestamp forces image reload: `/uploads/1/avatar.jpg?t=1697234567890`

## Deployment Steps for Railway

### Option 1: Using Railway Dashboard
1. Open your Railway project dashboard
2. Go to your web service
3. Click on "Variables" tab
4. Click "Redeploy" to trigger a new deployment with latest code from GitHub

### Option 2: Using Git Push
1. Make sure all changes are committed:
   ```bash
   git add StoryKeep-iOS/src/screens/DashboardScreen.js
   git commit -m "Fix profile picture cache issue on Dashboard"
   git push origin main
   ```

2. Railway will automatically detect the push and redeploy

### Option 3: Manual Trigger
1. In Railway dashboard, click your service
2. Click "Deployments" tab
3. Click "Deploy" > "Deploy latest commit"

## Testing After Deployment
1. Open StoryKeep app on your iOS device
2. Go to Profile screen
3. Upload a new profile picture
4. Navigate back to Dashboard
5. Profile picture should now show the updated image immediately

## Important Notes
- This fix only affects the iOS app (StoryKeep-iOS)
- No backend/Python code changes required
- No database migration needed
- The fix works by adding a query parameter that doesn't affect the server
- Works on both Replit (development) and Railway (production)

## Verification
After deployment, check that:
- ✅ Profile picture updates immediately on Dashboard after changing it
- ✅ No duplicate requests (cache key only updates when profile data changes)
- ✅ Image loads with authentication headers (shows private images correctly)
