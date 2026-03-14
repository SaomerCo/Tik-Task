import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext } from '../../context/AppContext';

// IMPORTACIONES DEL TEMA Y ENCABEZADO
import Encabezado from '../../components/Encabezado';
import { useTheme } from '../../context/ThemeContext';

export default function RendimientoScreen() {
    const { ramosGlobales, sesionesEstudio, tareasGlobales } = useAppContext();

    // EXTRAEMOS LOS COLORES DEL TEMA
    const { colors, isDark } = useTheme();
    const s = buildStyles(colors, isDark);

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

    const getColorNota = (nota: number) => nota >= 4.0 ? colors.success : colors.danger;

    return (
        <SafeAreaView style={s.container}>

            <Encabezado
                label="ANALÍTICA"
                titulo="Progreso"
                subtitulo="Métricas académicas"
                icono="stats-chart"
                colorActivo={colors.primary}
            />

            <ScrollView showsVerticalScrollIndicator={false} removeClippedSubviews={false} contentContainerStyle={s.scrollContent}>

                <View style={s.gridMetricas}>
                    {/* TARJETA PROMEDIO (AZUL) */}
                    <View style={[s.tarjetaMetrica, { backgroundColor: isDark ? colors.primary + '15' : '#eff6ff', borderColor: isDark ? colors.primary + '50' : '#bfdbfe' }]}>
                        <View style={[s.iconoMetrica, { backgroundColor: isDark ? colors.primary + '30' : '#dbeafe' }]}><Ionicons name="school" size={20} color={colors.primary} /></View>
                        <Text style={[s.valorMetrica, { color: isDark ? 'white' : '#1e40af' }]}>{promedioGeneral}</Text>
                        <Text style={[s.labelMetrica, isDark && { color: colors.primary }]}>Promedio General</Text>
                    </View>

                    {/* TARJETA TIEMPO (VERDE) */}
                    <View style={[s.tarjetaMetrica, { backgroundColor: isDark ? colors.success + '15' : '#f0fdf4', borderColor: isDark ? colors.success + '50' : '#bbf7d0' }]}>
                        <View style={[s.iconoMetrica, { backgroundColor: isDark ? colors.success + '30' : '#dcfce7' }]}><Ionicons name="time" size={20} color={colors.success} /></View>
                        <Text style={[s.valorMetrica, { color: isDark ? 'white' : colors.success }]}>{formatearTiempoGlobal(totalSegundosEstudio)}</Text>
                        <Text style={[s.labelMetrica, isDark && { color: colors.success }]}>Tiempo Estudiado</Text>
                    </View>

                    {/* TARJETA HÁBITOS (AMARILLA/NARANJA) */}
                    <View style={[s.tarjetaMetrica, { backgroundColor: isDark ? colors.warning + '15' : '#fef3c7', borderColor: isDark ? colors.warning + '50' : '#fde68a', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[s.iconoMetrica, { backgroundColor: isDark ? colors.warning + '30' : '#fef9c3', marginBottom: 0, marginRight: 15 }]}><Ionicons name="checkbox" size={20} color={colors.warning} /></View>
                            <View>
                                <Text style={[s.labelMetrica, isDark && { color: colors.warning }]}>Hábitos Completados</Text>
                                <Text style={[s.valorMetrica, { color: isDark ? 'white' : '#d97706', fontSize: 20 }]}>{tareasCompletadas} de {totalTareas} tareas ({porcentajeTareas}%)</Text>
                            </View>
                        </View>
                        {porcentajeTareas === 100 && totalTareas > 0 && <Ionicons name="trophy" size={28} color={colors.warning} />}
                    </View>
                </View>

                <View style={s.divider} />

                <Text style={s.tituloSeccion}>Desempeño por Ramo</Text>

                {ramosGlobales.length === 0 ? (
                    <View style={s.estadoVacio}>
                        <Ionicons name="folder-open-outline" size={40} color={colors.textSecondary} />
                        <Text style={s.textoVacio}>No tienes ramos en tu ciclo activo.</Text>
                    </View>
                ) : (
                    ramosGlobales.map((ramo: any) => {
                        const segundosRamo = sesionesEstudio
                            ? sesionesEstudio.filter((s: any) => s.ramoId === ramo.id).reduce((acc: number, s: any) => acc + s.duracionSegundos, 0)
                            : 0;

                        const anchoBarraNota = ramo.promedio === 0 ? 0 : (ramo.promedio / 7) * 100;

                        return (
                            <View key={ramo.id} style={s.tarjetaRamo}>
                                <View style={s.headerRamo}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.nombreRamo} numberOfLines={1}>{ramo.nombre}</Text>
                                        <Text style={s.tiempoRamo}>
                                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} /> Estudiado: {formatearTiempoGlobal(segundosRamo)}
                                        </Text>
                                    </View>
                                    <View style={[s.circuloNota, { borderColor: ramo.promedio === 0 ? colors.border : getColorNota(ramo.promedio) }]}>
                                        <Text style={[s.notaTexto, { color: ramo.promedio === 0 ? colors.textSecondary : getColorNota(ramo.promedio) }]}>
                                            {ramo.promedio === 0 ? '-' : ramo.promedio.toFixed(1)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={s.barraFondo}>
                                    <View
                                        style={[
                                            s.barraProgreso,
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

// ─────────────────────────────────────────────────────────────────────────────
// Estilos Dinámicos (Integrando colores del tema)
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

        gridMetricas: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
        tarjetaMetrica: { flex: 1, minWidth: '45%', padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'flex-start' },
        iconoMetrica: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
        valorMetrica: { fontSize: 26, fontWeight: 'bold' },
        labelMetrica: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },

        divider: { height: 1, backgroundColor: colors.border, marginVertical: 25 },
        tituloSeccion: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 15 },

        estadoVacio: { alignItems: 'center', marginTop: 20, padding: 30, backgroundColor: isDark ? colors.background : colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
        textoVacio: { fontSize: 15, color: colors.textSecondary, marginTop: 10, textAlign: 'center' },

        tarjetaRamo: { backgroundColor: colors.surface, padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.03, shadowRadius: 5, elevation: isDark ? 0 : 2 },
        headerRamo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
        nombreRamo: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
        tiempoRamo: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

        circuloNota: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
        notaTexto: { fontSize: 16, fontWeight: 'bold' },

        barraFondo: { height: 8, backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
        barraProgreso: { height: '100%', borderRadius: 4 },
    });
}