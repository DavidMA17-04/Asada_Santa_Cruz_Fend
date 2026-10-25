// Puente para que el motor llame avisos y modales sin pasar hooks.
const registro = {
  avisar: () => {},
  abrirModal: () => ({ cerrar() {}, reemplazar() {} }),
  confirmar: async () => false,
};

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
