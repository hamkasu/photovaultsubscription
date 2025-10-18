#!/usr/bin/env python3
"""
Local Server Monitor
Checks health and status of local Replit development server
"""
import requests
import sys
from datetime import datetime
import time
import os

LOCAL_URL = "http://localhost:5000"
CHECK_INTERVAL = 3  # seconds

def check_endpoint(url, endpoint, name, auth=None):
    """Check a specific endpoint and return status"""
    full_url = f"{url}{endpoint}"
    headers = {}
    if auth:
        headers['Authorization'] = f'Bearer {auth}'
    
    try:
        start_time = time.time()
        response = requests.get(full_url, headers=headers, timeout=5)
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        status_icon = "✅" if response.status_code in [200, 302] else "❌"
        print(f"{status_icon} {name:20} | Status: {response.status_code:3} | Time: {response_time:6.0f}ms")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data:
                    print(f"   📦 {data}")
            except:
                text = response.text[:150]
                if text:
                    print(f"   📄 {text}...")
        
        return response.status_code in [200, 302]
    except requests.exceptions.Timeout:
        print(f"⏱️  {name:20} | TIMEOUT (>5s)")
        return False
    except requests.exceptions.ConnectionError:
        print(f"🔌 {name:20} | CONNECTION ERROR - Server not running?")
        return False
    except Exception as e:
        print(f"❌ {name:20} | ERROR: {str(e)[:100]}")
        return False

def check_database():
    """Check database connectivity"""
    try:
        from photovault.extensions import db
        from photovault import create_app
        
        app = create_app()
        with app.app_context():
            db.session.execute(db.text('SELECT 1'))
            print("✅ Database           | Connected and responsive")
            
            # Count some key tables
            from photovault.models import User, Photo, SubscriptionPlan
            user_count = User.query.count()
            photo_count = Photo.query.count()
            plan_count = SubscriptionPlan.query.count()
            
            print(f"   📊 Users: {user_count} | Photos: {photo_count} | Plans: {plan_count}")
            return True
    except Exception as e:
        print(f"❌ Database           | ERROR: {str(e)[:100]}")
        return False

def monitor_local(continuous=False):
    """Monitor local development server health"""
    endpoints = [
        ("/", "Homepage", None),
        ("/health", "Health Check", None),
        ("/api", "API Health", None),
        ("/api/health/db", "Database Health", None),
    ]
    
    iteration = 0
    while True:
        iteration += 1
        print("\n" + "="*80)
        print(f"🏠 Local Server Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        if continuous:
            print(f"   Iteration #{iteration} (Ctrl+C to stop)")
        print("="*80)
        
        results = []
        
        # Check HTTP endpoints
        for endpoint, name, auth in endpoints:
            success = check_endpoint(LOCAL_URL, endpoint, name, auth)
            results.append((name, success))
        
        # Check database directly
        db_success = check_database()
        results.append(("Database Direct", db_success))
        
        # Summary
        print("\n" + "-"*80)
        total = len(results)
        passed = sum(1 for _, success in results if success)
        failed = total - passed
        
        if passed == total:
            print(f"✅ ALL CHECKS PASSED ({passed}/{total})")
            print("🎉 Local server is healthy!")
        else:
            print(f"⚠️  SOME CHECKS FAILED ({passed} passed, {failed} failed out of {total})")
            
            # Check if server is running at all
            if not any(success for _, success in results[:4]):
                print("💡 Is the PhotoVault Server workflow running?")
                print("   Start it with: python dev.py")
        
        if not continuous:
            break
        
        print(f"\n⏳ Waiting {CHECK_INTERVAL} seconds before next check...")
        print("   Press Ctrl+C to stop monitoring")
        time.sleep(CHECK_INTERVAL)

def main():
    """Main entry point"""
    print("🚀 PhotoVault Local Server Monitor")
    print(f"📍 Target: {LOCAL_URL}")
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] in ['--watch', '-w', 'watch']:
        print("👀 Continuous monitoring mode enabled")
        print(f"   Checking every {CHECK_INTERVAL} seconds")
        print()
        try:
            monitor_local(continuous=True)
        except KeyboardInterrupt:
            print("\n\n⏹️  Monitoring stopped by user")
            sys.exit(0)
    else:
        print("📊 Running single health check")
        print("   (Use --watch for continuous monitoring)")
        print()
        monitor_local(continuous=False)

if __name__ == "__main__":
    main()
