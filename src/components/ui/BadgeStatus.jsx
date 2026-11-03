export function BadgeStatus({ valor, className = '' }) {
  if (valor === null || valor === undefined || valor === '') {
    return <span className="text-slate-400 font-mono">—</span>;
  }

  let texto = valor;
  if (typeof valor === 'boolean') {
    texto = valor ? 'Activo' : 'Inactivo';
  } else {
    texto = String(valor).trim();
  }

  const v = texto.toLowerCase();

  let tono = 'azul';
  if (/^(activ[oa]|aprobado?|finalizado?|pagada?|aplicado|exitos[oa]|resuelta?|en tiempo|v[aá]lido?|s[ií]|baja)$/.test(v)) {
    tono = 'verde';
  } else if (/^(pendiente|en revisi[oó]n|en proceso|programad[oa]|suspendid[oa]|medi[oa]|abierta|por vencer)$/.test(v)) {
    tono = 'ambar';
  } else if (/^(rechazad[oa]|cancelad[oa]|vencida?|cortada?|dañado?|anulado?|anulad[oa]|fallid[oa]|alta|cr[ií]tico?|error|inv[aá]lido?)$/.test(v)) {
    tono = 'rojo';
  } else if (/^(inactiv[oa]|sustituido|retirado|no)$/.test(v)) {
    tono = '';
  }

  return (
    <span className={`insignia ${tono} ${className}`.trim()}>
      <span className="insignia-punto" aria-hidden="true" />
      <span>{texto}</span>
    </span>
  );
}

export default BadgeStatus;
