# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a Flask-based photo management application with advanced features including face detection, photo enhancement, smart tagging, and family vault sharing.

**Copyright**: 2025 Calmic Sdn Bhd. All rights reserved.

## Project Architecture

### Backend (Flask)
- **Framework**: Flask 3.0.3
- **Database**: PostgreSQL (via SQLAlchemy)
- **Authentication**: Flask-Login
- **Migrations**: Alembic via Flask-Migrate
- **Image Processing**: OpenCV, Pillow, scikit-image
- **Storage**: Replit Object Storage integration
- **Email**: SendGrid integration
- **Payments**: Stripe integration

### Project Structure
```
photovault/              # Main application package
├── routes/              # Blueprint routes (auth, upload, photo, family, etc.)
├── models.py            # Database models
├── config.py            # Configuration classes
├── extensions.py        # Flask extensions initialization
├── services/            # Business logic services
├── utils/               # Utility functions (face detection, image enhancement)
├── templates/           # Jinja2 HTML templates
└── static/              # CSS, JavaScript, images

migrations/              # Alembic database migrations
main.py                  # Development entry point
wsgi.py                  # Production entry point
config.py                # Configuration helper
requirements.txt         # Python dependencies
```

## Development Setup

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-set by Replit)
- `FLASK_CONFIG`: Set to 'development' for dev mode
- `SECRET_KEY`: Flask secret key (optional for dev, required for production)

### Database
- Using PostgreSQL database provided by Replit
- Database tables are auto-created on first run in development mode
- Migrations are stamped with Alembic

### Running Locally
The workflow is configured to run: `FLASK_CONFIG=development python main.py`
- Server binds to `0.0.0.0:5000`
- Debug mode is disabled by default
- Database tables are created automatically

## Deployment Configuration

### Production Deployment (Replit Autoscale)
- **Command**: `gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=2 --timeout=120 wsgi:app`
- **Port**: 5000 (required for Replit)
- **Entry Point**: `wsgi.py` (forces production config)
- **Workers**: 2 (suitable for stateless web apps)

### Required for Production
1. Set `SECRET_KEY` environment variable
2. Set `DATABASE_URL` to production PostgreSQL instance
3. Run migrations: `flask db upgrade`

## Key Features
- User authentication and registration
- Photo upload with automatic metadata extraction
- Face detection and recognition
- Photo enhancement tools
- Smart tagging system
- Family vault sharing
- Subscription-based access control (Free, Standard, Basic, Pro, Premium)
- Admin dashboard
- SendGrid email integration for invitations

## Recent Changes (2025-10-01)
- Imported project from GitHub
- Installed Python 3.11 and all dependencies
- Set up PostgreSQL database with Replit integration
- Created database tables and stamped migrations
- Configured workflow for port 5000 with proper host binding
- Configured deployment settings for Replit Autoscale
- Verified application runs successfully

## Notes
- Cache control headers are set to prevent caching issues in Replit proxy
- Session cookies configured for Replit environment
- Subscription enforcement middleware ensures users have active plans
- Default subscription plans are seeded automatically on startup
