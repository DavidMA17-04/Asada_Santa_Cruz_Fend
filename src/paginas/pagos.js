// R3 · Control de pagos y morosidad (CU-4.x).
import { P } from '../permisos.js';
import { moneda } from '../ui/formato.js';
import { C, fechas } from './comunes.js';

const CONSULTAR = [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS];
const GESTIONAR = [P.GESTIONAR_PAGOS];

const registrarPago = {
  texto: 'Registrar pago', permisos: GESTIONAR, ruta: '/pagos',
  titulo: (f) => `Pago de la factura ${f.id_factura}`,
  campos: (f) => [
    C.metodoPago({ requerido: true }),
    { nombre: 'monto', etiqueta: 'Monto (₡)', tipo: 'number', requerido: true, min: 0.01, ayuda: `Saldo pendiente: ${moneda(f.saldo)}. Se permiten pagos parciales.` },
    { nombre: 'fecha_pago', etiqueta: 'Fecha del pago', tipo: 'date', valor: fechas.hoy },
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

export default {
  id: 'pagos',
  titulo: 'Pagos y morosidad',
  icono: 'pago',
  permisos: CONSULTAR,
  secciones: [
    {
      titulo: 'Facturas por cobrar',
      ruta: '/facturas/pendientes',
      descripcion: 'Facturas pendientes o vencidas con su saldo. Desde aquí se registran los pagos.',
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
      titulo: 'Historial de pagos',
      pestana: 'Pagos',
      ruta: '/pagos',
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
      descripcion: 'Abonados con facturas vencidas, agrupados por conexión.',
      filtros: [{ nombre: 'dias_minimos_atraso', etiqueta: 'Días mínimos de atraso', tipo: 'number', min: 0 }],
    },
    {
      titulo: 'Recargos por mora',
      pestana: 'Recargos',
      ruta: '/mora/recargos',
      descripcion: 'Recargos aplicados sobre facturas que aún no se han pagado.',
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
      titulo: 'Recaudación por método de pago',
      pestana: 'Por método',
      ruta: '/pagos/por-metodo',
      ocultar: ['id_metodo_pago'],
      grafico: { etiqueta: 'nombre_metodo', series: [{ campo: 'total_recaudado', nombre: 'Recaudado' }], formato: moneda },
    },
  ],
};
