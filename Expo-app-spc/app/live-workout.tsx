import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Assicurati che queste funzioni esistano e siano importate correttamente dalla tua libreria api-client
// import { createWorkoutSession, saveWorkoutSet, completeSession } from '@/lib/api-client'; // Modifica questa riga se necessario

// Mock delle funzioni API per ora, poiché non sono state fornite
const createWorkoutSession = async (workoutId: number, clientId: number) => {
  console.log(`API: Creazione sessione per workout ${workoutId}, client ${clientId}`);
  // Simula una risposta API
  return { id: Date.now() };
};

const saveWorkoutSet = async (sessionId: number, exerciseId: number, setNumber: number, weight: number, reps: number) => {
  console.log(`API: Salvataggio set - Sessione ${sessionId}, Esercizio ${exerciseId}, Set ${setNumber}, Peso ${weight}, Reps ${reps}`);
  // Simula una risposta API
  return {};
};

const completeSession = async (sessionId: number, duration: number) => {
  console.log(`API: Completamento sessione ${sessionId} con durata ${duration}`);
  // Simula una risposta API
  return {};
};


interface WorkoutExercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  sets: number;
  reps: number;
  completed: boolean;
}

interface SetData {
  weight: number;
  reps: number;
  completed: boolean;
}

export default function LiveWorkoutScreen() {
  const router = useRouter();
  const { workoutId = '1' } = useLocalSearchParams();

  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [sets, setSets] = useState<SetData[]>([]);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date>(new Date());
  const [sessionId, setSessionId] = useState<number | null>(null);

  const clientId = 2; // Mock client ID

  useEffect(() => {
    loadWorkoutExercises();
    setWorkoutStartTime(new Date());
    startSession();
  }, []);

  const startSession = async () => {
    try {
      const session = await createWorkoutSession(parseInt(workoutId), clientId);
      setSessionId(session.id);
    } catch (error) {
      console.error('Errore avvio sessione:', error);
      Alert.alert('Errore', 'Impossibile avviare la sessione di allenamento. Riprova più tardi.');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restTimer]);

  const loadWorkoutExercises = () => {
    // Mock data per il workout - QUESTO DOVREBBE ESSERE SOSTITUITO CON UNA CHIAMATA API PER CARICARE GLI ESERCIZI REALI
    const mockExercises: WorkoutExercise[] = [
      { id: 1, exercise_id: 1, exercise_name: 'Push-up', sets: 3, reps: 15, completed: false },
      { id: 2, exercise_id: 6, exercise_name: 'Bench Press', sets: 4, reps: 12, completed: false },
      { id: 3, exercise_id: 10, exercise_name: 'Tricep Dips', sets: 3, reps: 10, completed: false },
    ];

    setExercises(mockExercises);
    if (mockExercises.length > 0) {
      const firstExercise = mockExercises[0];
      setSets(Array(firstExercise.sets).fill(null).map(() => ({ weight: 20, reps: firstExercise.reps, completed: false })));
      setReps(firstExercise.reps);
    }
  };

  const adjustWeight = (increment: number) => {
    setWeight(prev => Math.max(0, prev + increment));
  };

  const adjustReps = (increment: number) => {
    setReps(prev => Math.max(0, prev + increment));
  };

  const completeSet = async () => {
    if (!sessionId) {
      Alert.alert('Errore', 'La sessione non è attiva.');
      return;
    }

    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) return;

    const newSets = [...sets];
    newSets[currentSet] = { weight, reps, completed: true };
    setSets(newSets);

    // Salva il set nel database tramite API
    try {
      await saveWorkoutSet(sessionId, currentExercise.exercise_id, currentSet + 1, weight, reps);
      console.log(`Set salvato: ${weight}kg x ${reps} reps`);
    } catch (error) {
      console.error('Errore salvataggio set:', error);
      Alert.alert('Errore Salvataggio', 'Impossibile salvare i dati del set. Riprova.');
      return; // Non procedere se il salvataggio fallisce
    }

    if (currentSet < sets.length - 1) {
      // Più serie da fare - inizia riposo
      setCurrentSet(currentSet + 1);
      setRestTimer(90); // 90 secondi di riposo
      setIsResting(true);
    } else {
      // Esercizio completato
      completeExercise();
    }
  };

  const completeExercise = () => {
    const newExercises = [...exercises];
    newExercises[currentExerciseIndex].completed = true;
    setExercises(newExercises);

    if (currentExerciseIndex < exercises.length - 1) {
      // Vai al prossimo esercizio
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(0);
      const nextExercise = exercises[currentExerciseIndex + 1];
      setSets(Array(nextExercise.sets).fill(null).map(() => ({ weight: 20, reps: nextExercise.reps, completed: false })));
      setWeight(20);
      setReps(nextExercise.reps);
    } else {
      // Workout completato
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - workoutStartTime.getTime()) / 1000 / 60); // minuti

    // Salva la sessione completata tramite API
    if (sessionId) {
      try {
        await completeSession(sessionId, duration);
        console.log(`Sessione completata: ${duration} minuti`);
      } catch (error) {
        console.error('Errore completamento sessione:', error);
        Alert.alert('Errore Completamento', 'Impossibile completare la sessione. Riprova più tardi.');
      }
    }

    Alert.alert(
      '🎉 WORKOUT COMPLETATO!',
      `Durata: ${duration} minuti\nOttimo lavoro!`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (exercises.length === 0 || sessionId === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Caricamento workout...</Text>
      </View>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const completedSets = sets.filter(s => s.completed).length;

  // Schermata riposo
  if (isResting) {
    return (
      <View style={styles.restContainer}>
        <Text style={styles.restTitle}>RIPOSO</Text>
        <Text style={styles.restTimer}>{formatTime(restTimer)}</Text>
        <Text style={styles.restExercise}>{currentExercise.exercise_name}</Text>
        <Text style={styles.restSet}>SERIE {currentSet + 1} / {sets.length}</Text>

        <TouchableOpacity style={styles.skipRestButton} onPress={skipRest}>
          <Text style={styles.skipRestText}>SALTA RIPOSO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con progresso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={32} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.progress}>
          {currentExerciseIndex + 1} / {exercises.length}
        </Text>
      </View>

      {/* Esercizio corrente */}
      <Animated.View entering={FadeInUp} style={styles.exerciseContainer}>
        <Text style={styles.exerciseName}>{currentExercise.exercise_name}</Text>
        <Text style={styles.setInfo}>
          SERIE {currentSet + 1} DI {sets.length}
        </Text>
      </Animated.View>

      {/* Serie precedenti */}
      {completedSets > 0 && (
        <View style={styles.previousSets}>
          <Text style={styles.previousSetsTitle}>SERIE COMPLETATE</Text>
          {sets.slice(0, completedSets).map((set, index) => (
            <View key={index} style={styles.completedSet}>
              <Text style={styles.completedSetText}>
                Serie {index + 1}: {set.weight}kg × {set.reps} rip
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          ))}
        </View>
      )}

      {/* Input peso */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.inputSection}>
        <Text style={styles.inputLabel}>PESO (KG)</Text>
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.adjustButton} 
            onPress={() => adjustWeight(-2.5)}
          >
            <Text style={styles.adjustButtonText}>-2.5</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.weightInput}
            value={weight.toString()}
            onChangeText={(text) => setWeight(parseFloat(text) || 0)}
            keyboardType="numeric"
            selectTextOnFocus
          />

          <TouchableOpacity 
            style={styles.adjustButton} 
            onPress={() => adjustWeight(2.5)}
          >
            <Text style={styles.adjustButtonText}>+2.5</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Input ripetizioni */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.inputSection}>
        <Text style={styles.inputLabel}>RIPETIZIONI</Text>
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.adjustButton} 
            onPress={() => adjustReps(-1)}
          >
            <Text style={styles.adjustButtonText}>-1</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.repsInput}
            value={reps.toString()}
            onChangeText={(text) => setReps(parseInt(text) || 0)}
            keyboardType="numeric"
            selectTextOnFocus
          />

          <TouchableOpacity 
            style={styles.adjustButton} 
            onPress={() => adjustReps(1)}
          >
            <Text style={styles.adjustButtonText}>+1</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Bottone completa serie */}
      <Animated.View entering={FadeInDown} style={styles.actionContainer}>
        <TouchableOpacity style={styles.completeButton} onPress={completeSet}>
          <Ionicons name="checkmark" size={40} color={Colors.light.buttonText} />
          <Text style={styles.completeButtonText}>
            {currentSet < sets.length - 1 ? 'COMPLETA SERIE' : 'PROSSIMO ESERCIZIO'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
    color: Colors.light.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  exerciseContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  exerciseName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  setInfo: {
    fontSize: 18,
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  previousSets: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 12,
  },
  previousSetsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  completedSet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  completedSetText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  inputSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButton: {
    backgroundColor: Colors.light.primary,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  adjustButtonText: {
    color: Colors.light.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  weightInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 20,
    width: 120,
    height: 100,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.light.text,
  },
  repsInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 20,
    width: 120,
    height: 100,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.light.text,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  completeButtonText: {
    color: Colors.light.buttonText,
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  restContainer: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  restTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.light.buttonText,
    marginBottom: 30,
  },
  restTimer: {
    fontSize: 120,
    fontWeight: 'bold',
    color: Colors.light.buttonText,
    marginBottom: 30,
  },
  restExercise: {
    fontSize: 24,
    color: Colors.light.buttonText,
    textAlign: 'center',
    marginBottom: 10,
  },
  restSet: {
    fontSize: 18,
    color: Colors.light.buttonText,
    opacity: 0.8,
    marginBottom: 50,
  },
  skipRestButton: {
    backgroundColor: Colors.light.buttonText,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  skipRestText: {
    color: Colors.light.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});