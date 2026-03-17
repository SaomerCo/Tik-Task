import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

import Encabezado from '../../components/Encabezado';
import { useTabContext } from '../../context/TabContext';
import { useTheme } from '../../context/ThemeContext';

export default function HorarioScreen() {
  const router = useRouter();
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const obtenerDiaActual = () => {
    const jsDay = new Date().getDay();
    const indice = jsDay === 0 ? 6 : jsDay - 1;
    return diasSemana[indice];
  };

  const [diaActivo, setDiaActivo] = useState(obtenerDiaActual());

  const {
    ramosGlobales, actividadesGlobales, agregarActividadGlobal,
    cicloActivo, bloquesHorario, agregarBloqueHorario, eliminarBloqueHorario, actualizarBloqueHorario, limpiarBloquesVisibles,
    eventosGlobales, agregarEvento
  } = useAppContext();

  const { colors, isDark } = useTheme();
  const s = buildStyles(colors, isDark);
  const { setTabIndex } = useTabContext();

  const params = useLocalSearchParams();
  const esModoSeleccion = params.modoSeleccion === 'true';
  const ramoIdTarget = params.ramoId;

  const [menuTopVisible, setMenuTopVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [tipoBloque, setTipoBloque] = useState('ramo');
  
  const [bloqueEditandoId, setBloqueEditandoId] = useState<string | null>(null);

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

  const formatearHora = (fecha: Date) => {
    let horas = fecha.getHours();
    let minutos = fecha.getMinutes();
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12; 
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')} ${ampm}`;
  };

  const onChangeInicio = (event: any, selectedDate?: Date) => { setShowPickerInicio(false); if (selectedDate) setHoraInicio(selectedDate); };
  const onChangeFin = (event: any, selectedDate?: Date) => { setShowPickerFin(false); if (selectedDate) setHoraFin(selectedDate); };
  
  const convertirAMinutos = (horaStr: string) => { 
    if (!horaStr || !horaStr.includes(':')) return 0; 
    let [hStr, mStr] = horaStr.split(':'); 
    let h = parseInt(hStr); 
    let m = parseInt(mStr.replace(/[^0-9]/g, '')); 
    
    if (horaStr.toLowerCase().includes('pm') && h !== 12) h += 12;
    if (horaStr.toLowerCase().includes('am') && h === 12) h = 0;
    
    return h * 60 + m; 
  };

  const formatearTiempoLibre = (minutosTotales: number) => {
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    if (horas > 0 && minutos > 0) return `${horas}h ${minutos}m`;
    if (horas > 0) return `${horas}h`;
    return `${minutos}m`;
  };

  if (!cicloActivo) {
    return (
      <View style={s.mainContainer}>
        <Encabezado
          label="AGENDA"
          titulo="Horario"
          subtitulo="Tu semana organizada"
          icono="calendar"
          colorActivo={colors.primary}
        />
        <View style={s.estadoVacioGlobal}>
          <View style={[s.iconoFondoVacioGlobal, { backgroundColor: isDark ? colors.surfaceElevated : '#f1f5f9' }]}>
            <Ionicons name="lock-closed-outline" size={60} color={colors.textSecondary} />
          </View>
          <Text style={s.textoVacioGlobal}>Horario inactivo</Text>
          <Text style={s.subtextoVacioGlobal}>
            Activa o crea un periodo de estudios para poder configurar un horario.
          </Text>
          <TouchableOpacity style={[s.btnIrARamosGlobal, { backgroundColor: colors.primary }]} onPress={() => setTabIndex(0)}>
            <Text style={s.btnIrARamosTextoGlobal}>Ir a Ramos</Text>
            <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bloquesVisibles = bloquesHorario.filter((b: any) => b.cicloId === cicloActivo.id);

  const clasesDelDia = bloquesVisibles
    .filter((clase: any) => clase.dia === diaActivo)
    .sort((a: any, b: any) => convertirAMinutos(a.horaInicio) - convertirAMinutos(b.horaInicio));

  const limpiarHorario = () => {
    Alert.alert('Limpiar Horario', '¿Estás seguro de que quieres borrar todos los bloques de este semestre?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, limpiar', style: 'destructive', onPress: () => {
          const idsVisibles = bloquesVisibles.map((b: any) => b.id);
          limpiarBloquesVisibles(idsVisibles);
          setMenuTopVisible(false);
        }
      }
    ]);
  };

  // NUEVA FUNCIÓN PARA CONFIRMAR BORRADO INDIVIDUAL
  const confirmarEliminarBloque = (id: string) => {
    Alert.alert('Eliminar bloque', '¿Estás seguro de que quieres borrar este bloque del horario?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarBloqueHorario(id) }
    ]);
  };

  const seleccionarRamo = (ramo: any) => {
    setRamoSeleccionado(ramo); setMostrarDropdown(false);
    if (!bloqueEditandoId) {
        setEtiquetasSeleccionadas(ramo.etiquetas && ramo.etiquetas.length > 0 ? [ramo.etiquetas[0]] : []);
    }
  };
  const toggleEtiqueta = (tag: string) => setEtiquetasSeleccionadas(etiquetasSeleccionadas.includes(tag) ? etiquetasSeleccionadas.filter(t => t !== tag) : [...etiquetasSeleccionadas, tag]);
  const cargarActividadGuardada = (act: any) => { setNuevaActividadNombre(act.nombre); setNuevaActividadColor(act.colorHex); };

  const abrirModalNuevo = () => {
    if (esModoSeleccion) return;
    setBloqueEditandoId(null);
    setTipoBloque(ramosGlobales.length === 0 ? 'actividad' : 'ramo');
    setRamoSeleccionado(null);
    setEtiquetasSeleccionadas([]);
    setNuevaActividadNombre('');
    setHoraInicio(new Date(new Date().setHours(8, 30, 0, 0)));
    setHoraFin(new Date(new Date().setHours(10, 0, 0, 0)));
    setModalVisible(true);
  };

  const abrirModalEdicionBloque = (clase: any) => {
    setBloqueEditandoId(clase.id);
    
    if (clase.isActividad) {
        setTipoBloque('actividad');
        setNuevaActividadNombre(clase.ramo);
        setNuevaActividadColor(clase.colorHex);
        setRamoSeleccionado(null);
        setEtiquetasSeleccionadas([]);
    } else {
        setTipoBloque('ramo');
        const ramoGlobal = ramosGlobales.find((r: any) => r.id === clase.ramoId);
        setRamoSeleccionado(ramoGlobal || { nombre: clase.ramo, colorHex: clase.colorHex, etiquetas: clase.etiquetas });
        setEtiquetasSeleccionadas(clase.etiquetas || []);
        setNuevaActividadNombre('');
    }

    const parseHoraStr = (horaStr: string) => {
        const min = convertirAMinutos(horaStr);
        const d = new Date();
        d.setHours(Math.floor(min / 60), min % 60, 0, 0);
        return d;
    };
    
    setHoraInicio(parseHoraStr(clase.horaInicio));
    setHoraFin(parseHoraStr(clase.horaFin));
    
    setModalVisible(true);
  };

  const ejecutarGuardado = () => {
    let nuevaClase: any = {
      id: bloqueEditandoId ? bloqueEditandoId : Math.random().toString(), 
      dia: diaActivo,
      horaInicio: formatearHora(horaInicio), 
      horaFin: formatearHora(horaFin),
    };

    if (tipoBloque === 'ramo') {
      if (!ramoSeleccionado) return;
      nuevaClase = {
        ...nuevaClase,
        ramo: ramoSeleccionado.nombre, profesor: ramoSeleccionado.profesor,
        aula: ramoSeleccionado.sala, etiquetas: etiquetasSeleccionadas,
        colorHex: ramoSeleccionado.colorHex, isActividad: false,
        cicloId: cicloActivo.id,
        ramoId: ramoSeleccionado.id
      };
    } else {
      if (!nuevaActividadNombre.trim()) return;
      nuevaClase = {
        ...nuevaClase,
        ramo: nuevaActividadNombre, colorHex: nuevaActividadColor, isActividad: true,
        cicloId: cicloActivo.id
      };
      if (!actividadesGlobales.find((a: any) => a.nombre.toLowerCase() === nuevaActividadNombre.toLowerCase().trim())) {
        agregarActividadGlobal({ nombre: nuevaActividadNombre.trim(), colorHex: nuevaActividadColor });
      }
    }

    if (bloqueEditandoId) {
        actualizarBloqueHorario(bloqueEditandoId, nuevaClase);
    } else {
        agregarBloqueHorario(nuevaClase);
    }
    
    setModalVisible(false);
    setBloqueEditandoId(null);
    setRamoSeleccionado(null);
    setNuevaActividadNombre('');
  };

  const guardarClase = () => {
    if (tipoBloque === 'ramo' && !ramoSeleccionado) return Alert.alert('Error', 'Selecciona un ramo de la lista.');
    if (tipoBloque === 'actividad' && !nuevaActividadNombre.trim()) return Alert.alert('Error', 'Escribe el nombre de la actividad.');
    const inicioMin = horaInicio.getHours() * 60 + horaInicio.getMinutes();
    const finMin = horaFin.getHours() * 60 + horaFin.getMinutes();
    if (inicioMin >= finMin) return Alert.alert('Error', 'La hora de término debe ser posterior a la de inicio.');

    const hayChoque = bloquesVisibles
        .filter((c: any) => c.dia === diaActivo && c.id !== bloqueEditandoId)
        .some((claseExistente: any) => {
            const inicioExistente = convertirAMinutos(claseExistente.horaInicio);
            const finExistente = convertirAMinutos(claseExistente.horaFin);
            return (inicioMin < finExistente && inicioExistente < finMin);
        });

    if (hayChoque) {
      Alert.alert('Choque ⚠️', 'Este bloque se superpone con otro en este semestre. ¿Guardar igual?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Guardar', onPress: ejecutarGuardado, style: 'destructive' }
      ]);
    } else { ejecutarGuardado(); }
  };

  const manejarToqueBloque = (clase: any) => {
    if (!esModoSeleccion) return;

    if (clase.isActividad || clase.ramoId !== ramoIdTarget) {
      Alert.alert("Bloque incorrecto", "Por favor selecciona un bloque del ramo correspondiente a la prueba.");
      return;
    }

    agregarEvento({
      id: Math.random().toString(),
      titulo: `${params.tipoEvento}: ${clase.ramo}`,
      tipo: params.tipoEvento as string,
      ramoId: clase.ramoId,
      fecha: params.fechaEvento as string,
      hora: `${clase.horaInicio} - ${clase.horaFin}`,
      sala: clase.aula,
      color: colors.danger,
      icono: 'school'
    });
    Alert.alert("¡Éxito!", "Evaluación registrada en el horario correctamente.");
    router.replace('/eventos');
  };

  return (
    <View style={s.mainContainer}>

      <View style={s.headerContainer}>
        <View style={s.headerFlex}>
          <Encabezado
            label="AGENDA"
            titulo="Horario"
            subtitulo="Tu semana organizada"
            icono="calendar"
            colorActivo={colors.primary}
          />
        </View>

        {esModoSeleccion && (
          <View style={[s.bannerSeleccion, { backgroundColor: isDark ? colors.warning + '20' : '#fef3c7', borderColor: colors.warning }]}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} style={{ marginRight: 8 }} />
            <Text style={[s.bannerTexto, { color: colors.warning }]}>Toca el bloque de clase donde será la prueba</Text>
          </View>
        )}

        <View style={s.selectorDias}>
          {diasSemana.map((dia) => (
            <TouchableOpacity key={dia} style={[s.diaBoton, diaActivo === dia && { backgroundColor: colors.primary }]} onPress={() => setDiaActivo(dia)}>
              <Text style={[s.diaTexto, diaActivo === dia && s.diaTextoActivo]}>{dia}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={s.container} showsVerticalScrollIndicator={false} removeClippedSubviews={false}>

        {eventosGlobales
          .filter((e: any) => e.temporal)
          .map((eventoTemporal: any, index: number) => (
            <View key={`temp-${eventoTemporal.id}-${index}`} style={[s.tarjeta, { borderLeftColor: colors.danger, backgroundColor: isDark ? colors.danger + '10' : '#fef2f2' }]}>
              <View style={s.horaContainer}>
                <Text style={[s.horaTexto, { color: colors.danger }]}>{eventoTemporal.hora.split(' - ')[0]}</Text>
                <Text style={[s.horaFin, { color: colors.danger }]}>{eventoTemporal.hora.split(' - ')[1]}</Text>
              </View>
              <View style={s.infoContainer}>
                <View style={s.tituloFila}>
                  <Text style={[s.materiaTexto, { color: colors.danger }]} numberOfLines={1}>{eventoTemporal.titulo}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: colors.danger + '20' }]}>
                  <Ionicons name="warning" size={12} color={colors.danger} style={{ marginRight: 4 }} />
                  <Text style={[s.badgeTexto, { color: colors.danger }]}>Evaluación Temporal</Text>
                </View>
              </View>
            </View>
          ))}

        {clasesDelDia.length === 0 ? (
          <View style={s.estadoVacio}>
            <Ionicons name="calendar-clear-outline" size={48} color={colors.textSecondary} />
            <Text style={s.textoVacio}>Día libre</Text>
            <Text style={s.subtextoVacio}>Agrega clases o actividades personales.</Text>
          </View>
        ) : (
          clasesDelDia.map((clase: any, index: number) => {
            const claseSiguiente = clasesDelDia[index + 1];
            const minutosDeVentana = claseSiguiente ? convertirAMinutos(claseSiguiente.horaInicio) - convertirAMinutos(clase.horaFin) : 0;

            const isTargetRamo = clase.ramoId === ramoIdTarget;
            const opacidadBaja = esModoSeleccion && !isTargetRamo;

            return (
              <React.Fragment key={`${clase.id}-${index}`}>
                <TouchableOpacity
                  activeOpacity={esModoSeleccion ? 0.7 : 1}
                  onPress={() => manejarToqueBloque(clase)}
                >
                  <View style={[
                    s.tarjeta,
                    { borderLeftColor: clase.colorHex },
                    opacidadBaja && { backgroundColor: isDark ? colors.background : '#f1f5f9', opacity: 0.5, borderLeftColor: colors.border }
                  ]}>
                    <View style={s.horaContainer}>
                      <Text style={[s.horaTexto, opacidadBaja && { color: colors.textSecondary }]} numberOfLines={1}>{clase.horaInicio}</Text>
                      <Text style={s.horaFin} numberOfLines={1}>{clase.horaFin}</Text>
                    </View>

                    <View style={s.infoContainer}>
                      <View style={s.tituloFila}>
                        <Text style={[s.materiaTexto, opacidadBaja && { color: colors.textSecondary }]} numberOfLines={1}>{clase.ramo}</Text>
                        
                        {modoEdicion && (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity style={[s.btnBorrarClase, { backgroundColor: isDark ? colors.primary + '20' : '#e0e7ff' }]} onPress={() => abrirModalEdicionBloque(clase)}>
                                <Ionicons name="pencil" size={18} color={colors.primary} />
                              </TouchableOpacity>
                              {/* LLAMADA A LA NUEVA FUNCIÓN DE CONFIRMACIÓN DE BORRADO */}
                              <TouchableOpacity style={[s.btnBorrarClase, { backgroundColor: isDark ? colors.danger + '20' : '#fee2e2' }]} onPress={() => confirmarEliminarBloque(clase.id)}>
                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                              </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {clase.isActividad ? (
                        <View style={[s.badge, { backgroundColor: opacidadBaja ? colors.surfaceSubtle : clase.colorHex + '20' }]}>
                          <Ionicons name="body-outline" size={12} color={opacidadBaja ? colors.textSecondary : clase.colorHex} style={{ marginRight: 4 }} />
                          <Text style={[s.badgeTexto, { color: opacidadBaja ? colors.textSecondary : clase.colorHex }]}>Personal</Text>
                        </View>
                      ) : (
                        <>
                          {clase.etiquetas && clase.etiquetas.length > 0 && (
                            <View style={s.etiquetasContainerLista}>
                              {clase.etiquetas.map((tag: string, i: number) => (
                                <View key={i} style={[s.badge, { backgroundColor: opacidadBaja ? colors.surfaceSubtle : clase.colorHex + '20' }]}><Text style={[s.badgeTexto, { color: opacidadBaja ? colors.textSecondary : clase.colorHex }]}>{tag}</Text></View>
                              ))}
                            </View>
                          )}
                          {clase.aula !== 'Por definir' && clase.aula !== '' && (
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}><Ionicons name="location-outline" size={12} /> {clase.aula}</Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {minutosDeVentana > 20 && !esModoSeleccion && (
                  <View style={[s.ventanaContainer, { backgroundColor: isDark ? colors.background : '#f1f5f9', borderColor: colors.border }]}><Ionicons name="cafe-outline" size={20} color={colors.textSecondary} /><Text style={s.ventanaTexto}>Ventana libre: {formatearTiempoLibre(minutosDeVentana)}</Text></View>
                )}
              </React.Fragment>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {!modoEdicion && !esModoSeleccion && (
        <TouchableOpacity style={[s.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={abrirModalNuevo}><Ionicons name="add" size={30} color="white" /></TouchableOpacity>
      )}

      {!esModoSeleccion && (
        modoEdicion ? (
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
        )
      )}

      <Modal animationType="fade" transparent={true} visible={menuTopVisible} onRequestClose={() => setMenuTopVisible(false)}>
        <TouchableOpacity style={s.modalOverlayTop} activeOpacity={1} onPress={() => setMenuTopVisible(false)}>
          <View style={s.menuTopContent}>
            <TouchableOpacity style={s.opcionItem} onPress={() => { setModoEdicion(true); setMenuTopVisible(false); }}>
              <Ionicons name="create-outline" size={20} color={colors.text} style={s.opcionIcono} />
              <Text style={s.opcionTexto}>Editar bloques</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.opcionItem, { borderBottomWidth: 0 }]} onPress={limpiarHorario}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} style={s.opcionIcono} />
              <Text style={[s.opcionTexto, { color: colors.danger }]}>Limpiar semestre</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            
            <Text style={s.modalTitulo}>{bloqueEditandoId ? 'Editar Bloque' : 'Nuevo Bloque'}</Text>

            <View style={s.tabsFormulario}>
              <TouchableOpacity style={[s.tabForm, tipoBloque === 'ramo' && s.tabFormActivo]} onPress={() => setTipoBloque('ramo')}>
                <Text style={[s.tabFormTexto, tipoBloque === 'ramo' && s.tabFormTextoActivo]}>📚 Ramo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tabForm, tipoBloque === 'actividad' && s.tabFormActivo]} onPress={() => setTipoBloque('actividad')}>
                <Text style={[s.tabFormTexto, tipoBloque === 'actividad' && s.tabFormTextoActivo]}>🏃 Actividad</Text>
              </TouchableOpacity>
            </View>

            {tipoBloque === 'ramo' && (
              <View style={{ marginTop: 15 }}>
                {ramosGlobales.length === 0 ? (
                  <View style={[s.alertaRamosVacios, { backgroundColor: isDark ? colors.warning + '20' : '#fffbeb' }]}>
                    <Ionicons name="alert-circle" size={24} color={colors.warning} />
                    <Text style={[s.textoAlertaRamos, { color: colors.warning }]}>No tienes ramos en este semestre.</Text>
                  </View>
                ) : (
                  <>
                    <Text style={s.label}>Selecciona el Ramo *</Text>
                    <TouchableOpacity style={s.dropdownButton} onPress={() => setMostrarDropdown(!mostrarDropdown)}>
                      <Text style={[s.dropdownButtonText, !ramoSeleccionado && { color: colors.textSecondary }]}>{ramoSeleccionado ? ramoSeleccionado.nombre : 'Elige un ramo inscrito...'}</Text>
                      <Ionicons name={mostrarDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {mostrarDropdown && (
                      <View style={s.dropdownListContainer}>
                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {ramosGlobales.map((ramo: any) => (
                            <TouchableOpacity key={ramo.id} style={s.dropdownItem} onPress={() => seleccionarRamo(ramo)}>
                              <View style={[s.colorDot, { backgroundColor: ramo.colorHex }]} />
                              <Text style={s.dropdownItemText}>{ramo.nombre}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {ramoSeleccionado && ramoSeleccionado.etiquetas && ramoSeleccionado.etiquetas.length > 0 && (
                      <View style={{ marginTop: 15 }}>
                        <Text style={s.label}>Etiquetas para esta clase</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.etiquetasContainerSelector}>
                          {ramoSeleccionado.etiquetas.map((tag: string, index: number) => {
                            const isSelected = etiquetasSeleccionadas.includes(tag);
                            return (
                              <TouchableOpacity key={index} style={[s.etiquetaPildora, isSelected && { backgroundColor: ramoSeleccionado.colorHex, borderColor: ramoSeleccionado.colorHex }]} onPress={() => toggleEtiqueta(tag)}>
                                <Text style={[s.etiquetaTexto, isSelected && { color: 'white' }]}>{tag}</Text>
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
                <Text style={s.label}>Nombre de la Actividad *</Text>
                <TextInput style={s.input} placeholder="Ej. Gimnasio, Almuerzo, Estudio..." placeholderTextColor={colors.textSecondary} value={nuevaActividadNombre} onChangeText={setNuevaActividadNombre} />
                {actividadesGlobales.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.actividadesGuardadasContainer}>
                    {actividadesGlobales.map((act: any, idx: number) => (
                      <TouchableOpacity key={idx} style={[s.actividadPildora, { backgroundColor: act.colorHex + '20', borderColor: act.colorHex }]} onPress={() => cargarActividadGuardada(act)}>
                        <Text style={[s.actividadTextoPildora, { color: act.colorHex }]}>{act.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <Text style={s.label}>Color</Text>
                <View style={s.colorPickerContainer}>
                  {coloresActividad.map((color) => (
                    <TouchableOpacity key={color} style={[s.colorCirculo, { backgroundColor: color }, nuevaActividadColor === color && s.colorSeleccionado]} onPress={() => setNuevaActividadColor(color)} />
                  ))}
                </View>
              </View>
            )}

            <View style={[s.row, { marginTop: 15 }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.label}>Hora Inicio</Text>
                <TouchableOpacity style={s.btnHora} onPress={() => setShowPickerInicio(true)}><Ionicons name="time-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} /><Text style={s.textoHoraPicker}>{formatearHora(horaInicio)}</Text></TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Hora Fin</Text>
                <TouchableOpacity style={s.btnHora} onPress={() => setShowPickerFin(true)}><Ionicons name="time-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} /><Text style={s.textoHoraPicker}>{formatearHora(horaFin)}</Text></TouchableOpacity>
              </View>
            </View>

            {showPickerInicio && <DateTimePicker value={horaInicio} mode="time" is24Hour={false} display="default" onChange={onChangeInicio} />}
            {showPickerFin && <DateTimePicker value={horaFin} mode="time" is24Hour={false} display="default" onChange={onChangeFin} />}

            <View style={s.modalBotones}>
              <TouchableOpacity style={s.btnCancelar} onPress={() => setModalVisible(false)}><Text style={s.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnGuardar, (tipoBloque === 'ramo' && !ramoSeleccionado) && { backgroundColor: isDark ? colors.surfaceSubtle : '#cbd5e1' }]} onPress={guardarClase} disabled={tipoBloque === 'ramo' && !ramoSeleccionado}>
                <Text style={s.btnGuardarTexto}>{bloqueEditandoId ? 'Actualizar' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

function buildStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.background },

    headerContainer: { backgroundColor: colors.surface, paddingHorizontal: 0, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tituloPrincipal: { fontSize: 28, fontWeight: 'bold', color: colors.text },

    btnHecho: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    textoHecho: { fontWeight: 'bold', fontSize: 14 },

    bannerSeleccion: { flexDirection: 'row', padding: 12, marginBottom: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20 },
    bannerTexto: { fontWeight: 'bold', fontSize: 13 },

    selectorDias: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
    diaBoton: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    diaBotonActivo: { backgroundColor: colors.primary },
    diaTexto: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
    diaTextoActivo: { color: 'white' },

    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    tarjeta: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 15, marginBottom: 10, borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 8, elevation: isDark ? 0 : 3, borderWidth: 1, borderColor: colors.border },
    
    horaContainer: { width: 85, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center', alignItems: 'center', paddingRight: 10, marginRight: 15 },
    horaTexto: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
    horaFin: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    
    infoContainer: { flex: 1, justifyContent: 'center', paddingRight: 5 },
    tituloFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    materiaTexto: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1, paddingRight: 5 },
    btnBorrarClase: { padding: 6, borderRadius: 8 },
    etiquetasContainerLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
    badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeTexto: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },

    ventanaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, marginBottom: 10, marginHorizontal: 10 },
    ventanaTexto: { marginLeft: 8, color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },

    estadoVacio: { alignItems: 'center', marginTop: 80 },
    textoVacio: { fontSize: 20, fontWeight: 'bold', color: colors.textSecondary, marginTop: 15 },
    subtextoVacio: { fontSize: 14, color: colors.textTertiary, marginTop: 5, textAlign: 'center' },

    estadoVacioGlobal: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: -60 },
    iconoFondoVacioGlobal: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    textoVacioGlobal: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
    subtextoVacioGlobal: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    btnIrARamosGlobal: { flexDirection: 'row', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center' },
    btnIrARamosTextoGlobal: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    fabEditar: { position: 'absolute', bottom: 20, left: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },

    modalOverlayTop: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)', alignItems: 'flex-end', paddingRight: 20, paddingTop: 90 },
    menuTopContent: { backgroundColor: colors.surface, borderRadius: 12, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, width: 200, borderWidth: 1, borderColor: colors.border },
    opcionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    opcionIcono: { marginRight: 12 },
    opcionTexto: { fontSize: 16, fontWeight: '500', color: colors.text },

    modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '90%' },

    tabsFormulario: { flexDirection: 'row', backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 15 },
    tabForm: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    tabFormActivo: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 4, elevation: isDark ? 0 : 2 },
    tabFormTexto: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    tabFormTextoActivo: { color: colors.text },

    alertaRamosVacios: { padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    textoAlertaRamos: { fontSize: 15, fontWeight: 'bold', marginTop: 10, marginBottom: 15 },

    input: { backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 10, padding: 15, fontSize: 16, color: colors.text, marginBottom: 10, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    actividadesGuardadasContainer: { flexDirection: 'row', marginBottom: 15 },
    actividadPildora: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
    actividadTextoPildora: { fontWeight: 'bold', fontSize: 13 },
    modalTitulo: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    label: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8 },

    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    dropdownButtonText: { fontSize: 16, color: colors.text, fontWeight: '500' },
    dropdownListContainer: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginTop: 5, maxHeight: 200 },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
    dropdownItemText: { fontSize: 16, color: colors.text },

    etiquetasContainerSelector: { flexDirection: 'row', marginTop: 5, marginBottom: 5 },
    etiquetaPildora: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? colors.background : '#f8fafc', marginRight: 10 },
    etiquetaTexto: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    btnHora: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 10, padding: 15, justifyContent: 'center', borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    textoHoraPicker: { fontSize: 16, fontWeight: 'bold', color: colors.text },

    colorPickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    colorCirculo: { width: 36, height: 36, borderRadius: 18 },
    colorSeleccionado: { borderWidth: 3, borderColor: colors.text },

    modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
    btnCancelar: { padding: 15, borderRadius: 10, marginRight: 10 },
    btnCancelarTexto: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 16 },
    btnGuardar: { backgroundColor: colors.primary, padding: 15, borderRadius: 10, paddingHorizontal: 25 },
    btnGuardarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 }
  });
}