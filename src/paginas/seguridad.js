// R6 · Seguridad: empleados, usuarios, roles, permisos y bitácora (CU-6.x).
import { sesion } from '../api.js';
import { P } from '../permisos.js';
import { C, fechas } from './comunes.js';

const GESTIONAR = [P.GESTIONAR_SEGURIDAD];
const BITACORA = [P.CONSULTAR_BITACORA];
// Acciones que escriben los triggers y sp_RegistrarEventoBitacora.
const ACCIONES_BITACORA = ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FALLIDO', 'LOGOUT', 'CONSULTA', 'ALERTA', 'RESTORE', 'ETL', 'MANTENIMIENTO', 'PRUEBAS']
  .map((a) => ({ valor: a, texto: a }));

const CAMPOS_EMPLEADO = [
  { nombre: 'cedula', etiqueta: 'Cédula', max: 20 },
  { nombre: 'nombre_empleado', etiqueta: 'Nombre', max: 50 },
  { nombre: 'apellido1_empleado', etiqueta: 'Primer apellido', max: 50 },
  { nombre: 'apellido2_empleado', etiqueta: 'Segundo apellido', max: 50 },
  { nombre: 'puesto', etiqueta: 'Puesto', max: 50 },
  { nombre: 'telefono', etiqueta: 'Teléfono', max: 20 },
];

const requerir = (campos, nombres) => campos.map((c) => (nombres.includes(c.nombre) ? { ...c, requerido: true } : c));

// Mismas reglas que dbo.fn_ValidarComplejidadContrasena; la base las vuelve a validar.
function validarContrasena(valor = '') {
  if (valor.length < 8 || !/[A-Z]/.test(valor) || !/[a-z]/.test(valor) || !/[0-9]/.test(valor) || !/[^A-Za-z0-9]/.test(valor)) {
    return 'Debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo.';
  }
  return null;
}

const CONTRASENA = {
  nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, max: 128,
  ayuda: 'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.',
  validar: validarContrasena,
};

// La API no deja desactivar ni cambiar el rol de la cuenta propia; aquí se ocultan esos botones.
// El driver puede devolver los id como texto, por eso se comparan como número.
const usuarioActual = () => sesion.actual?.usuario || {};
const esCuentaPropia = (f) => Number(f.id_usuario_sistema) === Number(usuarioActual().id_usuario_sistema);
const esEmpleadoPropio = (f) => Number(f.id_empleado) === Number(usuarioActual().id_empleado);

export default {
  id: 'seguridad',
  titulo: 'Seguridad',
  icono: 'escudo',
  permisos: [...GESTIONAR, ...BITACORA],
  secciones: [
    {
      titulo: 'Usuarios del sistema',
      pestana: 'Usuarios',
      permisos: GESTIONAR,
      ruta: '/seguridad/usuarios',
      descripcion: 'Cuentas de acceso. Tras 3 intentos fallidos la cuenta se bloquea; "Reactivar" también la desbloquea. Su propia cuenta solo la puede desactivar o cambiar de rol otro administrador.',
      botones: [{
        texto: 'Nuevo usuario', primario: true, ruta: '/seguridad/usuarios',
        campos: [
          C.empleado({ requerido: true, ancho: true }),
          C.rol({ requerido: true }),
          { nombre: 'nombre_usuario', etiqueta: 'Nombre de usuario', requerido: true, max: 50 },
          CONTRASENA,
        ],
        textoEnviar: 'Crear usuario',
        exito: (r) => `Usuario creado (ID ${r.salida?.id_usuario_sistema}).`,
      }],
      acciones: [
        {
          texto: 'Permisos', metodo: 'GET',
          titulo: (f) => `Permisos de ${f.nombre_usuario}`,
          ruta: (f) => `/seguridad/usuarios/${f.id_usuario_sistema}/permisos`,
        },
        {
          texto: 'Cambiar rol', metodo: 'PUT', visible: (f) => !esCuentaPropia(f),
          titulo: (f) => `Rol de ${f.nombre_usuario}`,
          ruta: (f) => `/seguridad/usuarios/${f.id_usuario_sistema}`,
          campos: [C.rol({ requerido: true, ancho: true })],
          inicial: (f) => ({ id_rol: f.id_rol }),
          exito: () => 'Rol actualizado. Aplica desde la próxima acción del usuario.',
        },
        {
          texto: 'Contraseña', metodo: 'PUT',
          titulo: (f) => `Restablecer la contraseña de ${f.nombre_usuario}`,
          ruta: (f) => `/seguridad/usuarios/${f.id_usuario_sistema}/contrasena`,
          campos: [{ ...CONTRASENA, nombre: 'nueva', etiqueta: 'Contraseña nueva' }],
          exito: () => 'Contraseña restablecida.',
        },
        {
          texto: 'Reactivar', visible: (f) => !f.activo || f.intentos_fallidos > 0,
          ruta: (f) => `/seguridad/usuarios/${f.id_usuario_sistema}/reactivar`,
          confirmar: (f) => `¿Reactivar y desbloquear la cuenta ${f.nombre_usuario}?`,
          exito: () => 'Usuario reactivado.',
        },
        {
          texto: 'Desactivar', peligro: true, visible: (f) => f.activo && !esCuentaPropia(f),
          ruta: (f) => `/seguridad/usuarios/${f.id_usuario_sistema}/desactivar`,
          confirmar: (f) => `¿Desactivar la cuenta ${f.nombre_usuario}? Perderá el acceso de inmediato.`,
          exito: () => 'Usuario desactivado.',
        },
      ],
    },
    {
      titulo: 'Empleados',
      permisos: GESTIONAR,
      ruta: '/seguridad/empleados',
      filtros: [
        { nombre: 'cedula', etiqueta: 'Cédula' },
        { nombre: 'nombre', etiqueta: 'Nombre' },
        { nombre: 'puesto', etiqueta: 'Puesto' },
        { nombre: 'activo', etiqueta: 'Estado', opciones: [{ valor: 'true', texto: 'Activos' }, { valor: 'false', texto: 'Inactivos' }] },
      ],
      botones: [{
        texto: 'Nuevo empleado', primario: true, ruta: '/seguridad/empleados',
        campos: [
          ...requerir(CAMPOS_EMPLEADO, ['cedula', 'nombre_empleado', 'apellido1_empleado', 'puesto']),
          { nombre: 'fecha_contratacion', etiqueta: 'Fecha de contratación', tipo: 'date', valor: fechas.hoy },
        ],
        textoEnviar: 'Registrar',
        exito: (r) => `Empleado registrado (ID ${r.salida?.id_empleado}).`,
      }],
      acciones: [
        {
          texto: 'Editar', metodo: 'PUT',
          titulo: (f) => `Editar a ${f.nombre_completo}`,
          ruta: (f) => `/seguridad/empleados/${f.id_empleado}`,
          campos: CAMPOS_EMPLEADO.map((c) => (c.nombre.includes('empleado') ? { ...c, ayuda: 'Vacío = sin cambios.' } : c)),
          inicial: (f) => ({ cedula: f.cedula, puesto: f.puesto, telefono: f.telefono }),
          exito: () => 'Empleado actualizado.',
        },
        {
          texto: 'Desactivar', metodo: 'PATCH', peligro: true, visible: (f) => f.activo && !esEmpleadoPropio(f),
          ruta: (f) => `/seguridad/empleados/${f.id_empleado}/estado`,
          cuerpo: () => ({ activo: false }),
          confirmar: (f) => `¿Desactivar a ${f.nombre_completo}? Su usuario dejará de tener acceso.`,
          exito: () => 'Empleado desactivado.',
        },
        {
          texto: 'Activar', metodo: 'PATCH', visible: (f) => !f.activo,
          ruta: (f) => `/seguridad/empleados/${f.id_empleado}/estado`,
          cuerpo: () => ({ activo: true }),
          confirmar: (f) => `¿Activar a ${f.nombre_completo}?`,
          exito: () => 'Empleado activado.',
        },
      ],
    },
    {
      titulo: 'Roles',
      permisos: GESTIONAR,
      ruta: '/seguridad/roles',
      descripcion: 'Los permisos se asignan al rol. Un cambio aplica de inmediato a todos los usuarios del rol.',
      botones: [{
        texto: 'Nuevo rol', primario: true, ruta: '/seguridad/roles',
        campos: [{ nombre: 'nombre_rol', etiqueta: 'Nombre del rol', requerido: true, max: 50, ancho: true }],
        exito: () => 'Rol creado.',
      }],
      acciones: [
        {
          texto: 'Permisos', metodo: 'GET',
          titulo: (f) => `Permisos del rol ${f.nombre_rol}`,
          ruta: (f) => `/seguridad/roles/${f.id_rol}/permisos`,
          ocultar: ['id_rol_permiso'],
          botones: (rol) => [{
            texto: 'Asignar permiso', primario: true, ruta: `/seguridad/roles/${rol.id_rol}/permisos`,
            campos: [C.permiso({ requerido: true, ancho: true })],
            textoEnviar: 'Asignar',
            exito: () => 'Permiso asignado.',
          }],
          acciones: (rol) => [{
            texto: 'Quitar', metodo: 'DELETE', peligro: true,
            ruta: (f) => `/seguridad/roles/${rol.id_rol}/permisos/${f.id_permiso}`,
            confirmar: (f) => `¿Quitar "${f.nombre_permiso}" al rol ${rol.nombre_rol}?`,
            exito: () => 'Permiso retirado.',
          }],
        },
        {
          texto: 'Renombrar', metodo: 'PUT',
          titulo: (f) => `Renombrar el rol ${f.nombre_rol}`,
          ruta: (f) => `/seguridad/roles/${f.id_rol}`,
          campos: [{ nombre: 'nombre_rol', etiqueta: 'Nombre del rol', requerido: true, max: 50, ancho: true }],
          inicial: (f) => ({ nombre_rol: f.nombre_rol }),
          exito: () => 'Rol actualizado.',
        },
        {
          texto: 'Eliminar', metodo: 'DELETE', peligro: true, visible: (f) => !f.usuarios_activos,
          ruta: (f) => `/seguridad/roles/${f.id_rol}`,
          confirmar: (f) => `¿Eliminar el rol ${f.nombre_rol}?`,
          exito: () => 'Rol eliminado.',
        },
      ],
    },
    {
      titulo: 'Módulos y permisos',
      pestana: 'Permisos',
      permisos: GESTIONAR,
      ruta: '/seguridad/permisos',
      descripcion: 'Catálogo de permisos agrupados por módulo. La API reconoce los permisos por su nombre: renombrar uno existente le quita el acceso a quienes lo usan.',
      ocultar: ['id_modulo'],
      botones: [
        {
          texto: 'Nuevo permiso', primario: true, ruta: '/seguridad/permisos',
          campos: [C.modulo({ requerido: true }), { nombre: 'nombre_permiso', etiqueta: 'Nombre del permiso', requerido: true, max: 50 }],
          exito: () => 'Permiso creado.',
        },
        {
          texto: 'Nuevo módulo', ruta: '/seguridad/modulos',
          campos: [{ nombre: 'nombre_modulo', etiqueta: 'Nombre del módulo', requerido: true, max: 50, ancho: true }],
          exito: () => 'Módulo creado.',
        },
      ],
      acciones: [{
        texto: 'Editar', metodo: 'PUT',
        titulo: (f) => `Editar el permiso ${f.nombre_permiso}`,
        ruta: (f) => `/seguridad/permisos/${f.id_permiso}`,
        campos: [C.modulo({ requerido: true }), { nombre: 'nombre_permiso', etiqueta: 'Nombre del permiso', requerido: true, max: 50 }],
        inicial: (f) => ({ id_modulo: f.id_modulo, nombre_permiso: f.nombre_permiso }),
        exito: () => 'Permiso actualizado.',
      }],
    },
    {
      titulo: 'Bitácora',
      permisos: BITACORA,
      ruta: '/seguridad/bitacora',
      descripcion: 'Registro de inicios de sesión y de cada cambio hecho en la base, a nombre del usuario que lo hizo. Es de solo lectura.',
      mensajeVacio: 'No hay registros que cumplan los filtros.',
      filtros: [
        // CU-6.7: filtro por usuario. La lista de usuarios solo la ve quien gestiona la seguridad.
        {
          nombre: 'id_usuario_sistema', etiqueta: 'Usuario', permisos: GESTIONAR,
          catalogo: { ruta: '/seguridad/usuarios', valor: 'id_usuario_sistema', texto: 'nombre_usuario' },
        },
        { nombre: 'accion', etiqueta: 'Acción', opciones: ACCIONES_BITACORA },
        { nombre: 'tabla_afectada', etiqueta: 'Tabla' },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date', valor: () => fechas.haceDias(7) },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
    },
    {
      titulo: 'Actividad por usuario',
      permisos: BITACORA,
      ruta: '/seguridad/bitacora/resumen',
      filtros: [
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date', requerido: true, valor: fechas.inicioMes },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date', requerido: true, valor: fechas.hoy },
      ],
    },
  ],
};
