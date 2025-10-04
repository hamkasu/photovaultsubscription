# PhotoVault - Professional Photo Management Platform

## Replit Environment Setup

This project has been successfully configured to run in the Replit environment:
- ✅ Python 3.11 installed with all dependencies from requirements.txt
- ✅ PostgreSQL database configured (Replit built-in database)
- ✅ Database migrations stamped to current state
- ✅ Development workflow configured to run on port 5000
- ✅ Deployment configured for Replit Autoscale with Gunicorn
- ✅ Environment properly configured for Replit proxy compatibility

## Project Overview
PhotoVault is a comprehensive photo management and enhancement platform with advanced features including:
- Professional camera experience with landscape mode and tap-to-capture
- Automatic photo upload and organization
- Secure storage with professional-grade security
- Face detection and recognition
- Photo enhancement and restoration
- Smart tagging with AI
- Family vault sharing
- Social media integration
- Subscription-based billing

**Copyright**: © 2025 Calmic Sdn Bhd. All rights reserved.

## Technology Stack

### Backend
- **Framework**: Flask 3.0.3 (Python web framework)
- **Database**: PostgreSQL (via Neon on Replit)
- **ORM**: SQLAlchemy 2.0.25 with Flask-SQLAlchemy
- **Migrations**: Alembic 1.13.1 via Flask-Migrate
- **Authentication**: Flask-Login 0.6.3
- **Forms**: Flask-WTF 1.2.1 + WTForms 3.1.1
- **Production Server**: Gunicorn 21.2.0

### Image Processing
- **Libraries**: Pillow 11.0.0, OpenCV (headless) 4.12.0.88
- **Scientific Computing**: NumPy 2.0+, scikit-image 0.24.0+
- **AI Integration**: OpenAI API (GPT models)

### Additional Services
- **Object Storage**: Replit Object Storage 1.0.2
- **Email**: SendGrid 6.12.5
- **Payments**: Stripe 11.1.1

### Frontend
- HTML5, CSS3, JavaScript (vanilla + jQuery patterns)
- Jinja2 3.1.4 templating
- Responsive design with Bootstrap patterns

### Mobile Apps
- **iOS**: React Native/Expo
- **Android**: Kotlin with CameraX, Room, Retrofit, Glide

## Project Structure

```
photovault/
├── photovault/           # Main application package
│   ├── __init__.py       # Application factory
│   ├── config.py         # Configuration classes
│   ├── models.py         # Database models
│   ├── forms.py          # WTForms definitions
│   ├── routes/           # Blueprint routes
│   │   ├── auth.py       # Authentication routes
│   │   ├── main.py       # Main/home routes
│   │   ├── upload.py     # Photo upload
│   │   ├── gallery.py    # Photo gallery
│   │   ├── family.py     # Family vault features
│   │   └── ...          # Other route modules
│   ├── services/         # Business logic services
│   │   ├── ai_service.py
│   │   ├── face_detection_service.py
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── image_enhancement.py
│   │   ├── photo_detection.py
│   │   ├── face_recognition.py
│   │   └── ...
│   ├── templates/        # Jinja2 HTML templates
│   └── static/           # CSS, JS, images
├── migrations/           # Alembic database migrations
├── photovault-ios/       # iOS React Native app
├── photovault-android/   # Android Kotlin app
├── config.py             # Config module wrapper
├── main.py               # Main entry point
├── dev.py                # Development server
├── wsgi.py               # Production WSGI entry
├── requirements.txt      # Python dependencies
└── replit.md            # This file
```

## Development Setup (Replit)

### Environment Variables
The following are automatically configured by Replit:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database credentials

Optional environment variables:
- `SECRET_KEY` - Flask secret key (auto-generated in dev)
- `FLASK_CONFIG` - Config mode (development/production/testing)
- `OPENAI_API_KEY` - For AI features
- `SENDGRID_API_KEY` - For email notifications
- `STRIPE_SECRET_KEY` - For payment processing

### Running the Application
The development server runs automatically via the configured workflow:
```bash
python dev.py
```

This starts Flask on `0.0.0.0:5000` with debug mode enabled.

### Database Management
The database is automatically initialized on first run. Tables are created from SQLAlchemy models.

For manual database operations:
```bash
# Create tables from models (development only)
python -c "from photovault import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Run migrations (if needed)
flask db upgrade
```

## Production Deployment

### Deployment Configuration
The project is configured for Replit Autoscale deployment:
- **Server**: Gunicorn with 2 workers, 4 threads per worker
- **Port**: 5000 (required by Replit)
- **Timeout**: 60 seconds
- **Logging**: stdout/stderr for container compatibility

### Production Checklist
Before deploying:
1. Set `SECRET_KEY` environment variable (required for session security)
2. Set `DATABASE_URL` to production PostgreSQL
3. Configure `OPENAI_API_KEY` for AI features
4. Configure `SENDGRID_API_KEY` for email
5. Configure `STRIPE_SECRET_KEY` for payments
6. Set `FLASK_CONFIG=production`

## Key Features

### Authentication & Authorization
- User registration and login
- Password reset via email
- Session management with Flask-Login
- Admin and superuser roles
- Subscription-based access control

### Photo Management
- Upload photos with metadata extraction
- Automatic face detection and tagging
- Photo enhancement and restoration
- Colorization of old photos
- Smart tagging with AI
- Gallery organization
- Search and filtering

### Family Vaults
- Create shared family photo collections
- Invite family members
- Shared stories and montages
- Collaborative photo management

### Subscription System
- Multiple pricing tiers (Free, Basic, Standard, Pro, Premium)
- Feature-based access control
- Stripe payment integration
- Malaysian pricing (MYR) with SST

## Recent Changes (2025-10-04)

### Fresh GitHub Import Setup Completed (Latest - October 4, 2025)
- Successfully imported fresh GitHub repository to Replit environment
- Installed Python 3.11 with all dependencies from requirements.txt (53+ packages)
  - Flask 3.0.3, SQLAlchemy 2.0.25, Pillow 11.0.0, OpenCV 4.12.0.88
  - Image processing: NumPy, scikit-image
  - Services: SendGrid, Stripe, OpenAI, Replit Object Storage
- Created new PostgreSQL database (Neon) with environment variables configured
- Initialized database schema with SQLAlchemy models on first run
- Created 5 default subscription plans (Free, Basic, Standard, Pro, Premium)
- Configured development workflow: `python dev.py` on port 5000 with debug mode
- Configured production deployment: Gunicorn with Autoscale (2 workers, 4 threads)
- Verified application functionality:
  - Homepage displays correctly with professional branding
  - All static assets (CSS, images, favicon) loading properly
  - Authentication routes ready (Login, Register)
  - Full feature set operational: camera, upload, gallery, family vaults, billing

### Railway Data Persistence Improvements
- **Fixed critical data loss issues** for Railway deployments
- Removed SQLite fallback that caused database data loss on restart
- Added comprehensive error messages for missing PostgreSQL configuration
- Added warnings for ephemeral file storage (local uploads directory)
- Updated config to support Railway Volumes for persistent file storage
- Created `verify_railway_config.py` script to validate deployment configuration
- Created `RAILWAY_DEPLOYMENT.md` with complete setup guide
- App now fails safely with clear instructions if persistence isn't configured
- Database: Must use PostgreSQL (Railway database addon)
- File Storage: Must use Railway Volumes mounted at `/data` or external object storage

## Architecture Notes

### Database
- PostgreSQL for production and development (Neon on Replit)
- SQLAlchemy ORM with relationship mappings
- Connection pooling configured for Replit environment
- SSL required for production connections

### Security
- CSRF protection via Flask-WTF
- Password hashing with Werkzeug
- Secure session cookies
- File upload validation and sanitization
- SQL injection prevention via ORM

### Image Processing
- OpenCV for face detection and photo analysis
- Pillow for image manipulation
- NumPy for numerical operations
- Automatic EXIF metadata extraction

### Caching
- Cache-Control headers configured for Replit proxy
- No-cache policy to prevent stale content in iframe

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check `DATABASE_URL` environment variable
2. **Session not persisting**: Ensure `SECRET_KEY` is set
3. **Images not loading**: Check UPLOAD_FOLDER permissions
4. **AI features not working**: Verify `OPENAI_API_KEY` is set

### Development Mode
The app runs in development mode by default with:
- Debug mode enabled
- Hot reload on code changes
- Detailed error pages
- SQLite fallback if PostgreSQL unavailable (not recommended)

## User Preferences
- None configured yet (will be added as needed)
