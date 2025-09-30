# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a Flask-based web application for professional photo management with advanced features including:
- Camera capture and photo upload
- Photo enhancement and editing
- Face detection and recognition
- Family vault sharing
- Smart tagging and organization
- Voice memo attachments
- Subscription management with Stripe integration

## Project Structure
- **Backend**: Flask (Python 3.11) web application
- **Database**: PostgreSQL (Replit managed)
- **Frontend**: HTML/CSS/JavaScript templates with Jinja2
- **Mobile App**: React Native (Expo) in `photovault-ios/` directory

## Recent Changes
- **2025-09-30**: Fresh GitHub import setup completed
  - Installed Python 3.11 module with all development tools
  - Installed all Python dependencies from requirements.txt
  - Set up PostgreSQL database with Replit's managed service (Neon-backed)
  - Verified all database tables exist and stamped migrations to current version
  - Configured Flask development server on port 5000 (binds to 0.0.0.0)
  - Workflow "PhotoVault Server" configured and running successfully
  - Deployment configured with Gunicorn (2 workers, 120s timeout, autoscale)
  - Application tested and confirmed working on Replit environment

## Configuration

### Environment Variables
The following environment variables are configured:
- `DATABASE_URL`: PostgreSQL connection string (Replit managed)
- `SECRET_KEY`: Flask secret key for sessions (generated)
- `FLASK_CONFIG`: Set to 'development' for dev mode

### Server Configuration
- **Development**: Flask dev server on port 5000 (binds to 0.0.0.0)
- **Production**: Gunicorn with 2 workers, 120s timeout
- **Host Header**: SERVER_NAME not set to allow Replit proxy flexibility

## Running the Application

### Development
The application runs automatically via the configured workflow:
```bash
python main.py
```

### Database Setup
Database tables are created automatically on first run using SQLAlchemy's `db.create_all()`.
For schema changes, migrations are available in `migrations/versions/`.

### Deployment
Configured for Replit Autoscale deployment with:
- Gunicorn WSGI server
- 2 workers
- 120s timeout for image processing operations
- Preload enabled for efficiency

## Key Features
1. **Photo Management**: Upload, organize, and enhance photos
2. **Camera Integration**: Direct camera capture with landscape mode
3. **Face Detection**: Automatic face detection and person tagging
4. **Family Vaults**: Shared family photo collections with role-based access
5. **Smart Tagging**: AI-powered photo organization
6. **Voice Memos**: Audio attachments for photos
7. **Subscription Plans**: Tiered pricing with Stripe integration

## Mobile App (iOS)
A companion React Native app is available in `photovault-ios/`:
- Built with Expo
- Camera integration
- Photo upload and gallery
- User authentication

## Architecture Notes
- Uses Flask application factory pattern
- SQLAlchemy ORM for database management
- Flask-Login for authentication
- Flask-Migrate for database migrations
- Replit Object Storage for file uploads
- SendGrid for email notifications

## User Preferences
None yet - update this section as preferences are expressed.
