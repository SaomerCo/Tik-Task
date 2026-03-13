import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {

  const [ciclos, setCiclos] = useState<any[]>([]);
  const [actividadesGlobales, setActividadesGlobales] = useState<any[]>([]);
  const [bloquesHorario, setBloquesHorario] = useState<any[]>([]);
  const [apuntesGlobales, setApuntesGlobales] = useState<any[]>([]);
  const [eventosGlobales, setEventosGlobales] = useState<any[]>([]);
  const [tareasGlobales, setTareasGlobales] = useState<any[]>([]);

  // NUEVO: Memoria global de Sesiones de Estudio
  const [sesionesEstudio, setSesionesEstudio] = useState<any[]>([]);

  const agregarSesionEstudio = (nuevaSesion: any) => {
    setSesionesEstudio(prev => [nuevaSesion, ...prev]);
  };

  // --- FUNCIONES DE EVENTOS ---
  const agregarEvento = (nuevoEvento: any) => setEventosGlobales([nuevoEvento, ...eventosGlobales]);
  const eliminarEvento = (id: string) => setEventosGlobales(eventosGlobales.filter(e => e.id !== id));
  const editarEvento = (id: string, eventoActualizado: any) => setEventosGlobales(prev => prev.map(ev => ev.id === id ? eventoActualizado : ev));

  // --- FUNCIONES DE APUNTES ---
  const agregarApunte = (nuevoApunte: any) => setApuntesGlobales([nuevoApunte, ...apuntesGlobales]);
  const eliminarApunte = (id: string) => setApuntesGlobales(apuntesGlobales.filter(a => a.id !== id));
  const actualizarApunte = (id: string, datosActualizados: any) => setApuntesGlobales(apuntesGlobales.map(a => a.id === id ? { ...a, ...datosActualizados } : a));

  // --- FUNCIONES DE TAREAS ---
  const agregarTarea = (nuevaTarea: any) => setTareasGlobales([nuevaTarea, ...tareasGlobales]);
  const eliminarTarea = (id: string) => setTareasGlobales(tareasGlobales.filter(t => t.id !== id));
  const toggleCompletarTarea = (id: string) => {
    setTareasGlobales(prev => prev.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
  };
  const actualizarTarea = (id: string, datosActualizados: any) => {
    setTareasGlobales(prev => prev.map(t => t.id === id ? { ...t, ...datosActualizados } : t));
  };

  // --- FUNCIONES DE CICLOS Y HORARIO ---
  const crearCiclo = (año: string, semestre: string) => {
    const nuevosCiclos = ciclos.map(c => ({ ...c, activo: false }));
    nuevosCiclos.unshift({ id: Math.random().toString(), año, semestre, activo: true, ramos: [] });
    setCiclos(nuevosCiclos);
  };

  const editarCiclo = (id: string, nuevoAño: string, nuevoSemestre: string) => setCiclos(ciclos.map(c => c.id === id ? { ...c, año: nuevoAño, semestre: nuevoSemestre } : c));
  const eliminarCiclo = (id: string) => setCiclos(ciclos.filter(c => c.id !== id));
  const toggleCicloActivo = (id: string) => setCiclos(ciclos.map(c => ({ ...c, activo: c.id === id ? !c.activo : false })));

  const agregarRamo = (cicloId: string, nuevoRamo: any) => {
    const ramoConCategorias = { ...nuevoRamo, categorias: nuevoRamo.categorias || [] };
    setCiclos(ciclos.map(c => c.id === cicloId ? { ...c, ramos: [...c.ramos, ramoConCategorias] } : c));
  };

  const actualizarRamo = (cicloId: string, idRamo: string, ramoActualizado: any) => setCiclos(ciclos.map(c => c.id === cicloId ? { ...c, ramos: c.ramos.map((r: any) => r.id === idRamo ? ramoActualizado : r) } : c));
  const eliminarRamo = (cicloId: string, idRamo: string) => setCiclos(ciclos.map(c => c.id === cicloId ? { ...c, ramos: c.ramos.filter((r: any) => r.id !== idRamo) } : c));

  const agregarActividadGlobal = (nuevaActividad: any) => setActividadesGlobales([...actividadesGlobales, nuevaActividad]);

  const agregarBloqueHorario = (bloque: any) => setBloquesHorario([...bloquesHorario, bloque]);
  const eliminarBloqueHorario = (id: string) => setBloquesHorario(bloquesHorario.filter(b => b.id !== id));
  const limpiarBloquesVisibles = (idsALimpiar: string[]) => setBloquesHorario(bloquesHorario.filter(b => !idsALimpiar.includes(b.id)));

  // --- LÓGICA DE NOTAS --- //
  const calcularPromedioRamo = (categorias: any[]) => {
    if (!categorias || categorias.length === 0) return 0;
    let notaAcumulada = 0;
    let porcentajeTotalAplicado = 0;

    categorias.forEach(cat => {
      let promedioCategoria = 0;
      let tieneNotasVálidas = false;

      if (cat.subcategorias && cat.subcategorias.length > 0) {
        let notaAcumSub = 0;
        let porcAcumSub = 0;

        cat.subcategorias.forEach((sub: any) => {
          if (sub.notas && sub.notas.length > 0) {
            let sumSub = 0;
            let porcTotalNotas = 0;
            const notasConPorcentaje = sub.notas.filter((n: any) => n.porcentaje);
            const notasSinPorcentaje = sub.notas.filter((n: any) => !n.porcentaje);
            const porcentajeOcupado = notasConPorcentaje.reduce((acc: number, n: any) => acc + n.porcentaje, 0);
            const porcentajeRestante = Math.max(0, 100 - porcentajeOcupado);
            const porcParaSinPorcentaje = notasSinPorcentaje.length > 0 ? porcentajeRestante / notasSinPorcentaje.length : 0;

            sub.notas.forEach((nota: any) => {
              const porcNota = nota.porcentaje || porcParaSinPorcentaje;
              const valorNota = nota.valor != null ? nota.valor : 1.0;
              sumSub += (valorNota * porcNota) / 100;
              porcTotalNotas += porcNota;
            });

            const promSub = porcTotalNotas > 0 ? (sumSub / porcTotalNotas) * 100 : 0;
            if (porcTotalNotas > 0) {
              notaAcumSub += (promSub * sub.porcentaje) / 100;
              porcAcumSub += sub.porcentaje;
            }
          }
        });

        if (porcAcumSub > 0) {
          promedioCategoria = (notaAcumSub / porcAcumSub) * 100;
          tieneNotasVálidas = true;
        }
      }
      else if (cat.notas && cat.notas.length > 0) {
        let sumNotas = 0;
        let porcTotalNotas = 0;
        const notasConPorcentaje = cat.notas.filter((n: any) => n.porcentaje);
        const notasSinPorcentaje = cat.notas.filter((n: any) => !n.porcentaje);
        const porcentajeOcupado = notasConPorcentaje.reduce((acc: number, n: any) => acc + n.porcentaje, 0);
        const porcentajeRestante = Math.max(0, 100 - porcentajeOcupado);
        const porcParaSinPorcentaje = notasSinPorcentaje.length > 0 ? porcentajeRestante / notasSinPorcentaje.length : 0;

        cat.notas.forEach((nota: any) => {
          const porcNota = nota.porcentaje || porcParaSinPorcentaje;
          const valorNota = nota.valor != null ? nota.valor : 1.0;
          sumNotas += (valorNota * porcNota) / 100;
          porcTotalNotas += porcNota;
        });

        promedioCategoria = porcTotalNotas > 0 ? (sumNotas / porcTotalNotas) * 100 : 0;
        if (porcTotalNotas > 0) tieneNotasVálidas = true;
      }

      if (tieneNotasVálidas) {
        notaAcumulada += (promedioCategoria * cat.porcentaje) / 100;
        porcentajeTotalAplicado += cat.porcentaje;
      }
    });

    if (porcentajeTotalAplicado === 0) return 0;
    const calculo = (notaAcumulada / porcentajeTotalAplicado) * 100;
    return parseFloat(calculo.toFixed(5));
  };

  const guardarCategoria = (cicloId: string, ramoId: string, categoria: any) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const existe = (r.categorias || []).find((cat: any) => cat.id === categoria.id);
              let nuevasCategorias = existe
                ? r.categorias.map((cat: any) => cat.id === categoria.id ? categoria : cat)
                : [...(r.categorias || []), categoria];
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const eliminarCategoria = (cicloId: string, ramoId: string, categoriaId: string) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).filter((cat: any) => cat.id !== categoriaId);
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const agregarNota = (cicloId: string, ramoId: string, categoriaId: string, nota: any) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) return { ...cat, notas: [...(cat.notas || []), nota] };
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const eliminarNota = (cicloId: string, ramoId: string, categoriaId: string, notaId: string) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) return { ...cat, notas: (cat.notas || []).filter((n: any) => n.id !== notaId) };
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const guardarSubcategoria = (cicloId: string, ramoId: string, categoriaId: string, subcategoria: any) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) {
                  const existe = (cat.subcategorias || []).find((sub: any) => sub.id === subcategoria.id);
                  const nuevasSubcat = existe
                    ? cat.subcategorias.map((sub: any) => sub.id === subcategoria.id ? subcategoria : sub)
                    : [...(cat.subcategorias || []), subcategoria];
                  return { ...cat, subcategorias: nuevasSubcat };
                }
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const eliminarSubcategoria = (cicloId: string, ramoId: string, categoriaId: string, subcategoriaId: string) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) {
                  const nuevasSubcat = (cat.subcategorias || []).filter((sub: any) => sub.id !== subcategoriaId);
                  return { ...cat, subcategorias: nuevasSubcat };
                }
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const agregarNotaSubcategoria = (cicloId: string, ramoId: string, categoriaId: string, subcategoriaId: string, nota: any) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) {
                  const nuevasSubcat = (cat.subcategorias || []).map((sub: any) => {
                    if (sub.id === subcategoriaId) return { ...sub, notas: [...(sub.notas || []), nota] };
                    return sub;
                  });
                  return { ...cat, subcategorias: nuevasSubcat };
                }
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const eliminarNotaSubcategoria = (cicloId: string, ramoId: string, categoriaId: string, subcategoriaId: string, notaId: string) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) {
                  const nuevasSubcat = (cat.subcategorias || []).map((sub: any) => {
                    if (sub.id === subcategoriaId) return { ...sub, notas: (sub.notas || []).filter((n: any) => n.id !== notaId) };
                    return sub;
                  });
                  return { ...cat, subcategorias: nuevasSubcat };
                }
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const actualizarNota = (cicloId: string, ramoId: string, categoriaId: string, notaId: string, notaActualizada: any) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) {
                  const nuevasNotas = (cat.notas || []).map((n: any) => n.id === notaId ? notaActualizada : n);
                  return { ...cat, notas: nuevasNotas };
                }
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const actualizarNotaSubcategoria = (cicloId: string, ramoId: string, categoriaId: string, subcategoriaId: string, notaId: string, notaActualizada: any) => {
    setCiclos(ciclosActuales => ciclosActuales.map(c => {
      if (c.id === cicloId) {
        return {
          ...c, ramos: c.ramos.map((r: any) => {
            if (r.id === ramoId) {
              const nuevasCategorias = (r.categorias || []).map((cat: any) => {
                if (cat.id === categoriaId) {
                  const nuevasSubcat = (cat.subcategorias || []).map((sub: any) => {
                    if (sub.id === subcategoriaId) {
                      const nuevasNotas = (sub.notas || []).map((n: any) => n.id === notaId ? notaActualizada : n);
                      return { ...sub, notas: nuevasNotas };
                    }
                    return sub;
                  });
                  return { ...cat, subcategorias: nuevasSubcat };
                }
                return cat;
              });
              return { ...r, categorias: nuevasCategorias, promedio: calcularPromedioRamo(nuevasCategorias) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const cicloActivo = ciclos.find(c => c.activo) || null;
  const ramosGlobales = cicloActivo ? cicloActivo.ramos : [];

  return (
    <AppContext.Provider value={{
      ciclos, crearCiclo, editarCiclo, eliminarCiclo, toggleCicloActivo,
      agregarRamo, actualizarRamo, eliminarRamo,
      guardarCategoria, eliminarCategoria, agregarNota, eliminarNota, actualizarNota,
      guardarSubcategoria, eliminarSubcategoria, agregarNotaSubcategoria, eliminarNotaSubcategoria, actualizarNotaSubcategoria,
      ramosGlobales, cicloActivo,
      actividadesGlobales, agregarActividadGlobal,
      bloquesHorario, agregarBloqueHorario, eliminarBloqueHorario, limpiarBloquesVisibles,
      calcularPromedioRamo,
      apuntesGlobales, agregarApunte, eliminarApunte, actualizarApunte,
      eventosGlobales, agregarEvento, eliminarEvento, editarEvento,
      tareasGlobales, agregarTarea, eliminarTarea, toggleCompletarTarea, actualizarTarea,
      sesionesEstudio, agregarSesionEstudio // <-- AÑADIDO AL CONTEXTO
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);