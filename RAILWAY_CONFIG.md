# 🚀 Configuration Railway - Guide Complet

## ⚠️ Problème Actuel

La base de données Railway n'est pas accessible car la variable `DATABASE_URL` n'est pas configurée dans le dashboard Railway.

## ✅ Solution Rapide (3 étapes)

### Étape 1: Ouvrir le Dashboard Railway

Allez à: https://railway.app/dashboard

### Étape 2: Ajouter la Variable d'Environnement

1. Sélectionnez votre projet **flowtrack-ensa**
2. Allez dans **Settings** (roue dentée)
3. Cliquez sur **Environment**
4. Cliquez sur **+ Add Variable**
5. Remplissez:
   - **Name:** `DATABASE_URL`
   - **Value:** Copiez-collez votre chaîne de connexion Railway

```
postgresql://postgres:jJzIqjycnQByKukYbKTxRvTTOoAaWDVj@gondola.proxy.rlwy.net:19359/railway
```

6. Cliquez **Add**

### Étape 3: Redéployer

1. Allez à **Deployments**
2. Attendez que le déploiement se termine (vert)
3. Une fois que c'est vert, visitez:

```
https://flowtrack-ensa-production.up.railway.app/api/init-db
```

en POST (utilisez curl ou Postman)

## 🔍 Vérification

Après avoir ajouté la variable, vérifiez:

```bash
# Vérifier la connexion
curl -X POST https://flowtrack-ensa-production.up.railway.app/api/init-db

# Vous devriez obtenir:
# {"ok":true,"message":"Database initialized successfully"}

# Puis testez le login
curl -X POST https://flowtrack-ensa-production.up.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@usmba.ac.ma","code":"secret"}'
```

## 📝 Notes importantes

- Les variables d'environnement doivent être ajoutées **avant** le déploiement ou le service doit être redéployé après
- Railway redéploie automatiquement après 1-2 minutes
- La base de données sera vide après init-db (ça crée les tables et les données de test)

## 🆘 Si ça ne marche toujours pas

1. Vérifiez que DATABASE_URL est bien visible dans Railway Dashboard → Settings
2. Vérifiez que la chaîne de connexion est correcte (pas d'espaces)
3. Attendez 5 minutes après l'ajout de la variable
4. Forcez un redéploiement: Dashboard → Deployments → [latest] → Redeploy

## 💡 Alternative: Utiliser Supabase à la place

Si vous préférez, vous pouvez utiliser Supabase Cloud (gratuit):

1. Créez un compte à: https://supabase.com
2. Créez un nouveau projet
3. Copiez la chaîne de connexion depuis "Connection String"
4. Ajouter à Railway en tant que DATABASE_URL

C'est plus simple et plus fiable que PostgreSQL local!
