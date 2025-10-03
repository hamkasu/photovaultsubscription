# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management application designed for digitizing legacy photos. It offers advanced camera features, AI-powered enhancement, and family vault sharing capabilities.

**Created**: October 3, 2025  
**Status**: Production-ready Flask application running on Replit

## Technology Stack

### Backend
- **Framework**: Flask 3.0.3 with Python 3.11
- **Database**: PostgreSQL (Replit-managed)
- **ORM**: SQLAlchemy 2.0.25 with Flask-SQLAlchemy
- **Migrations**: Alembic/Flask-Migrate
- **Production Server**: Gunicorn 21.2.0

### Image Processing
- OpenCV (headless)
- Pillow 11.0.0
- scikit-image
- Face detection and recognition

### Storage & Services
- Replit Object Storage
- SendGrid (email)
- Stripe (payments)

## Project Structure

```
photovault/
├── photovault/          # Main application package
│   ├── routes/         # Blueprint routes (auth, gallery, family, etc.)
│   ├── services/       # Business logic services
│   ├── utils/          # Utilities (face detection, image processing)
│   ├── templates/      # Jinja2 HTML templates
│   ├── static/         # CSS, JS, images
│   ├── models.py       # Database models
│   └── config.py       # Configuration classes
├── migrations/         # Alembic database migrations
├── dev.py             # Development server entry point
├── main.py            # Main application entry point
├── wsgi.py            # Production WSGI entry point
└── requirements.txt   # Python dependencies
```

## Environment Configuration

### Development (Current Setup)
- **Port**: 5000
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Debug**: Enabled
- **Database**: PostgreSQL (DATABASE_URL auto-configured)
- **Entry Point**: `python dev.py`

### Production Deployment
- **Type**: Autoscale deployment
- **Server**: Gunicorn with 4 workers
- **Database**: Uses same PostgreSQL database
- **Required Env Vars**: 
  - `SECRET_KEY` (for session security)
  - `DATABASE_URL` (auto-configured)

## Key Features

1. **Full Screen Camera**: Professional camera with landscape mode and tap-to-capture
2. **Auto Upload**: Automatic photo upload and organization
3. **Secure Storage**: Professional-grade security with Replit Object Storage
4. **Face Detection**: AI-powered face detection and recognition
5. **Photo Enhancement**: Advanced image processing capabilities
6. **Family Vaults**: Collaborative photo sharing with family members
7. **Smart Tagging**: AI-powered photo organization
8. **Subscription Plans**: Multiple tiers (Free, Standard, Basic, Pro, Premium)

## Database Schema

The application uses Alembic migrations for database versioning. Main tables include:
- `user` - User accounts and authentication
- `photo` - Photo metadata and storage references
- `album` - Photo albums and collections
- `person` - Face recognition data
- `family_vault` - Shared family vaults
- `subscription_plan` - Subscription tiers
- `user_subscription` - User subscriptions

## Running the Application

### Development
The workflow "PhotoVault Server" is configured to run:
```bash
python dev.py
```

This starts the Flask development server on 0.0.0.0:5000 with debug mode enabled.

### Database Management
```bash
# Run migrations
flask db upgrade

# Create new migration
flask db migrate -m "description"

# Stamp database with current revision
flask db stamp head
```

### Production Deployment
Click the "Deploy" button in Replit. The deployment is configured to use Gunicorn with autoscaling.

## Security Considerations

- Session cookies configured for Replit environment
- CSRF protection enabled
- SSL/TLS required in production
- File upload validation and security
- PostgreSQL with connection pooling
- Cache-Control headers to prevent stale content in Replit proxy

## Recent Setup (October 3, 2025)

1. ✅ Installed Python 3.11 environment
2. ✅ Installed all Python dependencies
3. ✅ Created PostgreSQL database
4. ✅ Ran database migrations and seeded subscription plans
5. ✅ Configured development workflow on port 5000
6. ✅ Configured production deployment (autoscale with Gunicorn)
7. ✅ Verified application runs correctly

## Notes

- The application automatically creates default subscription plans on startup
- Development mode uses db.create_all() for convenience
- Production mode relies on migrations
- The .gitignore excludes Python artifacts, databases, logs, but preserves Replit configs
- Mobile apps (iOS/Android) are included in the repository but not actively deployed
