import { useMemo } from 'react';
import { MetricCard } from './MetricCard.jsx';
import { numero } from '../../ui/formato.js';

const CAMPOS_ESTADO = [
  'estado', 'activo', 'estado_factura', 'estado_conexion', 'estado_sla', 'prioridad',
  'tipo_abonado', 'tipo', 'tipo_trabajo',
];

function resolverTono(etiqueta = '') {
  const e = etiqueta.toLowerCase();
  if (/^(activ[oa]|vigente|aprobado?|finalizado?|pagada?|exitos[oa]|resuelta?|en tiempo)$/.test(e)) return 'verde';
  if (/^(pendiente|en revisi[oó]n|en proceso|programad[oa]|suspendid[oa]|medi[oa]|abierta)$/.test(e)) return 'ambar';
  if (/^(rechazad[oa]|cancelad[oa]|vencida?|cortada?|dañado?|anulado?|fallid[oa]|alta|cr[ií]tico?)$/.test(e)) return 'rojo';
  if (/^(inactiv[oa]|sustituido|retirado)$/.test(e)) return 'neutral';
  return 'cielo';
}

function resolverIcono(etiqueta = '') {
  const e = etiqueta.toLowerCase();
  if (/total/.test(e)) return 'usuarios';
  if (/activ[oa]|aprobado|finalizado|pagad/.test(e)) return 'exito';
  if (/pendiente|revisi[oó]n|proceso/.test(e)) return 'reloj';
  if (/alerta|cancelad|vencid|cortad|dañad/.test(e)) return 'alerta';
  if (/porcentaje|[ií]ndice/.test(e)) return 'estadistica';
  return 'lista';
}

export function MetricsSummary({ filas = [], metricas, tituloModulo = 'Registros', className = '' }) {
  const tarjetas = useMemo(() => {
    if (metricas?.length) return metricas;
    if (!filas?.length) return [];

    const muestra = filas[0] || {};
    const campo = CAMPOS_ESTADO.find((c) => c in muestra);

    const total = filas.length;
    const lista = [];

    // Tarjeta 1: Total general
    lista.push({
      titulo: `Total ${tituloModulo || 'Registros'}`,
      valor: numero(total),
      detalle: 'Registros consultados',
      tono: 'marino',
      icono: 'usuarios',
    });

    if (campo === 'activo') {
      const activos = filas.filter((f) => f.activo === true || f.activo === 1 || String(f.activo).toLowerCase() === 'true').length;
      const inactivos = total - activos;
      const pct = total > 0 ? Math.round((activos / total) * 100) : 0;

      lista.push({
        titulo: 'Activos / Vigentes',
        valor: numero(activos),
        detalle: 'Habilitados en el sistema',
        tono: 'verde',
        icono: 'exito',
      });

      if (inactivos > 0) {
        lista.push({
          titulo: 'Inactivos',
          valor: numero(inactivos),
          detalle: 'Deshabilitados o suspendidos',
          tono: 'neutral',
          icono: 'alerta',
        });
      }

      lista.push({
        titulo: 'Índice de Vigencia',
        valor: `${pct}%`,
        detalle: 'Proporción activa del total',
        tono: 'cielo',
        icono: 'estadistica',
      });
    } else if (campo) {
      // Contar por cada estado
      const conteos = new Map();
      filas.forEach((f) => {
        const val = f[campo];
        const k = val === null || val === undefined ? 'Sin definir' : String(val);
        conteos.set(k, (conteos.get(k) || 0) + 1);
      });

      const ordenados = [...conteos.entries()].sort((a, b) => b[1] - a[1]);

      // Tomar hasta 3 estados destacados
      ordenados.slice(0, 3).forEach(([estado, cuenta]) => {
        const pct = total > 0 ? Math.round((cuenta / total) * 100) : 0;
        lista.push({
          titulo: estado,
          valor: numero(cuenta),
          detalle: `${pct}% de la consulta`,
          tono: resolverTono(estado),
          icono: resolverIcono(estado),
        });
      });
    }

    return lista;
  }, [filas, metricas, tituloModulo]);

  if (!tarjetas.length) return null;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 ${className}`}>
      {tarjetas.map((t, idx) => (
        <MetricCard
          key={`${t.titulo}-${idx}`}
          titulo={t.titulo}
          valor={t.valor}
          detalle={t.detalle}
          tono={t.tono}
          icono={t.icono}
        />
      ))}
    </div>
  );
}

export default MetricsSummary;

