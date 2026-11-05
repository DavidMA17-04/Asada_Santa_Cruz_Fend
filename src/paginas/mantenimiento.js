import React from 'react';
// R4 · Mantenimientos e incidencias (CU-5.x).
import { P } from '../permisos.js';
import { numero } from '../ui/formato.js';
import { C, ESTADOS, fechas } from './comunes.js';
import { abrirModal, FichaSeguimientoIncidencia } from '../ui/index.js';

const CONSULTAR = [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO];
const GESTIONAR = [P.GESTIONAR_MANTENIMIENTO];
const EJECUTAR = [P.EJECUTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO];
const REGISTRAR_INCIDENCIA = [P.REGISTRAR_INCIDENCIA, P.GESTIONAR_MANTENIMIENTO];

// Lo que el Administrador del Sistema no usa (otros roles sí, p. ej. el Fontanero).
const ADMIN = ['Administrador del Sistema'];

const abierta = (f) => f.estado !== 'Resuelta';
const resuelta = (f) => f.estado === 'Resuelta';
const enCurso = (f) => f.estado === 'Programado' || f.estado === 'En proceso';

function enriquecerIncidencias(filas = []) {
  return filas.map((f) => ({
    ...f,
    tipo: f.tipo || f.nombre_tipo || f.tipo_incidencia || '—',
    medidor: f.medidor || f.numero_serie || f.serie || '—',
    estado_sla: f.estado_sla || (f.horas_resolucion > f.sla_horas ? 'Vencida' : 'En tiempo'),
  }));
}

function metricasIncidencias(filas = []) {
  const total = filas.length;
  const abiertas = filas.filter((f) => String(f.estado).toLowerCase() === 'abierta').length;
  const proceso = filas.filter((f) => /proceso/i.test(String(f.estado || ''))).length;
  const altas = filas.filter((f) => String(f.prioridad).toLowerCase() === 'alta').length;
  const vencidas = filas.filter((f) => /vencid/i.test(String(f.estado_sla || '')) && f.estado !== 'Resuelta').length;

  return [
    {
      titulo: 'Total Incidencias',
      valor: numero(total),
      detalle: 'Reportes en consulta',
      tono: 'oceano',
      icono: 'alerta',
    },
    {
      titulo: 'Activas / En curso',
      valor: numero(abiertas + proceso),
      detalle: `${numero(proceso)} con fontanero en campo`,
      tono: abiertas + proceso > 0 ? 'ambar' : 'verde',
      icono: 'reloj',
    },
    {
      titulo: 'Prioridad Alta',
      valor: numero(altas),
      detalle: 'Atención urgente requerida',
      tono: altas > 0 ? 'rojo' : 'verde',
      icono: 'peligro',
    },
    {
      titulo: 'Compromiso SLA',
      valor: vencidas > 0 ? `${numero(vencidas)} fuera de tiempo` : '100% en tiempo',
      detalle: vencidas > 0 ? 'Incidencias con plazo excedido' : 'Cumplimiento óptimo',
      tono: vencidas > 0 ? 'rojo' : 'verde',
      icono: 'estadistica',
    },
  ];
}

const COLUMNAS_INCIDENCIAS = [
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'prioridad', etiqueta: 'Prioridad' },
  { campo: 'estado_sla', etiqueta: 'Semáforo SLA' },
  { campo: 'id_incidencia', etiqueta: 'Nº', clase: 'num' },
  { campo: 'tipo', etiqueta: 'Tipo' },
  { campo: 'fecha_incidente', etiqueta: 'Fecha reporte' },
  { campo: 'ubicacion', etiqueta: 'Ubicación', clase: 'abonado-corto' },
  { campo: 'medidor', etiqueta: 'Medidor' },
  { campo: 'descripcion', etiqueta: 'Descripción', clase: 'texto-largo' },
];

function enriquecerMantenimientos(filas = []) {
  return filas.map((f) => ({
    ...f,
    tipo_trabajo: f.tipo_trabajo || f.nombre_trabajo || f.tipo || '—',
    responsable: f.responsable || f.nombre_empleado || f.empleado || '—',
    ubicacion: f.ubicacion || f.direccion || '—',
  }));
}

function metricasMantenimientos(filas = []) {
  const total = filas.length;
  const programados = filas.filter((f) => /programad/i.test(String(f.estado || ''))).length;
  const proceso = filas.filter((f) => /proceso/i.test(String(f.estado || ''))).length;
  const finalizados = filas.filter((f) => /finalizad/i.test(String(f.estado || ''))).length;

  return [
    {
      titulo: 'Total Trabajos',
      valor: numero(total),
      detalle: 'Órdenes de trabajo',
      tono: 'oceano',
      icono: 'herramienta',
    },
    {
      titulo: 'Programados',
      valor: numero(programados),
      detalle: 'Listos para iniciar',
      tono: programados > 0 ? 'ambar' : 'neutral',
      icono: 'calendario',
    },
    {
      titulo: 'En Proceso',
      valor: numero(proceso),
      detalle: 'En atención en campo ahora',
      tono: proceso > 0 ? 'cielo' : 'neutral',
      icono: 'reloj',
    },
    {
      titulo: 'Finalizados',
      valor: numero(finalizados),
      detalle: 'Completados y documentados',
      tono: 'verde',
      icono: 'check',
    },
  ];
}

const COLUMNAS_MANTENIMIENTOS = [
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'id_mantenimiento', etiqueta: 'Nº Orden', clase: 'num' },
  { campo: 'tipo_trabajo', etiqueta: 'Tipo de trabajo' },
  { campo: 'responsable', etiqueta: 'Fontanero asignado', clase: 'abonado-corto' },
  { campo: 'ubicacion', etiqueta: 'Ubicación', clase: 'abonado-corto' },
  { campo: 'id_incidencia', etiqueta: 'Incidencia', clase: 'num' },
  { campo: 'fecha_inicio', etiqueta: 'Fecha inicio' },
  { campo: 'descripcion', etiqueta: 'Descripción', clase: 'texto-largo' },
];

const CAMPOS_INCIDENCIA = [
  C.medidor({ requerido: true, ancho: true }),
  C.tipoIncidencia({ requerido: true }),
  { nombre: 'fecha_incidente', etiqueta: 'Fecha del incidente', tipo: 'date', valor: fechas.hoy },
  { nombre: 'ubicacion', etiqueta: 'Ubicación específica', max: 200, ayuda: 'Si se deja vacía, se tomará automáticamente la dirección de la conexión.' },
  C.alerta({ etiqueta: 'Alerta de consumo relacionada (opcional)', ancho: true }),
  { nombre: 'descripcion', etiqueta: 'Descripción detallada de la anomalía', tipo: 'textarea', requerido: true, max: 500, marcador: 'Describa fuga, presión baja, rotura o daño visible…' },
];

const ACCION_AUTO_ASIGNAR = {
  texto: 'Auto-asignar fontanero',
  permisos: GESTIONAR,
  primario: true,
  ruta: (f) => `/incidencias/${f.id_incidencia}/mantenimiento-automatico`,
  campos: [
    C.tipoTrabajo({ requerido: true }),
    { nombre: 'fecha_inicio', etiqueta: 'Fecha programada de inicio', tipo: 'date', valor: fechas.hoy },
    { nombre: 'descripcion', etiqueta: 'Instrucciones técnicas para el fontanero', tipo: 'textarea', max: 500, ayuda: 'El sistema seleccionará automáticamente al fontanero activo con menor carga activa y mejor tasa de cumplimiento.' },
  ],
  exito: (r) => `Orden de mantenimiento #${r.salida?.id_mantenimiento} asignada con éxito al técnico ID ${r.salida?.id_empleado_asignado}.`,
};

const ACCION_ASIGNAR_MANUAL = {
  texto: 'Asignar fontanero',
  permisos: GESTIONAR,
  ruta: (f) => `/incidencias/${f.id_incidencia}/mantenimiento`,
  campos: [
    C.fontanero({ etiqueta: 'Fontanero responsable', requerido: true, ancho: true }),
    C.tipoTrabajo({ requerido: true }),
    { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio programada', tipo: 'date', valor: fechas.hoy },
    { nombre: 'descripcion', etiqueta: 'Instrucciones para el trabajo', tipo: 'textarea', max: 500 },
  ],
  exito: (r) => `Mantenimiento #${r.salida?.id_mantenimiento} programado.`,
}


const ACCIONES_MANTENIMIENTO = [
  {
    texto: 'Cambiar estado', permisos: EJECUTAR, metodo: 'PATCH', visible: enCurso,
    titulo: (f) => `Actualizar estado orden #${f.id_mantenimiento}`,
    ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/estado`,
    campos: [
      {
        nombre: 'nuevo_estado',
        etiqueta: 'Nuevo estado',
        requerido: true,
        opciones: ['Programado', 'En proceso', 'Cancelado'],
        ayuda: 'Para dar por finalizado el trabajo use el botón "Cerrar orden".',
      },
      { nombre: 'anotacion', etiqueta: 'Anotación / Bitácora', tipo: 'textarea', max: 250 },
    ],
    inicial: (f) => ({ nuevo_estado: f.estado }),
    exito: () => 'Estado actualizado.',
  },
  {
    texto: 'Reasignar', permisos: GESTIONAR, metodo: 'PATCH', visible: enCurso,
    titulo: (f) => `Reasignar orden #${f.id_mantenimiento}`,
    ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/reasignar`,
    campos: [
      C.fontanero({ nombre: 'id_nuevo_empleado', etiqueta: 'Nuevo fontanero responsable', requerido: true, ancho: true }),
      { nombre: 'motivo', etiqueta: 'Motivo de la reasignación', tipo: 'textarea', requerido: true, max: 300 },
    ],
    exito: () => 'Mantenimiento reasignado correctamente.',
  },
  {
    texto: 'Cerrar orden', permisos: EJECUTAR, primario: true, visible: enCurso,
    titulo: (f) => `Cerrar orden #${f.id_mantenimiento}`,
    ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/cerrar`,
    campos: (f) => [
      { nombre: 'detalle', etiqueta: 'Trabajo realizado en campo', tipo: 'textarea', requerido: true, max: 500, marcador: 'Describa piezas cambiadas, reparación o pruebas efectuadas…' },
      { nombre: 'fecha_fin', etiqueta: 'Fecha de finalización', tipo: 'date', valor: fechas.hoy },
      ...(f.id_incidencia
        ? [{ nombre: 'cerrar_incidencia', etiqueta: `Dar por resuelta la incidencia #${f.id_incidencia}`, tipo: 'checkbox', valor: true }]
        : []),
    ],
    exito: () => 'Mantenimiento finalizado con éxito.',
  },
  {
    texto: 'Historial', metodo: 'GET', permisos: CONSULTAR,
    titulo: (f) => `Historial de la orden #${f.id_mantenimiento}`,
    ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/historial`,
  },
];

export default {
  id: 'mantenimiento',
  titulo: 'Mantenimiento e incidencias',
  icono: 'herramienta',
  permisos: [...CONSULTAR, P.REGISTRAR_INCIDENCIA, P.EJECUTAR_MANTENIMIENTO],
  secciones: [
    // ----------------------------------------------------
    // SECCIÓN 1: MI JORNADA (TRABAJOS DEL FONTANERO)
    // ----------------------------------------------------
    {
      titulo: 'Mis mantenimientos en campo',
      pestana: 'Mi jornada',
      permisos: EJECUTAR,
      ocultarA: ADMIN,
      ruta: '/mantenimientos/mios',
      descripcion: 'Órdenes de trabajo asignadas a usted. Pase el trabajo a "En proceso" al iniciar en sitio y finalícelo al terminar la labor.',
      mensajeVacio: 'No tiene mantenimientos pendientes en este momento.',
      placeholderBusqueda: 'Buscar por tipo, ubicación o notas…',
      transformar: enriquecerMantenimientos,
      metricas: metricasMantenimientos,
      columnas: COLUMNAS_MANTENIMIENTOS,
      ocultar: ['id_empleado', 'id_conexion', 'nombre_trabajo', 'nombre_empleado', 'empleado'],
      filtros: [{ nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.mantenimiento }],
      acciones: ACCIONES_MANTENIMIENTO,
    },

    // ----------------------------------------------------
    // SECCIÓN 2: BANDEJA DE INCIDENCIAS (GESTIÓN & SLA)
    // ----------------------------------------------------
    {
      titulo: 'Bandeja de incidencias',
      pestana: 'Incidencias',
      permisos: CONSULTAR,
      ruta: '/incidencias',
      descripcion: 'Fugas, daños y reportes de la red con semáforo SLA en tiempo real, asignación inteligente y seguimiento detallado.',
      mensajeVacio: 'No hay incidencias que coincidan con los filtros aplicados.',
      placeholderBusqueda: 'Buscar por tipo, ubicación, medidor o descripción…',
      transformar: enriquecerIncidencias,
      metricas: metricasIncidencias,
      columnas: COLUMNAS_INCIDENCIAS,
      ocultar: ['id_conexion', 'id_tipo_incidencia', 'nombre_tipo', 'tipo_incidencia', 'numero_serie', 'horas_resolucion', 'sla_horas'],
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.incidencia },
        C.tipoIncidencia({ etiqueta: 'Tipo' }),
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
      botones: [
        {
          texto: 'Reportar incidencia',
          primario: true,
          permisos: REGISTRAR_INCIDENCIA,
          icono: 'mas',
          ruta: '/incidencias',
          campos: CAMPOS_INCIDENCIA,
          textoEnviar: 'Registrar reporte',
          exito: (r) => `Incidencia #${r.salida?.id_incidencia} registrada con éxito. La prioridad y SLA han sido calculados automáticamente.`,
        },
      ],
      acciones: [
        {
          texto: 'Seguimiento',
          icono: 'ojo',
          titulo: (f) => `Seguimiento de la incidencia #${f.id_incidencia}`,
          ejecutar: (f, recargar) => {
            const modalRef = { actual: null };
            modalRef.actual = abrirModal(
              `Ficha Técnica: Incidencia #${f.id_incidencia}`,
              React.createElement(FichaSeguimientoIncidencia, {
                incidencia: f,
                cerrar: () => modalRef.actual?.cerrar(),
                onAccion: (tipoAccion, filaIncidencia) => {
                  if (tipoAccion === 'auto-asignar') {
                    window.ejecutarAccionGlobal?.(ACCION_AUTO_ASIGNAR, filaIncidencia, recargar);
                  } else if (tipoAccion === 'asignar') {
                    window.ejecutarAccionGlobal?.(ACCION_ASIGNAR_MANUAL, filaIncidencia, recargar);
                  }
                },
              }),
              { tamano: 'ancho' }
            );
          },
        },
        {
          ...ACCION_AUTO_ASIGNAR,
          texto: 'Auto-asignar',
          visible: abierta,
        },
        {
          ...ACCION_ASIGNAR_MANUAL,
          texto: 'Asignar',
          visible: abierta,
        },
        {
          texto: 'Prioridad',
          permisos: GESTIONAR,
          metodo: 'PATCH',
          visible: abierta,
          titulo: (f) => `Ajustar prioridad de incidencia #${f.id_incidencia}`,
          ruta: (f) => `/incidencias/${f.id_incidencia}/prioridad`,
          campos: [
            { nombre: 'nueva_prioridad', etiqueta: 'Nueva prioridad (vacío = subir un nivel)', opciones: ['Alta', 'Media', 'Baja'] },
            { nombre: 'observacion', etiqueta: 'Justificación técnica del cambio', tipo: 'textarea', requerido: true, max: 300 },
          ],
          inicial: (f) => ({ nueva_prioridad: f.prioridad === 'Baja' ? 'Media' : 'Alta' }),
          exito: () => 'Prioridad actualizada y registrada en la bitácora.',
        },
        {
          texto: 'Cerrar',
          permisos: GESTIONAR,
          visible: abierta,
          titulo: (f) => `Cerrar incidencia #${f.id_incidencia}`,
          ruta: (f) => `/incidencias/${f.id_incidencia}/cerrar`,
          campos: [{ nombre: 'solucion', etiqueta: 'Solución aplicada en campo', tipo: 'textarea', requerido: true, max: 500 }],
          exito: () => 'Incidencia dada por resuelta.',
        },
        {
          texto: 'Reabrir',
          permisos: GESTIONAR,
          visible: resuelta,
          titulo: (f) => `Reabrir incidencia #${f.id_incidencia}`,
          ruta: (f) => `/incidencias/${f.id_incidencia}/reabrir`,
          campos: [{ nombre: 'motivo', etiqueta: 'Motivo de reapertura (reincidencia de falla)', tipo: 'textarea', requerido: true, max: 500 }],
          exito: () => 'Incidencia reabierta en el sistema.',
        },
      ],
    },

    // ----------------------------------------------------
    // SECCIÓN 3: ÓRDENES DE MANTENIMIENTO
    // ----------------------------------------------------
    {
      titulo: 'Órdenes de mantenimiento',
      pestana: 'Mantenimientos',
      permisos: CONSULTAR,
      ruta: '/mantenimientos',
      descripcion: 'Bitácora general de trabajos preventivos y correctivos programados, en ejecución y finalizados en toda la red.',
      mensajeVacio: 'No hay órdenes de mantenimiento para los filtros indicados.',
      placeholderBusqueda: 'Buscar por tipo, fontanero, ubicación o descripción…',
      transformar: enriquecerMantenimientos,
      metricas: metricasMantenimientos,
      columnas: COLUMNAS_MANTENIMIENTOS,
      ocultar: ['id_empleado', 'id_conexion', 'nombre_trabajo', 'nombre_empleado', 'empleado'],
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.mantenimiento },
        C.fontanero({ etiqueta: 'Fontanero asignado', permisos: GESTIONAR }),
        { nombre: 'id_conexion', etiqueta: 'Conexión (Nº)', tipo: 'number', min: 1 },
      ],
      botones: [
        {
          texto: 'Programar mantenimiento',
          primario: true,
          permisos: GESTIONAR,
          icono: 'mas',
          ruta: '/mantenimientos',
          campos: [
            C.conexion({ requerido: true, ancho: true }),
            C.fontanero({ etiqueta: 'Fontanero responsable', requerido: true }),
            C.tipoTrabajo({ requerido: true }),
            { nombre: 'fecha_inicio', etiqueta: 'Fecha programada de inicio', tipo: 'date', valor: fechas.hoy },
            C.incidencia({ etiqueta: 'Incidencia relacionada (opcional)', ancho: true }),
            { nombre: 'descripcion', etiqueta: 'Instrucciones del trabajo', tipo: 'textarea', max: 500 },
          ],
          textoEnviar: 'Crear orden',
          exito: (r) => `Orden de mantenimiento #${r.salida?.id_mantenimiento} programada con éxito.`,
        },
        {
          texto: 'Registrar trabajo directo',
          permisos: EJECUTAR,
          ocultarA: ADMIN,
          icono: 'check',
          ruta: '/mantenimientos/realizados',
          campos: [
            C.conexion({ requerido: true, ancho: true }),
            C.fontanero({ etiqueta: 'Fontanero responsable', permisos: GESTIONAR, ayuda: 'Si se deja vacío se asignará a usted.' }),
            C.tipoTrabajo({ requerido: true }),
            { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'date', requerido: true, valor: fechas.hoy },
            { nombre: 'fecha_fin', etiqueta: 'Fecha de finalización', tipo: 'date', valor: fechas.hoy },
            C.incidencia({ etiqueta: 'Incidencia relacionada (opcional)', ancho: true }),
            { nombre: 'descripcion', etiqueta: 'Detalle del trabajo ejecutado', tipo: 'textarea', requerido: true, max: 500 },
          ],
          textoEnviar: 'Guardar trabajo realizado',
          exito: (r) => `Trabajo registrado correctamente como orden finalizada #${r.salida?.id_mantenimiento}.`,
        },
      ],
      acciones: ACCIONES_MANTENIMIENTO,
    },

    // ----------------------------------------------------
    // SECCIÓN 4: DIAGNÓSTICO OPERATIVO & SLA
    // ----------------------------------------------------
    {
      titulo: 'Diagnóstico operativo, SLA y carga por empleado',
      pestana: 'Diagnóstico y SLA',
      permisos: CONSULTAR,
      ruta: '/mantenimientos/resumen-operativo',
      descripcion: 'Indicadores de cumplimiento de SLA por prioridad, balance de carga e índice de eficiencia por fontanero, y conexiones con fallas recurrentes.',
      mensajeVacio: 'No hay datos operativos para el periodo seleccionado.',
      placeholderBusqueda: 'Buscar por prioridad, empleado o conexión…',
      filtros: [
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
      conjuntos: [
        'Cumplimiento de SLA por prioridad',
        'Carga e eficiencia por fontanero',
        'Resumen operativo por conexión',
      ],
    },
  ],
};
