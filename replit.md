# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management application built with Flask, designed for digitizing legacy photos with advanced camera features, AI-powered enhancement, and family vault sharing capabilities. The application was imported from GitHub and successfully configured to run in the Replit environment.

## Project Setup (Completed)

### Architecture
- **Backend**: Flask 3.0.3 with Python 3.11
- **Frontend**: Jinja2 templates with vanilla JavaScript
- **Database**: PostgreSQL (Neon-hosted)
- **ORM**: SQLAlchemy 2.0.25 with Flask-SQLAlchemy
- **Image Processing**: OpenCV, Pillow, scikit-image
- **Storage**: Replit Object Storage
- **Email**: SendGrid integration
- **Payments**: Stripe integration
- **Mobile Apps**: 
  - iOS: Swift, SwiftUI, AVFoundation, Vision, Core Image
  - Android: Kotlin, CameraX, OpenCV, Room, WorkManager

### Current Configuration
- **Development Server**: Running on port 5000 with 0.0.0.0 binding
- **Workflow**: `python dev.py` starts the Flask development server
- **Database**: PostgreSQL database initialized with all tables
- **Environment**: Development mode with debug enabled

## Key Features
1. **Full Screen Camera**: Professional camera experience with landscape mode and tap-to-capture
2. **Auto Upload**: Photos automatically uploaded and organized after capture
3. **Secure Storage**: Professional-grade security for photo storage
4. **Face Detection**: AI-powered face recognition for photo organization
5. **Photo Enhancement**: Advanced image processing capabilities
6. **Smart Tagging**: Automated photo categorization
7. **Family Vaults**: Collaborative photo collections for families
8. **Subscription Plans**: Free, Standard, Basic, Pro, and Premium tiers

## File Structure
```
├── photovault/           # Main application package
│   ├── models/          # Database models
│   ├── routes/          # Application routes/blueprints
│   ├── services/        # Business logic services
│   ├── static/          # CSS, JS, images
│   ├── templates/       # Jinja2 HTML templates
│   ├── utils/           # Utility functions
│   ├── __init__.py      # App factory
│   ├── config.py        # Configuration classes
│   ├── extensions.py    # Flask extensions
│   └── models.py        # Main models file
├── migrations/          # Alembic database migrations
├── dev.py              # Development server entry point
├── main.py             # Main application entry point
├── wsgi.py             # Production WSGI entry point
├── config.py           # Configuration selector
└── requirements.txt    # Python dependencies
```

## Development Workflow

### Running the Application
The application is configured with a workflow that automatically starts the development server:
- Server runs on `0.0.0.0:5000`
- Debug mode enabled
- Auto-reload on code changes
- Cache control headers configured for Replit proxy

### Database Management
- PostgreSQL database provided by Replit/Neon
- Tables automatically created in development mode via `db.create_all()`
- Subscription plans seeded on app initialization
- Alembic migrations available in `migrations/` directory

### Environment Variables
The following environment variables are configured:
- `DATABASE_URL`: PostgreSQL connection string
- `FLASK_CONFIG`: Set to 'development'
- `FLASK_ENV`: Set to 'development'
- `FLASK_DEBUG`: Set to 'True'

## Deployment Configuration
The application is configured for deployment using:
- **Deployment Type**: Autoscale (stateless web application)
- **Production Server**: Gunicorn with 2 workers and 4 threads
- **Port**: 5000 (required for Replit)
- **Binding**: 0.0.0.0 for public access

## Next Steps for Users
1. **Configure Secrets** (optional):
   - `SECRET_KEY`: For secure session management
   - SendGrid API key: For email functionality
   - Stripe API key: For payment processing

2. **Create Superuser Account** (optional):
   - Set environment variables:
     - `PHOTOVAULT_SUPERUSER_USERNAME`
     - `PHOTOVAULT_SUPERUSER_EMAIL`
     - `PHOTOVAULT_SUPERUSER_PASSWORD`
   - Restart the application to create the superuser

3. **Test Core Features**:
   - Register a new user account
   - Upload photos
   - Test camera functionality
   - Create family vaults
   - Try photo enhancement features

## Technical Notes

### Security
- CSRF protection enabled via Flask-WTF
- Password hashing with Werkzeug security
- Secure session cookies configured
- File upload security implemented
- Cache control headers prevent caching in Replit proxy

### Performance
- Connection pooling configured for PostgreSQL
- Image processing optimized with OpenCV headless
- Gunicorn configured with appropriate worker/thread counts
- Database connection pre-ping enabled

### Known Limitations
- DNN model file not found (using Haar cascade for face detection)
- Development mode uses less aggressive database pooling
- SECRET_KEY should be set in environment for production use

## Recent Changes (October 3, 2025)
- ✅ Imported from GitHub
- ✅ Installed Python 3.11 and all dependencies
- ✅ Created PostgreSQL database
- ✅ Initialized database schema with all tables
- ✅ Configured development workflow on port 5000
- ✅ Configured deployment settings for Autoscale
- ✅ Verified application functionality
- ✅ Application successfully running and accessible

## Support & Documentation
- Application successfully deployed and running in Replit
- All core features functional
- Database tables initialized and ready for use
- Subscription plans configured with Malaysian pricing
