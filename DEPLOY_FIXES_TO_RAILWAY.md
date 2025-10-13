# Deploy iOS Fixes to Railway

## Issues Fixed
1. ✅ **Delete Photo Feature** - Added DELETE `/api/photos/<id>` endpoint
2. ⚠️ **Sharpen Photo Feature** - Endpoint exists, may need testing on Railway

## Changes Made
- Added delete photo endpoint to `photovault/routes/mobile_api.py`
- Endpoint handles complete photo deletion including:
  - Original and edited files
  - Thumbnails
  - Associated voice memos
  - Vault photo associations
  - Photo-person tags
  - Comments

## Deployment Steps

### 1. Commit Your Changes
```bash
git add photovault/routes/mobile_api.py
git commit -m "Add delete photo endpoint for iOS app

- Added DELETE /api/photos/<id> endpoint in mobile_api.py
- Handles complete photo deletion with all associations
- Fixes iOS delete photo 400 error"
```

### 2. Push to GitHub
```bash
git push origin main
```

### 3. Railway Auto-Deploy
Railway will automatically detect the push and deploy the changes.

### 4. Wait for Deployment
- Check Railway dashboard for deployment status
- Wait for "Deployed" status before testing

### 5. Test on iOS App
1. Open StoryKeep app
2. Go to a photo detail screen
3. Test **Delete Photo** - should work now ✅
4. Test **Sharpen Photo** - check if it works

## Troubleshooting

### If Sharpen Still Fails:
The sharpen endpoint exists but might have issues on Railway:
- Check Railway logs for error messages
- Possible issues:
  - File permissions on Railway
  - Missing dependencies (PIL/Pillow)
  - Disk space/memory limits

### If Delete Still Fails:
- Verify deployment completed successfully
- Check Railway logs for errors
- Ensure iOS app cache is cleared (force quit and reopen)

## Railway Logs
To check logs on Railway:
1. Go to Railway dashboard
2. Select your project
3. Click on "Deployments"
4. View logs for errors

## Next Steps
After deploying:
1. Test both delete and sharpen features
2. If sharpen still fails, check Railway logs and report the error
3. Clear iOS app cache if needed (force quit and reopen)
