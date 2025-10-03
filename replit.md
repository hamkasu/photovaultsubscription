# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform built with Flask (Python 3.11) and PostgreSQL. It provides advanced camera features, photo enhancement, face detection, family vault sharing, and secure cloud storage.

## Project Status
**Environment**: Replit Development
**Last Updated**: October 3, 2025 (Fresh GitHub import completed)
**Status**: Running successfully on port 5000
**Database**: PostgreSQL (Replit Neon) - Connected and initialized

## Technology Stack
- **Backend**: Flask 3.0.3, Python 3.11
- **Database**: PostgreSQL (Replit/Neon)
- **ORM**: SQLAlchemy 2.0.25 with Flask-Migrate/Alembic
- **Image Processing**: Pillow, OpenCV, scikit-image
- **Authentication**: Flask-Login
- **Forms**: Flask-WTF, WTForms
- **Storage**: Replit Object Storage
- **Email**: SendGrid
- **Payment**: Stripe
- **Production Server**: Gunicorn

## Project Structure
```
photovault/
├── photovault/          # Main application package
│   ├── routes/          # Blueprint routes (auth, upload, photo, admin, etc.)
│   ├── services/        # Business logic services
│   ├── models.py        # SQLAlchemy database models
│   ├── config.py        # Configuration classes
│   ├── extensions.py    # Flask extensions
│   ├── templates/       # Jinja2 HTML templates
│   └── static/          # CSS, JS, images
├── migrations/          # Alembic database migrations
├── main.py             # Development entry point
├── wsgi.py             # Production WSGI entry point
├── requirements.txt    # Python dependencies
└── replit.md          # This file
```

## Database Schema
The application uses PostgreSQL with the following main models:
- **User**: User accounts with admin/superuser flags
- **Photo**: Photo metadata with EXIF data, GPS, enhancements
- **Person**: People for photo tagging
- **PhotoTag**: Photo-to-person relationships
- **VoiceMemo**: Audio recordings attached to photos
- **SubscriptionPlan**: Billing plans with SST tax (Malaysian market)
- **UserSubscription**: User subscription tracking
- **Invoice**: Billing records
- **FamilyVault**: Shared family photo collections
- **VaultInvitation**: Family vault invitations
- **SocialMediaAccount**: Social media integrations

## Environment Configuration

### Development
- `FLASK_CONFIG=development`
- `FLASK_ENV=development`
- `DATABASE_URL`: Automatically configured by Replit PostgreSQL
- Server runs on `0.0.0.0:5000`

### Production Deployment
- Uses Gunicorn WSGI server with 4 workers
- Autoscale deployment type (stateless)
- Requires:
  - `DATABASE_URL`: PostgreSQL connection string
  - `SECRET_KEY`: Flask secret key for sessions
  - Mail settings: `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
  - SendGrid: `SENDGRID_API_KEY`

## Running the Application

### Development
The workflow "PhotoVault Server" runs automatically:
```bash
python main.py
```

### Database Migrations
```bash
export FLASK_APP=main.py
flask db upgrade          # Apply migrations
flask db stamp head       # Mark database as current
```

### Manual Database Operations
Use the Replit database pane or the execute_sql tool for ad-hoc queries.

## Features
1. **Photo Upload & Management**: File upload, camera capture, EXIF metadata extraction
2. **Photo Enhancement**: Auto-enhancement, editing tools, filters
3. **Face Detection**: AI-powered face recognition and tagging
4. **Smart Tagging**: Automatic photo categorization
5. **Family Vaults**: Shared photo collections with invitations
6. **Social Media Integration**: Connect and share to social platforms
7. **Voice Memos**: Audio notes attached to photos
8. **Billing System**: Subscription plans with Malaysian SST tax
9. **Admin Dashboard**: User management, statistics, system monitoring

## Subscription Plans
- **Free**: 0.1 GB, 50 photos, basic features
- **Basic**: RM 9.00/mo, 1 GB, 1000 photos, face detection
- **Standard**: RM 19.90/mo, 10 GB, 500 photos
- **Pro**: RM 39.90/mo, 50 GB, 5000 photos, all features (Featured)
- **Premium**: RM 79.90/mo, 500 GB, unlimited photos, API access

All plans include 6% SST (Service Tax) for Malaysian market.

## Setup History

### Fresh GitHub Import (October 3, 2025)
1. Installed Python 3.11 dependencies from requirements.txt
2. Created Replit PostgreSQL database with DATABASE_URL
3. Initialized database schema using SQLAlchemy create_all()
4. Seeded subscription plans (5 plans created)
5. Verified development workflow on port 5000 with 0.0.0.0 binding
6. Configured autoscale deployment with Gunicorn (4 workers)
7. Application successfully running and serving requests

### Previous Setup
1. Fixed database schema (added missing columns)
2. Resolved SQLAlchemy mapper cache issues
3. Configured Replit-compatible session cookies

## Known Issues & Fixes Applied
- **SQLAlchemy mapper cache**: Fixed by manually adding missing `social_media_integration` column
- **Subscription plan seeding**: Initially failed due to mapper cache, resolved by direct SQL insert
- **Database schema sync**: Stamped migrations to match existing database state

## Development Notes
- Cache control headers are set to prevent caching issues in Replit proxy
- Session cookies configured for Replit environment (Lax SameSite, no Secure in dev)
- Health check logs are filtered to reduce noise
- Database connection pool configured for Replit environment

## Copyright
Copyright (c) 2025 Calmic Sdn Bhd. All rights reserved.
