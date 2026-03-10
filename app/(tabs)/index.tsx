import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ IMPORTACIÓN CORREGIDA

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* CABECERA */}
      <View style={styles.header}>
        <View>
          <Text style={styles.fecha}>LUNES, 9 DE MARZO</Text>
          <Text style={styles.saludo}>Hola, Felipe 👋</Text>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#475569" />
      </View>

      {/* TARJETA PRINCIPAL (HERO) */}
      <View style={styles.heroCard}>
        <View style={styles.etiquetaUrgente}>
          <Text style={styles.etiquetaTexto}>Próxima Clase en 20 min</Text>
        </View>
        <Text style={styles.heroTitle}>Cálculo III</Text>
        <Text style={styles.heroSubtitle}>📍 Sala A-214 • Prof. Martínez</Text>
      </View>

    </SafeAreaView>
  );
}

// AQUÍ VA EL "CSS" DE TU APP MÓVIL
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Da espacio para la barra de batería/hora
    paddingBottom: 20,
  },
  fecha: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  saludo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 5,
  },
  heroCard: {
    backgroundColor: '#1a73e8',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, 
  },
  etiquetaUrgente: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  etiquetaTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  }
});