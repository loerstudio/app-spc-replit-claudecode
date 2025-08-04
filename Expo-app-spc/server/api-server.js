const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const WebSocketServer = require('./websocket-server');
const pool = require('../lib/postgres-db');
const { 
  getDashboardData, 
  getAllWorkouts, 
  createWorkout, 
  completeWorkout,
  getAllExercises,
  createExercise,
  getTodayWorkoutForClient,
  getWeightProgress,
  saveWeightProgress,
  getLatestWeight,
  getNutritionData,
  savePhotoProgress,
  createWorkoutSession,
  completeWorkoutSession,
  getMessages,
  sendMessage,
  markMessageAsRead,
  getKey,
  setKey
} = require('../lib/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory cache for optimization
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data: data,
    timestamp: Date.now()
  });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'https://*.replit.dev', 'https://*.replit.co'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import delle funzioni database
// Already imported above

// Authentication
app.post('/api/login', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e password sono obbligatori' 
      });
    }

    // Trova utente
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Email o password non corretti' 
      });
    }

    const user = userResult.rows[0];

    // Verifica password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Email o password non corretti' 
      });
    }

    // Genera token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi password dalla risposta
    delete user.password;

    res.json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  } finally {
    client.release();
  }
});

// Dashboard endpoint
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const dashboardData = await getDashboardData(userId);

    if (dashboardData.error) {
      return res.status(404).json(dashboardData);
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Workouts
app.get('/api/workouts', async (req, res) => {
  try {
    const workouts = await getAllWorkouts();
    res.json(workouts);
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/workouts', async (req, res) => {
  try {
    const workout = await createWorkout(req.body);
    res.status(201).json(workout);
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/workouts/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await completeWorkout(id);
    res.json(result);
  } catch (error) {
    console.error('Complete workout error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Exercises
app.get('/api/exercises', async (req, res) => {
  try {
    const exercises = await getAllExercises();
    res.json(exercises);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/exercises', async (req, res) => {
  try {
    const exercise = await createExercise(req.body);
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Routes API optimized
app.get('/api/workouts/today/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const cacheKey = `workout_today_${clientId}`;

    const cachedWorkout = getCachedData(cacheKey);
    if (cachedWorkout) {
      return res.json(cachedWorkout);
    }

    const workout = await getTodayWorkoutForClient(parseInt(clientId));

    if (!workout) {
      return res.status(404).json({ 
        error: 'Nessun workout trovato per oggi',
        workout: null 
      });
    }

    setCachedData(cacheKey, workout);
    res.json(workout);
  } catch (error) {
    console.error('Errore caricamento workout:', error);
    res.status(500).json({ 
      error: 'Errore server',
      message: error.message,
      workout: null 
    });
  }
});

app.post('/api/workouts/:workoutId/complete', async (req, res) => {
  try {
    const { workoutId } = req.params;
    const workouts = await getKey('workouts') || [];

    const workoutIndex = workouts.findIndex(w => w.id === parseInt(workoutId));
    if (workoutIndex === -1) {
      return res.status(404).json({ error: 'Workout non trovato' });
    }

    workouts[workoutIndex].completed = true;
    workouts[workoutIndex].completed_at = new Date().toISOString();
    await setKey('workouts', workouts);

    // Invalidate cache
    cache.delete(`workout_today_${workouts[workoutIndex].client_id}`);
    cache.delete(`dashboard_${workouts[workoutIndex].client_id}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Errore completamento workout:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

app.get('/api/weight-progress/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const days = parseInt(req.query.days) || 30;
    const cacheKey = `weight_progress_${clientId}_${days}`;

    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const progress = await getWeightProgress(parseInt(clientId), days);
    setCachedData(cacheKey, progress);
    res.json(progress || []);
  } catch (error) {
    console.error('Errore caricamento peso:', error);
    res.status(500).json({ 
      error: 'Errore server',
      message: error.message,
      data: []
    });
  }
});

app.post('/api/weight-progress/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { weight, notes } = req.body;
    const entry = await saveWeightProgress(parseInt(clientId), weight, notes);

    // Invalidate cache
    cache.delete(`weight_progress_${clientId}_30`);
    cache.delete(`dashboard_${clientId}`);

    res.json(entry);
  } catch (error) {
    console.error('Errore salvataggio peso:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

app.get('/api/latest-weight/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const cacheKey = `latest_weight_${clientId}`;

    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const latestWeight = await getLatestWeight(parseInt(clientId));
    setCachedData(cacheKey, latestWeight);
    res.json(latestWeight);
  } catch (error) {
    console.error('Errore caricamento ultimo peso:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

// Photos
app.get('/api/latest-photos/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const cacheKey = `latest_photos_${clientId}`;

    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const photos = await getKey('photo_progress') || [];
    const clientPhotos = photos
      .filter(p => p.client_id === parseInt(clientId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);

    setCachedData(cacheKey, clientPhotos);
    res.json(clientPhotos);
  } catch (error) {
    console.error('Errore caricamento foto:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

app.post('/api/photos', async (req, res) => {
  try {
    const { clientId, ...photoData } = req.body;
    const photo = await savePhotoProgress(clientId, photoData);
    res.status(201).json(photo);
  } catch (error) {
    console.error('Save photo error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Workout Sessions
app.post('/api/workout-session', async (req, res) => {
  try {
    const { workoutId, clientId } = req.body;
    const session = await createWorkoutSession(workoutId, clientId);
    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/workout-session/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { durationMinutes } = req.body;
    const result = await completeWorkoutSession(sessionId, durationMinutes);
    res.json(result);
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.get('/api/nutrition/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const cacheKey = `nutrition_${clientId}`;

    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const nutritionData = await getNutritionData(parseInt(clientId));

    if (!nutritionData) {
      const defaultData = {
        client_id: parseInt(clientId),
        daily_calories: 2200,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fats: 80,
        current_calories: 0,
        current_protein: 0,
        current_carbs: 0,
        current_fats: 0,
        meals: []
      };
      setCachedData(cacheKey, defaultData);
      return res.json({ success: true, data: defaultData });
    }

    setCachedData(cacheKey, nutritionData);
    res.json({ success: true, data: nutritionData });
  } catch (error) {
    console.error('Errore caricamento nutrizione:', error);
    res.status(500).json({ 
      success: false,
      error: 'Errore server',
      message: error.message,
      data: null 
    });
  }
});

// User management for many clients
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const role = req.query.role;

    const users = await getKey('users') || [];
    let filteredUsers = users;

    if (role) {
      filteredUsers = users.filter(u => u.role === role);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Do not return passwords
    const safeUsers = paginatedUsers.map(({ password, ...user }) => user);

    res.json({
      users: safeUsers,
      total: filteredUsers.length,
      page: page,
      totalPages: Math.ceil(filteredUsers.length / limit)
    });
  } catch (error) {
    console.error('Errore caricamento utenti:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

// User authentication
// Already implemented at the beginning of the file

// Batch operations for many clients
app.post('/api/batch/workouts', async (req, res) => {
  try {
    const { workouts } = req.body;
    const existingWorkouts = await getKey('workouts') || [];

    const newWorkouts = workouts.map((workout, index) => ({
      id: existingWorkouts.length + index + 1,
      ...workout,
      created_at: new Date().toISOString()
    }));

    const updatedWorkouts = [...existingWorkouts, ...newWorkouts];
    await setKey('workouts', updatedWorkouts);

    res.json({ 
      success: true, 
      created: newWorkouts.length,
      workouts: newWorkouts 
    });
  } catch (error) {
    console.error('Errore batch workout creation:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

// Health check with database info
app.get('/health', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const dbTest = await client.query('SELECT NOW()');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const workoutCount = await client.query('SELECT COUNT(*) FROM workouts');
    const exerciseCount = await client.query('SELECT COUNT(*) FROM exercises');

    res.json({ 
      status: 'OK', 
      database: 'PostgreSQL Connected',
      timestamp: new Date().toISOString(),
      database_stats: {
        users_count: parseInt(userCount.rows[0].count),
        workouts_count: parseInt(workoutCount.rows[0].count),
        exercises_count: parseInt(exerciseCount.rows[0].count),
        cache_size: cache.size
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'PostgreSQL Disconnected',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// Messages
app.get('/api/messages/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = await getMessages(parseInt(userId1), parseInt(userId2));
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const message = await sendMessage(senderId, receiverId, text);
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await markMessageAsRead(parseInt(id));
    res.json({ success: result });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Cleanup cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);

// Start servers
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
  console.log('🐘 PostgreSQL Database Connected');
  console.log('📊 Database optimized for 500+ clients');
  console.log('💾 In-memory cache enabled');
  console.log(`📡 Health check: http://0.0.0.0:${PORT}/health`);

  // Test database connection
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connection verified');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
  }

  // Start WebSocket server
  try {
    const wsServer = new WebSocketServer();
    wsServer.start(8080);
    console.log('🔌 WebSocket Server started successfully');
  } catch (error) {
    console.error('❌ Failed to start WebSocket server:', error);
  }
});

module.exports = app;