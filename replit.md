# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a professional photo management platform with advanced camera features, photo organization, and family vault capabilities. This is a Flask-based web application with PostgreSQL database backend.

## Project Structure
- **Backend**: Flask web application (Python 3.11)
- **Database**: PostgreSQL (Replit managed)
- **Frontend**: Server-side rendered HTML with JavaScript enhancements
- **Mobile**: React Native Expo app in `photovault-ios/` folder (separate project)

## Technology Stack
- **Framework**: Flask 3.0.3
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic/Flask-Migrate
- **Image Processing**: OpenCV, Pillow, scikit-image
- **Authentication**: Flask-Login
- **Production Server**: Gunicorn
- **Storage**: Replit Object Storage integration

## Configuration
### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `SECRET_KEY`: Flask secret key for sessions
- `FLASK_CONFIG`: Set to 'development' or 'production'
- `FLASK_ENV`: Environment mode
- `FLASK_DEBUG`: Debug mode toggle

### Replit Setup (Completed)
- ✅ Python dependencies installed from requirements.txt
- ✅ PostgreSQL database provisioned and configured
- ✅ Database stamped with latest migration (d5b4630ee3ad)
- ✅ Workflow configured to run Flask on port 5000
- ✅ Deployment configured for Replit Autoscale with Gunicorn

## Development
### Running the Application
The application runs automatically via the configured workflow:
- Entry point: `main.py`
- Development server: Flask built-in (runs on 0.0.0.0:5000)
- Production server: Gunicorn with 4 workers

### Database Migrations
```bash
# Check current migration
flask db current

# Create new migration
flask db migrate -m "description"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

### Proxy Configuration
The Flask app is configured for Replit's proxy environment:
- No `SERVER_NAME` set in development (allows flexible host headers)
- `SESSION_COOKIE_SAMESITE` set to 'Lax' for proxy compatibility
- Server binds to 0.0.0.0:5000

## Deployment
Deployment is configured for Replit Autoscale:
- **Type**: Autoscale (stateless web app)
- **Command**: `gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=4 wsgi:app`
- **Port**: 5000
- **Config**: Production settings via `wsgi.py`

## Features
- Photo upload and management
- Advanced camera features with landscape mode
- Photo detection and face recognition
- Family vaults for shared photo collections
- Smart tagging and organization
- Photo editing tools
- Admin and superuser management
- Billing/subscription system with upgrade functionality

## Billing & Subscription System
### Upgrade Functionality
- **Upgrades**: Free and paid users can upgrade to higher-tier plans instantly
  - Immediate activation with prorated billing
  - Secure payment-before-entitlement implementation
  - Uses Stripe Subscription modification API
  - Customer ownership verification
- **Downgrades/Changes**: Handled via support contact
  - Ensures safe processing at period end
  - Prevents billing/entitlement mismatches
- **Webhook Integration**: Syncs plan changes from Stripe to local database

### Implementation Details
- Route: `/billing/upgrade/<plan_id>` (POST)
- Security: CSRF protection, customer verification
- Payment: Stripe proration with error_if_incomplete behavior
- UI: Clear messaging for different plan change types

## Recent Changes
- **2025-09-30**: Subscription upgrade functionality implemented
  - Added upgrade_plan route with Stripe integration
  - Implemented secure payment-before-entitlement logic
  - Updated billing UI to show upgrade options
  - Enhanced webhook handler for plan synchronization
  - Architect-reviewed and approved implementation
- **2025-09-30**: Initial Replit setup completed
  - Installed Python dependencies
  - Configured PostgreSQL database
  - Set up workflow and deployment
  - Verified application functionality

## Architecture Notes
- Uses application factory pattern (`photovault/__init__.py`)
- Blueprint-based route organization in `photovault/routes/`
- Database models in `photovault/models.py`
- Configuration classes in `photovault/config.py` and root `config.py`
- Static files served from `photovault/static/`
- Templates in `photovault/templates/`

## Important Files
- `main.py`: Development entry point
- `wsgi.py`: Production WSGI entry point
- `config.py`: Configuration loader
- `photovault/__init__.py`: Application factory
- `photovault/config.py`: Configuration classes
- `requirements.txt`: Python dependencies
- `migrations/`: Database migration files
