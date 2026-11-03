export function BadgeStatus({ valor, className = '' }) {
  if (valor === null || valor === undefined || valor === '') {
    return <span className="text-slate-400 font-mono">—</span>;
  }

  // Si es booleano
  let texto = valor;
  if (typeof valor === 'boolean') {
    texto = valor ? 'Activo' : 'Inactivo';
  } else {
    texto = String(valor).trim();
  }

  const v = texto.toLowerCase();

  let estilo = 'border-slate-500/25 bg-slate-500/10 text-slate-400';
  let dotColor = 'bg-slate-400';

  if (/^(activ[oa]|aprobado?|finalizado?|pagada?|exitos[oa]|resuelta?|en tiempo|v[aá]lido?|s[ií])$/.test(v)) {
    // Verde / Naturaleza
    estilo = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    dotColor = 'bg-emerald-500';
  } else if (/^(pendiente|en revisi[oó]n|en proceso|programad[oa]|suspendid[oa]|medi[oa]|abierta|por vencer)$/.test(v)) {
    // Ámbar / Aviso
    estilo = 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    dotColor = 'bg-amber-500';
  } else if (/^(rechazad[oa]|cancelad[oa]|vencida?|cortada?|dañado?|anulado?|fallid[oa]|alta|cr[ií]tico?|error|inv[aá]lido?)$/.test(v)) {
    // Rojo / Peligro
    estilo = 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';
    dotColor = 'bg-rose-500';
  } else if (/^(inactiv[oa]|sustituido|retirado|no)$/.test(v)) {
    // Neutro suave
    estilo = 'border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400';
    dotColor = 'bg-slate-400';
  } else {
    // Azul Océano / Acento
    estilo = 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400';
    dotColor = 'bg-sky-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide whitespace-nowrap shadow-2xs ${estilo} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{texto}</span>
    </span>
  );
}

export default BadgeStatus;

