// Módulo de la Junta Directiva: reportes de gestión en un solo lugar, solo consulta.
// La Junta no modifica datos; las decisiones (tarifas, recargos) las ejecuta la administración.
import { P } from '../permisos.js';
import { moneda, numero } from '../ui/formato.js';
import { C, fechas } from './comunes.js';

const DW = [P.CONSULTAR_DW];
const PAGOS = [P.CONSULTAR_PAGOS];
const MANT = [P.CONSULTAR_MANTENIMIENTO];

const anioActual = () => new Date().getFullYear();
const periodo = (f) => (f.nombre_mes ? `${f.nombre_mes} ${f.anio}` : `${String(f.mes).padStart(2, '0')}/${f.anio}`);

export default {
  id: 'junta',
  titulo: 'Junta Directiva',
  icono: 'grafico',
  // Solo aparece para quien puede ver a la vez los reportes del DW y la morosidad (la Junta).
  requiereTodos: [P.CONSULTAR_DW, P.CONSULTAR_PAGOS],
  secciones: [
    {
      titulo: 'Facturado contra recaudado',
      pestana: 'Finanzas',
      permisos: DW,
      ruta: '/dw/facturacion',
      descripcion: 'Cuánto se facturó y cuánto se cobró cada mes (Data Warehouse).',
      filtros: [{ nombre: 'anio', etiqueta: 'Año', tipo: 'number', min: 2000, valor: anioActual }],
      grafico: {
        etiqueta: periodo,
        series: [{ campo: 'monto_facturado', nombre: 'Facturado' }, { campo: 'monto_recaudado', nombre: 'Recaudado' }],
        formato: moneda,
      },
    },
    {
      titulo: 'Recaudación por método de pago',
      pestana: 'Recaudación',
      permisos: PAGOS,
      ruta: '/pagos/por-metodo',
      ocultar: ['id_metodo_pago'],
      grafico: { etiqueta: 'nombre_metodo', series: [{ campo: 'total_recaudado', nombre: 'Recaudado' }], formato: moneda },
    },
    {
      titulo: 'Abonados morosos',
      pestana: 'Morosidad',
      permisos: PAGOS,
      ruta: '/mora/reporte',
      descripcion: 'Conexiones con facturas vencidas. Sirve para decidir cortes, arreglos de pago y recargos.',
      filtros: [{ nombre: 'dias_minimos_atraso', etiqueta: 'Días mínimos de atraso', tipo: 'number', min: 0 }],
    },
    {
      titulo: 'Morosidad por distrito',
      pestana: 'Mora por distrito',
      permisos: DW,
      ruta: '/dw/morosidad',
      descripcion: 'Saldo vencido en la última fecha de corte cargada en el Data Warehouse.',
      filtros: [{ nombre: 'fecha_corte', etiqueta: 'Fecha de corte (AAAAMMDD)', marcador: '20261031', max: 8 }],
      grafico: { etiqueta: 'distrito', series: [{ campo: 'saldo_vencido', nombre: 'Saldo vencido' }], formato: moneda },
    },
    {
      titulo: 'Consumo de agua',
      pestana: 'Consumo',
      permisos: DW,
      ruta: '/dw/consumo',
      filtros: [
        { nombre: 'anio', etiqueta: 'Año', tipo: 'number', min: 2000, valor: anioActual },
        { nombre: 'por', etiqueta: 'Agrupar por', requerido: true, valor: 'mes', opciones: [
          { valor: 'mes', texto: 'Mes' }, { valor: 'distrito', texto: 'Distrito' }, { valor: 'tarifa', texto: 'Tipo de tarifa' }] },
      ],
      grafico: {
        etiqueta: (f) => (f.mes ? periodo(f) : f.distrito ?? f.tipo_tarifa),
        series: [{ campo: 'consumo_total_m3', nombre: 'Consumo (m³)' }],
        formato: (n) => `${numero(n)} m³`,
      },
    },
    {
      titulo: 'Estado de la red',
      pestana: 'Incidencias',
      permisos: MANT,
      ruta: '/incidencias/abiertas',
      descripcion: 'Fugas y daños reportados que siguen abiertos.',
    },
    {
      titulo: 'Mantenimientos pendientes',
      pestana: 'Mantenimientos',
      permisos: MANT,
      ruta: '/mantenimientos/pendientes',
    },
    {
      titulo: 'Mantenimientos realizados',
      pestana: 'Trabajo por fontanero',
      permisos: DW,
      ruta: '/dw/mantenimientos',
      filtros: [
        { nombre: 'anio', etiqueta: 'Año', tipo: 'number', min: 2000, valor: anioActual },
        { nombre: 'por', etiqueta: 'Agrupar por', requerido: true, valor: 'empleado', opciones: [
          { valor: 'empleado', texto: 'Empleado' }, { valor: 'tipo', texto: 'Tipo de trabajo' }] },
      ],
      grafico: { etiqueta: (f) => f.empleado ?? f.tipo_trabajo, series: [{ campo: 'mantenimientos', nombre: 'Mantenimientos' }] },
    },
    {
      titulo: 'Simular un cambio de tarifa',
      pestana: 'Simular tarifa',
      tipo: 'formulario',
      permisos: [],
      ruta: '/catalogos/tarifas/simular',
      descripcion: 'Calcula cuánto pagaría un abonado con montos propuestos y lo compara con la tarifa actual. No guarda nada.',
      campos: [
        { nombre: 'consumo_m3', etiqueta: 'Consumo (m³)', tipo: 'number', requerido: true, min: 0 },
        { nombre: 'monto_fijo_propuesto', etiqueta: 'Monto fijo propuesto (₡)', tipo: 'number', requerido: true, min: 0 },
        { nombre: 'monto_por_m3_propuesto', etiqueta: 'Monto por m³ propuesto (₡)', tipo: 'number', requerido: true, min: 0 },
        C.tarifa({ nombre: 'id_tarifa_actual', etiqueta: 'Comparar con' }),
      ],
      textoEnviar: 'Simular',
      limpiar: false,
      mostrarResultado: true,
      exito: () => 'Simulación calculada.',
    },
    {
      titulo: 'Actividad del personal',
      pestana: 'Auditoría',
      permisos: [P.CONSULTAR_BITACORA],
      ruta: '/seguridad/bitacora/resumen',
      descripcion: 'Qué hizo cada usuario del sistema en el período.',
      filtros: [
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date', requerido: true, valor: fechas.inicioMes },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date', requerido: true, valor: fechas.hoy },
      ],
    },
  ],
};
