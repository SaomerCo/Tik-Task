import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

// IMPORTACIONES DEL TEMA Y ENCABEZADO
import Encabezado from '../../components/Encabezado';
import { useTheme } from '../../context/ThemeContext';

const TIPOS_EVENTO = [
  { id: 'evaluacion', label: 'Evaluación próxima', icon: 'school', color: '#ef4444' },
  { id: 'cancelada', label: 'Clase cancelada', icon: 'close-circle', color: '#64748b' },
  { id: 'entregable', label: 'Plazo entregable', icon: 'document-text', color: '#1a73e8' },
  { id: 'personalizado', label: 'Evento a medida', icon: 'calendar', color: '#f59e0b' },
];

export default function EventosScreen() {
  const { eventosGlobales, eliminarEvento, agregarEvento, editarEvento, ramosGlobales } = useAppContext();

  // EXTRAEMOS LOS COLORES DEL TEMA
  const { colors, isDark } = useTheme();
  const s = buildStyles(colors, isDark);

  // Filtros de vista
  const [filtroActual, setFiltroActual] = useState<string>('todos');

  // Estados del flujo y edición
  const [modalVisible, setModalVisible] = useState(false);
  const [paso, setPaso] = useState(1);
  const [eventoAEditarId, setEventoAEditarId] = useState<string | null>(null);

  // Datos del evento
  const [tipoSel, setTipoSel] = useState<any>(null);
  const [tituloManual, setTituloManual] = useState('');
  const [ramoVinculadoId, setRamoVinculadoId] = useState<string>('general');

  // NUEVO ESTADO: Formato de tiempo para eventos personalizados
  const [formatoTiempo, setFormatoTiempo] = useState<'rango' | 'limite'>('rango');

  // Estados de Fecha y Hora
  const [fechaSel, setFechaSel] = useState(new Date());
  const [horaInicioSel, setHoraInicioSel] = useState(new Date(new Date().setHours(23, 59, 0, 0)));
  const [horaFinSel, setHoraFinSel] = useState(new Date(new Date().setHours(10, 0, 0, 0)));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePickerInicio, setShowTimePickerInicio] = useState(false);
  const [showTimePickerFin, setShowTimePickerFin] = useState(false);

  // --- HELPERS DE FORMATO ---
  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };
  const formatearHora = (fecha: Date) => {
    return `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
  };

  const abrirModalNuevo = () => {
    setEventoAEditarId(null);
    setPaso(1);
    setTipoSel(null);
    setTituloManual('');
    setRamoVinculadoId(filtroActual !== 'todos' ? filtroActual : 'general');
    setFormatoTiempo('rango');
    setFechaSel(new Date());
    setHoraInicioSel(new Date(new Date().setHours(23, 59, 0, 0)));
    setHoraFinSel(new Date(new Date().setHours(10, 0, 0, 0)));
    setModalVisible(true);
  };

  const abrirModalEdicion = (ev: any) => {
    const tipoEncontrado = TIPOS_EVENTO.find(t => t.label === ev.tipo) || TIPOS_EVENTO[3];
    setTipoSel(tipoEncontrado);

    setTituloManual(ev.titulo === ev.tipo ? '' : ev.titulo);
    setRamoVinculadoId(ev.ramoId || 'general');

    // Identificar si guardó como límite o como rango para autoseleccionar el formato
    if (ev.hora.includes('Hasta')) {
      setFormatoTiempo('limite');
    } else {
      setFormatoTiempo('rango');
    }

    const dateObj = new Date(ev.timestamp);
    setFechaSel(dateObj);

    const horasMatch = ev.hora.match(/\d{2}:\d{2}/g);
    const inicioDate = new Date(dateObj);
    const finDate = new Date(dateObj);

    if (horasMatch && horasMatch.length > 0) {
      const [h1, m1] = horasMatch[0].split(':');
      inicioDate.setHours(parseInt(h1, 10), parseInt(m1, 10), 0, 0);

      if (horasMatch.length > 1) {
        const [h2, m2] = horasMatch[1].split(':');
        finDate.setHours(parseInt(h2, 10), parseInt(m2, 10), 0, 0);
      } else {
        finDate.setHours(inicioDate.getHours() + 1, 0, 0, 0);
      }
    }

    setHoraInicioSel(inicioDate);
    setHoraFinSel(finDate);

    setEventoAEditarId(ev.id);
    setPaso(2);
    setModalVisible(true);
  };

  const resetModal = () => {
    setModalVisible(false);
  };

  const seleccionarTipo = (tipo: any) => {
    setTipoSel(tipo);
    if (tipo.id === 'entregable') {
      setHoraInicioSel(new Date(new Date().setHours(23, 59, 0, 0)));
    } else {
      setHoraInicioSel(new Date(new Date().setHours(8, 30, 0, 0)));
    }
    setFormatoTiempo('rango'); // Reseteo de seguridad
    setPaso(2);
  };

  // Función para cambiar formato en tiempo real y asignar horas lógicas por defecto
  const manejarCambioFormato = (formato: 'rango' | 'limite') => {
    setFormatoTiempo(formato);
    if (formato === 'limite') {
      setHoraInicioSel(new Date(new Date().setHours(23, 59, 0, 0)));
    } else {
      setHoraInicioSel(new Date(new Date().setHours(8, 30, 0, 0)));
    }
  };

  const manejarSeleccionRamoModal = (ramo: any) => {
    if (ramoVinculadoId === ramo.id) {
      setRamoVinculadoId('general');
      setTituloManual('');
    } else {
      setRamoVinculadoId(ramo.id);
      setTituloManual(ramo.nombre);
    }
  };

  const guardarEventoFinal = () => {
    if (!tipoSel) return;

    const fechaHoraFinal = new Date(fechaSel);
    fechaHoraFinal.setHours(horaInicioSel.getHours(), horaInicioSel.getMinutes(), 0, 0);

    const tituloFinal = tituloManual.trim() !== '' ? tituloManual.trim() : tipoSel.label;

    // Evaluamos si usamos el diseño "Límite" o "Rango"
    const esLimite = tipoSel.id === 'entregable' || (tipoSel.id === 'personalizado' && formatoTiempo === 'limite');

    const stringHorario = esLimite
      ? `Hasta las ${formatearHora(horaInicioSel)}`
      : `${formatearHora(horaInicioSel)} - ${formatearHora(horaFinSel)}`;

    const eventoPayload = {
      id: eventoAEditarId ? eventoAEditarId : Math.random().toString(),
      titulo: tituloFinal,
      tipo: tipoSel.label,
      fecha: formatearFecha(fechaHoraFinal),
      hora: stringHorario,
      timestamp: fechaHoraFinal.getTime(),
      color: tipoSel.color,
      icono: tipoSel.icon,
      ramoId: ramoVinculadoId
    };

    if (eventoAEditarId && editarEvento) {
      editarEvento(eventoAEditarId, eventoPayload);
    } else {
      agregarEvento(eventoPayload);
    }

    resetModal();
  };

  const eventosFiltrados = eventosGlobales.filter((ev: any) => {
    if (filtroActual === 'todos') return true;
    if (filtroActual === 'general') return !ev.ramoId || ev.ramoId === 'general';
    return ev.ramoId === filtroActual;
  });

  const eventosOrdenados = [...eventosFiltrados]
    .filter(ev => ev && ev.timestamp)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Variable de apoyo visual para renderizar pickers
  const esVistaLimite = tipoSel?.id === 'entregable' || (tipoSel?.id === 'personalizado' && formatoTiempo === 'limite');

  return (
    <View style={s.mainContainer}>

      <Encabezado
        label="CALENDARIO"
        titulo="Eventos"
        subtitulo="Fechas y evaluaciones"
        icono="notifications"
        colorActivo={colors.warning}
      />

      <View style={{ paddingBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtrosContainer}>
          <TouchableOpacity style={[s.filtroPildora, filtroActual === 'todos' && s.filtroActivo]} onPress={() => setFiltroActual('todos')}>
            <Text style={[s.filtroTexto, filtroActual === 'todos' && s.filtroTextoActivo]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.filtroPildora, filtroActual === 'general' && s.filtroActivo]} onPress={() => setFiltroActual('general')}>
            <Text style={[s.filtroTexto, filtroActual === 'general' && s.filtroTextoActivo]}>Generales</Text>
          </TouchableOpacity>

          {ramosGlobales.map((ramo: any) => (
            <TouchableOpacity
              key={ramo.id}
              style={[s.filtroPildora, filtroActual === ramo.id && { backgroundColor: ramo.colorHex, borderColor: ramo.colorHex }]}
              onPress={() => setFiltroActual(ramo.id)}
            >
              <Text style={[s.filtroTexto, filtroActual === ramo.id && { color: 'white' }]}>{ramo.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={s.container} showsVerticalScrollIndicator={false} removeClippedSubviews={false}>
        {eventosOrdenados.length === 0 ? (
          <View style={s.estadoVacio}>
            <Ionicons name="calendar-outline" size={60} color={colors.textSecondary} />
            <Text style={s.textoVacio}>No hay eventos aquí</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 5 }}>Usa el botón + para registrar uno nuevo.</Text>
          </View>
        ) : (
          eventosOrdenados.map((ev: any) => {
            const ramoVinculado = ramosGlobales.find((r: any) => r.id === ev.ramoId);
            const colorFinal = ramoVinculado ? ramoVinculado.colorHex : (ev.color || colors.warning);

            return (
              <View key={ev.id} style={s.tarjeta}>
                <View style={[s.lineaColor, { backgroundColor: colorFinal }]} />

                <View style={{ flex: 1 }}>
                  <View style={[s.badgeTipo, { backgroundColor: isDark ? colorFinal + '30' : colorFinal + '15' }]}>
                    <Ionicons name={ev.icono || 'calendar'} size={12} color={colorFinal} style={{ marginRight: 4 }} />
                    <Text style={[s.badgeTexto, { color: colorFinal }]}>{ev.tipo}</Text>
                  </View>

                  <Text style={s.tituloEvento} numberOfLines={2}>{ev.titulo}</Text>

                  <View style={s.fechaContainer}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={s.fechaTexto}>{ev.fecha} • {ev.hora}</Text>
                  </View>
                </View>

                <View style={s.accionesContainer}>
                  <TouchableOpacity style={s.btnAccion} onPress={() => abrirModalEdicion(ev)}>
                    <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnAccion} onPress={() => eliminarEvento(ev.id)}>
                    <Ionicons name="trash" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>

              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={abrirModalNuevo}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={resetModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>

            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>{eventoAEditarId ? 'Editar Evento' : 'Nuevo Evento'}</Text>
              <TouchableOpacity onPress={resetModal}><Ionicons name="close" size={26} color={colors.textSecondary} /></TouchableOpacity>
            </View>

            {paso === 1 && !eventoAEditarId && (
              <View>
                <Text style={s.pregunta}>¿Qué deseas registrar?</Text>
                <View style={s.gridOpciones}>
                  {TIPOS_EVENTO.map(t => (
                    <TouchableOpacity key={t.id} style={s.cajaOpcion} onPress={() => seleccionarTipo(t)}>
                      <View style={[s.iconoCaja, { backgroundColor: t.color }]}><Ionicons name={t.icon as any} size={24} color="white" /></View>
                      <Text style={s.textoCaja}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {paso === 2 && tipoSel && (
              <ScrollView showsVerticalScrollIndicator={false}>

                <View style={[s.resumenTipoContainer, { borderColor: isDark ? tipoSel.color + '50' : tipoSel.color + '40', backgroundColor: isDark ? tipoSel.color + '20' : tipoSel.color + '10' }]}>
                  <Ionicons name={tipoSel.icon as any} size={20} color={tipoSel.color} />
                  <Text style={[s.resumenTipoTexto, { color: tipoSel.color }]}>{tipoSel.label}</Text>
                </View>

                {/* SELECTOR EXCLUSIVO PARA EVENTOS A MEDIDA */}
                {tipoSel.id === 'personalizado' && (
                  <View style={{ marginBottom: 15 }}>
                    <Text style={s.label}>Formato de hora</Text>
                    <View style={s.toggleContainer}>
                      <TouchableOpacity
                        style={[s.toggleBtn, formatoTiempo === 'rango' && s.toggleBtnActive]}
                        onPress={() => manejarCambioFormato('rango')}
                      >
                        <Text style={[s.toggleText, formatoTiempo === 'rango' && s.toggleTextActive]}>Rango (Inicio - Fin)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.toggleBtn, formatoTiempo === 'limite' && s.toggleBtnActive]}
                        onPress={() => manejarCambioFormato('limite')}
                      >
                        <Text style={[s.toggleText, formatoTiempo === 'limite' && s.toggleTextActive]}>Hora límite</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={s.label}>Vincular a un ramo (Opcional)</Text>

                {ramosGlobales && ramosGlobales.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.ramosSugeridosContainer}>
                    {ramosGlobales.map((ramo: any) => {
                      const isSelected = ramoVinculadoId === ramo.id;
                      return (
                        <TouchableOpacity
                          key={ramo.id}
                          style={[
                            s.ramoPildora,
                            {
                              borderColor: isSelected ? ramo.colorHex : colors.border,
                              backgroundColor: isSelected ? ramo.colorHex : (isDark ? colors.background : 'white')
                            }
                          ]}
                          onPress={() => manejarSeleccionRamoModal(ramo)}
                        >
                          <Text style={[s.ramoPildoraTexto, { color: isSelected ? 'white' : colors.textSecondary }]}>{ramo.nombre}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                <Text style={s.label}>Título</Text>
                <TextInput
                  style={s.input}
                  placeholder={tipoSel.id === 'entregable' ? "Ej: Entrega de Ensayo Final" : "Ej: Prueba de Matemáticas"}
                  placeholderTextColor={colors.textSecondary}
                  value={tituloManual}
                  onChangeText={setTituloManual}
                />

                <Text style={s.label}>Fecha</Text>
                <TouchableOpacity style={s.btnSelector} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={s.textoSelector}>{formatearFecha(fechaSel)}</Text>
                </TouchableOpacity>

                <View style={[s.row, { marginTop: 15 }]}>

                  {esVistaLimite ? (
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Hora Límite</Text>
                      <TouchableOpacity style={s.btnSelector} onPress={() => setShowTimePickerInicio(true)}>
                        <Ionicons name="time-outline" size={20} color={colors.success} style={{ marginRight: 8 }} />
                        <Text style={s.textoSelector}>{formatearHora(horaInicioSel)}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={s.label}>Hora Inicio</Text>
                        <TouchableOpacity style={s.btnSelector} onPress={() => setShowTimePickerInicio(true)}>
                          <Ionicons name="time-outline" size={20} color={colors.success} style={{ marginRight: 8 }} />
                          <Text style={s.textoSelector}>{formatearHora(horaInicioSel)}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.label}>Hora Fin</Text>
                        <TouchableOpacity style={s.btnSelector} onPress={() => setShowTimePickerFin(true)}>
                          <Ionicons name="time-outline" size={20} color={colors.warning} style={{ marginRight: 8 }} />
                          <Text style={s.textoSelector}>{formatearHora(horaFinSel)}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                </View>

                {showDatePicker && (
                  <DateTimePicker value={fechaSel} mode="date" display="default"
                    onChange={(e, date) => { setShowDatePicker(false); if (date) setFechaSel(date); }} />
                )}
                {showTimePickerInicio && (
                  <DateTimePicker value={horaInicioSel} mode="time" is24Hour={true} display="default"
                    onChange={(e, date) => { setShowTimePickerInicio(false); if (date) setHoraInicioSel(date); }} />
                )}
                {showTimePickerFin && (
                  <DateTimePicker value={horaFinSel} mode="time" is24Hour={true} display="default"
                    onChange={(e, date) => { setShowTimePickerFin(false); if (date) setHoraFinSel(date); }} />
                )}

                <TouchableOpacity style={s.btnGuardarFull} onPress={guardarEventoFinal}>
                  <Text style={s.btnGuardarTextoFull}>{eventoAEditarId ? 'Actualizar Evento' : 'Guardar Evento'}</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />

              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos Dinámicos (Integrando colores del tema)
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },

    filtrosContainer: { paddingHorizontal: 20, paddingTop: 5, gap: 10 },
    filtroPildora: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: isDark ? colors.background : colors.surface, borderWidth: 1, borderColor: colors.border },
    filtroActivo: { backgroundColor: colors.text, borderColor: colors.text },
    filtroTexto: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    filtroTextoActivo: { color: colors.background },

    tarjeta: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 15, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 5, elevation: isDark ? 0 : 2, borderWidth: 1, borderColor: colors.border },
    lineaColor: { width: 5, height: '100%', borderRadius: 4, marginRight: 15 },

    badgeTipo: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 6 },
    badgeTexto: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },

    tituloEvento: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
    fechaContainer: { flexDirection: 'row', alignItems: 'center' },
    fechaTexto: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

    accionesContainer: { flexDirection: 'row', gap: 8, marginLeft: 10 },
    btnAccion: { padding: 8, backgroundColor: isDark ? colors.surfaceElevated : '#f1f5f9', borderRadius: 8 },

    estadoVacio: { alignItems: 'center', marginTop: 60 },
    textoVacio: { color: colors.textSecondary, fontSize: 18, fontWeight: 'bold', marginTop: 10 },

    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: colors.warning, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: colors.warning, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },

    modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    modalTitulo: { fontSize: 22, fontWeight: 'bold', color: colors.text },

    pregunta: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },

    gridOpciones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cajaOpcion: { width: '48%', backgroundColor: isDark ? colors.background : '#f8fafc', padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    iconoCaja: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    textoCaja: { fontSize: 13, fontWeight: 'bold', color: colors.textSecondary, textAlign: 'center' },

    resumenTipoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
    resumenTipoTexto: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

    // Estilos del Toggle Button
    toggleContainer: { flexDirection: 'row', backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 8, padding: 4 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    toggleBtnActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 4, elevation: isDark ? 0 : 2 },
    toggleText: { fontWeight: 'bold', color: colors.textSecondary, fontSize: 13 },
    toggleTextActive: { color: colors.text },

    ramosSugeridosContainer: { flexDirection: 'row', marginBottom: 15, marginTop: 5 },
    ramoPildora: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, backgroundColor: isDark ? colors.background : colors.surface },
    ramoPildoraTexto: { fontSize: 13, fontWeight: 'bold' },

    label: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8 },
    input: { backgroundColor: isDark ? colors.background : '#f1f5f9', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },

    row: { flexDirection: 'row', gap: 10 },
    btnSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? colors.background : '#f1f5f9', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    textoSelector: { fontSize: 16, fontWeight: 'bold', color: colors.text },

    btnGuardarFull: { backgroundColor: colors.text, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 25 },
    btnGuardarTextoFull: { color: colors.background, fontSize: 16, fontWeight: 'bold' }
  });
}