// Módulo del Fontanero: todo el trabajo de campo en un solo lugar
// (ruta de lectura, mantenimientos asignados e incidencias).
import { P } from '../permisos.js';
import { C, ESTADOS, fechas } from './comunes.js';
import {
  COLUMNAS_RUTA_LECTURA,
  accionRegistrarLectura,
  ordenarRutaLectura,
  seccionFormularioLectura,
} from './lecturas.js';

const enCurso = (f) => f.estado === 'Programado' || f.estado === 'En proceso';

const exitoIncidencia = (r) => `Incidencia ${r.salida?.id_incidencia} reportada. La prioridad la asigna el sistema.`;

const camposIncidencia = (medidor) => [
  ...(medidor ? [] : [C.medidor({ requerido: true, ancho: true })]),
  C.tipoIncidencia({ requerido: true }),
  { nombre: 'fecha_incidente', etiqueta: 'Fecha', tipo: 'date', valor: fechas.hoy },
  { nombre: 'ubicacion', etiqueta: 'Ubicación', max: 200, ayuda: 'Vacía = la de la conexión.' },
  { nombre: 'descripcion', etiqueta: 'Qué encontró', tipo: 'textarea', requerido: true, max: 500 },
];

export default {
  id: 'campo',
  titulo: 'Trabajo de campo',
  icono: 'herramienta',
  permisos: [P.EJECUTAR_MANTENIMIENTO],
  secciones: [
    {
      titulo: 'Mis trabajos pendientes',
      pestana: 'Mis trabajos',
      ruta: '/mantenimientos/mios',
      descripcion: 'Mantenimientos asignados a usted. Márquelos "En proceso" al empezar y ciérrelos al terminar.',
      filtros: [{ nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.mantenimiento }],
      acciones: [
        {
          texto: 'Iniciar', metodo: 'PATCH', visible: (f) => f.estado === 'Programado',
          ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/estado`,
          cuerpo: () => ({ nuevo_estado: 'En proceso' }),
          confirmar: (f) => `¿Marcar el mantenimiento ${f.id_mantenimiento} como "En proceso"?`,
          exito: () => 'Trabajo iniciado.',
        },
        {
          texto: 'Anotar', metodo: 'PATCH', visible: enCurso,
          titulo: (f) => `Anotación en el mantenimiento ${f.id_mantenimiento}`,
          ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/estado`,
          campos: [{ nombre: 'anotacion', etiqueta: 'Anotación', tipo: 'textarea', requerido: true, max: 250 }],
          cuerpo: (f) => ({ nuevo_estado: f.estado }),
          exito: () => 'Anotación guardada.',
        },
        {
          texto: 'Terminar', visible: enCurso,
          titulo: (f) => `Terminar el mantenimiento ${f.id_mantenimiento}`,
          ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/cerrar`,
          campos: (f) => [
            { nombre: 'detalle', etiqueta: 'Trabajo realizado', tipo: 'textarea', requerido: true, max: 500 },
            { nombre: 'fecha_fin', etiqueta: 'Fecha de finalización', tipo: 'date', valor: fechas.hoy },
            ...(f.id_incidencia
              ? [{ nombre: 'cerrar_incidencia', etiqueta: `Cerrar también la incidencia ${f.id_incidencia}`, tipo: 'checkbox', valor: true }]
              : []),
          ],
          textoEnviar: 'Terminar trabajo',
          exito: () => 'Mantenimiento finalizado.',
        },
        {
          texto: 'Historial', metodo: 'GET',
          titulo: (f) => `Historial del mantenimiento ${f.id_mantenimiento}`,
          ruta: (f) => `/mantenimientos/${f.id_mantenimiento}/historial`,
        },
      ],
    },
    {
      titulo: 'Ruta de lectura del mes',
      pestana: 'Ruta de lectura',
      permisos: [P.REGISTRAR_LECTURA],
      ruta: '/medidores/sin-lectura',
      descripcion: 'Medidores que todavía no tienen lectura este mes, ordenados por ubicación y serie. Al registrar la lectura el consumo se calcula solo y, si es anómalo, se genera una alerta.',
      mensajeVacio: 'Todos los medidores activos ya tienen lectura este mes.',
      transformar: ordenarRutaLectura,
      columnas: COLUMNAS_RUTA_LECTURA,
      acciones: [
        accionRegistrarLectura({ texto: 'Leer', permisos: [P.REGISTRAR_LECTURA] }),
        {
          texto: 'Reportar', permisos: [P.REGISTRAR_INCIDENCIA], ruta: '/incidencias', suave: true,
          titulo: (f) => `Problema en el medidor ${f.numero_serie}`,
          campos: camposIncidencia(true),
          cuerpo: (f) => ({ id_medidor: f.id_medidor }),
          textoEnviar: 'Reportar',
          exito: exitoIncidencia,
        },
      ],
    },
    seccionFormularioLectura({
      pestana: 'Registrar lectura',
      titulo: 'Registrar lectura de cualquier medidor',
      permisos: [P.REGISTRAR_LECTURA],
      descripcion: 'Elija el medidor: verá la lectura anterior o inicial antes de guardar.',
    }),
    {
      titulo: 'Reportar una incidencia',
      pestana: 'Reportar incidencia',
      tipo: 'formulario',
      permisos: [P.REGISTRAR_INCIDENCIA],
      ruta: '/incidencias',
      descripcion: 'Fugas, daños en medidores o tuberías, baja presión y cualquier problema que encuentre en la red.',
      campos: camposIncidencia(false),
      textoEnviar: 'Reportar incidencia',
      exito: exitoIncidencia,
    },
    {
      titulo: 'Incidencias abiertas',
      permisos: [P.CONSULTAR_MANTENIMIENTO],
      ruta: '/incidencias/abiertas',
      descripcion: 'Problemas reportados que todavía no se han resuelto.',
    },
    {
      titulo: 'Registrar trabajo ya realizado',
      pestana: 'Trabajo realizado',
      tipo: 'formulario',
      ruta: '/mantenimientos/realizados',
      descripcion: 'Para trabajos que hizo sin que estuvieran programados. Quedan a su nombre y como finalizados.',
      campos: [
        C.conexion({ requerido: true, ancho: true }),
        C.tipoTrabajo({ requerido: true }),
        { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'date', requerido: true, valor: fechas.hoy },
        { nombre: 'fecha_fin', etiqueta: 'Fecha de finalización', tipo: 'date', valor: fechas.hoy },
        { nombre: 'descripcion', etiqueta: 'Descripción del trabajo', tipo: 'textarea', requerido: true, max: 500 },
      ],
      textoEnviar: 'Registrar',
      exito: (r) => `Trabajo registrado (mantenimiento ${r.salida?.id_mantenimiento}).`,
    },
  ],
};
