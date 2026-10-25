import { numero } from './formato.js';

export function GraficoBarras({ filas, etiqueta, series, formato = numero }) {
  if (!filas.length) return null;
  const textoEtiqueta = typeof etiqueta === 'function' ? etiqueta : (f) => f[etiqueta];
  const maximo = Math.max(1, ...filas.flatMap((f) => series.map((s) => Number(f[s.campo]) || 0)));

  return (
    <div className="grafico">
      {series.length > 1 ? (
        <div className="grafico-leyenda">
          {series.map((s, i) => (
            <span key={s.nombre}><i className={`serie-${i}`} />{s.nombre}</span>
          ))}
        </div>
      ) : null}
      {filas.map((f, idx) => (
        <div className="grafico-fila" key={idx}>
          <span title={textoEtiqueta(f)}>{textoEtiqueta(f)}</span>
          <div className="grafico-barras">
            {series.map((s, i) => {
              const valor = Number(f[s.campo]) || 0;
              return (
                <div className="grafico-barra" key={s.campo} title={`${s.nombre}: ${formato(valor)}`}>
                  <div className={`serie-${i}`} style={{ width: `${(valor / maximo) * 85}%` }} />
                  {formato(valor)}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
