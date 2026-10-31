// R2 · Lecturas y facturación (CU-3.x) y R9 · alertas de consumo anómalo.
import { P } from '../permisos.js';
import { C, ESTADOS, MESES } from './comunes.js';
import {
  COLUMNAS_ALERTAS_CONSUMO,
  COLUMNAS_HISTORIAL_LECTURAS,
  COLUMNAS_RESUMEN_MENSUAL,
  COLUMNAS_RUTA_LECTURA,
  FILTROS_ALERTAS_CONSUMO,
  FILTROS_HISTORIAL_LECTURAS,
  accionRegistrarLectura,
  enriquecerHistorialLecturas,
  enriquecerResumenMensual,
  lecturaFacturada,
  ordenarRutaLectura,
  prepararFiltrosHistorial,
  seccionFormularioLectura,
} from './lecturas.js';

const CONSULTAR = [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION];
const GESTIONAR = [P.GESTIONAR_FACTURACION];
const LECTURA = [P.REGISTRAR_LECTURA, P.GESTIONAR_FACTURACION];
const VER_FACTURAS = [...CONSULTAR, P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS];
const VER_MEDIDORES = [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS, P.REGISTRAR_LECTURA, P.REGISTRAR_INCIDENCIA, P.CONSULTAR_FACTURAS];

/** Estado visible: usa el de la API o lo deduce por saldo / vencimiento. */
function enriquecerFacturas(filas = []) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return filas.map((f) => {
    const estado = f.estado || f.estado_factura;
    if (estado) return { ...f, estado };
    if (Number(f.saldo) <= 0) return { ...f, estado: 'Pagada' };
    const vence = f.fecha_vencimiento ? new Date(f.fecha_vencimiento) : null;
    if (vence && !Number.isNaN(vence.getTime()) && vence < hoy) return { ...f, estado: 'Vencida' };
    return { ...f, estado: 'Pendiente' };
  });
}

const COLUMNAS_FACTURAS = [
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'id_factura', etiqueta: 'Nº', clase: 'num' },
  { campo: 'abonado', etiqueta: 'Abonado', clase: 'abonado-corto' },
  { campo: 'consumo', etiqueta: 'Consumo (m³)', clase: 'num' },
  { campo: 'monto_total', etiqueta: 'Total', clase: 'num monto-total' },
  { campo: 'recargos', etiqueta: 'Recargos', clase: 'num' },
  { campo: 'pagado', etiqueta: 'Pagado', clase: 'num' },
  {
    campo: 'saldo',
    etiqueta: 'Saldo',
    clase: (f) => (Number(f.saldo) > 0 ? 'num saldo-pendiente' : 'num saldo-cero'),
  },
  { campo: 'fecha_emision', etiqueta: 'Emisión' },
  { campo: 'fecha_vencimiento', etiqueta: 'Vence' },
];

export default {
  id: 'facturacion',
  titulo: 'Lecturas y facturación',
  icono: 'factura',
  permisos: [...VER_FACTURAS, P.REGISTRAR_LECTURA],
  secciones: [
    {
      titulo: 'Medidores sin lectura este mes',
      pestana: 'Ruta de lectura',
      permisos: [...VER_MEDIDORES, P.GESTIONAR_FACTURACION],
      ruta: '/medidores/sin-lectura',
      descripcion: 'Ruta de campo ordenada por zona y serie. Al registrar, el consumo se calcula solo y puede generar una alerta.',
      mensajeVacio: 'Todos los medidores activos ya tienen lectura este mes. Use “Registrar lectura” si necesita cargar uno puntual.',
      transformar: ordenarRutaLectura,
      columnas: COLUMNAS_RUTA_LECTURA,
      acciones: [accionRegistrarLectura({ permisos: LECTURA })],
    },
    seccionFormularioLectura({
      permisos: LECTURA,
      pestana: 'Registrar lectura',
      descripcion: 'Elija el medidor: verá la lectura anterior o inicial antes de guardar.',
    }),
    {
      titulo: 'Historial de consumo',
      pestana: 'Historial de consumo',
      permisos: CONSULTAR,
      ruta: '/lecturas/historial',
      descripcion: 'Consumo por lectura y estado de la factura asociada.',
      filtros: FILTROS_HISTORIAL_LECTURAS,
      prepararFiltros: prepararFiltrosHistorial,
      transformar: enriquecerHistorialLecturas,
      columnas: COLUMNAS_HISTORIAL_LECTURAS,
      acciones: [
        {
          texto: 'Corregir', permisos: GESTIONAR, metodo: 'PUT', primario: true,
          visible: (f) => !lecturaFacturada(f),
          titulo: (f) => `Corregir la lectura ${f.id_lectura}`,
          ruta: (f) => `/lecturas/${f.id_lectura}`,
          campos: (f) => [
            {
              tipo: 'info',
              nombre: '_info_ant',
              etiqueta: 'Lectura anterior',
              texto: f.lectura_anterior == null ? '—' : `${f.lectura_anterior} m³`,
            },
            {
              nombre: 'lectura_actual_nueva',
              etiqueta: 'Lectura correcta (m³)',
              tipo: 'number',
              requerido: true,
              min: 0,
              paso: 'any',
              validar: (valor) => {
                if (f.lectura_anterior == null) return null;
                if (Number(valor) < Number(f.lectura_anterior)) {
                  return `La lectura actual no puede ser menor que la lectura anterior (${f.lectura_anterior}).`;
                }
                return null;
              },
            },
            { nombre: 'motivo', etiqueta: 'Motivo de la corrección', tipo: 'textarea', requerido: true, max: 250 },
          ],
          inicial: (f) => ({ lectura_actual_nueva: f.lectura_actual }),
          exito: () => 'Lectura corregida.',
        },
        {
          texto: 'Facturar', permisos: GESTIONAR, metodo: 'POST', primario: true,
          visible: (f) => !lecturaFacturada(f),
          titulo: (f) => `Generar factura de la lectura ${f.id_lectura}`,
          ruta: '/facturas',
          campos: [{ nombre: 'dias_plazo', etiqueta: 'Días de plazo', tipo: 'number', min: 1, ayuda: 'Vacío = plazo por defecto.' }],
          cuerpo: (f) => ({ id_lectura: f.id_lectura }),
          exito: (r) => `Factura ${r.salida?.id_factura} generada.`,
        },
        {
          texto: 'Evaluar', permisos: GESTIONAR, metodo: 'POST', suave: true,
          titulo: (f) => `Evaluar consumo · lectura ${f.id_lectura}`,
          ruta: (f) => `/alertas/detectar/${f.id_lectura}`,
          confirmar: (f) => `¿Evaluar el consumo de la lectura ${f.id_lectura} contra las reglas de alerta?`,
          exito: (r) => (r.salida?.id_alerta ? `Se generó la alerta ${r.salida.id_alerta}.` : 'La lectura no presenta consumo anómalo.'),
        },
      ],
    },
    {
      titulo: 'Facturas',
      permisos: VER_FACTURAS,
      ruta: '/facturas',
      descripcion: 'Emitidas, con montos, pagos, recargos y saldo.',
      filtros: [
        { nombre: 'periodo', etiqueta: 'Período', marcador: 'AAAAMM', max: 6, ayuda: 'Ejemplo: 202610' },
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.factura },
        C.conexion(),
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
      ],
      prepararFiltros: prepararFiltrosHistorial,
      transformar: enriquecerFacturas,
      columnas: COLUMNAS_FACTURAS,
      botones: [{
        texto: 'Marcar vencidas',
        permisos: [P.GESTIONAR_FACTURACION, P.GESTIONAR_PAGOS],
        metodo: 'POST',
        ruta: '/facturas/marcar-vencidas',
        confirmar: 'Las facturas pendientes cuyo plazo ya terminó pasarán a "Vencida". ¿Continuar?',
        exito: (r) => `${r.salida?.facturas_vencidas ?? 0} facturas marcadas como vencidas.`,
      }],
      acciones: [{
        texto: 'Ver saldo', metodo: 'GET', suave: true,
        titulo: (f) => `Saldo · factura ${f.id_factura}`,
        ruta: (f) => `/facturas/${f.id_factura}/saldo`,
      }],
    },
    {
      titulo: 'Facturación mensual',
      pestana: 'Facturación mensual',
      tipo: 'formulario',
      permisos: GESTIONAR,
      metodo: 'POST',
      ruta: '/facturas/ciclo-mensual',
      descripcion: 'Genera de una vez las facturas de todas las lecturas del mes aún sin facturar.',
      campos: [
        { nombre: 'anio', etiqueta: 'Año', tipo: 'number', requerido: true, min: 2000, valor: () => new Date().getFullYear() },
        { nombre: 'mes', etiqueta: 'Mes', requerido: true, opciones: MESES, valor: () => new Date().getMonth() + 1 },
        { nombre: 'dias_plazo', etiqueta: 'Días de plazo', tipo: 'number', min: 1, ayuda: 'Vacío = plazo por defecto.' },
      ],
      textoEnviar: 'Generar facturas',
      exito: (r) => `Se generaron ${r.salida?.facturas_generadas ?? 0} facturas.`,
    },
    {
      titulo: 'Consumo mensual por conexión',
      pestana: 'Resumen mensual',
      permisos: CONSULTAR,
      ruta: '/lecturas/resumen-mensual',
      descripcion: 'Consumo acumulado por conexión y período de facturación.',
      transformar: enriquecerResumenMensual,
      columnas: COLUMNAS_RESUMEN_MENSUAL,
    },
    {
      titulo: 'Alertas de consumo anómalo',
      pestana: 'Alertas de consumo',
      permisos: CONSULTAR,
      ruta: '/alertas',
      descripcion: 'Saltos de consumo frente a las reglas de Catálogos. Revise antes de resolver.',
      filtros: FILTROS_ALERTAS_CONSUMO,
      columnas: COLUMNAS_ALERTAS_CONSUMO,
      acciones: [{
        texto: 'Resolver', permisos: GESTIONAR, metodo: 'PATCH', primario: true,
        visible: (f) => f.estado === 'Abierta',
        ruta: (f) => `/alertas/${f.id_alerta}`,
        cuerpo: () => ({ estado: 'Resuelta' }),
        confirmar: (f) => `¿Marcar como resuelta la alerta "${f.nombre_regla || 'consumo'}" del medidor ${f.numero_serie}? (consumo ${f.consumo_actual} m³, +${f.porcentaje_variacion}%)`,
        exito: () => 'Alerta resuelta.',
      }, {
        texto: 'Anotar', permisos: GESTIONAR, metodo: 'PATCH', suave: true,
        visible: (f) => f.estado === 'Abierta',
        titulo: (f) => `Anotar · ${f.nombre_regla || 'consumo'} · ${f.numero_serie}`,
        ruta: (f) => `/alertas/${f.id_alerta}`,
        campos: (f) => [
          {
            tipo: 'info',
            nombre: '_resumen_alerta',
            etiqueta: 'Consumo detectado',
            texto: [
              `Medidor ${f.numero_serie}`,
              `anterior ${f.lectura_anterior} → actual ${f.lectura_actual} m³`,
              `consumo ${f.consumo_actual} m³ (promedio ${f.consumo_promedio} m³, +${f.porcentaje_variacion}%)`,
            ].join(' · '),
          },
          {
            tipo: 'info',
            nombre: '_obs_previa',
            etiqueta: 'Notas previas',
            texto: f.observacion || 'Sin observaciones todavía.',
          },
          { nombre: 'estado', etiqueta: 'Estado', requerido: true, opciones: ESTADOS.alerta },
          { nombre: 'id_incidencia', etiqueta: 'Incidencia relacionada (opcional)', tipo: 'number', min: 1 },
          { nombre: 'observacion', etiqueta: 'Nueva observación', tipo: 'textarea', max: 250, ancho: true, marcador: 'Opcional' },
        ],
        inicial: () => ({ estado: 'Resuelta' }),
        textoEnviar: 'Guardar',
        exito: () => 'Alerta actualizada.',
      }, {
        texto: 'Reabrir', permisos: GESTIONAR, metodo: 'PATCH', suave: true,
        visible: (f) => f.estado === 'Resuelta',
        ruta: (f) => `/alertas/${f.id_alerta}`,
        cuerpo: () => ({ estado: 'Abierta' }),
        confirmar: (f) => `¿Reabrir la alerta del medidor ${f.numero_serie}?`,
        exito: () => 'Alerta reabierta.',
      }],
    },
  ],
};
