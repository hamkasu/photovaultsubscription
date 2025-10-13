# Profile Picture Upload Fix for Railway

## Problem
Profile picture upload was failing on Railway with a 500 error when uploading from the iOS app.

## What Was Fixed
Added comprehensive error logging and debugging to the profile picture upload endpoint to identify and diagnose the issue on Railway.

### Changes Made:
1. **Enhanced Error Logging** - Added detailed traceback logging to capture the exact error
2. **Debug Flow Tracking** - Added emoji-based logging at each step of the upload process:
   - 📸 Upload started
   - ✅ File received
   - 📊 File size validation
   - 📝 Filename generation
   - 📁 Directory creation
   - 💾 File saving
   - 🖼️ Image resize
   - 🗑️ Old file deletion
   - 💾 Database update
   - 🎉 Success

3. **Better Error Details** - Error responses now include:
   - Full stack traces in server logs
   - Detailed error messages (in debug mode)
   - Step-by-step tracking to identify where the failure occurs

## Files Modified:
- `photovault/routes/mobile_api.py` - Added traceback import and enhanced logging

## How to Deploy to Railway

### Step 1: Commit Your Changes
```bash
git add photovault/routes/mobile_api.py
git commit -m "Fix: Add comprehensive logging to profile picture upload endpoint"
```

### Step 2: Push to GitHub
```bash
git push origin main
```

### Step 3: Railway Auto-Deploys
Railway will automatically:
1. Detect the new commit
2. Build the updated code
3. Deploy the changes

### Step 4: Test on iOS App
1. Open the StoryKeep iOS app on your device
2. Go to Profile screen
3. Tap the camera icon to upload a profile picture
4. Select an image from your library

### Step 5: Check Railway Logs (If Still Failing)
If the upload still fails, check Railway logs to see the detailed error:

1. Go to Railway dashboard: https://railway.app
2. Select your project
3. Click on "Deployments"
4. Click on the latest deployment
5. View the logs to see the detailed error messages with emojis:
   - Look for 📸 (upload started)
   - Check where the process stops
   - Find any ❌ or ⚠️ error messages
   - Check the full traceback for the exact error

## Common Issues on Railway

### 1. File System Permissions
**Symptom**: Error when saving file: "Permission denied"
**Solution**: Ensure UPLOAD_FOLDER is set to a writable directory (like `/data/uploads`)

### 2. Missing UPLOAD_FOLDER
**Symptom**: Error creating directory
**Solution**: Add `UPLOAD_FOLDER` environment variable in Railway settings

### 3. Pillow/PIL Issues
**Symptom**: Error during image resize: "No module named 'PIL'"
**Solution**: Ensure Pillow is in requirements.txt and deployed correctly

### 4. Database Connection
**Symptom**: Error during database commit
**Solution**: Check DATABASE_URL is configured correctly in Railway

## Next Steps

After deploying:
1. Test the profile picture upload on iOS
2. If it works: ✅ Done!
3. If it still fails: Check Railway logs for the detailed error with the emoji tracking
4. Share the Railway logs to identify the specific issue

The enhanced logging will help pinpoint exactly where the failure occurs on Railway.
