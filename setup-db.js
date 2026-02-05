#!/usr/bin/env node

/**
 * Script d'initialisation de la base de données PostgreSQL
 * Utilisation : node setup-db.js
 * 
 * Ce script :
 * 1. Lit le schéma depuis db/schema.sql
 * 2. Se connecte à PostgreSQL
 * 3. Crée les tables
 * 4. Insère des données de test
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ Erreur: DATABASE_URL non défini');
    console.log('\n💡 Créer un fichier .env avec:');
    console.log('DATABASE_URL=postgresql://user:password@host:5432/database');
    process.exit(1);
}

async function setupDatabase() {
    const client = new Client({ connectionString: dbUrl });

    try {
        console.log('🔌 Connexion à PostgreSQL...');
        await client.connect();
        console.log('✅ Connecté à PostgreSQL\n');

        // Lire le schéma SQL
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Fichier schema.sql non trouvé: ${schemaPath}`);
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Exécuter le schéma
        console.log('📋 Exécution du schéma SQL...');
        await client.query(schemaSql);
        console.log('✅ Schéma créé avec succès\n');

        // Insérer des données de test
        console.log('🌱 Insertion des données de test...');
        const testData = `
            -- Insérer les rôles
            INSERT INTO roles(libelle) VALUES ('professeur'), ('etudiant'), ('admin')
            ON CONFLICT (libelle) DO NOTHING;

            -- Insérer les filières/groupes
            INSERT INTO groupes(nom_groupe, niveau) VALUES 
                ('ISDIA', '3'),
                ('ILIA', '3'),
                ('Génie Informatique', '3'),
                ('Génie Logiciel', '3'),
                ('Cybersécurité', '3')
            ON CONFLICT DO NOTHING;

            -- Insérer un professeur de test
            INSERT INTO utilisateurs(nom, prenom, email_academique, code, id_role, id_groupe)
            SELECT 'Aberqi', 'Ahmed', 'ahmed.aberqi@ensa.ma', 'ensa2024', id_role, id_groupe
            FROM roles, groupes
            WHERE roles.libelle = 'professeur' AND groupes.nom_groupe = 'Génie Informatique'
            ON CONFLICT (email_academique) DO NOTHING;

            -- Insérer un étudiant de test
            INSERT INTO utilisateurs(nom, prenom, email_academique, code, id_role, id_groupe)
            SELECT 'ANAS', 'Test', 'test@usmba.ac.ma', 'secret', id_role, id_groupe
            FROM roles, groupes
            WHERE roles.libelle = 'etudiant' AND groupes.nom_groupe = 'Génie Informatique'
            ON CONFLICT (email_academique) DO NOTHING;

            -- Insérer une matière de test
            INSERT INTO matieres(nom_matiere, semestre) VALUES ('Algorithme', 'S1')
            ON CONFLICT DO NOTHING;
        `;

        await client.query(testData);
        console.log('✅ Données de test insérées\n');

        // Afficher un résumé
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 RÉSUMÉ DE LA BASE DE DONNÉES');
        console.log('═══════════════════════════════════════════════════════════\n');

        const tables = ['roles', 'groupes', 'utilisateurs', 'matieres', 'seances', 'logs_pointage'];

        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
            const count = result.rows[0].count;
            console.log(`  📋 ${table}: ${count} enregistrement(s)`);
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('✨ COMPTES DE TEST CRÉÉS:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  Professeur:');
        console.log('    Email: ahmed.aberqi@ensa.ma');
        console.log('    Nom: Ahmed Aberqi');
        console.log('\n  Étudiant:');
        console.log('    Email: test@usmba.ac.ma');
        console.log('    Nom: Test ANAS');
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('🚀 Configuration terminée !');
        console.log('\nPour démarrer le serveur: npm start');
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Erreur lors de la configuration:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Exécuter
setupDatabase();
