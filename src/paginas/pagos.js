// R3 · Control de pagos y morosidad (CU-4.x).
import { P } from '../permisos.js';
import { moneda } from '../ui/formato.js';
import { C, TIPO_ABONADO, fechas } from './comunes.js';

const CONSULTAR = [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS];
const GESTIONAR = [P.GESTIONAR_PAGOS];

const registrarPago = {
  texto: 'Registrar pago', permisos: GESTIONAR, ruta: '/pagos',
  titulo: (f) => `Pago de la factura ${f.id_factura}`,
  campos: (f) => [
    C.metodoPago({ requerido: true }),
    { nombre: 'monto', etiqueta: 'Monto (₡)', tipo: 'number', requerido: true, min: 0.01, ayuda: `Saldo pendiente: ${moneda(f.saldo)}. Puede pagar una parte.` },
    { nombre: 'fecha_pago', etiqueta: 'Fecha del pago', tipo: 'date', valor: fechas.hoy, ayuda: 'No puede ser futura ni anterior a la emisión de la factura.' },
  ],
  inicial: (f) => ({ monto: f.saldo }),
  cuerpo: (f) => ({ id_factura: f.id_factura }),
  exito: (r) => `Pago ${r.salida?.id_pago} registrado.`,
};

const prorroga = {
  texto: 'Prórroga', permisos: GESTIONAR, metodo: 'PATCH',
  titulo: (f) => `Prórroga de la factura ${f.id_factura}`,
  ruta: (f) => `/facturas/${f.id_factura}/prorroga`,
  campos: [
    { nombre: 'nueva_fecha_vencimiento', etiqueta: 'Nueva fecha de vencimiento', tipo: 'date', requerido: true },
    { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'textarea', requerido: true, max: 250 },
  ],
  exito: () => 'Prórroga otorgada.',
};

const camposTramo = [
  { nombre: 'dias_desde', etiqueta: 'Días de atraso desde', tipo: 'number', requerido: true, min: 1 },
  { nombre: 'dias_hasta', etiqueta: 'Días de atraso hasta', tipo: 'number', min: 1, ayuda: 'Déjelo vacío para el último tramo (sin límite).' },
  { nombre: 'porcentaje', etiqueta: 'Porcentaje de recargo (%)', tipo: 'number', requerido: true, min: 0.01, max: 100 },
  { nombre: 'activo', etiqueta: 'Activo', tipo: 'checkbox', valor: true },
];

export default {
  id: 'pagos',
  titulo: 'Pagos y morosidad',
  icono: 'pago',
  permisos: CONSULTAR,
  secciones: [
    {
      titulo: 'Resumen de cartera',
      pestana: 'Resumen',
      tipo: 'resumen',
      ruta: '/mora/resumen',
      descripcion: 'Saldo por cobrar, morosidad y recaudación del mes en curso.',
      grupos: [
        {
          titulo: 'Cartera',
          descripcion: 'Saldo pendiente de cobro',
          tarjetas: [
            { campo: 'total_por_cobrar', etiqueta: 'Total por cobrar', formato: moneda, icono: 'factura', clase: 'grande', ayuda: 'Facturas pendientes y vencidas.' },
            { campo: 'total_vencido', etiqueta: 'Total vencido', formato: moneda, icono: 'pago', clase: 'grande rojo', ayuda: 'Con fecha de vencimiento pasada.' },
            { campo: 'facturas_pendientes', etiqueta: 'Facturas pendientes', icono: 'lista', ayuda: 'Por cobrar en total.' },
            { campo: 'facturas_vencidas', etiqueta: 'Facturas vencidas', icono: 'factura', clase: 'rojo', ayuda: 'Con al menos un día de atraso.' },
          ],
          barra: {
            etiqueta: 'Proporción vencida de la cartera',
            parte: 'total_vencido',
            total: 'total_por_cobrar',
            clase: 'rojo',
          },
        },
        {
          titulo: 'Morosidad y conexiones',
          descripcion: 'Abonados en riesgo de suspensión',
          tarjetas: [
            { campo: 'conexiones_morosas', etiqueta: 'Conexiones morosas', icono: 'usuarios', clase: 'ambar', ayuda: 'Con al menos una factura vencida.' },
            { campo: 'conexiones_suspendidas', etiqueta: 'Conexiones suspendidas', icono: 'medidor', clase: 'ambar', ayuda: 'Servicio suspendido por mora.' },
            { campo: 'recargos_vigentes', etiqueta: 'Recargos vigentes', formato: moneda, icono: 'grafico', ayuda: 'Recargos por mora aplicados.' },
          ],
        },
        {
          titulo: 'Recaudación del mes',
          descripcion: 'Pagos aplicados en el mes en curso',
          tarjetas: [
            { campo: 'recaudado_mes', etiqueta: 'Recaudado del mes', formato: moneda, icono: 'pago', clase: 'verde', ayuda: 'Pagos aplicados en el mes en curso.' },
            { campo: 'pagos_mes', etiqueta: 'Pagos del mes', icono: 'lista', clase: 'verde', ayuda: 'Cantidad de pagos registrados.' },
          ],
        },
      ],
    },
    {
      titulo: 'Facturas por cobrar',
      pestana: 'Facturas',
      ruta: '/facturas/pendientes',
      descripcion: 'Facturas pendientes o vencidas con su saldo. Desde aquí se registran pagos totales o parciales, prórrogas y recargos.',
      acciones: [
        registrarPago,
        prorroga,
        {
          texto: 'Recargo', permisos: GESTIONAR, visible: (f) => f.dias_atraso > 0,
          ruta: (f) => `/mora/facturas/${f.id_factura}/recargo`,
          confirmar: (f) => `¿Calcular el recargo por mora de la factura ${f.id_factura} (${f.dias_atraso} días de atraso)?`,
          exito: (r) => (r.salida?.id_recargo ? `Recargo ${r.salida.id_recargo} aplicado.` : 'Recargo calculado.'),
        },
      ],
    },
    {
      titulo: 'Estado de cuenta del abonado',
      pestana: 'Estado de cuenta',
      ruta: '/estado-cuenta',
      descripcion: 'Escriba el tipo y el número de abonado, y presione Buscar. Verá el resumen de deuda, sus facturas, pagos y recargos en una sola pantalla.',
      cargarAlInicio: false,
      conjuntos: ['Resumen', 'Facturas', 'Pagos', 'Recargos'],
      filtros: [
        { nombre: 'tipo_abonado', etiqueta: 'Tipo de abonado', opciones: TIPO_ABONADO, requerido: true },
        { nombre: 'id_abonado', etiqueta: 'Número de abonado', tipo: 'number', min: 1, requerido: true, ayuda: 'Es el ID interno del abonado, no la cédula.' },
      ],
    },
    {
      titulo: 'Historial de pagos',
      pestana: 'Pagos',
      ruta: '/pagos',
      descripcion: 'Pagos registrados. Puede filtrar por factura o por rango de fechas y anular un pago con su motivo.',
      filtros: [
        { nombre: 'id_factura', etiqueta: 'Factura', tipo: 'number', min: 1 },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
        { nombre: 'incluir_anulados', etiqueta: 'Incluir anulados', tipo: 'checkbox' },
      ],
      acciones: [{
        texto: 'Anular', permisos: GESTIONAR, peligro: true, visible: (f) => f.estado === 'Aplicado',
        titulo: (f) => `Anular el pago ${f.id_pago}`,
        ruta: (f) => `/pagos/${f.id_pago}/anular`,
        campos: [{ nombre: 'motivo', etiqueta: 'Motivo de la anulación', tipo: 'textarea', requerido: true, max: 250 }],
        exito: () => 'Pago anulado. El saldo de la factura se recalculó.',
      }],
    },
    {
      titulo: 'Reporte de morosidad',
      pestana: 'Morosidad',
      ruta: '/mora/reporte',
      descripcion: 'Abonados con facturas vencidas, agrupados por conexión. Desde aquí puede suspender las conexiones morosas o reactivar las que ya pagaron.',
      filtros: [{ nombre: 'dias_minimos_atraso', etiqueta: 'Días mínimos de atraso', tipo: 'number', min: 0 }],
      botones: [
        {
          texto: 'Simular suspensión', ruta: '/mora/suspender',
          cuerpo: () => ({ solo_simular: true }),
          mostrarResultado: true,
          titulosResultado: ['Resumen', 'Conexiones que se suspenderían'],
          exito: (r) => `${r.salida?.suspendidas ?? 0} conexiones se suspenderían.`,
        },
        {
          texto: 'Suspender morosas', permisos: GESTIONAR, peligro: true, ruta: '/mora/suspender',
          confirmar: () => '¿Suspender las conexiones que superan los límites de morosidad configurados?',
          mostrarResultado: true,
          titulosResultado: ['Resumen', 'Conexiones suspendidas'],
          exito: (r) => `${r.salida?.suspendidas ?? 0} conexiones suspendidas.`,
        },
        {
          texto: 'Reactivar sin mora', permisos: GESTIONAR, ruta: '/mora/reactivar',
          confirmar: () => '¿Reactivar las conexiones suspendidas que ya no tienen saldo vencido?',
          mostrarResultado: true,
          titulosResultado: ['Resumen', 'Conexiones reactivadas'],
          exito: (r) => `${r.salida?.reactivadas ?? 0} conexiones reactivadas.`,
        },
      ],
    },
    {
      titulo: 'Recargos por mora',
      pestana: 'Recargos',
      ruta: '/mora/recargos',
      descripcion: 'Recargos aplicados sobre facturas que aún no se han pagado. Al anular uno, el proceso automático no lo vuelve a aplicar.',
      botones: [{
        texto: 'Aplicar recargos a vencidas', permisos: GESTIONAR, ruta: '/mora/recargos/aplicar',
        campos: [{ nombre: 'fecha_corte', etiqueta: 'Fecha de corte', tipo: 'date', valor: fechas.hoy }],
        textoEnviar: 'Aplicar',
        exito: (r) => `${r.salida?.recargos_procesados ?? 0} recargos procesados.`,
      }],
      acciones: [{
        texto: 'Anular', permisos: GESTIONAR, peligro: true,
        titulo: (f) => `Anular el recargo ${f.id_recargo}`,
        ruta: (f) => `/mora/recargos/${f.id_recargo}/anular`,
        campos: [{ nombre: 'motivo', etiqueta: 'Motivo', tipo: 'textarea', requerido: true, max: 250 }],
        exito: () => 'Recargo anulado.',
      }],
    },
    {
      titulo: 'Tramos de mora',
      pestana: 'Tramos',
      ruta: '/mora/tramos',
      descripcion: 'Porcentaje de recargo según los días de atraso. Los tramos activos no deben superponerse.',
      botones: [{
        texto: 'Nuevo tramo', permisos: GESTIONAR, primario: true, ruta: '/mora/tramos',
        campos: camposTramo,
        exito: () => 'Tramo creado.',
      }],
      acciones: [{
        texto: 'Editar', permisos: GESTIONAR, metodo: 'PUT',
        titulo: (f) => `Tramo de ${f.dias_desde} a ${f.dias_hasta ?? 'sin límite'} días`,
        ruta: (f) => `/mora/tramos/${f.id_tramo}`,
        campos: camposTramo,
        inicial: (f) => ({
          dias_desde: f.dias_desde, dias_hasta: f.dias_hasta, porcentaje: f.porcentaje, activo: f.activo,
        }),
        exito: () => 'Tramo actualizado.',
      }],
    },
    {
      titulo: 'Parámetros de morosidad',
      pestana: 'Parámetros',
      ruta: '/mora/parametros',
      descripcion: 'Límites que usa el sistema para suspender conexiones y el plazo de pago de las facturas.',
      acciones: [{
        texto: 'Editar', permisos: GESTIONAR, metodo: 'PUT',
        titulo: (f) => `Parámetro: ${f.descripcion || f.nombre}`,
        ruta: (f) => `/mora/parametros/${f.nombre}`,
        campos: [{ nombre: 'valor', etiqueta: 'Valor', tipo: 'number', requerido: true, min: 0 }],
        inicial: (f) => ({ valor: f.valor }),
        exito: () => 'Parámetro actualizado.',
      }],
    },
    {
      titulo: 'Recaudación por método de pago',
      pestana: 'Por método',
      ruta: '/pagos/por-metodo',
      ocultar: ['id_metodo_pago'],
      grafico: { etiqueta: 'nombre_metodo', series: [{ campo: 'total_recaudado', nombre: 'Recaudado' }], formato: moneda },
    },
  ],
};
