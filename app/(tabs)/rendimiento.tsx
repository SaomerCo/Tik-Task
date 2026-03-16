import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext } from '../../context/AppContext';

// IMPORTACIONES DEL TEMA Y ENCABEZADO
import Encabezado from '../../components/Encabezado';
import { useTheme } from '../../context/ThemeContext';

export default function RendimientoScreen() {
    const { ramosGlobales, sesionesEstudio, tareasGlobales, historialTareasGlobales } = useAppContext();

    const { colors, isDark } = useTheme();
    const s = buildStyles(colors, isDark);

    // --- ESTADOS PARA LOS GRÁFICOS ---
    const [mostrarGraficoHabitos, setMostrarGraficoHabitos] = useState(false);
    const [mostrarGraficoEstudio, setMostrarGraficoEstudio] = useState(false);

    const [rangoHabitos, setRangoHabitos] = useState<7 | 30>(7);
    const [rangoEstudio, setRangoEstudio] = useState<7 | 30>(7);

    // --- 1. CÁLCULO DE TAREAS ACTUALES ---
    const hoyStr = new Date().toLocaleDateString('es-ES');
    const tareasDeHoy = tareasGlobales ? tareasGlobales.filter((t: any) => t.fechaCreacion === hoyStr) : [];
    const tareasCompletadas = tareasDeHoy.filter((t: any) => t.completada).length;
    const totalTareas = tareasDeHoy.length;
    const porcentajeTareas = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    // --- 2. CÁLCULO DE TIEMPO DE ESTUDIO GLOBAL ---
    const totalSegundosEstudio = sesionesEstudio ? sesionesEstudio.reduce((acc: number, s: any) => acc + s.duracionSegundos, 0) : 0;

    const formatearTiempoGlobal = (segundos: number) => {
        const h = Math.floor(segundos / 3600);
        const m = Math.floor((segundos % 3600) / 60);
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    // --- 3. CÁLCULO DE PROMEDIO GENERAL ---
    const ramosConNota = ramosGlobales ? ramosGlobales.filter((r: any) => r.promedio > 0) : [];
    const promedioGeneral = ramosConNota.length > 0
        ? (ramosConNota.reduce((acc: number, r: any) => acc + Math.max(1.0, r.promedio), 0) / ramosConNota.length).toFixed(1)
        : '1.0';

    const getColorNota = (nota: number) => nota >= 4.0 ? colors.success : colors.danger;

    // --- 4. FUNCIONES DE FECHAS Y RACHAS ---
    const getFechaStr = (diasAtras: number) => {
        const d = new Date();
        d.setDate(d.getDate() - diasAtras);
        return d.toLocaleDateString('es-ES');
    };

    const generarDatosFechas = (dias: number) => {
        return Array.from({ length: dias }, (_, i) => {
            const diasAtras = (dias - 1) - i;
            const d = new Date();
            d.setDate(d.getDate() - diasAtras);
            return {
                fechaCompleta: d.toLocaleDateString('es-ES'),
                etiqueta: dias === 7
                    ? d.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 3)
                    : d.getDate().toString()
            };
        });
    };

    const calcularRachas = (tipo: 'habitos' | 'estudio') => {
        let actual = 0;
        let maxima = 0;
        let temp = 0;
        let rachaActiva = true;

        for (let i = 0; i < 365; i++) {
            let dStr = getFechaStr(i);
            let cumplio = false;

            if (tipo === 'habitos') {
                if (i === 0) {
                    cumplio = (totalTareas > 0 && porcentajeTareas === 100);
                } else {
                    const rec = historialTareasGlobales?.find((h: any) => h.fecha === dStr);
                    cumplio = (rec && rec.porcentaje === 100);
                }
            } else {
                const sesionesDia = sesionesEstudio?.filter((s: any) => new Date(s.timestamp).toLocaleDateString('es-ES') === dStr) || [];
                const minEstudio = sesionesDia.reduce((acc: number, s: any) => acc + s.duracionSegundos, 0) / 60;
                cumplio = minEstudio >= 1;
            }

            if (rachaActiva) {
                if (cumplio) {
                    actual++;
                } else if (i !== 0) {
                    rachaActiva = false;
                }
            }

            if (cumplio) {
                temp++;
                if (temp > maxima) maxima = temp;
            } else {
                temp = 0;
            }
        }
        return { actual, maxima };
    };

    const rachasHabitos = calcularRachas('habitos');
    const rachasEstudio = calcularRachas('estudio');

    const getEstudioRango = (diasInicio: number, diasFin: number) => {
        let totalSeg = 0;
        for (let i = diasInicio; i <= diasFin; i++) {
            let dStr = getFechaStr(i);
            const sesiones = sesionesEstudio?.filter((s: any) => new Date(s.timestamp).toLocaleDateString('es-ES') === dStr) || [];
            totalSeg += sesiones.reduce((acc: number, s: any) => acc + s.duracionSegundos, 0);
        }
        return totalSeg;
    };

    const estudioEstaSemana = getEstudioRango(0, 6);
    const estudioSemanaPasada = getEstudioRango(7, 13);

    // --- 5. MAPEO PARA GRÁFICOS ---
    const datosGraficoHabitos = generarDatosFechas(rangoHabitos).map(dia => {
        const registro = historialTareasGlobales?.find((h: any) => h.fecha === dia.fechaCompleta);
        return { etiqueta: dia.etiqueta, valor: registro ? registro.porcentaje : 0 };
    });

    const datosGraficoEstudio = generarDatosFechas(rangoEstudio).map(dia => {
        const sesionesDelDia = sesionesEstudio?.filter((s: any) => new Date(s.timestamp).toLocaleDateString('es-ES') === dia.fechaCompleta) || [];
        const segundosTotales = sesionesDelDia.reduce((acc: number, curr: any) => acc + curr.duracionSegundos, 0);
        return { etiqueta: dia.etiqueta, valor: Math.round(segundosTotales / 60) };
    });

    const maxMinutosEstudio = Math.max(...datosGraficoEstudio.map(d => d.valor), 60);

    return (
        <SafeAreaView style={s.container}>

            <Encabezado
                label="ANALÍTICA"
                titulo="Progreso"
                subtitulo="Métricas y gráficos"
                icono="stats-chart"
                colorActivo={colors.primary}
            />

            <ScrollView showsVerticalScrollIndicator={false} removeClippedSubviews={false} contentContainerStyle={s.scrollContent}>

                {/* --- TARJETAS SUPERIORES GLOBALES --- */}
                <View style={s.gridMetricas}>
                    <View style={[s.tarjetaMetrica, { backgroundColor: isDark ? colors.primary + '15' : '#eff6ff', borderColor: isDark ? colors.primary + '50' : '#bfdbfe' }]}>
                        <View style={[s.iconoMetrica, { backgroundColor: isDark ? colors.primary + '30' : '#dbeafe' }]}><Ionicons name="school" size={20} color={colors.primary} /></View>
                        <Text style={[s.valorMetrica, { color: isDark ? 'white' : '#1e40af' }]}>{promedioGeneral}</Text>
                        <Text style={[s.labelMetrica, isDark && { color: colors.primary }]}>Promedio General</Text>
                    </View>

                    <View style={[s.tarjetaMetrica, { backgroundColor: isDark ? colors.success + '15' : '#f0fdf4', borderColor: isDark ? colors.success + '50' : '#bbf7d0' }]}>
                        <View style={[s.iconoMetrica, { backgroundColor: isDark ? colors.success + '30' : '#dcfce7' }]}><Ionicons name="time" size={20} color={colors.success} /></View>
                        <Text style={[s.valorMetrica, { color: isDark ? 'white' : colors.success }]}>{formatearTiempoGlobal(totalSegundosEstudio)}</Text>
                        <Text style={[s.labelMetrica, isDark && { color: colors.success }]}>Total Histórico</Text>
                    </View>
                </View>

                {/* ================================================================= */}
                {/* APARTADO 1: DASHBOARD DE HÁBITOS */}
                {/* ================================================================= */}
                <TouchableOpacity
                    style={s.acordeonHeader}
                    onPress={() => setMostrarGraficoHabitos(!mostrarGraficoHabitos)}
                    activeOpacity={0.7}
                >
                    <View>
                        <Text style={s.tituloSeccion}>Consistencia de Hábitos</Text>
                        <Text style={s.subtituloSeccion}>Tus Rachas y Gráficos</Text>
                    </View>
                    <Ionicons name={mostrarGraficoHabitos ? "chevron-up" : "chevron-down"} size={24} color={colors.textSecondary} />
                </TouchableOpacity>

                {mostrarGraficoHabitos && (
                    <View style={s.contenedorDashboard}>
                        
                        {/* Rachas de Hábitos */}
                        <View style={s.rachasContainerInterno}>
                            <View style={s.rachaCard}>
                                <View style={[s.iconoMetricaPequeño, { backgroundColor: colors.warning + '20' }]}><Ionicons name="flame" size={18} color={colors.warning} /></View>
                                <Text style={s.rachaTitulo}>Racha Actual</Text>
                                {rachasHabitos.actual > 0 ? (
                                    <Text style={[s.rachaValor, { color: colors.warning }]}>{rachasHabitos.actual} <Text style={s.rachaSufijo}>días</Text></Text>
                                ) : (
                                    <Text style={s.rachaValorCero}>0 <Text style={s.rachaSufijo}>días</Text></Text>
                                )}
                            </View>
                            <View style={s.rachaCard}>
                                <View style={[s.iconoMetricaPequeño, { backgroundColor: isDark ? colors.surfaceElevated : '#f1f5f9' }]}><Ionicons name="trophy" size={18} color={colors.textSecondary} /></View>
                                <Text style={s.rachaTitulo}>Mejor Racha</Text>
                                <Text style={[s.rachaValor, { color: colors.text }]}>{rachasHabitos.maxima} <Text style={s.rachaSufijo}>días</Text></Text>
                            </View>
                        </View>

                        {/* Gráfico de Hábitos */}
                        <View style={s.toggleRangoContainer}>
                            <TouchableOpacity style={[s.btnRango, rangoHabitos === 7 && s.btnRangoActivo]} onPress={() => setRangoHabitos(7)}>
                                <Text style={[s.textoRango, rangoHabitos === 7 && s.textoRangoActivo]}>7 Días</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.btnRango, rangoHabitos === 30 && s.btnRangoActivo]} onPress={() => setRangoHabitos(30)}>
                                <Text style={[s.textoRango, rangoHabitos === 30 && s.textoRangoActivo]}>30 Días</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollGraficoInterno}>
                            <View style={s.graficoBarras}>
                                {datosGraficoHabitos.map((dato, index) => (
                                    <View key={index} style={s.columnaGrafico}>
                                        <Text style={s.etiquetaValorGrafico}>{dato.valor}%</Text>
                                        <View style={s.barraFondoGrafico}>
                                            <View style={[
                                                s.barraRellenoGrafico,
                                                { height: `${dato.valor}%`, backgroundColor: dato.valor === 100 ? colors.success : colors.warning }
                                            ]} />
                                        </View>
                                        <Text style={s.etiquetaDiaGrafico}>{dato.etiqueta}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* ================================================================= */}
                {/* APARTADO 2: DASHBOARD DE TIEMPO DE ESTUDIO */}
                {/* ================================================================= */}
                <TouchableOpacity
                    style={s.acordeonHeader}
                    onPress={() => setMostrarGraficoEstudio(!mostrarGraficoEstudio)}
                    activeOpacity={0.7}
                >
                    <View>
                        <Text style={s.tituloSeccion}>Tiempo de Estudio</Text>
                        <Text style={s.subtituloSeccion}>Horas Semanales y Rachas</Text>
                    </View>
                    <Ionicons name={mostrarGraficoEstudio ? "chevron-up" : "chevron-down"} size={24} color={colors.textSecondary} />
                </TouchableOpacity>

                {mostrarGraficoEstudio && (
                    <View style={s.contenedorDashboard}>
                        
                        {/* Rachas y Comparativa de Estudio */}
                        <View style={s.rachasContainerInterno}>
                            <View style={s.rachaCard}>
                                <View style={[s.iconoMetricaPequeño, { backgroundColor: colors.danger + '20' }]}><Ionicons name="book" size={16} color={colors.danger} /></View>
                                <Text style={s.rachaTitulo}>Racha Actual</Text>
                                {rachasEstudio.actual > 0 ? (
                                    <Text style={[s.rachaValor, { color: colors.danger }]}>{rachasEstudio.actual} <Text style={s.rachaSufijo}>días</Text></Text>
                                ) : (
                                    <Text style={s.rachaValorCero}>0 <Text style={s.rachaSufijo}>días</Text></Text>
                                )}
                                <Text style={s.rachaSub}>Récord: {rachasEstudio.maxima}d</Text>
                            </View>
                            <View style={[s.rachaCard, { flex: 1.2 }]}>
                                <View style={[s.iconoMetricaPequeño, { backgroundColor: colors.primary + '20' }]}><Ionicons name="analytics" size={16} color={colors.primary} /></View>
                                <Text style={s.rachaTitulo}>Esta Semana</Text>
                                <Text style={[s.rachaValor, { color: colors.primary, fontSize: 16 }]}>{formatearTiempoGlobal(estudioEstaSemana)}</Text>
                                <Text style={s.rachaSub}>vs {formatearTiempoGlobal(estudioSemanaPasada)} ant.</Text>
                            </View>
                        </View>

                        {/* Gráfico de Estudio */}
                        <View style={s.toggleRangoContainer}>
                            <TouchableOpacity style={[s.btnRango, rangoEstudio === 7 && s.btnRangoActivo]} onPress={() => setRangoEstudio(7)}>
                                <Text style={[s.textoRango, rangoEstudio === 7 && s.textoRangoActivo]}>7 Días</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.btnRango, rangoEstudio === 30 && s.btnRangoActivo]} onPress={() => setRangoEstudio(30)}>
                                <Text style={[s.textoRango, rangoEstudio === 30 && s.textoRangoActivo]}>30 Días</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollGraficoInterno}>
                            <View style={s.graficoBarras}>
                                {datosGraficoEstudio.map((dato, index) => {
                                    const alturaPorcentaje = (dato.valor / maxMinutosEstudio) * 100;
                                    return (
                                        <View key={index} style={s.columnaGrafico}>
                                            <Text style={s.etiquetaValorGrafico}>{dato.valor}</Text>
                                            <View style={s.barraFondoGrafico}>
                                                <View style={[
                                                    s.barraRellenoGrafico,
                                                    { height: `${alturaPorcentaje}%`, backgroundColor: colors.primary }
                                                ]} />
                                            </View>
                                            <Text style={s.etiquetaDiaGrafico}>{dato.etiqueta}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* --- DESEMPEÑO POR RAMO --- */}
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

                        const notaBase = ramo.promedio === 0 ? 1.0 : ramo.promedio;
                        const anchoBarraNota = Math.max(0, ((notaBase - 1.0) / 6.0) * 100);

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
                                            {notaBase.toFixed(1)}
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
// Estilos Dinámicos
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 10 },

        gridMetricas: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
        tarjetaMetrica: { flex: 1, minWidth: '45%', padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'flex-start' },
        iconoMetrica: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
        valorMetrica: { fontSize: 26, fontWeight: 'bold' },
        labelMetrica: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },

        divider: { height: 1, backgroundColor: colors.border, marginVertical: 25 },

        // ESTILO DE LAS BARRAS DESPLEGABLES
        acordeonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? colors.background : '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 20, marginBottom: 5 },
        tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: colors.text },
        subtituloSeccion: { fontSize: 12, color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },

        // ESTILOS DE LOS DASHBOARDS (RACHAS + GRÁFICOS)
        contenedorDashboard: { backgroundColor: colors.surface, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.03, shadowRadius: 5, elevation: isDark ? 0 : 2, marginBottom: 10 },
        
        rachasContainerInterno: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 20, gap: 10 },
        rachaCard: { flex: 1, backgroundColor: isDark ? colors.background : '#f8fafc', padding: 12, borderRadius: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.border },
        iconoMetricaPequeño: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
        rachaTitulo: { fontSize: 11, color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
        rachaValor: { fontSize: 20, fontWeight: 'bold' },
        rachaValorCero: { fontSize: 20, fontWeight: 'bold', color: colors.textSecondary },
        rachaSufijo: { fontSize: 12, fontWeight: 'normal' },
        rachaSub: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },

        toggleRangoContainer: { flexDirection: 'row', backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 8, padding: 4, marginHorizontal: 15, marginBottom: 10, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
        btnRango: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
        btnRangoActivo: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 4, elevation: isDark ? 0 : 2 },
        textoRango: { fontSize: 13, fontWeight: 'bold', color: colors.textSecondary },
        textoRangoActivo: { color: colors.text },

        scrollGraficoInterno: { paddingHorizontal: 15 },
        graficoBarras: { flexDirection: 'row', alignItems: 'flex-end', height: 160, paddingTop: 10, gap: 12 },
        columnaGrafico: { alignItems: 'center', width: 35 },
        etiquetaValorGrafico: { fontSize: 10, color: colors.textSecondary, marginBottom: 5, fontWeight: 'bold' },
        barraFondoGrafico: { width: 14, height: 100, backgroundColor: isDark ? colors.background : '#e2e8f0', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
        barraRellenoGrafico: { width: '100%', borderRadius: 7 },
        etiquetaDiaGrafico: { fontSize: 11, color: colors.textSecondary, marginTop: 8, textTransform: 'capitalize' },

        estadoVacio: { alignItems: 'center', marginTop: 10, padding: 30, backgroundColor: isDark ? colors.background : colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
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