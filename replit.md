# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform with advanced camera features, built with Flask (Python) and PostgreSQL. It provides secure photo storage, family vault sharing, face detection, photo enhancement, and smart tagging capabilities.

## Project Architecture

### Technology Stack
- **Backend**: Flask 3.0.3 (Python 3.11)
- **Database**: PostgreSQL (Replit managed)
- **ORM**: SQLAlchemy 2.0.25 with Flask-Migrate/Alembic
- **Image Processing**: Pillow, OpenCV, scikit-image
- **Authentication**: Flask-Login
- **Storage**: Replit Object Storage
- **Email**: SendGrid integration
- **Payment**: Stripe integration

### Project Structure
- `photovault/` - Main application package
  - `routes/` - Blueprint route handlers (auth, gallery, family, admin, etc.)
  - `models.py` - SQLAlchemy database models
  - `config.py` - Configuration classes (Development, Production, Testing)
  - `services/` - Business logic services (face detection, montage, sendgrid)
  - `templates/` - Jinja2 HTML templates
  - `static/` - CSS, JavaScript, images
  - `utils/` - Utility functions (file handling, security, metadata)
- `migrations/` - Alembic database migrations
- `main.py` - Development entry point
- `wsgi.py` - Production entry point (Gunicorn)

### Key Features
1. **Photo Upload & Management** - Secure photo upload with metadata extraction
2. **Camera Integration** - Full screen camera with landscape mode
3. **Family Vaults** - Shared photo collections with invite system
4. **Face Detection** - AI-powered face recognition (OpenCV)
5. **Photo Enhancement** - Image processing and editing tools
6. **Smart Tagging** - Automatic photo categorization
7. **Subscription Plans** - Tiered plans (Free, Standard, Basic, Pro, Premium)
8. **Admin Dashboard** - User management and statistics

## Development Setup

### Environment Configuration
- **Port**: 5000 (required for Replit)
- **Host**: 0.0.0.0 (allows Replit proxy)
- **Database**: PostgreSQL via DATABASE_URL environment variable
- **Flask Config**: Development mode (FLASK_CONFIG=development)

### Running the Application
The development server is configured via workflow:
- Command: `FLASK_CONFIG=development python main.py`
- Serves on: http://0.0.0.0:5000

### Database Management
- **Migrations**: Use Flask-Migrate commands
  - `flask db upgrade` - Apply migrations
  - `flask db stamp head` - Mark database as current
  - `flask db migrate -m "message"` - Create new migration
- **Auto-initialization**: Tables created automatically in development mode
- **Default Data**: Subscription plans seeded on startup

## Deployment Configuration

### Replit Deployment (Autoscale)
- **Deployment Type**: Autoscale (stateless web app)
- **Production Server**: Gunicorn with 2 workers
- **Command**: `gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=2 main:app`
- **Environment**: FLASK_CONFIG=production (set automatically in production)

### Railway Deployment
- **Build System**: Nixpacks (automatically detects Python 3.11)
- **Release Phase**: `python release.py` (runs database migrations)
- **Start Command**: `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 1 --worker-class sync --timeout 120`
- **Configuration Files**:
  - `nixpacks.toml` - Railway build configuration
  - `Procfile` - Alternative process file (backup)
  - `wsgi.py` - Production WSGI entry point
  - `release.py` - Database migration and setup script

### Required Environment Variables
- `DATABASE_URL` / `RAILWAY_DATABASE_URL` / `POSTGRES_URL` / `DATABASE_PRIVATE_URL` - PostgreSQL connection (Railway auto-provides)
- `SECRET_KEY` - Flask secret key (**REQUIRED** for production - must be set manually)
- `SENDGRID_API_KEY` - Email service (optional)
- `STRIPE_PUBLISHABLE_KEY` - Payment processing (optional)
- `STRIPE_SECRET_KEY` - Payment processing (optional)

## Recent Changes (October 1, 2025)

### GitHub Import Setup - Successfully Completed
1. ✅ Installed Python 3.11 and all dependencies from requirements.txt
2. ✅ Created PostgreSQL database using Replit's managed database (Neon)
3. ✅ Initialized database schema using `db.create_all()` in development mode
4. ✅ Seeded subscription plans (Free, Standard, Basic, Pro, Premium) 
5. ✅ Configured development workflow: `FLASK_CONFIG=development python main.py`
6. ✅ Set up autoscale deployment with Gunicorn for production
7. ✅ Verified application is working correctly (homepage, login page tested)

### Railway Deployment Configuration - Completed
1. ✅ Verified and tested WSGI production entry point (wsgi.py)
2. ✅ Fixed release.py to accept all Railway database URL variants (DATABASE_URL, RAILWAY_DATABASE_URL, POSTGRES_URL, DATABASE_PRIVATE_URL)
3. ✅ Unified Gunicorn configuration between Procfile and nixpacks.toml
4. ✅ Confirmed release script handles database migrations correctly
5. ✅ Tested production configuration with Railway-compatible settings
6. ✅ All Railway deployment files verified and ready (nixpacks.toml, Procfile, wsgi.py, release.py)

### Application Status
- **Server**: Running successfully on port 5000
- **Database**: PostgreSQL connected and initialized
- **Development**: Fully functional with hot reload
- **Production**: Deployment configured with autoscale + Gunicorn
- **All routes tested**: Homepage ✓, Login page ✓

### Database Initialization Note
- Database was initialized using `db.create_all()` in development mode
- All required tables created successfully including users, photos, family vaults, subscriptions, etc.
- Subscription plans automatically seeded on first run (5 plans active)

### Database Schema
The application uses a comprehensive schema including:
- Users (with admin/superuser roles, subscriptions)
- Photos (with metadata, face detection, tags)
- Family Vaults (shared photo collections)
- Vault Invitations (member management)
- Subscription Plans & User Subscriptions
- Voice Memos (attached to photos)

## User Preferences
- Development server runs on port 5000 with host 0.0.0.0
- Database migrations managed via Flask-Migrate
- Production deployment uses Gunicorn with autoscale
