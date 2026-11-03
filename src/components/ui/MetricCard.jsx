import { Icono } from '../../ui/Icono.jsx';

const TONOS = new Set(['marino', 'verde', 'ambar', 'rojo', 'cielo', 'neutral', 'oceano']);

export function MetricCard({
  titulo,
  valor,
  detalle,
  icono = 'estadistica',
  tono = 'marino',
  className = '',
}) {
  const tonoSeguro = TONOS.has(tono) ? tono : 'marino';

  return (
    <div className={`metric-card tono-${tonoSeguro} ${className}`.trim()}>
      <div className="metric-card-icono" aria-hidden="true">
        <Icono nombre={icono} tamano={20} />
      </div>
      <div className="metric-card-cuerpo">
        <span className="metric-card-titulo">{titulo}</span>
        <strong className="metric-card-valor">{valor ?? '—'}</strong>
        {detalle ? <span className="metric-card-detalle">{detalle}</span> : null}
      </div>
    </div>
  );
}

export default MetricCard;
