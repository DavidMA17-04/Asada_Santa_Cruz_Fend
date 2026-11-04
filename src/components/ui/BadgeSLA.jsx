import { Icono } from '../../ui/Icono.jsx';

/**
 * Componente visual para mostrar el estado del SLA con semáforo dinámico y tiempo restante.
 * Adaptado para tema claro y tema oscuro sin perder contraste.
 */
export function BadgeSLA({
  estadoSla,
  horasResolucion,
  slaHoras,
  estadoIncidencia,
  className = '',
}) {
  const horas = Number(horasResolucion);
  const objetivo = Number(slaHoras);
  const tieneNumeros = !Number.isNaN(horas) && !Number.isNaN(objetivo) && objetivo > 0;
  const esResuelta = /resuelta/i.test(String(estadoIncidencia || ''));

  // Determinar estado, color y etiqueta
  let tono = 'verde';
  let texto = estadoSla || 'En tiempo';
  let subtexto = '';
  let icono = 'reloj';

  if (esResuelta) {
    if (tieneNumeros && horas > objetivo) {
      tono = 'neutral';
      texto = 'Cerrada fuera de SLA';
      subtexto = `${horas}h / obj. ${objetivo}h`;
      icono = 'info';
    } else {
      tono = 'verde';
      texto = 'Cumplido';
      subtexto = tieneNumeros ? `${horas}h / ${objetivo}h` : '';
      icono = 'check';
    }
  } else {
    // Caso en curso / abierta
    if (tieneNumeros) {
      const diferencia = objetivo - horas;
      if (diferencia < 0) {
        tono = 'rojo';
        const exceso = Math.abs(diferencia);
        texto = `Vencido (+${exceso}h)`;
        subtexto = `Límite: ${objetivo}h`;
        icono = 'alerta';
      } else if (diferencia <= 6) {
        tono = 'ambar';
        texto = `Por vencer (${diferencia}h)`;
        subtexto = `Límite: ${objetivo}h`;
        icono = 'reloj';
      } else {
        tono = 'verde';
        texto = `En tiempo (${diferencia}h restan)`;
        subtexto = `Límite: ${objetivo}h`;
        icono = 'check';
      }
    } else {
      // Si solo viene el texto estadoSla
      const s = String(estadoSla || '').toLowerCase();
      if (/vencid|fuera/i.test(s)) {
        tono = 'rojo';
        texto = 'Vencido';
        icono = 'alerta';
      } else if (/riesgo|por vencer/i.test(s)) {
        tono = 'ambar';
        texto = 'Por vencer';
        icono = 'reloj';
      } else {
        tono = 'verde';
        texto = 'En tiempo';
        icono = 'check';
      }
    }
  }

  const clasesTono = {
    verde: 'badge-sla verde bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    ambar: 'badge-sla ambar bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    rojo: 'badge-sla rojo bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 animate-pulse',
    neutral: 'badge-sla neutral bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-600/30',
  }[tono] || 'badge-sla verde bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30';

  const puntosTono = {
    verde: 'bg-emerald-500 dark:bg-emerald-400',
    ambar: 'bg-amber-500 dark:bg-amber-400',
    rojo: 'bg-rose-500 dark:bg-rose-400',
    neutral: 'bg-slate-500 dark:bg-slate-400',
  }[tono];

  const tituloTooltip = tieneNumeros
    ? `Tiempo transcurrido: ${horas} horas | Objetivo SLA: ${objetivo} horas`
    : `Estado SLA: ${texto}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${clasesTono} ${className}`.trim()}
      title={tituloTooltip}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${puntosTono}`} />
      <span className="whitespace-nowrap">{texto}</span>
      {subtexto ? (
        <span className="text-[10px] opacity-80 font-normal ml-0.5 whitespace-nowrap">
          ({subtexto})
        </span>
      ) : null}
    </span>
  );
}

export default BadgeSLA;
