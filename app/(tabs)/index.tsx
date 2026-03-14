import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useTabContext } from '../../context/TabContext';
// IMPORTAMOS NUESTRA NUEVA PANTALLA DE BIENVENIDA Y LAS NOTIFICACIONES
import Bienvenida from '../../components/Bienvenida';
import { sincronizarNotificaciones, solicitarPermisosNotificaciones } from '../../utils/Notificaciones';

export default function Index() {
  const router = useRouter();
  const { bloquesHorario, eventosGlobales, tareasGlobales } = useAppContext();
  const { setTabIndex } = useTabContext();

  // ── Sistema de temas ────────────────────────────────────────────────────
  const { colors, isDark } = useTheme();

  const [tiempoRestante, setTiempoRestante] = useState<string | null>(null);
  const [eventoProximo, setEventoProximo] = useState<any>(null);
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
            diffMinutos: (24 * 60 - minutosActuales) + convertirAMinutos(b.horaInicio),
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

  // ── Sincronizador Automático de Notificaciones ─────────────────────────
  useEffect(() => {
    const setupAlertas = async () => {
      const permisoConcedido = await solicitarPermisosNotificaciones();
      if (permisoConcedido) {
        await sincronizarNotificaciones(bloquesHorario || [], eventosGlobales || []);
      }
    };
    setupAlertas();
  }, [bloquesHorario, eventosGlobales]);
  // ───────────────────────────────────────────────────────────────────────

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

  // ── Estilos dinámicos (dependen del tema) ──────────────────────────────
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    fecha: { color: colors.textSecondary },
    saludo: { color: colors.text },
    gridSubtitle: { color: colors.textSecondary },
    gridTitle: { color: colors.text },
    gridItem: { backgroundColor: colors.surface, borderColor: colors.border },
    badgeText: { color: colors.danger },
    badgeUrgency: { backgroundColor: colors.dangerLight },
    smallBadgeTop: { color: colors.textTertiary },
    iconCircleGray: { backgroundColor: colors.surfaceSubtle },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* RENDERIZAMOS EL MODAL DE BIENVENIDA */}
      <Bienvenida onCompletado={setNombreUsuario} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.fecha, dynamicStyles.fecha]}>{fechaHoyStr}</Text>
          <Text style={[styles.saludo, dynamicStyles.saludo]}>Hola, {nombreUsuario} 👋</Text>
        </View>
        <Ionicons name="notifications-outline" size={28} color={colors.textSecondary} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        // ────────────────────────────────────────────────────────
        // ESTA ES LA MEJORA AGREGADA: EVITA EL PARPADEO
        removeClippedSubviews={false}
      // ────────────────────────────────────────────────────────
      >
        <View style={styles.gridContainer}>

          <View style={styles.row}>
            {/* Tarjeta Apuntes */}
            <TouchableOpacity
              style={[styles.gridItem, dynamicStyles.gridItem]}
              activeOpacity={0.8}
              onPress={() => setTabIndex(1)}
            >
              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircle, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="document-text" size={32} color={colors.danger} />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.gridTitle, dynamicStyles.gridTitle]}>Tomar Notas</Text>
                <Text style={[styles.gridSubtitle, dynamicStyles.gridSubtitle]}>Captura rápida</Text>
              </View>
            </TouchableOpacity>

            {/* Tarjeta Horario */}
            <TouchableOpacity
              style={[styles.gridItem, dynamicStyles.gridItem]}
              activeOpacity={0.8}
              onPress={() => setTabIndex(2)}
            >
              {tiempoRestante && (
                <View style={styles.badgeTopContainer}>
                  <View style={[styles.badgeUrgency, dynamicStyles.badgeUrgency]}>
                    <Text style={[styles.badgeText, dynamicStyles.badgeText]}>{tiempoRestante}</Text>
                  </View>
                </View>
              )}
              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircle, { backgroundColor: eventoProximo ? eventoProximo.colorHex + '20' : colors.primaryLight }]}>
                  <Ionicons name="time" size={32} color={eventoProximo ? eventoProximo.colorHex : colors.primary} />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.gridTitle, dynamicStyles.gridTitle]} numberOfLines={1}>
                  {eventoProximo ? eventoProximo.ramo : 'Sin clases'}
                </Text>
                <Text style={[styles.gridSubtitle, dynamicStyles.gridSubtitle]} numberOfLines={1}>
                  {eventoProximo ? `${eventoProximo.horaInicio} • ${eventoProximo.aula || 'Próximo'}` : 'Nada programado hoy'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            {/* Tarjeta Tareas */}
            <TouchableOpacity
              style={[styles.gridItem, dynamicStyles.gridItem]}
              activeOpacity={0.8}
              onPress={() => setTabIndex(5)}
            >
              <View style={styles.iconWrapper}>
                {estadoTareas === 'vacio' && (
                  <View style={[styles.iconCircle, dynamicStyles.iconCircleGray]}>
                    <Ionicons name="list" size={32} color={colors.textSecondary} />
                  </View>
                )}
                {estadoTareas === 'pendientes' && (
                  <View style={[styles.iconCircle, { backgroundColor: colors.warningLight }]}>
                    <Ionicons name="checkbox-outline" size={32} color={colors.warning} />
                  </View>
                )}
                {estadoTareas === 'completadas' && (
                  <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
                    <Ionicons name="checkmark-done-circle" size={32} color={colors.success} />
                  </View>
                )}
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.gridTitle, dynamicStyles.gridTitle]}>Tareas</Text>
                {estadoTareas === 'vacio' && <Text style={[styles.gridSubtitle, dynamicStyles.gridSubtitle]}>Ninguna para hoy</Text>}
                {estadoTareas === 'pendientes' && <Text style={[styles.gridSubtitle, { color: colors.warning, fontWeight: 'bold' }]}>{tareasPendientes} pendientes</Text>}
                {estadoTareas === 'completadas' && <Text style={[styles.gridSubtitle, { color: colors.success, fontWeight: 'bold' }]}>¡Todo listo!</Text>}
              </View>
            </TouchableOpacity>

            {/* Tarjeta Eventos */}
            <TouchableOpacity
              style={[styles.gridItem, dynamicStyles.gridItem]}
              activeOpacity={0.8}
              onPress={() => setTabIndex(4)}
            >
              <View style={styles.badgeTopContainer}>
                <Text style={[styles.smallBadgeTop, dynamicStyles.smallBadgeTop]}>Evento cercano</Text>
              </View>
              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircle, eventoAgendaProximo ? { backgroundColor: eventoAgendaProximo.color + '20' } : { backgroundColor: colors.warningLight }]}>
                  <Ionicons
                    name={eventoAgendaProximo ? (eventoAgendaProximo.icono as any) : 'calendar'}
                    size={32}
                    color={eventoAgendaProximo ? eventoAgendaProximo.color : colors.warning}
                  />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.gridTitle, dynamicStyles.gridTitle]} numberOfLines={1}>
                  {eventoAgendaProximo ? eventoAgendaProximo.titulo : 'Agenda vacía'}
                </Text>
                <Text style={[styles.gridSubtitle, dynamicStyles.gridSubtitle]} numberOfLines={1}>
                  {eventoAgendaProximo
                    ? `${eventoAgendaProximo.fecha} • ${eventoAgendaProximo.hora.split(' - ')[0]}`
                    : 'Sin próximos eventos'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            {/* Tarjeta Rendimiento */}
            <TouchableOpacity
              style={[styles.gridItem, dynamicStyles.gridItem]}
              activeOpacity={0.8}
              onPress={() => setTabIndex(6)}
            >
              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircle, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="bar-chart" size={32} color={colors.info} />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.gridTitle, dynamicStyles.gridTitle]}>Rendimiento</Text>
                <Text style={[styles.gridSubtitle, dynamicStyles.gridSubtitle]}>Ver promedios</Text>
              </View>
            </TouchableOpacity>

            {/* Tarjeta Configuración → navega a /configuracion */}
            <TouchableOpacity
              style={[styles.gridItem, dynamicStyles.gridItem]}
              activeOpacity={0.8}
              onPress={() => router.push('/configuracion')}
            >
              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircle, dynamicStyles.iconCircleGray]}>
                  <Ionicons name="settings" size={32} color={colors.textSecondary} />
                </View>
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.gridTitle, dynamicStyles.gridTitle]}>Ajustes</Text>
                <Text style={[styles.gridSubtitle, dynamicStyles.gridSubtitle]}>Configuración</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Solo estilos que NO dependen del tema (layout / dimensiones estáticas) ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  saludo: {
    fontSize: 26,
    fontWeight: 'bold',
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
    borderWidth: 1,
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
    textAlign: 'center',
  },
  gridSubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeUrgency: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  smallBadgeTop: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});