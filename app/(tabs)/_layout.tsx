import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, SceneMap } from 'react-native-tab-view';

// Importamos las pantallas directamente
import ApuntesScreen from './apuntes';

// Contexto de tabs
import { TabProvider, useTabContext } from '../../context/TabContext';

// IMPORTAMOS TU TEMA
import { useTheme } from '../../context/ThemeContext';

const ROUTES = [
  { key: 'apuntes',        title: 'Apuntes'       },
];

const ROUTE_ICONS: Record<string, (color: string) => React.ReactElement> = {
  apuntes:     (c) => <Ionicons name="document-text" size={24} color={c} />,
};

const renderScene = SceneMap({
  apuntes:        () => <ApuntesScreen />,
});

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { tabIndex, setTabIndex } = useTabContext();

  const TAB_BAR_HEIGHT = 65 + insets.bottom;

  const renderTabBar = useCallback((props: any) => {
    return (
      <View style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: TAB_BAR_HEIGHT,
          paddingBottom: insets.bottom,
          shadowOpacity: isDark ? 0 : 0.08,
        }
      ]}>
        {props.navigationState.routes.map((route: any, i: number) => {
          // Configuracion no aparece en la barra de navegación
          if (route.key === 'configuracion') return null;
          const isActive = props.navigationState.index === i;
          const color = isActive ? colors.primary : colors.textSecondary;
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => setTabIndex(i)}
              activeOpacity={0.7}
            >
              {ROUTE_ICONS[route.key](color)}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [colors, isDark, insets.bottom, TAB_BAR_HEIGHT, setTabIndex]);

  return (
    <TabView
      navigationState={{ index: tabIndex, routes: ROUTES }}
      renderScene={renderScene}
      onIndexChange={setTabIndex}
      tabBarPosition="bottom"
      renderTabBar={renderTabBar}
      lazy={false}
      swipeEnabled={true}
      animationEnabled={true}
      overScrollMode="never"
    />
  );
}

export default function TabLayout() {
  return (
    <TabProvider>
      <TabLayoutInner />
    </TabProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
});