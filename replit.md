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
## Railway Deployment Troubleshooting

Based on your screenshots, the app starts successfully but returns 502 errors on HTTP requests. Here are the critical items to verify:

**Environment Variables Required in Railway:**
1. `DATABASE_URL` or `POSTGRES_URL` - PostgreSQL connection string (appears to be set ✓)
2. `SECRET_KEY` - Flask session secret (appears to be set ✓)
3. `FLASK_CONFIG=production` (appears to be set ✓)
4. `FLASK_ENV=production` (appears to be set ✓)

**Procfile Configuration:**
- The Procfile correctly binds Gunicorn to `0.0.0.0:$PORT` - this is necessary for Railway
- Gunicorn command: `web: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`

**Next Steps to Fix 502 Error:**
1. Check Railway Deploy Logs for any runtime errors during first HTTP request
2. Verify DATABASE_URL is correctly formatted (should start with `postgresql://` not `postgres://`)
3. Check if app crashes on first request - look for Python tracebacks in logs
4. Ensure Railway service is configured to use Nixpacks builder (railway.json already sets this)
5. Try reducing workers to 1 temporarily to see if it's a concurrency issue

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
