import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ParallaxScrollView } from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';


interface DashboardData {
  user: {
    name: string;
    role: string;
  };
  todayWorkout: {
    id: number;
    name: string;
    exercises_count: number;
  } | null;
  latestWeight: {
    weight: number;
    date: string;
  } | null;
  nutritionProgress: {
    current_calories: number;
    daily_calories: number;
    current_protein: number;
    daily_protein: number;
  } | null;
}

export default function HomeScreen() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const currentUserId = 1; // Mock user ID

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Using the provided API base URL from the edited snippet, but keeping the original fetch logic structure
      const API_BASE = 'https://23498ded-965e-4cce-9361-313fcb4dc5d8-00-1pa7u3fhwqfqq.worf.replit.dev';
      const response = await fetch(`${API_BASE}/api/dashboard/${currentUserId}`);

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Mock data se il server non risponde, using the structure from original code
        setDashboardData({
          user: {
            name: "Mario Rossi",
            role: "client"
          },
          todayWorkout: {
            id: 1,
            name: "Push Day - Petto e Tricipiti",
            exercises_count: 6
          },
          latestWeight: {
            weight: 75.5,
            date: new Date().toISOString()
          },
          nutritionProgress: {
            current_calories: 1200,
            daily_calories: 2200,
            current_protein: 80,
            daily_protein: 150
          }
        });
      }
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
      // Mock data in caso di errore, using the structure from original code
      setDashboardData({
        user: {
          name: "Mario Rossi",
          role: "client"
        },
        todayWorkout: {
          id: 1,
          name: "Push Day - Petto e Tricipiti",
          exercises_count: 6
        },
        latestWeight: {
          weight: 75.5,
          date: new Date().toISOString()
        },
        nutritionProgress: {
          current_calories: 1200,
          daily_calories: 2200,
          current_protein: 80,
          daily_protein: 150
        }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const startWorkout = () => {
    if (dashboardData?.todayWorkout) {
      router.push(`/live-workout?workoutId=${dashboardData.todayWorkout.id}`);
    } else {
      Alert.alert('Attenzione', 'Nessun allenamento programmato per oggi');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Caricamento dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ciao, {dashboardData?.user.name || 'Utente'}!</Text>
          <Text style={styles.subtitle}>Pronto per allenarti oggi?</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => router.push('/chat')}
        >
          <Ionicons name="chatbubble-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Today's Workout Card */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="fitness-outline" size={24} color={Colors.light.primary} />
          <Text style={styles.cardTitle}>Allenamento di Oggi</Text>
        </View>

        {dashboardData?.todayWorkout ? (
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{dashboardData.todayWorkout.name}</Text>
            <Text style={styles.workoutDetails}>
              {dashboardData.todayWorkout.exercises_count} esercizi
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
              <Text style={styles.startButtonText}>Inizia Allenamento</Text>
              <Ionicons name="play" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noWorkout}>
            <Text style={styles.noWorkoutText}>Nessun allenamento programmato</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/training')}
            >
              <Text style={styles.browseButtonText}>Sfoglia Allenamenti</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Weight Card */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="scale-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.statTitle}>Peso</Text>
          </View>
          {dashboardData?.latestWeight ? (
            <View>
              <Text style={styles.statValue}>{dashboardData.latestWeight.weight} kg</Text>
              <Text style={styles.statDate}>
                {new Date(dashboardData.latestWeight.date).toLocaleDateString('it-IT')}
              </Text>
            </View>
          ) : (
            <Text style={styles.noData}>Nessun dato</Text>
          )}
        </Animated.View>

        {/* Calories Card */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="flame-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.statTitle}>Calorie</Text>
          </View>
          {dashboardData?.nutritionProgress ? (
            <View>
              <Text style={styles.statValue}>
                {dashboardData.nutritionProgress.current_calories}
              </Text>
              <Text style={styles.statGoal}>
                / {dashboardData.nutritionProgress.daily_calories} kcal
              </Text>
            </View>
          ) : (
            <Text style={styles.noData}>Nessun dato</Text>
          )}
        </Animated.View>
      </View>

      {/* Nutrition Progress */}
      {dashboardData?.nutritionProgress && (
        <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="nutrition-outline" size={24} color={Colors.light.primary} />
            <Text style={styles.cardTitle}>Progresso Nutrizionale</Text>
          </View>

          <View style={styles.nutritionStats}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Proteine</Text>
              <Text style={styles.nutritionValue}>
                {dashboardData.nutritionProgress.current_protein}g / {dashboardData.nutritionProgress.daily_protein}g
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((dashboardData.nutritionProgress.current_protein / dashboardData.nutritionProgress.daily_protein) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.nutritionButton}
              onPress={() => router.push('/nutrition')}
            >
              <Text style={styles.nutritionButtonText}>Visualizza Dettagli</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Quick Actions */}
      <Animated.View entering={FadeInUp.delay(600)} style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Azioni Rapide</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/workout-manager')}
          >
            <Ionicons name="barbell-outline" size={24} color={Colors.light.primary} />
            <Text style={styles.actionText}>Gestisci Allenamenti</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/chat')}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={Colors.light.primary} />
            <Text style={styles.actionText}>Messaggi Coach</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  notificationIcon: {
    padding: 8,
  },
  card: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 10,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: Colors.light.text,
  },
  workoutInfo: {
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  workoutDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noWorkout: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noWorkoutText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  browseButton: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  browseButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: Colors.light.text,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statGoal: {
    fontSize: 14,
    color: '#666',
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  nutritionStats: {
    gap: 15,
  },
  nutritionItem: {
    gap: 8,
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  nutritionValue: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  nutritionButton: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  nutritionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  quickActions: {
    margin: 20,
    marginTop: 10,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.light.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
});