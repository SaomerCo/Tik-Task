import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [actividadesGlobales, setActividadesGlobales] = useState<any[]>([]);
  
  // NUEVO: Memoria global del horario
  const [bloquesHorario, setBloquesHorario] = useState<any[]>([]);

  const crearCiclo = (año: string, semestre: string) => {
    const nuevosCiclos = ciclos.map(c => ({ ...c, activo: false }));
    nuevosCiclos.unshift({ id: Math.random().toString(), año, semestre, activo: true, ramos: [] });
    setCiclos(nuevosCiclos);
  };

  const editarCiclo = (id: string, nuevoAño: string, nuevoSemestre: string) => {
    setCiclos(ciclos.map(c => c.id === id ? { ...c, año: nuevoAño, semestre: nuevoSemestre } : c));
  };

  const eliminarCiclo = (id: string) => setCiclos(ciclos.filter(c => c.id !== id));

  const toggleCicloActivo = (id: string) => {
    setCiclos(ciclos.map(c => ({ ...c, activo: c.id === id ? !c.activo : false })));
  };

  const agregarRamo = (cicloId: string, nuevoRamo: any) => {
    setCiclos(ciclos.map(c => c.id === cicloId ? { ...c, ramos: [...c.ramos, nuevoRamo] } : c));
  };

  const actualizarRamo = (cicloId: string, idRamo: string, ramoActualizado: any) => {
    setCiclos(ciclos.map(c => c.id === cicloId ? { ...c, ramos: c.ramos.map((r:any) => r.id === idRamo ? ramoActualizado : r) } : c));
  };

  const eliminarRamo = (cicloId: string, idRamo: string) => {
    setCiclos(ciclos.map(c => c.id === cicloId ? { ...c, ramos: c.ramos.filter((r:any) => r.id !== idRamo) } : c));
  };

  const agregarActividadGlobal = (nuevaActividad: any) => setActividadesGlobales([...actividadesGlobales, nuevaActividad]);

  // NUEVO: Controladores del Horario
  const agregarBloqueHorario = (bloque: any) => setBloquesHorario([...bloquesHorario, bloque]);
  const eliminarBloqueHorario = (id: string) => setBloquesHorario(bloquesHorario.filter(b => b.id !== id));
  const limpiarBloquesVisibles = (idsALimpiar: string[]) => {
    setBloquesHorario(bloquesHorario.filter(b => !idsALimpiar.includes(b.id)));
  };

  const cicloActivo = ciclos.find(c => c.activo) || null;
  const ramosGlobales = cicloActivo ? cicloActivo.ramos : [];

  return (
    <AppContext.Provider value={{
      ciclos, crearCiclo, editarCiclo, eliminarCiclo, toggleCicloActivo,
      agregarRamo, actualizarRamo, eliminarRamo,
      ramosGlobales, cicloActivo,
      actividadesGlobales, agregarActividadGlobal,
      bloquesHorario, agregarBloqueHorario, eliminarBloqueHorario, limpiarBloquesVisibles
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);