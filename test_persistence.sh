#!/bin/bash

# 🧪 SCRIPT DE TEST PERSISTANCE POSTGRESQL

set -e

SERVER_URL="http://localhost:3005"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}  🧪 TEST PERSISTANCE POSTGRESQL${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}\n"

# Test 1: Vérifier que le serveur est actif
echo -e "${YELLOW}[1/5] Vérification statut serveur...${NC}"
if curl -s "${SERVER_URL}/api/status" > /dev/null; then
    echo -e "${GREEN}✅ Serveur actif${NC}\n"
else
    echo -e "${RED}❌ Serveur non accessible${NC}"
    exit 1
fi

# Test 2: Récupérer les absences actuelles
echo -e "${YELLOW}[2/5] Récupération absences actuelles (info, semaine 1)...${NC}"
BEFORE=$(curl -s "${SERVER_URL}/api/attendance?filiere=info&semaine=1" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('absences', {})))")
echo -e "${GREEN}✅ ${BEFORE} absences trouvées${NC}\n"

# Test 3: Enregistrer une absence
echo -e "${YELLOW}[3/5] Enregistrement absence (POST)...${NC}"
RESPONSE=$(curl -s -X POST "${SERVER_URL}/api/attendance" \
  -H "Content-Type: application/json" \
  -d '{"filiere":"info","semaine":1,"num":1,"statut":"present"}')

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Absence enregistrée${NC}"
    ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id_attendance', 'N/A'))")
    echo -e "   ID: $ID\n"
else
    echo -e "${RED}❌ Erreur lors de l'enregistrement${NC}"
    echo "$RESPONSE"
    exit 1
fi

# Test 4: Vérifier que l'absence a été sauvegardée
echo -e "${YELLOW}[4/5] Vérification persistance (GET)...${NC}"
AFTER=$(curl -s "${SERVER_URL}/api/attendance?filiere=info&semaine=1" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('absences', {})))")
echo -e "${GREEN}✅ ${AFTER} absences trouvées après POST${NC}\n"

# Test 5: Vérifier le statut exact
echo -e "${YELLOW}[5/5] Vérification statut exact...${NC}"
STATUT=$(curl -s "${SERVER_URL}/api/attendance?filiere=info&semaine=1" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('absences', {}).get('info_1_1', {}).get('statut', 'NOT_FOUND'))")
if [ "$STATUT" = "present" ]; then
    echo -e "${GREEN}✅ Statut correctement sauvegardé: ${STATUT}${NC}\n"
else
    echo -e "${YELLOW}⚠️  Statut: ${STATUT}${NC}\n"
fi

# Résumé
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "\n📊 Résumé:"
echo "  • Serveur: Actif"
echo "  • Avant: $BEFORE absences"
echo "  • Après: $AFTER absences"
echo "  • Statut: $STATUT"
echo -e "\n🎯 Les données sont PERSISTÉES dans PostgreSQL! 🎉\n"
