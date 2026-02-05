# ⚡ Quick Reference - FlowTrack Auth System

## 🎯 What's Fixed

✅ **Signup:** Users can now register with passwords that are properly stored  
✅ **Login:** Users can login with the password they registered with  
✅ **Database:** Both signup and login use PostgreSQL (Railway)  
✅ **Logging:** All operations logged with detailed information  
✅ **Testing:** All 3 authentication tests pass  

---

## 🚀 Quick Start

### Run Server
```bash
npm start > /tmp/server.log 2>&1 &
```

### View Logs
```bash
tail -50 /tmp/server.log
```

### Test Signup (via API)
```bash
curl -X POST http://localhost:3005/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "nom":"DUPONT",
    "prenom":"Alice",
    "email_academique":"alice@usmba.ac.ma",
    "code":"password123"
  }'
```

**Expected:** `{"ok":true,"id_user":7,"message":"User registered successfully"}`

### Test Login (via API)
```bash
curl -X POST http://localhost:3005/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"alice@usmba.ac.ma",
    "code":"password123"
  }'
```

**Expected:** `{"ok":true,"user":{"id_user":7,"nom":"DUPONT",...}}`

### Test Wrong Password
```bash
curl -X POST http://localhost:3005/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"alice@usmba.ac.ma",
    "code":"wrongpassword"
  }'
```

**Expected:** `{"error":"Invalid code (password)","ok":false}`

---

## 📋 API Reference

### POST /api/signup
**Request:**
```json
{
  "nom": "String (required)",
  "prenom": "String (required)",
  "email_academique": "email@usmba.ac.ma (required)",
  "code": "password (required)",
  "num": "Integer (optional)",
  "filiere": "String (optional)"
}
```

**Success (201):**
```json
{
  "ok": true,
  "id_user": 7,
  "message": "User registered successfully"
}
```

**Errors:**
- 400: Missing fields or invalid email domain
- 409: Email already exists
- 500: Database error

---

### POST /api/login
**Request:**
```json
{
  "email": "email@usmba.ac.ma (required)",
  "code": "password (required)"
}
```

**Success (200):**
```json
{
  "ok": true,
  "user": {
    "id_user": 7,
    "nom": "DUPONT",
    "prenom": "Alice",
    "email_academique": "alice@usmba.ac.ma",
    "id_role": 2,
    "modules": {}
  }
}
```

**Errors:**
- 400: Missing email or code
- 401: User not found or wrong password
- 500: Database error

---

## 🔍 Common Issues & Fixes

### "Code (password) is required" (400)
**Cause:** Signup request missing `code` field  
**Fix:** Add `code` parameter with password

### "Invalid code (password)" (401)
**Cause:** Wrong password provided  
**Fix:** Check password carefully, verify signup succeeded first

### "Email must be an academic address" (400)
**Cause:** Email doesn't end with @usmba.ac.ma  
**Fix:** Use valid academic email (firstname.lastname@usmba.ac.ma)

### User can signup but not login
**Cause:** Database inconsistency  
**Fix:** Check logs:
```bash
tail -50 /tmp/server.log | grep -E "SIGNUP|LOGIN"
```

### Server not starting
**Cause:** Port 3005 already in use or code error  
**Fix:**
```bash
pkill -f "node server"
sleep 2
npm start > /tmp/server.log 2>&1 &
tail -20 /tmp/server.log  # Check for errors
```

---

## 📊 Database Verification

### Check if user exists
```bash
psql "$DATABASE_URL" -c "SELECT id_user, email_academique FROM utilisateurs WHERE email_academique='alice@usmba.ac.ma';"
```

### Check user password
```bash
psql "$DATABASE_URL" -c "SELECT email_academique, code FROM utilisateurs WHERE email_academique='alice@usmba.ac.ma';"
```

### List all users
```bash
psql "$DATABASE_URL" -c "SELECT id_user, nom, prenom, email_academique FROM utilisateurs LIMIT 10;"
```

---

## 🎯 Testing Workflow

### 1. Test API (Command Line)
✅ Use curl commands above  
✅ Verify response and logs  

### 2. Test Frontend (Browser)
- [ ] Go to http://localhost:3005/signup.html
- [ ] Submit signup form
- [ ] Go to http://localhost:3005/login.html
- [ ] Submit login form
- [ ] Verify you can see your profile

### 3. Test Production
- [ ] Git commit changes
- [ ] Git push to GitHub
- [ ] Wait for Railway deployment (2-3 min)
- [ ] Test at https://flowtrack-ensa-production.up.railway.app

---

## 📝 Code Locations

| Component | File | Lines |
|-----------|------|-------|
| Signup Handler | [server.js](server.js) | 62-155 |
| Login Handler | [server.js](server.js) | 230-319 |
| Signup Form | [signup.html](signup.html) | - |
| Login Form | [login.html](login.html) | - |
| Frontend JS | [js/script.js](js/script.js) | - |

---

## 🔐 Security

⚠️ **Current:** Passwords stored in plain text  
✅ **Recommended:** Use bcrypt hashing (see NEXT_STEPS.md)

---

## 📞 When Stuck

1. Check logs: `tail -100 /tmp/server.log`
2. Search logs for errors: `tail -100 /tmp/server.log | grep "ERROR\|FAILED"`
3. Test API directly with curl
4. Check database: `psql "$DATABASE_URL" -c "SELECT * FROM utilisateurs;"`
5. Restart server: `pkill -f "node server" ; npm start > /tmp/server.log 2>&1 &`

---

## ✅ Done!

Your authentication system is fixed and tested. Next steps:
1. Frontend integration testing
2. Optional: Bcrypt password hashing
3. Deploy to production

Detailed instructions in: **NEXT_STEPS.md**  
Full report in: **AUTHENTICATION_FIX_REPORT.md**
