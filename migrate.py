#!/usr/bin/env python
"""
Database Migration Script for Railway Deployment
=================================================
This script runs database migrations separately from app startup
to prevent Railway timeout issues (HTTP 499 errors).

Usage:
    python migrate.py

This should be run BEFORE starting the Gunicorn server.
Railway will run this automatically via nixpacks.toml configuration.
"""

import os
import sys
from sqlalchemy import create_engine, inspect, text

def run_migrations():
    """Run database migrations using Alembic or fallback to direct SQL"""
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("PhotoVault Database Migration")
    print("=" * 60)
    print(f"Database: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
    print()
    
    try:
        # Test database connectivity
        print("1. Testing database connection...")
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        print("   ✅ Database connection successful")
        print()
        
        # Try Alembic migrations first
        print("2. Running Alembic migrations...")
        try:
            import alembic.config
            import alembic.command
            
            migrations_path = os.path.join(os.path.dirname(__file__), 'migrations')
            
            if not os.path.exists(migrations_path):
                print(f"   ⚠️  Migrations directory not found: {migrations_path}")
                print("   Skipping Alembic migrations")
            else:
                alembic_cfg = alembic.config.Config()
                alembic_cfg.set_main_option('script_location', migrations_path)
                alembic_cfg.set_main_option('sqlalchemy.url', database_url)
                
                # Run migrations
                alembic.command.upgrade(alembic_cfg, 'head')
                print("   ✅ Alembic migrations completed successfully")
        
        except Exception as e:
            print(f"   ⚠️  Alembic migration failed: {str(e)}")
            print("   Attempting fallback migration...")
            
            # Fallback: Direct SQL column additions
            try:
                inspector = inspect(engine)
                
                # Check if subscription_plan table exists
                if 'subscription_plan' in inspector.get_table_names():
                    print("   Checking subscription_plan table...")
                    columns = [col['name'] for col in inspector.get_columns('subscription_plan')]
                    
                    # Add social_media_integration column if missing
                    if 'social_media_integration' not in columns:
                        print("   Adding missing column: social_media_integration")
                        with engine.begin() as conn:
                            conn.execute(text(
                                'ALTER TABLE subscription_plan ADD COLUMN social_media_integration BOOLEAN DEFAULT false'
                            ))
                        print("   ✅ Added social_media_integration column")
                    else:
                        print("   Column social_media_integration already exists")
                
                print("   ✅ Fallback migration completed")
            
            except Exception as fallback_error:
                print(f"   ❌ Fallback migration failed: {str(fallback_error)}")
                print()
                print("=" * 60)
                print("MIGRATION FAILED")
                print("=" * 60)
                print("You may need to run migrations manually:")
                print("  1. Connect to your Railway database")
                print("  2. Run: flask db upgrade")
                print("=" * 60)
                sys.exit(1)
        
        print()
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("The app is ready to start.")
        print()
        
    except Exception as e:
        print(f"❌ MIGRATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    run_migrations()
