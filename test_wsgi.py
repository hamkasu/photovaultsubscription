#!/usr/bin/env python3
"""
Quick diagnostic script to test if wsgi.py can be imported successfully
Run this to verify the app can initialize before deploying
"""
import os
import sys

# Force production mode
os.environ['FLASK_CONFIG'] = 'production'
os.environ['FLASK_ENV'] = 'production'

print("=" * 60)
print("Testing WSGI App Import")
print("=" * 60)

try:
    print("\n✓ Importing wsgi module...")
    import wsgi
    
    print("✓ WSGI module imported successfully")
    print(f"✓ App object exists: {hasattr(wsgi, 'app')}")
    print(f"✓ App is Flask instance: {wsgi.app.__class__.__name__}")
    print(f"✓ App debug mode: {wsgi.app.debug}")
    print(f"✓ App config: {wsgi.app.config.__class__.__name__}")
    
    print("\n" + "=" * 60)
    print("✅ WSGI app can be imported successfully!")
    print("=" * 60)
    print("\nYou can now deploy to Railway with confidence.")
    print("\nTo test Gunicorn locally, run:")
    print("  PORT=8080 gunicorn wsgi:app --bind 0.0.0.0:8080")
    
except ImportError as e:
    print(f"\n❌ Import Error: {e}")
    print("\nMissing dependencies. Check requirements.txt")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Error creating app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
