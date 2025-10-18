# Railway Builder Configuration Fix

## Problem
Railway deployment failing with "Application failed to respond" error.

**Root Cause**: 
- `railway.json` forced Railway to use Dockerfile builder
- Dockerfile starts gunicorn WITHOUT running database migrations
- Migrations configured in `nixpacks.toml` release phase were being ignored
- App crashes on startup because database schema is incomplete

**Logs showed**:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
Stopping Container
```

## Solution
Remove `railway.json` to let Railway use nixpacks builder automatically.

### Changes Made
1. Renamed `railway.json` → `railway.json.backup`
2. Railway will now use nixpacks.toml which includes:
   - **Release Phase**: `python release.py` (runs migrations BEFORE app starts)
   - **Start Command**: `gunicorn wsgi:app` with proper configuration

### nixpacks.toml Configuration
```toml
[phases.release]
cmd = "python release.py"  # Runs migrations before app starts

[start]
cmd = "gunicorn wsgi:app --preload --bind 0.0.0.0:$PORT --workers 2 --worker-class sync --timeout 120 --log-level info --access-logfile - --error-logfile -"
```

### What release.py Does
1. Verifies DATABASE_URL environment variable
2. Runs Alembic migrations (`flask db upgrade`)
3. Downloads colorization models if needed
4. Validates database schema

## Deployment Steps
1. Commit changes:
   ```bash
   git add railway.json.backup RAILWAY_BUILDER_FIX.md
   git commit -m "Fix: Remove railway.json to use nixpacks builder with release phase"
   git push origin main
   ```

2. Railway will automatically:
   - Detect nixpacks.toml
   - Run `python release.py` in release phase (migrations)
   - Start gunicorn only AFTER migrations succeed

3. Verify deployment:
   - Check Railway logs for "PhotoVault Release: All deployment tasks completed successfully"
   - App should start successfully after migrations complete

## Expected Log Output
```
PhotoVault Release: Starting deployment tasks...
PhotoVault Release: Running Alembic migrations...
PhotoVault Release: Database migrations completed successfully
PhotoVault Release: All deployment tasks completed successfully
[INFO] Starting gunicorn...
[INFO] Listening at: http://0.0.0.0:XXXX
```

## Rollback (if needed)
```bash
mv railway.json.backup railway.json
git add railway.json
git commit -m "Rollback to Dockerfile builder"
git push origin main
```
