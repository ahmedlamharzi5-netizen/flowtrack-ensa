#!/usr/bin/env node

/**
 * Script pour réinitialiser la base de données
 * Supprime toutes les tables et les recrée
 */

require('dotenv').config();
const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ Erreur: DATABASE_URL non défini');
    process.exit(1);
}

async function resetDatabase() {
    const client = new Client({ connectionString: dbUrl });

    try {
        console.log('🔌 Connexion à PostgreSQL...');
        await client.connect();
        console.log('✅ Connecté\n');

        console.log('🗑️  Suppression des tables...');
        await client.query(`
            DROP TABLE IF EXISTS attendance CASCADE;
            DROP TABLE IF EXISTS logs_pointage CASCADE;
            DROP TABLE IF EXISTS seances CASCADE;
            DROP TABLE IF EXISTS matieres CASCADE;
            DROP TABLE IF EXISTS utilisateurs CASCADE;
            DROP TABLE IF EXISTS groupes CASCADE;
            DROP TABLE IF EXISTS roles CASCADE;
        `);
        console.log('✅ Tables supprimées\n');

        console.log('✨ Base de données réinitialisée avec succès!');
        await client.end();
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        process.exit(1);
    }
}

resetDatabase();
