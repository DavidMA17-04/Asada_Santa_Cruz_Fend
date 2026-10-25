import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { alExpirarSesion, obtener, sesion } from '../api.js';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [actual, setActual] = useState(sesion.actual);
  const [mensajeExpiracion, setMensajeExpiracion] = useState(null);
  const [listo, setListo] = useState(!sesion.actual?.token);

  const guardar = useCallback((datos) => {
    sesion.guardar(datos);
    setActual(datos);
    setMensajeExpiracion(null);
  }, []);

  const borrar = useCallback(() => {
    sesion.borrar();
    setActual(null);
  }, []);

  const puede = useCallback((permisos = []) => {
    if (!permisos.length) return true;
    const propios = actual?.usuario?.permisos || [];
    return permisos.some((p) => propios.includes(p));
  }, [actual]);

  useEffect(() => {
    alExpirarSesion((mensaje) => {
      sesion.borrar();
      setActual(null);
      setMensajeExpiracion(mensaje || 'La sesión expiró. Inicie sesión de nuevo.');
    });
  }, []);

  useEffect(() => {
    if (!sesion.actual?.token) {
      setListo(true);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const r = await obtener('/auth/perfil');
        if (cancelado) return;
        guardar({ ...sesion.actual, usuario: r.datos });
      } catch {
        // 401 ya limpia la sesión; otro error se muestra al usar la app.
      } finally {
        if (!cancelado) setListo(true);
      }
    })();
    return () => { cancelado = true; };
  }, [guardar]);

  const valor = useMemo(() => ({
    actual,
    listo,
    mensajeExpiracion,
    guardar,
    borrar,
    puede,
  }), [actual, listo, mensajeExpiracion, guardar, borrar, puede]);

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return ctx;
}
