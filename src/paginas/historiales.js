import React from 'react';
import { P } from '../permisos.js';
import { C, ESTADOS, fechas } from './comunes.js';
import {
  COLUMNAS_HISTORIAL_LECTURAS,
  FILTROS_HISTORIAL_LECTURAS,
  enriquecerHistorialLecturas,
  prepararFiltrosHistorial,
} from './lecturas.js';

const CONSULTAR_TODO = [
  P.CONSULTAR_FACTURAS,
  P.CONSULTAR_PAGOS,
  P.CONSULTAR_MANTENIMIENTO,
  P.CONSULTAR_BITACORA,
  P.RESPALDOS,
  P.GESTIONAR_FACTURACION,
  P.GESTIONAR_PAGOS,
  P.GESTIONAR_MANTENIMIENTO,
];

const COLUMNAS_HISTORIAL_PAGOS = [
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'id_pago', etiqueta: 'Nº Pago', clase: 'num' },
  { campo: 'fecha_pago', etiqueta: 'Fecha' },
  { campo: 'abonado', etiqueta: 'Abonado' },
  { campo: 'id_factura', etiqueta: 'Nº Factura', clase: 'num' },
  { campo: 'monto', etiqueta: 'Monto', clase: 'num' },
  { campo: 'metodo', etiqueta: 'Método' },
  { campo: 'motivo_anulacion', etiqueta: 'Motivo anulación' },
];

const COLUMNAS_BITACORA = [
  { campo: 'fecha_registro', etiqueta: 'Fecha' },
  { campo: 'usuario', etiqueta: 'Usuario' },
  { campo: 'accion', etiqueta: 'Acción' },
  { campo: 'tabla_afectada', etiqueta: 'Tabla' },
  { campo: 'descripcion', etiqueta: 'Descripción', clase: 'texto-largo' },
];

const historiales = {
  id: 'historiales',
  titulo: 'Historiales',
  icono: 'historial',
  permisos: CONSULTAR_TODO,
  descripcion: 'Centro unificado de consulta histórica y auditoría de la ASADA.',
  subsecciones: [
    {
      titulo: 'Historial de consumo y lecturas',
      pestana: 'Lecturas y consumo',
      permisos: [P.CONSULTAR_FACTURAS, P.REGISTRAR_LECTURA, P.GESTIONAR_FACTURACION],
      ruta: '/lecturas/historial',
      descripcion: 'Registro histórico de lecturas de medidores, consumos en m³ y facturación asociada.',
      filtros: FILTROS_HISTORIAL_LECTURAS,
      prepararFiltros: prepararFiltrosHistorial,
      transformar: enriquecerHistorialLecturas,
      columnas: COLUMNAS_HISTORIAL_LECTURAS,
    },
    {
      titulo: 'Historial de pagos y recaudación',
      pestana: 'Pagos y recaudación',
      permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
      ruta: '/pagos',
      descripcion: 'Histórico de pagos procesados, métodos de recaudación y anulaciones con motivo.',
      columnas: COLUMNAS_HISTORIAL_PAGOS,
      filtros: [
        { nombre: 'id_factura', etiqueta: 'Nº Factura', tipo: 'number', min: 1 },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date' },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
        { nombre: 'incluir_anulados', etiqueta: 'Incluir anulados', tipo: 'checkbox' },
      ],
    },
    {
      titulo: 'Historial de mantenimientos ejecutados',
      pestana: 'Mantenimientos cerrados',
      permisos: [P.CONSULTAR_MANTENIMIENTO, P.EJECUTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
      ruta: '/mantenimientos/realizados',
      descripcion: 'Histórico de trabajos de fontanería, reparaciones y órdenes completadas en campo.',
    },
    {
      titulo: 'Historial de respaldos de BD',
      pestana: 'Respaldos y restauración',
      permisos: [P.RESPALDOS, P.MANTENIMIENTO_BD],
      ruta: '/respaldos/historial',
      descripcion: 'Registro histórico de respaldos ejecutados, verificaciones de integridad y restauraciones.',
      filtros: [
        { nombre: 'estado', etiqueta: 'Estado', opciones: ESTADOS.respaldo },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date', valor: () => fechas.haceDias(30) },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
    },
    {
      titulo: 'Bitácora de seguridad y auditoría',
      pestana: 'Bitácora de auditoría',
      permisos: [P.CONSULTAR_BITACORA, P.GESTIONAR_SEGURIDAD],
      ruta: '/seguridad/bitacora',
      descripcion: 'Auditoría cronológica de eventos, accesos y operaciones realizadas por cada usuario en el sistema.',
      columnas: COLUMNAS_BITACORA,
      filtros: [
        { nombre: 'accion', etiqueta: 'Acción' },
        { nombre: 'tabla_afectada', etiqueta: 'Tabla' },
        { nombre: 'desde', etiqueta: 'Desde', tipo: 'date', valor: () => fechas.haceDias(7) },
        { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'date' },
      ],
    },
  ],
};

export default historiales;

