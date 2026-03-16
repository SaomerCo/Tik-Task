import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Encabezado from '../../components/Encabezado';
import { useAppContext } from '../../context/AppContext';
import { useTabContext } from '../../context/TabContext';
import { useTheme } from '../../context/ThemeContext';

export default function ApuntesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const { colors, isDark } = useTheme();
    const s = buildStyles(colors, isDark);
    const { setTabIndex } = useTabContext();

    const { ramosGlobales, apuntesGlobales, agregarApunte, actualizarApunte, eliminarApunte } = useAppContext();

    const [filtroActual, setFiltroActual] = useState<string>('todos');
    const [modalVisible, setModalVisible] = useState(false);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);

    const [notaEditandoId, setNotaEditandoId] = useState<string | null>(null);
    const [tituloNota, setTituloNota] = useState('');
    const [contenidoNota, setContenidoNota] = useState('');
    const [ramoVinculadoId, setRamoVinculadoId] = useState<string>('general');
    const [imagenesNota, setImagenesNota] = useState<string[]>([]);

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [audioURI, setAudioURI] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duracionGrabacion, setDuracionGrabacion] = useState(0);

    // =====================================================================
    // LÓGICA DE EXPORTAR E IMPORTAR APUNTES (.estudyl)
    // =====================================================================
    const exportarApunte = async (apunte: any) => {
        try {
            // 1. Convertimos las imágenes a Base64 (Texto)
            const imagenesBase64 = await Promise.all(
                (apunte.imagenes || []).map(async (imgUri: string) => {
                    return await FileSystem.readAsStringAsync(imgUri, { encoding: FileSystem.EncodingType.Base64 });
                })
            );

            // 2. Convertimos el audio a Base64 (Texto)
            let audioBase64 = null;
            if (apunte.audio) {
                audioBase64 = await FileSystem.readAsStringAsync(apunte.audio, { encoding: FileSystem.EncodingType.Base64 });
            }

            // 3. Empaquetamos todo en un objeto
            const paqueteExportacion = {
                tipo: 'ESTUDYL_APUNTE',
                version: '1.0',
                datos: {
                    titulo: apunte.titulo,
                    contenido: apunte.contenido,
                    fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                    imagenesBase64,
                    audioBase64
                }
            };

            // 4. Creamos un archivo temporal en el celular
            const nombreArchivo = (apunte.titulo || 'Apunte').replace(/[^a-zA-Z0-9]/g, '_');
            const fileUri = `${FileSystem.cacheDirectory}${nombreArchivo}.estudyl`;
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(paqueteExportacion));

            // 5. Abrimos el menú de compartir de Android (Bluetooth, Quick Share, etc.)
            const sePuedeCompartir = await Sharing.isAvailableAsync();
            if (sePuedeCompartir) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Compartir Apunte por Bluetooth o Quick Share'
                });
            } else {
                Alert.alert('Error', 'Compartir archivos no está disponible en este dispositivo.');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Hubo un problema al empaquetar el apunte.');
        }
    };

    const importarApunte = async () => {
        try {
            // 1. Abrimos el explorador de archivos del celular
            const resultado = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true
            });

            if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) return;

            const fileUri = resultado.assets[0].uri;

            // 2. Leemos el archivo
            const contenidoString = await FileSystem.readAsStringAsync(fileUri);
            const paquete = JSON.parse(contenidoString);

            // Verificamos que sea un archivo de Estudyl válido
            if (paquete.tipo !== 'ESTUDYL_APUNTE' || !paquete.datos) {
                Alert.alert('Archivo Inválido', 'Este archivo no es un apunte compatible con Estudyl.');
                return;
            }

            const { titulo, contenido, imagenesBase64, audioBase64 } = paquete.datos;

            // 3. Reconstruimos las imágenes
            const nuevasImagenesUris = [];
            for (let i = 0; i < (imagenesBase64 || []).length; i++) {
                const imgUri = `${FileSystem.documentDirectory}img_importada_${Date.now()}_${i}.jpg`;
                await FileSystem.writeAsStringAsync(imgUri, imagenesBase64[i], { encoding: FileSystem.EncodingType.Base64 });
                nuevasImagenesUris.push(imgUri);
            }

            // 4. Reconstruimos el audio
            let nuevoAudioUri = null;
            if (audioBase64) {
                nuevoAudioUri = `${FileSystem.documentDirectory}audio_importado_${Date.now()}.m4a`;
                await FileSystem.writeAsStringAsync(nuevoAudioUri, audioBase64, { encoding: FileSystem.EncodingType.Base64 });
            }

            // 5. Guardamos en la base de datos local
            agregarApunte({
                id: Math.random().toString(),
                titulo: `${titulo} (Importado)`,
                contenido: contenido,
                ramoId: 'general', // Lo guardamos en general por defecto
                fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                imagenes: nuevasImagenesUris,
                audio: nuevoAudioUri
            });

            Alert.alert('¡Éxito!', 'Apunte importado correctamente. Lo encontrarás en la categoría Generales.');

        } catch (error) {
            console.error(error);
            Alert.alert('Error al Importar', 'Asegúrate de haber seleccionado un archivo .estudyl válido.');
        }
    };
    // =====================================================================

    useEffect(() => {
        let intervalo: any;
        if (recording) {
            intervalo = setInterval(() => {
                setDuracionGrabacion((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalo);
        }
        return () => clearInterval(intervalo);
    }, [recording]);

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    useEffect(() => {
        if (params && params.ramoIdFiltro) {
            const ramoExiste = ramosGlobales.some((r: any) => r.id === params.ramoIdFiltro);
            if (ramoExiste) {
                setFiltroActual(params.ramoIdFiltro as string);
            }
        }
    }, [params.ramoIdFiltro, ramosGlobales]);

    const apuntesFiltrados = apuntesGlobales.filter((apunte: any) => {
        if (filtroActual === 'todos') return true;
        return apunte.ramoId === filtroActual;
    });

    const abrirModalNuevo = () => {
        setNotaEditandoId(null);
        setTituloNota('');
        setContenidoNota('');
        setImagenesNota([]);
        setAudioURI(null); 
        setDuracionGrabacion(0);
        setRamoVinculadoId(filtroActual !== 'todos' ? filtroActual : 'general');
        setMostrarDropdown(false);
        setModalVisible(true);
    };

    const abrirModalEdicion = (apunte: any) => {
        setNotaEditandoId(apunte.id);
        setTituloNota(apunte.titulo);
        setContenidoNota(apunte.contenido);
        setRamoVinculadoId(apunte.ramoId);
        setImagenesNota(apunte.imagenes || []);
        setAudioURI(apunte.audio || null); 
        setDuracionGrabacion(0);
        setMostrarDropdown(false);
        setModalVisible(true);
    };

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
                const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
                setRecording(recording);
                setDuracionGrabacion(0);
            } else {
                Alert.alert('Permiso denegado', 'Por favor otorga permisos de micrófono para grabar notas de voz.');
            }
        } catch (err) {
            console.error('Error iniciando la grabación', err);
        }
    }

    async function stopRecording() {
        try {
            setRecording(null);
            if (recording) {
                await recording.stopAndUnloadAsync();
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
                const uri = recording.getURI();
                setAudioURI(uri);
            }
        } catch (error) {
            console.error('Error deteniendo la grabación', error);
        }
    }

    async function reproducirAudio() {
        if (!audioURI) return;
        try {
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioURI });
            setSound(newSound);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
            });
            setIsPlaying(true);
            await newSound.playAsync();
        } catch (error) {
            console.error('Error al reproducir el audio', error);
        }
    }

    async function pausarAudio() {
        if (sound) {
            await sound.pauseAsync();
            setIsPlaying(false);
        }
    }

    const eliminarAudio = () => {
        if (sound) { sound.unloadAsync(); setSound(null); }
        setAudioURI(null); setIsPlaying(false);
    };

    const formatearTiempo = (segundos: number) => {
        const min = Math.floor(segundos / 60);
        const sec = segundos % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const tomarFoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.');
        let result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.7 });
        if (!result.canceled) setImagenesNota([...imagenesNota, result.assets[0].uri]);
    };

    const elegirDeGaleria = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería.');
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.7 });
        if (!result.canceled) setImagenesNota([...imagenesNota, result.assets[0].uri]);
    };

    const eliminarImagen = (indexAEliminar: number) => setImagenesNota(imagenesNota.filter((_, index) => index !== indexAEliminar));

    const guardarApunte = () => {
        if (!tituloNota.trim() && !contenidoNota.trim() && imagenesNota.length === 0 && !audioURI) {
            return Alert.alert('Error', 'La nota debe tener al menos un título, texto, foto o audio.');
        }

        const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

        const datosApunte = {
            titulo: tituloNota.trim() || 'Apunte sin título',
            contenido: contenidoNota.trim(),
            ramoId: ramoVinculadoId,
            fecha: fechaHoy,
            imagenes: imagenesNota,
            audio: audioURI 
        };

        if (notaEditandoId) {
            actualizarApunte(notaEditandoId, datosApunte);
        } else {
            agregarApunte({ id: Math.random().toString(), ...datosApunte });
        }
        setModalVisible(false);
    };

    const confirmarEliminacion = (id: string) => {
        Alert.alert('Eliminar Apunte', '¿Seguro que deseas borrar esta nota, sus fotos y audios?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => eliminarApunte(id) }
        ]);
    };

    const obtenerInfoRamo = (rId: string) => {
        if (rId === 'general') return { nombre: 'General', color: colors.textSecondary };
        const ramo = ramosGlobales.find((r: any) => r.id === rId);
        return ramo ? { nombre: ramo.nombre, color: ramo.colorHex } : { nombre: 'Desconocido', color: colors.textSecondary };
    };

    return (
        <View style={s.mainContainer}>

            <Encabezado
                label="BIBLIOTECA"
                titulo="Apuntes"
                subtitulo="Ideas y resúmenes"
                icono="document-text"
                colorActivo={colors.danger}
            />

            {/* BOTONES SUPERIORES (FILTROS E IMPORTAR) */}
            <View style={s.barraSuperiorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtrosContainer}>
                    <TouchableOpacity style={[s.filtroPildora, filtroActual === 'todos' && s.filtroActivo]} onPress={() => setFiltroActual('todos')}>
                        <Text style={[s.filtroTexto, filtroActual === 'todos' && s.filtroTextoActivo]}>Todas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.filtroPildora, filtroActual === 'general' && s.filtroActivo]} onPress={() => setFiltroActual('general')}>
                        <Text style={[s.filtroTexto, filtroActual === 'general' && s.filtroTextoActivo]}>Generales</Text>
                    </TouchableOpacity>
                    {ramosGlobales.map((ramo: any) => (
                        <TouchableOpacity key={ramo.id} style={[s.filtroPildora, filtroActual === ramo.id && { backgroundColor: ramo.colorHex, borderColor: ramo.colorHex }]} onPress={() => setFiltroActual(ramo.id)}>
                            <Text style={[s.filtroTexto, filtroActual === ramo.id && { color: 'white' }]}>{ramo.nombre}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* BOTÓN DE IMPORTAR APUNTE */}
                <TouchableOpacity style={[s.btnImportar, { backgroundColor: isDark ? colors.surfaceElevated : '#f1f5f9' }]} onPress={importarApunte}>
                    <Ionicons name="download-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={s.container} showsVerticalScrollIndicator={false} removeClippedSubviews={false}>
                {apuntesFiltrados.length === 0 ? (
                    <View style={s.estadoVacio}>
                        <View style={s.iconoFondoVacio}><Ionicons name="document-text-outline" size={48} color={colors.textSecondary} /></View>
                        <Text style={s.textoVacio}>No hay apuntes aquí</Text>
                        <Text style={s.subtextoVacio}>Toca el botón + para crear una nota. También puedes importar apuntes de tus amigos.</Text>
                    </View>
                ) : (
                    <View style={s.gridNotas}>
                        {apuntesFiltrados.map((apunte: any) => {
                            const infoRamo = obtenerInfoRamo(apunte.ramoId);
                            const tieneFotos = apunte.imagenes && apunte.imagenes.length > 0;
                            const tieneAudio = !!apunte.audio;

                            return (
                                <TouchableOpacity key={apunte.id} style={s.tarjetaNota} onPress={() => abrirModalEdicion(apunte)} activeOpacity={0.7}>
                                    <View style={s.tarjetaHeader}>
                                        <View style={[s.badgeRamo, { backgroundColor: isDark ? infoRamo.color + '30' : infoRamo.color + '15' }]}>
                                            <Text style={[s.badgeRamoTexto, { color: isDark ? 'white' : infoRamo.color }]} numberOfLines={1}>{infoRamo.nombre}</Text>
                                        </View>
                                        
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            {/* BOTÓN DE COMPARTIR */}
                                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); exportarApunte(apunte); }} style={{ padding: 2 }}>
                                                <Ionicons name="share-outline" size={18} color={colors.primary} />
                                            </TouchableOpacity>
                                            {/* BOTÓN DE BORRAR */}
                                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); confirmarEliminacion(apunte.id); }} style={{ padding: 2 }}>
                                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <Text style={s.tituloNotaTarjeta} numberOfLines={2}>{apunte.titulo}</Text>
                                    {apunte.contenido ? <Text style={s.contenidoNotaTarjeta} numberOfLines={3}>{apunte.contenido}</Text> : null}

                                    {tieneFotos && (
                                        <View style={s.imagenPreviewContainer}>
                                            <Image source={{ uri: apunte.imagenes[0] }} style={s.imagenPreview} />
                                            {apunte.imagenes.length > 1 && (
                                                <View style={s.imagenOverlay}>
                                                    <Text style={s.imagenOverlayText}>+{apunte.imagenes.length - 1}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {tieneAudio && (
                                        <View style={s.audioPreviewContainer}>
                                            <Ionicons name="mic" size={12} color={colors.primary} />
                                            <Text style={[s.audioPreviewText, { color: colors.primary }]}>Nota de voz</Text>
                                        </View>
                                    )}

                                    <View style={s.footerTarjeta}>
                                        <Text style={s.fechaNotaTarjeta}>{apunte.fecha}</Text>
                                        <View style={{ flexDirection: 'row', gap: 5 }}>
                                            {tieneFotos && <Ionicons name="images" size={14} color={colors.textSecondary} />}
                                            {tieneAudio && <Ionicons name="volume-medium" size={14} color={colors.textSecondary} />}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <TouchableOpacity style={s.fab} onPress={abrirModalNuevo}>
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* MODAL EDITAR/NUEVO APUNTE */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeaderRow}>
                            <Text style={s.modalTitulo}>{notaEditandoId ? 'Editar Apunte' : 'Nuevo Apunte'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={s.label}>Vincular a:</Text>
                            <TouchableOpacity style={s.dropdownButton} onPress={() => setMostrarDropdown(!mostrarDropdown)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[s.colorDot, { backgroundColor: obtenerInfoRamo(ramoVinculadoId).color }]} />
                                    <Text style={s.dropdownButtonText}>{obtenerInfoRamo(ramoVinculadoId).nombre}</Text>
                                </View>
                                <Ionicons name={mostrarDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {mostrarDropdown && (
                                <View style={s.dropdownListContainer}>
                                    <TouchableOpacity style={s.dropdownItem} onPress={() => { setRamoVinculadoId('general'); setMostrarDropdown(false); }}>
                                        <View style={[s.colorDot, { backgroundColor: colors.textSecondary }]} />
                                        <Text style={s.dropdownItemText}>General (Sin ramo)</Text>
                                    </TouchableOpacity>
                                    {ramosGlobales.map((ramo: any) => (
                                        <TouchableOpacity key={ramo.id} style={s.dropdownItem} onPress={() => { setRamoVinculadoId(ramo.id); setMostrarDropdown(false); }}>
                                            <View style={[s.colorDot, { backgroundColor: ramo.colorHex }]} />
                                            <Text style={s.dropdownItemText}>{ramo.nombre}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={{ marginTop: 15 }}>
                                <TextInput
                                    style={s.inputTituloGordo}
                                    placeholder="Título de la nota..."
                                    value={tituloNota}
                                    onChangeText={setTituloNota}
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <TextInput
                                    style={s.inputContenidoArea}
                                    placeholder="Escribe tus apuntes, ideas o tareas aquí..."
                                    value={contenidoNota}
                                    onChangeText={setContenidoNota}
                                    multiline={true}
                                    textAlignVertical="top"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {imagenesNota.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.galeriaContainer}>
                                    {imagenesNota.map((uri, index) => (
                                        <View key={index} style={s.imagenWrapper}>
                                            <Image source={{ uri }} style={s.imagenMiniatura} />
                                            <TouchableOpacity style={s.btnEliminarImagen} onPress={() => eliminarImagen(index)}>
                                                <Ionicons name="close" size={16} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            {audioURI && !recording && (
                                <View style={s.audioPlayerContainer}>
                                    <TouchableOpacity onPress={isPlaying ? pausarAudio : reproducirAudio} style={s.playButton}>
                                        <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="white" />
                                    </TouchableOpacity>
                                    <Text style={s.audioText}>Nota de voz grabada</Text>
                                    <TouchableOpacity onPress={eliminarAudio} style={s.deleteAudioButton}>
                                        <Ionicons name="trash" size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {recording && (
                                <View style={s.recordingContainer}>
                                    <View style={s.recordingDot} />
                                    <Text style={s.recordingText}>Grabando... {formatearTiempo(duracionGrabacion)}</Text>
                                </View>
                            )}

                            <View style={s.adjuntarContainer}>
                                <TouchableOpacity style={s.btnAdjuntar} onPress={tomarFoto}>
                                    <Ionicons name="camera" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={s.btnAdjuntar} onPress={elegirDeGaleria}>
                                    <Ionicons name="image" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.btnAdjuntar, recording ? s.btnGrabandoActivo : null]} onPress={recording ? stopRecording : startRecording}>
                                    <Ionicons name={recording ? "stop" : "mic"} size={20} color={recording ? "white" : colors.danger} />
                                    {recording && <Text style={{color: 'white', fontWeight: 'bold', marginLeft: 5}}>Parar</Text>}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={s.btnGuardarFull} onPress={guardarApunte}>
                                <Text style={s.btnGuardarTextoFull}>Guardar Apunte</Text>
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos Dinámicos
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        mainContainer: { flex: 1, backgroundColor: colors.background },

        barraSuperiorContainer: { flexDirection: 'row', alignItems: 'center', paddingRight: 20, paddingBottom: 10 },
        filtrosContainer: { paddingHorizontal: 20, paddingTop: 15, gap: 10 },
        filtroPildora: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: isDark ? colors.background : colors.surface, borderWidth: 1, borderColor: colors.border },
        filtroActivo: { backgroundColor: colors.text, borderColor: colors.text },
        filtroTexto: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
        filtroTextoActivo: { color: colors.background },

        btnImportar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 15, marginLeft: 10, borderWidth: 1, borderColor: colors.border },

        container: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
        gridNotas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
        tarjetaNota: { width: '48%', backgroundColor: colors.surface, borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.03, shadowRadius: 5, elevation: isDark ? 0 : 2 },
        tarjetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
        badgeRamo: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: '55%' },
        badgeRamoTexto: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
        tituloNotaTarjeta: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
        contenidoNotaTarjeta: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 10 },

        imagenPreviewContainer: { marginTop: 5, marginBottom: 10, borderRadius: 8, overflow: 'hidden', height: 80 },
        imagenPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
        imagenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
        imagenOverlayText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
        
        audioPreviewContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.primary+'20' : colors.primaryLight, padding: 6, borderRadius: 6, marginBottom: 10 },
        audioPreviewText: { fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

        footerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 5 },
        fechaNotaTarjeta: { fontSize: 11, color: colors.textTertiary },

        estadoVacio: { alignItems: 'center', marginTop: 80 },
        iconoFondoVacio: { width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
        textoVacio: { fontSize: 20, fontWeight: 'bold', color: colors.textSecondary },
        subtextoVacio: { fontSize: 14, color: colors.textTertiary, marginTop: 5, textAlign: 'center', paddingHorizontal: 40 },

        fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: colors.danger, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },

        modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, height: '85%' },
        modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
        modalTitulo: { fontSize: 22, fontWeight: 'bold', color: colors.text },

        label: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8 },
        dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
        dropdownButtonText: { fontSize: 15, color: colors.text, fontWeight: '600' },
        colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
        dropdownListContainer: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginTop: 5, maxHeight: 150, overflow: 'hidden' },
        dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
        dropdownItemText: { fontSize: 15, color: colors.text },

        inputTituloGordo: { fontSize: 22, fontWeight: 'bold', color: colors.text, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 15 },
        inputContenidoArea: { fontSize: 16, color: colors.text, lineHeight: 24, minHeight: 80, marginBottom: 15 },

        adjuntarContainer: { flexDirection: 'row', gap: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 },
        btnAdjuntar: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.background : '#f8fafc', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flex: 1, justifyContent: 'center' },
        btnGrabandoActivo: { backgroundColor: colors.danger, borderColor: colors.danger },

        galeriaContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 10 },
        imagenWrapper: { width: 80, height: 80, marginRight: 10, borderRadius: 10, overflow: 'hidden' },
        imagenMiniatura: { width: '100%', height: '100%', resizeMode: 'cover' },
        btnEliminarImagen: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },

        audioPlayerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.background : '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
        playButton: { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
        audioText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },
        deleteAudioButton: { padding: 8 },

        recordingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger + '20', padding: 12, borderRadius: 12, marginBottom: 15 },
        recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, marginRight: 10 },
        recordingText: { color: colors.danger, fontWeight: 'bold', fontSize: 15 },

        btnGuardarFull: { backgroundColor: colors.text, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 25 },
        btnGuardarTextoFull: { color: colors.background, fontSize: 16, fontWeight: 'bold' }
    });
}