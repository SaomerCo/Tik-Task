import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORTAMOS TU TEMA
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // OPTIMIZACIÓN 1: Congela las pantallas ocultas para máxima fluidez
        freezeOnBlur: true,
        // OPTIMIZACIÓN 2: Oculta la barra al abrir el teclado (mejora el rendimiento al escribir)
        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: isDark ? 0 : 8, // Quita la sombra en modo oscuro para un look más limpio
          shadowOpacity: isDark ? 0 : 0.1,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name="ramos"
        options={{
          title: 'Ramos',
          tabBarIcon: ({ color }) => <Ionicons name="school" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="apuntes"
        options={{
          title: 'Apuntes',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="horario"
        options={{
          title: 'Horario',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="eventos"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="enfoque"
        options={{
          title: 'Estudio',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="brain" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="rendimiento"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />

      {/* Añadimos la pestaña de configuración pero la ocultamos de la barra inferior */}
      <Tabs.Screen
        name="configuracion"
        options={{
          href: null, // Esto hace que exista en el enrutador pero no aparezca un botón extra abajo
        }}
      />
    </Tabs>
  );
}