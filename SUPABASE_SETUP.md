# 📋 GUIDE COMPLET : PostgreSQL Cloud avec Supabase

## ✅ ÉTAPE 1 : Créer un compte Supabase (Gratuit)

1. Aller sur https://supabase.com
2. Cliquer **"Start your project"**
3. Se connecter avec GitHub ou Email
4. Accepter les conditions

---

## 🏢 ÉTAPE 2 : Créer un projet Supabase

1. Cliquer **"New Project"**
2. Remplir le formulaire :
   - **Name** : `flowtrack`
   - **Database Password** : Créer un mot de passe fort (ex: `Abc123!@#XyZ`)
   - **Region** : Choisir une région proche (ex: `eu-west-1` pour Europe)
3. Cliquer **"Create new project"**
4. **Attendre 2-3 minutes** ⏳ (création en cours)

---

## 🔑 ÉTAPE 3 : Obtenir la Connection String

Une fois le projet créé :

1. Dans la sidebar, cliquer **"Settings"** → **"Database"**
2. Vous verrez une section **"Connection String"**
3. Copier l'URL de la forme :
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```
4. **Remplacer `[PASSWORD]`** par le mot de passe choisi à l'étape 2

**Exemple complet :**
```
postgresql://postgres:Abc123!@#XyZ@db.abcdefg12345.supabase.co:5432/postgres
```

---

## 🗄️ ÉTAPE 4 : Exécuter le Schéma SQL

### Méthode A : Via interface Supabase (Facile)

1. Dans Supabase, aller à **"SQL Editor"** (colonne gauche)
2. Cliquer **"New Query"**
3. Copier-coller **tout le contenu** de [`db/schema.sql`](db/schema.sql)
4. Cliquer **"Run"** ▶️
5. Vérifier le message **"Success"** ✅

### Méthode B : Via Terminal (Avancé)

```bash
# Remplacer avec votre URL
psql "postgresql://postgres:Abc123!@#XyZ@db.abcdefg12345.supabase.co:5432/postgres" \
  -f db/schema.sql
```

---

## 🛠️ ÉTAPE 5 : Configurer votre Projet Local

### 5.1 Installer les dépendances

```bash
cd /Users/fati/Downloads/flowtrack-ensa-remote2

npm install
```

Cela installe :
- `pg` → driver PostgreSQL
- `dotenv` → gestion des variables d'environnement

### 5.2 Créer le fichier `.env`

```bash
# Copier le template
cp .env.example .env

# Éditer avec votre éditeur
nano .env
```

**Contenu du `.env` :**
```
DATABASE_URL=postgresql://postgres:Abc123!@#XyZ@db.abcdefg12345.supabase.co:5432/postgres
PORT=3005
NODE_ENV=development
```

**⚠️ Important :**
- Ne JAMAIS commiter `.env` à Git
- Garder `.env.example` pour la documentation

---

## 🚀 ÉTAPE 6 : Lancer le Serveur

```bash
npm start
```

**Vous devriez voir :**
```
╔═══════════════════════════════════════════════════════════╗
║          🎓 FlowTrack - ENSA Fès Server                   ║
╚═══════════════════════════════════════════════════════════╝

📊 Database: ✅ PostgreSQL Connected
🚀 Server: http://localhost:3005
...
```

---

## 🧪 ÉTAPE 7 : Tester l'Application

### Test 1 : Page d'accueil
```
http://localhost:3005
```

### Test 2 : Créer un compte étudiant
1. Cliquer **"Espace Étudiant"** → **"S'inscrire"**
2. Remplir le formulaire :
   - Nom: Ahmed
   - Prénom: Aberqi
   - Email: ahmed@usmba.ac.ma
   - Code: 1234
   - Filière: info
3. Cliquer **"S'inscrire"**

### Test 3 : Vérifier la BD
1. Aller dans Supabase → **"Table Editor"**
2. Cliquer sur la table **"utilisateurs"**
3. **Vous devriez voir votre inscription** ✅

---

## 📱 ÉTAPE 8 : Accès depuis d'autres PC

Une fois déployé, n'importe quel PC peut accéder aux données :

### Optionnel : Déployer sur Internet

Pour que ce soit accessible de partout (pas seulement localement) :

#### Option A : Railway (Recommandé)

```bash
# 1. Installer Railway CLI
npm install -g railway

# 2. Se connecter
railway login

# 3. Créer un projet
railway init

# 4. Railway détecte Node.js et configure automatiquement

# 5. Pousser sur Railway
git push

# 6. Railway fournit une URL publique
# ex: https://flowtrack.railway.app
```

#### Option B : Render

```bash
# Se connecter à https://render.com
# Créer une "Web Service"
# Connecter avec GitHub
# Render déploie automatiquement
```

---

## 🔒 Checklist de Sécurité

- [ ] `.env` est dans `.gitignore`
- [ ] PASSWORD dans la BD Supabase est fort
- [ ] Vous avez sauvegardé votre `DATABASE_URL`
- [ ] Les tables PostgreSQL sont créées

---

## 🆘 Dépannage

### Erreur : "Cannot find module 'pg'"
```bash
npm install pg dotenv
```

### Erreur : "ECONNREFUSED localhost:3005"
Le serveur ne démarre pas. Vérifier :
```bash
# Vérifier Node.js
node --version  # doit être >= 14

# Vérifier npm
npm --version

# Réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "Connection refused" pour PostgreSQL
Vérifier que :
1. `DATABASE_URL` est correct dans `.env`
2. Supabase project est créé et actif
3. Mot de passe est correct

---

## ✨ Prochaines Étapes

1. **Ajouter authentification sécurisée** (JWT tokens)
2. **Déployer sur Internet** (Railway ou Render)
3. **Configurer CORS** pour accès cross-domain
4. **Ajouter backup automatique** Supabase
5. **Monitorer les logs** et erreurs

---

## 📞 Support

Si vous avez des erreurs :

1. Vérifier les **logs du serveur** (console)
2. Aller sur Supabase **"Logs"** pour voir erreurs BD
3. Vérifier `.env` a la bonne URL
4. Vérifier schema.sql a bien exécuté sans erreur

---

**Besoin d'aide ?** Consultez :
- https://supabase.com/docs
- https://www.postgresql.org/docs/

Bon développement ! 🚀
