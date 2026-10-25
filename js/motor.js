/* Convierte las definiciones de paginas/*.js en pantallas.

   Una página tiene secciones (pestañas). Cada sección es de un tipo:
     consulta    filtros opcionales + GET + tabla con acciones por fila y botones arriba
     formulario  campos + POST/PUT/PATCH
     acciones    solo botones (operaciones sin datos de entrada)

   Una acción (botón de fila o de barra) es:
     { texto, permisos?, metodo? = 'POST', ruta: texto | (fila) => texto,
       campos?: [...] | (fila) => [...], inicial?: (fila) => valores, cuerpo?: (fila) => datos,
       confirmar?: texto | (fila) => texto, peligro?, visible?: (fila) => bool,
       exito?: (respuesta, fila) => texto, mostrarResultado?,
       // solo para metodo 'GET' (abre una tabla en un modal):
       titulo?: (fila) => texto, acciones?: [...] | (fila) => [...], botones?: [...] | (fila) => [...] }

   Los permisos solo deciden qué se muestra: la API los vuelve a verificar en la base. */
import { api, obtener, sesion } from './api.js';
import { h, avisar, abrirModal, confirmar, formulario, tabla, graficoBarras, icono, etiquetaDe } from './ui.js';

const resolver = (valor, ...args) => (typeof valor === 'function' ? valor(...args) : valor);
const permitidos = (lista = []) => lista.filter((x) => sesion.puede(x.permisos || []));
const camposDe = (campos, fila) => permitidos(resolver(campos, fila) || []);

function error(mensaje) {
  return h('div', { class: 'error-form', role: 'alert' }, mensaje);
}

/* ------------------------- Resultado de operaciones ------------------------- */

const TEXTO_SCRIPT = /^(RESTORE|BACKUP|DBCC|ALTER|USE|--)/m;

function bloqueTabla(filas, opciones) {
  // Un único valor largo con instrucciones SQL se muestra como script.
  if (filas.length === 1 && Object.keys(filas[0]).length === 1) {
    const valor = Object.values(filas[0])[0];
    if (typeof valor === 'string' && (valor.length > 120 || TEXTO_SCRIPT.test(valor))) {
      return h('pre', { class: 'script' }, valor);
    }
  }
  return tabla(filas, opciones);
}

function vistaResultado(r, titulos = []) {
  const partes = [];
  const salida = Object.entries(r.salida || {});
  if (salida.length) {
    partes.push(h('div', { class: 'resumen-salida' },
      salida.map(([k, v]) => h('div', {}, etiquetaDe(k), h('b', {}, v === null ? '—' : String(v))))));
  }
  const conjuntos = (r.conjuntos || [r.datos || []]).filter((c) => c.length);
  conjuntos.forEach((filas, i) => {
    if (conjuntos.length > 1 || titulos[i]) partes.push(h('h3', {}, titulos[i] || `Resultado ${i + 1}`));
    partes.push(bloqueTabla(filas, {}));
  });
  if (!partes.length) partes.push(h('p', { class: 'descripcion' }, 'La operación terminó sin datos que mostrar.'));
  return h('div', {}, partes);
}

function mostrarResultado(titulo, r, titulos) {
  abrirModal(titulo, vistaResultado(r, titulos), { tamano: 'ancho' });
}

/* -------------------------------- Acciones -------------------------------- */

export async function ejecutarAccion(accion, fila, recargar) {
  const metodo = accion.metodo || 'POST';
  const ruta = resolver(accion.ruta, fila || {});
  const titulo = resolver(accion.titulo, fila || {}) || accion.texto;

  if (metodo === 'GET') {
    const modal = abrirModal(titulo, h('div', { class: 'cargando' }, 'Cargando…'), { tamano: 'ancho' });
    const cargar = async () => {
      try {
        const r = await obtener(ruta);
        modal.reemplazar(contenidoConsulta({
          ...accion,
          nombreArchivo: titulo,
          acciones: resolver(accion.acciones, fila),
          botones: resolver(accion.botones, fila),
        }, r, () => { cargar(); recargar?.(); }));
      } catch (err) {
        modal.reemplazar(error(err.message));
      }
    };
    cargar();
    return;
  }

  const enviar = async (datos) => {
    const r = await api(metodo, ruta, { ...(accion.cuerpo?.(fila || {}) || {}), ...datos });
    avisar(accion.exito ? accion.exito(r, fila) : 'Operación realizada.');
    if (accion.mostrarResultado) mostrarResultado(titulo, r, accion.titulosResultado);
    recargar?.();
  };

  const campos = camposDe(accion.campos, fila);
  if (campos.length) {
    const modal = abrirModal(titulo, formulario(campos, {
      valores: accion.inicial?.(fila || {}) || {},
      textoEnviar: accion.textoEnviar || accion.texto,
      alCancelar: () => modal.cerrar(),
      alEnviar: async (datos) => {
        await enviar(datos);
        modal.cerrar();
      },
    }));
    return;
  }

  if (accion.confirmar) {
    const ok = await confirmar(resolver(accion.confirmar, fila || {}), { textoAceptar: accion.texto, peligro: accion.peligro });
    if (!ok) return;
  }
  try {
    await enviar({});
  } catch (err) {
    avisar(err.message, 'error');
  }
}

function botonesDe(lista, recargar) {
  return permitidos(lista).map((b) => h('button', {
    class: `boton ${b.primario ? 'primario' : ''} ${b.peligro ? 'peligro' : ''}`,
    type: 'button',
    onclick: () => ejecutarAccion(b, null, recargar),
  }, b.primario ? icono('mas') : null, b.texto));
}

function contenidoConsulta(def, r, recargar) {
  const acciones = permitidos(def.acciones);
  const opciones = {
    acciones,
    alAccion: (a, fila) => ejecutarAccion(a, fila, recargar),
    ocultar: def.ocultar,
    columnas: def.columnas,
    nombreArchivo: String(def.nombreArchivo || def.titulo || 'datos').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-'),
  };
  const partes = [];
  const botones = botonesDe(def.botones || [], recargar);
  if (botones.length && def.metodo === 'GET') partes.push(h('div', { class: 'herramientas', style: 'margin-bottom:14px' }, botones));

  if (def.conjuntos && r.conjuntos) {
    r.conjuntos.forEach((filas, i) => {
      partes.push(h('h3', {}, def.conjuntos[i] || `Resultado ${i + 1}`), bloqueTabla(filas, {}));
    });
  } else {
    if (def.grafico) partes.push(graficoBarras(r.datos, def.grafico));
    partes.push(tabla(r.datos, opciones));
  }
  return h('div', { class: 'modal-cuerpo-interno' }, partes);
}

/* -------------------------------- Secciones ------------------------------- */

function encabezado(sec, herramientas = []) {
  return h('div', { class: 'encabezado-seccion' },
    h('div', {},
      h('h2', {}, sec.titulo),
      sec.descripcion ? h('p', { class: 'descripcion' }, sec.descripcion) : null),
    herramientas.length ? h('div', { class: 'herramientas' }, herramientas) : null);
}

function seccionConsulta(sec) {
  const resultado = h('div', { class: 'resultado' });
  let filtrosActuales = {};

  const cargar = async (filtros = filtrosActuales) => {
    filtrosActuales = filtros;
    resultado.replaceChildren(h('div', { class: 'cargando' }, 'Cargando…'));
    try {
      const r = await obtener(sec.ruta, filtros);
      resultado.replaceChildren(contenidoConsulta(sec, r, () => cargar()));
    } catch (err) {
      resultado.replaceChildren(error(err.message));
    }
  };

  const herramientas = [
    ...botonesDe(sec.botones || [], () => cargar()),
    h('button', { class: 'boton', type: 'button', title: 'Actualizar', onclick: () => cargar() }, icono('recargar'), 'Actualizar'),
  ];

  const campos = camposDe(sec.filtros);
  const filtros = campos.length
    ? formulario(campos, { filtros: true, textoEnviar: 'Buscar', alEnviar: async (datos) => cargar(datos) })
    : null;

  if (sec.cargarAlInicio !== false) cargar(filtros ? filtros.leer() : {});
  else resultado.append(h('p', { class: 'descripcion' }, 'Complete los filtros y presione Buscar.'));

  return h('section', { class: 'tarjeta' }, encabezado(sec, herramientas), filtros, resultado);
}

function seccionFormulario(sec) {
  const contenedor = h('div');

  const nuevo = () => formulario(camposDe(sec.campos), {
    textoEnviar: sec.textoEnviar || 'Guardar',
    alEnviar: async (datos) => {
      const r = await api(sec.metodo || 'POST', resolver(sec.ruta, datos), datos);
      avisar(sec.exito ? sec.exito(r, datos) : 'Registro guardado.');
      if (sec.mostrarResultado) mostrarResultado(sec.titulo, r, sec.titulosResultado);
      if (sec.limpiar !== false) contenedor.replaceChildren(nuevo());
    },
  });

  contenedor.append(nuevo());
  return h('section', { class: 'tarjeta' }, encabezado(sec), contenedor);
}

function seccionAcciones(sec) {
  return h('section', { class: 'tarjeta' }, encabezado(sec),
    h('div', { class: 'herramientas' }, botonesDe(sec.botones || [])));
}

const TIPOS = { consulta: seccionConsulta, formulario: seccionFormulario, acciones: seccionAcciones };

/* --------------------------------- Página --------------------------------- */

const pestanaActiva = new Map();

export function seccionesVisibles(pagina) {
  return pagina.secciones.filter((s) => sesion.puede(s.permisos ?? pagina.permisos ?? []));
}

export function renderPagina(pagina, contenedor) {
  const secciones = seccionesVisibles(pagina);
  if (!secciones.length) {
    contenedor.replaceChildren(h('div', { class: 'tarjeta' }, 'Su rol no tiene acceso a ninguna sección de este módulo.'));
    return;
  }

  let activa = Math.min(pestanaActiva.get(pagina.id) ?? 0, secciones.length - 1);
  const pestanas = h('div', { class: 'pestanas', role: 'tablist' });
  const cuerpo = h('div');

  function mostrar(indice) {
    activa = indice;
    pestanaActiva.set(pagina.id, indice);
    [...pestanas.children].forEach((b, i) => {
      b.classList.toggle('activa', i === indice);
      b.setAttribute('aria-selected', String(i === indice));
    });
    const sec = secciones[indice];
    cuerpo.replaceChildren(TIPOS[sec.tipo || 'consulta'](sec));
  }

  secciones.forEach((sec, i) => pestanas.append(
    h('button', { type: 'button', role: 'tab', onclick: () => mostrar(i) }, sec.pestana || sec.titulo)));

  contenedor.replaceChildren(...(secciones.length > 1 ? [pestanas] : []), cuerpo);
  mostrar(activa);
}
