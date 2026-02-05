# 🚀 Railway Re-initialization Guide

If your Railway database is outdated or needs to be reset, follow these steps:

## ⚠️ When to Re-initialize:

- After major schema changes (new columns added)
- If tests accounts are missing
- If login is not working correctly
- After updating to a new version

## 🔧 How to Re-initialize on Railway:

### Option 1: Using Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your **flowtrack-ensa** project
3. Find your PostgreSQL database service
4. Go to **Connect** tab
5. Copy the connection string (if you need it)
6. Go back to your project's **Web Service**
7. In the **Deployments** section, click the most recent deployment
8. Wait for it to finish, then in the service logs you should see the setup complete

### Option 2: Manual Reset via Database Credentials

If you have direct database access:

```bash
# 1. Connect to Railway PostgreSQL
psql postgresql://user:password@host:port/database

# 2. Reset tables
DROP TABLE IF EXISTS logs_pointage CASCADE;
DROP TABLE IF EXISTS seances CASCADE;
DROP TABLE IF EXISTS matieres CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS groupes CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

# 3. Disconnect
\q
```

Then redeploy the app on Railway (it will run setup-db.js automatically).

### Option 3: Via Terminal / SSH (if available)

```bash
# SSH into your Railway instance and run:
npm run reset-db
```

## ✅ Verify Setup Completed

After re-initialization, test the login:

```bash
curl -X POST https://flowtrack-ensa-production.up.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@usmba.ac.ma","code":"secret"}'
```

You should get:
```json
{
  "ok": true,
  "user": {
    "id_user": 2,
    "nom": "ANAS",
    "prenom": "Test",
    "email_academique": "test@usmba.ac.ma",
    "id_role": 2
  }
}
```

## 📋 Test Accounts After Setup

- **Étudiant:** test@usmba.ac.ma / secret
- **Professeur:** professeur / ensa2024

## 🆘 If Still Having Issues

1. Check Railway logs for errors:
   - Dashboard → Your Project → Web Service → Logs
   
2. Verify DATABASE_URL is set:
   - Dashboard → Your Project → Settings → Environment
   
3. Check database connection:
   - Dashboard → Your Project → PostgreSQL → Logs

## 📝 Notes

- The database is re-created from scratch each time you reset
- All existing data will be deleted
- New test accounts are automatically created
- Setup takes 1-2 minutes after deployment
