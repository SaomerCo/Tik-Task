import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { useAppContext } from '../../context/AppContext';

// LayoutAnimation ya no lo usaremos activamente aquí porque migramos a Reanimated, 
// pero lo dejamos por si alguna otra librería lo requiere.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RamosScreen() {
  const { 
    ciclos, crearCiclo, editarCiclo, eliminarCiclo, toggleCicloActivo,
    agregarRamo, actualizarRamo, eliminarRamo,
    guardarCategoria, eliminarCategoria, agregarNota, eliminarNota, actualizarNota,
    guardarSubcategoria, eliminarSubcategoria, agregarNotaSubcategoria, eliminarNotaSubcategoria, actualizarNotaSubcategoria,
    calcularPromedioRamo
  } = useAppContext();

  const añoCalculado = new Date().getFullYear();
  const añosDisponibles = Array.from({ length: añoCalculado - 2015 + 1 }, (_, i) => (añoCalculado - i).toString());

  // --- ESTADOS DE CICLOS ---
  const [ciclosExpandidos, setCiclosExpandidos] = useState<{[key:string]: boolean}>({});
  const [modalPeriodoVisible, setModalPeriodoVisible] = useState(false);
  const [cicloAEditarId, setCicloAEditarId] = useState<string | null>(null);
  const [tempAño, setTempAño] = useState(añoCalculado.toString());
  const [tempSemestre, setTempSemestre] = useState('Primer Semestre');

  // --- ESTADOS DE RAMOS ---
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

  // --- ESTADOS DE MENÚS DESPLEGABLES ---
  const [modalOpcionesCicloVisible, setModalOpcionesCicloVisible] = useState(false);
  const [cicloSeleccionado, setCicloSeleccionado] = useState<any>(null);
  
  const [modalOpcionesRamoVisible, setModalOpcionesRamoVisible] = useState(false);
  const [ramoSeleccionado, setRamoSeleccionado] = useState<any>(null);
  const [modalCopiarRamoVisible, setModalCopiarRamoVisible] = useState(false);

  // --- ESTADOS DE NOTAS ---
  const [modalNotasVisible, setModalNotasVisible] = useState(false);
  const [ramoParaNotas, setRamoParaNotas] = useState<any>(null); // { cicloId, ramo }
  
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

  const simularNotasVacias = (categorias: any, notaBuscada: number) => {
    // Clonación profunda
    const clonarArr = (arr: any) => JSON.parse(JSON.stringify(arr));

    // Determina si hay notas vacías que reemplazar
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
    if (!tieneVacias) return null; // No hay donde simular

    let low = 1.0;
    let high = 7.0;
    let result = null;

    // Búsqueda Binaria de la nota faltante
    for (let i = 0; i < 20; i++) { // ~20 iteraciones son más que suficientes para precisión decimal
        const mid = (low + high) / 2;
        const testCategorias = clonarArr(categorias);

        // Rellenar notas nulas con 'mid'
        testCategorias.forEach((cat: any) => {
            if (cat.subcategorias && cat.subcategorias.length > 0) {
                cat.subcategorias.forEach((sub: any) => {
                    (sub.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = mid; });
                });
            } else {
                (cat.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = mid; });
            }
        });

        const promActual = calcularPromedioRamo(testCategorias);

        if (promActual >= 3.945) { // Aproximación segura para 3.95
            result = mid;
            high = mid; // Buscamos nota más baja posible
        } else {
            low = mid;
        }
    }

    // Comprobar si incluso con 7.0 no es posible
    const maximasCat = clonarArr(categorias);
    maximasCat.forEach((cat: any) => {
        if (cat.subcategorias && cat.subcategorias.length > 0) {
            cat.subcategorias.forEach((sub: any) => {
                (sub.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = 7.0; });
            });
        } else {
            (cat.notas || []).forEach((n: any) => { if (n.valor == null) n.valor = 7.0; });
        }
    });
    
    if (calcularPromedioRamo(maximasCat) < 3.945) {
        return -1; // Imposible
    }

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

  const toggleExpandir = (id: string) => {
    setCiclosExpandidos(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  // --- FUNCIONES DE CICLOS ---
  const abrirModalNuevoCiclo = () => {
    setCicloAEditarId(null);
    setTempAño(añoCalculado.toString());
    setTempSemestre('Primer Semestre');
    setModalPeriodoVisible(true);
  };

  const guardarCiclo = () => {
    if (!tempAño.trim()) return Alert.alert("Error", "Selecciona un año válido.");

    // Validación para evitar ciclos duplicados (mismo año y semestre)
    const cicloExistente = ciclos.find(c => c.año === tempAño && c.semestre === tempSemestre);

    if (cicloAEditarId) {
      if (cicloExistente && cicloExistente.id !== cicloAEditarId) {
        return Alert.alert("No permitido", `Ya existe un ciclo para ${tempSemestre} ${tempAño}.`);
      }
      editarCiclo(cicloAEditarId, tempAño, tempSemestre);
    } else {
      if (cicloExistente) {
        return Alert.alert("No permitido", `Ya existe un ciclo para ${tempSemestre} ${tempAño}.`);
      }
      crearCiclo(tempAño, tempSemestre);
    }
    setModalPeriodoVisible(false);
  };

  const abrirOpcionesCiclo = (ciclo: any) => {
    setCicloSeleccionado(ciclo);
    setModalOpcionesCicloVisible(true);
  };

  const confirmarEliminacionCiclo = () => {
    if (!cicloSeleccionado) return;
    Alert.alert('Eliminar Ciclo', `¿Borrar permanentemente este ciclo y todos sus ramos?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { eliminarCiclo(cicloSeleccionado.id); setModalOpcionesCicloVisible(false); } }
      ]);
  };

  // --- FUNCIONES DE RAMOS ---
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
    setCicloDestinoId(idCiclo);
    setRamoAEditarId(null);
    setNuevoNombre(''); setNuevoProfesor(''); setNuevaSala(''); 
    setNuevoColor('#1a73e8'); setEtiquetasRamo([]); setTextoEtiqueta('');
    setModalVisible(true);
  };

  const abrirFormularioEdicionRamo = () => {
    if (!ramoSeleccionado) return;
    setCicloDestinoId(ramoSeleccionado.cicloId);
    setRamoAEditarId(ramoSeleccionado.ramo.id);
    setNuevoNombre(ramoSeleccionado.ramo.nombre);
    setNuevoProfesor(ramoSeleccionado.ramo.profesor === 'Sin asignar' ? '' : ramoSeleccionado.ramo.profesor);
    setNuevaSala(ramoSeleccionado.ramo.sala === 'Por definir' ? '' : ramoSeleccionado.ramo.sala);
    setNuevoColor(ramoSeleccionado.ramo.colorHex);
    setEtiquetasRamo([...ramoSeleccionado.ramo.etiquetas]);
    setModalOpcionesRamoVisible(false);
    setModalVisible(true);
  };

  const guardarRamo = () => {
    if (nuevoNombre === '') return Alert.alert('Error', 'Ingresa el nombre del ramo.');
    if (!cicloDestinoId) return;
    
    const ramoData = { 
      nombre: nuevoNombre, profesor: nuevoProfesor || 'Sin asignar', 
      sala: nuevaSala || 'Por definir', etiquetas: etiquetasRamo, colorHex: nuevoColor 
    };

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
    <View style={styles.mainContainer}>
      
      {/* HEADER DE LA PANTALLA */}
      <View style={styles.headerContainer}>
        <View style={styles.headerFlex}>
            <View>
                <Text style={styles.tituloPrincipal}>Tus Ramos</Text>
                <Text style={styles.subtitulo}>Expediente Académico</Text>
            </View>
            <TouchableOpacity onPress={abrirModalNuevoCiclo} style={styles.btnAñadirHeader}>
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
        </View>
      </View>

      {ciclos.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.iconoFondo}><Ionicons name="school" size={60} color="#1a73e8" /></View>
          <Text style={styles.emptyStateTitle}>¡Nuevo Semestre!</Text>
          <Text style={styles.emptyStateDesc}>Crea tu primer ciclo académico para comenzar a organizar tus materias.</Text>
          <TouchableOpacity style={styles.btnIniciarPeriodo} onPress={abrirModalNuevoCiclo}>
            <Text style={styles.btnIniciarTexto}>Crear Ciclo</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 8}} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {ciclos.map((ciclo) => {
            const isExpandido = ciclosExpandidos[ciclo.id] !== false; // Abierto por defecto

            return (
              <View key={ciclo.id} style={[styles.grupoCiclo, isExpandido && styles.grupoCicloExpandido]}>
                
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  style={[
                    styles.tarjetaCiclo, 
                    !isExpandido && styles.tarjetaCicloCerrada, 
                    ciclo.activo && styles.tarjetaCicloDestacada,
                    isExpandido && styles.tarjetaCicloCabeceraAbierta // Nuevo estilo para cuando está abierto
                  ]} 
                  onPress={() => toggleExpandir(ciclo.id)}
                >
                  <View style={styles.cicloHeader}>
                    <View style={styles.cicloInfo}>
                      <View style={[styles.iconoCicloFondo, ciclo.activo && {backgroundColor: '#dbeafe'}]}>
                        <Ionicons name="calendar" size={24} color={ciclo.activo ? "#1a73e8" : "#94a3b8"} />
                      </View>
                      <View style={styles.cicloTextos}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.cicloSemestre}>{ciclo.semestre}</Text>
                          <TouchableOpacity 
                            style={[styles.indicadorActivo, !ciclo.activo && styles.indicadorInactivo]} 
                            onPress={(e) => { 
                              e.stopPropagation(); 
                              Alert.alert(
                                ciclo.activo ? 'Ciclo Activo' : 'Ciclo Inactivo', 
                                ciclo.activo 
                                  ? 'Este es tu ciclo académico actual. Aparecerá por defecto en tu Horario.'
                                  : 'Este ciclo no está activo. Puedes marcarlo como activo en las opciones.'
                              ); 
                            }}
                          />
                        </View>
                        <Text style={styles.cicloAño}>Año {ciclo.año}</Text>
                      </View>
                    </View>
                    
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <TouchableOpacity style={{padding: 5}} onPress={(e) => { e.stopPropagation(); abrirOpcionesCiclo(ciclo); }}>
                        <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* VISTA CERRADA (Resumen) */}
                  {!isExpandido && (
                    <View style={styles.resumenCicloContainer}>
                      {ciclo.ramos.length === 0 ? (
                        <Text style={styles.resumenTextoVacio}>Sin ramos inscritos</Text>
                      ) : (
                        <View style={styles.resumenRamosLista}>
                          <Text style={styles.resumenTitulo}>Materias ({ciclo.ramos.length}):</Text>
                          <Text style={styles.resumenNombres} numberOfLines={1}>{ciclo.ramos.map((r: any) => r.nombre).join(', ')}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* VISTA ABIERTA (Botón añadir) */}
                  {isExpandido && (
                    <Animated.View 
                      entering={FadeInUp.duration(300)} 
                      exiting={FadeOutUp.duration(200)} 
                      layout={Layout.springify()} 
                      style={styles.cicloExpandidoContenido}
                    >
                      <TouchableOpacity style={styles.btnLinkAñadir} onPress={() => abrirFormularioRamoLimpio(ciclo.id)}>
                        <Ionicons name="add-circle" size={20} color="#1a73e8" />
                        <Text style={styles.btnLinkAñadirTexto}>Añadir ramo a este ciclo</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </TouchableOpacity>

                {/* LISTA DE RAMOS DEL CICLO (Ahora dentro del mismo grupo) */}
                {isExpandido && (
                  <Animated.View 
                    entering={FadeInUp.duration(400).delay(50)} 
                    exiting={FadeOutUp.duration(200)} 
                    layout={Layout.springify()} 
                    style={styles.contenidoDesplegable}
                  >
                    {ciclo.ramos.length === 0 && <Text style={styles.cicloVacioTexto}>Aún no hay ramos en este ciclo.</Text>}
                    {ciclo.ramos.map((ramo: any) => (
                      <TouchableOpacity key={ramo.id} style={[styles.tarjeta, { borderLeftColor: ramo.colorHex }]}>
                    <View style={styles.infoContainer}>
                      <View style={styles.tituloFila}>
                        <Text style={styles.tituloRamo}>{ramo.nombre}</Text>
                        <TouchableOpacity style={styles.btnOpcionesRamo} onPress={() => { setRamoSeleccionado({ramo, cicloId: ciclo.id}); setModalOpcionesRamoVisible(true); }}>
                          <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.detallesFila}>
                        <Text style={styles.detalleTexto}><Ionicons name="person-outline" size={14} /> {ramo.profesor}</Text>
                        <Text style={styles.detalleTexto}><Ionicons name="location-outline" size={14} /> {ramo.sala}</Text>
                      </View>
                      {ramo.etiquetas?.length > 0 && (
                        <View style={styles.etiquetasContainer}>
                          {ramo.etiquetas.map((tag: string, index: number) => (
                            <View key={index} style={[styles.badgeRamo, { backgroundColor: ramo.colorHex + '15' }]}><Text style={[styles.badgeRamoTexto, { color: ramo.colorHex }]}>{tag}</Text></View>
                          ))}
                        </View>
                      )}
                      <View style={styles.iconosAccion}>
                        <TouchableOpacity style={styles.miniBoton} onPress={() => {
                          setRamoParaNotas({ cicloId: ciclo.id, ramo });
                          setModalNotasVisible(true);
                        }}>
                          <Ionicons name="calculator-outline" size={14} color="#64748b" />
                          <Text style={styles.miniBotonTexto}>Notas</Text>
                        </TouchableOpacity>
                        <View style={styles.miniBoton}><Ionicons name="document-text-outline" size={14} color="#64748b" /><Text style={styles.miniBotonTexto}>Apuntes</Text></View>
                      </View>
                    </View>
                    <View style={styles.promedioWrapper}>
                      <Text style={styles.labelPromedio}>Promedio</Text>
                      <View style={[styles.circuloNota, { borderColor: ramo.promedio === 0 ? '#cbd5e1' : getColorNota(ramo.promedio) }]}>
                        <Text style={[styles.notaTexto, { color: ramo.promedio === 0 ? '#94a3b8' : getColorNota(ramo.promedio) }]}>{ramo.promedio === 0 ? '-' : formatPromedio(ramo.promedio)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.btnColapsar} onPress={() => toggleExpandir(ciclo.id)}>
                      <Text style={styles.btnColapsarTexto}>Ocultar detalles</Text>
                      <Ionicons name="chevron-up" size={18} color="#64748b" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* MODAL: CREAR/EDITAR CICLO */}
      <Modal animationType="fade" transparent={true} visible={modalPeriodoVisible}>
        <View style={styles.modalOverlayCentro}>
          <View style={styles.modalContentCentro}>
            <Text style={styles.modalTitulo}>{cicloAEditarId ? 'Editar Ciclo' : 'Nuevo Ciclo'}</Text>
            <Text style={styles.label}>Año Académico</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.añosContainer}>
              {añosDisponibles.map((año) => (
                <TouchableOpacity key={año} style={[styles.añoOption, tempAño === año && styles.añoSelected]} onPress={() => setTempAño(año)}>
                  <Text style={[styles.añoText, tempAño === año && styles.añoTextActive]}>{año}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Semestre</Text>
            <View style={styles.periodoSelector}>
                {['Primer Semestre', 'Segundo Semestre'].map((s) => (
                    <TouchableOpacity key={s} style={[styles.semestreOption, tempSemestre === s && styles.semestreSelected]} onPress={() => setTempSemestre(s)}>
                        <Text style={[styles.semestreText, tempSemestre === s && styles.semestreTextActive]}>{s}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalPeriodoVisible(false)}><Text style={styles.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarCiclo}><Text style={styles.btnGuardarTexto}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: OPCIONES DEL CICLO */}
      <Modal animationType="fade" transparent={true} visible={modalOpcionesCicloVisible} onRequestClose={() => setModalOpcionesCicloVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayCentro} activeOpacity={1} onPress={() => setModalOpcionesCicloVisible(false)}>
          <View style={styles.opcionesContent}>
            <Text style={styles.opcionesTitulo}>{cicloSeleccionado?.semestre} {cicloSeleccionado?.año}</Text>
            
            <TouchableOpacity style={styles.opcionItem} onPress={() => {
              if (!cicloSeleccionado) return;
              setCicloAEditarId(cicloSeleccionado.id);
              setTempAño(cicloSeleccionado.año);
              setTempSemestre(cicloSeleccionado.semestre);
              setModalOpcionesCicloVisible(false);
              setModalPeriodoVisible(true);
            }}>
              <Ionicons name="pencil-outline" size={20} color="#334155" style={styles.opcionIcono} />
              <Text style={styles.opcionTexto}>Editar Nombre/Año</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.opcionItem} onPress={() => { if (cicloSeleccionado) { toggleCicloActivo(cicloSeleccionado.id); setModalOpcionesCicloVisible(false); } }}>
              <Ionicons name={cicloSeleccionado?.activo ? "power-outline" : "checkmark-circle-outline"} size={20} color={cicloSeleccionado?.activo ? "#f59e0b" : "#10b981"} style={styles.opcionIcono} />
              <View>
                <Text style={styles.opcionTexto}>{cicloSeleccionado?.activo ? 'Marcar como Inactivo' : 'Marcar como Activo'}</Text>
                <Text style={styles.opcionSubtexto}>{cicloSeleccionado?.activo ? 'Ocultar de la pestaña Horario' : 'Hacer que este sea tu ciclo actual'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.opcionItem, { borderBottomWidth: 0 }]} onPress={confirmarEliminacionCiclo}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" style={styles.opcionIcono} />
              <Text style={[styles.opcionTexto, { color: '#ef4444' }]}>Eliminar Ciclo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: OPCIONES DEL RAMO */}
      <Modal animationType="fade" transparent={true} visible={modalOpcionesRamoVisible} onRequestClose={() => setModalOpcionesRamoVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayCentro} activeOpacity={1} onPress={() => setModalOpcionesRamoVisible(false)}>
          <View style={styles.opcionesContent}>
            <Text style={styles.opcionesTitulo}>{ramoSeleccionado?.ramo?.nombre}</Text>
            <TouchableOpacity style={styles.opcionItem} onPress={abrirFormularioEdicionRamo}><Ionicons name="pencil-outline" size={20} color="#334155" style={styles.opcionIcono} /><Text style={styles.opcionTexto}>Editar Ramo</Text></TouchableOpacity>
            <TouchableOpacity style={styles.opcionItem} onPress={() => { setModalOpcionesRamoVisible(false); setModalCopiarRamoVisible(true); }}><Ionicons name="arrow-redo-outline" size={20} color="#10b981" style={styles.opcionIcono} /><Text style={styles.opcionTexto}>Copiar a otro ciclo</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.opcionItem, { borderBottomWidth: 0 }]} onPress={confirmarEliminacionRamo}><Ionicons name="trash-outline" size={20} color="#ef4444" style={styles.opcionIcono} /><Text style={[styles.opcionTexto, { color: '#ef4444' }]}>Eliminar</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: COPIAR RAMO A OTRO CICLO */}
      <Modal animationType="fade" transparent={true} visible={modalCopiarRamoVisible} onRequestClose={() => setModalCopiarRamoVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayCentro} activeOpacity={1} onPress={() => setModalCopiarRamoVisible(false)}>
          <View style={styles.opcionesContent}>
            <Text style={styles.opcionesTitulo}>Copiar a otro ciclo</Text>
            {ciclos.filter((c: any) => c.id !== ramoSeleccionado?.cicloId).length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#64748b', marginVertical: 10 }}>No hay otros ciclos disponibles.</Text>
            ) : (
              ciclos.filter((c: any) => c.id !== ramoSeleccionado?.cicloId).map((cicloDestino: any) => (
                <TouchableOpacity key={cicloDestino.id} style={styles.opcionItem} onPress={() => {
                    if (ramoSeleccionado) {
                      agregarRamo(cicloDestino.id, { ...ramoSeleccionado.ramo, id: Math.random().toString(), promedio: 0.0 });
                      setModalCopiarRamoVisible(false);
                      Alert.alert('Copiado', `El ramo ha sido copiado a ${cicloDestino.semestre} ${cicloDestino.año}.`);
                    }
                }}>
                  <Ionicons name="calendar-outline" size={20} color="#334155" style={styles.opcionIcono} />
                  <View>
                    <Text style={styles.opcionTexto}>{cicloDestino.semestre} {cicloDestino.año}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={[styles.opcionItem, { borderBottomWidth: 0, justifyContent: 'center', marginTop: 10 }]} onPress={() => setModalCopiarRamoVisible(false)}>
              <Text style={{ color: '#64748b', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: FORMULARIO DE RAMOS */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitulo}>{ramoAEditarId ? 'Editar Ramo' : 'Inscribir Ramo'}</Text>
              <Text style={styles.label}>Nombre del Ramo *</Text>
              <TextInput style={styles.input} placeholder="Ej. Álgebra Lineal" value={nuevoNombre} onChangeText={setNuevoNombre} />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Profesor</Text><TextInput style={styles.input} placeholder="Opcional" value={nuevoProfesor} onChangeText={setNuevoProfesor} /></View>
                <View style={{ flex: 1 }}><Text style={styles.label}>Sala</Text><TextInput style={styles.input} placeholder="Opcional" value={nuevaSala} onChangeText={setNuevaSala} /></View>
              </View>
              <Text style={styles.label}>Etiquetas</Text>
              <View style={styles.etiquetaInputContainer}>
                <TextInput style={styles.inputEtiqueta} placeholder="Nueva etiqueta..." value={textoEtiqueta} onChangeText={setTextoEtiqueta} onSubmitEditing={agregarEtiquetaManual} />
                <TouchableOpacity style={styles.btnAgregarEtiqueta} onPress={agregarEtiquetaManual}><Ionicons name="add" size={20} color="white" /></TouchableOpacity>
              </View>
              {etiquetasHistoricas.filter(tag => !etiquetasRamo.includes(tag)).length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sugerenciasContainer}>
                  {etiquetasHistoricas.filter(tag => !etiquetasRamo.includes(tag)).map((tag, index) => (
                    <TouchableOpacity key={index} style={styles.etiquetaSugerida} onPress={() => agregarEtiquetaSugerida(tag)}><Ionicons name="add" size={14} color="#1a73e8" style={{marginRight: 4}} /><Text style={styles.etiquetaSugeridaTexto}>{tag}</Text></TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {etiquetasRamo.length > 0 && (
                <View style={styles.etiquetasCreadasContainer}>
                  {etiquetasRamo.map((tag, index) => (
                    <TouchableOpacity key={index} style={styles.etiquetaCreada} onPress={() => removerEtiqueta(tag)}><Text style={styles.etiquetaCreadaTexto}>{tag}</Text><Ionicons name="close-circle" size={16} color="#64748b" style={{marginLeft: 4}} /></TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.label}>Color del Ramo</Text>
              <View style={styles.colorPickerContainer}>
                {coloresDisponibles.map((color) => (
                  <TouchableOpacity key={color} style={[styles.colorCirculo, { backgroundColor: color }, nuevoColor === color && styles.colorSeleccionado]} onPress={() => setNuevoColor(color)} />
                ))}
              </View>
              <View style={styles.modalBotones}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}><Text style={styles.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnGuardar} onPress={guardarRamo}><Text style={styles.btnGuardarTexto}>Guardar</Text></TouchableOpacity>
              </View>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: GESTIÓN DE NOTAS */}
      <Modal animationType="slide" transparent={true} visible={modalNotasVisible} onRequestClose={() => setModalNotasVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                <Text style={styles.modalTitulo} numberOfLines={1}>{ramoParaNotas?.ramo?.nombre || 'Notas'}</Text>
                <TouchableOpacity onPress={() => setModalNotasVisible(false)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>

            {/* Calcular datos actuales para la vista en vivo */}
            {(() => {
                if (!ramoParaNotas) return null;
                // Buscar el ramo real en el estado de ciclos para tener la información más actual
                const cicloBusqueda = ciclos.find((c:any) => c.id === ramoParaNotas.cicloId);
                const ramoAct = cicloBusqueda?.ramos?.find((r:any) => r.id === ramoParaNotas.ramo.id);
                if (!ramoAct) return null;

                const categoriasAct = ramoAct.categorias || [];
                const porcentajeTotal = categoriasAct.reduce((acc: number, cat: any) => acc + cat.porcentaje, 0);

                return (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* HEADER DE PROMEDIO */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' }}>
                           <View style={{flex: 1}}>
                               <Text style={{fontSize: 14, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase'}}>Promedio Actual</Text>
                               {porcentajeTotal !== 100 && (
                                   <Text style={{fontSize: 12, color: '#f59e0b', marginTop: 4}}><Ionicons name="warning" size={12} /> Las categorías principales suman {porcentajeTotal}%</Text>
                               )}
                           </View>
                           <View style={[styles.circuloNota, { borderColor: ramoAct.promedio === 0 ? '#cbd5e1' : getColorNota(ramoAct.promedio) }]}>
                             <Text style={[styles.notaTexto, { color: ramoAct.promedio === 0 ? '#94a3b8' : getColorNota(ramoAct.promedio) }]}>{ramoAct.promedio === 0 ? '-' : formatPromedio(ramoAct.promedio)}</Text>
                           </View>
                        </View>

                        {/* BOTON DE SIMULAR */}
                        <View style={{ marginBottom: 15, paddingHorizontal: 5 }}>
                            {!isSimulando ? (
                               <TouchableOpacity 
                                   style={{ backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'center', gap: 6 }} 
                                   onPress={() => activarSimulacion(ramoAct.categorias || [])}
                               >
                                   <Ionicons name="calculator-outline" size={18} color="#475569" />
                                   <Text style={{ color: '#475569', fontWeight: 'bold' }}>Simular notas para aprobar</Text>
                               </TouchableOpacity>
                            ) : (
                               <TouchableOpacity 
                                   style={{ backgroundColor: '#fee2e2', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5', flexDirection: 'row', justifyContent: 'center', gap: 6 }} 
                                   onPress={() => { setIsSimulando(false); setNotaSimulada(null); }}
                               >
                                   <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                                   <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Salir de la simulación (Req: {notaSimulada?.toFixed(1)})</Text>
                               </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.label}>Categorías de Evaluación</Text>
                        
                        {/* LISTA DE CATEGORÍAS */}
                        {categoriasAct.map((cat: any) => {
                            const hasSubcats = cat.subcategorias && cat.subcategorias.length > 0;
                            const totalPorcSubcats = hasSubcats ? cat.subcategorias.reduce((acc: number, sub: any) => acc + sub.porcentaje, 0) : 0;

                            return (
                            <View key={cat.id} style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, marginBottom: 15 }}>
                                <View style={{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10, marginBottom: 10 }}>
                                    {editandoCategoriaConfigId === cat.id ? (
                                        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                            <TextInput style={[styles.input, {flex: 2, marginBottom: 0}]} value={editCatConfigNombre} onChangeText={setEditCatConfigNombre} />
                                            <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} value={editCatConfigPorc} keyboardType="numeric" onChangeText={setEditCatConfigPorc} />
                                            <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 8, height: 40 }} onPress={() => {
                                                const porc = parseFloat(editCatConfigPorc.replace(',','.'));
                                                if (!editCatConfigNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Datos inválidos');
                                                guardarCategoria(ramoParaNotas.cicloId, ramoAct.id, { ...cat, nombre: editCatConfigNombre, porcentaje: porc });
                                                setEditandoCategoriaConfigId(null);
                                            }}>
                                                <Ionicons name="checkmark" size={20} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <TouchableOpacity style={{ flex: 1 }} onPress={() => { setEditandoCategoriaConfigId(cat.id); setEditCatConfigNombre(cat.nombre); setEditCatConfigPorc(cat.porcentaje.toString()); }}>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#334155' }}>{cat.nombre}</Text>
                                                <Text style={{ fontSize: 13, color: '#64748b' }}>Ponderación General: {cat.porcentaje}%</Text>
                                                {hasSubcats && totalPorcSubcats !== 100 && (
                                                    <Text style={{fontSize: 12, color: '#f59e0b', marginTop: 2}}><Ionicons name="warning" size={12} /> Subcategorías suman {totalPorcSubcats}%</Text>
                                                )}
                                            </TouchableOpacity>
                                            <View style={{flexDirection: 'row'}}>
                                                <TouchableOpacity style={{marginRight: 15}} onPress={() => setCreandoSubParaCatId(cat.id)}>
                                                    <Ionicons name="folder-open-outline" size={20} color="#1a73e8" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => eliminarCategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id)}>
                                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                                
                                {/* FORMULARIO NUEVA SUBCATEGORÍA INTERNO */}
                                {creandoSubParaCatId === cat.id && (
                                    <View style={{ backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 15 }}>
                                        <Text style={{fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 6}}>Añadir Subcategoría a {cat.nombre}</Text>
                                        <View style={{flexDirection: 'row', gap: 5}}>
                                            <TextInput style={[styles.input, {flex: 2, paddingVertical: 8, marginBottom: 0, fontSize: 13}]} placeholder="Ej. Prueba" value={nuevaSubcategoriaNombre} onChangeText={setNuevaSubcategoriaNombre} />
                                            <TextInput style={[styles.input, {flex: 1, paddingVertical: 8, marginBottom: 0, fontSize: 13}]} placeholder="%" keyboardType="numeric" value={nuevaSubcategoriaPorcentaje} onChangeText={setNuevaSubcategoriaPorcentaje} />
                                            <TouchableOpacity style={{ backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8 }} onPress={() => {
                                                const porc = parseFloat(nuevaSubcategoriaPorcentaje);
                                                if (!nuevaSubcategoriaNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Completa el nombre y un porcentaje válido.');
                                                guardarSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, { id: Math.random().toString(), nombre: nuevaSubcategoriaNombre, porcentaje: porc, notas: [] });
                                                setNuevaSubcategoriaNombre(''); setNuevaSubcategoriaPorcentaje(''); setCreandoSubParaCatId(null);
                                            }}>
                                                <Ionicons name="checkmark" size={16} color="white" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={{ justifyContent: 'center', paddingHorizontal: 5 }} onPress={() => setCreandoSubParaCatId(null)}>
                                                <Ionicons name="close" size={20} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* RENDER SUBCATEGORÍAS */}
                                {hasSubcats ? (
                                    cat.subcategorias.map((sub: any) => {
                                        const subNotasSum = (sub.notas || []).reduce((acc: number, n: any) => acc + (n.porcentaje || 0), 0);
                                        const tienePorcentajesSub = (sub.notas || []).some((n: any) => n.porcentaje !== undefined);
                                        const tieneNotasSinPorcentaje = (sub.notas || []).some((n: any) => n.porcentaje === undefined);

                                        return (
                                        <View key={sub.id} style={{ marginLeft: 15, borderLeftWidth: 2, borderLeftColor: '#e2e8f0', paddingLeft: 10, marginBottom: 15 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                                {editandoSubcatConfigId === sub.id ? (
                                                    <View style={{ flexDirection: 'row', gap: 5, flex: 1, marginRight: 10 }}>
                                                        <TextInput style={[styles.input, {flex: 2, marginBottom: 0, paddingVertical: 4, fontSize: 13}]} value={editSubcatConfigNombre} onChangeText={setEditSubcatConfigNombre} />
                                                        <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 4, fontSize: 13}]} value={editSubcatConfigPorc} keyboardType="numeric" onChangeText={setEditSubcatConfigPorc} />
                                                        <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderRadius: 6 }} onPress={() => {
                                                            const porc = parseFloat(editSubcatConfigPorc.replace(',','.'));
                                                            if (!editSubcatConfigNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Datos inválidos');
                                                            guardarSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, { ...sub, nombre: editSubcatConfigNombre, porcentaje: porc });
                                                            setEditandoSubcatConfigId(null);
                                                        }}>
                                                            <Ionicons name="checkmark" size={16} color="white" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <View style={{ flex: 1 }}>
                                                            <TouchableOpacity onPress={() => { setEditandoSubcatConfigId(sub.id); setEditSubcatConfigNombre(sub.nombre); setEditSubcatConfigPorc(sub.porcentaje.toString()); }}>
                                                                <Text style={{ fontWeight: '600', color: '#475569', fontSize: 14 }}>{sub.nombre} ({sub.porcentaje}%)</Text>
                                                            </TouchableOpacity>
                                                            {tienePorcentajesSub && subNotasSum !== 100 && !tieneNotasSinPorcentaje && (
                                                                <Text style={{fontSize: 11, color: '#f59e0b'}}><Ionicons name="warning" size={11} /> Notas suman {subNotasSum}%</Text>
                                                            )}
                                                        </View>
                                                        <TouchableOpacity onPress={() => eliminarSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id)}>
                                                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                            
                                            {/* NOTAS DE LA SUBCATEGORÍA */}
                                            {(sub.notas || []).map((nota: any) => (
                                                <View key={nota.id} style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 4 }}>
                                                    {editandoNotaId === nota.id ? (
                                                        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                                            <TextInput style={[styles.input, {flex: 2, marginBottom: 0, paddingVertical: 8, fontSize: 13}]} value={editNotaDesc} onChangeText={setEditNotaDesc} placeholder="Desc." />
                                                            <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 8, fontSize: 13}]} value={editNotaPorc} onChangeText={setEditNotaPorc} placeholder="%" keyboardType="numeric" />
                                                            <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 8, fontSize: 13}]} value={editNotaValor} onChangeText={setEditNotaValor} placeholder="Nota" keyboardType="numeric" />
                                                            <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8, height: '100%' }} onPress={() => {
                                                                const valText = editNotaValor.trim();
                                                                const val = valText !== '' ? parseFloat(valText.replace(',','.')) : null;
                                                                const porc = editNotaPorc.trim() ? parseFloat(editNotaPorc.replace(',','.')) : undefined;
                                                                if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Nota inválida');
                                                                if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido');
                                                                actualizarNotaSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id, nota.id, { ...nota, valor: val, descripcion: editNotaDesc, porcentaje: porc });
                                                                setEditandoNotaId(null);
                                                            }}>
                                                                <Ionicons name="checkmark" size={16} color="white" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <TouchableOpacity style={{ flex: 1, flexDirection: 'row' }} onPress={() => iniciarEdicionNota(nota)}>
                                                                <Text style={{ flex: 1, color: '#64748b', fontSize: 13 }}>
                                                                    {nota.descripcion || 'Sin descripción'}
                                                                    {nota.porcentaje ? ` (${nota.porcentaje}%)` : ''}
                                                                </Text>
                                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: nota.valor != null ? getColorNota(nota.valor) : (isSimulando && notaSimulada ? '#94a3b8' : '#94a3b8'), marginRight: 10, fontStyle: isSimulando && nota.valor == null ? 'italic' : 'normal' }}>
                                                                    {nota.valor != null ? nota.valor.toFixed(1) : (isSimulando && notaSimulada ? notaSimulada.toFixed(1) : '-')}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => !isSimulando && eliminarNotaSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id, nota.id)}>
                                                                <Ionicons name="trash-outline" size={18} color={isSimulando ? "#cbd5e1" : "#94a3b8"} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>
                                            ))}

                                            {/* AÑADIR NOTA A SUBCATEGORÍA */}
                                            {!isSimulando && (
                                                subcategoriaSeleccionadaId === sub.id ? (
                                                    <View style={{ flexDirection: 'row', gap: 5, marginTop: 5 }}>
                                                    <TextInput style={[styles.input, {flex: 2, marginBottom: 0, paddingVertical: 8, fontSize: 13}]} placeholder="Desc." value={nuevaNotaDesc} onChangeText={setNuevaNotaDesc} />
                                                    <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 8, fontSize: 13}]} placeholder="Nota" keyboardType="numeric" value={nuevaNotaValor} onChangeText={setNuevaNotaValor} />
                                                    <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 8, fontSize: 13}]} placeholder="%" keyboardType="numeric" value={nuevaNotaPorcentaje} onChangeText={setNuevaNotaPorcentaje} />
                                                    <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8 }} onPress={() => {
                                                        const valText = nuevaNotaValor.trim();
                                                        const val = valText !== '' ? parseFloat(valText.replace(',','.')) : null;
                                                        const porc = nuevaNotaPorcentaje.trim() ? parseFloat(nuevaNotaPorcentaje.replace(',','.')) : undefined;
                                                        if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Ingresa una nota válida (entre 1.0 y 7.0)');
                                                        if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido.');
                                                        agregarNotaSubcategoria(ramoParaNotas.cicloId, ramoAct.id, cat.id, sub.id, { id: Math.random().toString(), valor: val, descripcion: nuevaNotaDesc, porcentaje: porc });
                                                        setNuevaNotaValor(''); setNuevaNotaDesc(''); setNuevaNotaPorcentaje(''); setSubcategoriaSeleccionadaId(null);
                                                    }}>
                                                        <Ionicons name="add" size={16} color="white" />
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingVertical: 4 }} onPress={() => { setSubcategoriaSeleccionadaId(sub.id); setCategoriaSeleccionadaId(null); }}>
                                                    <Ionicons name="add" size={14} color="#1a73e8" />
                                                </TouchableOpacity>
                                                )
                                            )}
                                        </View>
                                    )})
                                ) : (
                                    /* FLUJO CLÁSICO SIN SUBCATEGORÍAS DIRECTO A LA CATEGORÍA */
                                    <View>
                                        {/* ADVERTENCIA DE PORCENTAJES DE NOTAS DIRECTAS */}
                                        {(() => {
                                            const notasCatSum = (cat.notas || []).reduce((acc: number, n: any) => acc + (n.porcentaje || 0), 0);
                                            const tienePorcCat = (cat.notas || []).some((n: any) => n.porcentaje !== undefined);
                                            const tieneNotasSinPorcentaje = (cat.notas || []).some((n: any) => n.porcentaje === undefined);
                                            
                                            // Solo mostrar advertencia si TODAS las notas tienen % y no suma 100
                                            if (tienePorcCat && notasCatSum !== 100 && !tieneNotasSinPorcentaje && (cat.notas || []).length > 0) {
                                                return <Text style={{fontSize: 12, color: '#f59e0b', marginBottom: 10}}><Ionicons name="warning" size={12} /> Las notas de esta categoría suman {notasCatSum}%</Text>
                                            }
                                            return null;
                                        })()}

                                        {/* LISTA DE NOTAS */}
                                        {(cat.notas || []).length > 0 ? (
                                            cat.notas.map((nota: any) => (
                                                <View key={nota.id} style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                                                    {editandoNotaId === nota.id ? (
                                                        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                                            <TextInput style={[styles.input, {flex: 2, marginBottom: 0, paddingVertical: 10}]} value={editNotaDesc} onChangeText={setEditNotaDesc} placeholder="Desc." />
                                                            <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 10}]} value={editNotaPorc} onChangeText={setEditNotaPorc} placeholder="%" keyboardType="numeric" />
                                                            <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 10}]} value={editNotaValor} onChangeText={setEditNotaValor} placeholder="Nota" keyboardType="numeric" />
                                                            <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8, height: '100%' }} onPress={() => {
                                                                const valText = editNotaValor.trim();
                                                                const val = valText !== '' ? parseFloat(valText.replace(',','.')) : null;
                                                                const porc = editNotaPorc.trim() ? parseFloat(editNotaPorc.replace(',','.')) : undefined;
                                                                if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Nota inválida');
                                                                if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido');
                                                                actualizarNota(ramoParaNotas.cicloId, ramoAct.id, cat.id, nota.id, { ...nota, valor: val, descripcion: editNotaDesc, porcentaje: porc });
                                                                setEditandoNotaId(null);
                                                            }}>
                                                                <Ionicons name="checkmark" size={18} color="white" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => iniciarEdicionNota(nota)}>
                                                                <Text style={{ flex: 1, color: '#475569' }}>
                                                                    {nota.descripcion || 'Sin descripción'}
                                                                    {nota.porcentaje ? ` (${nota.porcentaje}%)` : ''}
                                                                </Text>
                                                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: nota.valor != null ? getColorNota(nota.valor) : (isSimulando && notaSimulada ? '#94a3b8' : '#94a3b8'), marginRight: 15, fontStyle: isSimulando && nota.valor == null ? 'italic' : 'normal' }}>
                                                                    {nota.valor != null ? nota.valor.toFixed(1) : (isSimulando && notaSimulada ? notaSimulada.toFixed(1) : '-')}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => !isSimulando && eliminarNota(ramoParaNotas.cicloId, ramoAct.id, cat.id, nota.id)}>
                                                                <Ionicons name="trash-outline" size={20} color={isSimulando ? "#cbd5e1" : "#94a3b8"} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, marginBottom: 10 }}>No hay notas. Añade notas directas o crea una subcategoría.</Text>
                                        )}

                                        {/* AÑADIR NOTA A CATEGORÍA */}
                                        {!isSimulando && (
                                            categoriaSeleccionadaId === cat.id ? (
                                                <View style={{ flexDirection: 'row', gap: 5, marginTop: 10 }}>
                                                <TextInput style={[styles.input, {flex: 2, marginBottom: 0, paddingVertical: 10}]} placeholder="Descripción (Ej. Prueba)" value={nuevaNotaDesc} onChangeText={setNuevaNotaDesc} />
                                                <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 10}]} placeholder="Nota" keyboardType="numeric" value={nuevaNotaValor} onChangeText={setNuevaNotaValor} />
                                                <TextInput style={[styles.input, {flex: 1, marginBottom: 0, paddingVertical: 10}]} placeholder="%" keyboardType="numeric" value={nuevaNotaPorcentaje} onChangeText={setNuevaNotaPorcentaje} />
                                                <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 10 }} onPress={() => {
                                                    const valText = nuevaNotaValor.trim();
                                                    const val = valText !== '' ? parseFloat(valText.replace(',','.')) : null;
                                                    const porc = nuevaNotaPorcentaje.trim() ? parseFloat(nuevaNotaPorcentaje.replace(',','.')) : undefined;
                                                    if (val !== null && (isNaN(val) || val < 1 || val > 7)) return Alert.alert('Error', 'Ingresa una nota válida (entre 1.0 y 7.0)');
                                                    if (porc !== undefined && (isNaN(porc) || porc <= 0 || porc > 100)) return Alert.alert('Error', 'Porcentaje inválido.');
                                                    agregarNota(ramoParaNotas.cicloId, ramoAct.id, cat.id, { id: Math.random().toString(), valor: val, descripcion: nuevaNotaDesc, porcentaje: porc });
                                                    setNuevaNotaValor(''); setNuevaNotaDesc(''); setNuevaNotaPorcentaje(''); setCategoriaSeleccionadaId(null);
                                                }}>
                                                    <Ionicons name="checkmark" size={20} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }} onPress={() => { setCategoriaSeleccionadaId(cat.id); setSubcategoriaSeleccionadaId(null); }}>
                                                <Ionicons name="add" size={16} color="#10b981" />
                                                </TouchableOpacity>
                                            )
                                        )}
                                    </View>
                                )}
                            </View>
                            );
                        })}

                        {/* FORMULARIO NUEVA CATEGORÍA */}
                        <View style={{ backgroundColor: '#eff6ff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 10 }}>
                            <Text style={{fontSize: 14, fontWeight: 'bold', color: '#1e40af', marginBottom: 10}}>Nueva Categoría</Text>
                            <View style={{flexDirection: 'row', gap: 10}}>
                                <TextInput style={[styles.input, {flex: 2, backgroundColor: 'white', marginBottom: 0}]} placeholder="Nombre (Ej. Laboratorio)" value={nuevaCategoriaNombre} onChangeText={setNuevaCategoriaNombre} />
                                <TextInput style={[styles.input, {flex: 1, backgroundColor: 'white', marginBottom: 0}]} placeholder="%" keyboardType="numeric" value={nuevaCategoriaPorcentaje} onChangeText={setNuevaCategoriaPorcentaje} />
                            </View>
                            <TouchableOpacity style={{ backgroundColor: '#1a73e8', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 }} onPress={() => {
                                const porc = parseFloat(nuevaCategoriaPorcentaje);
                                if (!nuevaCategoriaNombre.trim() || isNaN(porc) || porc <= 0 || porc > 100) return Alert.alert('Error', 'Completa el nombre y un porcentaje válido (1-100).');
                                guardarCategoria(ramoParaNotas.cicloId, ramoAct.id, { id: Math.random().toString(), nombre: nuevaCategoriaNombre, porcentaje: porc, notas: [] });
                                setNuevaCategoriaNombre(''); setNuevaCategoriaPorcentaje('');
                            }}>
                                <Text style={{color: 'white', fontWeight: 'bold'}}>Agregar Categoría</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{height: 30}} />
                    </ScrollView>
                );
            })()}

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloPrincipal: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { fontSize: 16, color: '#64748b', marginTop: 4 },
  
  btnAñadirHeader: { backgroundColor: '#1a73e8', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#1a73e8', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 },

  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -60 },
  iconoFondo: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  emptyStateDesc: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  btnIniciarPeriodo: { flexDirection: 'row', backgroundColor: '#1a73e8', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 16, alignItems: 'center' },
  btnIniciarTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1, paddingHorizontal: 20 },
  
  grupoCiclo: { 
    marginBottom: 25,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 4,
    borderWidth: 1, 
    borderColor: '#e2e8f0',
  },
  grupoCicloExpandido: { 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 6, 
  },

  tarjetaCiclo: { 
    backgroundColor: 'transparent',
    borderRadius: 16, 
    padding: 20, 
    zIndex: 10
  },
  tarjetaCicloCabeceraAbierta: { 
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9', 
  },
  tarjetaCicloDestacada: { 
    borderColor: '#bfdbfe', 
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: 'white'
  },
  tarjetaCicloCerrada: { 
    backgroundColor: 'transparent'
  },
  cicloHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cicloInfo: { flexDirection: 'row', alignItems: 'center' },
  iconoCicloFondo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  cicloTextos: { marginLeft: 15 },
  cicloSemestre: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  cicloAño: { fontSize: 14, color: '#64748b', marginTop: 2 },
  
  indicadorActivo: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#10b981', marginLeft: 10, borderWidth: 3, borderColor: '#dcfce7' },
  indicadorInactivo: { backgroundColor: '#cbd5e1', borderColor: '#f1f5f9' },

  resumenCicloContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  resumenTextoVacio: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
  resumenRamosLista: { flexDirection: 'row', alignItems: 'center' },
  resumenTitulo: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginRight: 6 },
  resumenNombres: { flex: 1, fontSize: 13, color: '#334155' },

  contenidoDesplegable: { paddingTop: 10, paddingBottom: 15, paddingHorizontal: 15, backgroundColor: 'transparent' }, // Contenedor principal de los ramos

  cicloExpandidoContenido: { marginTop: 15 },
  cicloVacioTexto: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginBottom: 15, textAlign: 'center' },
  btnLinkAñadir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed' },
  btnLinkAñadirTexto: { color: '#1a73e8', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },

  btnColapsar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 15, paddingBottom: 5, marginTop: 5, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  btnColapsarTexto: { color: '#64748b', fontSize: 14, fontWeight: '600', marginRight: 4 },

  tarjeta: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-between' },
  infoContainer: { flex: 1, paddingRight: 10 },
  tituloFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tituloRamo: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  btnOpcionesRamo: { padding: 4, marginLeft: 10 },
  detallesFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  detalleTexto: { fontSize: 13, color: '#64748b' },
  etiquetasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badgeRamo: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeRamoTexto: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  iconosAccion: { flexDirection: 'row', gap: 10, marginTop: 4 },
  miniBoton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  miniBotonTexto: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginLeft: 4 },
  promedioWrapper: { alignItems: 'center', justifyContent: 'center' },
  labelPromedio: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 },
  circuloNota: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  notaTexto: { fontSize: 20, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '90%' },
  modalOverlayCentro: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 },
  modalContentCentro: { backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 15, fontSize: 16, color: '#334155', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  añosContainer: { flexDirection: 'row', marginBottom: 20, marginTop: 5 },
  añoOption: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f1f5f9', marginRight: 10, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  añoSelected: { borderColor: '#1a73e8', backgroundColor: '#eff6ff' },
  añoText: { fontWeight: '600', color: '#64748b', fontSize: 15 },
  añoTextActive: { color: '#1a73e8' },
  periodoSelector: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 5 },
  semestreOption: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  semestreSelected: { borderColor: '#1a73e8', backgroundColor: '#eff6ff' },
  semestreText: { fontWeight: '600', color: '#64748b' },
  semestreTextActive: { color: '#1a73e8' },
  etiquetaInputContainer: { flexDirection: 'row', marginBottom: 10 },
  inputEtiqueta: { flex: 1, backgroundColor: '#f1f5f9', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, padding: 15, fontSize: 16, color: '#334155' },
  btnAgregarEtiqueta: { backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  sugerenciasContainer: { flexDirection: 'row', marginBottom: 15 },
  etiquetaSugerida: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  etiquetaSugeridaTexto: { fontSize: 13, color: '#1a73e8', fontWeight: 'bold' },
  etiquetasCreadasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10, marginTop: 5 },
  etiquetaCreada: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  etiquetaCreadaTexto: { fontSize: 13, color: '#475569' },
  colorPickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  colorCirculo: { width: 40, height: 40, borderRadius: 20 },
  colorSeleccionado: { borderWidth: 3, borderColor: '#334155' },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  btnCancelar: { padding: 15, borderRadius: 10, marginRight: 10 },
  btnCancelarTexto: { color: '#64748b', fontWeight: 'bold', fontSize: 16 },
  btnGuardar: { backgroundColor: '#1a73e8', padding: 15, borderRadius: 10, paddingHorizontal: 25 },
  btnGuardarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  opcionesContent: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  opcionesTitulo: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 15, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15 },
  opcionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opcionIcono: { marginRight: 15 },
  opcionTexto: { fontSize: 16, fontWeight: '500', color: '#334155' },
  opcionSubtexto: { fontSize: 12, color: '#94a3b8', marginTop: 2 }
});