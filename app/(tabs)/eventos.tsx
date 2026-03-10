import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EventosScreen() {
  // Lista inicial de eventos
  const [eventos, setEventos] = useState([
    { id: '1', titulo: 'Examen Final de Cálculo', fecha: '15 de Marzo', hora: '10:00', tipo: 'Examen', color: '#ef4444' },
    { id: '2', titulo: 'Entrega Ensayo de Historia', fecha: '18 de Marzo', hora: '23:59', tipo: 'Entrega', color: '#f59e0b' },
  ]);

  // Estados para el Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');

  // Función para guardar el evento
  const guardarEvento = () => {
    if (nuevoTitulo === '' || nuevaFecha === '') {
      Alert.alert('Error', 'Debes ingresar al menos el título y la fecha.');
      return;
    }

    const nuevoEvento = {
      id: Math.random().toString(),
      titulo: nuevoTitulo,
      fecha: nuevaFecha,
      hora: nuevaHora || 'Todo el día',
      tipo: 'Evento',
      color: '#1a73e8', // Color azul por defecto
    };

    // Agrega el nuevo evento a la lista ordenándolo al principio
    setEventos([nuevoEvento, ...eventos]);
    setModalVisible(false);
    
    // Limpia el formulario
    setNuevoTitulo(''); setNuevaFecha(''); setNuevaHora('');
  };

  // Función para eliminar un evento
  const eliminarEvento = (id) => {
    // Filtra la lista para dejar todos menos el que tenga el ID que queremos borrar
    const nuevaLista = eventos.filter((evento) => evento.id !== id);
    setEventos(nuevaLista);
  };

  return (
    <View style={styles.mainContainer}>
      
      <View style={styles.headerContainer}>
        <Text style={styles.tituloPrincipal}>Tus Eventos</Text>
        <Text style={styles.subtitulo}>Próximas evaluaciones y entregas</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {eventos.length === 0 ? (
          <View style={styles.estadoVacio}>
            <Ionicons name="flag-outline" size={48} color="#cbd5e1" />
            <Text style={styles.textoVacio}>No hay eventos próximos</Text>
          </View>
        ) : (
          eventos.map((evento) => (
            <View key={evento.id} style={styles.tarjeta}>
              <View style={[styles.lineaColor, { backgroundColor: evento.color }]} />
              
              <View style={styles.infoContainer}>
                <Text style={styles.tituloEvento}>{evento.titulo}</Text>
                <View style={styles.fechaContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  <Text style={styles.fechaTexto}>{evento.fecha} • {evento.hora}</Text>
                </View>
              </View>

              {/* Botón de eliminar (Basurero) */}
              <TouchableOpacity style={styles.btnEliminar} onPress={() => eliminarEvento(evento.id)}>
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTÓN FLOTANTE */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* MODAL PARA CREAR EVENTO */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Nuevo Evento</Text>

            <Text style={styles.label}>¿Qué evento es?</Text>
            <TextInput style={styles.input} placeholder="Ej. Prueba parcial de Física" value={nuevoTitulo} onChangeText={setNuevoTitulo} />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Fecha</Text>
                <TextInput style={styles.input} placeholder="Ej. 12 Abril" value={nuevaFecha} onChangeText={setNuevaFecha} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hora</Text>
                <TextInput style={styles.input} placeholder="15:30" value={nuevaHora} onChangeText={setNuevaHora} />
              </View>
            </View>

            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarEvento}>
                <Text style={styles.btnGuardarTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>

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
  subtitulo: { fontSize: 14, color: '#64748b', marginTop: 4 },
  container: { flex: 1, paddingHorizontal: 20 },
  
  // Tarjetas de evento
  tarjeta: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, marginBottom: 15, padding: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  lineaColor: { width: 4, height: '100%', borderRadius: 4, marginRight: 15 },
  infoContainer: { flex: 1 },
  tituloEvento: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 6 },
  fechaContainer: { flexDirection: 'row', alignItems: 'center' },
  fechaTexto: { fontSize: 14, color: '#64748b', marginLeft: 6 },
  btnEliminar: { padding: 10, backgroundColor: '#fef2f2', borderRadius: 10 },
  
  // Estado vacío
  estadoVacio: { alignItems: 'center', marginTop: 80 },
  textoVacio: { fontSize: 18, fontWeight: 'bold', color: '#94a3b8', marginTop: 15 },
  
  // Botón flotante
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#1a73e8', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#1a73e8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  
  // Estilos del modal (idénticos a los del horario para mantener consistencia)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 15, fontSize: 16, color: '#334155', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  btnCancelar: { padding: 15, borderRadius: 10, marginRight: 10 },
  btnCancelarTexto: { color: '#64748b', fontWeight: 'bold', fontSize: 16 },
  btnGuardar: { backgroundColor: '#1a73e8', padding: 15, borderRadius: 10, paddingHorizontal: 25 },
  btnGuardarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});