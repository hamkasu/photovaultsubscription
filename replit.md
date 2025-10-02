# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform built with Flask (Python 3.11) that provides advanced camera features, AI-powered smart tagging, photo enhancement tools, family vault sharing, and subscription-based billing. The application was successfully imported and configured for Replit on October 2, 2025.

## Technology Stack
- **Backend**: Flask 3.0.3 (Python 3.11)
- **Database**: PostgreSQL (Replit built-in)
- **Frontend**: Server-side rendered templates with JavaScript
- **Image Processing**: Pillow, OpenCV
- **AI/ML**: Face detection and recognition
- **Storage**: Replit Object Storage
- **Payment**: Stripe
- **Email**: SendGrid
- **Production Server**: Gunicorn

## Project Structure
- `photovault/` - Main application package
  - `routes/` - Route handlers (auth, family, gallery, photo, etc.)
  - `services/` - Business logic services (storage, face detection, sendgrid)
  - `templates/` - Jinja2 HTML templates
  - `static/` - CSS, JavaScript, and images
  - `utils/` - Utility functions (image enhancement, file handling, security)
  - `models.py` - SQLAlchemy database models
  - `config.py` - Configuration classes
  - `extensions.py` - Flask extensions (db, migrate, login_manager, csrf)
- `migrations/` - Alembic database migrations
- `main.py` - Development entry point
- `wsgi.py` - Production WSGI entry point

## Development Setup
1. **Environment**: Uses Replit's PostgreSQL database (DATABASE_URL auto-configured)
2. **Port**: Development server runs on port 5000 (0.0.0.0:5000)
3. **Config**: Automatically uses DevelopmentConfig when FLASK_CONFIG=development
4. **Database**: Tables are created and migrations are stamped to latest version

## Running the Application
- **Development**: The workflow "PhotoVault Server" runs `FLASK_CONFIG=development python main.py`
- **Production**: Deployment uses `gunicorn wsgi:app` with autoscale configuration

## Database
- **Type**: PostgreSQL (Replit built-in)
- **Models**: User, Photo, FamilyVault, VaultInvitation, SubscriptionPlan, and more
- **Migrations**: Managed with Flask-Migrate/Alembic
- **Initial Data**: Subscription plans are automatically seeded on startup

## Key Features
- User authentication and authorization
- Camera capture with full-screen and landscape support
- Photo upload and management
- Face detection and recognition
- Photo enhancement and editing
- Family vault sharing with invitations
- Smart tagging
- Subscription-based billing (Malaysian market with SST)
- Admin and superuser dashboards

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SECRET_KEY` - Flask secret key (should be set for production)
- `FLASK_CONFIG` - Config environment (development/production/testing)
- Mail and SendGrid settings for email functionality
- Stripe keys for payment processing

## Recent Changes (October 2, 2025)
1. Installed Python 3.11 and all dependencies from requirements.txt
2. Configured PostgreSQL database using Replit's built-in database
3. Created all database tables and stamped migrations
4. Verified .gitignore includes proper Python ignores
5. Configured development workflow to run on port 5000
6. Tested application successfully - homepage loads correctly
7. Configured deployment for Replit Autoscale with Gunicorn

## Deployment
- **Target**: Autoscale (stateless web application)
- **Server**: Gunicorn with 2 workers
- **Command**: `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --worker-class sync --timeout 120`
- **Requirements**: DATABASE_URL and SECRET_KEY must be set in production

## Notes
- The application uses Replit Object Storage for file uploads
- Face detection uses OpenCV Haar cascades (DNN models are optional)
- The app supports both development and production configurations
- Database schema is complete with all necessary migrations applied
