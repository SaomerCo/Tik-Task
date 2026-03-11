import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const { bloquesHorario } = useAppContext();
  
  const [tiempoRestante, setTiempoRestante] = useState<string | null>(null);
  const [eventoProximo, setEventoProximo] = useState<any>(null);

  // Configurar fecha del header
  const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const fechaHoyStr = new Date().toLocaleDateString('es-ES', opcionesFecha).toUpperCase();

  // Helper para tiempo
  const convertirAMinutos = (horaStr: string) => {
    if (!horaStr || !horaStr.includes(':')) return 0;
    const [h, m] = horaStr.split(':');
    return parseInt(h) * 60 + parseInt(m);
  };

  useEffect(() => {
    const calcularEventoProximo = () => {
      const ahora = new Date();
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const jsDay = ahora.getDay();
      const diaString = diasSemana[jsDay]; // Ej: 'Mie'

      const bloquesHoy = bloquesHorario.filter((b: any) => b.dia === diaString);
      
      bloquesHoy.sort((a: any, b: any) => convertirAMinutos(a.horaInicio) - convertirAMinutos(b.horaInicio));

      const proximo = bloquesHoy.find((b: any) => convertirAMinutos(b.horaInicio) > minutosActuales);

      if (proximo) {
        setEventoProximo(proximo);
        const diffMinutos = convertirAMinutos(proximo.horaInicio) - minutosActuales;
        
        if (diffMinutos <= 60) {
          setTiempoRestante(`Faltan ${diffMinutos} minutos`);
        } else {
          const horas = Math.floor(diffMinutos / 60);
          const mins = diffMinutos % 60;
          setTiempoRestante(`En ${horas}h ${mins}m`);
        }
      } else {
        setEventoProximo(null);
        setTiempoRestante(null);
      }
    };

    calcularEventoProximo();
    const intervalo = setInterval(calcularEventoProximo, 60000); // Recalcular cada minuto
    return () => clearInterval(intervalo);
  }, [bloquesHorario]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* CABECERA */}
      <View style={styles.header}>
        <View>
          <Text style={styles.fecha}>{fechaHoyStr}</Text>
          <Text style={styles.saludo}>Hola, Felipe 👋</Text>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#475569" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* GRID DE DASHBOARD 3x2 */}
        <View style={styles.gridContainer}>
          
          {/* Fila 1 */}
          <View style={styles.row}>
            {/* Notas Rápidas (WIDGET 1 ROJO) */}
            <TouchableOpacity style={[styles.gridItem, styles.bgNotes]} activeOpacity={0.8} onPress={() => router.push('/ramos')}>
              <View style={styles.iconCircleRed}>
                <Ionicons name="document-text" size={24} color="#ef4444" />
              </View>
              <Text style={styles.gridTitle}>Tomar Notas</Text>
              <Text style={styles.gridSubtitle}>Captura rápida</Text>
            </TouchableOpacity>

            {/* Próximo Evento (WIDGET 2 AZUL) */}
            <TouchableOpacity style={[styles.gridItem, styles.bgEvent]} activeOpacity={0.8} onPress={() => router.push('/horario')}>
              <View style={styles.eventHeader}>
                <View style={[styles.iconCircleBlue, { backgroundColor: eventoProximo ? eventoProximo.colorHex + '20' : '#dbeafe' }]}>
                  <Ionicons name="time" size={24} color={eventoProximo ? eventoProximo.colorHex : "#3b82f6"} />
                </View>
                {tiempoRestante && (
                  <View style={styles.badgeUrgency}>
                    <Text style={styles.badgeText}>{tiempoRestante}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gridTitle} numberOfLines={1}>{eventoProximo ? eventoProximo.ramo : 'Sin clases'}</Text>
              <Text style={styles.gridSubtitle} numberOfLines={1}>
                {eventoProximo ? `${eventoProximo.horaInicio} • ${eventoProximo.aula || 'Próximo'}` : 'Nada programado hoy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fila 2 */}
          <View style={styles.row}>
            {/* Tareas / Pendientes */}
            <TouchableOpacity style={[styles.gridItem, styles.bgTasks]} activeOpacity={0.8}>
              <View style={styles.iconCircleGreen}>
                <Ionicons name="checkbox" size={24} color="#10b981" />
              </View>
              <Text style={styles.gridTitle}>Tareas</Text>
              <Text style={styles.gridSubtitle}>0 pendientes</Text>
            </TouchableOpacity>

            {/* Promedios / Rendimiento */}
            <TouchableOpacity style={[styles.gridItem, styles.bgStats]} activeOpacity={0.8} onPress={() => router.push('/ramos')}>
              <View style={styles.iconCirclePurple}>
                <Ionicons name="bar-chart" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.gridTitle}>Rendimiento</Text>
              <Text style={styles.gridSubtitle}>Ver promedios</Text>
            </TouchableOpacity>
          </View>

          {/* Fila 3 */}
          <View style={styles.row}>
            {/* Asistencia */}
            <TouchableOpacity style={[styles.gridItem, styles.bgAttendance]} activeOpacity={0.8}>
              <View style={styles.iconCircleOrange}>
                <Ionicons name="hand-right" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.gridTitle}>Asistencia</Text>
              <Text style={styles.gridSubtitle}>Registro</Text>
            </TouchableOpacity>

            {/* Ajustes / Ciclo */}
            <TouchableOpacity style={[styles.gridItem, styles.bgSettings]} activeOpacity={0.8}>
              <View style={styles.iconCircleGray}>
                <Ionicons name="settings" size={24} color="#64748b" />
              </View>
              <Text style={styles.gridTitle}>Ajustes</Text>
              <Text style={styles.gridSubtitle}>Configuración</Text>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingTop: 40,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridContainer: {
    gap: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  gridItem: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 10,
  },
  gridSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeUrgency: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: -5,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bgNotes: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgEvent: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#3b82f6', shadowOpacity: 0.1 },
  bgTasks: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgStats: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgAttendance: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgSettings: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  iconCircleRed: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  iconCircleBlue: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  iconCircleGreen: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  iconCirclePurple: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  iconCircleOrange: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' },
  iconCircleGray: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
});
