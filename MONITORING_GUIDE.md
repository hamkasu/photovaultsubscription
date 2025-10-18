# 📊 PhotoVault Monitoring & Debug Scripts

Complete guide to monitoring your local and Railway deployments.

## 🛠️ Available Scripts

### 1. **monitor_railway.py** - Railway Production Monitor
Monitors your Railway deployment health in real-time.

**Usage:**
```bash
# Single check
python monitor_railway.py

# Continuous monitoring (updates every 5 seconds)
python monitor_railway.py --watch
```

**What it checks:**
- ✅ Homepage is accessible
- ✅ Health check endpoint responds
- ✅ API health endpoint responds
- ✅ Database health check passes
- ⏱️ Response times for each endpoint
- 🔍 Detailed error messages if failures occur

**Example output:**
```
✅ Homepage              | Status: 200 | Time:   245ms | https://web-production-535bd.up.railway.app/
✅ Health Check          | Status: 200 | Time:    89ms | https://web-production-535bd.up.railway.app/health
✅ API Health            | Status: 200 | Time:    67ms | https://web-production-535bd.up.railway.app/api
✅ Database Health       | Status: 200 | Time:   156ms | https://web-production-535bd.up.railway.app/api/health/db

✅ ALL CHECKS PASSED (4/4)
🎉 Railway deployment is healthy!
```

---

### 2. **monitor_local.py** - Local Development Monitor
Monitors your Replit development server.

**Usage:**
```bash
# Single check
python monitor_local.py

# Continuous monitoring (updates every 3 seconds)
python monitor_local.py --watch
```

**What it checks:**
- ✅ Local server is running on port 5000
- ✅ All HTTP endpoints respond correctly
- ✅ Database connectivity (direct connection test)
- 📊 Database statistics (user count, photo count, plans)

**Example output:**
```
✅ Homepage              | Status: 200 | Time:    12ms
✅ Health Check          | Status: 200 | Time:     8ms
✅ Database              | Connected and responsive
   📊 Users: 5 | Photos: 46 | Plans: 5

✅ ALL CHECKS PASSED (5/5)
🎉 Local server is healthy!
```

---

### 3. **test_api.py** - API Endpoint Tester
Comprehensive test of all critical API endpoints.

**Usage:**
```bash
# Test both local and Railway
python test_api.py

# Test local only
python test_api.py local

# Test Railway only
python test_api.py railway
```

**What it tests:**
- ✅ Public endpoints (homepage, login, register)
- ✅ Health check endpoints
- ✅ Mobile API endpoints (login, register)
- 📊 Success rate percentage
- 📋 Detailed test results for each endpoint

**Example output:**
```
🧪 Testing Railway Production
📍 Base URL: https://web-production-535bd.up.railway.app

📋 Public Endpoints
✅ GET /
   Name: Homepage
   Status: 200 (expected: 200)
   
📊 Test Summary for Railway Production
Total Tests: 8
✅ Passed: 8
❌ Failed: 0
Success Rate: 100.0%

🎉 All tests passed!
```

---

### 4. **check_logs.sh** - Quick Log Viewer
View recent logs from both PhotoVault and Expo servers.

**Usage:**
```bash
# View recent logs
./check_logs.sh
```

**What it shows:**
- 📋 Last 20 lines from PhotoVault Server logs
- 📋 Last 20 lines from Expo Server logs
- ⚠️ Error/exception detection
- 💡 Tips for real-time log monitoring

---

## 🚀 Quick Start Guide

### Daily Health Check
Run this every morning to check if everything is working:

```bash
# 1. Check local server
python monitor_local.py

# 2. Check Railway production
python monitor_railway.py

# 3. Run full API tests
python test_api.py
```

---

### Debugging Workflow Issues

**If PhotoVault Server isn't responding:**

```bash
# 1. Check if it's running
./check_logs.sh

# 2. Monitor health in real-time
python monitor_local.py --watch

# 3. Look for specific errors in logs
grep -i "error" /tmp/logs/PhotoVault_Server_*.log
```

**If Railway is down (502 errors):**

```bash
# 1. Monitor Railway health
python monitor_railway.py --watch

# 2. Check if it's a temporary issue
# (Watch for 1-2 minutes to see if it recovers)

# 3. Review Railway logs in dashboard
# Go to: https://railway.app → Your project → Logs
```

---

### Pre-Deployment Checklist

Before deploying to Railway, verify local environment:

```bash
# 1. Ensure local server is healthy
python monitor_local.py
# ✅ All checks should pass

# 2. Test all API endpoints
python test_api.py local
# ✅ Should show 100% success rate

# 3. Check for errors in logs
./check_logs.sh
# ✅ Should show "No errors found"

# 4. Commit and push changes
git add .
git commit -m "Your commit message"
git push origin main

# 5. Monitor Railway deployment
python monitor_railway.py --watch
# ⏳ Wait ~5-10 minutes for Railway to rebuild
# ✅ Should show all checks passing when ready
```

---

### Post-Deployment Verification

After Railway finishes deploying:

```bash
# 1. Quick health check
python monitor_railway.py

# 2. Full API test
python test_api.py railway

# 3. Test iOS app connection
# Open Expo Go app and scan QR code
# Try: Login → Upload Photo → View Gallery
```

---

## 📱 Mobile App Testing

### Test iOS App Connection

```bash
# 1. Ensure Railway is healthy
python monitor_railway.py

# 2. Start Expo server
# (Already running in workflow)

# 3. Test from iOS device
# - Scan QR code in Expo Go
# - Try login/register
# - Upload test photo
# - Verify photo appears in gallery
```

---

## 🔧 Troubleshooting

### "Connection Error" in monitor scripts

**Problem**: Scripts can't connect to server

**Solutions**:
1. Check if PhotoVault Server workflow is running
2. Restart workflow: In Replit UI → Stop → Start
3. Wait 10-15 seconds for server to fully initialize
4. Try monitoring again

---

### "All checks failed" on Railway

**Problem**: Railway deployment is completely down

**Solutions**:
1. Check Railway dashboard for build/deploy errors
2. Review recent commits for breaking changes
3. Check Railway logs for stack traces
4. Verify environment variables are set correctly
5. Try redeploying: Railway dashboard → Redeploy

---

### High response times (>1000ms)

**Problem**: Server responding slowly

**Solutions**:
1. Check Railway resource usage (CPU/Memory)
2. Consider scaling up workers in Gunicorn config
3. Review slow database queries
4. Check if models are loading efficiently

---

## 📊 Understanding Output

### Status Codes
- ✅ **200**: Success - endpoint working perfectly
- ✅ **302**: Redirect - normal for some pages (login redirects)
- ⚠️ **400**: Bad Request - check request format
- ⚠️ **401**: Unauthorized - authentication required
- ⚠️ **404**: Not Found - endpoint doesn't exist
- ❌ **500**: Server Error - check logs for details
- ❌ **502**: Bad Gateway - server not responding (Railway issue)
- ⏱️ **Timeout**: Request took >10 seconds

### Response Times
- 🟢 **<100ms**: Excellent
- 🟡 **100-500ms**: Good
- 🟠 **500-1000ms**: Acceptable
- 🔴 **>1000ms**: Slow - investigate

---

## 🤖 Automation Ideas

### Continuous Monitoring (Background)

Run monitoring in background while you work:

```bash
# Terminal 1: Monitor local server
python monitor_local.py --watch

# Terminal 2: Monitor Railway
python monitor_railway.py --watch

# Terminal 3: Your normal development work
```

### Scheduled Health Checks

Add to cron for automated checks (if on Linux/Mac):

```bash
# Check Railway health every 5 minutes
*/5 * * * * cd /path/to/project && python monitor_railway.py >> monitor.log 2>&1
```

---

## 💡 Pro Tips

1. **Keep monitor running during development**
   - Helps catch issues immediately
   - Shows impact of code changes in real-time

2. **Check Railway before iOS app testing**
   - Saves time debugging iOS issues that are actually server issues
   - Ensures backend is ready before frontend testing

3. **Compare local vs Railway results**
   - If local works but Railway fails → deployment issue
   - If both fail → code issue

4. **Monitor during deployment**
   - Watch Railway monitor during deploy
   - You'll see exactly when new version goes live

5. **Save test results**
   - Redirect output to file for later review:
     ```bash
     python test_api.py > test_results.txt
     ```

---

## 🆘 Need Help?

If monitoring shows persistent issues:

1. **Check Railway logs**: Most detailed error information
2. **Review recent commits**: Did something change?
3. **Check database**: Is PostgreSQL accessible?
4. **Verify environment variables**: Are secrets set correctly?
5. **Try local deployment**: Does it work on Replit?

---

## 📝 Logging Tips

### View real-time logs:

```bash
# PhotoVault Server
tail -f /tmp/logs/PhotoVault_Server_*.log

# Expo Server
tail -f /tmp/logs/Expo_Server_*.log

# Search for specific errors
grep -i "error\|exception" /tmp/logs/PhotoVault_Server_*.log | tail -20
```

### Common log patterns to search for:

- Database errors: `grep -i "database\|postgresql" logs.txt`
- Authentication issues: `grep -i "auth\|login\|token" logs.txt`
- API errors: `grep -i "api\|endpoint" logs.txt`
- Worker issues: `grep -i "worker\|timeout\|gunicorn" logs.txt`

---

**Happy Monitoring! 🚀**
