// Catálogos: tarifas, métodos de pago, tipos de trabajo e incidencia, niveles y reglas de consumo.
// Cualquier usuario puede consultarlos; modificarlos exige el permiso de gestión del módulo dueño.
import { P } from '../permisos.js';
import { C, campoActivo } from './comunes.js';

/** Catálogo de un solo campo de texto: listar, crear y editar. */
function catalogoSimple({ titulo, ruta, id, campo, etiqueta, permisos, descripcion, extra = [] }) {
  const campos = (f) => [{ nombre: campo, etiqueta, requerido: true, max: 50, ancho: true }, ...campoActivo(f)];
  return {
    titulo,
    ruta,
    descripcion,
    permisos: [],
    botones: [{
      texto: 'Agregar', primario: true, permisos, ruta, titulo: `Agregar a ${titulo.toLowerCase()}`,
      campos: [{ nombre: campo, etiqueta, requerido: true, max: 50, ancho: true }],
      exito: () => 'Registro agregado.',
    }],
    acciones: [
      {
        texto: 'Editar', permisos, metodo: 'PUT',
        titulo: (f) => `Editar ${f[campo]}`,
        ruta: (f) => `${ruta}/${f[id]}`,
        campos,
        inicial: (f) => ({ [campo]: f[campo], activo: f.activo }),
        exito: () => 'Registro actualizado.',
      },
      ...extra,
    ],
  };
}

const TARIFAS = [P.GESTIONAR_ABONADOS];
const CONSUMO = [P.GESTIONAR_FACTURACION];

const camposRegla = (f) => [
  C.nivelAlerta({ requerido: true, textoInicial: f?.nombre_nivel }),
  { nombre: 'nombre_regla', etiqueta: 'Nombre de la regla', requerido: true, max: 50 },
  { nombre: 'porcentaje_variacion', etiqueta: 'Variación sobre el promedio (%)', tipo: 'number', requerido: true, min: 0.01 },
  { nombre: 'meses_promedio', etiqueta: 'Meses para el promedio', tipo: 'number', requerido: true, min: 1, max: 24, paso: 1 },
  { nombre: 'consumo_minimo', etiqueta: 'Consumo mínimo (m³)', tipo: 'number', min: 0, valor: 0 },
  ...campoActivo(f),
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', max: 250 },
];

export default {
  id: 'catalogos',
  titulo: 'Catálogos',
  icono: 'lista',
  permisos: [],
  secciones: [
    {
      titulo: 'Tarifas',
      ruta: '/catalogos/tarifas',
      permisos: [],
      descripcion: 'Monto fijo mensual más un monto por metro cúbico. Cada cambio queda en el historial de la tarifa.',
      botones: [{
        texto: 'Nueva tarifa', primario: true, permisos: TARIFAS, ruta: '/catalogos/tarifas',
        campos: [
          C.tipoTarifa({ requerido: true, ancho: true }),
          { nombre: 'monto_fijo', etiqueta: 'Monto fijo (₡)', tipo: 'number', requerido: true, min: 0.01 },
          { nombre: 'monto_por_m3', etiqueta: 'Monto por m³ (₡)', tipo: 'number', requerido: true, min: 0.01 },
        ],
        exito: (r) => `Tarifa ${r.salida?.id_tarifa} registrada.`,
      }],
      acciones: [
        {
          texto: 'Historial', metodo: 'GET',
          titulo: (f) => `Historial de la tarifa ${f.tipo_tarifa}`,
          ruta: (f) => `/catalogos/tarifas/${f.id_tarifa}/historial`,
        },
        {
          texto: 'Modificar', permisos: TARIFAS, metodo: 'PUT', visible: (f) => f.activo,
          titulo: (f) => `Modificar la tarifa ${f.tipo_tarifa}`,
          ruta: (f) => `/catalogos/tarifas/${f.id_tarifa}`,
          campos: [
            { nombre: 'monto_fijo', etiqueta: 'Monto fijo (₡)', tipo: 'number', min: 0.01 },
            { nombre: 'monto_por_m3', etiqueta: 'Monto por m³ (₡)', tipo: 'number', min: 0.01 },
          ],
          inicial: (f) => ({ monto_fijo: f.monto_fijo, monto_por_m3: f.monto_por_m3 }),
          exito: () => 'Tarifa modificada.',
        },
        {
          texto: 'Desactivar', permisos: TARIFAS, metodo: 'DELETE', peligro: true, visible: (f) => f.activo,
          ruta: (f) => `/catalogos/tarifas/${f.id_tarifa}`,
          confirmar: (f) => `¿Desactivar la tarifa ${f.tipo_tarifa}? No se permite si hay conexiones activas que la usan.`,
          exito: () => 'Tarifa desactivada.',
        },
      ],
    },
    {
      titulo: 'Simulador de tarifa',
      pestana: 'Simulador',
      tipo: 'formulario',
      permisos: [],
      ruta: '/catalogos/tarifas/simular',
      descripcion: 'Calcula cuánto pagaría un consumo con montos propuestos y lo compara con una tarifa actual. No guarda nada.',
      campos: [
        { nombre: 'consumo_m3', etiqueta: 'Consumo (m³)', tipo: 'number', requerido: true, min: 0 },
        { nombre: 'monto_fijo_propuesto', etiqueta: 'Monto fijo propuesto (₡)', tipo: 'number', requerido: true, min: 0 },
        { nombre: 'monto_por_m3_propuesto', etiqueta: 'Monto por m³ propuesto (₡)', tipo: 'number', requerido: true, min: 0 },
        C.tarifa({ nombre: 'id_tarifa_actual', etiqueta: 'Comparar con' }),
      ],
      textoEnviar: 'Simular',
      limpiar: false,
      mostrarResultado: true,
      exito: () => 'Simulación calculada.',
    },
    catalogoSimple({
      titulo: 'Tipos de tarifa', ruta: '/catalogos/tipos-tarifa', id: 'id_tipo_tarifa',
      campo: 'nombre_tarifa', etiqueta: 'Nombre', permisos: TARIFAS,
    }),
    catalogoSimple({
      titulo: 'Métodos de pago', ruta: '/catalogos/metodos-pago', id: 'id_metodo_pago',
      campo: 'nombre_metodo', etiqueta: 'Nombre del método', permisos: [P.GESTIONAR_PAGOS],
      extra: [{
        texto: 'Desactivar', permisos: [P.GESTIONAR_PAGOS], metodo: 'DELETE', peligro: true, visible: (f) => f.activo !== false,
        ruta: (f) => `/catalogos/metodos-pago/${f.id_metodo_pago}`,
        confirmar: (f) => `¿Desactivar el método de pago ${f.nombre_metodo}?`,
        exito: () => 'Método de pago desactivado.',
      }],
    }),
    catalogoSimple({
      titulo: 'Tipos de trabajo', ruta: '/catalogos/tipos-trabajo', id: 'id_tipo_trabajo',
      campo: 'nombre_trabajo', etiqueta: 'Nombre', permisos: [P.GESTIONAR_MANTENIMIENTO],
    }),
    catalogoSimple({
      titulo: 'Tipos de incidencia', ruta: '/catalogos/tipos-incidencia', id: 'id_tipo_incidencia',
      campo: 'nombre_incidencia', etiqueta: 'Nombre', permisos: [P.GESTIONAR_MANTENIMIENTO],
    }),
    catalogoSimple({
      titulo: 'Niveles de alerta', ruta: '/catalogos/niveles-alerta', id: 'id_nivel_alerta',
      campo: 'nombre_nivel', etiqueta: 'Nombre', permisos: CONSUMO,
    }),
    {
      titulo: 'Reglas de consumo anómalo',
      pestana: 'Reglas de consumo',
      permisos: [],
      ruta: '/catalogos/reglas-consumo?solo_activas=false',
      descripcion: 'Una lectura genera alerta cuando supera el promedio de los últimos meses en el porcentaje indicado y el consumo mínimo.',
      botones: [{
        texto: 'Nueva regla', primario: true, permisos: CONSUMO, ruta: '/catalogos/reglas-consumo',
        campos: camposRegla(null),
        exito: () => 'Regla creada.',
      }],
      acciones: [{
        texto: 'Editar', permisos: CONSUMO, metodo: 'PUT',
        titulo: (f) => `Editar la regla ${f.nombre_regla}`,
        ruta: (f) => `/catalogos/reglas-consumo/${f.id_regla_consumo}`,
        campos: camposRegla,
        inicial: (f) => ({ ...f }),
        exito: () => 'Regla actualizada.',
      }],
    },
  ],
};
