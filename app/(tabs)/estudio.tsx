import { StyleSheet, Text, View } from 'react-native';

export default function Pantalla() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Estudio</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  texto: { fontSize: 20, fontWeight: 'bold', color: '#334155' }
});