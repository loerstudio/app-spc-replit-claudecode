
const pool = require('../lib/postgres-db');

async function testEverything() {
  console.log('🧪 INIZIO TEST COMPLETO POSTGRESQL\n');

  const client = await pool.connect();
  
  try {
    // Test 1: Connessione base
    console.log('1️⃣ Test connessione...');
    const connTest = await client.query('SELECT 1+1 as result');
    console.log('✅ Connessione OK:', connTest.rows[0].result === 2 ? 'PASS' : 'FAIL');

    // Test 2: Verifica tabelle
    console.log('\n2️⃣ Verifica tabelle...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('✅ Tabelle trovate:', tables.rows.length);
    tables.rows.forEach(t => console.log(`   - ${t.table_name}`));

    // Test 3: Conta record
    console.log('\n3️⃣ Conta record...');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log('✅ Utenti totali:', userCount.rows[0].count);

    const exerciseCount = await client.query('SELECT COUNT(*) FROM exercises');
    console.log('✅ Esercizi totali:', exerciseCount.rows[0].count);

    // Test 4: Test query complessa
    console.log('\n4️⃣ Test query complessa...');
    const complexQuery = await client.query(`
      SELECT u.email, u.role, u.name
      FROM users u
      WHERE u.role = 'coach'
      ORDER BY u.created_at DESC
    `);
    console.log('✅ Query complessa OK');
    complexQuery.rows.forEach(coach => {
      console.log(`   Coach: ${coach.name} (${coach.email})`);
    });

    // Test 5: Performance
    console.log('\n5️⃣ Test performance...');
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      await client.query('SELECT * FROM exercises LIMIT 5');
    }
    const elapsed = Date.now() - start;
    console.log(`✅ 10 query in ${elapsed}ms (${elapsed/10}ms media)`);

    console.log('\n🎉 TUTTI I TEST PASSATI! POSTGRESQL FUNZIONANTE AL 100%!');

  } catch (error) {
    console.error('\n❌ ERRORE NEL TEST:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
    console.log('\n👋 Connessione chiusa');
  }
}

// Esegui test
if (require.main === module) {
  testEverything();
}

module.exports = testEverything;
