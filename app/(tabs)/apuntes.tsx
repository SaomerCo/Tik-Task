import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

export default function ApuntesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const { ramosGlobales, apuntesGlobales, agregarApunte, actualizarApunte, eliminarApunte } = useAppContext();

    const [filtroActual, setFiltroActual] = useState<string>('todos');
    const [modalVisible, setModalVisible] = useState(false);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);

    const [notaEditandoId, setNotaEditandoId] = useState<string | null>(null);
    const [tituloNota, setTituloNota] = useState('');
    const [contenidoNota, setContenidoNota] = useState('');
    const [ramoVinculadoId, setRamoVinculadoId] = useState<string>('general');
    const [imagenesNota, setImagenesNota] = useState<string[]>([]);

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
        setMostrarDropdown(false);
        setModalVisible(true);
    };

    const tomarFoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar fotos.');
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImagenesNota([...imagenesNota, result.assets[0].uri]);
        }
    };

    const elegirDeGaleria = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería de fotos.');
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImagenesNota([...imagenesNota, result.assets[0].uri]);
        }
    };

    const eliminarImagen = (indexAEliminar: number) => {
        setImagenesNota(imagenesNota.filter((_, index) => index !== indexAEliminar));
    };

    const guardarApunte = () => {
        if (!tituloNota.trim() && !contenidoNota.trim() && imagenesNota.length === 0) {
            return Alert.alert('Error', 'La nota debe tener al menos un título, texto o una foto.');
        }

        const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

        const datosApunte = {
            titulo: tituloNota.trim() || 'Apunte sin título',
            contenido: contenidoNota.trim(),
            ramoId: ramoVinculadoId,
            fecha: fechaHoy,
            imagenes: imagenesNota
        };

        if (notaEditandoId) {
            actualizarApunte(notaEditandoId, datosApunte);
        } else {
            agregarApunte({ id: Math.random().toString(), ...datosApunte });
        }
        setModalVisible(false);
    };

    const confirmarEliminacion = (id: string) => {
        Alert.alert('Eliminar Apunte', '¿Seguro que deseas borrar esta nota y sus fotos?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => eliminarApunte(id) }
        ]);
    };

    const obtenerInfoRamo = (rId: string) => {
        if (rId === 'general') return { nombre: 'General', color: '#64748b' };
        const ramo = ramosGlobales.find((r: any) => r.id === rId);
        return ramo ? { nombre: ramo.nombre, color: ramo.colorHex } : { nombre: 'Desconocido', color: '#94a3b8' };
    };

    const irAEventos = () => {
        setModalVisible(false);
        router.push('/eventos');
    };

    return (
        <View style={styles.mainContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.tituloPrincipal}>Tus Apuntes</Text>
                <Text style={styles.subtitulo}>{apuntesGlobales.length} notas guardadas</Text>
            </View>

            <View style={{ paddingBottom: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosContainer}>
                    <TouchableOpacity style={[styles.filtroPildora, filtroActual === 'todos' && styles.filtroActivo]} onPress={() => setFiltroActual('todos')}>
                        <Text style={[styles.filtroTexto, filtroActual === 'todos' && styles.filtroTextoActivo]}>Todas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filtroPildora, filtroActual === 'general' && styles.filtroActivo]} onPress={() => setFiltroActual('general')}>
                        <Text style={[styles.filtroTexto, filtroActual === 'general' && styles.filtroTextoActivo]}>Generales</Text>
                    </TouchableOpacity>

                    {ramosGlobales.map((ramo: any) => (
                        <TouchableOpacity
                            key={ramo.id}
                            style={[styles.filtroPildora, filtroActual === ramo.id && { backgroundColor: ramo.colorHex, borderColor: ramo.colorHex }]}
                            onPress={() => setFiltroActual(ramo.id)}
                        >
                            <Text style={[styles.filtroTexto, filtroActual === ramo.id && { color: 'white' }]}>{ramo.nombre}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {apuntesFiltrados.length === 0 ? (
                    <View style={styles.estadoVacio}>
                        <View style={styles.iconoFondoVacio}><Ionicons name="document-text-outline" size={48} color="#94a3b8" /></View>
                        <Text style={styles.textoVacio}>No hay apuntes aquí</Text>
                        <Text style={styles.subtextoVacio}>Toca el botón + para crear una nota o tomar una foto de la pizarra.</Text>
                    </View>
                ) : (
                    <View style={styles.gridNotas}>
                        {apuntesFiltrados.map((apunte: any) => {
                            const infoRamo = obtenerInfoRamo(apunte.ramoId);
                            const tieneFotos = apunte.imagenes && apunte.imagenes.length > 0;

                            return (
                                <TouchableOpacity key={apunte.id} style={styles.tarjetaNota} onPress={() => abrirModalEdicion(apunte)} activeOpacity={0.7}>
                                    <View style={styles.tarjetaHeader}>
                                        <View style={[styles.badgeRamo, { backgroundColor: infoRamo.color + '15' }]}>
                                            <Text style={[styles.badgeRamoTexto, { color: infoRamo.color }]} numberOfLines={1}>{infoRamo.nombre}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => confirmarEliminacion(apunte.id)} style={{ padding: 2 }}>
                                            <Ionicons name="trash-outline" size={16} color="#cbd5e1" />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.tituloNotaTarjeta} numberOfLines={2}>{apunte.titulo}</Text>
                                    {apunte.contenido ? <Text style={styles.contenidoNotaTarjeta} numberOfLines={3}>{apunte.contenido}</Text> : null}

                                    {tieneFotos && (
                                        <View style={styles.imagenPreviewContainer}>
                                            <Image source={{ uri: apunte.imagenes[0] }} style={styles.imagenPreview} />
                                            {apunte.imagenes.length > 1 && (
                                                <View style={styles.imagenOverlay}>
                                                    <Text style={styles.imagenOverlayText}>+{apunte.imagenes.length - 1}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    <View style={styles.footerTarjeta}>
                                        <Text style={styles.fechaNotaTarjeta}>{apunte.fecha}</Text>
                                        {tieneFotos && <Ionicons name="images" size={14} color="#94a3b8" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={abrirModalNuevo}>
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitulo}>{notaEditandoId ? 'Editar Apunte' : 'Nuevo Apunte'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>

                            {!notaEditandoId && (
                                <View style={styles.bannerSugerencia}>
                                    <Ionicons name="bulb-outline" size={20} color="#1e40af" style={{ marginRight: 10, marginTop: 2 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.textoBannerSugerencia}>
                                            ¿Es una prueba, entrega de proyecto o cancelación de clase?
                                        </Text>
                                        <TouchableOpacity onPress={irAEventos} style={{ marginTop: 4 }}>
                                            <Text style={styles.linkBannerSugerencia}>Mejor crea un Evento aquí &rarr;</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.label}>Vincular a:</Text>
                            <TouchableOpacity style={styles.dropdownButton} onPress={() => setMostrarDropdown(!mostrarDropdown)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.colorDot, { backgroundColor: obtenerInfoRamo(ramoVinculadoId).color }]} />
                                    <Text style={styles.dropdownButtonText}>{obtenerInfoRamo(ramoVinculadoId).nombre}</Text>
                                </View>
                                <Ionicons name={mostrarDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                            </TouchableOpacity>

                            {mostrarDropdown && (
                                <View style={styles.dropdownListContainer}>
                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => { setRamoVinculadoId('general'); setMostrarDropdown(false); }}>
                                        <View style={[styles.colorDot, { backgroundColor: '#64748b' }]} />
                                        <Text style={styles.dropdownItemText}>General (Sin ramo)</Text>
                                    </TouchableOpacity>
                                    {ramosGlobales.map((ramo: any) => (
                                        <TouchableOpacity key={ramo.id} style={styles.dropdownItem} onPress={() => { setRamoVinculadoId(ramo.id); setMostrarDropdown(false); }}>
                                            <View style={[styles.colorDot, { backgroundColor: ramo.colorHex }]} />
                                            <Text style={styles.dropdownItemText}>{ramo.nombre}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={{ marginTop: 15 }}>
                                <TextInput
                                    style={styles.inputTituloGordo}
                                    placeholder="Título de la nota..."
                                    value={tituloNota}
                                    onChangeText={setTituloNota}
                                    placeholderTextColor="#94a3b8"
                                />
                                <TextInput
                                    style={styles.inputContenidoArea}
                                    placeholder="Escribe tus apuntes, ideas o tareas aquí..."
                                    value={contenidoNota}
                                    onChangeText={setContenidoNota}
                                    multiline={true}
                                    textAlignVertical="top"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            {imagenesNota.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galeriaContainer}>
                                    {imagenesNota.map((uri, index) => (
                                        <View key={index} style={styles.imagenWrapper}>
                                            <Image source={{ uri }} style={styles.imagenMiniatura} />
                                            <TouchableOpacity style={styles.btnEliminarImagen} onPress={() => eliminarImagen(index)}>
                                                <Ionicons name="close" size={16} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            <View style={styles.adjuntarContainer}>
                                <TouchableOpacity style={styles.btnAdjuntar} onPress={tomarFoto}>
                                    <Ionicons name="camera" size={20} color="#1a73e8" />
                                    <Text style={styles.textoAdjuntar}>Tomar Foto</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnAdjuntar} onPress={elegirDeGaleria}>
                                    <Ionicons name="image" size={20} color="#10b981" />
                                    <Text style={[styles.textoAdjuntar, { color: '#10b981' }]}>Galería</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.btnGuardarFull} onPress={guardarApunte}>
                                <Text style={styles.btnGuardarTextoFull}>Guardar Apunte</Text>
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
    headerContainer: { backgroundColor: 'white', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tituloPrincipal: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
    subtitulo: { fontSize: 14, color: '#64748b', marginTop: 2 },

    filtrosContainer: { paddingHorizontal: 20, paddingTop: 15, gap: 10 },
    filtroPildora: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' },
    filtroActivo: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    filtroTexto: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    filtroTextoActivo: { color: 'white' },

    container: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
    gridNotas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    tarjetaNota: { width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
    tarjetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    badgeRamo: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: '80%' },
    badgeRamoTexto: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    tituloNotaTarjeta: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
    contenidoNotaTarjeta: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 10 },

    imagenPreviewContainer: { marginTop: 5, marginBottom: 10, borderRadius: 8, overflow: 'hidden', height: 80 },
    imagenPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    imagenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    imagenOverlayText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    footerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 5 },
    fechaNotaTarjeta: { fontSize: 11, color: '#94a3b8' },

    estadoVacio: { alignItems: 'center', marginTop: 80 },
    iconoFondoVacio: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    textoVacio: { fontSize: 20, fontWeight: 'bold', color: '#64748b' },
    subtextoVacio: { fontSize: 14, color: '#94a3b8', marginTop: 5, textAlign: 'center', paddingHorizontal: 40 },

    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#ef4444', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, height: '85%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitulo: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },

    bannerSugerencia: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 20 },
    textoBannerSugerencia: { color: '#1e40af', fontSize: 13, lineHeight: 18 },
    linkBannerSugerencia: { color: '#1d4ed8', fontSize: 13, fontWeight: 'bold' },

    label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 15 },
    dropdownButtonText: { fontSize: 15, color: '#334155', fontWeight: '600' },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
    dropdownListContainer: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 5, maxHeight: 150, overflow: 'hidden' },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dropdownItemText: { fontSize: 15, color: '#334155' },

    inputTituloGordo: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 15 },
    inputContenidoArea: { fontSize: 16, color: '#334155', lineHeight: 24, minHeight: 80, marginBottom: 15 },

    adjuntarContainer: { flexDirection: 'row', gap: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
    btnAdjuntar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', flex: 1, justifyContent: 'center' },
    textoAdjuntar: { marginLeft: 8, fontWeight: '600', color: '#1a73e8' },

    galeriaContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 10 },
    imagenWrapper: { width: 80, height: 80, marginRight: 10, borderRadius: 10, overflow: 'hidden' },
    imagenMiniatura: { width: '100%', height: '100%', resizeMode: 'cover' },
    btnEliminarImagen: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },

    btnGuardarFull: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 25 },
    btnGuardarTextoFull: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});