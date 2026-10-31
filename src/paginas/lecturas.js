// Definición compartida del flujo de lecturas (R2 / CU-3.x).
// La usan facturacion.js (oficina) y campo.js (fontanero) para no divergir.
import { C, ESTADOS, fechas } from './comunes.js';
import { numero } from '../ui/formato.js';

/** Unidad de consumo/lectura en el dominio ASADA. */
export const UNIDAD_LECTURA = 'm³';

/**
 * Valor de referencia para validar y mostrar al registrar.
 * Prioridad: última lectura del medidor; si no hay fecha de última lectura,
 * se trata como lectura inicial (fn_ObtenerUltimaLectura usa 0 si está vacío).
 */
export function referenciaLectura(medidor) {
  if (!medidor) return null;
  if (medidor.ultima_lectura === null || medidor.ultima_lectura === undefined) return null;
  const valor = Number(medidor.ultima_lectura);
  if (Number.isNaN(valor)) return null;
  return {
    valor,
    esInicial: !medidor.fecha_ultima_lectura,
    etiqueta: medidor.fecha_ultima_lectura ? 'Lectura anterior' : 'Lectura inicial',
  };
}

export function textoReferenciaLectura(medidor) {
  const ref = referenciaLectura(medidor);
  if (!ref) return 'No hay lectura de referencia disponible para este medidor.';
  return `${ref.etiqueta}: ${numero(ref.valor)} ${UNIDAD_LECTURA}`;
}

export function validarLecturaActual(lecturaActual, medidor) {
  const ref = referenciaLectura(medidor);
  if (!ref) return null;
  const actual = Number(lecturaActual);
  if (Number.isNaN(actual)) return 'Indique la lectura actual.';
  if (actual < ref.valor) {
    return `La lectura actual no puede ser menor que la ${ref.etiqueta.toLowerCase()} (${numero(ref.valor)} ${UNIDAD_LECTURA}).`;
  }
  return null;
}

/** Mensaje de éxito al registrar; distingue si el backend reportó alerta. */
export function exitoLectura(r) {
  const id = r.salida?.id_lectura;
  const consumo = r.salida?.consumo ?? 0;
  const base = `Lectura ${id} registrada. Consumo: ${numero(consumo)} ${UNIDAD_LECTURA}.`;
  if (r.salida?.id_alerta) {
    return `${base} Se generó una alerta de consumo (alerta ${r.salida.id_alerta}).`;
  }
  return base;
}

/**
 * Campos del formulario/modal de registro.
 * @param {{ fechaPorDefecto?: boolean, medidorFila?: object }} [opts]
 */
export function camposRegistroLectura(opts = {}) {
  const fecha = {
    nombre: 'fecha_lectura',
    etiqueta: 'Fecha de la lectura',
    tipo: 'date',
    ayuda: 'Si se deja vacía se usa la fecha de hoy.',
  };
  if (opts.fechaPorDefecto) fecha.valor = fechas.hoy;

  const infoDesdeFila = opts.medidorFila
    ? [{
      tipo: 'info',
      nombre: '_info_ref_lectura',
      etiqueta: referenciaLectura(opts.medidorFila)?.etiqueta || 'Referencia',
      texto: textoReferenciaLectura(opts.medidorFila),
    }]
    : [{
      tipo: 'info',
      nombre: '_info_ref_lectura',
      etiqueta: 'Referencia de lectura',
      desdeCampo: 'id_medidor',
      textoVacio: 'Seleccione un medidor para ver la lectura anterior o inicial.',
      textoDesdeFila: textoReferenciaLectura,
    }];

  return [
    ...infoDesdeFila,
    {
      nombre: 'lectura_actual',
      etiqueta: `Lectura actual (${UNIDAD_LECTURA})`,
      tipo: 'number',
      requerido: true,
      min: 0,
      paso: 'any',
      validar: (valor, valores, contexto = {}) => {
        const medidor = opts.medidorFila
          || contexto.filasCatalogo?.id_medidor?.find((f) => String(f.id_medidor) === String(valores.id_medidor));
        return validarLecturaActual(valor, medidor);
      },
    },
    fecha,
  ];
}

/** Acción "Registrar / Leer" sobre una fila de medidor pendiente. */
export function accionRegistrarLectura({ texto = 'Registrar', permisos }) {
  return {
    texto,
    permisos,
    primario: true,
    ruta: '/lecturas',
    titulo: (f) => `Lectura · ${f.numero_serie}${f.abonado ? ` · ${f.abonado}` : ''}`,
    campos: (f) => camposRegistroLectura({ medidorFila: f, fechaPorDefecto: true }),
    cuerpo: (f) => ({ id_medidor: f.id_medidor }),
    textoEnviar: 'Registrar lectura',
    exito: exitoLectura,
  };
}

/** Catálogo de medidores con última lectura (para el formulario libre). */
export function campoMedidorParaLectura(extra = {}) {
  return {
    nombre: 'id_medidor',
    etiqueta: 'Medidor',
    catalogo: {
      ruta: '/medidores/para-lectura',
      valor: 'id_medidor',
      texto: (f) => `${f.numero_serie} · ${f.abonado || f.ubicacion || `conexión ${f.id_conexion}`}`,
    },
    ...extra,
  };
}

/** Formulario libre: elegir medidor + registrar. */
export function seccionFormularioLectura({ permisos, pestana, titulo, descripcion }) {
  return {
    titulo: titulo || 'Registrar lectura',
    pestana,
    tipo: 'formulario',
    permisos,
    ruta: '/lecturas',
    descripcion,
    campos: [campoMedidorParaLectura({ requerido: true, ancho: true }), ...camposRegistroLectura()],
    textoEnviar: 'Registrar lectura',
    exito: exitoLectura,
  };
}

/** Filtros del historial: catálogos humanos + abonado (tipo_abonado + id_abonado vía abonado_ref). */
export const FILTROS_HISTORIAL_LECTURAS = [
  {
    nombre: 'abonado_ref',
    etiqueta: 'Abonado',
    ancho: true,
    catalogo: {
      ruta: '/abonados/todos',
      valor: (f) => `${f.tipo_abonado}|${f.id_abonado}`,
      texto: (f) => `${f.identificacion} · ${f.nombre_completo}`,
      filtro: (f) => f.activo,
    },
  },
  C.medidor(),
  C.conexion(),
  { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
  { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
];

/** Convierte abonado_ref=FISICO|3 en tipo_abonado + id_abonado para la API. */
export function prepararFiltrosHistorial(filtros = {}) {
  const out = { ...filtros };
  if (out.abonado_ref) {
    const [tipo, id] = String(out.abonado_ref).split('|');
    if (tipo && id) {
      out.tipo_abonado = tipo;
      out.id_abonado = id;
    }
    delete out.abonado_ref;
  }
  return out;
}

/**
 * Columnas del historial: anterior → actual → consumo → fecha primero;
 * sin IDs técnicos; el estado de factura resume si ya se facturó.
 */
export const COLUMNAS_HISTORIAL_LECTURAS = [
  { campo: 'lectura_anterior', etiqueta: `Anterior (${UNIDAD_LECTURA})`, clase: 'num' },
  { campo: 'lectura_actual', etiqueta: `Actual (${UNIDAD_LECTURA})`, clase: 'num' },
  { campo: 'consumo', etiqueta: `Consumo (${UNIDAD_LECTURA})`, clase: 'consumo-destacado' },
  { campo: 'fecha_lectura_actual', etiqueta: 'Fecha' },
  { campo: 'numero_serie', etiqueta: 'Medidor' },
  { campo: 'abonado', etiqueta: 'Abonado' },
  { campo: 'ubicacion', etiqueta: 'Ubicación' },
  { campo: 'estado_factura', etiqueta: 'Factura' },
];

/** Completa el estado de factura para filas aún sin facturar. */
export function enriquecerHistorialLecturas(filas = []) {
  return filas.map((f) => ({
    ...f,
    estado_factura: f.estado_factura || 'Sin factura',
  }));
}

/** Zona de campo = ubicacion de la conexión; serie = numero_serie. */
export function ordenarRutaLectura(filas = []) {
  return [...filas].sort((a, b) => {
    const zonaA = a.ubicacion ?? '';
    const zonaB = b.ubicacion ?? '';
    const porZona = String(zonaA).localeCompare(String(zonaB), 'es', { sensitivity: 'base', numeric: true });
    if (porZona !== 0) return porZona;
    const porSerie = String(a.numero_serie ?? '').localeCompare(String(b.numero_serie ?? ''), 'es', { numeric: true });
    if (porSerie !== 0) return porSerie;
    return (Number(a.id_medidor) || 0) - (Number(b.id_medidor) || 0);
  });
}

export function lecturaFacturada(fila) {
  return fila?.id_factura !== null && fila?.id_factura !== undefined && fila?.id_factura !== '';
}

/** Columnas de la ruta de lectura (sin IDs técnicos). */
export const COLUMNAS_RUTA_LECTURA = [
  { campo: 'ubicacion', etiqueta: 'Zona' },
  { campo: 'numero_serie', etiqueta: 'Medidor' },
  { campo: 'abonado', etiqueta: 'Abonado', clase: 'abonado-corto' },
  { campo: 'ultima_lectura', etiqueta: `Última (${UNIDAD_LECTURA})`, clase: 'num' },
  { campo: 'fecha_ultima_lectura', etiqueta: 'Fecha última' },
  {
    campo: 'dias_sin_lectura',
    etiqueta: 'Días sin lectura',
    clase: (f) => (Number(f.dias_sin_lectura) >= 40 ? 'num dias-atraso' : 'num'),
  },
];

/** Formatea período AAAAMM → AAAA-MM. */
export function enriquecerResumenMensual(filas = []) {
  return filas.map((f) => {
    const bruto = String(f.periodo ?? '');
    const periodo = /^\d{6}$/.test(bruto) ? `${bruto.slice(0, 4)}-${bruto.slice(4)}` : f.periodo;
    return { ...f, periodo };
  });
}

export const COLUMNAS_RESUMEN_MENSUAL = [
  { campo: 'periodo', etiqueta: 'Período' },
  { campo: 'abonado', etiqueta: 'Abonado', clase: 'abonado-corto' },
  { campo: 'id_conexion', etiqueta: 'Conexión', clase: 'num' },
  { campo: 'tipo_tarifa', etiqueta: 'Tarifa' },
  { campo: 'cantidad_lecturas', etiqueta: 'Lecturas', clase: 'num' },
  { campo: 'consumo_m3', etiqueta: `Consumo (${UNIDAD_LECTURA})`, clase: 'consumo-destacado' },
];

/** Filtros de alertas de consumo (API: estado, id_medidor, desde, hasta). */
export const FILTROS_ALERTAS_CONSUMO = [
  { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.alerta, valor: 'Abierta' },
  C.medidor(),
  { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
  { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
];

/**
 * Vista de alertas: prioridad a estado/regla/medidor y a la secuencia
 * anterior → actual → consumo → fecha (sin IDs técnicos al frente).
 */
export const COLUMNAS_ALERTAS_CONSUMO = [
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'nivel', etiqueta: 'Nivel' },
  { campo: 'nombre_regla', etiqueta: 'Regla' },
  { campo: 'numero_serie', etiqueta: 'Medidor' },
  { campo: 'lectura_anterior', etiqueta: `Anterior (${UNIDAD_LECTURA})`, clase: 'num' },
  { campo: 'lectura_actual', etiqueta: `Actual (${UNIDAD_LECTURA})`, clase: 'num' },
  { campo: 'consumo_actual', etiqueta: `Consumo (${UNIDAD_LECTURA})`, clase: 'consumo-destacado' },
  { campo: 'consumo_promedio', etiqueta: `Promedio (${UNIDAD_LECTURA})`, clase: 'num' },
  {
    campo: 'porcentaje_variacion',
    etiqueta: 'Variación %',
    clase: (f) => (Number(f.porcentaje_variacion) >= 50 ? 'num variacion-alta' : 'num'),
  },
  { campo: 'fecha_lectura_actual', etiqueta: 'Lectura' },
  { campo: 'fecha_deteccion', etiqueta: 'Detectada' },
];
