
const { Pool } = require('pg');
require('dotenv').config();

// Configurazione pool con parametri di sicurezza
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  // Parametri di connessione ottimizzati per Replit
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connessione immediato
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ ERRORE CONNESSIONE DATABASE:', err.stack);
    console.error('Controlla DATABASE_URL nel file .env!');
  } else {
    console.log('✅ PostgreSQL CONNESSO CON SUCCESSO!');
    release();
  }
});

// Gestione errori globale per il pool
pool.on('error', (err, client) => {
  console.error('Errore inaspettato sul client idle', err);
});

module.exports = pool;
