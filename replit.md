# PhotoVault - Professional Photo Management Platform

## Overview
PhotoVault is a Flask-based web application for professional photo management with advanced camera features, family vaults, photo enhancement, and face recognition capabilities. It includes an iOS companion app built with React Native and Expo.

## Project Structure
- **Backend**: Flask web application (Python 3.11)
  - Main app: `photovault/` package
  - Entry point: `main.py` (development), `wsgi.py` (production)
  - Routes: Authentication, Upload, Gallery, Family Vaults, Photo Detection, Admin
  - Models: User, Photo, Album, Person, FamilyVault, Subscriptions, etc.
  
- **Frontend**: HTML templates with JavaScript
  - Templates: `photovault/templates/`
  - Static assets: `photovault/static/`
  
- **iOS App**: React Native/Expo app in `photovault-ios/`

## Database
- **PostgreSQL** database provided by Replit
- Tables automatically created from models
- 18 tables including users, photos, albums, family vaults, subscriptions, etc.

## Environment Configuration
The following environment variables are configured:
- `DATABASE_URL`: PostgreSQL connection (auto-configured by Replit)
- `SECRET_KEY`: Flask session secret
- `FLASK_CONFIG`: Set to "development" or "production"
- `FLASK_DEBUG`: Set to "True" for development

## Running Locally
The application runs automatically via the "PhotoVault Server" workflow on port 5000.

## Deployment
Configured for Replit Autoscale deployment using Gunicorn:
- Server: Gunicorn with 2 workers and 2 threads
- Port: 5000
- WSGI entry: `wsgi:app`

## Recent Setup (September 30, 2025)
- Fresh GitHub import to Replit environment
- Python 3.11 installed with all dependencies
- PostgreSQL database created and initialized
- Database schema created with 18 tables
- Development workflow configured and tested
- Deployment configuration set up for production
- Application tested and verified working

## Features
- User authentication and authorization
- Photo upload and management
- Camera interface for direct photo capture
- Family vault sharing system
- Photo enhancement and editing
- Face detection and recognition
- Smart tagging
- Subscription/billing system (Stripe)
- Admin and superuser dashboards

## Architecture Decisions
- Using Flask's built-in development server for local development
- Host set to 0.0.0.0 to work with Replit proxy
- SERVER_NAME not set in development to avoid host verification issues
- Database tables created using SQLAlchemy models (db.create_all())
- Gunicorn configured for production deployment
