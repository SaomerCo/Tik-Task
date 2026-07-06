import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Encabezado from "../../components/Encabezado";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";

export default function ScrolleoScreen() {
  const { colors, isDark } = useTheme();
  const s = buildStyles(colors, isDark);
  const { apuntesGlobales, ramosGlobales } = useAppContext();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Limpia el audio cuando se desmonta el componente
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const obtenerInfoRamo = (rId: string) => {
    if (rId === "general")
      return { nombre: "General", color: colors.textSecondary };
    const ramo = ramosGlobales.find((r: any) => r.id === rId);
    return ramo
      ? { nombre: ramo.nombre, color: ramo.colorHex }
      : { nombre: "Desconocido", color: colors.textSecondary };
  };

  const reproducirAudio = async (apunte: any) => {
    if (!apunte.audio) return;

    try {
      // Si estaba reproduciendo otro audio, lo detenemos
      if (sound && currentAudioId !== apunte.id) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: apunte.audio,
      });
      setSound(newSound);
      setCurrentAudioId(apunte.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentAudioId(null);
        }
      });

      setIsPlaying(true);
      await newSound.playAsync();
    } catch (error) {
      console.error("Error al reproducir audio", error);
      Alert.alert("Error", "No se pudo reproducir el audio");
    }
  };

  const pausarAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  if (apuntesGlobales.length === 0) {
    return (
      <View style={s.mainContainer}>
        <Encabezado
          label="DESPLAZAMIENTO"
          titulo="Scrolleo"
          subtitulo="Revisa tus apuntes"
          icono="swap-vertical"
          colorActivo={colors.primary}
        />

        <View style={s.estadoVacio}>
          <View style={s.iconoFondoVacio}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.textSecondary}
            />
          </View>
          <Text style={s.textoVacio}>No hay apuntes aún</Text>
          <Text style={s.subtextoVacio}>
            Crea tus primeras notas en la sección de Apuntes
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.mainContainer}>
      <Encabezado
        label="DESPLAZAMIENTO"
        titulo="Scrolleo"
        subtitulo="Revisa tus apuntes"
        icono="swap-vertical"
        colorActivo={colors.primary}
      />

      <ScrollView
        pagingEnabled
        showsVerticalScrollIndicator={false}
        style={s.scrollContainer}
        onLayout={(e) => {
          setContainerHeight(e.nativeEvent.layout.height);
        }}
      >
        {apuntesGlobales.map((apunte: any) => {
          const infoRamo = obtenerInfoRamo(apunte.ramoId);
          const tieneFotos = apunte.imagenes && apunte.imagenes.length > 0;
          const tieneAudio = !!apunte.audio;

          return (
            <View
              key={apunte.id}
              style={{
                height: containerHeight || "100%",
                justifyContent: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: "black",
              }}
            >
              <View style={[s.tarjetaContenedor, { marginBottom: 0 }]}>
                {/* Header de la tarjeta */}
                <View style={s.tarjetaHeader}>
                  <View
                    style={[
                      s.badgeRamo,
                      {
                        backgroundColor: isDark
                          ? infoRamo.color + "30"
                          : infoRamo.color + "15",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.badgeRamoTexto,
                        {
                          color: isDark ? "white" : infoRamo.color,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {infoRamo.nombre}
                    </Text>
                  </View>
                  <Text style={s.fechaTexto}>{apunte.fecha}</Text>
                </View>

                {/* Título */}
                <Text style={s.titulo} numberOfLines={2}>
                  {apunte.titulo}
                </Text>

                {/* Contenido */}
                {apunte.contenido ? (
                  <Text style={s.contenido} numberOfLines={3}>
                    {apunte.contenido}
                  </Text>
                ) : (
                  <Text style={s.textoPlaceholder}>
                    Esta nota no tiene contenido de texto
                  </Text>
                )}

                {/* Imágenes */}
                {tieneFotos && (
                  <View style={s.imagenContainer}>
                    <Image
                      source={{ uri: apunte.imagenes[0] }}
                      style={s.imagen}
                    />
                    {apunte.imagenes.length > 1 && (
                      <View style={s.imagenContador}>
                        <Text style={s.imagenContadorTexto}>
                          +{apunte.imagenes.length - 1}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Reproductor de audio */}
                {tieneAudio && (
                  <View style={s.audioContainer}>
                    <TouchableOpacity
                      style={s.playButton}
                      onPress={
                        isPlaying && currentAudioId === apunte.id
                          ? pausarAudio
                          : () => reproducirAudio(apunte)
                      }
                    >
                      <Ionicons
                        name={
                          isPlaying && currentAudioId === apunte.id
                            ? "pause"
                            : "play"
                        }
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                    <View style={s.audioInfo}>
                      <Ionicons
                        name="mic-circle"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={s.audioTexto}>Nota de voz</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Indicador de cantidad de apuntes */}
      <View style={s.footerInfo}>
        <Text style={s.footerTexto}>
          {apuntesGlobales.length} apuntes disponibles
        </Text>
      </View>
    </View>
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

    scrollContainer: {
      flex: 1,
      backgroundColor: "black",
    },

    tarjetaContenedor: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },

    tarjetaHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },

    badgeRamo: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      maxWidth: "60%",
    },

    badgeRamoTexto: {
      fontSize: 11,
      fontWeight: "bold",
      textTransform: "uppercase",
    },

    fechaTexto: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: "500",
    },

    titulo: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
    },

    contenido: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },

    textoPlaceholder: {
      fontSize: 13,
      color: colors.textTertiary,
      fontStyle: "italic",
      marginBottom: 12,
    },

    imagenContainer: {
      marginBottom: 12,
      borderRadius: 10,
      overflow: "hidden",
      height: 200,
      backgroundColor: "rgba(0,0,0,0.03)",
    },

    imagen: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },

    imagenContador: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 5,
    },

    imagenContadorTexto: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    },

    audioContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? colors.primary + "20" : colors.primary + "10",
      padding: 12,
      borderRadius: 10,
      gap: 12,
    },

    playButton: {
      backgroundColor: colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },

    audioInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    audioTexto: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },

    estadoVacio: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    iconoFondoVacio: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? colors.surfaceSubtle : "#f1f5f9",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },

    textoVacio: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.textSecondary,
      marginBottom: 8,
    },

    subtextoVacio: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: "center",
      paddingHorizontal: 40,
    },

    footerInfo: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
    },

    footerTexto: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
  });
}
