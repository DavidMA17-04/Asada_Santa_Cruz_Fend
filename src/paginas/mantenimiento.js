// R4 · Mantenimientos e incidencias (CU-5.x).
import { P } from '../permisos.js';
import { C, ESTADOS, fechas } from './comunes.js';

const CONSULTAR = [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO];
const GESTIONAR = [P.GESTIONAR_MANTENIMIENTO];
const EJECUTAR = [P.EJECUTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO];
const REGISTRAR_INCIDENCIA = [P.REGISTRAR_INCIDENCIA, P.GESTIONAR_MANTENIMIENTO];

const abierta = (f) => f.estado !== 'Resuelta';
const enCurso = (f) => f.estado === 'Programado' || f.estado === 'En proceso';

const CAMPOS_INCIDENCIA = [
  C.medidor({ requerido: true, ancho: true }),
  C.tipoIncidencia({ requerido: true }),
  { nombre: 'fecha_incidente', etiqueta: 'Fecha del incidente', tipo: 'date', valor: fechas.hoy },
  { nombre: 'ubicacion', etiqueta: 'Ubicación', max: 200, ayuda: 'Si se deja vacía se usa la de la conexión.' },
  { nombre: 'id_alerta', etiqueta: 'Alerta de consumo (ID)', tipo: 'number', min: 1 },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', requerido: true, max: 500 },
];

const nuevaIncidencia = {
  texto: 'Registrar incidencia', primario: true, permisos: REGISTRAR_INCIDENCIA, ruta: '/incidencias',
  campos: CAMPOS_INCIDENCIA, textoEnviar: 'Registrar',
  exito: (r) => `Incidencia ${r.salida?.id_incidencia} registrada. La prioridad la asigna el sistema.`,
};

const ACCIONES_MANTENIMIENTO = [
  {
    texto: 'Cambiar estado', permisos: EJECUTAR, metodo: 'PATCH', visible: enCurso,
    titulo: (f) => `Mantenimiento ${f.id_mantenimiento}`,
    ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/estado`,
    campos: [
      { nombre: 'nuevo_estado', etiqueta: 'Nuevo estado', requerido: true, opciones: ESTADOS.mantenimiento },
      { nombre: 'anotacion', etiqueta: 'Anotación', tipo: 'textarea', max: 250 },
    ],
    inicial: (f) => ({ nuevo_estado: f.estado }),
    exito: () => 'Estado actualizado.',
  },
  {
    texto: 'Cerrar', permisos: EJECUTAR, visible: enCurso,
    titulo: (f) => `Cerrar el mantenimiento ${f.id_mantenimiento}`,
    ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/cerrar`,
    campos: (f) => [
      { nombre: 'detalle', etiqueta: 'Trabajo realizado', tipo: 'textarea', requerido: true, max: 500 },
      { nombre: 'fecha_fin', etiqueta: 'Fecha de finalización', tipo: 'date', valor: fechas.hoy },
      ...(f.id_incidencia
        ? [{ nombre: 'cerrar_incidencia', etiqueta: `Cerrar también la incidencia ${f.id_incidencia}`, tipo: 'checkbox', valor: true }]
        : []),
    ],
    exito: () => 'Mantenimiento finalizado.',
  },
  {
    texto: 'Historial', metodo: 'GET', permisos: CONSULTAR,
    titulo: (f) => `Historial del mantenimiento ${f.id_mantenimiento}`,
    ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/historial`,
  },
];

const CAMPOS_PROGRAMAR = [
  C.empleado({ etiqueta: 'Responsable', requerido: true }),
  C.tipoTrabajo({ requerido: true }),
  { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'date', valor: fechas.hoy },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', max: 500 },
];

export default {
  id: 'mantenimiento',
  titulo: 'Mantenimiento e incidencias',
  icono: 'herramienta',
  permisos: [...CONSULTAR, P.REGISTRAR_INCIDENCIA, P.EJECUTAR_MANTENIMIENTO],
  secciones: [
    {
      titulo: 'Mis mantenimientos',
      permisos: [P.EJECUTAR_MANTENIMIENTO],
      ruta: '/mantenimientos/mios',
      descripcion: 'Trabajos asignados a usted. Actualice el estado mientras avanza y ciérrelos al terminar.',
      filtros: [{ nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.mantenimiento }],
      acciones: ACCIONES_MANTENIMIENTO,
    },
    {
      titulo: 'Incidencias',
      permisos: CONSULTAR,
      ruta: '/incidencias',
      descripcion: 'Fugas, daños y reportes de la red. La prioridad se calcula según el tipo de incidencia.',
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.incidencia },
        C.tipoIncidencia({ etiqueta: 'Tipo' }),
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
      botones: [nuevaIncidencia],
      acciones: [
        {
          texto: 'Asignar', permisos: GESTIONAR, visible: abierta,
          titulo: (f) => `Asignar mantenimiento a la incidencia ${f.id_incidencia}`,
          ruta: (f) => `/incidencias/${f.id_incidencia}/mantenimiento`,
          campos: CAMPOS_PROGRAMAR,
          exito: (r) => `Mantenimiento ${r.salida?.id_mantenimiento} asignado.`,
        },
        {
          texto: 'Estado', permisos: GESTIONAR, metodo: 'PATCH', visible: abierta,
          titulo: (f) => `Estado de la incidencia ${f.id_incidencia}`,
          ruta: (f) => `/incidencias/${f.id_incidencia}/estado`,
          campos: [
            { nombre: 'nuevo_estado', etiqueta: 'Nuevo estado', requerido: true, opciones: ESTADOS.incidencia },
            { nombre: 'observacion', etiqueta: 'Observación', tipo: 'textarea', max: 250 },
          ],
          inicial: (f) => ({ nuevo_estado: f.estado }),
          exito: () => 'Estado actualizado.',
        },
        {
          texto: 'Cerrar', permisos: GESTIONAR, visible: abierta,
          titulo: (f) => `Cerrar la incidencia ${f.id_incidencia}`,
          ruta: (f) => `/incidencias/${f.id_incidencia}/cerrar`,
          campos: [{ nombre: 'solucion', etiqueta: 'Solución aplicada', tipo: 'textarea', requerido: true, max: 500 }],
          exito: () => 'Incidencia cerrada.',
        },
        {
          texto: 'Historial', metodo: 'GET',
          titulo: (f) => `Historial de la incidencia ${f.id_incidencia}`,
          ruta: (f) => `/incidencias/${f.id_incidencia}/historial`,
        },
      ],
    },
    {
      titulo: 'Registrar incidencia',
      tipo: 'formulario',
      permisos: [P.REGISTRAR_INCIDENCIA],
      ruta: '/incidencias',
      descripcion: 'Reporte una fuga, daño o problema detectado en campo.',
      campos: CAMPOS_INCIDENCIA,
      textoEnviar: 'Registrar incidencia',
      exito: nuevaIncidencia.exito,
    },
    {
      titulo: 'Mantenimientos',
      permisos: CONSULTAR,
      ruta: '/mantenimientos',
      descripcion: 'Todos los trabajos programados, en curso y terminados.',
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.mantenimiento },
        C.empleado({ etiqueta: 'Responsable', permisos: GESTIONAR }),
        { nombre: 'id_conexion', etiqueta: 'Conexión', tipo: 'number', min: 1 },
      ],
      botones: [{
        texto: 'Programar mantenimiento', primario: true, permisos: GESTIONAR, ruta: '/mantenimientos',
        campos: [C.conexion({ requerido: true, ancho: true }), ...CAMPOS_PROGRAMAR,
          { nombre: 'id_incidencia', etiqueta: 'Incidencia relacionada (ID)', tipo: 'number', min: 1 }],
        textoEnviar: 'Programar',
        exito: (r) => `Mantenimiento ${r.salida?.id_mantenimiento} programado.`,
      }],
      acciones: ACCIONES_MANTENIMIENTO,
    },
    {
      titulo: 'Registrar trabajo realizado',
      pestana: 'Trabajo realizado',
      tipo: 'formulario',
      permisos: EJECUTAR,
      ruta: '/mantenimientos/realizados',
      descripcion: 'Para trabajos que ya se hicieron sin haberse programado. Quedan registrados como finalizados.',
      campos: [
        C.conexion({ requerido: true, ancho: true }),
        C.empleado({ etiqueta: 'Responsable', permisos: GESTIONAR, ayuda: 'Vacío = usted.' }),
        C.tipoTrabajo({ requerido: true }),
        { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'date', requerido: true, valor: fechas.hoy },
        { nombre: 'fecha_fin', etiqueta: 'Fecha de finalización', tipo: 'date', valor: fechas.hoy },
        { nombre: 'id_incidencia', etiqueta: 'Incidencia relacionada (ID)', tipo: 'number', min: 1 },
        { nombre: 'descripcion', etiqueta: 'Descripción del trabajo', tipo: 'textarea', requerido: true, max: 500 },
      ],
      textoEnviar: 'Registrar',
      exito: (r) => `Trabajo registrado (mantenimiento ${r.salida?.id_mantenimiento}).`,
    },
  ],
};
