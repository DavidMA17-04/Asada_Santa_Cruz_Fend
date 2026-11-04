import { createElement } from 'react';

const SIGLAS = { id: 'ID', m3: 'm³', mb: 'MB', dw: 'DW', etl: 'ETL', bd: 'BD', sla: 'SLA' };
const NOMBRES_ASADA = {
  id_historial_mantenimiento: 'Nº Evento en bitácora',
  id_historial_incidencia: 'Nº Evento de avería',
  id_mantenimiento: 'Nº Orden de trabajo',
  id_incidencia: 'Nº Reporte de avería',
  id_conexion: 'Nº Conexión / Servicio',
  id_abonado_fisico: 'Abonado físico',
  id_abonado_juridico: 'Abonado jurídico',
  id_medidor: 'Medidor de agua',
  numero_serie: 'Nº Serie del medidor',
  fecha_evento: 'Fecha de registro',
  fecha_incidente: 'Fecha del reporte',
  fecha_inicio: 'Fecha de inicio programada',
  fecha_fin: 'Fecha de finalización',
  tipo_trabajo: 'Labor de fontanería',
  nombre_trabajo: 'Labor técnica',
  tipo_incidencia: 'Tipo de avería',
  estado_anterior: 'Estado inicial',
  estado_actual: 'Nuevo estado',
  empleado: 'Fontanero / Responsable',
  responsable: 'Fontanero a cargo',
  anotacion: 'Bitácora técnica de campo',
  observacion: 'Observación técnica',
  detalle: 'Detalle de la labor realizada',
  ubicacion: 'Dirección del abonado',
  horas_resolucion: 'Tiempo de atención (h)',
  sla_horas: 'Plazo SLA (h)',
  estado_sla: 'Semáforo SLA',
  horas_duracion: 'Duración en campo (h)',
  horas_promedio_resolucion: 'Promedio resolución (h)',
  monto_total: 'Total facturado',
  saldo: 'Saldo pendiente',
  saldo_actual_factura: 'Saldo de factura',
  lectura_anterior: 'Lectura anterior (m³)',
  lectura_actual: 'Lectura actual (m³)',
  consumo_m3: 'Consumo registrado (m³)',
};

const ACENTOS = {
  conexion: 'conexión', identificacion: 'identificación', direccion: 'dirección', telefono: 'teléfono',
  electronico: 'electrónico', emision: 'emisión', metodo: 'método', descripcion: 'descripción',
  ultima: 'última', ultimo: 'último', periodo: 'período', accion: 'acción', anio: 'año',
  dias: 'días', resolucion: 'resolución', politica: 'política', retencion: 'retención',
  ejecucion: 'ejecución', creacion: 'creación', contratacion: 'contratación', instalacion: 'instalación',
  deteccion: 'detección', variacion: 'variación', observacion: 'observación', modulo: 'módulo',
  calculo: 'cálculo', anulacion: 'anulación', duracion: 'duración', tamano: 'tamaño',
  restauracion: 'restauración', recuperacion: 'recuperación', proposito: 'propósito',
  incidencia: 'incidencia', bitacora: 'bitácora', maximo: 'máximo', minimo: 'mínimo',
  ubicacion: 'ubicación', numero: 'número', razon: 'razón', modificacion: 'modificación', solucion: 'solución',
  anotacion: 'anotación', reincidentes: 'reincidentes',
};

/** "fecha_ultima_lectura" -> "Fecha última lectura" */
export function etiquetaDe(campo) {
  if (NOMBRES_ASADA[campo]) return NOMBRES_ASADA[campo];
  const palabras = campo.split('_').filter(Boolean).map((p) => SIGLAS[p] || ACENTOS[p] || p);
  const texto = palabras.join(' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const MONEDA = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 2 });
const NUMERO = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 });
const FECHA = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'UTC' });
const FECHA_HORA = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const ES_FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// La API devuelve las fechas de SQL Server con "Z", pero son la hora local del servidor:
// por eso se formatean en UTC, para mostrar exactamente lo que guarda la base.
function formatearFecha(texto) {
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return texto;
  return /T00:00:00(\.000)?Z$/.test(texto) ? FECHA.format(fecha) : FECHA_HORA.format(fecha);
}

const ES_MONTO = /(^|_)(monto|saldo|pagado|recargos|recaudado|facturado|cobrados)(_|$)/;
const ES_MEDIDA = /(m3|consumo|lectura|porcentaje|_mb$|promedio|horas|dias|variacion)/;

function colorEstado(valor) {
  const v = String(valor).toLowerCase();
  if (/^(activ[oa]|pagada|aplicado|exitos[oa]|resuelta|finalizado|ok|baja|en tiempo|válido|valido)$/.test(v)) return 'verde';
  if (/^(pendiente|en proceso|programado|suspendida|media|medio|solicitada|abierta|por vencer)$/.test(v)) return 'ambar';
  if (/^(vencida|cortada|dañado|anulado|fallid[oa]|alta|alto|cancelado|crítico|critico|error|inválido|invalido)$/.test(v)) return 'rojo';
  if (/^(inactiva|sustituido|retirado)$/.test(v)) return '';
  return 'azul';
}

const CAMPOS_INSIGNIA = /^(estado|estado_factura|estado_final|estado_sla|estado_conexion|prioridad|nivel|resultado|tipo_abonado)$/;

/** Devuelve { contenido, clase } para mostrar un valor en una celda. */
export function formatearCelda(campo, valor) {
  if (campo === 'estado_anterior' && (valor === null || valor === undefined || valor === '' || valor === '—' || valor === '-')) {
    return { contenido: '(Creación inicial)', clase: 'texto-suave' };
  }
  if (valor === null || valor === undefined || valor === '') return { contenido: '—', clase: '' };
  if (typeof valor === 'boolean') {
    return { contenido: createElement('span', { className: `insignia ${valor ? 'verde' : ''}` }, valor ? 'Sí' : 'No'), clase: '' };
  }
  if (CAMPOS_INSIGNIA.test(campo)) {
    return { contenido: createElement('span', { className: `insignia ${colorEstado(valor)}` }, valor), clase: '' };
  }
  if (typeof valor === 'string' && ES_FECHA_ISO.test(valor)) {
    return { contenido: formatearFecha(valor), clase: 'fecha' };
  }
  if (typeof valor === 'number') {
    if (campo.startsWith('id_') || campo === 'anio' || campo === 'mes') return { contenido: String(valor), clase: 'num' };
    if (campo.startsWith('monto') || (ES_MONTO.test(campo) && !ES_MEDIDA.test(campo))) {
      return { contenido: MONEDA.format(valor), clase: 'num' };
    }
    const sufijo = campo.includes('porcentaje') ? ' %' : campo.endsWith('_mb') ? ' MB' : '';
    return { contenido: NUMERO.format(valor) + sufijo, clase: 'num' };
  }
  if (typeof valor === 'object') return { contenido: JSON.stringify(valor), clase: '' };
  const texto = String(valor);
  return { contenido: texto, clase: texto.length > 60 ? 'texto-largo' : '' };
}

export const moneda = (n) => MONEDA.format(Number(n) || 0);
export const numero = (n) => NUMERO.format(Number(n) || 0);
