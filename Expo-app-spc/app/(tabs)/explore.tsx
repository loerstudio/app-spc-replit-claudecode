import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Schermata non utilizzata</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: Colors.light.text,
  },
});