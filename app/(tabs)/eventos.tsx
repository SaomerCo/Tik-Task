import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

const TIPOS_EVENTO = [
  { id: 'evaluacion', label: 'Evaluación próxima', icon: 'school', color: '#ef4444' },
  { id: 'cancelada', label: 'Clase cancelada', icon: 'close-circle', color: '#64748b' },
  { id: 'cambio', label: 'Cambio de clase', icon: 'swap-horizontal', color: '#1a73e8' },
  { id: 'personalizado', label: 'Evento a medida', icon: 'calendar', color: '#f59e0b' },
];

export default function EventosScreen() {
  const { eventosGlobales, eliminarEvento, ramosGlobales, agregarEvento } = useAppContext();
  const router = useRouter();

  // Estados del flujo (Paso 1, 2, 3...)
  const [modalVisible, setModalVisible] = useState(false);
  const [paso, setPaso] = useState(1);

  // Datos temporales del nuevo evento
  const [tipoSel, setTipoSel] = useState<any>(null);
  const [ramoSel, setRamoSel] = useState<any>(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [sala, setSala] = useState('');

  const resetModal = () => {
    setPaso(1);
    setTipoSel(null);
    setRamoSel(null);
    setFecha('');
    setHora('');
    setSala('');
    setModalVisible(false);
  };

  const manejarSeleccionTipo = (tipo: any) => {
    setTipoSel(tipo);
    setPaso(2);
  };

  const manejarSeleccionRamo = (ramo: any) => {
    setRamoSel(ramo);
    setPaso(3);
  };

  const manejarRespuestaHorario = (esEnHorario: boolean) => {
    if (esEnHorario) {
      setPaso(4); // Pedir solo fecha para ir al horario
    } else {
      setPaso(5); // Pedir fecha, hora y sala
    }
  };

  const irASeleccionarEnHorario = () => {
    if (!fecha) return Alert.alert("Falta fecha", "Por favor ingresa la fecha de la prueba.");

    setModalVisible(false);
    // Navegamos al horario pasando los datos por URL (search params)
    router.push({
      pathname: '/horario',
      params: {
        modoSeleccion: 'true',
        ramoId: ramoSel.id,
        tipoEvento: tipoSel.label,
        fechaEvento: fecha
      }
    });
    resetModal();
  };

  const guardarEventoManual = () => {
    if (!fecha || !hora) return Alert.alert("Faltan datos", "Fecha y hora son obligatorias.");

    agregarEvento({
      id: Math.random().toString(),
      titulo: `${tipoSel.label}: ${ramoSel.nombre}`,
      tipo: tipoSel.label,
      ramoId: ramoSel.id,
      fecha,
      hora,
      sala,
      color: tipoSel.color,
      icono: tipoSel.icon,
      temporal: true // Para que el horario sepa que debe pintarlo en rojo fuerte
    });
    resetModal();
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.tituloPrincipal}>Tus Eventos</Text>
        <Text style={styles.subtitulo}>Gestión de evaluaciones y alertas</Text>
      </View>

      <ScrollView style={styles.container}>
        {eventosGlobales.length === 0 ? (
          <View style={styles.estadoVacio}>
            <Ionicons name="calendar-outline" size={60} color="#cbd5e1" />
            <Text style={styles.textoVacio}>No hay eventos registrados</Text>
          </View>
        ) : (
          eventosGlobales.map((ev: any) => (
            <View key={ev.id} style={styles.tarjeta}>
              <View style={[styles.lineaColor, { backgroundColor: ev.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.badgeTexto, { color: ev.color }]}>{ev.tipo}</Text>
                <Text style={styles.tituloEvento}>{ev.titulo}</Text>
                <Text style={styles.fechaTexto}>{ev.fecha} • {ev.hora} {ev.sala ? `• Sala ${ev.sala}` : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => eliminarEvento(ev.id)}>
                <Ionicons name="trash-outline" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setModalVisible(true); setPaso(1); }}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nuevo Registro</Text>
              <TouchableOpacity onPress={resetModal}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>

            {/* PASO 1: TIPO */}
            {paso === 1 && (
              <View style={styles.gridOpciones}>
                {TIPOS_EVENTO.map(t => (
                  <TouchableOpacity key={t.id} style={styles.cajaOpcion} onPress={() => manejarSeleccionTipo(t)}>
                    <View style={[styles.iconoCaja, { backgroundColor: t.color }]}><Ionicons name={t.icon as any} size={24} color="white" /></View>
                    <Text style={styles.textoCaja}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* PASO 2: RAMO */}
            {paso === 2 && (
              <View>
                <Text style={styles.pregunta}>¿De qué ramo es la prueba?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRamos}>
                  {ramosGlobales.map((r: any) => (
                    <TouchableOpacity key={r.id} style={[styles.ramoCard, { borderColor: r.colorHex }]} onPress={() => manejarSeleccionRamo(r)}>
                      <Text style={{ color: r.colorHex, fontWeight: 'bold' }}>{r.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* PASO 3: ¿EN HORARIO? */}
            {paso === 3 && (
              <View>
                <Text style={styles.pregunta}>¿La prueba será en horario de clases?</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.btnSi} onPress={() => manejarRespuestaHorario(true)}>
                    <Text style={styles.btnTexto}>SÍ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnNo} onPress={() => manejarRespuestaHorario(false)}>
                    <Text style={styles.btnTexto}>NO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* PASO 4: FECHA (PARA MODO SELECCIÓN HORARIO) */}
            {paso === 4 && (
              <View>
                <Text style={styles.pregunta}>Indica la fecha de la prueba</Text>
                <TextInput style={styles.input} placeholder="Ej: 20 de Octubre" value={fecha} onChangeText={setFecha} />
                <TouchableOpacity style={styles.btnSiguiente} onPress={irASeleccionarEnHorario}>
                  <Text style={styles.btnTexto}>Ir al Horario para marcar bloque</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PASO 5: DATOS MANUALES (FUERA DE HORARIO) */}
            {paso === 5 && (
              <View>
                <Text style={styles.pregunta}>Completa los detalles</Text>
                <TextInput style={styles.input} placeholder="Fecha (Ej: 20 de Octubre)" value={fecha} onChangeText={setFecha} />
                <TextInput style={styles.input} placeholder="Hora (Ej: 18:30)" value={hora} onChangeText={setHora} />
                <TextInput style={styles.input} placeholder="Sala (Opcional)" value={sala} onChangeText={setSala} />
                <TouchableOpacity style={styles.btnSiguiente} onPress={guardarEventoManual}>
                  <Text style={styles.btnTexto}>Finalizar Registro</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  tituloPrincipal: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { fontSize: 14, color: '#64748b' },
  container: { flex: 1, paddingHorizontal: 20 },
  tarjeta: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 12, alignItems: 'center', elevation: 2 },
  lineaColor: { width: 4, height: '80%', borderRadius: 2, marginRight: 15 },
  badgeTexto: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  tituloEvento: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  fechaTexto: { fontSize: 13, color: '#64748b' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#f59e0b', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold' },
  gridOpciones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cajaOpcion: { width: '48%', backgroundColor: '#f1f5f9', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 12 },
  iconoCaja: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  textoCaja: { fontSize: 12, fontWeight: 'bold', color: '#475569', textAlign: 'center' },
  pregunta: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 15 },
  scrollRamos: { flexDirection: 'row', marginBottom: 10 },
  ramoCard: { padding: 12, borderWidth: 2, borderRadius: 12, marginRight: 10, backgroundColor: 'white' },
  row: { flexDirection: 'row', gap: 10 },
  btnSi: { flex: 1, backgroundColor: '#10b981', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnNo: { flex: 1, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnTexto: { color: 'white', fontWeight: 'bold' },
  input: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, marginBottom: 10 },
  btnSiguiente: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  estadoVacio: { alignItems: 'center', marginTop: 100 },
  textoVacio: { color: '#94a3b8', marginTop: 10 }
});