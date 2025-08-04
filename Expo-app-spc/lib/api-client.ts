
const API_BASE = 'https://23498ded-965e-4cce-9361-313fcb4dc5d8-00-1pa7u3fhwqfqq.worf.replit.dev:5000';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface User {
  id: number;
  email: string;
  role: 'coach' | 'client';
  name: string;
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

interface WorkoutExercise {
  exercise_id: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  exercise?: Exercise;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_groups: string[];
  instructions: string;
  equipment: string;
}

interface WeightProgress {
  id: number;
  client_id: number;
  weight: number;
  date: string;
  notes: string;
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

interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  // Generic request method
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    return this.request<User>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Dashboard
  async getDashboard(userId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/dashboard/${userId}`);
  }

  // Workouts
  async getTodayWorkout(clientId: number): Promise<ApiResponse<Workout>> {
    return this.request<Workout>(`/api/workouts/today/${clientId}`);
  }

  async completeWorkout(workoutId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/api/workouts/${workoutId}/complete`, {
      method: 'POST',
    });
  }

  async batchCreateWorkouts(workouts: Partial<Workout>[]): Promise<ApiResponse<{ created: number; workouts: Workout[] }>> {
    return this.request<{ created: number; workouts: Workout[] }>('/api/batch/workouts', {
      method: 'POST',
      body: JSON.stringify({ workouts }),
    });
  }

  // Weight Progress
  async getWeightProgress(clientId: number, days: number = 30): Promise<ApiResponse<WeightProgress[]>> {
    return this.request<WeightProgress[]>(`/api/weight-progress/${clientId}?days=${days}`);
  }

  async saveWeightProgress(clientId: number, weight: number, notes: string = ''): Promise<ApiResponse<WeightProgress>> {
    return this.request<WeightProgress>(`/api/weight-progress/${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ weight, notes }),
    });
  }

  async getLatestWeight(clientId: number): Promise<ApiResponse<WeightProgress>> {
    return this.request<WeightProgress>(`/api/latest-weight/${clientId}`);
  }

  // Nutrition
  async getNutrition(clientId: number): Promise<ApiResponse<NutritionData>> {
    return this.request<NutritionData>(`/api/nutrition/${clientId}`);
  }

  // Photos
  async getLatestPhotos(clientId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/latest-photos/${clientId}`);
  }

  // Workout Sessions
  async createWorkoutSession(workoutId: number, clientId: number): Promise<ApiResponse<any>> {
    return this.request<any>('/api/workout-session', {
      method: 'POST',
      body: JSON.stringify({ workoutId, clientId }),
    });
  }

  async completeWorkoutSession(sessionId: number, durationMinutes: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/api/workout-session/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    });
  }

  // User Management (for coaches with many clients)
  async getUsers(page: number = 1, limit: number = 50, role?: string): Promise<ApiResponse<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (role) {
      params.append('role', role);
    }

    return this.request<{
      users: User[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/users?${params.toString()}`);
  }

  // Health Check
  async getHealth(): Promise<ApiResponse<any>> {
    return this.request<any>('/health');
  }

  // Batch operations for managing multiple clients
  async bulkUpdateClients(updates: Array<{ id: number; [key: string]: any }>): Promise<ApiResponse<any>> {
    return this.request<any>('/api/batch/clients/update', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  }

  async getClientStats(clientId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/client/${clientId}/stats`);
  }

  // Cache management
  async clearCache(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/api/cache/clear', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;

// Export types for use in components
export type {
  User,
  Workout,
  WorkoutExercise,
  Exercise,
  WeightProgress,
  NutritionData,
  Meal,
  ApiResponse
};
