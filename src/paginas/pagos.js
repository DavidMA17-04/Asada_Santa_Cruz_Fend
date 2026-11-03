// R3 · Control de pagos y morosidad (CU-4.x).
import { P } from '../permisos.js';
import { moneda, numero } from '../ui/formato.js';
import { C, TIPO_ABONADO, fechas } from './comunes.js';

const CONSULTAR = [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS];
const GESTIONAR = [P.GESTIONAR_PAGOS];

function enriquecerFacturasCobro(filas = []) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return filas.map((f) => {
    let estado = f.estado || f.estado_factura;
    if (!estado) {
      if (Number(f.saldo) <= 0) estado = 'Pagada';
      else {
        const vence = f.fecha_vencimiento ? new Date(f.fecha_vencimiento) : null;
        estado = vence && !Number.isNaN(vence.getTime()) && vence < hoy ? 'Vencida' : 'Pendiente';
      }
    }
    const abonado = f.abonado
      || f.nombre_completo
      || [f.identificacion, f.nombre_completo].filter(Boolean).join(' · ')
      || '—';
    return { ...f, estado, abonado };
  });
}

function metricasFacturasCobro(filas = []) {
  const total = filas.length;
  const vencidas = filas.filter((f) => String(f.estado).toLowerCase() === 'vencida').length;
  const saldo = filas.reduce((s, f) => s + (Number(f.saldo) || 0), 0);
  const vencido = filas
    .filter((f) => String(f.estado).toLowerCase() === 'vencida')
    .reduce((s, f) => s + (Number(f.saldo) || 0), 0);

  return [
    {
      titulo: 'Por cobrar',
      valor: numero(total),
      detalle: 'Facturas con saldo',
      tono: 'oceano',
      icono: 'factura',
    },
    {
      titulo: 'Vencidas',
      valor: numero(vencidas),
      detalle: 'Fuera de plazo',
      tono: vencidas > 0 ? 'rojo' : 'verde',
      icono: 'alerta',
    },
    {
      titulo: 'Saldo total',
      valor: moneda(saldo),
      detalle: 'Pendiente de cobro',
      tono: 'ambar',
      icono: 'pago',
    },
    {
      titulo: 'Saldo vencido',
      valor: moneda(vencido),
      detalle: 'Ya vencido',
      tono: vencido > 0 ? 'rojo' : 'verde',
      icono: 'reloj',
    },
  ];
}

const COLUMNAS_POR_COBRAR = [
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'id_factura', etiqueta: 'Nº', clase: 'num' },
  { campo: 'abonado', etiqueta: 'Abonado', clase: 'abonado-corto' },
  { campo: 'identificacion', etiqueta: 'Identificación' },
  { campo: 'monto_total', etiqueta: 'Total', clase: 'num' },
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

function enriquecerHistorialPagos(filas = []) {
  return filas.map((f) => ({
    ...f,
    metodo: f.nombre_metodo || f.metodo_pago || f.metodo || '—',
    abonado: f.abonado || f.nombre_completo || '—',
  }));
}

function metricasHistorialPagos(filas = []) {
  const total = filas.length;
  const aplicados = filas.filter((f) => String(f.estado).toLowerCase() === 'aplicado').length;
  const anulados = filas.filter((f) => /anulad/i.test(String(f.estado || ''))).length;
  const montoAplicado = filas
    .filter((f) => String(f.estado).toLowerCase() === 'aplicado')
    .reduce((s, f) => s + (Number(f.monto) || 0), 0);

  return [
    {
      titulo: 'Pagos',
      valor: numero(total),
      detalle: 'En la consulta',
      tono: 'oceano',
      icono: 'pago',
    },
    {
      titulo: 'Aplicados',
      valor: numero(aplicados),
      detalle: 'Vigentes',
      tono: 'verde',
      icono: 'check',
    },
    {
      titulo: 'Anulados',
      valor: numero(anulados),
      detalle: 'Incluidos en filtro',
      tono: anulados > 0 ? 'rojo' : 'neutral',
      icono: 'alerta',
    },
    {
      titulo: 'Monto aplicado',
      valor: moneda(montoAplicado),
      detalle: 'Suma de pagos vigentes',
      tono: 'cielo',
      icono: 'grafico',
    },
  ];
}

const COLUMNAS_HISTORIAL_PAGOS = [
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'id_pago', etiqueta: 'Nº', clase: 'num' },
  { campo: 'fecha_pago', etiqueta: 'Fecha' },
  { campo: 'abonado', etiqueta: 'Abonado', clase: 'abonado-corto' },
  { campo: 'id_factura', etiqueta: 'Factura', clase: 'num' },
  { campo: 'monto', etiqueta: 'Monto', clase: 'num' },
  { campo: 'metodo', etiqueta: 'Método' },
  { campo: 'motivo_anulacion', etiqueta: 'Motivo anulación' },
];

function enriquecerReporteMora(filas = []) {
  return filas.map((f) => ({
    ...f,
    abonado: f.abonado || f.nombre_completo || '—',
    facturas_vencidas: f.cantidad_facturas_vencidas ?? f.facturas_vencidas ?? 0,
    dias_atraso: f.dias_atraso_maximo ?? f.dias_atraso ?? 0,
  }));
}

function metricasReporteMora(filas = []) {
  const total = filas.length;
  const saldo = filas.reduce((s, f) => s + (Number(f.saldo_vencido) || 0), 0);
  const criticos = filas.filter((f) => Number(f.dias_atraso_maximo ?? f.dias_atraso) >= 90).length;
  const facturas = filas.reduce((s, f) => s + (Number(f.cantidad_facturas_vencidas ?? f.facturas_vencidas) || 0), 0);

  return [
    {
      titulo: 'Conexiones',
      valor: numero(total),
      detalle: 'Con mora en el reporte',
      tono: 'oceano',
      icono: 'usuarios',
    },
    {
      titulo: 'Saldo vencido',
      valor: moneda(saldo),
      detalle: 'Total por cobrar vencido',
      tono: saldo > 0 ? 'rojo' : 'verde',
      icono: 'pago',
    },
    {
      titulo: 'Críticos',
      valor: numero(criticos),
      detalle: '90 días o más de atraso',
      tono: criticos > 0 ? 'ambar' : 'verde',
      icono: 'alerta',
    },
    {
      titulo: 'Facturas vencidas',
      valor: numero(facturas),
      detalle: 'En las conexiones listadas',
      tono: 'cielo',
      icono: 'factura',
    },
  ];
}

const COLUMNAS_REPORTE_MORA = [
  { campo: 'abonado', etiqueta: 'Abonado', clase: 'abonado-corto' },
  { campo: 'identificacion', etiqueta: 'Identificación' },
  { campo: 'id_conexion', etiqueta: 'Conexión', clase: 'num' },
  { campo: 'facturas_vencidas', etiqueta: 'Facturas', clase: 'num' },
  {
    campo: 'saldo_vencido',
    etiqueta: 'Saldo vencido',
    clase: (f) => (Number(f.saldo_vencido) > 0 ? 'num saldo-pendiente' : 'num'),
  },
  { campo: 'vencimiento_mas_antiguo', etiqueta: 'Vence desde' },
  {
    campo: 'dias_atraso',
    etiqueta: 'Días atraso',
    clase: (f) => {
      const d = Number(f.dias_atraso);
      if (d >= 90) return 'num dias-atraso';
      if (d >= 40) return 'num aviso-dias';
      return 'num';
    },
  },
];

function enriquecerRecargos(filas = []) {
  return filas.map((f) => ({
    ...f,
    abonado: f.abonado || f.nombre_completo || '—',
    porcentaje: f.porcentaje_aplicado ?? f.porcentaje,
    monto: f.monto_recargo ?? f.monto,
  }));
}

function metricasRecargos(filas = []) {
  const total = filas.length;
  const monto = filas.reduce((s, f) => s + (Number(f.monto_recargo ?? f.monto) || 0), 0);
  const promedioPct = total
    ? Math.round((filas.reduce((s, f) => s + (Number(f.porcentaje_aplicado ?? f.porcentaje) || 0), 0) / total) * 10) / 10
    : 0;
  const criticos = filas.filter((f) => Number(f.dias_atraso) >= 90).length;

  return [
    {
      titulo: 'Recargos',
      valor: numero(total),
      detalle: 'Vigentes en consulta',
      tono: 'oceano',
      icono: 'factura',
    },
    {
      titulo: 'Monto total',
      valor: moneda(monto),
      detalle: 'Suma de recargos',
      tono: monto > 0 ? 'ambar' : 'verde',
      icono: 'pago',
    },
    {
      titulo: '% promedio',
      valor: `${numero(promedioPct)} %`,
      detalle: 'Porcentaje aplicado',
      tono: 'cielo',
      icono: 'grafico',
    },
    {
      titulo: 'Críticos',
      valor: numero(criticos),
      detalle: '90 días o más',
      tono: criticos > 0 ? 'rojo' : 'verde',
      icono: 'alerta',
    },
  ];
}

const COLUMNAS_RECARGOS = [
  { campo: 'abonado', etiqueta: 'Abonado', clase: 'abonado-corto' },
  { campo: 'id_factura', etiqueta: 'Factura', clase: 'num' },
  { campo: 'fecha_calculo', etiqueta: 'Calculado' },
  { campo: 'porcentaje', etiqueta: '%', clase: 'num' },
  {
    campo: 'monto',
    etiqueta: 'Recargo',
    clase: (f) => (Number(f.monto_recargo ?? f.monto) > 0 ? 'num saldo-pendiente' : 'num'),
  },
  { campo: 'saldo_factura', etiqueta: 'Saldo factura', clase: 'num' },
  { campo: 'fecha_vencimiento', etiqueta: 'Vence' },
  {
    campo: 'dias_atraso',
    etiqueta: 'Días',
    clase: (f) => {
      const d = Number(f.dias_atraso);
      if (d >= 90) return 'num dias-atraso';
      if (d >= 40) return 'num aviso-dias';
      return 'num';
    },
  },
];

function enriquecerTramos(filas = []) {
  return filas.map((f) => ({
    ...f,
    rango: f.dias_hasta == null || f.dias_hasta === ''
      ? `Desde ${f.dias_desde} días`
      : `${f.dias_desde} – ${f.dias_hasta} días`,
  }));
}

function metricasTramos(filas = []) {
  const total = filas.length;
  const activos = filas.filter((f) => f.activo === true || f.activo === 1 || String(f.activo).toLowerCase() === 'true').length;
  const maxPct = filas.reduce((m, f) => Math.max(m, Number(f.porcentaje) || 0), 0);
  const abiertos = filas.filter((f) => f.dias_hasta == null || f.dias_hasta === '').length;

  return [
    {
      titulo: 'Tramos',
      valor: numero(total),
      detalle: 'Configurados',
      tono: 'oceano',
      icono: 'lista',
    },
    {
      titulo: 'Activos',
      valor: numero(activos),
      detalle: 'En uso para recargos',
      tono: 'verde',
      icono: 'check',
    },
    {
      titulo: '% máximo',
      valor: `${numero(maxPct)} %`,
      detalle: 'Mayor recargo definido',
      tono: maxPct >= 10 ? 'ambar' : 'cielo',
      icono: 'grafico',
    },
    {
      titulo: 'Sin tope',
      valor: numero(abiertos),
      detalle: 'Tramos abiertos (sin hasta)',
      tono: 'marino',
      icono: 'reloj',
    },
  ];
}

const COLUMNAS_TRAMOS = [
  { campo: 'activo', etiqueta: 'Estado' },
  { campo: 'rango', etiqueta: 'Rango de atraso' },
  { campo: 'dias_desde', etiqueta: 'Desde', clase: 'num' },
  { campo: 'dias_hasta', etiqueta: 'Hasta', clase: 'num' },
  { campo: 'porcentaje', etiqueta: 'Recargo %', clase: 'num' },
];

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
      mensajeVacio: 'No hay facturas con saldo pendiente.',
      placeholderBusqueda: 'Buscar abonado, factura o identificación…',
      transformar: enriquecerFacturasCobro,
      metricas: metricasFacturasCobro,
      columnas: COLUMNAS_POR_COBRAR,
      ocultar: ['id_conexion', 'id_abonado', 'tipo_abonado', 'nombre_completo', 'estado_factura'],
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
      mensajeVacio: 'No hay pagos para los filtros indicados.',
      placeholderBusqueda: 'Buscar abonado, factura, método o estado…',
      transformar: enriquecerHistorialPagos,
      metricas: metricasHistorialPagos,
      columnas: COLUMNAS_HISTORIAL_PAGOS,
      ocultar: [
        'id_conexion', 'id_abonado', 'nombre_metodo', 'metodo_pago', 'nombre_completo',
        'monto_total', 'saldo_actual_factura', 'motivo_anulacion_interno',
      ],
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
      mensajeVacio: 'No hay conexiones morosas con los filtros indicados.',
      placeholderBusqueda: 'Buscar abonado, identificación o conexión…',
      transformar: enriquecerReporteMora,
      metricas: metricasReporteMora,
      columnas: COLUMNAS_REPORTE_MORA,
      ocultar: ['tipo_abonado', 'nombre_completo', 'cantidad_facturas_vencidas', 'dias_atraso_maximo'],
      filtros: [{ nombre: 'dias_minimos_atraso', etiqueta: 'Días mínimos de atraso', tipo: 'number', min: 0 }],
      botones: [
        {
          texto: 'Simular suspensión',
          icono: 'ojo',
          ruta: '/mora/suspender',
          cuerpo: () => ({ solo_simular: true }),
          mostrarResultado: true,
          titulosResultado: ['Resumen', 'Conexiones que se suspenderían'],
          exito: (r) => `${r.salida?.suspendidas ?? 0} conexiones se suspenderían.`,
        },
        {
          texto: 'Suspender morosas',
          permisos: GESTIONAR,
          peligro: true,
          icono: 'alerta',
          ruta: '/mora/suspender',
          confirmar: () => '¿Suspender las conexiones que superan los límites de morosidad configurados?',
          mostrarResultado: true,
          titulosResultado: ['Resumen', 'Conexiones suspendidas'],
          exito: (r) => `${r.salida?.suspendidas ?? 0} conexiones suspendidas.`,
        },
        {
          texto: 'Reactivar sin mora',
          permisos: GESTIONAR,
          icono: 'check',
          ruta: '/mora/reactivar',
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
      mensajeVacio: 'No hay recargos vigentes por mora.',
      placeholderBusqueda: 'Buscar abonado, factura o monto…',
      transformar: enriquecerRecargos,
      metricas: metricasRecargos,
      columnas: COLUMNAS_RECARGOS,
      ocultar: [
        'id_recargo', 'id_conexion', 'porcentaje_aplicado', 'monto_recargo',
        'nombre_completo', 'saldo_factura_interno',
      ],
      botones: [{
        texto: 'Aplicar recargos a vencidas',
        permisos: GESTIONAR,
        icono: 'pago',
        ruta: '/mora/recargos/aplicar',
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
      mensajeVacio: 'No hay tramos configurados. Cree el primero con “Nuevo tramo”.',
      placeholderBusqueda: 'Buscar por días o porcentaje…',
      transformar: enriquecerTramos,
      metricas: metricasTramos,
      columnas: COLUMNAS_TRAMOS,
      ocultar: ['id_tramo'],
      botones: [{
        texto: 'Nuevo tramo', permisos: GESTIONAR, primario: true, icono: 'mas', ruta: '/mora/tramos',
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
      mensajeVacio: 'No hay parámetros de morosidad configurados.',
      placeholderBusqueda: 'Buscar parámetro…',
      columnas: [
        { campo: 'nombre', etiqueta: 'Parámetro' },
        { campo: 'valor', etiqueta: 'Valor', clase: 'num' },
        { campo: 'descripcion', etiqueta: 'Descripción' },
        { campo: 'fecha_modificacion', etiqueta: 'Modificado' },
      ],
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
