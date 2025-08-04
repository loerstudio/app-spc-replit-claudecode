import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
// Rimosso import database diretto
// Rimosso import database diretto

interface Exercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  instructions: string;
  sets: number;
  reps: number;
  completed: boolean;
}

interface Workout {
  id: number;
  name: string;
  day_name: string;
  coach_name: string;
  completed: boolean;
  exercises: Exercise[];
}

export default function TrainingScreen() {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Mock client ID
  const clientId = 2; // Default client ID for testing

  useEffect(() => {
    loadTodayWorkout();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const loadTodayWorkout = async () => {
    try {
      setLoading(true);
      // Use the clientId defined in the component scope
      const response = await fetch(`http://localhost:5000/api/workouts/today/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch today\'s workout');
      }
      const result = await response.json();

      if (result.success && result.data) {
        setWorkout(result.data);
      } else {
        setWorkout(null);
      }
    } catch (error) {
      console.error('Errore caricamento workout:', error);
      Alert.alert('Errore', 'Impossibile caricare l\'allenamento');
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    router.push(`/live-workout?workoutId=${workout?.id}`);
  };

  const toggleExerciseCompleted = (exerciseId: number) => {
    const newCompletedExercises = new Set(completedExercises);
    if (completedExercises.has(exerciseId)) {
      newCompletedExercises.delete(exerciseId);
    } else {
      newCompletedExercises.add(exerciseId);
    }
    setCompletedExercises(newCompletedExercises);
  };

  const completeWorkout = () => {
    if (completedExercises.size < (workout?.exercises.length || 0)) {
      Alert.alert(
        'Allenamento incompleto',
        'Completa tutti gli esercizi prima di terminare l\'allenamento.'
      );
      return;
    }

    setIsTimerRunning(false);
    Alert.alert(
      'Complimenti! 🎉',
      `Allenamento completato in ${formatTime(timer)}!`,
      [
        {
          text: 'OK',
          onPress: () => {
            setIsWorkoutStarted(false);
            setTimer(0);
            setCompletedExercises(new Set());
            if (workout) {
              setWorkout({ ...workout, completed: true });
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const markWorkoutCompleted = async (workoutId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/workouts/${workoutId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark workout as completed');
      }
      // Handle success, maybe return some data or a success status
      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Errore nel completare l\'allenamento:', error);
      throw error; // Re-throw to be caught by the caller
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;

    try {
      await markWorkoutCompleted(workout.id);
      Alert.alert('Successo', 'Allenamento completato!');
      loadTodayWorkout(); // Reload
    } catch (error) {
      console.error('Errore completamento workout:', error);
      Alert.alert('Errore', 'Impossibile completare l\'allenamento');
    }
  };

  // Placeholder for actual data fetching functions
  const getTodayWorkout = async (clientId: number) => {
    const response = await fetch(`http://localhost:5000/api/workouts/today/${clientId}`);
    if (!response.ok) throw new Error('Failed to fetch today\'s workout');
    const result = await response.json();
    return result.data;
  };

  const getWeightProgress = async (clientId: number) => {
    const response = await fetch(`http://localhost:5000/api/progress/${clientId}`);
    if (!response.ok) throw new Error('Failed to fetch weight progress');
    const result = await response.json();
    return result.data || []; // Ensure it's an array
  };

  const getLatestWeight = async (clientId: number) => {
    const response = await fetch(`http://localhost:5000/api/progress/${clientId}/latest`);
    if (!response.ok) throw new Error('Failed to fetch latest weight');
    const result = await response.json();
    return result.data;
  };

  // This function was missing and is now added to resolve the "getNutritionData is not a function" error.
  const getNutritionData = async (clientId: number) => {
    const response = await fetch(`http://localhost:5000/api/nutrition/${clientId}`);
    if (!response.ok) throw new Error('Failed to fetch nutrition data');
    const result = await response.json();
    return result.data || [];
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ALLENAMENTO</Text>
      </View>

      {loading ? (
        <View style={styles.noWorkoutContainer}>
          <Text style={styles.noWorkoutText}>Caricamento...</Text>
        </View>
      ) : !workout ? (
        <View style={styles.noWorkoutContainer}>
          <Ionicons name="calendar-outline" size={80} color="#ccc" />
          <Text style={styles.noWorkoutText}>Nessun allenamento per oggi</Text>
          <Text style={styles.noWorkoutSubtext}>Riposa o contatta il tuo coach</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{workout.name}</Text>
            <Text style={styles.subtitle}>{workout.day_name} • Coach: {workout.coach_name}</Text>
            {isWorkoutStarted && (
              <View style={styles.timerContainer}>
                <Ionicons name="time" size={24} color={Colors.light.primary} />
                <Text style={styles.timerText}>{formatTime(timer)}</Text>
              </View>
            )}
          </View>

          {!isWorkoutStarted ? (
            <View style={styles.startContainer}>
              <ScrollView style={styles.previewContainer}>
                <Text style={styles.previewTitle}>ANTEPRIMA ALLENAMENTO</Text>
                {workout.exercises.map((exercise, index) => (
                  <Animated.View key={exercise.id} entering={FadeInUp.delay(index * 100)}>
                    <View style={styles.previewExerciseCard}>
                      <Ionicons name="fitness" size={30} color={Colors.light.primary} />
                      <View style={styles.previewExerciseInfo}>
                        <Text style={styles.previewExerciseName}>{exercise.exercise_name}</Text>
                        <Text style={styles.previewExerciseDetails}>
                          {exercise.sets} serie × {exercise.reps} ripetizioni
                        </Text>
                        <Text style={styles.previewMuscleGroup}>{exercise.muscle_group}</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </ScrollView>

              <Animated.View entering={FadeInDown}>
                <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
                  <Ionicons name="play" size={40} color={Colors.light.buttonText} />
                  <Text style={styles.startButtonText}>INIZIA ALLENAMENTO</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : (
            <ScrollView style={styles.workoutContainer}>
              {workout.exercises.map((exercise, index) => (
                <Animated.View key={exercise.id} entering={FadeInUp.delay(index * 100)}>
                  <View style={[
                    styles.exerciseCard,
                    completedExercises.has(exercise.id) && styles.completedCard
                  ]}>
                    <TouchableOpacity
                      style={styles.exerciseHeader}
                      onPress={() => toggleExerciseCompleted(exercise.id)}
                    >
                      <View style={styles.exerciseCheckbox}>
                        {completedExercises.has(exercise.id) ? (
                          <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                        ) : (
                          <Ionicons name="ellipse-outline" size={40} color="#ccc" />
                        )}
                      </View>

                      <View style={styles.exerciseInfo}>
                        <Text style={[
                          styles.exerciseName,
                          completedExercises.has(exercise.id) && styles.completedText
                        ]}>
                          {exercise.exercise_name}
                        </Text>
                        <Text style={styles.exerciseStats}>
                          {exercise.sets} SERIE × {exercise.reps} RIPETIZIONI
                        </Text>
                        <Text style={styles.muscleGroup}>{exercise.muscle_group}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.instructionsContainer}>
                      <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                      <Text style={styles.instructions}>{exercise.instructions}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}

              <Animated.View entering={FadeInDown} style={styles.actionContainer}>
                {completedExercises.size === workout.exercises.length && (
                  <TouchableOpacity style={styles.completeButton} onPress={handleCompleteWorkout}>
                    <Ionicons name="checkmark-circle" size={30} color={Colors.light.buttonText} />
                    <Text style={styles.completeButtonText}>COMPLETA ALLENAMENTO</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={() => setIsTimerRunning(!isTimerRunning)}
                >
                  <Ionicons
                    name={isTimerRunning ? "pause" : "play"}
                    size={24}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.pauseButtonText}>
                    {isTimerRunning ? 'PAUSA' : 'RIPRENDI'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primary,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginLeft: 10,
  },
  noWorkoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noWorkoutText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
  noWorkoutSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  startContainer: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  previewExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#eee',
  },
  previewExerciseInfo: {
    flex: 1,
    marginLeft: 15,
  },
  previewExerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  previewExerciseDetails: {
    fontSize: 16,
    color: Colors.light.primary,
    marginTop: 5,
    fontWeight: 'bold',
  },
  previewMuscleGroup: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  startButton: {
    backgroundColor: '#FF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 25,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    color: Colors.light.buttonText,
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  workoutContainer: {
    flex: 1,
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: Colors.light.background,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  completedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  exerciseCheckbox: {
    marginRight: 20,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  exerciseStats: {
    fontSize: 18,
    color: Colors.light.primary,
    fontWeight: 'bold',
    marginTop: 5,
  },
  muscleGroup: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f0f0',
    padding: 15,
    margin: 15,
    borderRadius: 10,
  },
  instructions: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 20,
  },
  actionContainer: {
    paddingBottom: 40,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  completeButtonText: {
    color: Colors.light.buttonText,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  pauseButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  pauseButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: 'bold',
  },
});