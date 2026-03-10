import { Stack } from 'expo-router';
import { AppProvider } from '../context/AppContext'; // Importamos nuestro cerebro

export default function RootLayout() {
  return (
    // Envolvemos toda la aplicación en el Proveedor
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Aquí adentro viven todas tus pantallas y pestañas */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}