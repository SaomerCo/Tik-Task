import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';

export default function EnfoqueScreen() {
  const { tareasGlobales, agregarTarea, eliminarTarea, toggleCompletarTarea, actualizarTarea, ramosGlobales, sesionesEstudio, agregarSesionEstudio } = useAppContext();

  const [tabActiva, setTabActiva] = useState<'pomodoro' | 'tareas'>('pomodoro');

  // ==========================================
  // LÓGICA DE TAREAS DIARIAS
  // ==========================================
  const [modalTareaVisible, setModalTareaVisible] = useState(false);
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('');
  const [tareaAEditarId, setTareaAEditarId] = useState<string | null>(null);

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

  const guardarTarea = () => {
    if (!nuevaTareaTexto.trim()) return;
    if (tareaAEditarId) {
      actualizarTarea(tareaAEditarId, { texto: nuevaTareaTexto.trim() });
    } else {
      agregarTarea({ id: Math.random().toString(), texto: nuevaTareaTexto.trim(), completada: false, fechaCreacion: new Date().toLocaleDateString('es-ES') });
    }
    setNuevaTareaTexto('');
    setModalTareaVisible(false);
  };

  const tareasDeHoy = tareasGlobales ? tareasGlobales.filter((t: any) => t.fechaCreacion === new Date().toLocaleDateString('es-ES')) : [];

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

  // FUNCIÓN PARA GUARDAR Y SALIR
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
  const colorSesion = esFaseDescanso ? '#10b981' : (ramoActivo ? ramoActivo.colorHex : '#1a73e8');

  // ==========================================
  // AGRUPAR HISTORIAL DE ESTUDIO POR DÍA
  // ==========================================
  const historialPorDia = sesionesEstudio.reduce((acc: any, sesion: any) => {
    if (!acc[sesion.fecha]) acc[sesion.fecha] = [];
    acc[sesion.fecha].push(sesion);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tituloPrincipal}>Enfoque</Text>
        <Text style={styles.subtitulo}>Domina tu tiempo y hábitos</Text>
      </View>

      {!sesionIniciada && (
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabBoton, tabActiva === 'pomodoro' && styles.tabBotonActivo]} onPress={() => setTabActiva('pomodoro')}>
            <Ionicons name="timer-outline" size={18} color={tabActiva === 'pomodoro' ? '#1a73e8' : '#64748b'} />
            <Text style={[styles.tabTexto, tabActiva === 'pomodoro' && styles.tabTextoActivo]}>Estudiar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBoton, tabActiva === 'tareas' && styles.tabBotonActivo]} onPress={() => setTabActiva('tareas')}>
            <Ionicons name="checkbox-outline" size={18} color={tabActiva === 'tareas' ? '#1a73e8' : '#64748b'} />
            <Text style={[styles.tabTexto, tabActiva === 'tareas' && styles.tabTextoActivo]}>Tareas</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================== */}
      {/* VISTA: TAREAS DIARIAS */}
      {/* ========================================== */}
      {tabActiva === 'tareas' && !sesionIniciada && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {tareasDeHoy.length === 0 ? (
              <View style={styles.estadoVacio}>
                <Ionicons name="list-outline" size={60} color="#cbd5e1" />
                <Text style={styles.textoVacio}>No hay tareas para hoy</Text>
                <Text style={styles.subtextoVacio}>Añade hábitos como "Tomar 2L de agua" o "Leer 20 pags".</Text>
              </View>
            ) : (
              tareasDeHoy.map((tarea: any) => (
                <View key={tarea.id} style={styles.tarjetaTarea}>
                  <TouchableOpacity onPress={() => toggleCompletarTarea(tarea.id)} style={styles.checkContainer}>
                    <Ionicons name={tarea.completada ? "checkmark-circle" : "ellipse-outline"} size={28} color={tarea.completada ? "#10b981" : "#cbd5e1"} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => abrirModalEditarTarea(tarea)} activeOpacity={0.6}>
                    <Text style={[styles.textoTarea, tarea.completada && styles.textoTareaCompletada]}>{tarea.texto}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => eliminarTarea(tarea.id)} style={styles.btnEliminarTarea}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.fab} onPress={abrirModalNuevaTarea}>
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================== */}
      {/* VISTA: SESIÓN DE ESTUDIO */}
      {/* ========================================== */}
      {tabActiva === 'pomodoro' && (
        <View style={{ flex: 1 }}>

          {!sesionIniciada ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50, paddingTop: 10 }}>

              <TouchableOpacity
                style={styles.btnNuevaSesion}
                onPress={() => setModalConfigEstudioVisible(true)}
              >
                <Ionicons name="add-circle" size={24} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.btnNuevaSesionTexto}>Iniciar sesión de estudio</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.tituloSeccionHistorial}>Historial de Estudio</Text>

              {Object.keys(historialPorDia).length === 0 ? (
                <View style={styles.estadoVacioHistorial}>
                  <Ionicons name="bar-chart-outline" size={40} color="#cbd5e1" />
                  <Text style={styles.textoVacioHistorial}>Aún no hay sesiones registradas.</Text>
                </View>
              ) : (
                Object.keys(historialPorDia).map((fecha, idx) => (
                  <View key={idx} style={styles.historialDiaContainer}>
                    <Text style={styles.historialFecha}>{fecha}:</Text>
                    {historialPorDia[fecha].map((sesion: any) => {
                      const ramoInfo = ramosGlobales.find((r: any) => r.id === sesion.ramoId);
                      const colorRamo = ramoInfo ? ramoInfo.colorHex : (sesion.ramoId ? '#94a3b8' : '#1a73e8');
                      const nombreRamo = ramoInfo ? ramoInfo.nombre : '';

                      let textoMostrar = '';
                      if (sesion.titulo && nombreRamo) textoMostrar = `${sesion.titulo} (${nombreRamo})`;
                      else if (sesion.titulo) textoMostrar = sesion.titulo;
                      else if (nombreRamo) textoMostrar = nombreRamo;
                      else textoMostrar = 'Sesión de Estudio';

                      return (
                        <View key={sesion.id} style={styles.historialItem}>
                          <View style={[styles.puntoHistorial, { backgroundColor: colorRamo }]} />
                          <Text style={styles.historialTexto}>
                            Estudiaste <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatearDuracionHistorial(sesion.duracionSegundos)}</Text> - {textoMostrar}
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
            <View style={styles.timerActivoContainer}>
              <View style={[styles.badgeFase, { backgroundColor: colorSesion + '20' }]}>
                {/* ICONOS ELIMINADOS DE AQUÍ */}
                <Text style={[styles.textoFase, { color: colorSesion }]}>
                  {esFaseDescanso ? 'TIEMPO DE DESCANSO' : (modoEstudio === 'pomodoro' ? 'MODO POMODORO' : 'MODO ESTUDIO')}
                </Text>
              </View>

              <Text style={styles.ramoTimerTexto} numberOfLines={2}>
                {tituloSesion || ramoActivo?.nombre || 'Sesión de Estudio'}
              </Text>

              <View style={[styles.circuloTimerFondo, { borderColor: colorSesion }]}>
                <Text style={styles.textoReloj}>{formatoTiempoTimer(tiempoRestante)}</Text>
                <Text style={styles.textoSubReloj}>{estaCorriendo ? 'Corriendo...' : 'Pausado'}</Text>
              </View>

              <View style={styles.timerControles}>
                <TouchableOpacity style={styles.btnControlStop} onPress={detenerSesion}>
                  <Ionicons name="square" size={24} color="#ef4444" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnControlPlayPause, { backgroundColor: colorSesion }]}
                  onPress={() => setEstaCorriendo(!estaCorriendo)}
                >
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Configurar Sesión</Text>
              <TouchableOpacity onPress={() => setModalConfigEstudioVisible(false)}>
                <Ionicons name="close" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.labelConfig}>Título de la sesión (Opcional)</Text>
              <TextInput
                style={styles.inputConfig}
                placeholder="Ej. Preparación para prueba..."
                value={tituloSesion}
                onChangeText={setTituloSesion}
              />

              <View style={styles.configSeccion}>
                <Text style={styles.labelConfig}>Vincular a un ramo (Opcional)</Text>
                {ramosGlobales.length === 0 ? (
                  <Text style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: 10 }}>No tienes ramos registrados.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {ramosGlobales.map((ramo: any) => (
                      <TouchableOpacity
                        key={ramo.id}
                        style={[styles.ramoPildora, ramoSeleccionadoId === ramo.id && { backgroundColor: ramo.colorHex, borderColor: ramo.colorHex }]}
                        onPress={() => setRamoSeleccionadoId(ramoSeleccionadoId === ramo.id ? null : ramo.id)}
                      >
                        <Text style={[styles.ramoPildoraTexto, ramoSeleccionadoId === ramo.id && { color: 'white' }]}>{ramo.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <Text style={[styles.labelConfig, { marginBottom: 10 }]}>Modo de Estudio</Text>

              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, modoEstudio === 'pomodoro' && styles.toggleBtnActive]}
                  onPress={() => setModoEstudio('pomodoro')}
                >
                  <Text style={[styles.toggleText, modoEstudio === 'pomodoro' && styles.toggleTextActive]}>Pomodoro (Con descansos)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, modoEstudio === 'simple' && styles.toggleBtnActive]}
                  onPress={() => setModoEstudio('simple')}
                >
                  <Text style={[styles.toggleText, modoEstudio === 'simple' && styles.toggleTextActive]}>Simple (Bloque único)</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.labelConfig, { marginBottom: 10 }]}>Configuración de Tiempos</Text>

              <View style={styles.rowTiempos}>
                <TouchableOpacity style={styles.cajaTiempoPicker} onPress={() => setShowPickerEnfoque(true)}>
                  <View style={styles.iconoTituloTiempo}>
                    <Text style={styles.tituloTiempo}>Estudio</Text>
                  </View>
                  <Text style={styles.textoPickerTiempo}>{formatoTextoPicker(fechaEnfoque)}</Text>
                  <Text style={styles.textoSubPicker}>Toca para editar</Text>
                </TouchableOpacity>

                {modoEstudio === 'pomodoro' && (
                  <TouchableOpacity style={styles.cajaTiempoPicker} onPress={() => setShowPickerDescanso(true)}>
                    <View style={styles.iconoTituloTiempo}>
                      <Text style={styles.tituloTiempo}>Descanso</Text>
                    </View>
                    <Text style={styles.textoPickerTiempo}>{formatoTextoPicker(fechaDescanso)}</Text>
                    <Text style={styles.textoSubPicker}>Toca para editar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.btnIniciarSesion}
                onPress={iniciarSesion}
              >
                <Ionicons name="play" size={24} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.btnIniciarSesionTexto}>Comenzar a Estudiar</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{tareaAEditarId ? 'Editar Tarea' : 'Nueva Tarea'}</Text>
              <TouchableOpacity onPress={() => setModalTareaVisible(false)}>
                <Ionicons name="close" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Ej. Meditar 10 minutos..."
              value={nuevaTareaTexto}
              onChangeText={setNuevaTareaTexto}
              autoFocus={true}
              onSubmitEditing={guardarTarea}
            />

            <TouchableOpacity style={styles.btnGuardarFull} onPress={guardarTarea}>
              <Text style={styles.btnGuardarTextoFull}>{tareaAEditarId ? 'Actualizar Tarea' : 'Añadir a mi día'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  tituloPrincipal: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { fontSize: 14, color: '#64748b', marginTop: 4 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 15 },
  tabBoton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  tabBotonActivo: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabTexto: { fontWeight: 'bold', color: '#64748b', fontSize: 13 },
  tabTextoActivo: { color: '#1a73e8' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  tarjetaTarea: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  checkContainer: { marginRight: 15 },
  textoTarea: { fontSize: 16, color: '#334155', fontWeight: '500' },
  textoTareaCompletada: { textDecorationLine: 'line-through', color: '#94a3b8' },
  btnEliminarTarea: { padding: 5, paddingLeft: 15 },

  estadoVacio: { alignItems: 'center', marginTop: 80 },
  textoVacio: { fontSize: 18, fontWeight: 'bold', color: '#64748b', marginTop: 15 },
  subtextoVacio: { fontSize: 14, color: '#94a3b8', marginTop: 5, textAlign: 'center', paddingHorizontal: 20 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#10b981', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  modalTitulo: { fontSize: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#f1f5f9', padding: 18, borderRadius: 12, fontSize: 16, color: '#334155', marginBottom: 20 },
  btnGuardarFull: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnGuardarTextoFull: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  btnNuevaSesion: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnNuevaSesionTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  inputConfig: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, fontSize: 16, color: '#334155', marginBottom: 20, marginTop: 5 },

  configSeccion: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  labelConfig: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  ramosSugeridosContainer: { flexDirection: 'row' },
  ramoPildora: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', marginRight: 10, backgroundColor: '#f8fafc' },
  ramoPildoraTexto: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 20, marginTop: 5 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  toggleText: { fontWeight: 'bold', color: '#64748b', fontSize: 13 },
  toggleTextActive: { color: '#0f172a' },

  rowTiempos: { flexDirection: 'row', gap: 15, marginBottom: 25, marginTop: 5 },
  cajaTiempoPicker: { flex: 1, backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  iconoTituloTiempo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 6 },
  tituloTiempo: { fontSize: 14, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
  textoPickerTiempo: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  textoSubPicker: { fontSize: 12, color: '#94a3b8', marginTop: 8 },

  btnIniciarSesion: { flexDirection: 'row', backgroundColor: '#10b981', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnIniciarSesionTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 25 },
  tituloSeccionHistorial: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 15 },
  estadoVacioHistorial: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  textoVacioHistorial: { fontSize: 14, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' },

  historialDiaContainer: { marginBottom: 20 },
  historialFecha: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  historialItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  puntoHistorial: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  historialTexto: { fontSize: 15, color: '#475569', flex: 1 },

  timerActivoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },
  badgeFase: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 15, gap: 8 },
  textoFase: { fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  ramoTimerTexto: { fontSize: 20, fontWeight: 'bold', color: '#334155', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },

  circuloTimerFondo: { width: 280, height: 280, borderRadius: 140, borderWidth: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  textoReloj: { fontSize: 56, fontWeight: 'bold', color: '#0f172a', letterSpacing: 2 },
  textoSubReloj: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 5 },

  timerControles: { flexDirection: 'row', alignItems: 'center', marginTop: 50, gap: 30 },
  btnControlStop: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  btnControlPlayPause: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
});