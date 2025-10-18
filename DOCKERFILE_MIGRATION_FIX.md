# Dockerfile Migration Fix

## Problem
Railway deployment failing with restart loop - app crashes immediately after initialization.

**Root Cause**: 
- Dockerfile was starting gunicorn WITHOUT running database migrations first
- App initializes → tries to query database → no schema/missing tables → crashes
- Railway restarts container → same problem → infinite loop

**Evidence from logs**:
```
Starting Container
2025-10-18 14:47:08,304 INFO: PhotoVault startup
...all initialization logs...
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
Stopping Container  ← CRASH HERE
```

## Solution
Modified Dockerfile to run `python release.py` (database migrations) BEFORE starting gunicorn.

### Changes Made to Dockerfile

**Before** (line 28):
```dockerfile
CMD ["/bin/sh", "-c", "echo 'DEBUG: Starting Gunicorn...' && gunicorn wsgi:app ..."]
```

**After** (line 31):
```dockerfile
CMD ["/bin/sh", "-c", "echo 'Running database migrations...' && python release.py && echo 'Starting Gunicorn...' && gunicorn wsgi:app --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 4 --timeout 120 --log-level info --access-logfile - --error-logfile -"]
```

### What This Does
1. **First**: Runs `python release.py` which:
   - Verifies DATABASE_URL environment variable exists
   - Runs Alembic migrations (`flask db upgrade`)
   - Adds any missing columns to user table
   - Downloads colorization models if needed
   - Validates all required tables exist

2. **Then**: Starts gunicorn ONLY if migrations succeed (due to `&&` operator)

## Deployment Steps

1. **Commit and push changes**:
   ```bash
   git add Dockerfile DOCKERFILE_MIGRATION_FIX.md
   git commit -m "Fix: Run database migrations in Dockerfile before starting gunicorn"
   git push origin main
   ```

2. **Railway will automatically**:
   - Rebuild container with new Dockerfile
   - Run migrations on startup
   - Start gunicorn only after migrations complete
   - App should stay running!

## Expected Log Output

You should now see these logs in Railway:
```
Running database migrations...
PhotoVault Release: Starting deployment tasks...
PhotoVault Release: Running Alembic migrations to ensure schema is up-to-date...
PhotoVault Release: Database migrations completed successfully
PhotoVault Release: All deployment tasks completed successfully
Starting Gunicorn...
[INFO] Starting gunicorn 21.2.0
[INFO] Listening at: http://0.0.0.0:XXXX
[INFO] Using worker: sync
[INFO] Booting worker with pid: XX
```

Then the app should stay running and respond to requests!

## Why This Fixes It

- **Old flow**: Start gunicorn → app tries to access DB → no schema → crash
- **New flow**: Run migrations → create/update schema → start gunicorn → app works ✓

## Alternative: Using nixpacks (Recommended Long-term)

For better separation of concerns, you can also:
1. Remove `railway.json.backup` entirely
2. Let Railway auto-detect `nixpacks.toml`
3. nixpacks runs migrations in a separate "release" phase before starting the app

But the Dockerfile fix works immediately!
