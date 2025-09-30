"""
PhotoVault Application Factory
Copyright (c) 2025 Calmic Sdn Bhd. All rights reserved.
"""
# photovault/__init__.py

from flask import Flask
from photovault.extensions import db, login_manager, migrate, csrf
from photovault.config import config
import os

def _create_superuser_if_needed(app):
    """Create superuser account from environment variables if no superuser exists"""
    from photovault.models import User
    
    try:
        # Check if any superuser already exists
        if User.query.filter_by(is_superuser=True).first():
            return
    except Exception as e:
        # Tables don't exist yet (likely during migration), skip superuser creation
        app.logger.info(f"Skipping superuser creation - tables not ready: {str(e)}")
        return
        
    # Get superuser credentials from environment variables
    username = os.environ.get('PHOTOVAULT_SUPERUSER_USERNAME')
    email = os.environ.get('PHOTOVAULT_SUPERUSER_EMAIL')
    password = os.environ.get('PHOTOVAULT_SUPERUSER_PASSWORD')
    
    if username and email and password:
        try:
            # Check if user with same username or email already exists
            existing_user = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                # Make existing user a superuser
                existing_user.is_superuser = True
                existing_user.is_admin = True
                db.session.commit()
                app.logger.info(f"Made existing user {existing_user.username} a superuser")
            else:
                # Create new superuser
                superuser = User(
                    username=username,
                    email=email,
                    is_admin=True,
                    is_superuser=True
                )
                superuser.set_password(password)
                db.session.add(superuser)
                db.session.commit()
                app.logger.info(f"Created superuser account: {username}")
        except Exception as e:
            app.logger.error(f"Failed to create superuser: {str(e)}")
            db.session.rollback()

def create_app(config_class=None):
    """Application factory"""
    app = Flask(__name__)
    
    # Configuration
    if config_class is None:
        config_name = os.environ.get('FLASK_CONFIG') or 'development'
        config_class = config.get(config_name, config['default'])
    
    if isinstance(config_class, str):
        config_class = config.get(config_class, config['default'])
    
    app.config.from_object(config_class)
    
    # Initialize configuration
    config_class.init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    
    # Login manager configuration
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        from photovault.models import User
        return User.query.get(int(user_id))
    
    # Register blueprints
    from photovault.routes.main import main_bp
    from photovault.routes.auth import auth_bp
    from photovault.routes.upload import upload_bp
    from photovault.routes.photo_detection import photo_detection_bp
    from photovault.routes.admin import admin_bp
    from photovault.routes.superuser import superuser_bp
    from photovault.routes.photo import photo_bp
    from photovault.routes.camera_routes import camera_bp
    from photovault.routes.gallery import gallery_bp
    from photovault.routes.family import family_bp
    from photovault.routes.smart_tagging import smart_tagging_bp
    from photovault.billing import billing_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(upload_bp)
    app.register_blueprint(photo_detection_bp)
    app.register_blueprint(camera_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(superuser_bp, url_prefix='/superuser')
    app.register_blueprint(photo_bp)
    app.register_blueprint(gallery_bp)
    app.register_blueprint(family_bp)
    app.register_blueprint(smart_tagging_bp)
    app.register_blueprint(billing_bp)
    
    # Note: Upload file serving is handled securely via gallery.uploaded_file route with authentication
    
    # Subscription enforcement middleware
    @app.before_request
    def enforce_subscription():
        """Ensure authenticated users have selected a subscription plan"""
        from flask import request, redirect, url_for
        from flask_login import current_user
        
        # Skip check for non-authenticated users
        if not current_user.is_authenticated:
            return None
        
        # Skip check for admin/superuser accounts
        if current_user.is_admin or current_user.is_superuser:
            return None
        
        # List of routes that don't require a subscription
        public_routes = [
            'auth.login',
            'auth.logout',
            'auth.register',
            'auth.forgot_password',
            'auth.reset_password',
            'billing.plans',
            'billing.subscribe',
            'billing.success',
            'billing.dashboard',
            'main.about',
            'main.terms',
            'main.privacy',
            'main.contact',
            'main.features',
            'main.api_health',
            'static'
        ]
        
        # Get current endpoint
        endpoint = request.endpoint
        
        # Skip check for public routes
        if endpoint in public_routes or (endpoint and endpoint.startswith('auth.')):
            return None
        
        # Check if user has an active subscription
        from photovault.models import UserSubscription
        active_subscription = UserSubscription.query.filter_by(
            user_id=current_user.id,
            status='active'
        ).first()
        
        # If no active subscription, redirect to plans page
        if not active_subscription:
            from flask import flash
            flash('Please choose a subscription plan to access PhotoVault features.', 'info')
            return redirect(url_for('billing.plans'))
        
        return None
    
    # Initialize database
    with app.app_context():
        # Create tables if they don't exist
        # For SQLite in production or development/testing environments
        if app.debug or app.testing or 'sqlite' in app.config.get('SQLALCHEMY_DATABASE_URI', ''):
            try:
                db.create_all()
            except Exception as e:
                app.logger.warning(f"Table creation warning (may already exist): {str(e)}")
        
        # Bootstrap superuser account if environment variables are set
        _create_superuser_if_needed(app)
    
    return app