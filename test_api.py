#!/usr/bin/env python3
"""
API Endpoint Tester
Tests all critical API endpoints for both local and Railway deployments
"""
import requests
import sys
from datetime import datetime
import json

def test_endpoint(base_url, method, endpoint, name, data=None, headers=None, expected_status=200):
    """Test a single API endpoint"""
    url = f"{base_url}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            print(f"❌ Unknown method: {method}")
            return False
        
        status_match = response.status_code == expected_status
        icon = "✅" if status_match else "⚠️"
        
        print(f"\n{icon} {method} {endpoint}")
        print(f"   Name: {name}")
        print(f"   Status: {response.status_code} (expected: {expected_status})")
        
        try:
            json_data = response.json()
            print(f"   Response: {json.dumps(json_data, indent=2)[:200]}")
        except:
            print(f"   Response: {response.text[:200]}")
        
        return status_match
    except Exception as e:
        print(f"\n❌ {method} {endpoint}")
        print(f"   Name: {name}")
        print(f"   Error: {str(e)}")
        return False

def test_deployment(base_url, deployment_name):
    """Test all critical endpoints for a deployment"""
    print("\n" + "="*80)
    print(f"🧪 Testing {deployment_name}")
    print(f"📍 Base URL: {base_url}")
    print("="*80)
    
    results = []
    
    # Public endpoints (no auth required)
    print("\n📋 Public Endpoints")
    print("-" * 80)
    
    tests = [
        ("GET", "/", "Homepage", None, None, 200),
        ("GET", "/health", "Health Check", None, None, 200),
        ("GET", "/api", "API Health", None, None, 200),
        ("GET", "/api/health/db", "Database Health", None, None, 200),
        ("GET", "/auth/login", "Login Page", None, None, 200),
        ("GET", "/auth/register", "Register Page", None, None, 200),
    ]
    
    for method, endpoint, name, data, headers, expected in tests:
        success = test_endpoint(base_url, method, endpoint, name, data, headers, expected)
        results.append((name, success))
    
    # Mobile API endpoints (would require JWT token for full test)
    print("\n\n📱 Mobile API Endpoints (Basic Check)")
    print("-" * 80)
    
    mobile_tests = [
        ("POST", "/api/auth/login", "Mobile Login", {"username": "test", "password": "test"}, None, [200, 401]),
        ("POST", "/api/auth/register", "Mobile Register", {"username": "test", "password": "test", "email": "test@test.com"}, None, [200, 400]),
    ]
    
    for method, endpoint, name, data, headers, expected_statuses in mobile_tests:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.post(url, json=data, headers=headers, timeout=10)
            status_match = response.status_code in expected_statuses if isinstance(expected_statuses, list) else response.status_code == expected_statuses
            icon = "✅" if status_match else "⚠️"
            
            print(f"\n{icon} {method} {endpoint}")
            print(f"   Name: {name}")
            print(f"   Status: {response.status_code} (expected one of: {expected_statuses})")
            
            try:
                print(f"   Response: {json.dumps(response.json(), indent=2)[:200]}")
            except:
                print(f"   Response: {response.text[:200]}")
            
            results.append((name, status_match))
        except Exception as e:
            print(f"\n❌ {method} {endpoint}")
            print(f"   Error: {str(e)}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*80)
    print(f"📊 Test Summary for {deployment_name}")
    print("="*80)
    
    total = len(results)
    passed = sum(1 for _, success in results if success)
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print("\n⚠️  Some tests failed - review details above")
        print("\nFailed tests:")
        for name, success in results:
            if not success:
                print(f"  ❌ {name}")
    
    return passed == total

def main():
    """Main entry point"""
    print("🚀 PhotoVault API Endpoint Tester")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    target = sys.argv[1] if len(sys.argv) > 1 else "both"
    
    if target in ["local", "both"]:
        test_deployment("http://localhost:5000", "Local Development Server")
    
    if target in ["railway", "both"]:
        test_deployment("https://web-production-535bd.up.railway.app", "Railway Production")
    
    if target not in ["local", "railway", "both"]:
        print("\n❓ Usage:")
        print("  python test_api.py          # Test both local and Railway")
        print("  python test_api.py local    # Test local only")
        print("  python test_api.py railway  # Test Railway only")

if __name__ == "__main__":
    main()
