# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform with advanced camera features, AI-powered enhancement, face detection, and family vault sharing capabilities.

## Recent Changes
- **2025-10-02**: GitHub import setup completed
  - Installed Python 3.11 and all dependencies
  - Configured PostgreSQL database for development
  - Created development server script (dev.py) that binds to 0.0.0.0:5000
  - Set up workflow for Flask development server
  - Configured deployment for Replit Autoscale
  
- **2025-10-02**: iOS Camera Module completed
  - Built complete camera module with AVFoundation
  - Implemented real-time edge detection using Vision framework
  - Created image enhancement pipeline with Core Image
  - Set up Core Data for offline-first storage
  - Applied MVVM architecture with SwiftUI
  - Fixed all critical issues (session access, delegate retention, permissions)
  - 11 Swift files + supporting configuration
  - Ready for device testing

## Project Architecture

### Technology Stack
- **Backend**: Flask 3.0.3, Python 3.11
- **Database**: PostgreSQL (via Replit Database integration)
- **ORM**: SQLAlchemy 2.0.25 with Alembic migrations
- **Image Processing**: OpenCV, Pillow, scikit-image
- **Storage**: Replit Object Storage
- **Email**: SendGrid integration
- **Payments**: Stripe integration
- **Frontend**: Jinja2 templates, vanilla JavaScript, CSS

### Project Structure
```
photovault/
├── photovault/          # Main application package
│   ├── routes/          # Flask blueprints
│   ├── models/          # SQLAlchemy models (in models.py)
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions (image processing, face detection)
│   ├── templates/       # Jinja2 HTML templates
│   ├── static/          # CSS, JS, images
│   ├── __init__.py      # Application factory
│   └── config.py        # Configuration classes
├── migrations/          # Alembic database migrations
├── dev.py              # Development server entry point
├── main.py             # Alternative entry point
├── wsgi.py             # Production WSGI entry point
└── requirements.txt    # Python dependencies
```

### Database Configuration
- **Development**: Uses DATABASE_URL environment variable (PostgreSQL)
- **Tables**: Created automatically in development mode via SQLAlchemy
- **Migrations**: Alembic migrations available in migrations/versions/

### Development Workflow
1. **Start server**: Workflow "PhotoVault Server" runs `python dev.py`
2. **Access**: Application runs on port 5000
3. **Database**: PostgreSQL accessible via DATABASE_URL

### Deployment Configuration
- **Platform**: Replit Autoscale (stateless)
- **Server**: Gunicorn with 2 sync workers
- **Port**: Dynamic via $PORT environment variable
- **Entry Point**: wsgi.py

### Key Features
- User authentication and registration
- Photo upload and management
- Face detection and recognition
- Image enhancement and editing
- Family vaults for photo sharing
- Subscription plans with billing
- Admin and superuser dashboards
- Camera integration for mobile apps
- Voice memo support

### Environment Variables
Required for production:
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `SECRET_KEY`: Flask secret key (should be set for production)

Optional:
- `MAIL_SERVER`, `MAIL_USERNAME`, `MAIL_PASSWORD`: Email configuration
- `STRIPE_*`: Stripe payment integration
- `SENDGRID_API_KEY`: SendGrid email service

### Mobile Applications

#### Android Application
The project includes a companion Android app in `photovault-android/` written in Kotlin with:
- Advanced camera features
- Edge detection and auto-enhancement
- Offline-first architecture
- Automatic sync with backend

#### iOS Application
A complete iOS camera module in `PhotoVault-iOS/` built with Swift/SwiftUI:
- **Architecture**: MVVM with SwiftUI and Combine
- **Camera**: AVFoundation for high-quality capture
- **Edge Detection**: Vision framework for real-time photo detection
- **Enhancement**: Core Image pipeline (perspective correction, denoise, sharpen)
- **Storage**: Core Data + file system for offline-first
- **Status**: Camera module complete, ready for backend integration

## Notes
- The application uses cache control headers to prevent issues with Replit's proxy
- Development mode automatically creates database tables
- Production mode requires migrations to be run separately
- Face detection models use OpenCV Haar cascades by default
