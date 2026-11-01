import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { alExpirarSesion, api, obtener, sesion } from '../api.js';

const SesionContext = createContext(null);

// CU-6.2 1a: la sesión se cierra sola tras este tiempo sin actividad.
const MINUTOS_INACTIVIDAD = Number(import.meta.env.VITE_MINUTOS_INACTIVIDAD || 30);
const EVENTOS_ACTIVIDAD = ['mousedown', 'keydown', 'scroll', 'touchstart'];

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

  // Cierre por inactividad: cualquier clic, tecla o desplazamiento reinicia el contador.
  // Al vencer se avisa a la API (queda en la bitácora y se invalida el token).
  const token = actual?.token;
  useEffect(() => {
    if (!token || !(MINUTOS_INACTIVIDAD > 0)) return undefined;
    let temporizador;
    const vencer = async () => {
      try { await api('POST', '/auth/logout'); } catch { /* el token se descarta igual */ }
      sesion.borrar();
      setActual(null);
      setMensajeExpiracion(`La sesión se cerró por ${MINUTOS_INACTIVIDAD} minutos de inactividad. Inicie sesión de nuevo.`);
    };
    const reiniciar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(vencer, MINUTOS_INACTIVIDAD * 60 * 1000);
    };
    reiniciar();
    EVENTOS_ACTIVIDAD.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    return () => {
      clearTimeout(temporizador);
      EVENTOS_ACTIVIDAD.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, [token]);

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
