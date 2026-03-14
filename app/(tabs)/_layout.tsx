import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, themeMode } = useTheme();

  return (
    <Tabs
      key={themeMode}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
          shadowOpacity: 0,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      {/* 1. Ramos */}
      <Tabs.Screen
        name="ramos"
        options={{
          title: 'Ramos',
          tabBarIcon: ({ color }) => <Ionicons name="school" size={24} color={color} />,
        }}
      />

      {/* 2. Apuntes */}
      <Tabs.Screen
        name="apuntes"
        options={{
          title: 'Apuntes',
          tabBarIcon: ({ color }) => <Ionicons name="pencil" size={24} color={color} />,
        }}
      />

      {/* 3. Horario */}
      <Tabs.Screen
        name="horario"
        options={{
          title: 'Horario',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />

      {/* 4. Inicio (Centro) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />

      {/* 5. Eventos */}
      <Tabs.Screen
        name="eventos"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
        }}
      />

      {/* 6. Estudio (Enfoque) */}
      <Tabs.Screen
        name="enfoque"
        options={{
          title: 'Estudio',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="brain" size={26} color={color} />,
        }}
      />

      {/* 7. Rendimiento */}
      <Tabs.Screen
        name="rendimiento"
        options={{
          title: 'Rendimiento',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />

      {/* 8. Configuración */}
      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Config.',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}