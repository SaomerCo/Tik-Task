import { Stack } from 'expo-router';
import React from 'react';

// IMPORTAMOS TUS DOS PROVEEDORES DE CONTEXTO
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    // 1. Envolvemos con el Tema (para que toda la app sepa qué colores usar)
    <ThemeProvider>
      {/* 2. Envolvemos con los Datos (ramos, tareas, etc.) */}
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AppProvider>
    </ThemeProvider>
  );
}