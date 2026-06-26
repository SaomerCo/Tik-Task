import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface BienvenidaProps {
    onCompletado: (nombre: string) => void;
}

export default function Bienvenida({ onCompletado }: BienvenidaProps) {
    const [visible, setVisible] = useState(false);
    const [nombre, setNombre] = useState('');
    const [edad, setEdad] = useState(18); // Edad por defecto en la barra

    useEffect(() => {
        const verificarPrimerIngreso = async () => {
            try {
                const yaIngreso = await AsyncStorage.getItem('app_inicializada');
                const nombreGuardado = await AsyncStorage.getItem('nombreUsuario');

                if (!yaIngreso) {
                    // Si no hay registro, mostramos el modal
                    setVisible(true);
                } else if (nombreGuardado) {
                    // Si ya ingresó antes, pasamos el nombre a la pantalla de inicio silenciosamente
                    onCompletado(nombreGuardado);
                }
            } catch (error) {
                console.error('Error leyendo AsyncStorage', error);
            }
        };
        verificarPrimerIngreso();
    }, []);

    const guardarDatos = async () => {
        if (!nombre.trim()) return; // No dejar avanzar si no hay nombre

        try {
            await AsyncStorage.setItem('app_inicializada', 'true');
            await AsyncStorage.setItem('nombreUsuario', nombre.trim());
            await AsyncStorage.setItem('edadUsuario', edad.toString());

            setVisible(false);
            onCompletado(nombre.trim());
        } catch (error) {
            console.error('Error guardando datos', error);
        }
    };

    if (!visible) return null;

    return (
        <Modal animationType="slide" transparent={true} visible={visible}>
            <View style={styles.overlay}>
                <View style={styles.cajaModo}>
                    <View style={styles.iconoContainer}>
                        <Ionicons name="rocket" size={40} color="#1a73e8" />
                    </View>

                    <Text style={styles.titulo}>¡Te damos la bienvenida!</Text>
                    <Text style={styles.subtitulo}>Personalicemos tu experiencia de estudio.</Text>

                    <Text style={styles.label}>¿Cómo te llamas?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Felipe..."
                        value={nombre}
                        onChangeText={setNombre}
                    />

                    <View style={styles.sliderHeader}>
                        <Text style={styles.label}>¿Cuántos años tienes?</Text>
                        <Text style={styles.edadBadge}>{edad} años</Text>
                    </View>

                    <Slider
                        style={styles.slider}
                        minimumValue={10}
                        maximumValue={80}
                        step={1}
                        value={edad}
                        onValueChange={setEdad}
                        minimumTrackTintColor="#1a73e8"
                        maximumTrackTintColor="#cbd5e1"
                        thumbTintColor="#1a73e8"
                    />
                    <View style={styles.sliderLimits}>
                        <Text style={styles.limitText}>10</Text>
                        <Text style={styles.limitText}>80</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.boton, !nombre.trim() && styles.botonDesactivado]}
                        onPress={guardarDatos}
                        disabled={!nombre.trim()}
                    >
                        <Text style={styles.textoBoton}>Comenzar a estudiar</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    cajaModo: { backgroundColor: 'red', width: '100%', borderRadius: 24, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    iconoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    titulo: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 5 },
    subtitulo: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 25 },

    label: { alignSelf: 'flex-start', fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
    input: { width: '100%', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#334155', marginBottom: 25, borderWidth: 1, borderColor: '#e2e8f0' },

    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
    edadBadge: { backgroundColor: '#eff6ff', color: '#1a73e8', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold', overflow: 'hidden' },
    slider: { width: '100%', height: 40, marginTop: 10 },
    sliderLimits: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10, marginBottom: 30 },
    limitText: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold' },

    boton: { flexDirection: 'row', backgroundColor: '#1a73e8', width: '100%', paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 10 },
    botonDesactivado: { backgroundColor: '#94a3b8' },
    textoBoton: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});