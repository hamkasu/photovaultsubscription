# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform with advanced camera features, built using Flask (Python) and PostgreSQL. This application allows users to securely store, organize, and manage their photos with features like face detection, photo enhancement, family vaults, and more.

## Project Structure
- **Backend**: Flask web application (Python 3.11)
- **Database**: PostgreSQL (Replit-managed)
- **Frontend**: Server-rendered HTML templates with Jinja2
- **Image Processing**: OpenCV, Pillow, scikit-image
- **Object Storage**: Replit Object Storage integration
- **Mobile App**: React Native Expo app (photovault-ios/ directory)

## Key Features
- User authentication and authorization
- Photo upload and management
- Face detection and recognition
- Image enhancement tools
- Family photo vaults and sharing
- Camera integration
- Smart photo tagging
- Photo galleries and albums

## Configuration

### Environment Variables
The application uses the following environment variables (automatically configured):
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Flask secret key (auto-generated in dev)
- `FLASK_CONFIG`: Set to 'development' for local dev
- `FLASK_ENV`: Set to 'development' for local dev
- `FLASK_DEBUG`: Set to 'false' in production

### Development Setup
The development workflow runs on port 5000 using the Flask development server:
```bash
python main.py
```

### Production Deployment
Configured for Replit Autoscale deployment using Gunicorn:
```bash
gunicorn wsgi:app --bind 0.0.0.0:5000 --workers 2
```

## Database
- **Type**: PostgreSQL
- **Migrations**: Managed using Flask-Migrate (Alembic)
- **Schema**: Includes users, photos, albums, families, vaults, and more

To run migrations:
```bash
flask db upgrade
```

## Recent Changes
- **2025-09-30**: GitHub import successfully configured for Replit
  - Installed Python 3.11 and all dependencies from requirements.txt
  - Created PostgreSQL database with Replit integration
  - Verified database schema at migration ad11b5287a15 (all tables exist)
  - Configured development workflow on port 5000 using Flask dev server
  - Set up Autoscale deployment with Gunicorn and release.py build script
  - Application tested and verified working correctly

## Dependencies
Key Python packages:
- Flask 3.0.3
- SQLAlchemy 2.0.25
- psycopg2-binary 2.9.9
- Pillow 11.0.0
- opencv-python-headless 4.8.0.76
- gunicorn 21.2.0
- sendgrid 6.12.5
- replit-object-storage 1.0.2

## Architecture Notes
- Uses Flask application factory pattern
- Blueprints for modular routing (auth, admin, gallery, family, etc.)
- SQLAlchemy ORM for database operations
- WTForms for form handling and validation
- Flask-Login for session management
- CSRF protection enabled

## File Storage
- Photos are stored using Replit Object Storage
- Upload security includes file type validation and virus scanning
- Maximum file size: 16MB
- Supported formats: PNG, JPG, JPEG, GIF, BMP, WEBP

## Security Features
- Password hashing with Werkzeug
- CSRF protection on all forms
- Secure session management
- SSL/HTTPS in production
- File upload validation
- User authentication and authorization

## Notes
- The application is currently configured for development environment
- PostgreSQL database is pre-configured and ready to use
- Mobile app in photovault-ios/ is separate and requires Expo setup
- Face detection models use Haar cascade (DNN models optional)
