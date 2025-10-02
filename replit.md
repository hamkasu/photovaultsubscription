# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a comprehensive photo management platform built with Flask and Python. It provides professional-grade features for managing, organizing, and enhancing photos with AI-powered capabilities like face detection, photo enhancement, and smart tagging.

## Project Architecture

### Backend
- **Framework**: Flask 3.0.3 (Python 3.11)
- **Database**: PostgreSQL (via Replit's built-in database)
- **ORM**: SQLAlchemy 2.0.25 with Flask-SQLAlchemy
- **Migrations**: Alembic via Flask-Migrate
- **Production Server**: Gunicorn 21.2.0

### Frontend
- HTML/CSS/JavaScript with Jinja2 templating
- Static assets in `photovault/static/`
- Templates in `photovault/templates/`

### Key Features
- User authentication and authorization (admin/superuser roles)
- Photo upload and management
- Camera integration for direct photo capture
- Face detection and recognition (OpenCV)
- Photo enhancement (Pillow, scikit-image)
- Smart tagging and organization
- Family vault sharing
- Subscription-based billing system
- Album and gallery management

### Integrations
- **Storage**: Replit Object Storage
- **Email**: SendGrid for notifications
- **Payments**: Stripe for subscription billing

## Project Structure
```
/
├── photovault/          # Main application package
│   ├── __init__.py      # App factory
│   ├── config.py        # Configuration classes
│   ├── models.py        # Database models
│   ├── extensions.py    # Flask extensions
│   ├── routes/          # Blueprint routes
│   ├── services/        # Business logic services
│   ├── static/          # CSS, JS, images
│   ├── templates/       # Jinja2 templates
│   └── utils/           # Helper utilities
├── migrations/          # Alembic database migrations
├── main.py             # Development entry point
├── wsgi.py             # Production WSGI entry point
├── config.py           # Config module wrapper
└── requirements.txt    # Python dependencies
```

## Development Setup

### Environment Variables
The application uses environment variables configured in `.env`:
- `SECRET_KEY`: Flask secret key for sessions
- `FLASK_CONFIG`: Configuration mode (development/production)
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `PORT`: Server port (default: 5000)

### Database
- PostgreSQL database is provided by Replit's built-in integration
- Tables are created automatically on first run in development mode
- Migrations available in `migrations/versions/` for schema changes

### Running Locally
The Flask development server runs automatically via the workflow:
```bash
python main.py
```

Server configuration:
- Host: 0.0.0.0 (accepts all connections)
- Port: 5000
- Debug: Enabled in development mode

## Deployment

### Replit Autoscale
The application is configured for deployment using Replit Autoscale with:
- **Server**: Gunicorn with 4 workers
- **Entry Point**: wsgi:app
- **Port**: 5000
- **Configuration**: See `.replit` file

Production deployment uses:
```bash
gunicorn --bind=0.0.0.0:5000 --workers=4 --timeout=120 wsgi:app
```

## Recent Changes (October 2, 2025)
- Initial Replit environment setup completed
- Python 3.11 and all dependencies installed
- PostgreSQL database configured and tables created
- Development workflow configured for Flask server on port 5000
- Deployment configuration set up for Replit Autoscale with Gunicorn
- Environment variables configured (.env file created)
- Application verified working with homepage accessible

## Security Notes
- SECRET_KEY is required for production deployments
- Database credentials are managed via Replit secrets
- CSRF protection enabled via Flask-WTF
- Session cookies secured with HTTPOnly and SameSite attributes
- User passwords hashed with Werkzeug's security utilities

## User Preferences
(None documented yet)
