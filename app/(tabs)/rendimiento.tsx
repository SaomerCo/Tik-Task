import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mantenemos la ruta correcta
import { useAppContext } from '../../context/AppContext';

export default function RendimientoScreen() {
    const { ramosGlobales, sesionesEstudio, tareasGlobales } = useAppContext();

    // --- 1. CÁLCULO DE TAREAS ---
    const tareasCompletadas = tareasGlobales ? tareasGlobales.filter((t: any) => t.completada).length : 0;
    const totalTareas = tareasGlobales ? tareasGlobales.length : 0;
    const porcentajeTareas = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    // --- 2. CÁLCULO DE TIEMPO DE ESTUDIO GLOBAL ---
    const totalSegundosEstudio = sesionesEstudio ? sesionesEstudio.reduce((acc: number, s: any) => acc + s.duracionSegundos, 0) : 0;

    const formatearTiempoGlobal = (segundos: number) => {
        const h = Math.floor(segundos / 3600);
        const m = Math.floor((segundos % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m} mins`;
    };

    // --- 3. CÁLCULO DE PROMEDIO GENERAL ---
    const ramosConNota = ramosGlobales ? ramosGlobales.filter((r: any) => r.promedio > 0) : [];
    const promedioGeneral = ramosConNota.length > 0
        ? (ramosConNota.reduce((acc: number, r: any) => acc + r.promedio, 0) / ramosConNota.length).toFixed(2)
        : '0.0';

    const getColorNota = (nota: number) => nota >= 4.0 ? '#10b981' : '#ef4444';

    return (
        <SafeAreaView style={styles.container}>
            {/* CABECERA (Sin el botón de retroceso) */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tituloPrincipal}>Rendimiento</Text>
                    <Text style={styles.subtitulo}>Tu progreso analizado</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <View style={styles.gridMetricas}>
                    <View style={[styles.tarjetaMetrica, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                        <View style={styles.iconoMetrica}><Ionicons name="school" size={20} color="#1a73e8" /></View>
                        <Text style={styles.valorMetrica}>{promedioGeneral}</Text>
                        <Text style={styles.labelMetrica}>Promedio General</Text>
                    </View>

                    <View style={[styles.tarjetaMetrica, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                        <View style={[styles.iconoMetrica, { backgroundColor: '#dcfce7' }]}><Ionicons name="time" size={20} color="#10b981" /></View>
                        <Text style={[styles.valorMetrica, { color: '#10b981' }]}>{formatearTiempoGlobal(totalSegundosEstudio)}</Text>
                        <Text style={styles.labelMetrica}>Tiempo Estudiado</Text>
                    </View>

                    <View style={[styles.tarjetaMetrica, { backgroundColor: '#fef3c7', borderColor: '#fde68a', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.iconoMetrica, { backgroundColor: '#fef9c3', marginBottom: 0, marginRight: 15 }]}><Ionicons name="checkbox" size={20} color="#d97706" /></View>
                            <View>
                                <Text style={styles.labelMetrica}>Hábitos Completados</Text>
                                <Text style={[styles.valorMetrica, { color: '#d97706', fontSize: 20 }]}>{tareasCompletadas} de {totalTareas} tareas ({porcentajeTareas}%)</Text>
                            </View>
                        </View>
                        {porcentajeTareas === 100 && totalTareas > 0 && <Ionicons name="trophy" size={28} color="#d97706" />}
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.tituloSeccion}>Desempeño por Ramo</Text>

                {ramosGlobales.length === 0 ? (
                    <View style={styles.estadoVacio}>
                        <Ionicons name="folder-open-outline" size={40} color="#cbd5e1" />
                        <Text style={styles.textoVacio}>No tienes ramos en tu ciclo activo.</Text>
                    </View>
                ) : (
                    ramosGlobales.map((ramo: any) => {
                        const segundosRamo = sesionesEstudio
                            ? sesionesEstudio.filter((s: any) => s.ramoId === ramo.id).reduce((acc: number, s: any) => acc + s.duracionSegundos, 0)
                            : 0;

                        const anchoBarraNota = ramo.promedio === 0 ? 0 : (ramo.promedio / 7) * 100;

                        return (
                            <View key={ramo.id} style={styles.tarjetaRamo}>
                                <View style={styles.headerRamo}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.nombreRamo} numberOfLines={1}>{ramo.nombre}</Text>
                                        <Text style={styles.tiempoRamo}>
                                            <Ionicons name="time-outline" size={14} color="#64748b" /> Estudiado: {formatearTiempoGlobal(segundosRamo)}
                                        </Text>
                                    </View>
                                    <View style={[styles.circuloNota, { borderColor: ramo.promedio === 0 ? '#e2e8f0' : getColorNota(ramo.promedio) }]}>
                                        <Text style={[styles.notaTexto, { color: ramo.promedio === 0 ? '#94a3b8' : getColorNota(ramo.promedio) }]}>
                                            {ramo.promedio === 0 ? '-' : ramo.promedio.toFixed(1)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.barraFondo}>
                                    <View
                                        style={[
                                            styles.barraProgreso,
                                            { width: `${anchoBarraNota}%`, backgroundColor: ramo.promedio === 0 ? 'transparent' : getColorNota(ramo.promedio) }
                                        ]}
                                    />
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
    tituloPrincipal: { fontSize: 26, fontWeight: 'bold', color: '#0f172a' },
    subtitulo: { fontSize: 14, color: '#64748b', marginTop: 2 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

    gridMetricas: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 10 },
    tarjetaMetrica: { flex: 1, minWidth: '45%', padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'flex-start' },
    iconoMetrica: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    valorMetrica: { fontSize: 26, fontWeight: 'bold', color: '#1e40af' },
    labelMetrica: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },

    divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 25 },
    tituloSeccion: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },

    estadoVacio: { alignItems: 'center', marginTop: 20, padding: 30, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
    textoVacio: { fontSize: 15, color: '#94a3b8', marginTop: 10, textAlign: 'center' },

    tarjetaRamo: { backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
    headerRamo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    nombreRamo: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
    tiempoRamo: { fontSize: 13, color: '#64748b', fontWeight: '500' },

    circuloNota: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    notaTexto: { fontSize: 16, fontWeight: 'bold' },

    barraFondo: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
    barraProgreso: { height: '100%', borderRadius: 4 },
});