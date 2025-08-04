
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

export default function WorkoutManagerScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const router = useRouter();

  // Mock coach ID
  const coachId = 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load workouts and exercises
      const [workoutsRes, exercisesRes] = await Promise.all([
        fetch('http://localhost:5000/api/workouts'),
        fetch('http://localhost:5000/api/exercises')
      ]);

      if (workoutsRes.ok) {
        const workoutsData = await workoutsRes.json();
        setWorkouts(workoutsData);
      }

      if (exercisesRes.ok) {
        const exercisesData = await exercisesRes.json();
        setExercises(exercisesData);
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async () => {
    if (!newWorkout.name.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per l\'allenamento');
      return;
    }

    try {
      const workout = {
        ...newWorkout,
        client_id: 2, // Mock client ID
        coach_id: coachId,
        exercises: [],
        completed: false,
        duration_minutes: 0
      };

      const response = await fetch('http://localhost:5000/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workout),
      });

      if (response.ok) {
        const createdWorkout = await response.json();
        setWorkouts(prev => [...prev, createdWorkout]);
        setShowAddModal(false);
        setNewWorkout({
          name: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        Alert.alert('Successo', 'Allenamento creato con successo!');
      }
    } catch (error) {
      console.error('Errore creazione workout:', error);
      Alert.alert('Errore', 'Impossibile creare l\'allenamento');
    }
  };

  const deleteWorkout = (workoutId: number) => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler eliminare questo allenamento?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:5000/api/workouts/${workoutId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                setWorkouts(prev => prev.filter(w => w.id !== workoutId));
                Alert.alert('Successo', 'Allenamento eliminato');
              }
            } catch (error) {
              console.error('Errore eliminazione workout:', error);
              Alert.alert('Errore', 'Impossibile eliminare l\'allenamento');
            }
          }
        }
      ]
    );
  };

  const renderWorkout = (workout: Workout, index: number) => (
    <Animated.View key={workout.id} entering={FadeInUp.delay(index * 100)}>
      <View style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDate}>
              {new Date(workout.date).toLocaleDateString('it-IT')}
            </Text>
            {workout.description && (
              <Text style={styles.workoutDescription}>{workout.description}</Text>
            )}
          </View>
          <View style={styles.workoutActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteWorkout(workout.id)}
            >
              <Ionicons name="trash" size={20} color={Colors.light.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <Ionicons name="fitness" size={16} color={Colors.light.primary} />
            <Text style={styles.statText}>{workout.exercises.length} esercizi</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color={Colors.light.primary} />
            <Text style={styles.statText}>{workout.duration_minutes} min</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons 
              name={workout.completed ? "checkmark-circle" : "time"} 
              size={16} 
              color={workout.completed ? "#4CAF50" : Colors.light.primary} 
            />
            <Text style={styles.statText}>
              {workout.completed ? "Completato" : "In programma"}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestisci Allenamenti</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Workouts List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {workouts.map((workout, index) => renderWorkout(workout, index))}
        
        {workouts.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness" size={60} color={Colors.light.primary} />
            <Text style={styles.emptyText}>Nessun allenamento creato</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.createButtonText}>Crea il primo allenamento</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Workout Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuovo Allenamento</Text>
            <TouchableOpacity onPress={createWorkout}>
              <Text style={styles.modalSave}>Salva</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nome Allenamento</Text>
              <TextInput
                style={styles.formInput}
                value={newWorkout.name}
                onChangeText={(text) => setNewWorkout(prev => ({ ...prev, name: text }))}
                placeholder="Es. Allenamento Petto e Tricipiti"
                placeholderTextColor={Colors.light.text + '80'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descrizione</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newWorkout.description}
                onChangeText={(text) => setNewWorkout(prev => ({ ...prev, description: text }))}
                placeholder="Descrizione dell'allenamento (opzionale)"
                placeholderTextColor={Colors.light.text + '80'}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Data</Text>
              <TextInput
                style={styles.formInput}
                value={newWorkout.date}
                onChangeText={(text) => setNewWorkout(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.text + '80'}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  workoutCard: {
    backgroundColor: Colors.light.background,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 5,
  },
  workoutDate: {
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 5,
  },
  workoutDescription: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
  workoutActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: Colors.light.text,
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  modalSave: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
