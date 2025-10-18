# 📋 PhotoVault Quick Reference Card

## 🚀 Monitoring Commands

```bash
# Check local server health
python monitor_local.py

# Check Railway deployment
python monitor_railway.py

# Test all API endpoints
python test_api.py

# View recent logs
./check_logs.sh

# Continuous monitoring (Ctrl+C to stop)
python monitor_local.py --watch
python monitor_railway.py --watch
```

## 🔧 Common Tasks

### Start Development Server
```bash
python dev.py
```

### Start Expo Server
```bash
cd StoryKeep-iOS && npx expo start --tunnel
```

### Deploy to Railway
```bash
git add .
git commit -m "Your message"
git push origin main
# Railway auto-deploys from GitHub
```

### Check Server Status
```bash
# Local server should show:
# ✅ Homepage, Health Check, API Health, Database Health
python monitor_local.py

# Railway should show:
# ✅ All endpoints responding with 200 status
python monitor_railway.py
```

## 🌐 URLs

- **Local Development**: http://localhost:5000
- **Railway Production**: https://web-production-535bd.up.railway.app
- **Expo Tunnel**: Check workflow output for current URL (changes on restart)

## 📱 Mobile Testing

```bash
# 1. Ensure Railway is healthy
python monitor_railway.py

# 2. Get Expo QR code
# Look in Expo Server workflow output

# 3. Scan QR in Expo Go app
# iOS: Expo Go app
# Android: Expo Go app
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Local server not responding | Restart PhotoVault Server workflow |
| Railway 502 errors | Push latest code, wait 5-10min for rebuild |
| Expo not showing QR | Restart Expo Server workflow |
| Database errors | Check PostgreSQL connection in Railway |
| API tests failing | Run `python monitor_local.py` to diagnose |

## 🔍 Quick Diagnostics

```bash
# Is local server working?
curl http://localhost:5000/health
# Should return: OK

# Is Railway working?
curl https://web-production-535bd.up.railway.app/health
# Should return: OK

# Check database
curl http://localhost:5000/api/health/db
# Should return: {"status":"ok","database":"connected"}
```

## 📊 Status Code Guide

- **200**: ✅ Success
- **302**: ✅ Redirect (normal)
- **400**: ❌ Bad request
- **401**: ❌ Unauthorized
- **404**: ❌ Not found
- **500**: ❌ Server error
- **502**: ❌ Bad gateway (Railway down)

## 🎯 Daily Workflow

```bash
# Morning check
python monitor_local.py
python monitor_railway.py

# During development
python monitor_local.py --watch  # In separate terminal

# Before committing
python test_api.py local

# After Railway deploy
python monitor_railway.py --watch  # Watch until healthy
```

## 🔥 Emergency Fixes

### Railway is down
```bash
# 1. Check Railway dashboard logs
# 2. Verify latest commit didn't break anything
# 3. If needed, rollback in Railway dashboard
# 4. Or push a fix and wait for redeploy
```

### Local database issues
```bash
# Reset local database
python -c "from photovault import create_app; from photovault.extensions import db; app = create_app(); app.app_context().push(); db.drop_all(); db.create_all()"
```

### Workflows crashed
```bash
# Restart both workflows from Replit UI
# Or restart from command line
```

## 💡 Pro Tips

1. **Always check local first** - If local works but Railway fails, it's a deployment issue
2. **Monitor during deploy** - Watch Railway health while it rebuilds
3. **Save test outputs** - Redirect to file: `python test_api.py > results.txt`
4. **Use --watch mode** - Keep monitoring running during development
5. **Check logs often** - `./check_logs.sh` shows recent errors

---

**Keep this file open for quick reference during development! 🚀**
