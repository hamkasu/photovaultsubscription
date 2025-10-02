# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform with advanced camera features, AI-powered smart tagging, photo enhancement tools, and family vault sharing capabilities. It offers subscription-based billing with multiple tiers.

## Technology Stack
- **Backend**: Flask 3.0.3 with Python 3.11
- **Database**: PostgreSQL (Replit/Neon)
- **Frontend**: Server-side rendering with Jinja2 templates + JavaScript
- **Image Processing**: Pillow, OpenCV
- **AI/ML**: Face detection and recognition
- **Storage**: Replit Object Storage
- **Payment**: Stripe
- **Email**: SendGrid
- **Production Server**: Gunicorn

## Project Structure
```
photovault/
├── photovault/          # Main application package
│   ├── routes/         # URL handlers (auth, family, gallery, photo, etc.)
│   ├── services/       # Business logic (storage, face detection, email)
│   ├── templates/      # Jinja2 HTML templates
│   ├── static/         # CSS, JavaScript, images
│   ├── utils/          # Utility functions (image processing, security)
│   ├── models.py       # Database models
│   └── config.py       # Configuration classes
├── migrations/         # Database migrations (Alembic)
├── main.py            # Development entry point
├── wsgi.py            # Production WSGI entry point
├── release.py         # Database migration script
└── requirements.txt   # Python dependencies
```

## Entry Points
- **Development**: `main.py` - Runs Flask development server on port 5000
- **Production**: `wsgi.py` - WSGI entry point for Gunicorn
- **Migrations**: `release.py` - Runs database migrations

## Configuration
The application supports multiple environments:
- **Development**: Uses `DevelopmentConfig` (FLASK_CONFIG=development)
- **Production**: Uses `ProductionConfig` (FLASK_CONFIG=production)
- **Testing**: Uses `TestingConfig` (FLASK_CONFIG=testing)

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SECRET_KEY`: Flask secret key for sessions (optional, auto-generated if missing)
- `FLASK_CONFIG`: Environment configuration (development/production/testing)
- `PORT`: Server port (default: 5000)

## Database
The application uses PostgreSQL with SQLAlchemy and Alembic for migrations. The database schema includes:
- Users and authentication
- Photos with metadata and EXIF data
- Albums and family vaults
- Subscription plans and billing
- Face detection and recognition data
- Voice memos

## Recent Changes (2025-10-02)
- Set up Replit environment with Python 3.11
- Installed all dependencies from requirements.txt
- Created PostgreSQL database using Replit's built-in database
- Ran database migrations successfully
- Configured development workflow on port 5000
- Set up deployment configuration for Replit Autoscale

## Development Workflow
The application runs on port 5000 using the Flask development server. The workflow is configured to automatically restart when code changes are detected.

## Deployment
The application is configured for Replit Autoscale deployment:
- Uses Gunicorn as the production WSGI server
- Runs on port 5000 with 1 worker
- Auto-scales based on traffic
- Database migrations run automatically during deployment

## User Preferences
None specified yet.
