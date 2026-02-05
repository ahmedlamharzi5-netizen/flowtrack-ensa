#!/usr/bin/env node

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:jJzIqjycnQByKukYbKTxRvTTOoAaWDVj@gondola.proxy.rlwy.net:19359/railway';

async function cleanDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔗 Connecté à PostgreSQL...');
    
    // Delete all users
    await client.query('DELETE FROM utilisateurs');
    console.log('✅ Tous les utilisateurs supprimés');
    
    // Get count
    const result = await client.query('SELECT COUNT(*) FROM utilisateurs');
    console.log(`✅ BD nettoyée! Utilisateurs restants: ${result.rows[0].count}`);
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
