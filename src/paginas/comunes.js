// Campos y listas que usan varios módulos.
import { moneda } from '../ui/formato.js';

// Fecha local AAAA-MM-DD (toISOString usaría UTC y en la noche daría el día siguiente).
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fechas = {
  hoy: () => iso(new Date()),
  haceDias(dias) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return iso(d);
  },
  inicioMes() {
    const d = new Date();
    return iso(new Date(d.getFullYear(), d.getMonth(), 1));
  },
};

export const ESTADOS = {
  conexion: ['Activa', 'Suspendida', 'Cortada', 'Inactiva'],
  medidor: ['Activo', 'Dañado', 'Sustituido', 'Retirado'],
  factura: ['Pendiente', 'Pagada', 'Vencida'],
  incidencia: ['Abierta', 'En proceso', 'Resuelta'],
  mantenimiento: ['Programado', 'En proceso', 'Finalizado', 'Cancelado'],
  alerta: ['Abierta', 'Resuelta'],
  respaldo: ['Exitoso', 'Fallido'],
  restauracion: ['Solicitada', 'En proceso', 'Exitosa', 'Fallida'],
  etl: ['En proceso', 'Exitoso', 'Fallido'],
};

export const TIPO_ABONADO = [
  { valor: 'FISICO', texto: 'Físico' },
  { valor: 'JURIDICO', texto: 'Jurídico' },
];

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((texto, i) => ({ valor: i + 1, texto }));

/** Campo de selección cargado desde la API. */
const catalogo = (nombre, etiqueta, ruta, valor, texto, filtro) =>
  (extra = {}) => ({ nombre, etiqueta, catalogo: { ruta, valor, texto, filtro }, ...extra });

export const C = {
  tarifa: catalogo('id_tarifa', 'Tarifa', '/catalogos/tarifas/activas', 'id_tarifa',
    (f) => `${f.tipo_tarifa} · ${moneda(f.monto_fijo)} + ${moneda(f.monto_por_m3)}/m³`),
  tipoTarifa: catalogo('id_tipo_tarifa', 'Tipo de tarifa', '/catalogos/tipos-tarifa', 'id_tipo_tarifa', 'nombre_tarifa'),
  metodoPago: catalogo('id_metodo_pago', 'Método de pago', '/catalogos/metodos-pago/activos', 'id_metodo_pago', 'nombre_metodo'),
  tipoTrabajo: catalogo('id_tipo_trabajo', 'Tipo de trabajo', '/catalogos/tipos-trabajo', 'id_tipo_trabajo', 'nombre_trabajo'),
  tipoIncidencia: catalogo('id_tipo_incidencia', 'Tipo de incidencia', '/catalogos/tipos-incidencia', 'id_tipo_incidencia', 'nombre_incidencia'),
  nivelAlerta: catalogo('id_nivel_alerta', 'Nivel de alerta', '/catalogos/niveles-alerta', 'id_nivel_alerta', 'nombre_nivel'),
  tipoRespaldo: catalogo('id_tipo_respaldo', 'Tipo de respaldo', '/catalogos/tipos-respaldo', 'id_tipo_respaldo', 'nombre_respaldo'),
  medidor: catalogo('id_medidor', 'Medidor', '/medidores?estado=Activo', 'id_medidor',
    (f) => `${f.numero_serie} · conexión ${f.id_conexion} · ${f.abonado ?? f.ubicacion ?? ''}`),
  // Conexiones que tienen medidor activo (la API no expone un listado general de conexiones).
  conexion: catalogo('id_conexion', 'Conexión', '/medidores?estado=Activo', 'id_conexion',
    (f) => `${f.id_conexion} · ${f.ubicacion ?? ''} · ${f.abonado ?? ''}`),
  empleado: catalogo('id_empleado', 'Empleado', '/seguridad/empleados', 'id_empleado',
    (f) => `${f.nombre_completo} (${f.puesto})`, (f) => f.activo),
  rol: catalogo('id_rol', 'Rol', '/seguridad/roles', 'id_rol', 'nombre_rol'),
  modulo: catalogo('id_modulo', 'Módulo', '/seguridad/modulos', 'id_modulo', 'nombre_modulo'),
  permiso: catalogo('id_permiso', 'Permiso', '/seguridad/permisos', 'id_permiso',
    (f) => `${f.nombre_modulo} · ${f.nombre_permiso}`),
};

/** Campo "activo" solo si la fila lo trae; evita desactivar por omisión al editar. */
export const campoActivo = (fila) => ('activo' in (fila || {}) ? [{ nombre: 'activo', etiqueta: 'Activo', tipo: 'checkbox' }] : []);
