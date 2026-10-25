// R5, R7, R8, R10 · Respaldos, Data Warehouse y administración de la base (CU-7.x).
import { P } from '../permisos.js';
import { moneda, numero } from '../ui/formato.js';
import { C, ESTADOS, fechas } from './comunes.js';

const RESPALDOS = [P.RESPALDOS];
const ETL = [P.ETL];
const DW = [P.CONSULTAR_DW];
const BD = [P.MANTENIMIENTO_BD];

const anioActual = () => new Date().getFullYear();

const camposPolitica = (f) => [
  { nombre: 'nombre_politica', etiqueta: 'Nombre', requerido: true, max: 100, ancho: true },
  C.tipoRespaldo({ requerido: true }),
  { nombre: 'frecuencia', etiqueta: 'Frecuencia', requerido: true, max: 50, marcador: 'Diario, Semanal (domingo)…' },
  { nombre: 'hora_ejecucion', etiqueta: 'Hora de ejecución', tipo: 'time', requerido: true },
  { nombre: 'retencion_dias', etiqueta: 'Retención (días)', tipo: 'number', requerido: true, min: 1, paso: 1 },
  { nombre: 'ruta_destino', etiqueta: 'Carpeta de destino', requerido: true, max: 250, ancho: true, marcador: 'C:\\Respaldos\\ASADA\\' },
  { nombre: 'activo', etiqueta: 'Activa', tipo: 'checkbox', valor: f ? undefined : true },
];

export const respaldos = {
  id: 'respaldos',
  titulo: 'Respaldos',
  icono: 'respaldo',
  permisos: RESPALDOS,
  secciones: [
    {
      titulo: 'Políticas de respaldo',
      pestana: 'Políticas',
      ruta: '/respaldos/politicas',
      descripcion: 'Qué se respalda, cada cuánto y por cuántos días se conserva. Los jobs de SQL Agent ejecutan estas políticas.',
      ocultar: ['id_tipo_respaldo'],
      botones: [{
        texto: 'Nueva política', primario: true, ruta: '/respaldos/politicas',
        campos: camposPolitica(null),
        exito: (r) => `Política ${r.salida?.id_politica} creada.`,
      }],
      acciones: [
        {
          texto: 'Ejecutar ahora', visible: (f) => f.activo,
          titulo: (f) => `Ejecutar: ${f.nombre_politica}`,
          ruta: (f) => `/respaldos/politicas/${f.id_politica}/ejecutar`,
          campos: [{ nombre: 'verificar', etiqueta: 'Verificar el archivo al terminar (RESTORE VERIFYONLY)', tipo: 'checkbox', valor: true }],
          textoEnviar: 'Ejecutar respaldo',
          mostrarResultado: true,
          exito: (r) => `Respaldo ${r.salida?.id_respaldo ?? ''} terminado.`,
        },
        {
          texto: 'Editar', metodo: 'PUT',
          titulo: (f) => `Editar: ${f.nombre_politica}`,
          ruta: (f) => `/respaldos/politicas/${f.id_politica}`,
          campos: camposPolitica,
          inicial: (f) => ({ ...f }),
          exito: () => 'Política actualizada.',
        },
      ],
    },
    {
      titulo: 'Historial de respaldos',
      pestana: 'Historial',
      ruta: '/respaldos/historial',
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.respaldo },
        { nombre: 'verificado', etiqueta: 'Verificado', opciones: [{ valor: 'true', texto: 'Sí' }, { valor: 'false', texto: 'No' }] },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date', valor: () => fechas.haceDias(30) },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
      botones: [{
        texto: 'Verificar pendientes', ruta: '/respaldos/verificar',
        confirmar: 'Se verificarán todos los respaldos exitosos que aún no se han verificado. Puede tardar.',
        mostrarResultado: true,
        exito: () => 'Verificación terminada.',
      }],
      acciones: [{
        texto: 'Verificar', visible: (f) => f.estado === 'Exitoso' && !f.verificado,
        ruta: '/respaldos/verificar',
        cuerpo: (f) => ({ id_respaldo: f.id_respaldo }),
        confirmar: (f) => `¿Verificar la integridad del respaldo ${f.id_respaldo}?`,
        mostrarResultado: true,
        exito: () => 'Verificación terminada.',
      }],
    },
    {
      titulo: 'Restaurar a un punto en el tiempo',
      pestana: 'Restaurar',
      tipo: 'formulario',
      ruta: '/respaldos/restaurar',
      descripcion: 'Restaura en una base aparte (por defecto ASADA_Restaurada); nunca sobre la base productiva. Con "solo generar el script" se muestra la secuencia de RESTORE sin ejecutarla.',
      campos: [
        { nombre: 'punto_recuperacion', etiqueta: 'Punto de recuperación', tipo: 'datetime-local', requerido: true },
        { nombre: 'base_destino', etiqueta: 'Base de destino', marcador: 'ASADA_Restaurada', max: 128 },
        { nombre: 'solo_generar_script', etiqueta: 'Solo generar el script', tipo: 'checkbox', valor: true },
        { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'textarea', requerido: true, max: 250 },
      ],
      textoEnviar: 'Restaurar',
      limpiar: false,
      mostrarResultado: true,
      exito: (r) => (r.salida?.id_restauracion ? `Restauración ${r.salida.id_restauracion} registrada.` : 'Proceso terminado.'),
    },
    {
      titulo: 'Historial de restauraciones',
      pestana: 'Restauraciones',
      ruta: '/respaldos/restauraciones',
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.restauracion },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
    },
  ],
};

const etiquetaPeriodo = (f) => (f.nombre_mes ? `${f.nombre_mes} ${f.anio}` : `${String(f.mes).padStart(2, '0')}/${f.anio}`);

export const dataWarehouse = {
  id: 'dw',
  titulo: 'Reportes y Data Warehouse',
  icono: 'grafico',
  permisos: [...DW, ...ETL],
  secciones: [
    {
      titulo: 'Consumo de agua',
      pestana: 'Consumo',
      permisos: DW,
      ruta: '/dw/consumo',
      descripcion: 'Metros cúbicos consumidos según el Data Warehouse. Los datos se actualizan con cada carga ETL.',
      filtros: [
        { nombre: 'anio', etiqueta: 'Año', tipo: 'number', min: 2000, valor: anioActual },
        { nombre: 'por', etiqueta: 'Agrupar por', requerido: true, valor: 'mes', opciones: [
          { valor: 'mes', texto: 'Mes' }, { valor: 'distrito', texto: 'Distrito' }, { valor: 'tarifa', texto: 'Tipo de tarifa' }] },
      ],
      grafico: {
        etiqueta: (f) => (f.mes ? etiquetaPeriodo(f) : f.distrito ?? f.tipo_tarifa),
        series: [{ campo: 'consumo_total_m3', nombre: 'Consumo (m³)' }],
        formato: (n) => `${numero(n)} m³`,
      },
    },
    {
      titulo: 'Facturado contra recaudado',
      pestana: 'Facturación',
      permisos: DW,
      ruta: '/dw/facturacion',
      filtros: [{ nombre: 'anio', etiqueta: 'Año', tipo: 'number', min: 2000, valor: anioActual }],
      grafico: {
        etiqueta: etiquetaPeriodo,
        series: [{ campo: 'monto_facturado', nombre: 'Facturado' }, { campo: 'monto_recaudado', nombre: 'Recaudado' }],
        formato: moneda,
      },
    },
    {
      titulo: 'Morosidad por distrito',
      pestana: 'Morosidad',
      permisos: DW,
      ruta: '/dw/morosidad',
      descripcion: 'Saldo vencido en una fecha de corte. Sin fecha se usa el último corte cargado.',
      filtros: [{ nombre: 'fecha_corte', etiqueta: 'Fecha de corte (AAAAMMDD)', marcador: '20261031', max: 8 }],
      grafico: { etiqueta: 'distrito', series: [{ campo: 'saldo_vencido', nombre: 'Saldo vencido' }], formato: moneda },
    },
    {
      titulo: 'Mantenimientos',
      permisos: DW,
      ruta: '/dw/mantenimientos',
      filtros: [
        { nombre: 'anio', etiqueta: 'Año', tipo: 'number', min: 2000, valor: anioActual },
        { nombre: 'por', etiqueta: 'Agrupar por', requerido: true, valor: 'tipo', opciones: [
          { valor: 'tipo', texto: 'Tipo de trabajo' }, { valor: 'empleado', texto: 'Empleado' }] },
      ],
      grafico: {
        etiqueta: (f) => f.tipo_trabajo ?? f.empleado,
        series: [{ campo: 'mantenimientos', nombre: 'Mantenimientos' }],
      },
    },
    {
      titulo: 'Cargas ETL',
      pestana: 'ETL',
      permisos: ETL,
      ruta: '/dw/etl/control',
      descripcion: 'Cada ejecución del ETL carga las dimensiones y hechos del DW. Es incremental: para datos con fechas antiguas use la carga completa.',
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.etl },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
      botones: [
        {
          texto: 'Ejecutar ETL', primario: true, ruta: '/dw/etl',
          campos: [{ nombre: 'carga_completa', etiqueta: 'Carga completa (vuelve a cargar todo el historial)', tipo: 'checkbox' }],
          textoEnviar: 'Ejecutar',
          mostrarResultado: true,
          exito: () => 'Carga ETL terminada.',
        },
        {
          texto: 'Validar DW', ruta: '/dw/validar',
          mostrarResultado: true,
          exito: (r) => (r.salida?.problemas ? `Se encontraron ${r.salida.problemas} diferencias.` : 'El DW coincide con el origen.'),
        },
      ],
      acciones: [{
        texto: 'Reintentar', visible: (f) => f.estado === 'Fallido' && !f.reintentado,
        ruta: (f) => `/dw/etl/${f.id_proceso_etl}/reintentar`,
        confirmar: (f) => `¿Reintentar la carga de ${f.nombre_tabla_destino}?`,
        mostrarResultado: true,
        exito: () => 'Reintento terminado.',
      }],
    },
    {
      titulo: 'Última carga por tabla',
      pestana: 'Última carga',
      permisos: [...ETL, ...DW],
      ruta: '/dw/etl/ultima-carga',
    },
    {
      titulo: 'Conciliación origen contra DW',
      pestana: 'Conciliación',
      permisos: [...ETL, ...DW],
      ruta: '/dw/conciliar',
      descripcion: 'Compara los totales de un período en la base operativa y en el Data Warehouse.',
      filtros: [{
        nombre: 'periodo', etiqueta: 'Período (AAAAMM)', max: 6,
        valor: () => `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      }],
    },
  ],
};

export const baseDatos = {
  id: 'bd',
  titulo: 'Base de datos',
  icono: 'base',
  permisos: BD,
  secciones: [
    {
      titulo: 'Monitoreo',
      ruta: '/bd/monitoreo',
      descripcion: 'Estado general de la base: archivos, tablas más grandes, consultas costosas, últimos respaldos y cargas ETL.',
      conjuntos: ['Archivos de la base', 'Tablas más grandes', 'Consultas más costosas', 'Último respaldo por tipo', 'Última carga ETL'],
    },
    {
      titulo: 'Mantenimiento de índices',
      pestana: 'Índices',
      tipo: 'formulario',
      ruta: '/bd/indices',
      descripcion: 'Reorganiza o reconstruye los índices fragmentados. Con "solo reporte" muestra la fragmentación sin cambiar nada.',
      campos: [
        { nombre: 'solo_reporte', etiqueta: 'Solo reporte', tipo: 'checkbox', valor: true },
        { nombre: 'umbral_reorganizar', etiqueta: 'Reorganizar desde (%)', tipo: 'number', min: 0, max: 100, marcador: '10' },
        { nombre: 'umbral_reconstruir', etiqueta: 'Reconstruir desde (%)', tipo: 'number', min: 0, max: 100, marcador: '30' },
        { nombre: 'paginas_minimas', etiqueta: 'Páginas mínimas', tipo: 'number', min: 0, paso: 1 },
      ],
      textoEnviar: 'Ejecutar',
      limpiar: false,
      mostrarResultado: true,
      exito: () => 'Mantenimiento de índices terminado.',
    },
    {
      titulo: 'Verificar integridad (DBCC CHECKDB)',
      pestana: 'Integridad',
      tipo: 'formulario',
      ruta: '/bd/integridad',
      campos: [{ nombre: 'base', etiqueta: 'Base de datos', marcador: 'ASADA', max: 128 }],
      textoEnviar: 'Verificar',
      limpiar: false,
      mostrarResultado: true,
      exito: () => 'Verificación terminada.',
    },
    {
      titulo: 'Datos y casos de prueba',
      pestana: 'Pruebas',
      tipo: 'acciones',
      descripcion: 'Solo disponible si la API corre con PERMITIR_PRUEBAS=true. Los datos de prueba se marcan para poder borrarlos después.',
      botones: [
        {
          texto: 'Cargar datos de prueba', ruta: '/pruebas/cargar-datos',
          confirmar: 'Se crearán abonados, conexiones, lecturas y facturas de prueba. ¿Continuar?',
          mostrarResultado: true, exito: () => 'Datos de prueba cargados.',
        },
        {
          texto: 'Ejecutar casos de prueba', ruta: '/pruebas/ejecutar',
          mostrarResultado: true, exito: () => 'Pruebas ejecutadas.',
        },
        {
          texto: 'Limpiar datos de prueba', peligro: true, ruta: '/pruebas/limpiar',
          confirmar: 'Se borrarán todos los datos de prueba. ¿Continuar?',
          mostrarResultado: true, exito: () => 'Datos de prueba eliminados.',
        },
      ],
    },
  ],
};
