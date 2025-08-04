import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  fetchWeightProgress,
  submitWeightProgress,
  fetchLatestWeight,
} from '@/lib/api-client';

const screenWidth = Dimensions.get('window').width;

export default function NutritionScreen() {
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const clientId = 2; // Default client ID for testing

  useEffect(() => {
    let isMounted = true;

    const loadNutritionData = async () => {
      if (!isMounted) return;

      setLoading(true);
      try {
        // Import dinamico per evitare errori di modulo
        const { getNutritionData } = await import('../../lib/api-client');
        // const clientId = 2; // In a real app, get from user context

        const result = await getNutritionData(clientId);

        if (isMounted) {
          if (result.success) {
            setNutritionData(result.data);
          } else {
            setNutritionData(null); // Assicurati che i dati siano null in caso di fallimento
          }
        }
      } catch (error) {
        console.error('Errore caricamento dati nutrizione:', error);
        Alert.alert('Errore', 'Impossibile caricare i dati nutrizionali');
        if (isMounted) {
          setNutritionData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNutritionData();

    return () => {
      isMounted = false;
    };
  }, []);

  const [weightHistory, setWeightHistory] = useState([]);
  const [photoHistory, setPhotoHistory] = useState([]);
  const [latestWeight, setLatestWeight] = useState(null);
  const [currentWeight, setCurrentWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [loading1, setLoading1] = useState(true);

  // const clientId = 2; // ID cliente corrente - dovrebbe venire dal contesto di autenticazione

  useEffect(() => {
    loadProgressData();
  }, []);


  const loadProgressData = async () => {
    try {
      setLoading1(true);

      // Carica storico peso ultimi 30 giorni dalla API
      const weightResult = await fetchWeightProgress(clientId, 30);
      if (weightResult.success) {
        setWeightHistory(weightResult.data);
      } else {
        setWeightHistory([]); // Assicurati che sia un array vuoto in caso di fallimento
      }

      // Carica ultimo peso registrato dalla API
      const latestResult = await fetchLatestWeight(clientId);
      if (latestResult.success) {
        setLatestWeight(latestResult.data);
      } else {
        setLatestWeight(null); // Assicurati che sia null in caso di fallimento
      }

    } catch (error) {
      console.error('Errore caricamento dati:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati dei progressi');
      setWeightHistory([]); // Resetta lo storico in caso di errore
      setLatestWeight(null); // Resetta l'ultimo peso in caso di errore
    } finally {
      setLoading1(false);
    }
  };

  const handleAddWeight = async () => {
    if (!currentWeight) {
      Alert.alert('Errore', 'Inserisci il peso');
      return;
    }

    try {
      setLoading1(true);

      const weight = parseFloat(currentWeight);
      if (isNaN(weight) || weight <= 0) {
        Alert.alert('Errore', 'Inserisci un peso valido');
        return;
      }

      // Salva nel database tramite API
      const result = await submitWeightProgress(clientId, weight, notes || null);

      if (result.success) {
        // Ricarica i dati dalla API
        await loadProgressData();

        setCurrentWeight('');
        setNotes('');
        setShowAddWeight(false);
        Alert.alert('Successo', 'Peso registrato correttamente!');

      } else {
        // Gestisci il caso in cui la risposta API indichi un fallimento
        Alert.alert('Errore', result.message || 'Impossibile salvare il peso');
      }

    } catch (error) {
      console.error('Errore salvataggio peso:', error);
      Alert.alert('Errore', 'Impossibile salvare il peso');
    } finally {
      setLoading1(false);
    }
  };

  const pickImage = async (type: 'front' | 'back') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;

        // Invia l'immagine tramite API
        // Assumendo che savePhotoProgress ora gestisca l'upload API
        // Sostituire savePhotoProgress con una chiamata API corretta se necessario
        // await savePhotoProgress(clientId, imageUri, null); // Esempio di come potrebbe essere chiamata
        Alert.alert('Successo', `Foto ${type === 'front' ? 'fronte' : 'retro'} aggiunta!`);
        await loadProgressData();
      }
    } catch (error) {
      console.error('Errore salvataggio foto:', error);
      Alert.alert('Errore', 'Impossibile salvare la foto');
    }
  };

  const chartData = weightHistory.length > 0 ? {
    labels: weightHistory.slice(-6).map(item => {
      const date = new Date(item.recorded_date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: weightHistory.slice(-6).map(item => parseFloat(item.weight)),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3
      }
    ]
  } : {
    labels: [''],
    datasets: [{ data: [0] }]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PROGRESSI</Text>
      </View>

      {/* Peso attuale */}
      <Animated.View entering={FadeInUp} style={styles.currentWeightCard}>
        <Text style={styles.cardTitle}>PESO ATTUALE</Text>
        <Text style={styles.weightText}>
          {latestWeight ? `${parseFloat(latestWeight.weight).toFixed(1)} kg` : 'Non disponibile'}
        </Text>
        {latestWeight && (
          <Text style={styles.weightDate}>
            Ultimo aggiornamento: {new Date(latestWeight.recorded_date).toLocaleDateString('it-IT')}
          </Text>
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddWeight(true)}
        >
          <Ionicons name="add" size={24} color={Colors.light.buttonText} />
          <Text style={styles.addButtonText}>AGGIUNGI PESO</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Form aggiunta peso */}
      {showAddWeight && (
        <Animated.View entering={FadeInUp} style={styles.addWeightForm}>
          <Text style={styles.formTitle}>NUOVO PESO</Text>
          <TextInput
            style={styles.weightInput}
            placeholder="Peso (kg)"
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={styles.notesInput}
            placeholder="Note (opzionale)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddWeight(false)}
            >
              <Text style={styles.cancelButtonText}>ANNULLA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading1 && styles.buttonDisabled]}
              onPress={handleAddWeight}
              disabled={loading1}
            >
              <Text style={styles.saveButtonText}>
                {loading1 ? 'SALVANDO...' : 'SALVA'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Grafico peso */}
      {!loading1 && weightHistory.length > 0 && (
        <Animated.View entering={FadeInUp.delay(100)} style={styles.chartCard}>
          <Text style={styles.cardTitle}>ANDAMENTO PESO</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: Colors.light.background,
              backgroundGradientFrom: Colors.light.background,
              backgroundGradientTo: Colors.light.background,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => Colors.light.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: Colors.light.primary,
              },
            }}
            style={styles.chart}
          />
        </Animated.View>
      )}

      {/* Foto progressi */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.photosCard}>
        <Text style={styles.cardTitle}>FOTO PROGRESSI</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => pickImage('front')}
          >
            <Ionicons name="camera" size={40} color={Colors.light.buttonText} />
            <Text style={styles.photoButtonText}>FOTO FRONTE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => pickImage('back')}
          >
            <Ionicons name="camera" size={40} color={Colors.light.buttonText} />
            <Text style={styles.photoButtonText}>FOTO RETRO</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
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
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  currentWeightCard: {
    backgroundColor: Colors.light.background,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
  },
  weightText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addWeightForm: {
    backgroundColor: Colors.light.background,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  weightInput: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.buttonText,
  },
  chartCard: {
    backgroundColor: Colors.light.background,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  photosCard: {
    backgroundColor: Colors.light.background,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 30,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  photoButtonText: {
    color: Colors.light.buttonText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  weightDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});