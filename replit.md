# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a comprehensive photo management platform built with Flask and Python 3.11. It specializes in digitizing legacy photos with advanced camera features, AI-powered enhancement, and secure cloud storage.

## Project Information
- **Company**: Calmic Sdn Bhd
- **Platform**: Flask Web Application
- **Database**: PostgreSQL (Replit managed)
- **Python Version**: 3.11

## Architecture

### Backend
- **Framework**: Flask 3.0.3
- **Database ORM**: SQLAlchemy 2.0.25
- **Migrations**: Alembic/Flask-Migrate
- **Authentication**: Flask-Login with JWT
- **Forms**: Flask-WTF with CSRF protection
- **Production Server**: Gunicorn

### Image Processing
- **Libraries**: Pillow, OpenCV (headless), scikit-image
- **Features**: 
  - Auto-enhancement with CLAHE
  - Face detection and recognition
  - Perspective correction
  - Color restoration
  - Noise reduction
  - Smart tagging

### Key Features
1. **Advanced Camera Mode**: High-resolution capture, auto-detection, batch mode
2. **AI Enhancement**: Brightness/contrast adjustment, denoising, sharpening
3. **Family Vaults**: Secure photo sharing within families
4. **Subscription Plans**: Multiple tiers (Free, Basic, Standard, Pro, Premium)
5. **Social Media Integration**: Share photos to social platforms
6. **Email Services**: SendGrid integration for notifications

## Project Structure
```
photovault/
├── routes/          # Flask blueprints (auth, gallery, family, etc.)
├── models/          # SQLAlchemy models
├── services/        # Business logic services
├── utils/           # Image processing utilities
├── static/          # CSS, JS, images
└── templates/       # Jinja2 templates

migrations/          # Alembic database migrations
api/                 # API entry point for serverless
photovault-android/  # Android app (separate)
PhotoVault-iOS/      # iOS app (React Native/Expo)
```

## Development Setup

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection (automatically set by Replit)
- `FLASK_CONFIG`: Set to 'development' for dev mode
- `SECRET_KEY`: Flask secret key (optional in dev, required in prod)
- `MAIL_SERVER`, `MAIL_USERNAME`, `MAIL_PASSWORD`: Email configuration

### Running Locally
1. Dependencies are automatically installed from `requirements.txt`
2. Database is automatically configured via Replit PostgreSQL
3. Run with: `python3 dev.py` (development server on port 5000)
4. Access at: `http://0.0.0.0:5000`

### Database Migrations
```bash
# Stamp current schema (first time)
flask db stamp head

# Create new migration
flask db migrate -m "description"

# Apply migrations
flask db upgrade
```

## Production Deployment

### Configuration
- **Target**: Autoscale deployment
- **Server**: Gunicorn with 2 workers
- **Port**: 5000 (frontend)
- **Environment**: Production mode uses `wsgi.py` entry point

### Deployment Command
```bash
gunicorn wsgi:app --bind 0.0.0.0:5000 --workers 2 --worker-class sync --timeout 120
```

## Recent Changes (2025-10-03)
- Installed all Python dependencies from requirements.txt
- Created and configured PostgreSQL database
- Stamped database migrations to current version
- Configured Flask development workflow on port 5000
- Set up deployment configuration for production (autoscale)
- Verified application is working correctly (homepage, login, register pages)

## User Preferences
- None documented yet

## Important Notes
1. **Cache Control**: Development mode includes cache-busting headers for Replit proxy
2. **Host Configuration**: Development server binds to 0.0.0.0 to work with Replit's proxy
3. **CSRF Protection**: Enabled via Flask-WTF
4. **Database**: Uses Replit PostgreSQL in development, configurable for production
5. **Subscription Enforcement**: Middleware ensures users select a plan before accessing features
6. **Mobile Apps**: Separate iOS (React Native/Expo) and Android (Kotlin) implementations available
