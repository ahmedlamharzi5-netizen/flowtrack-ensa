#!/bin/bash

# Script d'installation complet pour FlowTrack
# Utilisation: bash install.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🎓 FlowTrack - Installation Complète                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier Node.js
echo "📋 Vérification des prérequis..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trouvé"
    echo ""
    echo "💡 Installation Node.js :"
    echo "  macOS: brew install node"
    echo "  ou télécharger : https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION trouvé"

if ! command -v npm &> /dev/null; then
    echo "❌ npm non trouvé"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm $NPM_VERSION trouvé"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances npm..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "═════════════════════════════════════════════════════════════"
    echo "✨ Installation réussie !"
    echo "═════════════════════════════════════════════════════════════"
    echo ""
    echo "📝 Prochaines étapes :"
    echo ""
    echo "1️⃣  Créer un compte Supabase (gratuit)"
    echo "   → https://supabase.com"
    echo ""
    echo "2️⃣  Copier la Connection String PostgreSQL"
    echo "   → Supabase → Settings → Database"
    echo ""
    echo "3️⃣  Créer un fichier .env"
    echo "   $ cp .env.example .env"
    echo "   $ nano .env  # Éditer avec votre URL"
    echo ""
    echo "4️⃣  Initialiser la base de données"
    echo "   $ npm run setup-db"
    echo ""
    echo "5️⃣  Lancer le serveur"
    echo "   $ npm start"
    echo ""
    echo "6️⃣  Ouvrir http://localhost:3005 dans le navigateur"
    echo ""
    echo "═════════════════════════════════════════════════════════════"
    echo ""
    echo "📚 Documentation :"
    echo "  • QUICKSTART.md - Démarrage rapide"
    echo "  • SUPABASE_SETUP.md - Guide complet Supabase"
    echo "  • RAILWAY_DEPLOY.md - Déployer sur le web"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de l'installation"
    echo "Vérifiez votre connexion internet et réessayez"
    exit 1
fi
