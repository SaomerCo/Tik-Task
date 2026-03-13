import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';

// IMPORTAMOS NUESTRA NUEVA PANTALLA DE BIENVENIDA
import Bienvenida from '../../components/Bienvenida';

export default function Index() {
  const router = useRouter();

  const { bloquesHorario, eventosGlobales, tareasGlobales } = useAppContext();

  const [tiempoRestante, setTiempoRestante] = useState<string | null>(null);
  const [eventoProximo, setEventoProximo] = useState<any>(null);

  // ESTADO PARA GUARDAR EL NOMBRE DEL USUARIO
  const [nombreUsuario, setNombreUsuario] = useState('Estudiante');

  const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const fechaHoyStr = new Date().toLocaleDateString('es-ES', opcionesFecha).toUpperCase();

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

      const diaHoyString = diasSemana[jsDay];
      const diaMananaString = diasSemana[(jsDay + 1) % 7];

      let clasesCandidatas = bloquesHorario
        .filter((b: any) => b.dia === diaHoyString && convertirAMinutos(b.horaInicio) > minutosActuales)
        .map((b: any) => ({ ...b, diffMinutos: convertirAMinutos(b.horaInicio) - minutosActuales }));

      if (clasesCandidatas.length === 0) {
        clasesCandidatas = bloquesHorario
          .filter((b: any) => b.dia === diaMananaString)
          .map((b: any) => ({
            ...b,
            diffMinutos: (24 * 60 - minutosActuales) + convertirAMinutos(b.horaInicio)
          }));
      }

      clasesCandidatas.sort((a: any, b: any) => a.diffMinutos - b.diffMinutos);
      const proximo = clasesCandidatas.length > 0 ? clasesCandidatas[0] : null;

      if (proximo && proximo.diffMinutos <= 600) {
        setEventoProximo(proximo);

        if (proximo.diffMinutos <= 60) {
          setTiempoRestante(`Faltan ${proximo.diffMinutos} min`);
        } else {
          const horas = Math.floor(proximo.diffMinutos / 60);
          const mins = proximo.diffMinutos % 60;
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

  const eventoAgendaProximo = eventosGlobales && eventosGlobales.length > 0
    ? [...eventosGlobales]
      .filter(ev => ev && ev.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp)[0]
    : null;

  const hoyStr = new Date().toLocaleDateString('es-ES');
  const tareasDeHoy = tareasGlobales ? tareasGlobales.filter((t: any) => t.fechaCreacion === hoyStr) : [];

  const tareasCompletadas = tareasDeHoy.filter((t: any) => t.completada).length;
  const tareasTotal = tareasDeHoy.length;
  const tareasPendientes = tareasTotal - tareasCompletadas;

  let estadoTareas = 'vacio';
  if (tareasTotal > 0 && tareasPendientes > 0) estadoTareas = 'pendientes';
  if (tareasTotal > 0 && tareasPendientes === 0) estadoTareas = 'completadas';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* RENDERIZAMOS EL MODAL DE BIENVENIDA */}
      <Bienvenida onCompletado={setNombreUsuario} />

      <View style={styles.header}>
        <View>
          <Text style={styles.fecha}>{fechaHoyStr}</Text>
          {/* USAMOS LA VARIABLE nombreUsuario EN LUGAR DE "Felipe" */}
          <Text style={styles.saludo}>Hola, {nombreUsuario} 👋</Text>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#475569" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.gridContainer}>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.gridItem, styles.bgNotes]} activeOpacity={0.8} onPress={() => router.push('/apuntes')}>
              <View style={styles.iconWrapper}>
                <View style={styles.iconCircleRed}>
                  <Ionicons name="document-text" size={32} color="#ef4444" />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.gridTitle}>Tomar Notas</Text>
                <Text style={styles.gridSubtitle}>Captura rápida</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridItem, styles.bgEvent]} activeOpacity={0.8} onPress={() => router.push('/horario')}>
              {tiempoRestante && (
                <View style={styles.badgeTopContainer}>
                  <View style={styles.badgeUrgency}>
                    <Text style={styles.badgeText}>{tiempoRestante}</Text>
                  </View>
                </View>
              )}
              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircleBlue, { backgroundColor: eventoProximo ? eventoProximo.colorHex + '20' : '#f1f5f9' }]}>
                  <Ionicons name="time" size={32} color={eventoProximo ? eventoProximo.colorHex : "#94a3b8"} />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.gridTitle} numberOfLines={1}>{eventoProximo ? eventoProximo.ramo : 'Sin clases'}</Text>
                <Text style={styles.gridSubtitle} numberOfLines={1}>
                  {eventoProximo ? `${eventoProximo.horaInicio} • ${eventoProximo.aula || 'Próximo'}` : 'Nada programado hoy'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.gridItem, styles.bgTasks]} activeOpacity={0.8} onPress={() => router.push('/enfoque')}>
              <View style={styles.iconWrapper}>
                {estadoTareas === 'vacio' && (
                  <View style={styles.iconCircleGray}>
                    <Ionicons name="list" size={32} color="#64748b" />
                  </View>
                )}
                {estadoTareas === 'pendientes' && (
                  <View style={styles.iconCircleOrange}>
                    <Ionicons name="checkbox-outline" size={32} color="#f59e0b" />
                  </View>
                )}
                {estadoTareas === 'completadas' && (
                  <View style={styles.iconCircleGreen}>
                    <Ionicons name="checkmark-done-circle" size={32} color="#10b981" />
                  </View>
                )}
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.gridTitle}>Tareas</Text>
                {estadoTareas === 'vacio' && <Text style={styles.gridSubtitle}>Ninguna para hoy</Text>}
                {estadoTareas === 'pendientes' && <Text style={[styles.gridSubtitle, { color: '#f59e0b', fontWeight: 'bold' }]}>{tareasPendientes} pendientes</Text>}
                {estadoTareas === 'completadas' && <Text style={[styles.gridSubtitle, { color: '#10b981', fontWeight: 'bold' }]}>¡Todo listo!</Text>}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridItem, styles.bgEvents]} activeOpacity={0.8} onPress={() => router.push('/eventos')}>
              <View style={styles.badgeTopContainer}>
                <Text style={styles.smallBadgeTop}>Evento cercano</Text>
              </View>
              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircleYellow, eventoAgendaProximo && { backgroundColor: eventoAgendaProximo.color + '20' }]}>
                  <Ionicons name={eventoAgendaProximo ? (eventoAgendaProximo.icono as any) : "calendar"} size={32} color={eventoAgendaProximo ? eventoAgendaProximo.color : "#eab308"} />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.gridTitle} numberOfLines={1}>
                  {eventoAgendaProximo ? eventoAgendaProximo.titulo : 'Agenda vacía'}
                </Text>
                <Text style={styles.gridSubtitle} numberOfLines={1}>
                  {eventoAgendaProximo ? `${eventoAgendaProximo.fecha} • ${eventoAgendaProximo.hora.split(' - ')[0]}` : 'Sin próximos eventos'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.gridItem, styles.bgStats]} activeOpacity={0.8} onPress={() => router.push('/rendimiento')}>
              <View style={styles.iconWrapper}>
                <View style={styles.iconCirclePurple}>
                  <Ionicons name="bar-chart" size={32} color="#8b5cf6" />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.gridTitle}>Rendimiento</Text>
                <Text style={styles.gridSubtitle}>Ver promedios</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridItem, styles.bgSettings]} activeOpacity={0.8}>
              <View style={styles.iconWrapper}>
                <View style={styles.iconCircleGray}>
                  <Ionicons name="settings" size={32} color="#64748b" />
                </View>
              </View>
              <View style={styles.textWrapper}>
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
    paddingBottom: 20,
    flexGrow: 1,
  },
  gridContainer: {
    flex: 1,
    gap: 15,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  gridItem: {
    flex: 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  badgeTopContainer: {
    position: 'absolute',
    top: 15,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  iconWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  textWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  gridTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  gridSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },

  badgeUrgency: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  smallBadgeTop: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  bgNotes: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgEvent: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#3b82f6', shadowOpacity: 0.1 },
  bgTasks: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgStats: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgEvents: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  bgSettings: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },

  iconCircleRed: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  iconCircleBlue: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  iconCircleGreen: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  iconCirclePurple: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  iconCircleOrange: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' },
  iconCircleYellow: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fef9c3', justifyContent: 'center', alignItems: 'center' },
  iconCircleGray: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
});