import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { TabProvider } from '../../context/TabContext';
import { useTheme } from '../../context/ThemeContext';
import ApuntesScreen from './apuntes';
import ScrolleoScreen from './scrolleo';

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState<'scrolleo' | 'apuntes'>('scrolleo');
  const { colors } = useTheme();

  const s = buildStyles(colors);

  return (
    <TabProvider>
      <View style={s.container}>
        {/* Contenido principal */}
        <View style={s.content}>
          {activeTab === 'scrolleo' && <ScrolleoScreen />}
          {activeTab === 'apuntes' && <ApuntesScreen />}
        </View>

        {/* Barra de navegación inferior */}
        <View style={s.navbar}>
          <TouchableOpacity
            style={[s.navItem, activeTab === 'scrolleo' && s.navItemActive]}
            onPress={() => setActiveTab('scrolleo')}
          >
            <Ionicons
              name={activeTab === 'scrolleo' ? 'swap-vertical' : 'swap-vertical-outline'}
              size={24}
              color={activeTab === 'scrolleo' ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.navItem, activeTab === 'apuntes' && s.navItemActive]}
            onPress={() => setActiveTab('apuntes')}
          >
            <Ionicons
              name={activeTab === 'apuntes' ? 'document-text' : 'document-text-outline'}
              size={24}
              color={activeTab === 'apuntes' ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TabProvider>
  );
}

function buildStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      flex: 1,
    },

    navbar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: 10,
      paddingTop: 10,
    },

    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },

    navItemActive: {
      // Puedes agregar estilos adicionales para items activos si lo deseas
    },
  });
}
