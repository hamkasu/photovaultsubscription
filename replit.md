# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a Flask-based web application for professional photo management with advanced camera features, family vaults, photo enhancement, and face recognition capabilities. It includes an iOS companion app built with React Native and Expo.

## Project Structure
- **Backend**: Flask web application (Python 3.11)
  - Main app: `photovault/` package
  - Entry point: `main.py` (development), `wsgi.py` (production)
  - Routes: Authentication, Upload, Gallery, Family Vaults, Photo Detection, Admin
  - Models: User, Photo, Album, Person, FamilyVault, Subscriptions, etc.
  
- **Frontend**: HTML templates with JavaScript
  - Templates: `photovault/templates/`
  - Static assets: `photovault/static/`
  
- **iOS App**: React Native/Expo app in `photovault-ios/`

## Database
- **PostgreSQL** database provided by Replit
- Tables automatically created from models
- 18 tables including users, photos, albums, family vaults, subscriptions, etc.

## Environment Configuration
The following environment variables are configured:
- `DATABASE_URL`: PostgreSQL connection (auto-configured by Replit)
- `SECRET_KEY`: Flask session secret
- `FLASK_CONFIG`: Set to "development" or "production"
- `FLASK_DEBUG`: Set to "True" for development

## Running Locally
The application runs automatically via the "PhotoVault Server" workflow on port 5000.

## Deployment
Configured for Replit Autoscale deployment using Gunicorn:
- Server: Gunicorn with 2 workers and 2 threads
- Port: 5000
- WSGI entry: `wsgi:app`

## Recent Setup (October 1, 2025)
- Fresh GitHub import to Replit environment
- Python 3.11 module already installed from .replit configuration
- Python dependencies installed from requirements.txt (Flask, SQLAlchemy, Gunicorn, etc.)
- PostgreSQL database created and initialized via Replit integration
- Database schema initialized using db.create_all() and migrations marked as up-to-date
- Development workflow configured to run Flask server on port 5000
- Server configured to listen on 0.0.0.0 for Replit proxy compatibility
- Cache-Control headers added to prevent caching issues in Replit proxy environment
- Deployment configured for Replit Autoscale with Gunicorn (2 workers)
- Application tested and verified working successfully with homepage displaying correctly
## Railway Deployment Fixes (October 1, 2025)

The app was experiencing 502 Bad Gateway errors on Railway. The following fixes were implemented:

### Fixes Applied:

**1. Health Check Endpoints Added** (for better diagnostics):
- `/health` - Simple text response "OK" for monitoring
- `/api` - Basic API health check (no database required)
- `/api/health/db` - Database connectivity check with sanitized error responses

**2. Procfile Optimized**:
- Reduced workers from 2 to 1 (better for Railway's resource constraints)
- Increased timeout from 120 to 180 seconds for slow cold starts
- Changed log level to debug for better diagnostics
- Removed `--preload` flag to avoid SQLAlchemy connection pool issues
- Final: `web: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 180 --log-level debug --access-logfile - --error-logfile -`

**3. Improved Error Handling**:
- Database initialization now catches errors gracefully
- App continues to start even if DB init fails (allows health checks to work)
- Environment-aware: `create_all()` only runs in development (FLASK_CONFIG=development)
- Production mode verifies connectivity with SELECT 1 instead of creating tables

**4. Security Improvements**:
- Database health endpoint no longer exposes raw exception details
- Errors are logged server-side but sanitized in public responses

### Environment Variables Required in Railway:
1. `DATABASE_URL` or `POSTGRES_URL` - PostgreSQL connection string
2. `SECRET_KEY` - Flask session secret (required for sessions)
3. `FLASK_CONFIG=production` - Set environment to production
4. Ensure DATABASE_URL uses `postgresql://` prefix (not `postgres://`)

### Testing Health Endpoints:
```bash
curl https://your-railway-app.railway.app/health
curl https://your-railway-app.railway.app/api
curl https://your-railway-app.railway.app/api/health/db
```

### Production Deployment Checklist:
- ✓ Set FLASK_CONFIG=production in Railway
- ✓ Ensure DATABASE_URL is properly formatted
- ✓ Set SECRET_KEY environment variable
- ✓ Run Alembic migrations: `alembic upgrade head`
- ✓ Monitor health endpoints after deployment

## Features
- User authentication and authorization
- Photo upload and management
- Camera interface for direct photo capture
- Family vault sharing system
- Photo enhancement and editing
- Face detection and recognition
- Smart tagging
- Subscription/billing system (Stripe)
- Admin and superuser dashboards

## Architecture Decisions
- Using Flask's built-in development server for local development
- Host set to 0.0.0.0 to work with Replit proxy
- SERVER_NAME not set in development to avoid host verification issues
- Database tables created using SQLAlchemy models (db.create_all())
- Gunicorn configured for production deployment
