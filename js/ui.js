// Componentes de interfaz sin dependencias: elementos, formato, avisos, modales,
// formularios, tablas y gráficos de barras.
import { obtenerCatalogo } from './api.js';

/* ------------------------------ Elementos ------------------------------ */

const PROPIEDADES = new Set(['value', 'checked', 'disabled', 'selected', 'hidden']);

export function h(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos || {})) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (clave === 'class') el.className = valor;
    else if (clave.startsWith('on') && typeof valor === 'function') el.addEventListener(clave.slice(2), valor);
    else if (PROPIEDADES.has(clave)) el[clave] = valor;
    else el.setAttribute(clave, valor === true ? '' : valor);
  }
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === undefined || hijo === null || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : String(hijo));
  }
  return el;
}

// Íconos de trazo (24x24). Solo se insertan cadenas fijas de este archivo.
const TRAZOS = {
  gota: '<path d="M12 2.7C8.4 7.6 6 11 6 14.5a6 6 0 0 0 12 0C18 11 15.6 7.6 12 2.7z"/>',
  inicio: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  medidor: '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M8 5.5V3h8v2.5"/>',
  factura: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  pago: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>',
  herramienta: '<path d="M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"/>',
  escudo: '<path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/><path d="M9 12l2 2 4-4"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  grafico: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
  base: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  respaldo: '<path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M12 3v12M7 10l5 5 5-5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  descargar: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  recargar: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
};

export function icono(nombre) {
  const plantilla = document.createElement('template');
  plantilla.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAZOS[nombre] || ''}</svg>`;
  return plantilla.content.firstElementChild;
}

/* ------------------------------- Formato ------------------------------- */

const SIGLAS = { id: 'ID', m3: 'm³', mb: 'MB', dw: 'DW', etl: 'ETL', bd: 'BD' };
const ACENTOS = {
  conexion: 'conexión', identificacion: 'identificación', direccion: 'dirección', telefono: 'teléfono',
  electronico: 'electrónico', emision: 'emisión', metodo: 'método', descripcion: 'descripción',
  ultima: 'última', ultimo: 'último', periodo: 'período', accion: 'acción', anio: 'año',
  dias: 'días', resolucion: 'resolución', politica: 'política', retencion: 'retención',
  ejecucion: 'ejecución', creacion: 'creación', contratacion: 'contratación', instalacion: 'instalación',
  deteccion: 'detección', variacion: 'variación', observacion: 'observación', modulo: 'módulo',
  calculo: 'cálculo', anulacion: 'anulación', duracion: 'duración', tamano: 'tamaño',
  restauracion: 'restauración', recuperacion: 'recuperación', proposito: 'propósito',
  incidencia: 'incidencia', bitacora: 'bitácora', maximo: 'máximo', minimo: 'mínimo',
  ubicacion: 'ubicación', numero: 'número', razon: 'razón', modificacion: 'modificación', solucion: 'solución',
};

/** "fecha_ultima_lectura" -> "Fecha última lectura" */
export function etiquetaDe(campo) {
  const palabras = campo.split('_').filter(Boolean).map((p) => SIGLAS[p] || ACENTOS[p] || p);
  const texto = palabras.join(' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const MONEDA = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 2 });
const NUMERO = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 });
const FECHA = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'UTC' });
const FECHA_HORA = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const ES_FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// La API devuelve las fechas de SQL Server con "Z", pero son la hora local del servidor:
// por eso se formatean en UTC, para mostrar exactamente lo que guarda la base.
function formatearFecha(texto) {
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return texto;
  return /T00:00:00(\.000)?Z$/.test(texto) ? FECHA.format(fecha) : FECHA_HORA.format(fecha);
}

const ES_MONTO = /(^|_)(monto|saldo|pagado|recargos|recaudado|facturado|cobrados)(_|$)/;
const ES_MEDIDA = /(m3|consumo|lectura|porcentaje|_mb$|promedio|horas|dias|variacion)/;

/** Clase CSS de la insignia según el valor de un estado. */
function colorEstado(valor) {
  const v = String(valor).toLowerCase();
  if (/^(activ[oa]|pagada|aplicado|exitos[oa]|resuelta|finalizado|ok|baja)$/.test(v)) return 'verde';
  if (/^(pendiente|en proceso|programado|suspendida|media|medio|solicitada|abierta)$/.test(v)) return 'ambar';
  if (/^(vencida|cortada|dañado|anulado|fallid[oa]|alta|alto|cancelado|crítico|critico|error)$/.test(v)) return 'rojo';
  if (/^(inactiva|sustituido|retirado)$/.test(v)) return '';
  return 'azul';
}

const CAMPOS_INSIGNIA = /^(estado|estado_factura|estado_final|prioridad|nivel|resultado|tipo_abonado)$/;

/** Devuelve { contenido, clase } para mostrar un valor en una celda. */
export function formatearCelda(campo, valor) {
  if (valor === null || valor === undefined || valor === '') return { contenido: '—', clase: '' };
  if (typeof valor === 'boolean') {
    return { contenido: h('span', { class: `insignia ${valor ? 'verde' : ''}` }, valor ? 'Sí' : 'No'), clase: '' };
  }
  if (CAMPOS_INSIGNIA.test(campo)) {
    return { contenido: h('span', { class: `insignia ${colorEstado(valor)}` }, valor), clase: '' };
  }
  if (typeof valor === 'string' && ES_FECHA_ISO.test(valor)) {
    return { contenido: formatearFecha(valor), clase: 'fecha' };
  }
  if (typeof valor === 'number') {
    if (campo.startsWith('id_') || campo === 'anio' || campo === 'mes') return { contenido: String(valor), clase: 'num' };
    if (campo.startsWith('monto') || (ES_MONTO.test(campo) && !ES_MEDIDA.test(campo))) {
      return { contenido: MONEDA.format(valor), clase: 'num' };
    }
    const sufijo = campo.includes('porcentaje') ? ' %' : campo.endsWith('_mb') ? ' MB' : '';
    return { contenido: NUMERO.format(valor) + sufijo, clase: 'num' };
  }
  if (typeof valor === 'object') return { contenido: JSON.stringify(valor), clase: '' };
  const texto = String(valor);
  return { contenido: texto, clase: texto.length > 60 ? 'texto-largo' : '' };
}

export const moneda = (n) => MONEDA.format(Number(n) || 0);
export const numero = (n) => NUMERO.format(Number(n) || 0);

/* -------------------------------- Avisos ------------------------------- */

export function avisar(mensaje, tipo = 'exito') {
  const el = h('div', { class: `aviso ${tipo}`, role: tipo === 'error' ? 'alert' : 'status' }, mensaje);
  document.getElementById('avisos').append(el);
  setTimeout(() => el.remove(), tipo === 'error' ? 7000 : 4000);
}

/* -------------------------------- Modales ------------------------------ */

export function abrirModal(titulo, contenido, { tamano = '', alCerrar } = {}) {
  const dialogo = h('dialog', { class: `modal ${tamano}` },
    h('div', { class: 'modal-cabecera' },
      h('h2', {}, titulo),
      h('button', { class: 'modal-cerrar', type: 'button', 'aria-label': 'Cerrar', onclick: () => cerrar() }, '×')),
    h('div', { class: 'modal-cuerpo' }, contenido));

  function cerrar() {
    dialogo.close();
  }
  dialogo.addEventListener('close', () => {
    dialogo.remove();
    alCerrar?.();
  });
  document.body.append(dialogo);
  dialogo.showModal();

  const cuerpo = dialogo.querySelector('.modal-cuerpo');
  return {
    cerrar,
    reemplazar(nuevo) { cuerpo.replaceChildren(nuevo); },
  };
}

export function confirmar(mensaje, { textoAceptar = 'Confirmar', peligro = false } = {}) {
  return new Promise((resolver) => {
    let respuesta = false;
    const modal = abrirModal('Confirmar', h('div', {},
      h('p', { style: 'margin:0' }, mensaje),
      h('div', { class: 'form-pie' },
        h('button', { class: 'boton', type: 'button', onclick: () => modal.cerrar() }, 'Cancelar'),
        h('button', {
          class: `boton ${peligro ? 'peligro lleno' : 'primario'}`,
          type: 'button',
          onclick: () => { respuesta = true; modal.cerrar(); },
        }, textoAceptar))), { tamano: 'chico', alCerrar: () => resolver(respuesta) });
  });
}

/* ------------------------------ Formularios ---------------------------- */

function valorInicial(campo, valores) {
  let v = valores[campo.nombre];
  if (v === undefined || v === null) v = typeof campo.valor === 'function' ? campo.valor() : campo.valor;
  if (v === undefined || v === null) return campo.tipo === 'checkbox' ? false : '';
  if (campo.tipo === 'date' && typeof v === 'string') return v.slice(0, 10);
  if (campo.tipo === 'datetime-local' && typeof v === 'string') return v.slice(0, 16);
  return v;
}

function textoOpcion(campo, fila) {
  const t = campo.catalogo.texto;
  return typeof t === 'function' ? t(fila) : fila[t];
}

function crearControl(campo, inicial) {
  const comunes = { id: `campo-${campo.nombre}-${Math.random().toString(36).slice(2, 7)}`, name: campo.nombre };

  if (campo.tipo === 'textarea') {
    return h('textarea', { ...comunes, required: campo.requerido, maxlength: campo.max, value: inicial });
  }
  if (campo.tipo === 'checkbox') {
    return h('input', { ...comunes, type: 'checkbox', checked: Boolean(inicial) });
  }
  if (campo.opciones || campo.catalogo) {
    const select = h('select', { ...comunes, required: campo.requerido },
      h('option', { value: '' }, campo.requerido ? 'Seleccione…' : '(Todos)'));
    if (campo.opciones) {
      for (const op of campo.opciones) {
        const [valor, texto] = typeof op === 'string' ? [op, op] : [op.valor, op.texto];
        select.append(h('option', { value: valor, selected: String(valor) === String(inicial) }, texto));
      }
    } else {
      select.disabled = true;
      select.firstChild.textContent = 'Cargando…';
      obtenerCatalogo(campo.catalogo.ruta)
        .then((filas) => {
          const lista = campo.catalogo.filtro ? filas.filter(campo.catalogo.filtro) : filas;
          for (const fila of lista) {
            const valor = fila[campo.catalogo.valor];
            const texto = textoOpcion(campo, fila);
            // textoInicial: preselecciona por texto cuando la fila editada trae el nombre y no el id.
            const elegido = String(valor) === String(inicial) || (campo.textoInicial != null && texto === campo.textoInicial);
            select.append(h('option', { value: valor, selected: elegido }, texto));
          }
          select.firstChild.textContent = campo.requerido ? 'Seleccione…' : '(Todos)';
        })
        .catch((err) => { select.firstChild.textContent = `No se pudo cargar: ${err.message}`; })
        .finally(() => { select.disabled = false; });
    }
    return select;
  }
  return h('input', {
    ...comunes,
    type: campo.tipo || 'text',
    required: campo.requerido,
    value: inicial,
    min: campo.min,
    max: campo.tipo === 'number' || campo.tipo === 'date' ? campo.max : undefined,
    maxlength: campo.tipo === 'number' ? undefined : campo.max,
    step: campo.paso ?? (campo.tipo === 'number' ? 'any' : undefined),
    placeholder: campo.marcador,
    autocomplete: campo.tipo === 'password' ? 'new-password' : 'off',
  });
}

function leerControl(campo, control) {
  if (campo.tipo === 'checkbox') return control.checked;
  const v = control.value.trim();
  if (v === '') return undefined;
  if (campo.tipo === 'number') return Number(v);
  if (campo.tipo === 'datetime-local') return `${v.replace('T', ' ')}:00`;
  if (campo.catalogo && /^\d+$/.test(v)) return Number(v);
  return v;
}

/**
 * Crea un formulario a partir de una lista de campos.
 * campo: { nombre, etiqueta?, tipo?, requerido?, opciones?, catalogo?: {ruta, valor, texto, filtro?},
 *          valor?, ayuda?, ancho?, visibleSi?(valores), min?, max?, paso?, marcador? }
 * Los campos de tipo "oculto" se envían con el valor de `valores` sin mostrarse.
 */
export function formulario(campos, { valores = {}, textoEnviar = 'Guardar', alEnviar, alCancelar, filtros = false } = {}) {
  const controles = [];
  const errorEl = h('div', { class: 'error-form oculto', role: 'alert' });
  const rejilla = h('div', { class: filtros ? 'form-filtros' : 'form-rejilla' });

  for (const campo of campos) {
    if (campo.tipo === 'oculto') continue;
    const control = crearControl(campo, valorInicial(campo, valores));
    const etiqueta = h('label', { for: control.id },
      campo.etiqueta ?? etiquetaDe(campo.nombre),
      campo.requerido ? h('span', { class: 'requerido' }, ' *') : null);
    const contenedor = campo.tipo === 'checkbox'
      ? h('div', { class: 'campo campo-check' }, control, etiqueta)
      : h('div', { class: `campo ${campo.ancho || campo.tipo === 'textarea' ? 'ancho-completo' : ''}` },
        etiqueta, control, campo.ayuda ? h('div', { class: 'ayuda' }, campo.ayuda) : null);
    controles.push({ campo, control, contenedor });
    rejilla.append(contenedor);
  }

  function leer() {
    const datos = {};
    for (const campo of campos) {
      if (campo.tipo === 'oculto' && valores[campo.nombre] !== undefined) datos[campo.nombre] = valores[campo.nombre];
    }
    for (const { campo, control, contenedor } of controles) {
      if (contenedor.classList.contains('oculto')) continue;
      const v = leerControl(campo, control);
      if (v !== undefined) datos[campo.nombre] = v;
    }
    return datos;
  }

  function actualizarVisibles() {
    const actuales = leer();
    for (const { campo, contenedor } of controles) {
      if (campo.visibleSi) contenedor.classList.toggle('oculto', !campo.visibleSi(actuales));
    }
  }

  const enviar = h('button', { class: 'boton primario', type: 'submit' }, textoEnviar);
  const pie = filtros
    ? enviar
    : h('div', { class: 'form-pie' },
      alCancelar ? h('button', { class: 'boton', type: 'button', onclick: alCancelar }, 'Cancelar') : null,
      enviar);

  const form = h('form', { novalidate: false }, rejilla, filtros ? null : pie, errorEl);
  if (filtros) rejilla.append(pie);

  form.addEventListener('input', actualizarVisibles);
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    errorEl.classList.add('oculto');
    enviar.disabled = true;
    const textoOriginal = enviar.textContent;
    enviar.textContent = 'Procesando…';
    try {
      await alEnviar(leer(), form);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('oculto');
    } finally {
      enviar.disabled = false;
      enviar.textContent = textoOriginal;
    }
  });

  actualizarVisibles();
  form.leer = leer;
  return form;
}

/* -------------------------------- Tablas ------------------------------- */

function aCsv(columnas, filas) {
  const escapar = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [columnas.map((c) => escapar(c.etiqueta)).join(','),
    ...filas.map((f) => columnas.map((c) => escapar(f[c.campo])).join(','))].join('\r\n');
}

function descargar(nombre, texto) {
  const url = URL.createObjectURL(new Blob(['﻿', texto], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Tabla con búsqueda, orden por columna, paginación, exportación a CSV y acciones por fila.
 * acciones: [{ texto, peligro?, visible?(fila) }]; alAccion(accion, fila) se llama al hacer clic.
 */
export function tabla(filas, { acciones = [], alAccion, ocultar = [], columnas, porPagina = 25, nombreArchivo = 'datos' } = {}) {
  if (!filas.length) return h('div', { class: 'vacio tabla-envoltura' }, 'No hay registros para mostrar.');

  const cols = (columnas || Object.keys(filas[0]).filter((c) => !ocultar.includes(c)))
    .map((c) => (typeof c === 'string' ? { campo: c, etiqueta: etiquetaDe(c) } : { etiqueta: etiquetaDe(c.campo), ...c }));

  let filtradas = filas;
  let pagina = 0;
  let orden = null;

  const buscador = h('input', { type: 'search', placeholder: 'Buscar en los resultados…', 'aria-label': 'Buscar en los resultados' });
  const cuenta = h('span', { class: 'cuenta' });
  const csv = h('button', { class: 'boton chico', type: 'button', title: 'Descargar CSV' }, icono('descargar'), 'CSV');
  const tbody = h('tbody');
  const thead = h('thead', {}, h('tr', {},
    cols.map((c) => h('th', { onclick: () => ordenar(c.campo), title: 'Ordenar' }, c.etiqueta)),
    acciones.length ? h('th', {}, '') : null));
  const paginacion = h('div', { class: 'paginacion' });

  function ordenar(campo) {
    orden = orden?.campo === campo ? { campo, asc: !orden.asc } : { campo, asc: true };
    aplicar();
  }

  function aplicar() {
    const termino = buscador.value.trim().toLowerCase();
    filtradas = termino
      ? filas.filter((f) => cols.some((c) => String(f[c.campo] ?? '').toLowerCase().includes(termino)))
      : [...filas];
    if (orden) {
      const { campo, asc } = orden;
      filtradas.sort((a, b) => {
        const x = a[campo];
        const y = b[campo];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true });
        return asc ? r : -r;
      });
    }
    pagina = 0;
    pintar();
  }

  function pintar() {
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
    pagina = Math.min(pagina, totalPaginas - 1);
    const visibles = filtradas.slice(pagina * porPagina, (pagina + 1) * porPagina);

    tbody.replaceChildren(...visibles.map((fila) => h('tr', {},
      cols.map((c) => {
        const { contenido, clase } = formatearCelda(c.campo, fila[c.campo]);
        return h('td', { class: clase }, contenido);
      }),
      acciones.length ? h('td', { class: 'acciones' },
        acciones.filter((a) => !a.visible || a.visible(fila)).map((a) =>
          h('button', {
            class: `boton chico ${a.peligro ? 'peligro' : ''}`,
            type: 'button',
            onclick: () => alAccion(a, fila),
          }, a.texto))) : null)));

    if (!visibles.length) {
      tbody.append(h('tr', {}, h('td', { colspan: cols.length + 1, class: 'vacio' }, 'Ningún registro coincide con la búsqueda.')));
    }

    cuenta.textContent = filtradas.length === filas.length
      ? `${filas.length} registro${filas.length === 1 ? '' : 's'}`
      : `${filtradas.length} de ${filas.length} registros`;

    paginacion.replaceChildren();
    if (totalPaginas > 1) {
      paginacion.append(
        h('button', { class: 'boton chico', type: 'button', disabled: pagina === 0, onclick: () => { pagina -= 1; pintar(); } }, 'Anterior'),
        `Página ${pagina + 1} de ${totalPaginas}`,
        h('button', { class: 'boton chico', type: 'button', disabled: pagina >= totalPaginas - 1, onclick: () => { pagina += 1; pintar(); } }, 'Siguiente'));
    }
  }

  buscador.addEventListener('input', aplicar);
  csv.addEventListener('click', () => descargar(`${nombreArchivo}.csv`, aCsv(cols, filtradas)));
  aplicar();

  return h('div', {},
    h('div', { class: 'tabla-barra' }, buscador, cuenta, csv),
    h('div', { class: 'tabla-envoltura' }, h('table', {}, thead, tbody)),
    paginacion);
}

/* --------------------------- Gráfico de barras ------------------------- */

/**
 * Barras horizontales agrupadas.
 * opciones: { etiqueta: campo | (fila) => texto, series: [{ campo, nombre }], formato?: (n) => texto }
 */
export function graficoBarras(filas, { etiqueta, series, formato = numero }) {
  if (!filas.length) return null;
  const textoEtiqueta = typeof etiqueta === 'function' ? etiqueta : (f) => f[etiqueta];
  const maximo = Math.max(1, ...filas.flatMap((f) => series.map((s) => Number(f[s.campo]) || 0)));

  return h('div', { class: 'grafico' },
    series.length > 1
      ? h('div', { class: 'grafico-leyenda' }, series.map((s, i) => h('span', {}, h('i', { class: `serie-${i}` }), s.nombre)))
      : null,
    filas.map((f) => h('div', { class: 'grafico-fila' },
      h('span', { title: textoEtiqueta(f) }, textoEtiqueta(f)),
      h('div', { class: 'grafico-barras' }, series.map((s, i) => {
        const valor = Number(f[s.campo]) || 0;
        return h('div', { class: 'grafico-barra', title: `${s.nombre}: ${formato(valor)}` },
          h('div', { class: `serie-${i}`, style: `width:${(valor / maximo) * 85}%` }),
          formato(valor));
      })))));
}
