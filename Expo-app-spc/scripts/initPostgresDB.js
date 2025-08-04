
const pool = require('../lib/postgres-db');
const bcrypt = require('bcryptjs');

async function createTables() {
  const client = await pool.connect();
  
  try {
    // Inizia transazione
    await client.query('BEGIN');

    // 1. Tabella users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('coach', 'client')),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabella users creata');

    // 2. Tabella exercises
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        muscle_groups TEXT[],
        instructions TEXT,
        equipment VARCHAR(255),
        difficulty_level VARCHAR(20) DEFAULT 'beginner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabella exercises creata');

    // 3. Tabella workouts
    await client.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        coach_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        scheduled_date DATE NOT NULL,
        completed_at TIMESTAMP NULL,
        duration_minutes INTEGER,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabella workouts creata');

    // 4. Tabella workout_exercises
    await client.query(`
      CREATE TABLE IF NOT EXISTS workout_exercises (
        id SERIAL PRIMARY KEY,
        workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id INTEGER REFERENCES exercises(id),
        sets INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight_kg DECIMAL(5,2),
        rest_seconds INTEGER,
        order_index INTEGER NOT NULL,
        notes TEXT,
        is_completed BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ Tabella workout_exercises creata');

    // 5. Tabella weight_progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS weight_progress (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        weight_kg DECIMAL(5,2) NOT NULL,
        measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);
    console.log('✅ Tabella weight_progress creata');

    // 6. Tabella nutrition_data
    await client.query(`
      CREATE TABLE IF NOT EXISTS nutrition_data (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        daily_calories INTEGER,
        daily_protein INTEGER,
        daily_carbs INTEGER,
        daily_fats INTEGER,
        current_calories INTEGER DEFAULT 0,
        current_protein INTEGER DEFAULT 0,
        current_carbs INTEGER DEFAULT 0,
        current_fats INTEGER DEFAULT 0,
        date DATE DEFAULT CURRENT_DATE,
        meals JSONB DEFAULT '[]'::jsonb
      );
    `);
    console.log('✅ Tabella nutrition_data creata');

    // 7. Tabella messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_text TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL
      );
    `);
    console.log('✅ Tabella messages creata');

    // 8. Tabella photo_progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS photo_progress (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        photo_url VARCHAR(500) NOT NULL,
        photo_type VARCHAR(50),
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);
    console.log('✅ Tabella photo_progress creata');

    // 9. Crea indici per performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_workouts_client ON workouts(client_id);
      CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_weight_progress_client ON weight_progress(client_id);
      CREATE INDEX IF NOT EXISTS idx_nutrition_client_date ON nutrition_data(client_id, date);
    `);
    console.log('✅ Indici creati');

    // Commit transazione
    await client.query('COMMIT');
    console.log('🎉 TUTTE LE TABELLE CREATE CON SUCCESSO!');

    // Inserisci dati di test
    await insertTestData(client);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ ERRORE CREAZIONE TABELLE:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Inserisci dati di test
async function insertTestData(client) {
  try {
    // Crea password hash
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Inserisci utenti di test
    const users = [
      { email: 'coach@test.com', password: hashedPassword, role: 'coach', name: 'Coach Test' },
      { email: 'client@test.com', password: hashedPassword, role: 'client', name: 'Luca Cliente' },
      { email: 'itsilorenz07@gmail.com', password: await bcrypt.hash('Lorenzo45_', 10), role: 'coach', name: 'Lorenzi Coach' }
    ];

    for (const user of users) {
      await client.query(`
        INSERT INTO users (email, password, role, name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, [user.email, user.password, user.role, user.name]);
    }

    // Inserisci esercizi base
    const exercises = [
      { name: 'Push-up', category: 'Petto', muscle_groups: ['Petto', 'Tricipiti', 'Spalle'], instructions: 'Posizionati in plank, abbassa il corpo e spingi verso l\'alto', equipment: 'Corpo libero' },
      { name: 'Squat', category: 'Gambe', muscle_groups: ['Quadricipiti', 'Glutei'], instructions: 'Piedi alla larghezza delle spalle, scendi come se ti stessi sedendo', equipment: 'Corpo libero' },
      { name: 'Plank', category: 'Core', muscle_groups: ['Addominali', 'Core'], instructions: 'Mantieni la posizione in appoggio su avambracci e punte dei piedi', equipment: 'Corpo libero' },
      { name: 'Burpees', category: 'Cardio', muscle_groups: ['Full Body'], instructions: 'Squat, plank, push-up, jump', equipment: 'Corpo libero' },
      { name: 'Mountain Climbers', category: 'Cardio', muscle_groups: ['Core', 'Cardio'], instructions: 'Posizione plank, alterna le ginocchia al petto rapidamente', equipment: 'Corpo libero' }
    ];

    for (const exercise of exercises) {
      await client.query(`
        INSERT INTO exercises (name, category, muscle_groups, instructions, equipment)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [exercise.name, exercise.category, exercise.muscle_groups, exercise.instructions, exercise.equipment]);
    }

    console.log('✅ Dati di test inseriti');
    console.log('📧 Login coach: coach@test.com / password123');
    console.log('📧 Login client: client@test.com / password123');
    console.log('📧 Login Lorenzi: itsilorenz07@gmail.com / Lorenzo45_');

  } catch (error) {
    console.error('❌ Errore inserimento dati test:', error);
  }
}

// Esegui inizializzazione
async function initializeDatabase() {
  try {
    console.log('🔧 Inizializzazione database PostgreSQL...');
    await createTables();
    console.log('✅ Database inizializzato con successo!');
  } catch (error) {
    console.error('❌ ERRORE FATALE:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Avvia se chiamato direttamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { createTables, insertTestData };
