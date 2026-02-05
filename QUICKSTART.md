# 🚀 FlowTrack - Démarrage Rapide avec PostgreSQL

## 📦 Prérequis

- **Node.js** 14+ (https://nodejs.org)
- **npm** ou yarn
- Compte **Supabase** gratuit (https://supabase.com)

---

## ⚡ 5 Minutes pour Démarrer

### 1️⃣ Créer un compte Supabase

Aller sur https://supabase.com et créer un **nouveau projet gratuit**.

### 2️⃣ Copier la Connection String

Dans Supabase → Settings → Database → Connection String, copier l'URL PostgreSQL.

### 3️⃣ Configurer le projet local

```bash
# Cloner/ouvrir le projet
cd /Users/fati/Downloads/flowtrack-ensa-remote2

# Créer le fichier .env
cp .env.example .env

# Éditer .env avec votre URL Supabase
nano .env
```

Remplacer dans `.env` :
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```

### 4️⃣ Installer et initialiser

```bash
# Installer les dépendances
npm install

# Initialiser la base de données
npm run setup-db
```

### 5️⃣ Lancer le serveur

```bash
npm start
```

Ouvrir http://localhost:3005 🎉

---

## 📚 Documentation Complète

- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Guide détaillé Supabase
- **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)** - Déployer sur le web
- **[DEMARRAGE.md](DEMARRAGE.md)** - Lancer sans Base de Données
- **[README.md](README.md)** - Documentation générale

---

## 🧪 Tester l'application

1. Aller sur http://localhost:3005
2. Cliquer "Espace Étudiant"
3. Cliquer "S'inscrire"
4. Créer un compte test
5. Vérifier dans Supabase que l'utilisateur est dans la BD ✅

---

## ⚠️ Erreurs Courantes

| Erreur | Solution |
|--------|----------|
| "Cannot find module 'pg'" | `npm install pg dotenv` |
| "DATABASE_URL not set" | Vérifier `.env` |
| "Connection refused" | Vérifier URL Supabase |
| Port 3005 déjà utilisé | `PORT=3006 npm start` |

---

## 🔐 Sécurité

✅ **Ne jamais** commiter `.env`  
✅ Garder `DATABASE_URL` secret  
✅ Utiliser des mots de passe forts  
✅ Activer HTTPS en production  

---

## 🚀 Prochaines Étapes

1. ✅ Configurer Supabase (5 min)
2. ✅ Lancer le serveur (1 min)
3. ⏳ Déployer sur Railway (15 min)
4. ⏳ Configurer CORS (5 min)
5. ⏳ Ajouter JWT authentication (20 min)

---

## 💬 Support

Besoin d'aide ?
- Supabase Docs: https://supabase.com/docs
- Railway Docs: https://docs.railway.app
- PostgreSQL Docs: https://www.postgresql.org/docs

Bon développement ! 🎓
