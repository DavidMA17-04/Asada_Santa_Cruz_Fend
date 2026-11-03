import { Icono } from '../../ui/Icono.jsx';

export function MetricCard({
  titulo,
  valor,
  detalle,
  icono = 'estadistica',
  tono = 'marino', // 'marino' | 'verde' | 'ambar' | 'rojo' | 'cielo' | 'neutral'
  className = '',
}) {
  const estilosTono = {
    marino: {
      iconoBg: 'bg-[#0C3B5E]/10 text-[#1A5B8C] dark:text-sky-400',
      borde: 'border-slate-200 dark:border-slate-800',
      num: 'text-[#0C3B5E] dark:text-white',
    },
    verde: {
      iconoBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      borde: 'border-emerald-500/20',
      num: 'text-emerald-600 dark:text-emerald-400',
    },
    ambar: {
      iconoBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      borde: 'border-amber-500/20',
      num: 'text-amber-600 dark:text-amber-400',
    },
    rojo: {
      iconoBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      borde: 'border-rose-500/20',
      num: 'text-rose-600 dark:text-rose-400',
    },
    cielo: {
      iconoBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      borde: 'border-sky-500/20',
      num: 'text-sky-600 dark:text-sky-400',
    },
    neutral: {
      iconoBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      borde: 'border-slate-200 dark:border-slate-800',
      num: 'text-slate-700 dark:text-slate-200',
    },
  }[tono] || {
    iconoBg: 'bg-sky-500/10 text-sky-400',
    borde: 'border-slate-200 dark:border-slate-800',
    num: 'text-slate-900 dark:text-white',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[var(--superficie)] border ${estilosTono.borde} p-4 shadow-xs transition-all hover:shadow-md flex items-center gap-3.5 ${className}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${estilosTono.iconoBg}`}>
        <Icono nombre={icono} tamano={20} />
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-[var(--texto-suave)] truncate block">
          {titulo}
        </span>
        <div className={`text-2xl font-bold tracking-tight ${estilosTono.num}`}>
          {valor}
        </div>
        {detalle ? (
          <span className="text-[11px] text-[var(--texto-suave)] opacity-80 truncate block">
            {detalle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default MetricCard;

