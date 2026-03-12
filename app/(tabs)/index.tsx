import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';

export default function Index() {
  const router = useRouter();
  const { bloquesHorario, eventosGlobales } = useAppContext(); // Traemos eventosGlobales

  const [tiempoRestante, setTiempoRestante] = useState<string | null>(null);
  const [eventoProximo, setEventoProximo] = useState<any>(null);

  const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const fechaHoyStr = new Date().toLocaleDateString('es-ES', opcionesFecha).toUpperCase();

  const convertirAMinutos = (horaStr: string) => {
    if (!horaStr || !horaStr.includes(':')) return 0;
    const [h, m] = horaStr.split(':');
    return parseInt(h) * 60 + parseInt(m);
  };

  // Calcula la próxima clase del horario
  useEffect(() => {
    const calcularEventoProximo = () => {
      const ahora = new Date();
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const jsDay = ahora.getDay();
      const diaString = diasSemana[jsDay];

      const bloquesHoy = bloquesHorario.filter((b: any) => b.dia === diaString);
      bloquesHoy.sort((a: any, b: any) => convertirAMinutos(a.horaInicio) - convertirAMinutos(b.horaInicio));

      const proximo = bloquesHoy.find((b: any) => convertirAMinutos(b.horaInicio) > minutosActuales);

      if (proximo) {
        setEventoProximo(proximo);
        const diffMinutos = convertirAMinutos(proximo.horaInicio) - minutosActuales;

        if (diffMinutos <= 60) {
          setTiempoRestante(`Faltan ${diffMinutos} min`);
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
    const intervalo = setInterval(calcularEventoProximo, 60000);
    return () => clearInterval(intervalo);
  }, [bloquesHorario]);

  // Lógica simple para mostrar el evento más próximo del calendario
  // Por ahora, solo toma el primero de la lista global, idealmente se ordenaría por fecha real.
  const proximoEventoAgenda = eventosGlobales && eventosGlobales.length > 0
    ? eventosGlobales[0]
    : null;

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

        <View style={styles.gridContainer}>

          {/* Fila 1: Notas y Horario */}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.gridItem, styles.bgNotes]} activeOpacity={0.8} onPress={() => router.push('/apuntes')}>
              <View style={styles.iconCircleRed}>
                <Ionicons name="document-text" size={24} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.gridTitle}>Tomar Notas</Text>
                <Text style={styles.gridSubtitle}>Captura rápida</Text>
              </View>
            </TouchableOpacity>

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
              <View>
                <Text style={styles.gridTitle} numberOfLines={1}>{eventoProximo ? eventoProximo.ramo : 'Sin clases'}</Text>
                <Text style={styles.gridSubtitle} numberOfLines={1}>
                  {eventoProximo ? `${eventoProximo.horaInicio} • ${eventoProximo.aula || 'Próximo'}` : 'Nada programado hoy'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Fila 2: Tareas y EVENTOS (Intercambiado) */}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.gridItem, styles.bgTasks]} activeOpacity={0.8}>
              <View style={styles.iconCircleGreen}>
                <Ionicons name="checkbox" size={24} color="#10b981" />
              </View>
              <View>
                <Text style={styles.gridTitle}>Tareas</Text>
                <Text style={styles.gridSubtitle}>0 pendientes</Text>
              </View>
            </TouchableOpacity>

            {/* WIDGET DE EVENTOS AHORA EN FILA 2 */}
            <TouchableOpacity style={[styles.gridItem, styles.bgEvents]} activeOpacity={0.8} onPress={() => router.push('/eventos')}>
              <View style={styles.eventHeader}>
                <View style={styles.iconCircleOrange}>
                  <Ionicons name="calendar" size={24} color="#f59e0b" />
                </View>
                {proximoEventoAgenda && (
                  <View style={styles.badgeWarning}>
                    <Text style={styles.badgeWarningText}>{proximoEventoAgenda.fecha}</Text>
                  </View>
                )}
              </View>
              <View>
                <Text style={styles.gridTitle} numberOfLines={1}>
                  {proximoEventoAgenda ? proximoEventoAgenda.titulo : 'Evento cercano'}
                </Text>
                <Text style={styles.gridSubtitle} numberOfLines={1}>
                  {proximoEventoAgenda ? `A las ${proximoEventoAgenda.hora}` : 'Sin próximos eventos'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Fila 3: RENDIMIENTO (Intercambiado) y Ajustes */}
          <View style={styles.row}>
            {/* WIDGET DE RENDIMIENTO AHORA EN FILA 3 */}
            <TouchableOpacity style={[styles.gridItem, styles.bgStats]} activeOpacity={0.8} onPress={() => router.push('/ramos')}>
              <View style={styles.iconCirclePurple}>
                <Ionicons name="bar-chart" size={24} color="#8b5cf6" />
              </View>
              <View>
                <Text style={styles.gridTitle}>Rendimiento</Text>
                <Text style={styles.gridSubtitle}>Ver promedios</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridItem, styles.bgSettings]} activeOpacity={0.8}>
              <View style={styles.iconCircleGray}>
                <Ionicons name="settings" size={24} color="#64748b" />
              </View>
              <View>
                <Text style={styles.gridTitle}>Ajustes</Text>
                <Text style={styles.gridSubtitle}>Configuración</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  fecha: { fontSize: 12, color: '#64748b', fontWeight: 'bold', letterSpacing: 1 },
  saludo: { fontSize: 26, fontWeight: 'bold', color: '#0f172a', marginTop: 5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1 },
  gridContainer: { flex: 1, gap: 15 },
  row: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  gridItem: { flex: 1, borderRadius: 20, padding: 20, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  gridTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 10 },
  gridSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeUrgency: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: -5 },
  badgeText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  badgeWarning: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: -5 },
  badgeWarningText: { color: '#d97706', fontSize: 11, fontWeight: 'bold' },
  bgNotes: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgEvent: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#3b82f6', shadowOpacity: 0.1 },
  bgTasks: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgStats: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgEvents: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgSettings: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  iconCircleRed: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  iconCircleBlue: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  iconCircleGreen: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  iconCirclePurple: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  iconCircleOrange: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' },
  iconCircleGray: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
});