import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';

// IMPORTACIONES DEL TEMA Y ENCABEZADO
import Encabezado from '../../components/Encabezado';
import { useTheme } from '../../context/ThemeContext';

export default function EnfoqueScreen() {
  const { tareasGlobales, agregarTarea, eliminarTarea, actualizarTarea, ramosGlobales, sesionesEstudio, agregarSesionEstudio, registrarHistorialTareas } = useAppContext();

  const { colors, isDark } = useTheme();
  const s = buildStyles(colors, isDark);

  const [tabActiva, setTabActiva] = useState<'pomodoro' | 'tareas'>('pomodoro');
  const hoyStr = new Date().toLocaleDateString('es-ES');

  // ==========================================
  // DETECTOR DE MEDIANOCHE
  // ==========================================
  useEffect(() => {
    if (!tareasGlobales || tareasGlobales.length === 0) return;

    const tareasViejas = tareasGlobales.filter((t: any) => t.fechaCreacion !== hoyStr);

    if (tareasViejas.length > 0) {
      const fechasAntiguas = [...new Set(tareasViejas.map((t: any) => t.fechaCreacion))];

      fechasAntiguas.forEach((fechaAnterior: any) => {
        const tareasDelDia = tareasViejas.filter((t: any) => t.fechaCreacion === fechaAnterior);
        const completadas = tareasDelDia.filter((t: any) => t.completada).length;
        const totales = tareasDelDia.length;
        const porcentaje = Math.round((completadas / totales) * 100);

        if (registrarHistorialTareas) {
          registrarHistorialTareas({
            id: Math.random().toString(),
            fecha: fechaAnterior,
            completadas,
            totales,
            porcentaje
          });
        }
      });

      tareasViejas.forEach((tarea: any) => {
        actualizarTarea(tarea.id, {
          completada: false,
          fechaCreacion: hoyStr
        });
      });
    }
  }, [hoyStr]);

  // ==========================================
  // LÓGICA DE TAREAS DIARIAS (¡100% 0 LAG!)
  // ==========================================
  const [modalTareaVisible, setModalTareaVisible] = useState(false);
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('');
  const [tareaAEditarId, setTareaAEditarId] = useState<string | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [tareasLocales, setTareasLocales] = useState<any[]>([]);
  const tareasLocalesRef = useRef(tareasLocales);
  const tareasGlobalesRef = useRef(tareasGlobales);

  useEffect(() => { tareasLocalesRef.current = tareasLocales; }, [tareasLocales]);
  useEffect(() => { tareasGlobalesRef.current = tareasGlobales; }, [tareasGlobales]);

  useEffect(() => {
    const tareasHoyGlobal = tareasGlobales ? tareasGlobales.filter((t: any) => t.fechaCreacion === hoyStr) : [];
    setTareasLocales(prevLocales => {
        return tareasHoyGlobal.map(tg => {
            const localMatch = prevLocales.find(l => l.id === tg.id);
            if (localMatch) {
                return { ...tg, completada: localMatch.completada };
            }
            return tg;
        });
    });
  }, [tareasGlobales, hoyStr]);

  // 1. TOGGLE INSTANTÁNEO
  const handleToggleInstantaneo = (id: string) => {
    setTareasLocales(prev => prev.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
  };

  const sincronizarConGlobal = useCallback(() => {
    const locales = tareasLocalesRef.current;
    const globales = tareasGlobalesRef.current;
    if (!locales || !globales) return;

    locales.forEach(loc => {
        const glob = globales.find((g: any) => g.id === loc.id);
        if (glob && glob.completada !== loc.completada) {
            actualizarTarea(loc.id, { completada: loc.completada });
        }
    });
  }, [actualizarTarea]);

  useFocusEffect(
    useCallback(() => {
        return () => sincronizarConGlobal();
    }, [sincronizarConGlobal])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
            sincronizarConGlobal();
        }
    });
    return () => subscription.remove();
  }, [sincronizarConGlobal]);

  const abrirModalNuevaTarea = () => {
    setTareaAEditarId(null);
    setNuevaTareaTexto('');
    setModalTareaVisible(true);
  };

  const abrirModalEditarTarea = (tarea: any) => {
    setTareaAEditarId(tarea.id);
    setNuevaTareaTexto(tarea.texto);
    setModalTareaVisible(true);
  };

  // 2. GUARDAR / EDITAR INSTANTÁNEO (OPTIMISTIC UI)
  const guardarTarea = () => {
    if (!nuevaTareaTexto.trim()) return;
    const textoFinal = nuevaTareaTexto.trim();

    if (tareaAEditarId) {
      // Cambio visual Inmediato
      setTareasLocales(prev => prev.map(t => t.id === tareaAEditarId ? { ...t, texto: textoFinal } : t));
      // Guardado en BD en segundo plano
      requestAnimationFrame(() => actualizarTarea(tareaAEditarId, { texto: textoFinal }));
    } else {
      const nuevaTarea = { id: Math.random().toString(), texto: textoFinal, completada: false, fechaCreacion: hoyStr };
      // Cambio visual Inmediato
      setTareasLocales(prev => [...prev, nuevaTarea]);
      // Guardado en BD en segundo plano
      requestAnimationFrame(() => agregarTarea(nuevaTarea));
    }
    
    setNuevaTareaTexto('');
    setModalTareaVisible(false);
  };

  // 3. ELIMINAR INSTANTÁNEO (OPTIMISTIC UI)
  const confirmarEliminarTarea = (id: string) => {
    Alert.alert('Eliminar Objetivo', '¿Estás seguro de que quieres borrar este hábito/objetivo diario?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
            // Cambio visual Inmediato
            setTareasLocales(prev => prev.filter(t => t.id !== id));
            // Eliminación en BD en segundo plano
            requestAnimationFrame(() => eliminarTarea(id));
        }}
    ]);
  };

  // ==========================================
  // LÓGICA DE SESIÓN DE ESTUDIO 
  // ==========================================
  const [sesionIniciada, setSesionIniciada] = useState(false);
  const [modalConfigEstudioVisible, setModalConfigEstudioVisible] = useState(false);

  const [ramoSeleccionadoId, setRamoSeleccionadoId] = useState<string | null>(null);
  const [tituloSesion, setTituloSesion] = useState('');
  const [modoEstudio, setModoEstudio] = useState<'pomodoro' | 'simple'>('pomodoro');

  const [fechaEnfoque, setFechaEnfoque] = useState(new Date(new Date().setHours(0, 25, 0, 0)));
  const [fechaDescanso, setFechaDescanso] = useState(new Date(new Date().setHours(0, 5, 0, 0)));
  const [showPickerEnfoque, setShowPickerEnfoque] = useState(false);
  const [showPickerDescanso, setShowPickerDescanso] = useState(false);

  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [estaCorriendo, setEstaCorriendo] = useState(false);
  const [esFaseDescanso, setEsFaseDescanso] = useState(false);
  const [tiempoEstudiadoAcumulado, setTiempoEstudiadoAcumulado] = useState(0);

  const getSegundosEnfoque = () => fechaEnfoque.getHours() * 3600 + fechaEnfoque.getMinutes() * 60;
  const getSegundosDescanso = () => fechaDescanso.getHours() * 3600 + fechaDescanso.getMinutes() * 60;

  const guardarSesionYSalir = () => {
    if (tiempoEstudiadoAcumulado >= 60) {
      const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      const fechaCapitalizada = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

      agregarSesionEstudio({
        id: Math.random().toString(),
        ramoId: ramoSeleccionadoId,
        titulo: tituloSesion.trim(),
        fecha: fechaCapitalizada,
        duracionSegundos: tiempoEstudiadoAcumulado,
        timestamp: Date.now()
      });
    }

    setEstaCorriendo(false);
    setSesionIniciada(false);
    setEsFaseDescanso(false);
    setTiempoEstudiadoAcumulado(0);
    setTituloSesion('');
  };

  useEffect(() => {
    let intervalo: any = null;

    if (estaCorriendo && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante(prev => prev - 1);
        if (!esFaseDescanso) {
          setTiempoEstudiadoAcumulado(prev => prev + 1);
        }
      }, 1000);
    } else if (estaCorriendo && tiempoRestante === 0) {
      if (modoEstudio === 'pomodoro') {
        const nuevaFaseDescanso = !esFaseDescanso;
        setEsFaseDescanso(nuevaFaseDescanso);
        setTiempoRestante(nuevaFaseDescanso ? getSegundosDescanso() : getSegundosEnfoque());
        Alert.alert(nuevaFaseDescanso ? '¡Tiempo de Descanso!' : '¡A Estudiar!', nuevaFaseDescanso ? `Inicia tu periodo de pausa.` : `Es hora de volver a concentrarse.`);
      } else {
        setEstaCorriendo(false);
        Alert.alert('¡Meta Cumplida!', 'Has completado tu sesión de estudio exitosamente.', [
          { text: 'Finalizar', onPress: guardarSesionYSalir }
        ]);
      }
    }

    return () => clearInterval(intervalo);
  }, [estaCorriendo, tiempoRestante, esFaseDescanso, modoEstudio]);

  const iniciarSesion = () => {
    if (getSegundosEnfoque() === 0) return Alert.alert('Tiempo Inválido', 'El tiempo de estudio no puede ser 0.');

    setTiempoEstudiadoAcumulado(0);
    setSesionIniciada(true);
    setEsFaseDescanso(false);
    setTiempoRestante(getSegundosEnfoque());
    setEstaCorriendo(true);
    setModalConfigEstudioVisible(false);
  };

  const detenerSesion = () => {
    Alert.alert('Detener Sesión', '¿Estás seguro de terminar tu sesión de estudio actual?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Detener', style: 'destructive', onPress: guardarSesionYSalir }
    ]);
  };

  const formatoTiempoTimer = (segundosTotales: number) => {
    const h = Math.floor(segundosTotales / 3600);
    const m = Math.floor((segundosTotales % 3600) / 60).toString().padStart(2, '0');
    const s = (segundosTotales % 60).toString().padStart(2, '0');
    if (h > 0) return `${h}:${m}:${s}`;
    return `${m}:${s}`;
  };

  const formatoTextoPicker = (fecha: Date) => {
    const h = fecha.getHours();
    const m = fecha.getMinutes();
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
  };

  const formatearDuracionHistorial = (segundos: number) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    if (h > 0 && m > 0) return `${h} hora${h > 1 ? 's' : ''} y ${m} min`;
    if (h > 0) return `${h} hora${h > 1 ? 's' : ''}`;
    return `${m} minuto${m !== 1 ? 's' : ''}`;
  };

  const ramoActivo = ramosGlobales.find((r: any) => r.id === ramoSeleccionadoId);
  const colorSesion = esFaseDescanso ? colors.success : (ramoActivo ? ramoActivo.colorHex : colors.primary);

  const historialPorDia = sesionesEstudio.reduce((acc: any, sesion: any) => {
    if (!acc[sesion.fecha]) acc[sesion.fecha] = [];
    acc[sesion.fecha].push(sesion);
    return acc;
  }, {});

  return (
    <SafeAreaView style={s.container}>

      <Encabezado
        label="POMODORO"
        titulo="Enfoque"
        subtitulo="Sesiones de estudio"
        icono="timer"
        colorActivo={colors.success}
      />

      {!sesionIniciada && (
        <View style={s.tabContainer}>
          <TouchableOpacity style={[s.tabBoton, tabActiva === 'pomodoro' && s.tabBotonActivo]} onPress={() => setTabActiva('pomodoro')}>
            <Ionicons name="timer-outline" size={18} color={tabActiva === 'pomodoro' ? colors.success : colors.textSecondary} />
            <Text style={[s.tabTexto, tabActiva === 'pomodoro' && { color: colors.success }]}>Estudiar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBoton, tabActiva === 'tareas' && s.tabBotonActivo]} onPress={() => setTabActiva('tareas')}>
            <Ionicons name="checkbox-outline" size={18} color={tabActiva === 'tareas' ? colors.success : colors.textSecondary} />
            <Text style={[s.tabTexto, tabActiva === 'tareas' && { color: colors.success }]}>Objetivos Diarios</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================== */}
      {/* VISTA: TAREAS DIARIAS */}
      {/* ========================================== */}
      {tabActiva === 'tareas' && !sesionIniciada && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scrollContent} removeClippedSubviews={false}>
            {tareasLocales.length === 0 ? (
              <View style={s.estadoVacio}>
                <Ionicons name="list-outline" size={60} color={colors.border} />
                <Text style={s.textoVacio}>No hay objetivos diarios para hoy</Text>
                <Text style={s.subtextoVacio}>Añade hábitos como "Tomar 2L de agua" o "Leer 20 pags".</Text>
              </View>
            ) : (
              tareasLocales.map((tarea: any) => (
                <TouchableOpacity 
                    key={tarea.id} 
                    style={s.tarjetaTarea} 
                    activeOpacity={0.7} 
                    onPress={() => handleToggleInstantaneo(tarea.id)}
                >
                  <View style={s.checkContainer}>
                    <Ionicons name={tarea.completada ? "checkmark-circle" : "ellipse-outline"} size={28} color={tarea.completada ? colors.success : colors.textSecondary} />
                  </View>
                  
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[s.textoTarea, tarea.completada && s.textoTareaCompletada]}>{tarea.texto}</Text>
                  </View>

                  {modoEdicion && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[s.btnAccionOculto, { backgroundColor: isDark ? colors.primary + '20' : '#e0e7ff' }]} onPress={() => abrirModalEditarTarea(tarea)}>
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.btnAccionOculto, { backgroundColor: isDark ? colors.danger + '20' : '#fee2e2' }]} onPress={() => confirmarEliminarTarea(tarea.id)}>
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {modoEdicion ? (
            <TouchableOpacity
                style={[s.fabEditar, { backgroundColor: colors.success, shadowColor: colors.success }]}
                onPress={() => setModoEdicion(false)}
            >
                <Ionicons name="checkmark" size={26} color="white" />
            </TouchableOpacity>
            ) : (
            <TouchableOpacity
                style={[s.fabEditar, { backgroundColor: colors.surface, shadowColor: '#000', borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setModoEdicion(true)}
            >
                <Ionicons name="pencil" size={22} color={colors.text} />
            </TouchableOpacity>
          )}

          {!modoEdicion && (
            <TouchableOpacity style={s.fab} onPress={abrirModalNuevaTarea}>
              <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ========================================== */}
      {/* VISTA: SESIÓN DE ESTUDIO */}
      {/* ========================================== */}
      {tabActiva === 'pomodoro' && (
        <View style={{ flex: 1 }}>

          {!sesionIniciada ? (
            <ScrollView showsVerticalScrollIndicator={false} removeClippedSubviews={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50, paddingTop: 10 }}>

              <TouchableOpacity style={s.btnNuevaSesion} onPress={() => setModalConfigEstudioVisible(true)}>
                <Ionicons name="add-circle" size={24} color="white" style={{ marginRight: 10 }} />
                <Text style={s.btnNuevaSesionTexto}>Iniciar sesión de estudio</Text>
              </TouchableOpacity>

              <View style={s.divider} />

              <Text style={s.tituloSeccionHistorial}>Historial de Estudio</Text>

              {Object.keys(historialPorDia).length === 0 ? (
                <View style={s.estadoVacioHistorial}>
                  <Ionicons name="bar-chart-outline" size={40} color={colors.border} />
                  <Text style={s.textoVacioHistorial}>Aún no hay sesiones registradas.</Text>
                </View>
              ) : (
                Object.keys(historialPorDia).map((fecha, idx) => (
                  <View key={idx} style={s.historialDiaContainer}>
                    <Text style={s.historialFecha}>{fecha}:</Text>
                    {historialPorDia[fecha].map((sesion: any) => {
                      const ramoInfo = ramosGlobales.find((r: any) => r.id === sesion.ramoId);
                      const colorRamo = ramoInfo ? ramoInfo.colorHex : (sesion.ramoId ? colors.textSecondary : colors.primary);
                      const nombreRamo = ramoInfo ? ramoInfo.nombre : '';

                      let textoMostrar = '';
                      if (sesion.titulo && nombreRamo) textoMostrar = `${sesion.titulo} (${nombreRamo})`;
                      else if (sesion.titulo) textoMostrar = sesion.titulo;
                      else if (nombreRamo) textoMostrar = nombreRamo;
                      else textoMostrar = 'Sesión de Estudio';

                      return (
                        <View key={sesion.id} style={s.historialItem}>
                          <View style={[s.puntoHistorial, { backgroundColor: colorRamo }]} />
                          <Text style={s.historialTexto}>
                            Estudiaste <Text style={{ fontWeight: 'bold', color: colors.text }}>{formatearDuracionHistorial(sesion.duracionSegundos)}</Text> - {textoMostrar}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))
              )}

            </ScrollView>
          ) : (
            // CRONÓMETRO ACTIVO
            <View style={s.timerActivoContainer}>
              <View style={[s.badgeFase, { backgroundColor: isDark ? colorSesion + '30' : colorSesion + '20' }]}>
                <Text style={[s.textoFase, { color: colorSesion }]}>
                  {esFaseDescanso ? 'TIEMPO DE DESCANSO' : (modoEstudio === 'pomodoro' ? 'MODO POMODORO' : 'MODO ESTUDIO')}
                </Text>
              </View>

              <Text style={s.ramoTimerTexto} numberOfLines={2}>
                {tituloSesion || ramoActivo?.nombre || 'Sesión de Estudio'}
              </Text>

              <View style={[s.circuloTimerFondo, { borderColor: colorSesion }]}>
                <Text style={s.textoReloj}>{formatoTiempoTimer(tiempoRestante)}</Text>
                <Text style={s.textoSubReloj}>{estaCorriendo ? 'Corriendo...' : 'Pausado'}</Text>
              </View>

              <View style={s.timerControles}>
                <TouchableOpacity style={s.btnControlStop} onPress={detenerSesion}>
                  <Ionicons name="square" size={24} color={colors.danger} />
                </TouchableOpacity>

                <TouchableOpacity style={[s.btnControlPlayPause, { backgroundColor: colorSesion }]} onPress={() => setEstaCorriendo(!estaCorriendo)}>
                  <Ionicons name={estaCorriendo ? "pause" : "play"} size={36} color="white" style={!estaCorriendo && { marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ========================================== */}
      {/* MODAL CONFIGURACIÓN SESIÓN DE ESTUDIO */}
      {/* ========================================== */}
      <Modal animationType="slide" transparent={true} visible={modalConfigEstudioVisible} onRequestClose={() => setModalConfigEstudioVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '90%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Configurar Sesión</Text>
              <TouchableOpacity onPress={() => setModalConfigEstudioVisible(false)}>
                <Ionicons name="close" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={s.labelConfig}>Título de la sesión (Opcional)</Text>
              <TextInput
                style={s.inputConfig}
                placeholder="Ej. Preparación para prueba..."
                placeholderTextColor={colors.textSecondary}
                value={tituloSesion}
                onChangeText={setTituloSesion}
              />

              <View style={s.configSeccion}>
                <Text style={s.labelConfig}>Vincular a un ramo (Opcional)</Text>
                {ramosGlobales.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontStyle: 'italic', marginTop: 10 }}>No tienes ramos registrados.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {ramosGlobales.map((ramo: any) => (
                      <TouchableOpacity
                        key={ramo.id}
                        style={[
                          s.ramoPildora,
                          ramoSeleccionadoId === ramo.id && { backgroundColor: ramo.colorHex, borderColor: ramo.colorHex }
                        ]}
                        onPress={() => setRamoSeleccionadoId(ramoSeleccionadoId === ramo.id ? null : ramo.id)}
                      >
                        <Text style={[s.ramoPildoraTexto, ramoSeleccionadoId === ramo.id && { color: 'white' }]}>{ramo.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <Text style={[s.labelConfig, { marginBottom: 10 }]}>Modo de Estudio</Text>

              <View style={s.toggleContainer}>
                <TouchableOpacity style={[s.toggleBtn, modoEstudio === 'pomodoro' && s.toggleBtnActive]} onPress={() => setModoEstudio('pomodoro')}>
                  <Text style={[s.toggleText, modoEstudio === 'pomodoro' && s.toggleTextActive]}>Pomodoro (Con descansos)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.toggleBtn, modoEstudio === 'simple' && s.toggleBtnActive]} onPress={() => setModoEstudio('simple')}>
                  <Text style={[s.toggleText, modoEstudio === 'simple' && s.toggleTextActive]}>Simple (Bloque único)</Text>
                </TouchableOpacity>
              </View>

              <Text style={[s.labelConfig, { marginBottom: 10 }]}>Configuración de Tiempos</Text>

              <View style={s.rowTiempos}>
                <TouchableOpacity style={s.cajaTiempoPicker} onPress={() => setShowPickerEnfoque(true)}>
                  <View style={s.iconoTituloTiempo}>
                    <Text style={s.tituloTiempo}>Estudio</Text>
                  </View>
                  <Text style={s.textoPickerTiempo}>{formatoTextoPicker(fechaEnfoque)}</Text>
                  <Text style={s.textoSubPicker}>Toca para editar</Text>
                </TouchableOpacity>

                {modoEstudio === 'pomodoro' && (
                  <TouchableOpacity style={s.cajaTiempoPicker} onPress={() => setShowPickerDescanso(true)}>
                    <View style={s.iconoTituloTiempo}>
                      <Text style={s.tituloTiempo}>Descanso</Text>
                    </View>
                    <Text style={s.textoPickerTiempo}>{formatoTextoPicker(fechaDescanso)}</Text>
                    <Text style={s.textoSubPicker}>Toca para editar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={s.btnIniciarSesion} onPress={iniciarSesion}>
                <Ionicons name="play" size={24} color="white" style={{ marginRight: 10 }} />
                <Text style={s.btnIniciarSesionTexto}>Comenzar a Estudiar</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PICKERS NATIVOS */}
      {showPickerEnfoque && (
        <DateTimePicker value={fechaEnfoque} mode={Platform.OS === 'ios' ? 'countdown' : 'time'} is24Hour={true} display="default" onChange={(e, date) => { setShowPickerEnfoque(false); if (date) setFechaEnfoque(date); }} />
      )}
      {showPickerDescanso && (
        <DateTimePicker value={fechaDescanso} mode={Platform.OS === 'ios' ? 'countdown' : 'time'} is24Hour={true} display="default" onChange={(e, date) => { setShowPickerDescanso(false); if (date) setFechaDescanso(date); }} />
      )}

      {/* MODAL CREAR/EDITAR TAREA */}
      <Modal animationType="slide" transparent={true} visible={modalTareaVisible} onRequestClose={() => setModalTareaVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>{tareaAEditarId ? 'Editar Objetivo Diario' : 'Nuevo Objetivo Diario'}</Text>
              <TouchableOpacity onPress={() => setModalTareaVisible(false)}>
                <Ionicons name="close" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={s.inputTarea}
              placeholder="Ej. Meditar 10 minutos..."
              placeholderTextColor={colors.textSecondary}
              value={nuevaTareaTexto}
              onChangeText={setNuevaTareaTexto}
              autoFocus={true}
              onSubmitEditing={guardarTarea}
            />

            <TouchableOpacity style={s.btnGuardarTareaFull} onPress={guardarTarea}>
              <Text style={s.btnGuardarTextoFull}>{tareaAEditarId ? 'Actualizar Objetivo Diario' : 'Añadir a mi día'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function buildStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    tabContainer: { flexDirection: 'row', backgroundColor: isDark ? colors.surfaceElevated : '#f1f5f9', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    tabBoton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    tabBotonActivo: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 4, elevation: isDark ? 0 : 2 },
    tabTexto: { fontWeight: 'bold', color: colors.textSecondary, fontSize: 13 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

    tarjetaTarea: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 4, elevation: isDark ? 0 : 2, borderWidth: 1, borderColor: colors.border },
    checkContainer: { marginRight: 15 },
    textoTarea: { fontSize: 16, color: colors.text, fontWeight: '500' },
    textoTareaCompletada: { textDecorationLine: 'line-through', color: colors.textSecondary },
    
    btnAccionOculto: { padding: 8, borderRadius: 8, marginLeft: 4 },
    
    fabEditar: { position: 'absolute', bottom: 20, left: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },

    estadoVacio: { alignItems: 'center', marginTop: 80 },
    textoVacio: { fontSize: 18, fontWeight: 'bold', color: colors.textSecondary, marginTop: 15 },
    subtextoVacio: { fontSize: 14, color: colors.textTertiary, marginTop: 5, textAlign: 'center', paddingHorizontal: 20 },

    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: colors.success, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },

    modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    modalTitulo: { fontSize: 20, fontWeight: 'bold', color: colors.text },

    inputTarea: { backgroundColor: isDark ? colors.background : '#f8fafc', padding: 18, borderRadius: 12, fontSize: 16, color: colors.text, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    btnGuardarTareaFull: { backgroundColor: colors.success, padding: 18, borderRadius: 12, alignItems: 'center' },
    btnGuardarTextoFull: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    btnNuevaSesion: { flexDirection: 'row', backgroundColor: colors.text, padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    btnNuevaSesionTexto: { color: colors.background, fontSize: 18, fontWeight: 'bold' },

    inputConfig: { backgroundColor: isDark ? colors.background : '#f8fafc', padding: 15, borderRadius: 12, fontSize: 16, color: colors.text, marginBottom: 20, marginTop: 5, borderWidth: 1, borderColor: colors.border },

    configSeccion: { backgroundColor: isDark ? colors.background : colors.surface, padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
    labelConfig: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
    ramosSugeridosContainer: { flexDirection: 'row' },
    ramoPildora: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 10, backgroundColor: colors.surface },
    ramoPildoraTexto: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

    toggleContainer: { flexDirection: 'row', backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 20, marginTop: 5, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    toggleBtnActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 4, elevation: isDark ? 0 : 2 },
    toggleText: { fontWeight: 'bold', color: colors.textSecondary, fontSize: 13 },
    toggleTextActive: { color: colors.text },

    rowTiempos: { flexDirection: 'row', gap: 15, marginBottom: 25, marginTop: 5 },
    cajaTiempoPicker: { flex: 1, backgroundColor: isDark ? colors.background : '#f8fafc', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
    iconoTituloTiempo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 6 },
    tituloTiempo: { fontSize: 14, fontWeight: 'bold', color: colors.textTertiary, textTransform: 'uppercase' },
    textoPickerTiempo: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    textoSubPicker: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },

    btnIniciarSesion: { flexDirection: 'row', backgroundColor: colors.success, padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    btnIniciarSesionTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 25 },
    tituloSeccionHistorial: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    estadoVacioHistorial: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
    textoVacioHistorial: { fontSize: 14, color: colors.textSecondary, marginTop: 10, fontStyle: 'italic' },

    historialDiaContainer: { marginBottom: 20 },
    historialFecha: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
    historialItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    puntoHistorial: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    historialTexto: { fontSize: 15, color: colors.textSecondary, flex: 1 },

    timerActivoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },
    badgeFase: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 15, gap: 8 },
    textoFase: { fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
    ramoTimerTexto: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },

    circuloTimerFondo: { width: 280, height: 280, borderRadius: 140, borderWidth: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0 : 0.1, shadowRadius: 20, elevation: isDark ? 0 : 10 },
    textoReloj: { fontSize: 56, fontWeight: 'bold', color: colors.text, letterSpacing: 2 },
    textoSubReloj: { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginTop: 5 },

    timerControles: { flexDirection: 'row', alignItems: 'center', marginTop: 50, gap: 30 },
    btnControlStop: { width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? colors.danger + '30' : '#fee2e2', justifyContent: 'center', alignItems: 'center' },
    btnControlPlayPause: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  });
}