
import Database from '@replit/database';

const db = new Database();

// Types
interface User {
  id: number;
  email: string;
  password: string;
  role: 'coach' | 'client';
  name: string;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_groups: string[];
  instructions: string;
  equipment: string;
}

interface WorkoutExercise {
  exercise_id: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  exercise?: Exercise;
}

interface Workout {
  id: number;
  client_id: number;
  coach_id: number;
  name: string;
  description: string;
  date: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  duration_minutes: number;
}

interface WeightProgress {
  id: number;
  client_id: number;
  weight: number;
  date: string;
  notes: string;
}

interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface NutritionData {
  id: number;
  client_id: number;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
  current_calories: number;
  current_protein: number;
  current_carbs: number;
  current_fats: number;
  date: string;
  meals: Meal[];
}

// Helper functions
export async function getKey(key: string): Promise<any> {
  try {
    return await db.get(key);
  } catch (error) {
    console.error(`Errore lettura chiave ${key}:`, error);
    return null;
  }
}

export async function setKey(key: string, value: any): Promise<boolean> {
  try {
    await db.set(key, value);
    return true;
  } catch (error) {
    console.error(`Errore scrittura chiave ${key}:`, error);
    return false;
  }
}

// Initialize app with all required data
export async function initializeApp(): Promise<void> {
  console.log('🔄 Inizializzazione database...');
  
  // Initialize users
  let users: User[] = await getKey('users');
  if (!users) {
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
    // Verifica se l'utente Lorenzi esiste già, se no lo aggiungi
    const lorenziExists = users.find((u: User) => u.email === 'itsilorenz07@gmail.com');
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
      const userIndex = users.findIndex((u: User) => u.email === 'itsilorenz07@gmail.com');
      if (users[userIndex].name !== 'Lorenzi Coach') {
        users[userIndex].name = 'Lorenzi Coach';
        await setKey('users', users);
      }
    }
  }

  // Initialize exercises
  let exercises: Exercise[] = await getKey('exercises');
  if (!exercises) {
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
      }
    ];
    await setKey('exercises', exercises);
  }

  // Initialize workouts
  let workouts: Workout[] = await getKey('workouts');
  if (!workouts) {
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
      }
    ];
    await setKey('workouts', workouts);
  }

  // Initialize weight progress
  let weightProgress: WeightProgress[] = await getKey('weight_progress');
  if (!weightProgress) {
    weightProgress = [
      {
        id: 1,
        client_id: 2,
        weight: 75.5,
        date: new Date().toISOString(),
        notes: 'Peso iniziale'
      }
    ];
    await setKey('weight_progress', weightProgress);
  }

  // Initialize nutrition data
  let nutritionData: NutritionData[] = await getKey('nutrition_data');
  if (!nutritionData) {
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
  let photoProgress: any[] = await getKey('photo_progress');
  if (!photoProgress) {
    photoProgress = [];
    await setKey('photo_progress', photoProgress);
  }

  // Initialize workout sessions
  let workoutSessions: any[] = await getKey('workout_sessions');
  if (!workoutSessions) {
    workoutSessions = [];
    await setKey('workout_sessions', workoutSessions);
  }

  console.log('✅ Database inizializzato con successo!');
  console.log('📊 Dati utente, workout, esercizi e progresso caricati');
}

// Get today's workout for a client
export async function getTodayWorkoutForClient(clientId: number): Promise<Workout | null> {
  try {
    const workouts: Workout[] = await getKey('workouts') || [];
    const today = new Date().toISOString().split('T')[0];
    
    const todayWorkout = workouts.find(w => 
      w.client_id === clientId && 
      w.date === today && 
      !w.completed
    );

    if (!todayWorkout) return null;

    // Get exercise details
    const exercises: Exercise[] = await getKey('exercises') || [];
    const workoutWithExercises: Workout = {
      ...todayWorkout,
      exercises: todayWorkout.exercises.map(we => {
        const exercise = exercises.find(e => e.id === we.exercise_id);
        return {
          ...we,
          exercise: exercise || { name: 'Esercizio non trovato', instructions: '' } as Exercise
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
export async function getWeightProgress(clientId: number, days: number = 30): Promise<WeightProgress[]> {
  try {
    const progress: WeightProgress[] = await getKey('weight_progress') || [];
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
export async function saveWeightProgress(clientId: number, weight: number, notes: string = ''): Promise<WeightProgress> {
  try {
    const progress: WeightProgress[] = await getKey('weight_progress') || [];
    const newEntry: WeightProgress = {
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
export async function getLatestWeight(clientId: number): Promise<WeightProgress | null> {
  try {
    const progress: WeightProgress[] = await getKey('weight_progress') || [];
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
export async function getNutritionData(clientId: number): Promise<NutritionData | null> {
  try {
    const nutritionData: NutritionData[] = await getKey('nutrition_data') || [];
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
