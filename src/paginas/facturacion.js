// R2 · Lecturas y facturación (CU-3.x) y R9 · alertas de consumo anómalo.
import { P } from '../permisos.js';
import { C, ESTADOS, MESES } from './comunes.js';

const CONSULTAR = [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION];
const GESTIONAR = [P.GESTIONAR_FACTURACION];
const LECTURA = [P.REGISTRAR_LECTURA, P.GESTIONAR_FACTURACION];
const VER_FACTURAS = [...CONSULTAR, P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS];
const VER_MEDIDORES = [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS, P.REGISTRAR_LECTURA, P.REGISTRAR_INCIDENCIA, P.CONSULTAR_FACTURAS];

const CAMPOS_LECTURA = [
  { nombre: 'lectura_actual', etiqueta: 'Lectura actual (m³)', tipo: 'number', requerido: true, min: 0 },
  { nombre: 'fecha_lectura', etiqueta: 'Fecha de la lectura', tipo: 'date', ayuda: 'Si se deja vacía se usa la fecha de hoy.' },
];

const exitoLectura = (r) => `Lectura ${r.salida?.id_lectura} registrada. Consumo: ${r.salida?.consumo ?? 0} m³.`;

export default {
  id: 'facturacion',
  titulo: 'Lecturas y facturación',
  icono: 'factura',
  permisos: [...VER_FACTURAS, P.REGISTRAR_LECTURA],
  secciones: [
    {
      titulo: 'Medidores sin lectura este mes',
      pestana: 'Ruta de lectura',
      permisos: VER_MEDIDORES,
      ruta: '/medidores/sin-lectura',
      descripcion: 'Medidores activos que todavía no tienen lectura en el mes actual. El consumo se calcula en la base y, si es anómalo, se genera una alerta.',
      acciones: [{
        texto: 'Registrar lectura', permisos: LECTURA, ruta: '/lecturas',
        titulo: (f) => `Lectura del medidor ${f.numero_serie}`,
        campos: CAMPOS_LECTURA,
        cuerpo: (f) => ({ id_medidor: f.id_medidor }),
        exito: exitoLectura,
      }],
    },
    {
      titulo: 'Registrar lectura',
      tipo: 'formulario',
      permisos: LECTURA,
      ruta: '/lecturas',
      descripcion: 'Registre la lectura de cualquier medidor activo.',
      campos: [C.medidor({ requerido: true, ancho: true }), ...CAMPOS_LECTURA],
      textoEnviar: 'Registrar lectura',
      exito: exitoLectura,
    },
    {
      titulo: 'Historial de consumo',
      pestana: 'Historial de consumo',
      permisos: CONSULTAR,
      ruta: '/lecturas/historial',
      descripcion: 'Lecturas con su consumo y la factura que generaron.',
      filtros: [
        { nombre: 'id_conexion', etiqueta: 'Conexión', tipo: 'number', min: 1 },
        { nombre: 'id_medidor', etiqueta: 'Medidor (ID)', tipo: 'number', min: 1 },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
      acciones: [
        {
          texto: 'Corregir', permisos: GESTIONAR, metodo: 'PUT',
          titulo: (f) => `Corregir la lectura ${f.id_lectura}`,
          ruta: (f) => `/lecturas/${f.id_lectura}`,
          campos: [
            { nombre: 'lectura_actual_nueva', etiqueta: 'Lectura correcta (m³)', tipo: 'number', requerido: true, min: 0 },
            { nombre: 'motivo', etiqueta: 'Motivo de la corrección', tipo: 'textarea', requerido: true, max: 250 },
          ],
          inicial: (f) => ({ lectura_actual_nueva: f.lectura_actual }),
          exito: () => 'Lectura corregida.',
        },
        {
          texto: 'Facturar', permisos: GESTIONAR, visible: (f) => !f.id_factura,
          titulo: (f) => `Generar factura de la lectura ${f.id_lectura}`,
          ruta: '/facturas',
          campos: [{ nombre: 'dias_plazo', etiqueta: 'Días de plazo', tipo: 'number', min: 1, ayuda: 'Vacío = plazo por defecto.' }],
          cuerpo: (f) => ({ id_lectura: f.id_lectura }),
          exito: (r) => `Factura ${r.salida?.id_factura} generada.`,
        },
        {
          texto: 'Evaluar consumo', permisos: GESTIONAR,
          ruta: (f) => `/alertas/detectar/${f.id_lectura}`,
          exito: (r) => (r.salida?.id_alerta ? `Se generó la alerta ${r.salida.id_alerta}.` : 'La lectura no presenta consumo anómalo.'),
        },
      ],
    },
    {
      titulo: 'Facturas',
      permisos: VER_FACTURAS,
      ruta: '/facturas',
      descripcion: 'Facturas emitidas con lo pagado, los recargos y el saldo.',
      filtros: [
        { nombre: 'periodo', etiqueta: 'Período (AAAAMM)', marcador: '202610', max: 6 },
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.factura },
        { nombre: 'id_conexion', etiqueta: 'Conexión', tipo: 'number', min: 1 },
      ],
      botones: [{
        texto: 'Marcar vencidas', permisos: [P.GESTIONAR_FACTURACION, P.GESTIONAR_PAGOS], ruta: '/facturas/marcar-vencidas',
        confirmar: 'Las facturas pendientes cuyo plazo ya terminó pasarán a "Vencida". ¿Continuar?',
        exito: (r) => `${r.salida?.facturas_vencidas ?? 0} facturas marcadas como vencidas.`,
      }],
      acciones: [{
        texto: 'Saldo', metodo: 'GET',
        titulo: (f) => `Saldo de la factura ${f.id_factura}`,
        ruta: (f) => `/facturas/${f.id_factura}/saldo`,
      }],
    },
    {
      titulo: 'Facturación mensual',
      tipo: 'formulario',
      permisos: GESTIONAR,
      ruta: '/facturas/ciclo-mensual',
      descripcion: 'Genera las facturas de todas las lecturas del mes que todavía no se han facturado.',
      campos: [
        { nombre: 'anio', etiqueta: 'Año', tipo: 'number', requerido: true, min: 2000, valor: () => new Date().getFullYear() },
        { nombre: 'mes', etiqueta: 'Mes', requerido: true, opciones: MESES, valor: () => new Date().getMonth() + 1 },
        { nombre: 'dias_plazo', etiqueta: 'Días de plazo', tipo: 'number', min: 1 },
      ],
      textoEnviar: 'Generar facturas',
      exito: (r) => `Se generaron ${r.salida?.facturas_generadas ?? 0} facturas.`,
    },
    {
      titulo: 'Consumo mensual por conexión',
      pestana: 'Resumen mensual',
      permisos: CONSULTAR,
      ruta: '/lecturas/resumen-mensual',
      ocultar: ['id_abonado_fisico', 'id_abonado_juridico', 'id_tarifa'],
    },
    {
      titulo: 'Alertas de consumo anómalo',
      pestana: 'Alertas de consumo',
      permisos: CONSULTAR,
      ruta: '/alertas',
      descripcion: 'Lecturas que superan las reglas de consumo configuradas en Catálogos.',
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.alerta, valor: 'Abierta' },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
      acciones: [{
        texto: 'Actualizar', permisos: GESTIONAR, metodo: 'PATCH',
        titulo: (f) => `Alerta ${f.id_alerta}`,
        ruta: (f) => `/alertas/${f.id_alerta}`,
        campos: [
          { nombre: 'estado', etiqueta: 'Estado', requerido: true, opciones: ESTADOS.alerta },
          { nombre: 'id_incidencia', etiqueta: 'Incidencia relacionada (ID)', tipo: 'number', min: 1 },
          { nombre: 'observacion', etiqueta: 'Observación', tipo: 'textarea', max: 250 },
        ],
        inicial: (f) => ({ estado: f.estado, id_incidencia: f.id_incidencia, observacion: f.observacion }),
        exito: () => 'Alerta actualizada.',
      }],
    },
  ],
};
