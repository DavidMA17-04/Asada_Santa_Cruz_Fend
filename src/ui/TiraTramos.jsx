/** Tira visual de los tramos de mora: rango de días y porcentaje. */
export function TiraTramos({ filas = [] }) {
  const tramos = [...filas].sort((a, b) => Number(a.dias_desde) - Number(b.dias_desde));
  if (!tramos.length) return null;

  return (
    <div className="tira-tramos" aria-label="Tramos de mora configurados">
      {tramos.map((t) => (
        <div
          className={`tira-tramo${t.activo === false ? ' inactivo' : ''}`}
          key={t.id_tramo ?? `${t.dias_desde}-${t.dias_hasta}`}
        >
          <span className="tira-tramo-rango">
            {t.dias_hasta ? `${t.dias_desde}–${t.dias_hasta} días` : `${t.dias_desde}+ días`}
          </span>
          <strong>{`${Number(t.porcentaje)}%`}</strong>
          {t.activo === false ? <small>Inactivo</small> : null}
        </div>
      ))}
    </div>
  );
}

export default TiraTramos;
