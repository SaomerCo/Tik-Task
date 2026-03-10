import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          // Quitamos el height fijo y usamos minHeight dinámico
          minHeight: Platform.OS === 'android' ? 70 : 85,
          // Le damos un colchón de espacio extra abajo específico para los botones de Android
          paddingBottom: Platform.OS === 'android' ? 15 : 30,
          paddingTop: 10,
        }
      }}>
      
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="horario" options={{ title: 'Horario', tabBarIcon: ({ color }) => <Ionicons name="time" size={24} color={color} /> }} />
      <Tabs.Screen name="eventos" options={{ title: 'Eventos', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} /> }} />
      <Tabs.Screen name="ramos" options={{ title: 'Ramos', tabBarIcon: ({ color }) => <Ionicons name="book" size={24} color={color} /> }} />
      <Tabs.Screen name="estudio" options={{ title: 'Enfoque', tabBarIcon: ({ color }) => <Ionicons name="timer" size={24} color={color} /> }} />

    </Tabs>
  );
}