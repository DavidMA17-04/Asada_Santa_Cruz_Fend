// R1 · Abonados, conexiones y medidores (CU-2.x).
import { P } from '../permisos.js';
import { numero } from '../ui/formato.js';
import { C, ESTADOS, TIPO_ABONADO } from './comunes.js';

const CONSULTAR = [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS];
const GESTIONAR = [P.GESTIONAR_ABONADOS];
const VER_MEDIDORES = [...CONSULTAR, P.REGISTRAR_LECTURA, P.REGISTRAR_INCIDENCIA, P.CONSULTAR_FACTURAS];

const esJuridico = (v) => v.tipo_identificacion === 'JURIDICA';
const esFisico = (v) => v.tipo_identificacion && !esJuridico(v);

const ETIQUETA_TIPO = {
  FISICO: 'Físico',
  JURIDICO: 'Jurídico',
  FISICA: 'Físico',
  JURIDICA: 'Jurídico',
};

function enriquecerAbonados(filas = []) {
  return filas.map((f) => ({
    ...f,
    tipo: ETIQUETA_TIPO[f.tipo_abonado] || f.tipo_abonado || '—',
    contacto: [f.telefono, f.correo_electronico].filter(Boolean).join(' · ') || '—',
  }));
}

function metricasAbonados(filas = []) {
  const total = filas.length;
  const activos = filas.filter((f) => f.activo === true || f.activo === 1 || String(f.activo).toLowerCase() === 'true').length;
  const fisicos = filas.filter((f) => /fisic/i.test(String(f.tipo_abonado || ''))).length;
  const juridicos = total - fisicos;

  return [
    {
      titulo: 'Abonados',
      valor: numero(total),
      detalle: 'En la consulta',
      tono: 'oceano',
      icono: 'usuarios',
    },
    {
      titulo: 'Activos',
      valor: numero(activos),
      detalle: 'Habilitados',
      tono: 'verde',
      icono: 'check',
    },
    {
      titulo: 'Físicos',
      valor: numero(fisicos),
      detalle: 'Personas',
      tono: 'cielo',
      icono: 'perfil',
    },
    {
      titulo: 'Jurídicos',
      valor: numero(juridicos),
      detalle: 'Empresas / entidades',
      tono: 'marino',
      icono: 'lista',
    },
  ];
}

const COLUMNAS_ABONADOS = [
  { campo: 'activo', etiqueta: 'Estado' },
  { campo: 'tipo', etiqueta: 'Tipo' },
  { campo: 'nombre_completo', etiqueta: 'Nombre', clase: 'abonado-corto' },
  { campo: 'identificacion', etiqueta: 'Identificación' },
  { campo: 'direccion', etiqueta: 'Dirección', clase: 'texto-largo' },
  { campo: 'contacto', etiqueta: 'Contacto', clase: 'texto-largo' },
  { campo: 'fecha_registro', etiqueta: 'Registro' },
];

const CAMPOS_NUEVO_ABONADO = [
  {
    nombre: 'tipo_identificacion', etiqueta: 'Tipo de identificación', requerido: true,
    opciones: [
      { valor: 'FISICA', texto: 'Cédula física' },
      { valor: 'DIMEX', texto: 'DIMEX' },
      { valor: 'NITE', texto: 'NITE' },
      { valor: 'PASAPORTE', texto: 'Pasaporte' },
      { valor: 'JURIDICA', texto: 'Cédula jurídica' },
    ],
  },
  { nombre: 'numero_identidad', etiqueta: 'Número de identificación', requerido: true, max: 50, ayuda: 'Sin guiones ni espacios. Física: 9 dígitos. Jurídica: 10 y empieza con 3. DIMEX: 11 o 12. NITE: 10. Pasaporte: 6 a 20.' },
  { nombre: 'nombre', etiqueta: 'Nombre o razón social', requerido: true, max: 50 },
  { nombre: 'apellido1', etiqueta: 'Primer apellido', max: 50, visibleSi: esFisico, ayuda: 'Obligatorio para personas físicas.' },
  { nombre: 'apellido2', etiqueta: 'Segundo apellido', max: 50, visibleSi: esFisico },
  { nombre: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', visibleSi: esFisico },
  { nombre: 'telefono', etiqueta: 'Teléfono', max: 20 },
  { nombre: 'correo_electronico', etiqueta: 'Correo electrónico', tipo: 'email', max: 100 },
  { nombre: 'direccion', etiqueta: 'Dirección', requerido: true, max: 200, ancho: true },
  { nombre: 'cedula_representante', etiqueta: 'Cédula del representante', max: 20, visibleSi: esJuridico },
  { nombre: 'nombre_representante', etiqueta: 'Nombre del representante', max: 50, visibleSi: esJuridico },
  { nombre: 'apellido1_representante', etiqueta: 'Primer apellido del representante', max: 50, visibleSi: esJuridico },
  { nombre: 'apellido2_representante', etiqueta: 'Segundo apellido del representante', max: 50, visibleSi: esJuridico },
];

const camposEditarAbonado = (f) => [
  { nombre: 'telefono', etiqueta: 'Teléfono', max: 20 },
  { nombre: 'correo_electronico', etiqueta: 'Correo electrónico', tipo: 'email', max: 100 },
  { nombre: 'direccion', etiqueta: 'Dirección', max: 200, ancho: true },
  ...(f.tipo_abonado === 'FISICO'
    ? [
      { nombre: 'nombre', etiqueta: 'Nombre', max: 50, ayuda: 'Deje en blanco para conservarlo.' },
      { nombre: 'apellido1', etiqueta: 'Primer apellido', max: 50 },
      { nombre: 'apellido2', etiqueta: 'Segundo apellido', max: 50 },
    ]
    : [
      { nombre: 'nombre', etiqueta: 'Razón social', max: 50, ayuda: 'Deje en blanco para conservarla.' },
      { nombre: 'cedula_representante', etiqueta: 'Cédula del representante', max: 20 },
      { nombre: 'nombre_representante', etiqueta: 'Nombre del representante', max: 50 },
      { nombre: 'apellido1_representante', etiqueta: 'Primer apellido del representante', max: 50 },
      { nombre: 'apellido2_representante', etiqueta: 'Segundo apellido del representante', max: 50 },
    ]),
];

// Acciones sobre una fila que tenga id_conexion (listado de conexiones de un abonado o no activas).
export const ACCIONES_CONEXION = [
  {
    texto: 'Cambiar estado', permisos: GESTIONAR, metodo: 'PATCH',
    titulo: (f) => `Estado de la conexión ${f.id_conexion}`,
    ruta: (f) => `/conexiones/${f.id_conexion}/estado`,
    campos: [
      { nombre: 'nuevo_estado', etiqueta: 'Nuevo estado', requerido: true, opciones: ESTADOS.conexion },
      { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'textarea', requerido: true, max: 250 },
    ],
    inicial: (f) => ({ nuevo_estado: f.estado }),
    exito: () => 'Estado de la conexión actualizado.',
  },
  {
    texto: 'Cambiar tarifa', permisos: GESTIONAR, metodo: 'PATCH',
    titulo: (f) => `Tarifa de la conexión ${f.id_conexion}`,
    ruta: (f) => `/conexiones/${f.id_conexion}/tarifa`,
    campos: [C.tarifa({ requerido: true, ancho: true }), { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'textarea', max: 250 }],
    exito: () => 'Tarifa asignada.',
  },
  {
    texto: 'Agregar medidor', permisos: GESTIONAR,
    titulo: (f) => `Asignar medidor a la conexión ${f.id_conexion}`,
    ruta: (f) => `/conexiones/${f.id_conexion}/medidor`,
    visible: (f) => !f.estado || f.estado === 'Activa',
    campos: (f) => [
      { nombre: 'numero_serie', etiqueta: 'Número de serie', requerido: true, max: 50 },
      { nombre: 'lectura_inicial', etiqueta: 'Lectura inicial (m³)', tipo: 'number', min: 0, valor: 0 },
      ...(f.id_medidor
        ? [{ nombre: 'sustituir', etiqueta: `Sustituir el medidor actual (${f.numero_serie})`, tipo: 'checkbox', valor: true }]
        : []),
    ],
    exito: (r) => `Medidor asignado (ID ${r.salida?.id_medidor}).`,
  },
  {
    texto: 'Lecturas', metodo: 'GET', permisos: [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION],
    titulo: (f) => `Lecturas de la conexión ${f.id_conexion}`,
    ruta: (f) => `/lecturas/historial?id_conexion=${f.id_conexion}`,
  },
  {
    texto: 'Facturas', metodo: 'GET', permisos: [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION, P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    titulo: (f) => `Facturas de la conexión ${f.id_conexion}`,
    ruta: (f) => `/facturas?id_conexion=${f.id_conexion}`,
  },
];

export default {
  id: 'abonados',
  titulo: 'Abonados y conexiones',
  icono: 'usuarios',
  permisos: VER_MEDIDORES,
  secciones: [
    {
      titulo: 'Abonados',
      permisos: CONSULTAR,
      ruta: '/abonados',
      descripcion: 'Personas físicas y jurídicas que reciben el servicio. En cada uno se administran sus conexiones y medidores.',
      mensajeVacio: 'No hay abonados para los filtros indicados.',
      placeholderBusqueda: 'Buscar nombre, identificación, teléfono o correo…',
      transformar: enriquecerAbonados,
      metricas: metricasAbonados,
      columnas: COLUMNAS_ABONADOS,
      ocultar: [
        'id_abonado', 'tipo_abonado', 'tipo_identificacion', 'telefono',
        'correo_electronico', 'fecha_nacimiento',
      ],
      filtros: [
        { nombre: 'tipo_abonado', etiqueta: 'Tipo abonado', opciones: TIPO_ABONADO },
        { nombre: 'identificacion', etiqueta: 'Identificación' },
        { nombre: 'nombre', etiqueta: 'Nombre o razón social' },
      ],
      botones: [{
        texto: 'Nuevo abonado', primario: true, permisos: GESTIONAR, icono: 'mas', ruta: '/abonados',
        campos: CAMPOS_NUEVO_ABONADO, textoEnviar: 'Registrar',
        exito: (r) => `Abonado registrado (ID ${r.salida?.id_abonado}).`,
      }],
      acciones: [
        {
          texto: 'Conexiones', metodo: 'GET',
          titulo: (f) => `Conexiones de ${f.nombre_completo}`,
          ruta: (f) => `/abonados/${f.tipo_abonado}/${f.id_abonado}/conexiones`,
          acciones: ACCIONES_CONEXION,
          botones: (f) => (f.activo ? [{
            texto: 'Nueva conexión', primario: true, permisos: GESTIONAR, ruta: '/conexiones',
            titulo: `Nueva conexión para ${f.nombre_completo}`,
            campos: [C.tarifa({ requerido: true }), { nombre: 'ubicacion', etiqueta: 'Ubicación', requerido: true, max: 200, ancho: true }],
            cuerpo: () => ({ tipo_abonado: f.tipo_abonado, id_abonado: f.id_abonado }),
            exito: (r) => `Conexión ${r.salida?.id_conexion} registrada.`,
          }] : []),
        },
        {
          texto: 'Editar', permisos: GESTIONAR, metodo: 'PUT',
          titulo: (f) => `Editar a ${f.nombre_completo}`,
          ruta: (f) => `/abonados/${f.tipo_abonado}/${f.id_abonado}`,
          campos: camposEditarAbonado,
          inicial: (f) => ({ direccion: f.direccion, telefono: f.telefono, correo_electronico: f.correo_electronico }),
          exito: () => 'Abonado actualizado.',
        },
        {
          texto: 'Desactivar', permisos: GESTIONAR, metodo: 'DELETE', peligro: true,
          visible: (f) => f.activo,
          ruta: (f) => `/abonados/${f.tipo_abonado}/${f.id_abonado}`,
          confirmar: (f) => `¿Desactivar a ${f.nombre_completo}? No se permite si tiene conexiones activas o saldos pendientes.`,
          exito: () => 'Abonado desactivado.',
        },
      ],
    },
    {
      titulo: 'Conexiones no activas',
      pestana: 'Conexiones no activas',
      permisos: CONSULTAR,
      ruta: '/conexiones/no-activas',
      descripcion: 'Conexiones suspendidas, cortadas o inactivas, con el abonado al que pertenecen.',
      graficoPastel: {
        campo: 'estado',
        estados: ESTADOS.conexion.filter((estado) => estado !== 'Activa'),
        titulo: 'Conexiones no activas por estado',
        totalEtiqueta: 'Conexiones',
        colores: {
          Suspendida: '#d97706',
          Cortada: '#b42318',
          Inactiva: '#64748b',
        },
      },
      filtros: [{ nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.conexion.filter((e) => e !== 'Activa') }],
      acciones: ACCIONES_CONEXION.slice(0, 1),
    },
    {
      titulo: 'Medidores',
      permisos: VER_MEDIDORES,
      ruta: '/medidores',
      descripcion: 'Medidores instalados y su última lectura.',
      filtros: [
        { nombre: 'numero_serie', etiqueta: 'Número de serie' },
        { nombre: 'id_conexion', etiqueta: 'Conexión', tipo: 'number', min: 1 },
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.medidor },
      ],
      acciones: [{
        texto: 'Dar de baja', permisos: GESTIONAR, metodo: 'PATCH', peligro: true,
        visible: (f) => f.estado === 'Activo',
        titulo: (f) => `Dar de baja el medidor ${f.numero_serie}`,
        ruta: (f) => `/medidores/${f.id_medidor}/desactivar`,
        campos: [
          { nombre: 'nuevo_estado', etiqueta: 'Nuevo estado', requerido: true, opciones: ESTADOS.medidor.filter((e) => e !== 'Activo') },
          { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'textarea', max: 250 },
        ],
        exito: () => 'Medidor dado de baja.',
      }],
    },
  ],
};
