import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeMode, useTheme } from '../../context/ThemeContext';

// IMPORTACIÓN DEL ENCABEZADO
import Encabezado from '../../components/Encabezado';

export default function Configuracion() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const s = buildStyles(colors, isDark);

  // CONTADOR PARA EL EASTER EGG
  const [clickCount, setClickCount] = useState(0);
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // OPCIONES BASE DEL TEMA
  const baseOptions: { mode: ThemeMode; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Modo Claro', description: 'Interfaz luminosa, ideal para ambientes bien iluminados', icon: 'sunny' },
    { mode: 'dark', label: 'Modo Oscuro', description: 'Reduce la fatiga visual en entornos con poca luz', icon: 'moon' },
    { mode: 'system', label: 'Usar ajuste del sistema', description: 'Se adapta automáticamente a la preferencia de tu dispositivo', icon: 'phone-portrait' },
  ];

  // SI EL TEMA DENNISE ESTÁ ACTIVO, LO AÑADIMOS A LA LISTA VISUAL
  if (themeMode === 'dennise') {
    baseOptions.push({ mode: 'dennise', label: 'Tema Dennise', description: 'Tema especial secreto desbloqueado 🌸', icon: 'heart' });
  }

  const manejarClickTema = (mode: ThemeMode) => {
    // Lógica del Easter Egg: Solo contamos si toca 'light'
    if (mode === 'light') {
      const nuevosClicks = clickCount + 1;
      setClickCount(nuevosClicks);

      // Si llega a 20 clics
      if (nuevosClicks === 20) {
        Alert.alert("🌸 ¡Secreto Desbloqueado! 🌸", "Has descubierto el Tema Dennise.");
        setThemeMode('dennise');
        setClickCount(0); // Reiniciamos
        return;
      }

      // Reiniciamos el contador si deja de tapear por 2 segundos
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
      clickTimeout.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    } else {
      // Si toca cualquier otra cosa, reiniciamos el contador
      setClickCount(0);
    }

    // Cambiamos el tema normalmente
    setThemeMode(mode);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Encabezado
        titulo="Configuración"
        subtitulo="Personaliza tu experiencia"
        icono="settings"
        colorActivo={colors.primary}
      />

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={s.sectionLabel}>APARIENCIA</Text>
        <View style={s.card}>
          {baseOptions.map((opt, index) => {
            const isSelected = themeMode === opt.mode;
            const isLast = index === baseOptions.length - 1;
            return (
              <React.Fragment key={opt.mode}>
                <TouchableOpacity
                  style={[s.optionRow, isSelected && s.optionRowSelected]}
                  onPress={() => manejarClickTema(opt.mode)}
                  activeOpacity={0.7}
                >
                  <View style={[s.optionIconWrap, isSelected && s.optionIconWrapSelected]}>
                    <Ionicons name={opt.icon} size={20} color={isSelected ? colors.textInverse : colors.textSecondary} />
                  </View>

                  <View style={s.optionTextBlock}>
                    <Text style={[s.optionLabel, isSelected && s.optionLabelSelected]}>{opt.label}</Text>
                    <Text style={s.optionDesc}>{opt.description}</Text>
                  </View>

                  {isSelected && (
                    <View style={s.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
                {!isLast && <View style={s.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={s.sectionLabel}>PREVISUALIZACIÓN</Text>
        <View style={s.previewCard}>
          <View style={s.previewHeader}>
            <View style={s.previewDot} />
            <View style={[s.previewDot, { backgroundColor: colors.warning }]} />
            <View style={[s.previewDot, { backgroundColor: colors.secondary }]} />
            <Text style={s.previewHeaderLabel}>
              {themeMode === 'dennise' ? '🌸 Tema Dennise activo' : (isDark ? '🌙 Modo Oscuro activo' : '☀️ Modo Claro activo')}
            </Text>
          </View>
          <View style={s.previewBody}>
            <View style={s.previewRow}>
              <View style={s.previewSwatch} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={[s.previewLine, { width: '80%' }]} />
                <View style={[s.previewLine, { width: '55%', opacity: 0.5 }]} />
              </View>
            </View>
            <View style={[s.previewRow, { marginTop: 8 }]}>
              <View style={[s.previewSwatch, { backgroundColor: colors.secondaryLight }]} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={[s.previewLine, { width: '65%' }]} />
                <View style={[s.previewLine, { width: '40%', opacity: 0.5 }]} />
              </View>
            </View>
          </View>
        </View>

        <Text style={s.sectionLabel}>SOBRE LA APP</Text>
        <View style={s.card}>
          <View style={s.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={s.infoText}>Versión</Text>
            <Text style={s.infoValue}>1.0.0</Text>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Ionicons name="code-slash-outline" size={20} color={colors.textSecondary} />
            <Text style={s.infoText}>Desarrollado con</Text>
            <Text style={s.infoValue}>React Native + Expo</Text>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Ionicons name="school-outline" size={20} color={colors.textSecondary} />
            <Text style={s.infoText}>App</Text>
            <Text style={s.infoValue}>Estudyl</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos dinámicos
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, letterSpacing: 1.2, marginBottom: 10, marginTop: 20, marginLeft: 4 },
    card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 8, elevation: isDark ? 0 : 2 },
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    optionRowSelected: { backgroundColor: isDark ? colors.surfaceElevated : colors.primaryLight + '40' },
    optionIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center' },
    optionIconWrapSelected: { backgroundColor: colors.primary },
    optionTextBlock: { flex: 1 },
    optionLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    optionLabelSelected: { color: colors.primary },
    optionDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
    checkmark: { marginLeft: 4 },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
    previewCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 8, elevation: isDark ? 0 : 2 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 6 },
    previewDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
    previewHeaderLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginLeft: 4 },
    previewBody: { padding: 14 },
    previewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    previewSwatch: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight },
    previewLine: { height: 10, borderRadius: 5, backgroundColor: colors.borderStrong },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    infoText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
    infoValue: { fontSize: 14, color: colors.textSecondary },
  });
}