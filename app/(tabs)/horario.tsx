import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

export default function HorarioScreen() {
  const router = useRouter();
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const [diaActivo, setDiaActivo] = useState('Lun');

  const { 
    ramosGlobales, actividadesGlobales, agregarActividadGlobal, 
    cicloActivo, bloquesHorario, agregarBloqueHorario, eliminarBloqueHorario, limpiarBloquesVisibles 
  } = useAppContext();

  // Estados del Menú Superior
  const [menuTopVisible, setMenuTopVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); // Muestra/oculta los basureros

  // Estados del Formulario
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoBloque, setTipoBloque] = useState('ramo'); 
  
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [ramoSeleccionado, setRamoSeleccionado] = useState<any>(null);
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]); 
  
  const [nuevaActividadNombre, setNuevaActividadNombre] = useState('');
  const [nuevaActividadColor, setNuevaActividadColor] = useState('#f59e0b');
  const coloresActividad = ['#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#14b8a6', '#0ea5e9', '#64748b'];

  const [horaInicio, setHoraInicio] = useState(new Date(new Date().setHours(8, 30, 0, 0)));
  const [horaFin, setHoraFin] = useState(new Date(new Date().setHours(10, 0, 0, 0)));
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

  const formatearHora = (fecha: Date) => `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
  const onChangeInicio = (event: any, selectedDate?: Date) => { setShowPickerInicio(false); if (selectedDate) setHoraInicio(selectedDate); };
  const onChangeFin = (event: any, selectedDate?: Date) => { setShowPickerFin(false); if (selectedDate) setHoraFin(selectedDate); };
  const convertirAMinutos = (horaStr: string) => { if (!horaStr || !horaStr.includes(':')) return 0; const [h, m] = horaStr.split(':'); return parseInt(h) * 60 + parseInt(m); };
  const formatearTiempoLibre = (minutosTotales: number) => {
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    if (horas > 0 && minutos > 0) return `${horas}h ${minutos}m`;
    if (horas > 0) return `${horas}h`;
    return `${minutos}m`;
  };

  // --- FILTRO INTELIGENTE DE VISIBILIDAD ---
  // Solo mostramos actividades personales O ramos que pertenezcan al ciclo actualmente encendido
  const bloquesVisibles = bloquesHorario.filter((b: any) => 
    b.isActividad || (cicloActivo && b.cicloId === cicloActivo.id)
  );

  const clasesDelDia = bloquesVisibles
    .filter((clase: any) => clase.dia === diaActivo)
    .sort((a: any, b: any) => convertirAMinutos(a.horaInicio) - convertirAMinutos(b.horaInicio));

  // --- FUNCIONES DEL MENÚ SUPERIOR ---
  const limpiarHorario = () => {
    Alert.alert('Limpiar Horario', '¿Estás seguro de que quieres borrar todos los bloques visibles de tu horario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, limpiar', style: 'destructive', onPress: () => {
          const idsVisibles = bloquesVisibles.map((b:any) => b.id);
          limpiarBloquesVisibles(idsVisibles);
          setMenuTopVisible(false);
      }}
    ]);
  };

  // --- FUNCIONES DEL FORMULARIO ---
  const seleccionarRamo = (ramo: any) => {
    setRamoSeleccionado(ramo); setMostrarDropdown(false);
    setEtiquetasSeleccionadas(ramo.etiquetas && ramo.etiquetas.length > 0 ? [ramo.etiquetas[0]] : []);
  };
  const toggleEtiqueta = (tag: string) => setEtiquetasSeleccionadas(etiquetasSeleccionadas.includes(tag) ? etiquetasSeleccionadas.filter(t => t !== tag) : [...etiquetasSeleccionadas, tag]);
  const cargarActividadGuardada = (act: any) => { setNuevaActividadNombre(act.nombre); setNuevaActividadColor(act.colorHex); };

  const abrirModal = () => {
    setTipoBloque(ramosGlobales.length === 0 ? 'actividad' : 'ramo');
    setModalVisible(true);
  };

  const ejecutarGuardado = () => {
    let nuevaClase: any = {
      id: Math.random().toString(), dia: diaActivo,
      horaInicio: formatearHora(horaInicio), horaFin: formatearHora(horaFin),
    };

    if (tipoBloque === 'ramo') {
      if (!ramoSeleccionado || !cicloActivo) return;
      nuevaClase = {
        ...nuevaClase,
        ramo: ramoSeleccionado.nombre, profesor: ramoSeleccionado.profesor,
        aula: ramoSeleccionado.sala, etiquetas: etiquetasSeleccionadas,
        colorHex: ramoSeleccionado.colorHex, isActividad: false,
        cicloId: cicloActivo.id // ATADO AL CICLO ACTUAL
      };
    } else {
      if (!nuevaActividadNombre.trim()) return;
      nuevaClase = {
        ...nuevaClase,
        ramo: nuevaActividadNombre, colorHex: nuevaActividadColor, isActividad: true
      };
      if (!actividadesGlobales.find((a: any) => a.nombre.toLowerCase() === nuevaActividadNombre.toLowerCase().trim())) {
        agregarActividadGlobal({ nombre: nuevaActividadNombre.trim(), colorHex: nuevaActividadColor });
      }
    }

    agregarBloqueHorario(nuevaClase);
    setModalVisible(false);
    setRamoSeleccionado(null);
    setNuevaActividadNombre('');
  };

  const guardarClase = () => {
    if (tipoBloque === 'ramo' && !ramoSeleccionado) return Alert.alert('Error', 'Selecciona un ramo de la lista.');
    if (tipoBloque === 'actividad' && !nuevaActividadNombre.trim()) return Alert.alert('Error', 'Escribe el nombre de la actividad.');
    const inicioMin = horaInicio.getHours() * 60 + horaInicio.getMinutes();
    const finMin = horaFin.getHours() * 60 + horaFin.getMinutes();
    if (inicioMin >= finMin) return Alert.alert('Error', 'La hora de término debe ser posterior a la de inicio.');

    const hayChoque = bloquesVisibles.filter((c:any) => c.dia === diaActivo).some((claseExistente:any) => {
      const inicioExistente = convertirAMinutos(claseExistente.horaInicio);
      const finExistente = convertirAMinutos(claseExistente.horaFin);
      return (inicioMin < finExistente && inicioExistente < finMin);
    });

    if (hayChoque) {
      Alert.alert('Choque ⚠️', 'Este bloque se superpone con otro. ¿Crear igual?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear', onPress: ejecutarGuardado, style: 'destructive' }
        ]);
    } else { ejecutarGuardado(); }
  };

  return (
    <View style={styles.mainContainer}>
      
      <View style={styles.headerContainer}>
        <View style={styles.headerFlex}>
          <Text style={styles.tituloPrincipal}>Tu Horario</Text>
          {/* BOTÓN SUPERIOR DERECHO (Menú o Hecho) */}
          {modoEdicion ? (
            <TouchableOpacity style={styles.btnHecho} onPress={() => setModoEdicion(false)}>
              <Text style={styles.textoHecho}>Hecho</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setMenuTopVisible(true)} style={{padding: 5}}>
              <Ionicons name="ellipsis-vertical" size={24} color="#0f172a" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.selectorDias}>
          {diasSemana.map((dia) => (
            <TouchableOpacity key={dia} style={[styles.diaBoton, diaActivo === dia && styles.diaBotonActivo]} onPress={() => setDiaActivo(dia)}>
              <Text style={[styles.diaTexto, diaActivo === dia && styles.diaTextoActivo]}>{dia}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {clasesDelDia.length === 0 ? (
          <View style={styles.estadoVacio}>
            <Ionicons name="calendar-clear-outline" size={48} color="#cbd5e1" />
            <Text style={styles.textoVacio}>Día libre</Text>
            <Text style={styles.subtextoVacio}>Agrega clases o actividades personales.</Text>
          </View>
        ) : (
          clasesDelDia.map((clase: any, index: number) => {
            const claseSiguiente = clasesDelDia[index + 1];
            const minutosDeVentana = claseSiguiente ? convertirAMinutos(claseSiguiente.horaInicio) - convertirAMinutos(clase.horaFin) : 0;

            return (
              <React.Fragment key={clase.id}>
                <View style={[styles.tarjeta, { borderLeftColor: clase.colorHex }]}>
                  <View style={styles.horaContainer}>
                    <Text style={styles.horaTexto}>{clase.horaInicio}</Text>
                    <Text style={styles.horaFin}>{clase.horaFin}</Text>
                  </View>
                  
                  <View style={styles.infoContainer}>
                    <View style={styles.tituloFila}>
                      <Text style={styles.materiaTexto} numberOfLines={1}>{clase.ramo}</Text>
                      {/* El basurero solo aparece si el modoEdicion está encendido */}
                      {modoEdicion && (
                        <TouchableOpacity style={styles.btnBorrarClase} onPress={() => eliminarBloqueHorario(clase.id)}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {clase.isActividad ? (
                      <View style={[styles.badge, { backgroundColor: clase.colorHex + '20' }]}> 
                        <Ionicons name="body-outline" size={12} color={clase.colorHex} style={{marginRight: 4}} />
                        <Text style={[styles.badgeTexto, { color: clase.colorHex }]}>Personal</Text>
                      </View>
                    ) : (
                      <>
                        {clase.etiquetas && clase.etiquetas.length > 0 && (
                          <View style={styles.etiquetasContainerLista}>
                            {clase.etiquetas.map((tag: string, i: number) => (
                              <View key={i} style={[styles.badge, { backgroundColor: clase.colorHex + '20' }]}><Text style={[styles.badgeTexto, { color: clase.colorHex }]}>{tag}</Text></View>
                            ))}
                          </View>
                        )}
                        {clase.aula !== 'Por definir' && clase.aula !== '' && (
                          <Text style={{color: '#64748b', fontSize: 12, marginTop: 4}}><Ionicons name="location-outline" size={12}/> {clase.aula}</Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
                {minutosDeVentana > 20 && (
                  <View style={styles.ventanaContainer}><Ionicons name="cafe-outline" size={20} color="#94a3b8" /><Text style={styles.ventanaTexto}>Ventana libre: {formatearTiempoLibre(minutosDeVentana)}</Text></View>
                )}
              </React.Fragment>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Solo mostramos el FAB si no estamos en modo edición */}
      {!modoEdicion && (
        <TouchableOpacity style={styles.fab} onPress={abrirModal}><Ionicons name="add" size={30} color="white" /></TouchableOpacity>
      )}

      {/* MENÚ DE OPCIONES SUPERIOR */}
      <Modal animationType="fade" transparent={true} visible={menuTopVisible} onRequestClose={() => setMenuTopVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayTop} activeOpacity={1} onPress={() => setMenuTopVisible(false)}>
          <View style={styles.menuTopContent}>
            <TouchableOpacity style={styles.opcionItem} onPress={() => { setModoEdicion(true); setMenuTopVisible(false); }}>
              <Ionicons name="create-outline" size={20} color="#334155" style={styles.opcionIcono} />
              <Text style={styles.opcionTexto}>Editar bloques</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.opcionItem, { borderBottomWidth: 0 }]} onPress={limpiarHorario}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" style={styles.opcionIcono} />
              <Text style={[styles.opcionTexto, { color: '#ef4444' }]}>Limpiar horario</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL FORMULARIO DE HORARIO */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.tabsFormulario}>
              <TouchableOpacity style={[styles.tabForm, tipoBloque === 'ramo' && styles.tabFormActivo]} onPress={() => setTipoBloque('ramo')}>
                <Text style={[styles.tabFormTexto, tipoBloque === 'ramo' && styles.tabFormTextoActivo]}>📚 Ramo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabForm, tipoBloque === 'actividad' && styles.tabFormActivo]} onPress={() => setTipoBloque('actividad')}>
                <Text style={[styles.tabFormTexto, tipoBloque === 'actividad' && styles.tabFormTextoActivo]}>🏃 Actividad</Text>
              </TouchableOpacity>
            </View>

            {tipoBloque === 'ramo' && (
              <View style={{ marginTop: 15 }}>
                {ramosGlobales.length === 0 ? (
                  <View style={styles.alertaRamosVacios}>
                    <Ionicons name="alert-circle" size={24} color="#f59e0b" />
                    <Text style={styles.textoAlertaRamos}>No tienes ramos en tu ciclo activo.</Text>
                    <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/ramos'); }} style={styles.btnIrARamosMini}>
                      <Text style={styles.btnIrARamosMiniTexto}>Ir a Ramos</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.label}>Selecciona el Ramo *</Text>
                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setMostrarDropdown(!mostrarDropdown)}>
                      <Text style={[styles.dropdownButtonText, !ramoSeleccionado && { color: '#94a3b8' }]}>{ramoSeleccionado ? ramoSeleccionado.nombre : 'Elige un ramo inscrito...'}</Text>
                      <Ionicons name={mostrarDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                    </TouchableOpacity>
                    {mostrarDropdown && (
                      <View style={styles.dropdownListContainer}>
                        {ramosGlobales.map((ramo: any) => (
                          <TouchableOpacity key={ramo.id} style={styles.dropdownItem} onPress={() => seleccionarRamo(ramo)}>
                            <View style={[styles.colorDot, { backgroundColor: ramo.colorHex }]} />
                            <Text style={styles.dropdownItemText}>{ramo.nombre}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    {ramoSeleccionado && ramoSeleccionado.etiquetas && ramoSeleccionado.etiquetas.length > 0 && (
                      <View style={{ marginTop: 15 }}>
                        <Text style={styles.label}>Etiquetas para esta clase</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.etiquetasContainerSelector}>
                          {ramoSeleccionado.etiquetas.map((tag: string, index: number) => {
                            const isSelected = etiquetasSeleccionadas.includes(tag);
                            return (
                              <TouchableOpacity key={index} style={[styles.etiquetaPildora, isSelected && { backgroundColor: ramoSeleccionado.colorHex, borderColor: ramoSeleccionado.colorHex }]} onPress={() => toggleEtiqueta(tag)}>
                                <Text style={[styles.etiquetaTexto, isSelected && { color: 'white' }]}>{tag}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {tipoBloque === 'actividad' && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.label}>Nombre de la Actividad *</Text>
                <TextInput style={styles.input} placeholder="Ej. Gimnasio, Almuerzo, Estudio..." value={nuevaActividadNombre} onChangeText={setNuevaActividadNombre} />
                {actividadesGlobales.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actividadesGuardadasContainer}>
                    {actividadesGlobales.map((act: any, idx: number) => (
                      <TouchableOpacity key={idx} style={[styles.actividadPildora, { backgroundColor: act.colorHex + '20', borderColor: act.colorHex }]} onPress={() => cargarActividadGuardada(act)}>
                        <Text style={[styles.actividadTextoPildora, { color: act.colorHex }]}>{act.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorPickerContainer}>
                  {coloresActividad.map((color) => (
                    <TouchableOpacity key={color} style={[styles.colorCirculo, { backgroundColor: color }, nuevaActividadColor === color && styles.colorSeleccionado]} onPress={() => setNuevaActividadColor(color)} />
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.row, { marginTop: 15 }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Hora Inicio</Text>
                <TouchableOpacity style={styles.btnHora} onPress={() => setShowPickerInicio(true)}><Ionicons name="time-outline" size={20} color="#64748b" style={{marginRight: 8}} /><Text style={styles.textoHoraPicker}>{formatearHora(horaInicio)}</Text></TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hora Fin</Text>
                <TouchableOpacity style={styles.btnHora} onPress={() => setShowPickerFin(true)}><Ionicons name="time-outline" size={20} color="#64748b" style={{marginRight: 8}} /><Text style={styles.textoHoraPicker}>{formatearHora(horaFin)}</Text></TouchableOpacity>
              </View>
            </View>

            {showPickerInicio && <DateTimePicker value={horaInicio} mode="time" is24Hour={true} display="default" onChange={onChangeInicio} />}
            {showPickerFin && <DateTimePicker value={horaFin} mode="time" is24Hour={true} display="default" onChange={onChangeFin} />}

            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}><Text style={styles.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnGuardar, (tipoBloque === 'ramo' && !ramoSeleccionado) && { backgroundColor: '#cbd5e1' }]} onPress={guardarClase} disabled={tipoBloque === 'ramo' && !ramoSeleccionado}><Text style={styles.btnGuardarTexto}>Guardar</Text></TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { backgroundColor: 'white', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tituloPrincipal: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  
  btnHecho: { backgroundColor: '#eff6ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  textoHecho: { color: '#1a73e8', fontWeight: 'bold', fontSize: 14 },

  selectorDias: { flexDirection: 'row', justifyContent: 'space-between' },
  diaBoton: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  diaBotonActivo: { backgroundColor: '#1a73e8' },
  diaTexto: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  diaTextoActivo: { color: 'white' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  tarjeta: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  horaContainer: { width: 65, borderRightWidth: 1, borderRightColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', paddingRight: 10, marginRight: 15 },
  horaTexto: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  horaFin: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  infoContainer: { flex: 1, justifyContent: 'center', paddingRight: 5 }, 
  tituloFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  materiaTexto: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1, paddingRight: 5 },
  btnBorrarClase: { padding: 6, backgroundColor: '#fee2e2', borderRadius: 8 },
  etiquetasContainerLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTexto: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  ventanaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, marginBottom: 10, marginHorizontal: 10 },
  ventanaTexto: { marginLeft: 8, color: '#64748b', fontSize: 14, fontWeight: 'bold' },
  estadoVacio: { alignItems: 'center', marginTop: 80 },
  textoVacio: { fontSize: 20, fontWeight: 'bold', color: '#64748b', marginTop: 15 },
  subtextoVacio: { fontSize: 14, color: '#94a3b8', marginTop: 5, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#1a73e8', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#1a73e8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  
  // MENÚ SUPERIOR
  modalOverlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'flex-end', paddingRight: 20, paddingTop: 90 },
  menuTopContent: { backgroundColor: 'white', borderRadius: 12, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, width: 200 },
  opcionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opcionIcono: { marginRight: 12 },
  opcionTexto: { fontSize: 16, fontWeight: '500', color: '#334155' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '90%' },
  tabsFormulario: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 10 },
  tabForm: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabFormActivo: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabFormTexto: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  tabFormTextoActivo: { color: '#0f172a' },
  alertaRamosVacios: { backgroundColor: '#fffbeb', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  textoAlertaRamos: { fontSize: 15, color: '#b45309', fontWeight: 'bold', marginTop: 10, marginBottom: 15 },
  btnIrARamosMini: { backgroundColor: '#f59e0b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnIrARamosMiniTexto: { color: 'white', fontWeight: 'bold' },
  input: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 15, fontSize: 16, color: '#334155', marginBottom: 10 },
  actividadesGuardadasContainer: { flexDirection: 'row', marginBottom: 15 },
  actividadPildora: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  actividadTextoPildora: { fontWeight: 'bold', fontSize: 13 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 15 },
  dropdownButtonText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  dropdownListContainer: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, marginTop: 5, maxHeight: 150, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  dropdownItemText: { fontSize: 16, color: '#334155' },
  etiquetasContainerSelector: { flexDirection: 'row', marginTop: 5, marginBottom: 5 },
  etiquetaPildora: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', marginRight: 10 },
  etiquetaTexto: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  btnHora: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 15, justifyContent: 'center' },
  textoHoraPicker: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  colorPickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  colorCirculo: { width: 36, height: 36, borderRadius: 18 },
  colorSeleccionado: { borderWidth: 3, borderColor: '#334155' },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  btnCancelar: { padding: 15, borderRadius: 10, marginRight: 10 },
  btnCancelarTexto: { color: '#64748b', fontWeight: 'bold', fontSize: 16 },
  btnGuardar: { backgroundColor: '#1a73e8', padding: 15, borderRadius: 10, paddingHorizontal: 25 },
  btnGuardarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});