import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Importamos el hook de nuestro nuevo sistema de temas
import { useTheme } from '../context/ThemeContext';

interface EncabezadoProps {
    titulo: string;
    subtitulo: string;
    icono: keyof typeof Ionicons.glyphMap;
    colorActivo?: string;
}

export default function Encabezado({ titulo, subtitulo, icono, colorActivo }: EncabezadoProps) {
    // Obtenemos los colores dinámicos y si estamos en modo oscuro
    const { colors, isDark } = useTheme();

    // Si no pasamos un color, usamos el primario por defecto
    const iconColor = colorActivo || colors.primary;

    // Creamos los estilos inyectando los colores actuales
    const s = buildStyles(colors, isDark, iconColor);

    return (
        <View style={s.container}>
            <View style={s.textContainer}>
                <Text style={s.title}>{titulo}</Text>
                <Text style={s.subtitle}>{subtitulo}</Text>
            </View>

            <View style={s.iconWrapper}>
                <Ionicons name={icono} size={28} color={iconColor} />
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos dinámicos
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean, iconColor: string) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 25,
            paddingBottom: 20,
            // Usamos el fondo dinámico del tema
            backgroundColor: colors.background,
        },
        textContainer: {
            flex: 1,
            paddingRight: 15,
        },
        title: {
            fontSize: 32,
            fontWeight: '900', // Letra extra gruesa para destacar
            color: colors.text,
            letterSpacing: -0.5,
        },
        subtitle: {
            fontSize: 15,
            color: colors.textSecondary,
            marginTop: 4,
            fontWeight: '500',
        },
        iconWrapper: {
            width: 56,
            height: 56,
            borderRadius: 18, // Cuadrado estilo iOS
            justifyContent: 'center',
            alignItems: 'center',
            // Magia: Usamos el color activo pero le añadimos transparencia ('20' o '15' en Hex)
            backgroundColor: isDark ? iconColor + '20' : iconColor + '15',
            // Un borde sutil en modo oscuro le da un toque muy elegante
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? colors.border : 'transparent',
        }
    });
}