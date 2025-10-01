# PhotoVault - Photo Management Platform

## Overview
PhotoVault is a professional photo management platform with advanced camera features, face detection, photo enhancement, and family vault sharing capabilities. Built with Flask/Python backend and includes a React Native mobile app.

## Project Structure
- **Backend**: Flask application (Python 3.12)
- **Database**: PostgreSQL (via Replit Database)
- **Frontend**: Server-side rendered templates with JavaScript
- **Mobile**: React Native Expo app in `photovault-ios/` directory

## Recent Changes (October 1, 2025)
- Initial Replit environment setup completed
- Python dependencies installed (numpy 1.26.4 for opencv compatibility)
- PostgreSQL database created and schema initialized
- Workflow configured to run on port 5000
- Deployment configuration set up for Replit Autoscale

## Architecture

### Backend Components
- **Application Factory**: `photovault/__init__.py` - Flask app factory with extension initialization
- **Configuration**: `photovault/config.py` - Environment-specific configs (Development, Production, Testing)
- **Models**: `photovault/models.py` - SQLAlchemy database models
- **Routes**: `photovault/routes/` - Blueprint-based route handlers
- **Services**: `photovault/services/` - Business logic (storage, face detection, sendgrid)
- **Utils**: `photovault/utils/` - Helper functions (image enhancement, face recognition, metadata extraction)

### Key Features
1. **User Management**: Authentication, registration, subscription-based access control
2. **Photo Upload**: Multiple upload methods with face detection and metadata extraction
3. **Photo Enhancement**: Old photo restoration using OpenCV
4. **Face Detection**: Automatic face detection and recognition
5. **Family Vaults**: Shared photo collections with member management
6. **Smart Tagging**: AI-powered photo tagging and organization
7. **Billing**: Stripe integration for subscription management
8. **Storage**: Replit Object Storage for photo files

### Database Schema
- **Users**: User accounts with subscription status
- **Photos**: Photo metadata and relationships
- **FamilyVaults**: Shared photo collections
- **VaultMembers**: Vault membership and permissions
- **SubscriptionPlans**: Pricing tiers and features
- **UserSubscriptions**: Active user subscriptions

## Development Setup

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `FLASK_CONFIG`: Set to `development` for development mode
- `SECRET_KEY`: Flask session secret (generated if not provided)

### Running Locally
The workflow "PhotoVault Server" runs: `FLASK_CONFIG=development python main.py`
- Server runs on port 5000
- Debug mode enabled in development
- Auto-reloads on code changes

### Database Migrations
```bash
flask db upgrade  # Apply migrations
flask db stamp head  # Mark current state
```

## Deployment

### Replit Autoscale
Configured for autoscale deployment using Gunicorn:
- Workers: 2 sync workers
- Timeout: 120 seconds
- Binds to port 5000
- Production config automatically applied

### Production Requirements
- Set `SECRET_KEY` environment variable
- Database migrations must be run
- Ensure `DATABASE_URL` is configured

## Dependencies

### Core
- Flask 3.0.3
- SQLAlchemy 2.0.25
- PostgreSQL (psycopg2-binary)
- Gunicorn 21.2.0

### Image Processing
- Pillow 11.0.0
- OpenCV (headless) 4.8.0.76
- numpy 1.26.4 (pinned for opencv compatibility)

### Integrations
- Stripe (payment processing)
- SendGrid (email notifications)
- Replit Object Storage (file storage)

## Known Issues
- scikit-image installation takes too long, currently skipped (optional feature)
- numpy must be <2.0 for opencv compatibility

## User Preferences
None specified yet.
