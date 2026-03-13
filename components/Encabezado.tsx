import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EncabezadoProps {
    titulo: string;
    subtitulo: string;
    icono: keyof typeof Ionicons.glyphMap;
    colorActivo?: string;
    mostrarBotonAtras?: boolean;
    onVolver?: () => void;
}

export default function Encabezado({
    titulo,
    subtitulo,
    icono,
    colorActivo = '#1a73e8',
    mostrarBotonAtras = false,
    onVolver
}: EncabezadoProps) {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.seccionIzquierda}>

                {mostrarBotonAtras ? (
                    <TouchableOpacity onPress={onVolver} style={styles.btnVolver}>
                        <Ionicons name="arrow-back" size={24} color="#334155" />
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.cajaIcono, { backgroundColor: colorActivo + '1A' }]}>
                        <Ionicons name={icono} size={26} color={colorActivo} />
                    </View>
                )}

                <View>
                    <Text style={styles.tituloPrincipal}>{titulo}</Text>
                    <Text style={styles.subtitulo}>{subtitulo}</Text>
                </View>
            </View>

            <TouchableOpacity activeOpacity={0.7}>
                <Ionicons name="person-circle" size={44} color="#cbd5e1" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
    },
    seccionIzquierda: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cajaIcono: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnVolver: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    tituloPrincipal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subtitulo: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 2,
    },
});