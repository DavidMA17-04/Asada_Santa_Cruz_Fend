// Puente para que el motor llame avisos y modales sin pasar hooks.
// Se guarda en globalThis para que HMR de Vite no deje el stub vacío
// (si no, los botones de acción parecen no hacer nada).
const registro = globalThis.__asadaUiRegistro || (globalThis.__asadaUiRegistro = {
  avisar: () => {},
  abrirModal: () => ({ cerrar() {}, reemplazar() {} }),
  confirmar: async () => false,
});

export function registrarUi(fns) {
  Object.assign(registro, fns);
}

export function avisar(mensaje, tipo = 'exito') {
  return registro.avisar(mensaje, tipo);
}

export function abrirModal(titulo, contenido, opciones) {
  return registro.abrirModal(titulo, contenido, opciones);
}

export function confirmar(mensaje, opciones) {
  return registro.confirmar(mensaje, opciones);
}
