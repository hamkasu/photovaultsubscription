# Railway Migration Multiple Heads Fix

## Problem
Railway deployment was failing with:
```
ERROR [flask_migrate] Error: Multiple heads are present; please specify a single target revision
```

## Root Cause
The migration history had **branching** - three different migrations all created from the same parent (`ad11b5287a15`):

1. `add_photo_comment` (Photo comment table)
2. `20251013_profile_pic` (Profile picture column)
3. `e9416442732b` → `f1a2b3c4d5e6` (Social media + person_id nullable)

This created multiple "heads" in the migration tree, and Alembic couldn't determine which path to follow.

## Solution
Created a **merge migration** (`merge_heads_20251018.py`) that combines all three heads into a single unified head.

### Migration Structure
```
ad11b5287a15 (parent)
    ├── add_photo_comment
    ├── 20251013_profile_pic
    └── e9416442732b → f1a2b3c4d5e6
            ↓
    merge_heads_20251018 (combines all three)
```

## Files Modified/Created
1. ✅ Created `migrations/versions/merge_heads_20251018.py` - Merge migration
2. ✅ Fixed `Dockerfile` - PORT handling and OpenCV dependencies
3. ✅ Fixed `railway.json` - Use DOCKERFILE builder
4. ✅ Created `.dockerignore` - Optimize Docker build

## Deployment Instructions

### Push to GitHub
```bash
git add migrations/versions/merge_heads_20251018.py Dockerfile railway.json .dockerignore release.py
git commit -m "Fix Railway migration heads and OpenCV dependencies"
git push origin main
```

### What Railway Will Do
1. Detect the Dockerfile and build with Docker (not Nixpacks)
2. Install all OpenCV system dependencies
3. Run migrations - now with a single unified head
4. Start the application successfully

## Expected Result
✅ OpenCV libraries installed (libGL.so.1, etc.)  
✅ Single migration head (no more branching errors)  
✅ All database tables and columns created  
✅ Application starts successfully on Railway

## Verification
After deployment completes:
1. Check Railway logs for "Database migrations completed successfully"
2. Visit your Railway URL - should see StoryKeep homepage
3. Test features requiring OpenCV (photo upload, enhancement)

## Note
- This is a one-time fix for the migration branching issue
- Future migrations should avoid creating parallel branches from the same parent
- The merge migration has no schema changes - it just unifies the migration tree
