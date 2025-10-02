# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a comprehensive photo management platform built with Flask and Python. It provides professional-grade features for managing, organizing, and enhancing photos with AI-powered capabilities like face detection, photo enhancement, and smart tagging.

## Project Architecture

### Backend (Flask Web Application)
- **Framework**: Flask 3.0.3 (Python 3.11)
- **Database**: PostgreSQL (via Replit's built-in database)
- **ORM**: SQLAlchemy 2.0.25 with Flask-SQLAlchemy
- **Migrations**: Alembic via Flask-Migrate
- **Production Server**: Gunicorn 21.2.0
- **Image Processing**: Pillow, OpenCV, scikit-image
- **Storage**: Replit Object Storage
- **Email**: SendGrid
- **Payments**: Stripe

### Frontend (HTML/CSS/JavaScript)
- Jinja2 templating
- Static assets in `photovault/static/`
- Templates in `photovault/templates/`
- Modern responsive design

### Android Client (Native Kotlin App)
- **Language**: Kotlin
- **Minimum SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)
- **Architecture**: MVVM with Repository pattern
- **Key Libraries**: CameraX, OpenCV, Room, WorkManager, Retrofit, Glide

## Key Features

### Backend Features
- User authentication and authorization (admin/superuser roles)
- Photo upload and management
- Camera integration for direct photo capture
- Face detection and recognition (OpenCV)
- Photo enhancement (Pillow, scikit-image)
- Smart tagging and organization
- Family vault sharing
- Subscription-based billing system
- Album and gallery management

### Android Client Features
- ✅ Advanced Camera with edge detection and batch capture
- ✅ Image Enhancement Pipeline (perspective correction, color restoration)
- ✅ Gallery UI with search, filtering, and timeline view
- ✅ Family Vaults with member invitations
- ✅ Offline-first architecture with upload queue
- ✅ Photo metadata editing (tags, people, location, description)
- ✅ Face detection integration (backend API)
- ✅ Background upload with WorkManager

## Project Structure
```
/
├── photovault/               # Flask backend
│   ├── __init__.py           # App factory
│   ├── config.py             # Configuration classes
│   ├── models.py             # Database models
│   ├── routes/               # Blueprint routes
│   ├── services/             # Business logic services
│   ├── static/               # CSS, JS, images
│   ├── templates/            # Jinja2 templates
│   └── utils/                # Helper utilities
├── photovault-android/       # Android client
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/calmic/photovault/
│   │   │   │   ├── ui/         # Activities & UI components
│   │   │   │   ├── data/       # Room database & repositories
│   │   │   │   ├── network/    # Retrofit API service
│   │   │   │   ├── camera/     # Camera & image processing
│   │   │   │   ├── worker/     # Background workers
│   │   │   │   └── util/       # Utilities
│   │   │   └── res/           # Android resources
│   │   └── build.gradle       # App dependencies
│   ├── build.gradle           # Project build config
│   ├── SETUP_GUIDE.md         # Android setup instructions
│   └── README.md              # Android app documentation
├── migrations/               # Alembic database migrations
├── main.py                   # Development entry point
├── wsgi.py                   # Production WSGI entry point
├── config.py                 # Config module wrapper
└── requirements.txt          # Python dependencies
```

## Development Setup

### Backend Setup

#### Environment Variables
The application uses environment variables configured in `.env`:
- `SECRET_KEY`: Flask secret key for sessions
- `FLASK_CONFIG`: Configuration mode (development/production)
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `PORT`: Server port (default: 5000)

#### Database
- PostgreSQL database is provided by Replit's built-in integration
- Tables are created automatically on first run in development mode
- Migrations available in `migrations/versions/` for schema changes

#### Running Backend
The Flask development server runs automatically via the workflow:
```bash
python main.py
```

Server configuration:
- Host: 0.0.0.0 (accepts all connections)
- Port: 5000
- Debug: Enabled in development mode

### Android Client Setup

#### Prerequisites
1. Android Studio Hedgehog (2023.1.1) or later
2. JDK 17
3. Android SDK 34

#### Building the Android App
```bash
cd photovault-android
# Open in Android Studio: File > Open > Select photovault-android folder
# Sync Gradle files
# Build and run on device or emulator
```

See `photovault-android/SETUP_GUIDE.md` for detailed setup instructions.

## Deployment

### Backend Deployment (Replit Autoscale)
The application is configured for deployment using Replit Autoscale with:
- **Server**: Gunicorn with 4 workers
- **Entry Point**: wsgi:app
- **Port**: 5000

Production deployment uses:
```bash
gunicorn --bind=0.0.0.0:5000 --workers=4 --timeout=120 wsgi:app
```

### Android Deployment
1. Build release APK in Android Studio
2. Sign with production keystore
3. Distribute via Google Play Store or direct APK

## Recent Changes (October 2, 2025)

### Backend Setup Completed
- Initial Replit environment setup completed
- Python 3.11 and all dependencies installed
- PostgreSQL database configured and tables created
- Development workflow configured for Flask server on port 5000
- Deployment configuration set up for Replit Autoscale with Gunicorn
- Environment variables configured (.env file created)
- Application verified working with homepage accessible

### Android Client Completed
- Implemented Gallery UI with filtering, search, and sorting
- Implemented Photo Detail UI with metadata editing
- Implemented Family Vaults UI with vault management and member invitations
- Updated MainActivity to enable navigation to Gallery and Vaults
- Created all necessary layout XML files and menu resources
- Enhanced PhotoRepository with updatePhoto method
- Configured build.gradle to use Replit backend URL
- Switched to Maven-based OpenCV dependency for easier setup
- Created comprehensive SETUP_GUIDE.md with build instructions

## API Integration

The Android client is configured to communicate with the Flask backend:
- **Backend URL**: https://62fd2792-7858-474f-abf0-1533e39f5256-00-3uuvecowo9aq1.kirk.replit.dev
- **Authentication**: JWT tokens stored securely
- **Endpoints**: /auth, /upload, /gallery, /family, /api/photo-detection

## Security Notes
- SECRET_KEY is required for production deployments
- Database credentials are managed via Replit secrets
- CSRF protection enabled via Flask-WTF
- Session cookies secured with HTTPOnly and SameSite attributes
- User passwords hashed with Werkzeug's security utilities
- Android JWT tokens stored in EncryptedSharedPreferences

## Testing

### Backend Testing
- Access the web interface at the Replit webview
- Test user registration and login
- Upload photos via camera or file upload
- Test family vault creation and sharing

### Android Testing
- Build and install APK on Android device or emulator
- Test camera capture with edge detection
- Test photo enhancement pipeline
- Test gallery filtering and search
- Test family vault creation and photo sharing
- Test offline functionality and background uploads

## User Preferences
(None documented yet)
