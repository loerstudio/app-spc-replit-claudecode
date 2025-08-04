const Database = require('@replit/database');
const db = new Database();

// Helper functions
async function getKey(key) {
  try {
    return await db.get(key);
  } catch (error) {
    console.error(`Errore lettura chiave ${key}:`, error);
    return null;
  }
}

async function setKey(key, value) {
  try {
    await db.set(key, value);
    return true;
  } catch (error) {
    console.error(`Errore scrittura chiave ${key}:`, error);
    return false;
  }
}

// Initialize app with all required data optimized for 500+ clients
async function initializeApp() {
  console.log('🔄 Inizializzazione database per 500+ clienti...');

  // Initialize users
  let users = await getKey('users');
  if (!users || !Array.isArray(users)) {
    users = [
      {
        id: 1,
        email: 'coach@test.com',
        password: 'password123',
        role: 'coach',
        name: 'Coach Test'
      },
      {
        id: 2,
        email: 'client@test.com',
        password: 'password123',
        role: 'client',
        name: 'Luca Cliente'
      },
      {
        id: 3,
        email: 'itsilorenz07@gmail.com',
        password: 'Lorenzo45_',
        role: 'coach',
        name: 'Lorenzi Coach'
      }
    ];
    await setKey('users', users);
  } else {
    // Assicurati che users sia un array
    if (!Array.isArray(users)) {
      users = [];
    }
    // Verifica se l'utente Lorenzi esiste già, se no lo aggiungi
    const lorenziExists = users.find((u) => u.email === 'itsilorenz07@gmail.com');
    if (!lorenziExists) {
      users.push({
        id: users.length + 1,
        email: 'itsilorenz07@gmail.com',
        password: 'Lorenzo45_',
        role: 'coach',
        name: 'Lorenzi Coach'
      });
      await setKey('users', users);
    } else {
      // Aggiorna il nome se necessario
      const userIndex = users.findIndex(u => u.email === 'itsilorenz07@gmail.com');
      if (users[userIndex].name !== 'Lorenzi Coach') {
        users[userIndex].name = 'Lorenzi Coach';
        await setKey('users', users);
      }
    }
  }

  // Initialize exercises
  let exercises = await getKey('exercises');
  if (!exercises || !Array.isArray(exercises)) {
    exercises = [
      {
        id: 1,
        name: 'Push-up',
        category: 'Petto',
        muscle_groups: ['Petto', 'Tricipiti', 'Spalle'],
        instructions: 'Posizionati in plank, abbassa il corpo e spingi verso l\'alto',
        equipment: 'Corpo libero'
      },
      {
        id: 2,
        name: 'Squat',
        category: 'Gambe',
        muscle_groups: ['Quadricipiti', 'Glutei'],
        instructions: 'Piedi alla larghezza delle spalle, scendi come se ti stessi sedendo',
        equipment: 'Corpo libero'
      },
      {
        id: 3,
        name: 'Plank',
        category: 'Core',
        muscle_groups: ['Addominali', 'Core'],
        instructions: 'Mantieni la posizione in appoggio su avambracci e punte dei piedi',
        equipment: 'Corpo libero'
      },
      {
        id: 4,
        name: 'Burpees',
        category: 'Cardio',
        muscle_groups: ['Full Body'],
        instructions: 'Squat, plank, push-up, jump',
        equipment: 'Corpo libero'
      },
      {
        id: 5,
        name: 'Mountain Climbers',
        category: 'Cardio',
        muscle_groups: ['Core', 'Cardio'],
        instructions: 'Posizione plank, alterna le ginocchia al petto rapidamente',
        equipment: 'Corpo libero'
      }
    ];
    await setKey('exercises', exercises);
  }

  // Initialize workouts
  let workouts = await getKey('workouts');
  if (!workouts || !Array.isArray(workouts)) {
    workouts = [
      {
        id: 1,
        client_id: 2,
        coach_id: 1,
        name: 'Allenamento Petto e Tricipiti',
        description: 'Workout per sviluppo muscolare parte superiore',
        date: new Date().toISOString().split('T')[0],
        exercises: [
          { exercise_id: 1, sets: 3, reps: 15, rest_seconds: 60 },
          { exercise_id: 3, sets: 3, reps: 30, rest_seconds: 45 }
        ],
        completed: false,
        duration_minutes: 45
      },
      {
        id: 2,
        client_id: 2,
        coach_id: 1,
        name: 'Cardio HIIT',
        description: 'Allenamento cardio ad alta intensità',
        date: new Date().toISOString().split('T')[0],
        exercises: [
          { exercise_id: 4, sets: 4, reps: 10, rest_seconds: 30 },
          { exercise_id: 5, sets: 3, reps: 20, rest_seconds: 45 }
        ],
        completed: false,
        duration_minutes: 30
      }
    ];
    await setKey('workouts', workouts);
  }

  // Initialize weight progress
  let weightProgress = await getKey('weight_progress');
  if (!weightProgress || !Array.isArray(weightProgress)) {
    weightProgress = [
      {
        id: 1,
        client_id: 2,
        weight: 75.5,
        date: new Date().toISOString(),
        notes: 'Peso iniziale'
      },
      {
        id: 2,
        client_id: 2,
        weight: 76.0,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Progresso settimanale'
      }
    ];
    await setKey('weight_progress', weightProgress);
  }

  // Initialize nutrition data
  let nutritionData = await getKey('nutrition_data');
  if (!nutritionData || !Array.isArray(nutritionData)) {
    nutritionData = [
      {
        id: 1,
        client_id: 2,
        daily_calories: 2200,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fats: 80,
        current_calories: 850,
        current_protein: 45,
        current_carbs: 85,
        current_fats: 25,
        date: new Date().toISOString().split('T')[0],
        meals: [
          {
            id: 1,
            name: 'Colazione',
            calories: 400,
            protein: 20,
            carbs: 45,
            fats: 15
          },
          {
            id: 2,
            name: 'Spuntino',
            calories: 200,
            protein: 15,
            carbs: 20,
            fats: 8
          },
          {
            id: 3,
            name: 'Pranzo',
            calories: 250,
            protein: 10,
            carbs: 20,
            fats: 2
          }
        ]
      }
    ];
    await setKey('nutrition_data', nutritionData);
  }

  // Initialize photo progress
  let photoProgress = await getKey('photo_progress');
  if (!photoProgress || !Array.isArray(photoProgress)) {
    photoProgress = [];
    await setKey('photo_progress', photoProgress);
  }

  // Initialize workout sessions
  let workoutSessions = await getKey('workout_sessions');
  if (!workoutSessions || !Array.isArray(workoutSessions)) {
    workoutSessions = [];
    await setKey('workout_sessions', workoutSessions);
  }

  // Initialize messages
  let messages = await getKey('messages');
  if (!messages || !Array.isArray(messages)) {
    messages = [];
    await setKey('messages', messages);
  }

  console.log('✅ Database inizializzato con successo!');
  console.log('📊 Dati utente, workout, esercizi e progresso caricati');
}

// Get today's workout for a client
async function getTodayWorkoutForClient(clientId) {
  try {
    const workouts = await getKey('workouts') || [];
    const today = new Date().toISOString().split('T')[0];

    const todayWorkout = workouts.find(w => 
      w.client_id === clientId && 
      w.date === today && 
      !w.completed
    );

    if (!todayWorkout) return null;

    // Get exercise details
    const exercises = await getKey('exercises') || [];
    const workoutWithExercises = {
      ...todayWorkout,
      exercises: todayWorkout.exercises.map(we => {
        const exercise = exercises.find(e => e.id === we.exercise_id);
        return {
          ...we,
          exercise: exercise || { name: 'Esercizio non trovato', instructions: '' }
        };
      })
    };

    return workoutWithExercises;
  } catch (error) {
    console.error('Errore getTodayWorkoutForClient:', error);
    return null;
  }
}

// Get weight progress
async function getWeightProgress(clientId, days = 30) {
  try {
    const progress = await getKey('weight_progress') || [];
    const clientProgress = progress
      .filter(p => p.client_id === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);

    return clientProgress;
  } catch (error) {
    console.error('Errore getWeightProgress:', error);
    return [];
  }
}

// Save weight progress
async function saveWeightProgress(clientId, weight, notes = '') {
  try {
    const progress = await getKey('weight_progress') || [];
    const newEntry = {
      id: progress.length + 1,
      client_id: clientId,
      weight: parseFloat(weight.toString()),
      date: new Date().toISOString(),
      notes: notes
    };

    progress.push(newEntry);
    await setKey('weight_progress', progress);
    return newEntry;
  } catch (error) {
    console.error('Errore saveWeightProgress:', error);
    throw error;
  }
}

// Get latest weight
async function getLatestWeight(clientId) {
  try {
    const progress = await getKey('weight_progress') || [];
    const clientProgress = progress
      .filter(p => p.client_id === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return clientProgress[0] || null;
  } catch (error) {
    console.error('Errore getLatestWeight:', error);
    return null;
  }
}

// Get nutrition data
async function getNutritionData(clientId) {
  try {
    const nutritionData = await getKey('nutrition_data') || [];
    const today = new Date().toISOString().split('T')[0];

    const clientNutrition = nutritionData.find(n => 
      n.client_id === clientId && 
      n.date === today
    );

    return clientNutrition || null;
  } catch (error) {
    console.error('Errore getNutritionData:', error);
    return null;
  }
}

// Batch operations for managing many clients
async function batchGetClients(page = 1, limit = 50, role = null) {
  try {
    const users = await getKey('users') || [];
    let filteredUsers = users;

    if (role) {
      filteredUsers = users.filter(u => u.role === role);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      total: filteredUsers.length,
      page: page,
      totalPages: Math.ceil(filteredUsers.length / limit)
    };
  } catch (error) {
    console.error('Errore batch get clients:', error);
    return { users: [], total: 0, page: 1, totalPages: 0 };
  }
}

async function batchCreateClients(clientsData) {
  try {
    const users = await getKey('users') || [];
    const newClients = clientsData.map((client, index) => ({
      id: users.length + index + 1,
      ...client,
      created_at: new Date().toISOString()
    }));

    const updatedUsers = [...users, ...newClients];
    await setKey('users', updatedUsers);

    return {
      success: true,
      created: newClients.length,
      clients: newClients
    };
  } catch (error) {
    console.error('Errore batch create clients:', error);
    throw error;
  }
}

async function getClientStats(clientId) {
  try {
    const [workouts, weightProgress, nutritionData] = await Promise.all([
      getKey('workouts'),
      getKey('weight_progress'),
      getKey('nutrition_data')
    ]);

    const clientWorkouts = (workouts || []).filter(w => w.client_id === clientId);
    const clientWeight = (weightProgress || []).filter(w => w.client_id === clientId);
    const clientNutrition = (nutritionData || []).filter(n => n.client_id === clientId);

    return {
      total_workouts: clientWorkouts.length,
      completed_workouts: clientWorkouts.filter(w => w.completed).length,
      weight_entries: clientWeight.length,
      nutrition_days: clientNutrition.length,
      last_workout: clientWorkouts[clientWorkouts.length - 1] || null,
      latest_weight: clientWeight.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null
    };
  } catch (error) {
    console.error('Errore getClientStats:', error);
    return null;
  }
}

// Database health check
async function getDatabaseHealth() {
  try {
    const [users, workouts, exercises, weightProgress, nutritionData, workoutSessions] = await Promise.all([
      getKey('users'),
      getKey('workouts'),
      getKey('exercises'),
      getKey('weight_progress'),
      getKey('nutrition_data'),
      getKey('workout_sessions')
    ]);

    return {
      users_count: (users || []).length,
      clients_count: (users || []).filter(u => u.role === 'client').length,
      coaches_count: (users || []).filter(u => u.role === 'coach').length,
      workouts_count: (workouts || []).length,
      exercises_count: (exercises || []).length,
      weight_entries: (weightProgress || []).length,
      nutrition_days: (nutritionData || []).length,
      workout_sessions: (workoutSessions || []).length,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Errore database health check:', error);
    return null;
  }
}

// Message functions
async function sendMessage(senderId, receiverId, text) {
  try {
    const messages = await getKey('messages') || [];
    const newMessage = {
      id: messages.length + 1,
      sender_id: senderId,
      receiver_id: receiverId,
      text: text,
      created_at: new Date().toISOString(),
      read_at: null
    };

    messages.push(newMessage);
    await setKey('messages', messages);
    return newMessage;
  } catch (error) {
    console.error('Errore sendMessage:', error);
    throw error;
  }
}

async function getMessages(userId1, userId2) {
  try {
    const messages = await getKey('messages') || [];
    return messages.filter(m => 
      (m.sender_id === userId1 && m.receiver_id === userId2) ||
      (m.sender_id === userId2 && m.receiver_id === userId1)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } catch (error) {
    console.error('Errore getMessages:', error);
    return [];
  }
}

async function markMessageAsRead(messageId) {
  try {
    const messages = await getKey('messages') || [];
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex !== -1) {
      messages[messageIndex].read_at = new Date().toISOString();
      await setKey('messages', messages);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Errore markMessageAsRead:', error);
    return false;
  }
}

// Authentication functions
async function authenticateUser(email, password) {
  try {
    const users = await getKey('users') || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      const { password: pwd, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }

    return { success: false, error: 'Credenziali non valide' };
  } catch (error) {
    console.error('Errore authenticateUser:', error);
    return { success: false, error: 'Errore interno' };
  }
}

// Workout management functions
async function getAllWorkouts() {
  try {
    const workouts = await getKey('workouts') || [];
    const exercises = await getKey('exercises') || [];

    return workouts.map(workout => ({
      ...workout,
      exercises: workout.exercises.map(we => {
        const exercise = exercises.find(e => e.id === we.exercise_id);
        return {
          ...we,
          exercise: exercise || { name: 'Esercizio non trovato', instructions: '' }
        };
      })
    }));
  } catch (error) {
    console.error('Errore getAllWorkouts:', error);
    return [];
  }
}

async function createWorkout(workoutData) {
  try {
    const workouts = await getKey('workouts') || [];
    const newWorkout = {
      id: workouts.length + 1,
      ...workoutData,
      completed: false,
      created_at: new Date().toISOString()
    };

    workouts.push(newWorkout);
    await setKey('workouts', workouts);
    return newWorkout;
  } catch (error) {
    console.error('Errore createWorkout:', error);
    throw error;
  }
}

async function completeWorkout(workoutId) {
  try {
    const workouts = await getKey('workouts') || [];
    const workoutIndex = workouts.findIndex(w => w.id === parseInt(workoutId));

    if (workoutIndex !== -1) {
      workouts[workoutIndex].completed = true;
      workouts[workoutIndex].completed_at = new Date().toISOString();
      await setKey('workouts', workouts);
      return { success: true };
    }

    return { success: false, error: 'Workout non trovato' };
  } catch (error) {
    console.error('Errore completeWorkout:', error);
    return { success: false, error: 'Errore interno' };
  }
}

// Exercise management functions
async function getAllExercises() {
  try {
    return await getKey('exercises') || [];
  } catch (error) {
    console.error('Errore getAllExercises:', error);
    return [];
  }
}

async function createExercise(exerciseData) {
  try {
    const exercises = await getKey('exercises') || [];
    const newExercise = {
      id: exercises.length + 1,
      ...exerciseData,
      created_at: new Date().toISOString()
    };

    exercises.push(newExercise);
    await setKey('exercises', exercises);
    return newExercise;
  } catch (error) {
    console.error('Errore createExercise:', error);
    throw error;
  }
}

// Photo progress functions
async function savePhotoProgress(clientId, photoData) {
  try {
    const photoProgress = await getKey('photo_progress') || [];
    const newPhoto = {
      id: photoProgress.length + 1,
      client_id: clientId,
      ...photoData,
      date: new Date().toISOString()
    };

    photoProgress.push(newPhoto);
    await setKey('photo_progress', photoProgress);
    return newPhoto;
  } catch (error) {
    console.error('Errore savePhotoProgress:', error);
    throw error;
  }
}

async function getLatestPhotos(clientId, count = 5) {
  try {
    const photoProgress = await getKey('photo_progress') || [];
    return photoProgress
      .filter(p => p.client_id === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  } catch (error) {
    console.error('Errore getLatestPhotos:', error);
    return [];
  }
}

// Workout session functions
async function createWorkoutSession(workoutId, clientId) {
  try {
    const sessions = await getKey('workout_sessions') || [];
    const newSession = {
      id: sessions.length + 1,
      workout_id: workoutId,
      client_id: clientId,
      started_at: new Date().toISOString(),
      completed: false,
      sets: []
    };

    sessions.push(newSession);
    await setKey('workout_sessions', sessions);
    return newSession;
  } catch (error) {
    console.error('Errore createWorkoutSession:', error);
    throw error;
  }
}

async function completeWorkoutSession(sessionId, durationMinutes) {
  try {
    const sessions = await getKey('workout_sessions') || [];
    const sessionIndex = sessions.findIndex(s => s.id === parseInt(sessionId));

    if (sessionIndex !== -1) {
      sessions[sessionIndex].completed = true;
      sessions[sessionIndex].completed_at = new Date().toISOString();
      sessions[sessionIndex].duration_minutes = durationMinutes;
      await setKey('workout_sessions', sessions);
      return { success: true };
    }

    return { success: false, error: 'Sessione non trovata' };
  } catch (error) {
    console.error('Errore completeWorkoutSession:', error);
    return { success: false, error: 'Errore interno' };
  }
}

// Dashboard function
async function getDashboardData(userId) {
  try {
    const users = await getKey('users') || [];
    const user = users.find(u => u.id === parseInt(userId));

    if (!user) {
      return { error: 'Utente non trovato' };
    }

    const [todayWorkout, latestWeight, nutritionData] = await Promise.all([
      getTodayWorkoutForClient(userId),
      getLatestWeight(userId),
      getNutritionData(userId)
    ]);

    return {
      user: {
        name: user.name,
        role: user.role
      },
      todayWorkout: todayWorkout ? {
        id: todayWorkout.id,
        name: todayWorkout.name,
        exercises_count: todayWorkout.exercises.length
      } : null,
      latestWeight: latestWeight ? {
        weight: latestWeight.weight,
        date: latestWeight.date
      } : null,
      nutritionProgress: nutritionData ? {
        current_calories: nutritionData.current_calories,
        daily_calories: nutritionData.daily_calories,
        current_protein: nutritionData.current_protein,
        daily_protein: nutritionData.daily_protein
      } : null
    };
  } catch (error) {
    console.error('Errore getDashboardData:', error);
    return { error: 'Errore interno' };
  }
}

module.exports = {
  initializeApp,
  authenticateUser,
  getTodayWorkoutForClient,
  getAllWorkouts,
  createWorkout,
  completeWorkout,
  getAllExercises,
  createExercise,
  getWeightProgress,
  saveWeightProgress,
  getLatestWeight,
  getNutritionData,
  savePhotoProgress,
  getLatestPhotos,
  createWorkoutSession,
  completeWorkoutSession,
  getDashboardData,
  batchGetClients,
  getClientStats,
  getDatabaseHealth,
  sendMessage,
  getMessages,
  markMessageAsRead,
  getKey,
  setKey
};