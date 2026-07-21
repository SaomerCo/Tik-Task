import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Encabezado from '../../components/Encabezado';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

export default function BusquedaScreen() {
  const { colors, isDark } = useTheme();
  const s = buildStyles(colors, isDark);
  const { apuntesGlobales, ramosGlobales } = useAppContext();

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtroRamo, setFiltroRamo] = useState<string>('todos');

  const obtenerInfoRamo = (rId: string) => {
    if (rId === 'general') return { nombre: 'General', color: colors.textSecondary };
    const ramo = ramosGlobales.find((r: any) => r.id === rId);
    return ramo ? { nombre: ramo.nombre, color: ramo.colorHex } : { nombre: 'Desconocido', color: colors.textSecondary };
  };

  const apuntesFiltrando = apuntesGlobales.filter((apunte: any) => {
    // Filtrar por ramo
    const coincideRamo = filtroRamo === 'todos' || apunte.ramoId === filtroRamo;

    // Filtrar por texto de búsqueda (título y contenido)
    const textoBaja = textoBusqueda.toLowerCase();
    const coincideTexto = 
      apunte.titulo.toLowerCase().includes(textoBaja) ||
      (apunte.contenido && apunte.contenido.toLowerCase().includes(textoBaja));

    return coincideRamo && coincideTexto;
  });

  const limpiarBusqueda = () => {
    setTextoBusqueda('');
    setFiltroRamo('todos');
  };

  return (
    <SafeAreaView style={s.mainContainer}>
      <Encabezado
        label="BÚSQUEDA"
        titulo="Encontrar"
        subtitulo="Busca tus apuntes"
        icono="search"
        colorActivo={colors.primary}
      />

      <View style={s.searchContainer}>
        <View style={s.inputWrapper}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por título o contenido..."
            placeholderTextColor={colors.textTertiary}
            value={textoBusqueda}
            onChangeText={setTextoBusqueda}
          />
          {textoBusqueda.length > 0 && (
            <TouchableOpacity onPress={() => setTextoBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros por ramo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtrosContainer}>
        <TouchableOpacity
          style={[s.filtroPildora, filtroRamo === 'todos' && s.filtroActivo]}
          onPress={() => setFiltroRamo('todos')}
        >
          <Text style={[s.filtroTexto, filtroRamo === 'todos' && s.filtroTextoActivo]}>Todos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.filtroPildora, filtroRamo === 'general' && s.filtroActivo]}
          onPress={() => setFiltroRamo('general')}
        >
          <Text style={[s.filtroTexto, filtroRamo === 'general' && s.filtroTextoActivo]}>General</Text>
        </TouchableOpacity>

        {ramosGlobales.map((ramo: any) => (
          <TouchableOpacity
            key={ramo.id}
            style={[
              s.filtroPildora,
              filtroRamo === ramo.id && [s.filtroActivo, { backgroundColor: ramo.colorHex }]
            ]}
            onPress={() => setFiltroRamo(ramo.id)}
          >
            <Text style={[s.filtroTexto, filtroRamo === ramo.id && s.filtroTextoActivo]}>
              {ramo.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Resultados */}
      <ScrollView style={s.resultadosContainer} showsVerticalScrollIndicator={false}>
        {apuntesFiltrando.length === 0 ? (
          <View style={s.estadoVacio}>
            <View style={s.iconoFondoVacio}>
              <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={s.textoVacio}>
              {textoBusqueda || filtroRamo !== 'todos' ? 'No se encontraron apuntes' : 'Comienza a buscar'}
            </Text>
            <Text style={s.subtextoVacio}>
              {textoBusqueda 
                ? `No hay apuntes que coincidan con "${textoBusqueda}"`
                : 'Escribe algo para buscar en tus notas'}
            </Text>
            {(textoBusqueda || filtroRamo !== 'todos') && (
              <TouchableOpacity style={s.btnLimpiar} onPress={limpiarBusqueda}>
                <Text style={s.btnLimpiarTexto}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={s.resultadosList}>
            <Text style={s.resultadosInfo}>
              {apuntesFiltrando.length} {apuntesFiltrando.length === 1 ? 'resultado' : 'resultados'}
            </Text>

            {apuntesFiltrando.map((apunte: any) => {
              const infoRamo = obtenerInfoRamo(apunte.ramoId);
              return (
                <View key={apunte.id} style={s.tarjetaResultado}>
                  <View style={s.resultadoHeader}>
                    <View style={[s.badgeRamo, { backgroundColor: isDark ? infoRamo.color + '30' : infoRamo.color + '15' }]}>
                      <Text style={[s.badgeRamoTexto, { color: isDark ? 'white' : infoRamo.color }]}>
                        {infoRamo.nombre}
                      </Text>
                    </View>
                    <Text style={s.fechaResultado}>{apunte.fecha}</Text>
                  </View>

                  <Text style={s.tituloResultado} numberOfLines={2}>
                    {apunte.titulo}
                  </Text>

                  {apunte.contenido && (
                    <Text style={s.contenidoResultado} numberOfLines={3}>
                      {apunte.contenido}
                    </Text>
                  )}

                  <View style={s.metadataResultado}>
                    {apunte.imagenes && apunte.imagenes.length > 0 && (
                      <View style={s.metaItem}>
                        <Ionicons name="images" size={14} color={colors.textSecondary} />
                        <Text style={s.metaTexto}>{apunte.imagenes.length} foto{apunte.imagenes.length !== 1 ? 's' : ''}</Text>
                      </View>
                    )}
                    {apunte.audio && (
                      <View style={s.metaItem}>
                        <Ionicons name="mic" size={14} color={colors.textSecondary} />
                        <Text style={s.metaTexto}>Nota de voz</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={{ height: 30 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────
// Estilos
// ────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },

    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },

    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
    },

    filtrosContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },

    filtroPildora: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: isDark ? colors.surfaceSubtle : colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    filtroActivo: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    filtroTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    filtroTextoActivo: {
      color: 'white',
    },

    resultadosContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },

    resultadosInfo: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      marginVertical: 12,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    resultadosList: {
      paddingBottom: 20,
    },

    tarjetaResultado: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    resultadoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    badgeRamo: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      maxWidth: '60%',
    },

    badgeRamoTexto: {
      fontSize: 11,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },

    fechaResultado: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '500',
    },

    tituloResultado: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 6,
    },

    contenidoResultado: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 10,
    },

    metadataResultado: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },

    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    metaTexto: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    estadoVacio: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },

    iconoFondoVacio: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },

    textoVacio: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },

    subtextoVacio: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 40,
    },

    btnLimpiar: {
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },

    btnLimpiarTexto: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
  });
}
