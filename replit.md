# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform with advanced camera features, AI-powered smart tagging, photo enhancement tools, and family vault sharing capabilities. It includes both a web application and a native Android client. The platform offers subscription-based billing with multiple tiers.

## Technology Stack

### Backend (Flask Web App)
- **Backend**: Flask 3.0.3 with Python 3.11
- **Database**: PostgreSQL (Replit/Neon)
- **Frontend**: Server-side rendering with Jinja2 templates + JavaScript
- **Image Processing**: Pillow, OpenCV
- **AI/ML**: Face detection and recognition
- **Storage**: Replit Object Storage
- **Payment**: Stripe
- **Email**: SendGrid
- **Production Server**: Gunicorn

### Android Client
- **Language**: Kotlin 1.9.20
- **Min SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)
- **Architecture**: MVVM with Repository pattern
- **Camera**: CameraX 1.3.1 with advanced controls
- **Image Processing**: OpenCV 4.8.0 for edge detection and enhancement
- **Offline Storage**: Room Database 2.6.1
- **Background Sync**: WorkManager 2.9.0
- **Networking**: Retrofit 2.9.0 + OkHttp
- **Image Loading**: Glide 4.16.0

## Project Structure
```
photovault/ (Root)
├── photovault/              # Flask Web Application
│   ├── routes/             # URL handlers (auth, family, gallery, photo, etc.)
│   ├── services/           # Business logic (storage, face detection, email)
│   ├── templates/          # Jinja2 HTML templates
│   ├── static/             # CSS, JavaScript, images
│   ├── utils/              # Utility functions (image processing, security)
│   ├── models.py           # Database models
│   └── config.py           # Configuration classes
├── photovault-android/     # Native Android Application
│   ├── app/src/main/java/com/calmic/photovault/
│   │   ├── camera/         # Edge detection and image enhancement
│   │   ├── data/           # Room database, DAOs, repositories
│   │   ├── network/        # Retrofit API client and models
│   │   ├── ui/             # Activities (Login, Camera, Main)
│   │   ├── util/           # Utilities (PreferenceManager)
│   │   └── worker/         # Background upload workers
│   ├── app/src/main/res/   # Android resources (layouts, drawables)
│   ├── build.gradle        # Android build configuration
│   └── README.md           # Android app documentation
├── migrations/             # Database migrations (Alembic)
├── main.py                # Flask development entry point
├── wsgi.py                # Flask production WSGI entry point
├── release.py             # Database migration script
└── requirements.txt       # Python dependencies
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
- `DATABASE_URL`: PostgreSQL connection string (✅ Configured - Replit PostgreSQL)
- `SECRET_KEY`: Flask secret key for sessions (⚠️ **Required for Production** - Currently auto-generated)
  - For development: Auto-generated per session (sessions won't persist across restarts)
  - For production: **Must be set in Replit Secrets** to persist user sessions
  - Generate a secure key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `FLASK_CONFIG`: Environment configuration (default: development)
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

### Flask Backend Setup
- Set up Replit environment with Python 3.11
- Installed all dependencies from requirements.txt
- Created PostgreSQL database using Replit's built-in database
- Initialized database schema using SQLAlchemy's `db.create_all()`
- Stamped Alembic to current migration version (ad11b5287a15)
- **Note**: For production deployment from scratch, run `python release.py` to apply migrations in proper order
- Configured development workflow on port 5000
- Set up deployment configuration for Replit Autoscale
- **Development database is functional and ready for use**

### Android Client
- Explored comprehensive existing Android implementation
- Verified all core features are implemented:
  - Advanced camera with edge detection and batch capture
  - Auto-enhancement pipeline using OpenCV
  - Offline-first architecture with Room database
  - Upload queue with WorkManager
  - User authentication
  - Photo repository and API integration
  - Family vault support
- All DAOs, repositories, and API models complete
- Comprehensive README documentation exists
- Ready for building and deployment

## Development Workflow
The application runs on port 5000 using the Flask development server. The workflow is configured to automatically restart when code changes are detected.

## Deployment
The application is configured for Replit Autoscale deployment:
- Uses Gunicorn as the production WSGI server
- Runs on port 5000 with 1 worker
- Auto-scales based on traffic
- Database migrations run automatically during deployment

### Before Deploying to Production
1. **Set SECRET_KEY in Replit Secrets**:
   - Go to Replit Secrets tab
   - Add `SECRET_KEY` with a secure random value
   - Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
2. **Verify DATABASE_URL** points to production PostgreSQL
3. **Test the deployment** with a smoke test after publishing

## Android Client

The PhotoVault Android app is a fully-featured native client with comprehensive functionality already implemented. See `photovault-android/README.md` for complete documentation.

### Key Android Features Implemented
- **Advanced Camera**: Edge detection, batch mode, tap-to-focus, flash control
- **Auto-Enhancement**: Perspective correction, CLAHE, denoising, sharpening
- **Offline-First**: Room database, upload queue, background sync
- **Authentication**: Login/register with JWT token management
- **Photo Management**: Local storage, metadata tagging, search/filter
- **Family Vaults**: Vault creation, member invites, shared photo access
- **API Integration**: Complete Retrofit client with all endpoints

### Building the Android App
1. Open `photovault-android/` in Android Studio
2. Add OpenCV 4.8.0 AAR to `app/libs/` directory
3. Update API base URL in `app/build.gradle` to point to your Replit backend
4. Sync Gradle and build

For detailed instructions, see `photovault-android/README.md`.

## User Preferences
None specified yet.
