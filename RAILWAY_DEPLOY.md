# 🚀 Guide Rapide : Déployer sur Railway (Production)

## ✅ Étape 1 : Installer Railway CLI

```bash
npm install -g railway
```

## ✅ Étape 2 : Se connecter à Railway

```bash
railway login
```

Se connecter avec GitHub ou Email.

## ✅ Étape 3 : Initialiser le projet

```bash
cd /Users/fati/Downloads/flowtrack-ensa-remote2
railway init
```

Railway vous demande :
- **Project name** : `flowtrack`
- **Add plugins** : Choisir `PostgreSQL` ✅

## ✅ Étape 4 : Configurer les variables

Railway détecte automatiquement `DATABASE_URL` de PostgreSQL.

Pour vérifier/ajouter d'autres variables :

```bash
railway variables list
```

## ✅ Étape 5 : Déployer

```bash
# Première déploiement
railway up

# Ou via Git (si connecté)
git add .
git commit -m "Deploy with PostgreSQL"
git push
```

## ✅ Étape 6 : Accéder à l'app

Une fois déployée, Railway fournit une URL :

```
https://flowtrack-prod.railway.app
```

Accessibles depuis n'importe quel PC ! 🎉

## 📊 Monitorer

```bash
# Voir les logs
railway logs

# Voir l'état
railway status

# Ouvrir le dashboard
railway open
```

---

## 🔧 Alternative : Utiliser `.env` sur Railway

Si vous avez des variables custom :

```bash
# Ajouter une variable
railway variables set MY_VAR=value

# Lister
railway variables list
```

---

**Besoin d'aide ?** https://docs.railway.app
