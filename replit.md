# PhotoVault - Photo Management Platform

## Overview
PhotoVault is a professional photo management platform designed for digitizing legacy photos. It offers advanced camera features, AI-powered enhancement, and secure cloud storage.

**Status**: Fully configured and running in Replit environment

## Technology Stack

### Backend
- **Framework**: Flask 3.0.3 (Python 3.11)
- **Database**: PostgreSQL (Replit Neon-backed)
- **ORM**: SQLAlchemy 2.0.25 with Flask-Migrate for migrations
- **Server**: 
  - Development: Flask dev server (port 5000)
  - Production: Gunicorn WSGI server

### Image Processing
- **Libraries**: OpenCV (headless), Pillow, scikit-image
- **Features**: Edge detection, perspective correction, denoising, color restoration
- **AI Integration**: OpenAI GPT-5 for image analysis and colorization

### Frontend
- HTML/CSS/JavaScript (Jinja2 templates)
- TensorFlow.js for client-side detection
- Responsive design with modern UI

### Mobile Apps
- iOS: React Native/Expo
- Android: Kotlin

## Project Structure

```
.
├── photovault/          # Main application package
│   ├── models.py        # Database models
│   ├── routes/          # Route blueprints
│   ├── services/        # Business logic (AI, storage, etc.)
│   ├── static/          # CSS, JS, images
│   ├── templates/       # Jinja2 HTML templates
│   └── utils/           # Utilities (image enhancement, face detection)
├── migrations/          # Alembic database migrations
├── main.py             # Development entry point
├── dev.py              # Replit development server
├── wsgi.py             # Production WSGI entry point
└── requirements.txt    # Python dependencies
```

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `SECRET_KEY`: Flask secret key for sessions (optional, has fallback)
- `FLASK_CONFIG`: Environment mode (development/production/testing)
- `OPENAI_API_KEY`: For AI features (optional)
- `SENDGRID_API_KEY`: For email functionality (optional)

### Database
- **Type**: PostgreSQL (Neon)
- **Status**: ✅ Configured and tables created
- **Migrations**: Managed via Flask-Migrate/Alembic

## Running the Application

### Development
The Flask development server runs automatically via the configured workflow:
- **Command**: `python3 dev.py`
- **Port**: 5000
- **Host**: 0.0.0.0 (accessible via Replit webview)
- **Debug**: Enabled

### Production Deployment
Configured for Replit Autoscale deployment:
- **Type**: autoscale (stateless web app)
- **Command**: `gunicorn wsgi:app --bind 0.0.0.0:5000 --workers 2`
- **Port**: 5000

## Database Schema

The application includes these main models:
- **User**: User accounts with authentication
- **Photo**: Photo metadata and storage paths
- **FamilyVault**: Family photo sharing
- **SubscriptionPlan**: Billing and subscription management
- **Person**: Face detection and tagging
- **Story**: Photo storytelling features
- **VoiceMemo**: Audio annotations

## Features

### Core Features
- User authentication and authorization
- Photo upload and management
- Advanced camera with landscape mode
- Auto-enhancement and restoration
- Face detection and tagging
- Family vault sharing
- Smart tagging and organization

### AI Features
- Image colorization (OpenAI GPT-5)
- Smart tagging and categorization
- Face detection and recognition
- Object detection (TensorFlow.js)

### Premium Features
- Social media integration
- Advanced photo enhancement
- Unlimited storage (Premium plan)
- API access

## Recent Setup (GitHub Import - Oct 3, 2025)
1. ✅ Installed Python 3.11 and all dependencies
2. ✅ Configured PostgreSQL database (Replit Neon)
3. ✅ Set up environment variables
4. ✅ Initialized database schema (tables created)
5. ✅ Configured workflow for development server (port 5000)
6. ✅ Verified .gitignore for Python/Replit
7. ✅ Tested application - running successfully
8. ✅ Configured deployment for Replit Autoscale

## Development Notes

### Port Configuration
- Frontend server: Port 5000 (bound to 0.0.0.0)
- Development uses Flask dev server
- Production uses Gunicorn WSGI server

### Security
- CSRF protection enabled (Flask-WTF)
- Secure password hashing (Werkzeug)
- Session management with secure cookies
- SQL injection protection (SQLAlchemy ORM)

### Storage
- Photos stored in `photovault/uploads/`
- Thumbnails generated automatically
- Secure file serving via authenticated routes

## Integrations
- Replit PostgreSQL Database
- Replit Mail (email service)
- SendGrid (email alternative)
- Replit Object Storage

## User Preferences
- None specified yet

## Next Steps for Users
1. Set up OPENAI_API_KEY in Replit Secrets for AI features
2. Configure SENDGRID_API_KEY for email notifications
3. Set up Stripe API keys for payment processing
4. Deploy to production using the "Deploy" button
