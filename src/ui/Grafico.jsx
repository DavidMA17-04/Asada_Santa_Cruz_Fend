import { useMemo } from 'react';
import { etiquetaDe, moneda, numero } from './formato.js';

const PALETA = ['#144272', '#2e7d47', '#1b76a6', '#38b2e3', '#d97706', '#64748b'];

/** Gráfico de anillo (Donut) minimalista con total al centro y leyenda porcentual. */
export function GraficoDonut({
  segmentos = [],
  totalEtiqueta = 'Total',
  colores = PALETA,
}) {
  const limpios = segmentos.filter((s) => Number(s.valor) >= 0);
  const total = limpios.reduce((acc, s) => acc + (Number(s.valor) || 0), 0);
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;

  let acumulado = 0;
  const arcos = limpios.map((s, i) => {
    const valor = Number(s.valor) || 0;
    const proporcion = total > 0 ? valor / total : 0;
    const longitud = proporcion * circunferencia;
    const offset = -acumulado;
    acumulado += longitud;
    return {
      ...s,
      valor,
      porcentaje: total > 0 ? Math.round(proporcion * 100) : 0,
      color: s.color || colores[i % colores.length],
      dasharray: `${longitud} ${circunferencia}`,
      dashoffset: offset,
    };
  });

  return (
    <div className="donut-contenedor">
      <div className="donut-svg-envoltura">
        <svg viewBox="0 0 110 110" className="donut-svg">
          <circle
            cx="55"
            cy="55"
            r={radio}
            fill="none"
            stroke="var(--borde-suave)"
            strokeWidth="12"
          />
          {total > 0 ? arcos.map((a) => (
            <circle
              key={a.etiqueta}
              cx="55"
              cy="55"
              r={radio}
              fill="none"
              stroke={a.color}
              strokeWidth="12"
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
              strokeLinecap="butt"
              transform="rotate(-90 55 55)"
            />
          )) : null}
        </svg>
        <div className="donut-centro">
          <strong>{numero(total)}</strong>
          <small>{totalEtiqueta}</small>
        </div>
      </div>

      <div className="donut-leyenda">
        {arcos.map((a) => (
          <div className="donut-item" key={a.etiqueta}>
            <span className="donut-punto" style={{ background: a.color }} />
            <span className="donut-nombre">{a.etiqueta}</span>
            <strong className="donut-valor">{numero(a.valor)}</strong>
            <small className="donut-pct">{`${a.porcentaje}%`}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Gráfico de columnas verticales minimalista con contenedor punteado cuando está vacío. */
export function GraficoColumnas({
  filas = [],
  etiqueta,
  campo,
  formato = numero,
  color = 'linear-gradient(180deg, #1b76a6 0%, #144272 100%)',
  mensajeVacio = 'No hay registros para este periodo.',
  pie = 'Periodo / Categoría',
}) {
  const datos = filas.slice(0, 12).map((f) => ({
    nombre: typeof etiqueta === 'function' ? etiqueta(f) : String(f[etiqueta] ?? '—'),
    valor: Number(f[campo]) || 0,
  }));
  const max = Math.max(0, ...datos.map((d) => d.valor));

  if (!datos.length || max === 0) {
    return (
      <div className="lienzo-grafico-vacio">
        <div className="caja-punteada">
          <span>{mensajeVacio}</span>
        </div>
        {pie ? <small className="pie-eje">{pie}</small> : null}
      </div>
    );
  }

  return (
    <div className="lienzo-columnas">
      <div className="columnas-area">
        {datos.map((d, i) => {
          const altura = Math.max(8, Math.round((d.valor / max) * 140));
          return (
            <div className="columna-item" key={`${d.nombre}-${i}`} title={`${d.nombre}: ${formato(d.valor)}`}>
              <span className="columna-valor">{formato(d.valor)}</span>
              <div className="columna-pista">
                <div
                  className="columna-barra"
                  style={{ height: `${altura}px`, background: color }}
                />
              </div>
              <small className="columna-etiqueta">{d.nombre}</small>
            </div>
          );
        })}
      </div>
      {pie ? <small className="pie-eje">{pie}</small> : null}
    </div>
  );
}

/** Gráfico de barras horizontales para comparativas y series múltiples. */
export function GraficoBarras({ filas, etiqueta, series, formato = numero }) {
  if (!filas?.length) {
    return (
      <div className="lienzo-grafico-vacio">
        <div className="caja-punteada">
          <span>No hay datos registrados para graficar en este periodo.</span>
        </div>
      </div>
    );
  }
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
                  <div className={`serie-${i}`} style={{ width: `${Math.max(2, (valor / maximo) * 82)}%` }} />
                  <strong>{formato(valor)}</strong>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const CAMPOS_AGRUPACION = [
  'estado', 'estado_sla', 'prioridad', 'estado_factura', 'estado_conexion',
  'tipo_abonado', 'tipo', 'tipo_trabajo', 'tipo_tarifa', 'nombre_rol',
  'puesto', 'accion', 'resultado', 'activo',
];

const CAMPOS_NUMERICOS = [
  'saldo', 'saldo_vencido', 'monto_total', 'monto', 'total_recaudado',
  'consumo', 'consumo_actual', 'horas_duracion', 'horas_resolucion',
  'carga_activa', 'total_incidencias', 'mantenimientos_finalizados',
];

/** Resumen visual automático con Donut y gráfico de barras para cualquier tabla de la aplicación. */
export function ResumenVisualDatos({ filas = [] }) {
  const analisis = useMemo(() => {
    if (!filas || filas.length < 2) return null;
    const muestra = filas[0] || {};
    const claves = Object.keys(muestra);

    const campoCat = CAMPOS_AGRUPACION.find((c) => c in muestra);
    const campoNum = CAMPOS_NUMERICOS.find((c) => typeof muestra[c] === 'number');
    const campoEtiqueta = claves.find((c) => /nombre|abonado|responsable|empleado|ubicacion|numero_serie|medidor|descripcion|tabla/.test(c))
      || claves[0];

    let segmentos = [];
    if (campoCat) {
      const mapa = new Map();
      filas.forEach((f) => {
        const raw = f[campoCat];
        const k = typeof raw === 'boolean' ? (raw ? 'Activo' : 'Inactivo') : String(raw ?? 'Sin clasificar');
        mapa.set(k, (mapa.get(k) || 0) + 1);
      });
      segmentos = [...mapa.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([etiqueta, valor]) => ({ etiqueta, valor }));
    }

    return {
      campoCat,
      campoNum,
      campoEtiqueta,
      segmentos,
      esMoneda: campoNum && /monto|saldo|recaudado|pagado/.test(campoNum),
    };
  }, [filas]);

  if (!analisis || (!analisis.segmentos.length && !analisis.campoNum)) return null;

  return (
    <div className="resumen-visual-grid">
      {analisis.segmentos.length ? (
        <div className="tarjeta-mini-grafico">
          <div className="tarjeta-mini-cabecera">
            <strong>{`Distribución por ${etiquetaDe(analisis.campoCat).toLowerCase()}`}</strong>
            <small>{`${filas.length} registros`}</small>
          </div>
          <GraficoDonut
            segmentos={analisis.segmentos}
            totalEtiqueta="Registros"
          />
        </div>
      ) : null}

      {analisis.campoNum ? (
        <div className="tarjeta-mini-grafico">
          <div className="tarjeta-mini-cabecera">
            <strong>{`Comparativa de ${etiquetaDe(analisis.campoNum).toLowerCase()}`}</strong>
            <small>Principales registros</small>
          </div>
          <GraficoColumnas
            filas={filas.slice(0, 8)}
            etiqueta={analisis.campoEtiqueta}
            campo={analisis.campoNum}
            formato={analisis.esMoneda ? moneda : numero}
            pie={etiquetaDe(analisis.campoEtiqueta)}
          />
        </div>
      ) : null}
    </div>
  );
}
