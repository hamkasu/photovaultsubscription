#!/usr/bin/env python3
"""
Railway Deployment Monitor
Checks health and status of Railway production deployment
"""
import requests
import sys
from datetime import datetime
import time

RAILWAY_URL = "https://web-production-535bd.up.railway.app"
CHECK_INTERVAL = 5  # seconds

def check_endpoint(url, endpoint, name):
    """Check a specific endpoint and return status"""
    full_url = f"{url}{endpoint}"
    try:
        start_time = time.time()
        response = requests.get(full_url, timeout=10)
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        status_icon = "✅" if response.status_code == 200 else "❌"
        print(f"{status_icon} {name:20} | Status: {response.status_code:3} | Time: {response_time:6.0f}ms | {full_url}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data:
                    print(f"   Response: {data}")
            except:
                print(f"   Response: {response.text[:100]}")
        else:
            print(f"   Error: {response.text[:200]}")
        
        return response.status_code == 200
    except requests.exceptions.Timeout:
        print(f"⏱️  {name:20} | TIMEOUT (>10s) | {full_url}")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"🔌 {name:20} | CONNECTION ERROR | {full_url}")
        print(f"   Error: {str(e)[:200]}")
        return False
    except Exception as e:
        print(f"❌ {name:20} | ERROR | {full_url}")
        print(f"   Error: {str(e)[:200]}")
        return False

def monitor_deployment(continuous=False):
    """Monitor Railway deployment health"""
    endpoints = [
        ("/", "Homepage"),
        ("/health", "Health Check"),
        ("/api", "API Health"),
        ("/api/health/db", "Database Health"),
    ]
    
    iteration = 0
    while True:
        iteration += 1
        print("\n" + "="*80)
        print(f"🔍 Railway Deployment Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        if continuous:
            print(f"   Iteration #{iteration} (Ctrl+C to stop)")
        print("="*80)
        
        results = []
        for endpoint, name in endpoints:
            success = check_endpoint(RAILWAY_URL, endpoint, name)
            results.append((name, success))
        
        # Summary
        print("\n" + "-"*80)
        total = len(results)
        passed = sum(1 for _, success in results if success)
        failed = total - passed
        
        if passed == total:
            print(f"✅ ALL CHECKS PASSED ({passed}/{total})")
            print("🎉 Railway deployment is healthy!")
        else:
            print(f"⚠️  SOME CHECKS FAILED ({passed} passed, {failed} failed out of {total})")
            print("🔧 Review errors above and check Railway logs")
        
        if not continuous:
            break
        
        print(f"\n⏳ Waiting {CHECK_INTERVAL} seconds before next check...")
        print("   Press Ctrl+C to stop monitoring")
        time.sleep(CHECK_INTERVAL)

def main():
    """Main entry point"""
    print("🚀 PhotoVault Railway Deployment Monitor")
    print(f"📍 Target: {RAILWAY_URL}")
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] in ['--watch', '-w', 'watch']:
        print("👀 Continuous monitoring mode enabled")
        print(f"   Checking every {CHECK_INTERVAL} seconds")
        print()
        try:
            monitor_deployment(continuous=True)
        except KeyboardInterrupt:
            print("\n\n⏹️  Monitoring stopped by user")
            sys.exit(0)
    else:
        print("📊 Running single health check")
        print("   (Use --watch for continuous monitoring)")
        print()
        monitor_deployment(continuous=False)

if __name__ == "__main__":
    main()
