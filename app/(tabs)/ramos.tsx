import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { useAppContext } from '../../context/AppContext';
import Encabezado from '../../components/Encabezado';
import { useTheme } from '../../context/ThemeContext';
import { useTabContext } from '../../context/TabContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RamosScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const s = buildStyles(colors, isDark);
  const { setTabIndex } = useTabContext();

  const {
    ciclos, crearCiclo, editarCiclo, eliminarCiclo, toggleCicloActivo,
    agregarRamo, actualizarRamo, eliminarRamo,
    guardarCategoria, eliminarCategoria, agregarNota, eliminarNota, actualizarNota,
    guardarSubcategoria, eliminarSubcategoria, agregarNotaSubcategoria, eliminarNotaSubcategoria, actualizarNotaSubcategoria,
    calcularPromedioRamo
  } = useAppContext();

  const añoCalculado = new Date().getFullYear();
  const añosDisponibles = Array.from({ length: añoCalculado - 2015 + 1 }, (_, i) => (añoCalculado - i).toString());

  const [ciclosExpandidos, setCiclosExpandidos] = useState<{ [key: string]: boolean }>({});
  const [modalPeriodoVisible, setModalPeriodoVisible] = useState(false);
  const [cicloAEditarId, setCicloAEditarId] = useState<string | null>(null);
  const [tempAño, setTempAño] = useState(añoCalculado.toString());
  const [tempSemestre, setTempSemestre] = useState('Primer Semestre');

  const [modalVisible, setModalVisible] = useState(false);
  const [cicloDestinoId, setCicloDestinoId] = useState<string | null>(null);
  const [ramoAEditarId, setRamoAEditarId] = useState<string | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoProfesor, setNuevoProfesor] = useState('');
  const [nuevaSala, setNuevaSala] = useState('');
  const [nuevoColor, setNuevoColor] = useState('#1a73e8');

  const [etiquetasRamo, setEtiquetasRamo] = useState<string[]>([]);
  const [textoEtiqueta, setTextoEtiqueta] = useState('');
  const [etiquetasHistoricas, setEtiquetasHistoricas] = useState(['Cátedra', 'Taller', 'Asistencia Obligatoria', 'Laboratorio']);

  const [modalOpcionesCicloVisible, setModalOpcionesCicloVisible] = useState(false);
  const [cicloSeleccionado, setCicloSeleccionado] = useState<any>(null);

  const [modalOpcionesRamoVisible, setModalOpcionesRamoVisible] = useState(false);
  const [ramoSeleccionado, setRamoSeleccionado] = useState<any>(null);
  const [modalCopiarRamoVisible, setModalCopiarRamoVisible] = useState(false);

  const [modalNotasVisible, setModalNotasVisible] = useState(false);
  const [ramoParaNotas, setRamoParaNotas] = useState<any>(null);

  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');
  const [nuevaCategoriaPorcentaje, setNuevaCategoriaPorcentaje] = useState('');
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string | null>(null);

  const [nuevaSubcategoriaNombre, setNuevaSubcategoriaNombre] = useState('');
  const [nuevaSubcategoriaPorcentaje, setNuevaSubcategoriaPorcentaje] = useState('');
  const [creandoSubParaCatId, setCreandoSubParaCatId] = useState<string | null>(null);

  const [nuevaNotaValor, setNuevaNotaValor] = useState('');
  const [nuevaNotaDesc, setNuevaNotaDesc] = useState('');
  const [nuevaNotaPorcentaje, setNuevaNotaPorcentaje] = useState('');
  const [subcategoriaSeleccionadaId, setSubcategoriaSeleccionadaId] = useState<string | null>(null);

  const [editandoNotaId, setEditandoNotaId] = useState<string | null>(null);
  const [editNotaDesc, setEditNotaDesc] = useState('');
  const [editNotaValor, setEditNotaValor] = useState('');
  const [editNotaPorc, setEditNotaPorc] = useState('');

  const iniciarEdicionNota = (nota: any) => {
    setEditandoNotaId(nota.id);
    setEditNotaDesc(nota.descripcion || '');
    setEditNotaValor(nota.valor != null ? nota.valor.toString() : '');
    setEditNotaPorc(nota.porcentaje ? nota.porcentaje.toString() : '');
  };

  const [editandoCategoriaConfigId, setEditandoCategoriaConfigId] = useState<string | null>(null);
  const [editCatConfigNombre, setEditCatConfigNombre] = useState('');
  const [editCatConfigPorc, setEditCatConfigPorc] = useState('');

  const [editandoSubcatConfigId, setEditandoSubcatConfigId] = useState<string | null>(null);
  const [editSubcatConfigNombre, setEditSubcatConfigNombre] = useState('');
  const [editSubcatConfigPorc, setEditSubcatConfigPorc] = useState('');

  const [isSimulando, setIsSimulando] = useState(false);
  const [notaSimulada, setNotaSimulada] = useState<number | null>(null);

  const coloresDisponibles = ['#1a73e8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
  const getColorNota = (nota: number) => nota >= 4.0 ? '#1a73e8' : '#ef4444';

  const formatPromedio = (prom: number) => {
    const fixed = prom.toFixed(2);
    return fixed.endsWith('0') ? prom.toFixed(1) : fixed;
  };

  const confirmarEliminarSubcategoria = (cicloId: string, ramoId: string, catId: string, subId: string, subNombre: string) => {
    Alert.alert('Eliminar Subcategoría', `¿Estás seguro de que deseas eliminar la subcategoría "${subNombre}" y todas sus notas?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarSubcategoria(cicloId, ramoId, catId, subId) }
    ]);
  };

  const confirmarEliminarNotaSubcategoria = (cicloId: string, ramoId: string, catId: string, subId: string, notaId: string, notaDesc: string) => {
    Alert.alert('Eliminar Nota', `¿Eliminar la nota "${notaDesc || 'Sin descripción'}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarNotaSubcategoria(cicloId, ramoId, catId, subId, notaId) }
    ]);
  };

  const confirmarEliminarNota = (cicloId: string, ramoId: string, catId: string, notaId: string, notaDesc: string) => {
    Alert.alert('Eliminar Nota', `¿Eliminar la nota "${notaDesc || 'Sin descripción'}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarNota(cicloId, ramoId, catId, notaId) }
    ]);
  };

  const simularNotasVacias = (categorias: any, notaBuscada: number) => {
    const clonarArr = (arr: any) => JSON.parse(JSON.stringify(arr));
    let tieneVacias = false;
    const revisarVacias = (cats: any) => {
      cats.forEach((cat: any) => {
        if (cat.subcategorias && cat.subcategorias.length > 0) {
          cat.subcategorias.forEach((sub: any) => {
            const notas = sub.notas || [];
            if (notas.some((n: any) => n.valor == null)) tieneVacias = true;
          });
        } else {
          const notas = cat.notas || [];
          if (notas.some((n: any) => n.valor == null)) tieneVacias = true;
        }
      });
    };
    revisarVacias(categorias);
    if (!tieneVacias) return null;

    let low = 1.0; let high = 7.0; let result = null;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      const testCategorias = clonarArr(categorias);
      testCategorias.forEach((cat: any) => {
        if (cat.subcategorias && cat.subcategorias.length > 0) {
          cat.subcategorias.forEach((sub: any) => { (sub.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = mid; }); });
        } else {
          (cat.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = mid; });
        }
      });
      const promActual = calcularPromedioRamo(testCategorias);
      if (promActual >= 3.945) { result = mid; high = mid; } else { low = mid; }
    }
    const maximasCat = clonarArr(categorias);
    maximasCat.forEach((cat: any) => {
      if (cat.subcategorias && cat.subcategorias.length > 0) {
        cat.subcategorias.forEach((sub: any) => { (sub.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = 7.0; }); });
      } else {
        (cat.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = 7.0; });
      }
    });
    if (calcularPromedioRamo(maximasCat) < 3.945) return -1;
    return result != null ? parseFloat(result.toFixed(1)) : null;
  };

  const activarSimulacion = (categorias: any) => {
    const requerida = simularNotasVacias(categorias, 3.95);
    if (requerida === null) {
      Alert.alert('Aviso', 'No hay notas vacías para simular.');
    } else if (requerida === -1) {
      Alert.alert('Imposible', 'Matemáticamente no te alcanza para aprobar incluso sacando nota 7.0 en lo restante.');
    } else {
      setNotaSimulada(requerida);
      setIsSimulando(true);
    }
  };

  const toggleExpandir = (id: string) => { setCiclosExpandidos(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] })); };

  const abrirModalNuevoCiclo = () => {
    setCicloAEditarId(null); setTempAño(añoCalculado.toString()); setTempSemestre('Primer Semestre'); setModalPeriodoVisible(true);
  };

  const guardarCiclo = () => {
    if (!tempAño.trim()) return Alert.alert("Error", "Selecciona un año válido.");
    const cicloExistente = ciclos.find((c: any) => c.año === tempAño && c.semestre === tempSemestre);
    if (cicloAEditarId) {
      if (cicloExistente && cicloExistente.id !== cicloAEditarId) return Alert.alert("No permitido", `Ya existe un ciclo para ${tempSemestre} ${tempAño}.`);
      editarCiclo(cicloAEditarId, tempAño, tempSemestre);
    } else {
      if (cicloExistente) return Alert.alert("No permitido", `Ya existe un ciclo para ${tempSemestre} ${tempAño}.`);
      crearCiclo(tempAño, tempSemestre);
    }
    setModalPeriodoVisible(false);
  };

  const abrirOpcionesCiclo = (ciclo: any) => { setCicloSeleccionado(ciclo); setModalOpcionesCicloVisible(true); };

  const confirmarEliminacionCiclo = () => {
    if (!cicloSeleccionado) return;
    Alert.alert('Eliminar Ciclo', `¿Borrar permanentemente este ciclo y todos sus ramos?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { eliminarCiclo(cicloSeleccionado.id); setModalOpcionesCicloVisible(false); } }
    ]);
  };

  const agregarEtiquetaManual = () => {
    const tag = textoEtiqueta.trim();
    if (tag !== '' && !etiquetasRamo.includes(tag)) {
      setEtiquetasRamo([...etiquetasRamo, tag]);
      if (!etiquetasHistoricas.includes(tag)) setEtiquetasHistoricas([...etiquetasHistoricas, tag]);
      setTextoEtiqueta('');
    }
  };
  const agregarEtiquetaSugerida = (tag: string) => { if (!etiquetasRamo.includes(tag)) setEtiquetasRamo([...etiquetasRamo, tag]); };
  const removerEtiqueta = (etiquetaABorrar: string) => setEtiquetasRamo(etiquetasRamo.filter(tag => tag !== etiquetaABorrar));

  const abrirFormularioRamoLimpio = (idCiclo: string) => {
    setCicloDestinoId(idCiclo); setRamoAEditarId(null); setNuevoNombre(''); setNuevoProfesor(''); setNuevaSala('');
    setNuevoColor('#1a73e8'); setEtiquetasRamo([]); setTextoEtiqueta(''); setModalVisible(true);
  };

  const abrirFormularioEdicionRamo = () => {
    if (!ramoSeleccionado) return;
    setCicloDestinoId(ramoSeleccionado.cicloId); setRamoAEditarId(ramoSeleccionado.ramo.id);
    setNuevoNombre(ramoSeleccionado.ramo.nombre); setNuevoProfesor(ramoSeleccionado.ramo.profesor === 'Sin asignar' ? '' : ramoSeleccionado.ramo.profesor);
    setNuevaSala(ramoSeleccionado.ramo.sala === 'Por definir' ? '' : ramoSeleccionado.ramo.sala);
    setNuevoColor(ramoSeleccionado.ramo.colorHex); setEtiquetasRamo([...ramoSeleccionado.ramo.etiquetas]);
    setModalOpcionesRamoVisible(false); setModalVisible(true);
  };

  const guardarRamo = () => {
    if (nuevoNombre === '') return Alert.alert('Error', 'Ingresa el nombre del ramo.');
    if (!cicloDestinoId) return;
    const ramoData = { nombre: nuevoNombre, profesor: nuevoProfesor || 'Sin asignar', sala: nuevaSala || 'Por definir', etiquetas: etiquetasRamo, colorHex: nuevoColor };
    if (ramoAEditarId) {
      actualizarRamo(cicloDestinoId, ramoAEditarId, { ...ramoData, id: ramoAEditarId, promedio: ramoSeleccionado.ramo.promedio });
    } else {
      agregarRamo(cicloDestinoId, { ...ramoData, id: Math.random().toString(), promedio: 0.0 });
    }
    setModalVisible(false);
  };

  const confirmarEliminacionRamo = () => {
    if (!ramoSeleccionado) return;
    Alert.alert('Eliminar', `¿Borrar "${ramoSeleccionado.ramo.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { eliminarRamo(ramoSeleccionado.cicloId, ramoSeleccionado.ramo.id); setModalOpcionesRamoVisible(false); } }
    ]);
  };

  return (
    <View style={s.mainContainer}>

      {/* NUEVO ENCABEZADO CON TEMA */}
      <Encabezado
        label="ACADÉMICO"
        titulo="Ramos"
        subtitulo="Gestión de materias"
        icono="school"
        colorActivo={colors.primary}
      />

      {ciclos.length === 0 ? (
        <View style={s.emptyStateContainer}>
          <View style={[s.iconoFondo, { backgroundColor: isDark ? colors.primary + '30' : '#dbeafe' }]}><Ionicons name="school" size={60} color={colors.primary} /></View>
          <Text style={s.emptyStateTitle}>¡Nuevo Semestre!</Text>
          <Text style={s.emptyStateDesc}>Crea tu primer ciclo académico para comenzar a organizar tus materias.</Text>
          <TouchableOpacity style={[s.btnIniciarPeriodo, { backgroundColor: colors.primary }]} onPress={abrirModalNuevoCiclo}>
            <Text style={s.btnIniciarTexto}>Crear Ciclo</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={s.container} showsVerticalScrollIndicator={false} removeClippedSubviews={false}>
          {ciclos.map((ciclo: any) => {
            const isExpandido = ciclosExpandidos[ciclo.id] !== false;

            return (
              <View key={ciclo.id} style={[s.grupoCiclo, isExpandido && s.grupoCicloExpandido]}>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    s.tarjetaCiclo,
                    !isExpandido && s.tarjetaCicloCerrada,
                    ciclo.activo && s.tarjetaCicloDestacada,
                    isExpandido && s.tarjetaCicloCabeceraAbierta
                  ]}
                  onPress={() => toggleExpandir(ciclo.id)}
                >
                  <View style={s.cicloHeader}>
                    <View style={s.cicloInfo}>
                      <View style={[s.iconoCicloFondo, ciclo.activo && { backgroundColor: isDark ? colors.primary + '30' : '#dbeafe' }]}>
                        <Ionicons name="calendar" size={24} color={ciclo.activo ? colors.primary : colors.textSecondary} />
                      </View>
                      <View style={s.cicloTextos}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={s.cicloSemestre}>{ciclo.semestre}</Text>
                          <TouchableOpacity
                            style={[s.indicadorActivo, !ciclo.activo && s.indicadorInactivo]}
                            onPress={(e) => {
                              e.stopPropagation();
                              Alert.alert(ciclo.activo ? 'Ciclo Activo' : 'Ciclo Inactivo', ciclo.activo ? 'Este es tu ciclo académico actual. Aparecerá por defecto en tu Horario.' : 'Este ciclo no está activo. Puedes marcarlo como activo en las opciones.');
                            }}
                          />
                        </View>
                        <Text style={s.cicloAño}>Año {ciclo.año}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity style={{ padding: 5 }} onPress={(e) => { e.stopPropagation(); abrirOpcionesCiclo(ciclo); }}>
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!isExpandido && (
                    <View style={s.resumenCicloContainer}>
                      {ciclo.ramos.length === 0 ? (
                        <Text style={s.resumenTextoVacio}>Sin ramos inscritos</Text>
                      ) : (
                        <View style={s.resumenRamosLista}>
                          <Text style={s.resumenTitulo}>Materias ({ciclo.ramos.length}):</Text>
                          <Text style={s.resumenNombres} numberOfLines={1}>{ciclo.ramos.map((r: any) => r.nombre).join(', ')}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {isExpandido && (
                    <Animated.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)} layout={Layout.springify()} style={s.cicloExpandidoContenido}>
                      <TouchableOpacity style={s.btnLinkAñadir} onPress={() => abrirFormularioRamoLimpio(ciclo.id)}>
                        <Ionicons name="add-circle" size={20} color={colors.primary} />
                        <Text style={s.btnLinkAñadirTexto}>Añadir ramo a este ciclo</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </TouchableOpacity>

                {isExpandido && (
                  <Animated.View entering={FadeInUp.duration(400).delay(50)} exiting={FadeOutUp.duration(200)} layout={Layout.springify()} style={s.contenidoDesplegable}>
                    {ciclo.ramos.length === 0 && <Text style={s.cicloVacioTexto}>Aún no hay ramos en este ciclo.</Text>}
                    {ciclo.ramos.map((ramo: any) => (
                      <TouchableOpacity key={ramo.id} style={[s.tarjeta, { borderLeftColor: ramo.colorHex }]}>
                        <View style={s.infoContainer}>
                          <View style={s.tituloFila}>
                            <Text style={s.tituloRamo}>{ramo.nombre}</Text>
                            <TouchableOpacity style={s.btnOpcionesRamo} onPress={() => { setRamoSeleccionado({ ramo, cicloId: ciclo.id }); setModalOpcionesRamoVisible(true); }}>
                              <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                          </View>
                          <View style={s.detallesFila}>
                            <Text style={s.detalleTexto}><Ionicons name="person-outline" size={14} /> {ramo.profesor}</Text>
                            <Text style={s.detalleTexto}><Ionicons name="location-outline" size={14} /> {ramo.sala}</Text>
                          </View>
                          {ramo.etiquetas?.length > 0 && (
                            <View style={s.etiquetasContainer}>
                              {ramo.etiquetas.map((tag: string, index: number) => (
                                <View key={index} style={[s.badgeRamo, { backgroundColor: ramo.colorHex + '15' }]}><Text style={[s.badgeRamoTexto, { color: ramo.colorHex }]}>{tag}</Text></View>
                              ))}
                            </View>
                          )}
                          <View style={s.iconosAccion}>
                            <TouchableOpacity style={s.miniBoton} onPress={() => { setRamoParaNotas({ cicloId: ciclo.id, ramo }); setModalNotasVisible(true); }}>
                              <Ionicons name="calculator-outline" size={14} color={colors.textSecondary} />
                              <Text style={s.miniBotonTexto}>Notas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.miniBoton} onPress={() => setTabIndex(1)}>
                              <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                              <Text style={s.miniBotonTexto}>Apuntes</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={s.promedioWrapper}>
                          <Text style={s.labelPromedio}>Promedio</Text>
                          <View style={[s.circuloNota, { borderColor: ramo.promedio === 0 ? colors.border : getColorNota(ramo.promedio) }]}>
                            <Text style={[s.notaTexto, { color: ramo.promedio === 0 ? colors.textSecondary : getColorNota(ramo.promedio) }]}>{ramo.promedio === 0 ? '-' : formatPromedio(ramo.promedio)}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={s.btnColapsar} onPress={() => toggleExpandir(ciclo.id)}>
                      <Text style={s.btnColapsarTexto}>Ocultar detalles</Text>
                      <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB PARA AÑADIR CICLOS */}
      {ciclos.length > 0 && (
        <TouchableOpacity style={s.fab} onPress={abrirModalNuevoCiclo} activeOpacity={0.8}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      {/* MODALES CONFIGURACIÓN CICLOS/RAMOS */}
      <Modal animationType="fade" transparent={true} visible={modalPeriodoVisible}>
        <View style={s.modalOverlayCentro}>
          <View style={s.modalContentCentro}>
            <Text style={s.modalTitulo}>{cicloAEditarId ? 'Editar Ciclo' : 'Nuevo Ciclo'}</Text>
            <Text style={s.label}>Año Académico</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.añosContainer}>
              {añosDisponibles.map((año) => (
                <TouchableOpacity key={año} style={[s.añoOption, tempAño === año && s.añoSelected]} onPress={() => setTempAño(año)}>
                  <Text style={[s.añoText, tempAño === año && s.añoTextActive]}>{año}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.label}>Semestre</Text>
            <View style={s.periodoSelector}>
              {['Primer Semestre', 'Segundo Semestre'].map((st) => (
                <TouchableOpacity key={st} style={[s.semestreOption, tempSemestre === st && s.semestreSelected]} onPress={() => setTempSemestre(st)}>
                  <Text style={[s.semestreText, tempSemestre === st && s.semestreTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalBotones}>
              <TouchableOpacity style={s.btnCancelar} onPress={() => setModalPeriodoVisible(false)}><Text style={s.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={s.btnGuardar} onPress={guardarCiclo}><Text style={s.btnGuardarTexto}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={modalOpcionesCicloVisible} onRequestClose={() => setModalOpcionesCicloVisible(false)}>
        <TouchableOpacity style={s.modalOverlayCentro} activeOpacity={1} onPress={() => setModalOpcionesCicloVisible(false)}>
          <View style={s.opcionesContent}>
            <Text style={s.opcionesTitulo}>{cicloSeleccionado?.semestre} {cicloSeleccionado?.año}</Text>
            <TouchableOpacity style={s.opcionItem} onPress={() => {
              if (!cicloSeleccionado) return;
              setCicloAEditarId(cicloSeleccionado.id); setTempAño(cicloSeleccionado.año); setTempSemestre(cicloSeleccionado.semestre);
              setModalOpcionesCicloVisible(false); setModalPeriodoVisible(true);
            }}>
              <Ionicons name="pencil-outline" size={20} color={colors.text} style={s.opcionIcono} /><Text style={s.opcionTexto}>Editar Nombre/Año</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.opcionItem} onPress={() => { if (cicloSeleccionado) { toggleCicloActivo(cicloSeleccionado.id); setModalOpcionesCicloVisible(false); } }}>
              <Ionicons name={cicloSeleccionado?.activo ? "power-outline" : "checkmark-circle-outline"} size={20} color={cicloSeleccionado?.activo ? colors.warning : colors.success} style={s.opcionIcono} />
              <View>
                <Text style={s.opcionTexto}>{cicloSeleccionado?.activo ? 'Marcar como Inactivo' : 'Marcar como Activo'}</Text>
                <Text style={s.opcionSubtexto}>{cicloSeleccionado?.activo ? 'Ocultar de la pestaña Horario' : 'Hacer que este sea tu ciclo actual'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[s.opcionItem, { borderBottomWidth: 0 }]} onPress={confirmarEliminacionCiclo}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} style={s.opcionIcono} />
              <Text style={[s.opcionTexto, { color: colors.danger }]}>Eliminar Ciclo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={modalOpcionesRamoVisible} onRequestClose={() => setModalOpcionesRamoVisible(false)}>
        <TouchableOpacity style={s.modalOverlayCentro} activeOpacity={1} onPress={() => setModalOpcionesRamoVisible(false)}>
          <View style={s.opcionesContent}>
            <Text style={s.opcionesTitulo}>{ramoSeleccionado?.ramo?.nombre}</Text>
            <TouchableOpacity style={s.opcionItem} onPress={abrirFormularioEdicionRamo}><Ionicons name="pencil-outline" size={20} color={colors.text} style={s.opcionIcono} /><Text style={s.opcionTexto}>Editar Ramo</Text></TouchableOpacity>
            <TouchableOpacity style={s.opcionItem} onPress={() => { setModalOpcionesRamoVisible(false); setModalCopiarRamoVisible(true); }}><Ionicons name="arrow-redo-outline" size={20} color={colors.success} style={s.opcionIcono} /><Text style={s.opcionTexto}>Copiar a otro ciclo</Text></TouchableOpacity>
            <TouchableOpacity style={[s.opcionItem, { borderBottomWidth: 0 }]} onPress={confirmarEliminacionRamo}><Ionicons name="trash-outline" size={20} color={colors.danger} style={s.opcionIcono} /><Text style={[s.opcionTexto, { color: colors.danger }]}>Eliminar</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={modalCopiarRamoVisible} onRequestClose={() => setModalCopiarRamoVisible(false)}>
        <TouchableOpacity style={s.modalOverlayCentro} activeOpacity={1} onPress={() => setModalCopiarRamoVisible(false)}>
          <View style={s.opcionesContent}>
            <Text style={s.opcionesTitulo}>Copiar a otro ciclo</Text>
            {ciclos.filter((c: any) => c.id !== ramoSeleccionado?.cicloId).length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textSecondary, marginVertical: 10 }}>No hay otros ciclos disponibles.</Text>
            ) : (
              ciclos.filter((c: any) => c.id !== ramoSeleccionado?.cicloId).map((cicloDestino: any) => (
                <TouchableOpacity key={cicloDestino.id} style={s.opcionItem} onPress={() => {
                  if (ramoSeleccionado) {
                    agregarRamo(cicloDestino.id, { ...ramoSeleccionado.ramo, id: Math.random().toString(), promedio: 0.0 });
                    setModalCopiarRamoVisible(false);
                    Alert.alert('Copiado', `El ramo ha sido copiado a ${cicloDestino.semestre} ${cicloDestino.año}.`);
                  }
                }}>
                  <Ionicons name="calendar-outline" size={20} color={colors.text} style={s.opcionIcono} />
                  <View><Text style={s.opcionTexto}>{cicloDestino.semestre} {cicloDestino.año}</Text></View>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={[s.opcionItem, { borderBottomWidth: 0, justifyContent: 'center', marginTop: 10 }]} onPress={() => setModalCopiarRamoVisible(false)}>
              <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitulo}>{ramoAEditarId ? 'Editar Ramo' : 'Inscribir Ramo'}</Text>
              <Text style={s.label}>Nombre del Ramo *</Text>
              <TextInput style={s.input} placeholder="Ej. Álgebra Lineal" placeholderTextColor={colors.textSecondary} value={nuevoNombre} onChangeText={setNuevoNombre} maxLength={24} />
              <View style={s.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={s.label}>Profesor</Text>
                  <TextInput style={s.input} placeholder="Opcional" placeholderTextColor={colors.textSecondary} value={nuevoProfesor} onChangeText={setNuevoProfesor} maxLength={12} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Sala</Text>
                  <TextInput style={s.input} placeholder="Opcional" placeholderTextColor={colors.textSecondary} value={nuevaSala} onChangeText={setNuevaSala} maxLength={12} />
                </View>
              </View>

              <Text style={s.label}>Etiquetas</Text>
              <View style={{ flexDirection: 'row', backgroundColor: isDark ? colors.primary + '20' : '#eff6ff', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: isDark ? colors.border : '#bfdbfe' }}>
                <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 12, color: isDark ? colors.text : '#1e40af', lineHeight: 18 }}>
                  Crea etiquetas (ej: Cátedra, Laboratorio) para diferenciar el tipo de clase al armar tu <Text style={{ fontWeight: 'bold' }}>Horario</Text>.
                </Text>
              </View>

              <View style={s.etiquetaInputContainer}>
                <TextInput style={s.inputEtiqueta} placeholderTextColor={colors.textSecondary} placeholder="Nueva etiqueta..." value={textoEtiqueta} onChangeText={setTextoEtiqueta} onSubmitEditing={agregarEtiquetaManual} />
                <TouchableOpacity style={s.btnAgregarEtiqueta} onPress={agregarEtiquetaManual}><Ionicons name="add" size={20} color="white" /></TouchableOpacity>
              </View>
              {etiquetasHistoricas.filter(tag => !etiquetasRamo.includes(tag)).length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sugerenciasContainer}>
                  {etiquetasHistoricas.filter(tag => !etiquetasRamo.includes(tag)).map((tag, index) => (
                    <TouchableOpacity key={index} style={s.etiquetaSugerida} onPress={() => agregarEtiquetaSugerida(tag)}><Ionicons name="add" size={14} color={colors.primary} style={{ marginRight: 4 }} /><Text style={s.etiquetaSugeridaTexto}>{tag}</Text></TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {etiquetasRamo.length > 0 && (
                <View style={s.etiquetasCreadasContainer}>
                  {etiquetasRamo.map((tag, index) => (
                    <TouchableOpacity key={index} style={s.etiquetaCreada} onPress={() => removerEtiqueta(tag)}><Text style={s.etiquetaCreadaTexto}>{tag}</Text><Ionicons name="close-circle" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} /></TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={s.label}>Color del Ramo</Text>
              <View style={s.colorPickerContainer}>
                {coloresDisponibles.map((color) => (
                  <TouchableOpacity key={color} style={[s.colorCirculo, { backgroundColor: color }, nuevoColor === color && s.colorSeleccionado]} onPress={() => setNuevoColor(color)} />
                ))}
              </View>
              <View style={s.modalBotones}>
                <TouchableOpacity style={s.btnCancelar} onPress={() => setModalVisible(false)}><Text style={s.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={s.btnGuardar} onPress={guardarRamo}><Text style={s.btnGuardarTexto}>Guardar</Text></TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: GESTIÓN DE NOTAS */}
      <Modal animationType="slide" transparent={true} visible={modalNotasVisible} onRequestClose={() => setModalNotasVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { height: '85%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={s.modalTitulo} numberOfLines={1}>{ramoParaNotas?.ramo?.nombre || 'Notas'}</Text>
              <TouchableOpacity onPress={() => setModalNotasVisible(false)}><Ionicons name="close-circle" size={28} color={colors.textSecondary} /></TouchableOpacity>
            </View>

            {(() => {
              if (!ramoParaNotas) return null;
              const cicloBusqueda = ciclos.find((c: any) => c.id === ramoParaNotas.cicloId);
              const ramoAct = cicloBusqueda?.ramos?.find((r: any) => r.id === ramoParaNotas.ramo.id);
              if (!ramoAct) return null;

              const categoriasAct = ramoAct.categorias || [];
              const porcentajeTotal = categoriasAct.reduce((acc: number, cat: any) => acc + cat.porcentaje, 0);

              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.background : '#f8fafc', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Promedio Actual</Text>
                      {porcentajeTotal !== 100 && (
                        <Text style={{ fontSize: 12, color: colors.warning, marginTop: 4 }}><Ionicons name="warning" size={12} /> Las categorías principales suman {porcentajeTotal}%</Text>
                      )}
                    </View>
                    <View style={[s.circuloNota, { borderColor: ramoAct.promedio === 0 ? colors.border : getColorNota(ramoAct.promedio) }]}>
                      <Text style={[s.notaTexto, { color: ramoAct.promedio === 0 ? colors.textSecondary : getColorNota(ramoAct.promedio) }]}>{ramoAct.promedio === 0 ? '-' : formatPromedio(ramoAct.promedio)}</Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 15, paddingHorizontal: 5 }}>
                    {!isSimulando ? (
                      <TouchableOpacity style={{ backgroundColor: isDark ? colors.surfaceElevated : '#f1f5f9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'center', gap: 6 }} onPress={() => activarSimulacion(ramoAct.categorias || [])}>
                        <Ionicons name="calculator-outline" size={18} color={colors.textTertiary} />
                        <Text style={{ color: colors.textTertiary, fontWeight: 'bold' }}>Simular notas para aprobar</Text>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        <TouchableOpacity style={{ backgroundColor: isDark ? colors.danger + '30' : '#fee2e2', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: isDark ? colors.danger : '#fca5a5', flexDirection: 'row', justifyContent: 'center', gap: 6 }} onPress={() => { setIsSimulando(false); setNotaSimulada(null); }}>
                          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                          <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Salir de la simulación (Req: {notaSimulada?.toFixed(1)})</Text>
                        </TouchableOpacity>
                        {notaSimulada !== null && (
                          <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
                            Si obtienes un <Text style={{ fontWeight: 'bold', color: colors.text }}>{notaSimulada.toFixed(1)}</Text> en tus notas pendientes, pasarás este ramo con promedio de 3.95.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  <Text style={s.label}>Categorías de Evaluación</Text>
                  <View style={{ flexDirection: 'row', backgroundColor: isDark ? colors.success + '20' : '#f0fdf4', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: isDark ? colors.border : '#bbf7d0', alignItems: 'center' }}>
                    <Ionicons name="information-circle" size={20} color={colors.success} style={{ marginRight: 10 }} />
                    <Text style={{ flex: 1, color: isDark ? colors.text : '#15803d', fontSize: 13, lineHeight: 18 }}>
                      <Text style={{ fontWeight: 'bold' }}>Tip:</Text> Si dejas el campo <Text style={{ fontWeight: 'bold' }}>%</Text> vacío al crear notas o categorías, el sistema calculará un promedio parejo de forma automática.
                    </Text>
                  </View>

                  {categoriasAct.map((cat: any) => {
                    const hasSubcats = cat.subcategorias && cat.subcategorias.length > 0;
                    const totalPorcSubcats = hasSubcats ? cat.subcategorias.reduce((acc: number, sub: any) => acc + sub.porcentaje, 0) : 0;
                    return (
                      <View key={cat.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 15, marginBottom: 15 }}>
                        <View style={{ borderBottomWidth: 1, borderBottomColor: isDark ? colors.border : '#f1f5f9', paddingBottom: 10, marginBottom: 10 }}>
                          {editandoCategoriaConfigId === cat.id ? (
                            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                              <TextInput style={[s.input, { flex: 2, marginBottom: 0 }]} value={editCatConfigNombre} onChangeText={setEditCatConfigNombre} />
                              <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={editCatConfigPorc} keyboardType="numeric" onChangeText={setEditCatConfigPorc} />
                              <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 8, height: 40 }} onPress={() => {
                                const porc = parseFloat(editCatConfigPorc.replace(',', '.'));
                                if (!editCatConfigNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Datos inválidos');
                                guardarCategoria(ramoParaNotas.cicloId, ramoAct.id, { ...cat, nombre: editCatConfigNombre, porcentaje: porc });
                                setEditandoCategoriaConfigId(null);
                              }}><Ionicons name="checkmark" size={20} color="white" /></TouchableOpacity>
                            </View>
                          ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <TouchableOpacity style={{ flex: 1 }} onPress={() => { setEditandoCategoriaConfigId(cat.id); setEditCatConfigNombre(cat.nombre); setEditCatConfigPorc(cat.porcentaje.toString()); }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{cat.nombre}</Text>
                                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Ponderación General: {cat.porcentaje}%</Text>
                                {hasSubcats && totalPorcSubcats !== 100 && (
                                  <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}><Ionicons name="warning" size={12} /> Subcategorías suman {totalPorcSubcats}%</Text>
                                )}
                              </TouchableOpacity>
                              <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity style={{ marginRight: 15 }} onPress={() => setCreandoSubParaCatId(cat.id)}><Ionicons name="folder-open-outline" size={20} color={colors.primary} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => eliminarCategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id)}><Ionicons name="trash-outline" size={20} color={colors.danger} /></TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>

                        {creandoSubParaCatId === cat.id && (
                          <View style={{ backgroundColor: isDark ? colors.background : '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 15 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: 6 }}>Añadir Subcategoría a {cat.nombre}</Text>
                            <View style={{ flexDirection: 'row', gap: 5 }}>
                              <TextInput style={[s.input, { flex: 2, paddingVertical: 8, marginBottom: 0, fontSize: 13 }]} placeholderTextColor={colors.textSecondary} placeholder="Ej. Prueba" value={nuevaSubcategoriaNombre} onChangeText={setNuevaSubcategoriaNombre} />
                              <TextInput style={[s.input, { flex: 1, paddingVertical: 8, marginBottom: 0, fontSize: 13 }]} placeholderTextColor={colors.textSecondary} placeholder="% (Opc.)" keyboardType="numeric" value={nuevaSubcategoriaPorcentaje} onChangeText={setNuevaSubcategoriaPorcentaje} />
                              <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8 }} onPress={() => {
                                const porc = parseFloat(nuevaSubcategoriaPorcentaje);
                                if (!nuevaSubcategoriaNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Completa el nombre y un porcentaje válido.');
                                guardarSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, { id: Math.random().toString(), nombre: nuevaSubcategoriaNombre, porcentaje: porc, notas: [] });
                                setNuevaSubcategoriaNombre(''); setNuevaSubcategoriaPorcentaje(''); setCreandoSubParaCatId(null);
                              }}><Ionicons name="checkmark" size={16} color="white" /></TouchableOpacity>
                              <TouchableOpacity style={{ justifyContent: 'center', paddingHorizontal: 5 }} onPress={() => setCreandoSubParaCatId(null)}><Ionicons name="close" size={20} color={colors.textSecondary} /></TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {hasSubcats ? (
                          cat.subcategorias.map((sub: any) => {
                            const subNotasSum = (sub.notas || []).reduce((acc: number, n: any) => acc + (n.porcentaje || 0), 0);
                            const tienePorcentajesSub = (sub.notas || []).some((n: any) => n.porcentaje !== undefined);
                            const tieneNotasSinPorcentaje = (sub.notas || []).some((n: any) => n.porcentaje === undefined);
                            return (
                              <View key={sub.id} style={{ marginLeft: 15, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10, marginBottom: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                  {editandoSubcatConfigId === sub.id ? (
                                    <View style={{ flexDirection: 'row', gap: 5, flex: 1, marginRight: 10 }}>
                                      <TextInput style={[s.input, { flex: 2, marginBottom: 0, paddingVertical: 4, fontSize: 13 }]} value={editSubcatConfigNombre} onChangeText={setEditSubcatConfigNombre} />
                                      <TextInput style={[s.input, { flex: 1, marginBottom: 0, paddingVertical: 4, fontSize: 13 }]} value={editSubcatConfigPorc} keyboardType="numeric" onChangeText={setEditSubcatConfigPorc} />
                                      <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderRadius: 6 }} onPress={() => {
                                        const porc = parseFloat(editSubcatConfigPorc.replace(',', '.'));
                                        if (!editSubcatConfigNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Datos inválidos');
                                        guardarSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, { ...sub, nombre: editSubcatConfigNombre, porcentaje: porc });
                                        setEditandoSubcatConfigId(null);
                                      }}><Ionicons name="checkmark" size={16} color="white" /></TouchableOpacity>
                                    </View>
                                  ) : (
                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                      <View style={{ flex: 1 }}>
                                        <TouchableOpacity onPress={() => { setEditandoSubcatConfigId(sub.id); setEditSubcatConfigNombre(sub.nombre); setEditSubcatConfigPorc(sub.porcentaje.toString()); }}>
                                          <Text style={{ fontWeight: '600', color: colors.textTertiary, fontSize: 14 }}>{sub.nombre} ({sub.porcentaje}%)</Text>
                                        </TouchableOpacity>
                                        {tienePorcentajesSub && subNotasSum !== 100 && !tieneNotasSinPorcentaje && (
                                          <Text style={{ fontSize: 11, color: colors.warning }}><Ionicons name="warning" size={11} /> Notas suman {subNotasSum}%</Text>
                                        )}
                                      </View>
                                      <TouchableOpacity onPress={() => confirmarEliminarSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id, sub.nombre)}>
                                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                                {(sub.notas || []).map((nota: any) => (
                                  <View key={nota.id} style={{ backgroundColor: isDark ? colors.background : '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 4 }}>
                                    {editandoNotaId === nota.id ? (
                                      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <TextInput style={[s.input, { minWidth: 80, maxWidth: 120, marginBottom: 0, paddingVertical: 6, paddingHorizontal: 8, fontSize: 13 }]} value={editNotaDesc} onChangeText={setEditNotaDesc} placeholder="Desc." placeholderTextColor={colors.textSecondary} />
                                        <TextInput style={[s.input, { minWidth: 50, maxWidth: 70, marginBottom: 0, paddingVertical: 6, paddingHorizontal: 5, fontSize: 13, textAlign: 'center' }]} value={editNotaPorc} onChangeText={setEditNotaPorc} placeholder="% (Opc.)" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
                                        <TextInput style={[s.input, { minWidth: 50, maxWidth: 70, marginBottom: 0, paddingVertical: 6, paddingHorizontal: 5, fontSize: 13, textAlign: 'center' }]} value={editNotaValor} onChangeText={setEditNotaValor} placeholder="Nota" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
                                        <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8, paddingVertical: 6 }} onPress={() => {
                                          const valText = editNotaValor.trim();
                                          const val = valText !== '' ? parseFloat(valText.replace(',', '.')) : null;
                                          const porc = editNotaPorc.trim() ? parseFloat(editNotaPorc.replace(',', '.')) : undefined;
                                          if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Nota inválida');
                                          if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido');
                                          actualizarNotaSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id, nota.id, { ...nota, valor: val, descripcion: editNotaDesc, porcentaje: porc });
                                          setEditandoNotaId(null);
                                        }}><Ionicons name="checkmark" size={16} color="white" /></TouchableOpacity>
                                      </View>
                                    ) : (
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <TouchableOpacity style={{ flex: 1, flexDirection: 'row' }} onPress={() => iniciarEdicionNota(nota)}>
                                          <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 13 }}>
                                            {nota.descripcion || 'Sin descripción'} {nota.porcentaje ? ` (${nota.porcentaje}%)` : ''}
                                          </Text>
                                          <Text style={{ fontWeight: 'bold', fontSize: 14, color: nota.valor != null ? getColorNota(nota.valor) : (isSimulando && notaSimulada ? colors.textSecondary : colors.textSecondary), marginRight: 10, fontStyle: isSimulando && nota.valor == null ? 'italic' : 'normal' }}>
                                            {nota.valor != null ? nota.valor.toFixed(1) : (isSimulando && notaSimulada ? notaSimulada.toFixed(1) : '-')}
                                          </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => !isSimulando && confirmarEliminarNotaSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id, nota.id, nota.descripcion)}>
                                          <Ionicons name="trash-outline" size={18} color={isSimulando ? colors.border : colors.textSecondary} />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                ))}
                                {!isSimulando && (
                                  subcategoriaSeleccionadaId === sub.id ? (
                                    <View style={{ flexDirection: 'row', gap: 5, marginTop: 5 }}>
                                      <TextInput style={[s.input, { flex: 2, marginBottom: 0, paddingVertical: 8, fontSize: 13 }]} placeholderTextColor={colors.textSecondary} placeholder="Desc." value={nuevaNotaDesc} onChangeText={setNuevaNotaDesc} />
                                      <TextInput style={[s.input, { flex: 1, marginBottom: 0, paddingVertical: 8, fontSize: 13 }]} placeholderTextColor={colors.textSecondary} placeholder="% (Opc.)" keyboardType="numeric" value={nuevaNotaPorcentaje} onChangeText={setNuevaNotaPorcentaje} />
                                      <TextInput style={[s.input, { flex: 1, marginBottom: 0, paddingVertical: 8, fontSize: 13 }]} placeholderTextColor={colors.textSecondary} placeholder="Nota" keyboardType="numeric" value={nuevaNotaValor} onChangeText={setNuevaNotaValor} />
                                      <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8 }} onPress={() => {
                                        const valText = nuevaNotaValor.trim();
                                        const val = valText !== '' ? parseFloat(valText.replace(',', '.')) : null;
                                        const porc = nuevaNotaPorcentaje.trim() ? parseFloat(nuevaNotaPorcentaje.replace(',', '.')) : undefined;
                                        if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Ingresa una nota válida (entre 1.0 y 7.0)');
                                        if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido.');
                                        agregarNotaSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id, { id: Math.random().toString(), valor: val, descripcion: nuevaNotaDesc, porcentaje: porc });
                                        setNuevaNotaValor(''); setNuevaNotaDesc(''); setNuevaNotaPorcentaje(''); setSubcategoriaSeleccionadaId(null);
                                      }}><Ionicons name="checkmark" size={16} color="white" /></TouchableOpacity>
                                    </View>
                                  ) : (
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingVertical: 4 }} onPress={() => { setSubcategoriaSeleccionadaId(sub.id); setCategoriaSeleccionadaId(null); }}>
                                      <Ionicons name="add" size={14} color={colors.primary} />
                                    </TouchableOpacity>
                                  )
                                )}
                              </View>
                            )
                          })
                        ) : (
                          <View>
                            {(() => {
                              const notasCatSum = (cat.notas || []).reduce((acc: number, n: any) => acc + (n.porcentaje || 0), 0);
                              const tienePorcCat = (cat.notas || []).some((n: any) => n.porcentaje !== undefined);
                              const tieneNotasSinPorcentaje = (cat.notas || []).some((n: any) => n.porcentaje === undefined);
                              if (tienePorcCat && notasCatSum !== 100 && !tieneNotasSinPorcentaje && (cat.notas || []).length > 0) {
                                return <Text style={{ fontSize: 12, color: colors.warning, marginBottom: 10 }}><Ionicons name="warning" size={12} /> Las notas suman {notasCatSum}%</Text>
                              }
                              return null;
                            })()}

                            {(cat.notas || []).length > 0 ? (
                              cat.notas.map((nota: any) => (
                                <View key={nota.id} style={{ backgroundColor: isDark ? colors.background : '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                                  {editandoNotaId === nota.id ? (
                                    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                                      <TextInput style={[s.input, { minWidth: 80, maxWidth: 120, marginBottom: 0, paddingVertical: 6, paddingHorizontal: 8, fontSize: 13 }]} value={editNotaDesc} onChangeText={setEditNotaDesc} placeholder="Desc." placeholderTextColor={colors.textSecondary} />
                                      <TextInput style={[s.input, { minWidth: 50, maxWidth: 70, marginBottom: 0, paddingVertical: 6, paddingHorizontal: 5, fontSize: 13, textAlign: 'center' }]} value={editNotaPorc} onChangeText={setEditNotaPorc} placeholder="% (Opc.)" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
                                      <TextInput style={[s.input, { minWidth: 50, maxWidth: 70, marginBottom: 0, paddingVertical: 6, paddingHorizontal: 5, fontSize: 13, textAlign: 'center' }]} value={editNotaValor} onChangeText={setEditNotaValor} placeholder="Nota" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
                                      <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8, paddingVertical: 6 }} onPress={() => {
                                        const valText = editNotaValor.trim();
                                        const val = valText !== '' ? parseFloat(valText.replace(',', '.')) : null;
                                        const porc = editNotaPorc.trim() ? parseFloat(editNotaPorc.replace(',', '.')) : undefined;
                                        if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Nota inválida');
                                        if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido');
                                        actualizarNota(ramoParaNotas.cicloId, ramoAct.id, cat.id, nota.id, { ...nota, valor: val, descripcion: editNotaDesc, porcentaje: porc });
                                        setEditandoNotaId(null);
                                      }}><Ionicons name="checkmark" size={18} color="white" /></TouchableOpacity>
                                    </View>
                                  ) : (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => iniciarEdicionNota(nota)}>
                                        <Text style={{ flex: 1, color: colors.textSecondary }}>{nota.descripcion || 'Sin descripción'} {nota.porcentaje ? ` (${nota.porcentaje}%)` : ''}</Text>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: nota.valor != null ? getColorNota(nota.valor) : (isSimulando && notaSimulada ? colors.textSecondary : colors.textSecondary), marginRight: 15, fontStyle: isSimulando && nota.valor == null ? 'italic' : 'normal' }}>
                                          {nota.valor != null ? nota.valor.toFixed(1) : (isSimulando && notaSimulada ? notaSimulada.toFixed(1) : '-')}
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => !isSimulando && confirmarEliminarNota(ramoParaNotas.cicloId, ramoAct.id, cat.id, nota.id, nota.descripcion)}>
                                        <Ionicons name="trash-outline" size={20} color={isSimulando ? colors.border : colors.textSecondary} />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              ))
                            ) : (
                              <Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13, marginBottom: 10 }}>No hay notas. Añade notas directas o crea una subcategoría.</Text>
                            )}

                            {!isSimulando && (
                              categoriaSeleccionadaId === cat.id ? (
                                <View style={{ flexDirection: 'row', gap: 5, marginTop: 10 }}>
                                  <TextInput style={[s.input, { flex: 2, marginBottom: 0, paddingVertical: 10 }]} placeholder="Desc. (Ej. Prueba)" placeholderTextColor={colors.textSecondary} value={nuevaNotaDesc} onChangeText={setNuevaNotaDesc} />
                                  <TextInput style={[s.input, { flex: 1, marginBottom: 0, paddingVertical: 10 }]} placeholder="% (Opc.)" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={nuevaNotaPorcentaje} onChangeText={setNuevaNotaPorcentaje} />
                                  <TextInput style={[s.input, { flex: 1, marginBottom: 0, paddingVertical: 10 }]} placeholder="Nota" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={nuevaNotaValor} onChangeText={setNuevaNotaValor} />
                                  <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 10 }} onPress={() => {
                                    const valText = nuevaNotaValor.trim();
                                    const val = valText !== '' ? parseFloat(valText.replace(',', '.')) : null;
                                    const porc = nuevaNotaPorcentaje.trim() ? parseFloat(nuevaNotaPorcentaje.replace(',', '.')) : undefined;
                                    if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Ingresa una nota válida (entre 1.0 y 7.0)');
                                    if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido.');
                                    agregarNota(ramoParaNotas.cicloId, ramoAct.id, cat.id, { id: Math.random().toString(), valor: val, descripcion: nuevaNotaDesc, porcentaje: porc });
                                    setNuevaNotaValor(''); setNuevaNotaDesc(''); setNuevaNotaPorcentaje(''); setCategoriaSeleccionadaId(null);
                                  }}><Ionicons name="checkmark" size={20} color="white" /></TouchableOpacity>
                                </View>
                              ) : (
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }} onPress={() => { setCategoriaSeleccionadaId(cat.id); setSubcategoriaSeleccionadaId(null); }}>
                                  <Ionicons name="add" size={16} color={colors.success} />
                                </TouchableOpacity>
                              )
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}

                  <View style={{ backgroundColor: isDark ? colors.primary + '20' : '#eff6ff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: isDark ? colors.border : '#bfdbfe', marginTop: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: isDark ? colors.text : '#1e40af', marginBottom: 10 }}>Nueva Categoría</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TextInput style={[s.input, { flex: 2, marginBottom: 0 }]} placeholder="Nombre (Ej. Laboratorio)" placeholderTextColor={colors.textSecondary} value={nuevaCategoriaNombre} onChangeText={setNuevaCategoriaNombre} />
                      <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="% (Opc.)" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={nuevaCategoriaPorcentaje} onChangeText={setNuevaCategoriaPorcentaje} />
                      <TouchableOpacity style={{ backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 10 }} onPress={() => {
                        const porc = parseFloat(nuevaCategoriaPorcentaje);
                        if (!nuevaCategoriaNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Completa el nombre y un porcentaje válido (1-100).');
                        guardarCategoria(ramoParaNotas.cicloId, ramoAct.id, { id: Math.random().toString(), nombre: nuevaCategoriaNombre, porcentaje: porc, notas: [] });
                        setNuevaCategoriaNombre(''); setNuevaCategoriaPorcentaje('');
                      }}><Ionicons name="checkmark" size={24} color="white" /></TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ height: 30 }} />
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos Dinámicos (Integrando colores del tema)
// ─────────────────────────────────────────────────────────────────────────────
function buildStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.background },

    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -60 },
    iconoFondo: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyStateTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
    emptyStateDesc: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
    btnIniciarPeriodo: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 16, alignItems: 'center' },
    btnIniciarTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    container: { flex: 1, paddingHorizontal: 20 },

    grupoCiclo: { marginBottom: 25, backgroundColor: colors.surface, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 8, elevation: isDark ? 0 : 4, borderWidth: 1, borderColor: colors.border },
    grupoCicloExpandido: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0 : 0.08, shadowRadius: 12, elevation: isDark ? 0 : 6 },

    tarjetaCiclo: { backgroundColor: 'transparent', borderRadius: 16, padding: 20, zIndex: 10 },
    tarjetaCicloCabeceraAbierta: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
    tarjetaCicloDestacada: { borderColor: colors.primary, borderWidth: 2, borderRadius: 16, backgroundColor: isDark ? colors.surfaceElevated : 'white' },
    tarjetaCicloCerrada: { backgroundColor: 'transparent' },
    cicloHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cicloInfo: { flexDirection: 'row', alignItems: 'center' },
    iconoCicloFondo: { width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? colors.surfaceSubtle : '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
    cicloTextos: { marginLeft: 15 },
    cicloSemestre: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    cicloAño: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },

    indicadorActivo: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.success, marginLeft: 10, borderWidth: 3, borderColor: isDark ? colors.background : '#dcfce7' },
    indicadorInactivo: { backgroundColor: colors.textSecondary, borderColor: colors.border },

    resumenCicloContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border },
    resumenTextoVacio: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
    resumenRamosLista: { flexDirection: 'row', alignItems: 'center' },
    resumenTitulo: { fontSize: 13, fontWeight: 'bold', color: colors.textTertiary, marginRight: 6 },
    resumenNombres: { flex: 1, fontSize: 13, color: colors.text },

    contenidoDesplegable: { paddingTop: 10, paddingBottom: 15, paddingHorizontal: 15, backgroundColor: 'transparent' },

    cicloExpandidoContenido: { marginTop: 15 },
    cicloVacioTexto: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 15, textAlign: 'center' },
    btnLinkAñadir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? colors.primary + '15' : '#eff6ff', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: isDark ? colors.primary + '40' : '#bfdbfe', borderStyle: 'dashed' },
    btnLinkAñadirTexto: { color: colors.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 14 },

    btnColapsar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 15, paddingBottom: 5, marginTop: 5, borderTopWidth: 1, borderTopColor: colors.border },
    btnColapsarTexto: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginRight: 4 },

    tarjeta: { flexDirection: 'row', backgroundColor: isDark ? colors.background : '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between' },
    infoContainer: { flex: 1, paddingRight: 10 },
    tituloFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    tituloRamo: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1 },
    btnOpcionesRamo: { padding: 4, marginLeft: 10 },
    detallesFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    detalleTexto: { fontSize: 13, color: colors.textSecondary },
    etiquetasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    badgeRamo: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeRamoTexto: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    iconosAccion: { flexDirection: 'row', gap: 10, marginTop: 4 },
    miniBoton: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.surfaceElevated : '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    miniBotonTexto: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginLeft: 4 },
    promedioWrapper: { alignItems: 'center', justifyContent: 'center' },
    labelPromedio: { fontSize: 11, fontWeight: 'bold', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 6 },
    circuloNota: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
    notaTexto: { fontSize: 20, fontWeight: 'bold' },

    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, zIndex: 100 },

    modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '90%' },
    modalOverlayCentro: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 },
    modalContentCentro: { backgroundColor: colors.surface, borderRadius: 20, padding: 25 },
    modalTitulo: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    label: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, marginTop: 10 },
    input: { backgroundColor: isDark ? colors.background : '#f1f5f9', borderRadius: 10, padding: 15, fontSize: 16, color: colors.text, marginBottom: 10, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    añosContainer: { flexDirection: 'row', marginBottom: 20, marginTop: 5 },
    añoOption: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: isDark ? colors.background : '#f1f5f9', marginRight: 10, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    añoSelected: { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#eff6ff' },
    añoText: { fontWeight: '600', color: colors.textSecondary, fontSize: 15 },
    añoTextActive: { color: colors.primary },
    periodoSelector: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 5 },
    semestreOption: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: isDark ? colors.background : '#f1f5f9', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    semestreSelected: { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#eff6ff' },
    semestreText: { fontWeight: '600', color: colors.textSecondary },
    semestreTextActive: { color: colors.primary },
    etiquetaInputContainer: { flexDirection: 'row', marginBottom: 10 },
    inputEtiqueta: { flex: 1, backgroundColor: isDark ? colors.background : '#f1f5f9', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, padding: 15, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: isDark ? colors.border : 'transparent' },
    btnAgregarEtiqueta: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderTopRightRadius: 10, borderBottomRightRadius: 10 },
    sugerenciasContainer: { flexDirection: 'row', marginBottom: 15 },
    etiquetaSugerida: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.primary + '20' : '#eff6ff', borderColor: isDark ? colors.primary + '50' : '#bfdbfe', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    etiquetaSugeridaTexto: { fontSize: 13, color: colors.primary, fontWeight: 'bold' },
    etiquetasCreadasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10, marginTop: 5 },
    etiquetaCreada: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    etiquetaCreadaTexto: { fontSize: 13, color: colors.text },
    colorPickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
    colorCirculo: { width: 40, height: 40, borderRadius: 20 },
    colorSeleccionado: { borderWidth: 3, borderColor: colors.text },
    modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    btnCancelar: { padding: 15, borderRadius: 10, marginRight: 10 },
    btnCancelarTexto: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 16 },
    btnGuardar: { backgroundColor: colors.primary, padding: 15, borderRadius: 10, paddingHorizontal: 25 },
    btnGuardarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    opcionesContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0 : 0.1, shadowRadius: 20, elevation: isDark ? 0 : 10, borderWidth: 1, borderColor: colors.border },
    opcionesTitulo: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 15 },
    opcionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    opcionIcono: { marginRight: 15 },
    opcionTexto: { fontSize: 16, fontWeight: '500', color: colors.text },
    opcionSubtexto: { fontSize: 12, color: colors.textSecondary, marginTop: 2 }
  });
}