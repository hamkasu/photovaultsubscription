# 🚨 Railway 502 Error Fix

## Problem
Railway shows "502 Bad Gateway" error. The logs show:
- Container starts ✅
- Database migrations run ✅  
- **But Gunicorn never starts** ❌

## Root Cause
The Dockerfile was running `python release.py && gunicorn ...`. The release script was:
1. Importing the app (which triggered migrations in `create_app()`)
2. Not completing successfully
3. So the `&&` never got to start Gunicorn

## Solution Applied
Simplified the Dockerfile CMD to start Gunicorn directly. Since migrations already happen in `create_app()`, we don't need the separate release script.

**Changed:**
```dockerfile
CMD ["sh", "-c", "python release.py && gunicorn wsgi:app --preload --bind 0.0.0.0:${PORT:-8080} ..."]
```

**To:**
```dockerfile
CMD gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --worker-class sync --timeout 120 --log-level info --access-logfile - --error-logfile -
```

## Deploy to Railway

### Option 1: Using Git Push (Recommended)
```bash
git add Dockerfile
git commit -m "Fix Railway 502 error - simplify Dockerfile CMD"
git push origin main
```

Railway will automatically detect the push and rebuild your app.

### Option 2: Using Railway CLI
```bash
railway up
```

## What to Expect After Deploy

1. **Build phase** - Railway will rebuild your Docker image
2. **Deploy phase** - Container starts
3. **You should see in logs:**
   ```
   [INFO] Booting worker with pid: 1
   [INFO] Listening at: http://0.0.0.0:XXXX
   ```
4. **Your app will be live** at https://web-production-535bd.up.railway.app

## Verify It's Working

1. Visit your Railway URL in a browser
2. You should see the PhotoVault homepage (no 502 error)
3. Try logging in with your account
4. Test the iOS app - it should connect successfully

## Why This Fix Works

- **Removed double initialization**: `--preload` was loading the app twice
- **Removed hanging release.py**: Migrations now only run once in `create_app()`
- **Direct Gunicorn start**: No intermediate scripts that could fail
- **Proper Railway PORT binding**: Uses Railway's `$PORT` environment variable

## Still Getting 502?

Check Railway deployment logs for:
1. **Missing environment variables**: DATABASE_URL, SECRET_KEY
2. **Database connection errors**: Check PostgreSQL is running
3. **Import errors**: Check all packages in requirements.txt are installed
4. **Port binding errors**: Gunicorn should bind to Railway's PORT

You can view logs in Railway dashboard under "Deployments" → Latest deployment → "View Logs"
