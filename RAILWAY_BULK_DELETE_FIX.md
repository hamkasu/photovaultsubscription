# Railway Bulk Delete Fix - Deployment Guide

## Issue
The iOS app shows "Failed to delete photos" error when trying to delete multiple photos on Railway production.

**Error Details:**
- Error message: "Failed to delete photos"
- Console: "Bulk delete error: AxiosError: Request failed with status code 400"
- The bulk delete endpoint `/api/photos/bulk-delete` exists locally but is NOT deployed to Railway

## Root Cause
The bulk delete endpoint was added to `photovault/routes/mobile_api.py` but the changes haven't been pushed to GitHub for Railway auto-deployment.

## Solution - Deploy to Railway

### Step 1: Verify Local Changes
The bulk delete endpoint is already implemented in:
- **File**: `photovault/routes/mobile_api.py`
- **Route**: `POST /api/photos/bulk-delete`
- **Lines**: 2209-2325

### Step 2: Commit and Push to GitHub

```bash
# Stage the changes
git add photovault/routes/mobile_api.py

# Commit with descriptive message
git commit -m "Add bulk delete endpoint for iOS app - fix multiple photo deletion"

# Push to GitHub (Railway will auto-deploy)
git push origin main
```

### Step 3: Wait for Railway Deployment
- Railway will automatically detect the GitHub push
- Wait 2-3 minutes for deployment to complete
- Check Railway dashboard for deployment status

### Step 4: Verify on iOS App
1. Open the iOS app (connected to Railway)
2. Go to Gallery
3. Long-press a photo to enter selection mode
4. Select multiple photos (2-3 photos)
5. Tap the 🗑️ (trash) icon
6. Confirm deletion
7. **Expected**: Success message "Deleted X photos"
8. **Previously**: Error "Failed to delete photos"

## Endpoint Details

### Request Format
```http
POST /api/photos/bulk-delete
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "photo_ids": [123, 456, 789]
}
```

### Response Format (Success)
```json
{
  "success": true,
  "message": "Deleted 3 photos",
  "deleted_count": 3,
  "failed_count": 0,
  "errors": null
}
```

### Response Format (Error)
```json
{
  "success": false,
  "error": "Bulk delete failed: {reason}"
}
```

## Features of the Endpoint
✅ Deletes multiple photos in one request  
✅ Removes all associated files (original, thumbnail, edited versions)  
✅ Cleans up voice memos, vault associations, tags, and comments  
✅ Tracks success/failure counts  
✅ Provides detailed error reporting  
✅ Verifies user ownership before deletion  
✅ Uses JWT authentication  
✅ CSRF exempt for mobile API  

## Testing Checklist
- [ ] Single photo deletion still works
- [ ] Multiple photo selection (2-5 photos)
- [ ] Bulk deletion success message shows correct count
- [ ] Deleted photos disappear from gallery
- [ ] No orphaned files left in storage
- [ ] Voice memos are cleaned up
- [ ] Vault associations are removed

## Rollback Plan
If issues occur after deployment:
1. Revert the commit: `git revert HEAD`
2. Push to GitHub: `git push origin main`
3. Railway will auto-deploy the rollback
4. Report the issue for investigation

## Status
🔴 **NOT DEPLOYED** - Endpoint exists locally but not on Railway production  
⚠️ **ACTION REQUIRED** - Push changes to GitHub for Railway deployment
