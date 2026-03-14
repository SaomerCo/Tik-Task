import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface EncabezadoProps {
    titulo: string;
    subtitulo: string;
    icono: keyof typeof Ionicons.glyphMap;
    colorActivo?: string;
    label?: string;
}

export default function Encabezado({ titulo, subtitulo, icono, colorActivo, label }: EncabezadoProps) {
    const { colors, isDark } = useTheme();

    // Usamos el color primario si no se pasa uno específico
    const themeColor = colorActivo || colors.primary;
    const s = buildStyles(colors, isDark, themeColor);

    return (
        <View style={s.container}>
            <View style={s.textContainer}>
                <Text style={s.title}>{titulo}</Text>
                <Text style={s.subtitle}>{subtitulo}</Text>
            </View>

            {/* Contenedor del ícono estilo "Squircle" (iOS) con fondo translúcido */}
            <View style={s.iconWrapper}>
                <Ionicons name={icono} size={28} color={themeColor} style={s.iconShadow} />
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos Premium (Neumorfismo Sutil / iOS Style)
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean, themeColor: string) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: Platform.OS === 'ios' ? 10 : 30,
            paddingBottom: 20,
            backgroundColor: 'transparent', // Para que se fusione con el SafeAreaView
        },
        textContainer: {
            flex: 1,
            paddingRight: 20,
        },
        title: {
            fontSize: 34, // Más grande y contundente
            fontWeight: '900', // Extra bold para jerarquía de revista
            color: colors.text,
            letterSpacing: -1, // Letras más juntas (estilo moderno)
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 15,
            color: colors.textSecondary,
            fontWeight: '500',
            letterSpacing: 0.2,
            opacity: isDark ? 0.8 : 1, // Suavizamos un poco en modo oscuro
        },
        iconWrapper: {
            width: 54,
            height: 54,
            borderRadius: 18, // Borde muy suave
            justifyContent: 'center',
            alignItems: 'center',
            // Magia del color translúcido: 20% de opacidad en modo claro, 30% en oscuro
            backgroundColor: isDark ? themeColor + '30' : themeColor + '20',
            borderWidth: 1,
            // Borde brillante sutil en modo oscuro
            borderColor: isDark ? themeColor + '50' : 'transparent',

            // Sombra muy suave para que el botón "flote" un poco
            shadowColor: themeColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        iconShadow: {
            // Le da un toque "glowing" (brillante) al ícono en sí
            textShadowColor: isDark ? themeColor + '80' : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
        }
    });
}