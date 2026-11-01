// Puente para que el motor llame avisos, modales y notificaciones globales sin pasar hooks.
const registro = {
  avisar: () => { },
  abrirModal: () => ({ cerrar() { }, reemplazar() { } }),
  confirmar: async () => false,
};

const suscriptoresNotificacion = new Set();

export function registrarUi(fns) {
  Object.assign(registro, fns);
}

export function suscribirNotificaciones(fn) {
  suscriptoresNotificacion.add(fn);
  return () => suscriptoresNotificacion.delete(fn);
}

export function avisar(mensaje, tipo = 'exito', meta = {}) {
  const res = registro.avisar(mensaje, tipo);
  const evento = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mensaje,
    tipo,
    fecha: new Date(),
    ...meta,
  };
  suscriptoresNotificacion.forEach((fn) => {
    try { fn(evento); } catch { /* ignorar */ }
  });
  return res;
}

export function abrirModal(titulo, contenido, opciones) {
  return registro.abrirModal(titulo, contenido, opciones);
}

export function confirmar(mensaje, opciones) {
  return registro.confirmar(mensaje, opciones);
}
