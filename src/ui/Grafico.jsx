import { useMemo, useState } from 'react';
import { etiquetaDe, moneda, numero } from './formato.js';

const PALETA = ['#144272', '#2e7d47', '#1b76a6', '#38b2e3', '#d97706', '#64748b'];

/** Gráfico de anillo (Donut) minimalista con total al centro y leyenda porcentual. */
export function GraficoDonut({
  segmentos = [],
  totalEtiqueta = 'Total',
  colores = PALETA,
  tipo = 'dona',
}) {
  const limpios = segmentos.filter((s) => Number(s.valor) >= 0);
  const total = limpios.reduce((acc, s) => acc + (Number(s.valor) || 0), 0);
  const totalTexto = numero(total);
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;

  let acumulado = 0;
  const arcos = limpios.map((s, i) => {
    const valor = Number(s.valor) || 0;
    const proporcion = total > 0 ? valor / total : 0;
    const longitud = proporcion * circunferencia;
    const offset = -acumulado;
    const inicio = total > 0 ? (acumulado / total) * 2 * Math.PI - Math.PI / 2 : 0;
    acumulado += longitud;
    return {
      ...s,
      valor,
      porcentaje: total > 0 ? Math.round(proporcion * 100) : 0,
      color: s.color || colores[i % colores.length],
      proporcion,
      inicio,
      dasharray: `${longitud} ${circunferencia}`,
      dashoffset: offset,
    };
  });

  return (
    <div className="donut-contenedor">
      <div className="donut-svg-envoltura">
        <svg viewBox="0 0 110 110" className="donut-svg">
          {tipo === 'pastel' ? null : (
            <circle
              cx="55"
              cy="55"
              r={radio}
              fill="none"
              stroke="var(--borde-suave)"
              strokeWidth="12"
            />
          )}
          {total > 0 ? arcos.map((a) => (
            tipo === 'pastel' ? (
              a.proporcion === 1 ? (
                <circle key={a.etiqueta} cx="55" cy="55" r="50" fill={a.color} />
              ) : (
                <path
                  key={a.etiqueta}
                  d={`M 55 55 L ${55 + 50 * Math.cos(a.inicio)} ${55 + 50 * Math.sin(a.inicio)} A 50 50 0 ${a.proporcion > 0.5 ? 1 : 0} 1 ${55 + 50 * Math.cos(a.inicio + a.proporcion * 2 * Math.PI)} ${55 + 50 * Math.sin(a.inicio + a.proporcion * 2 * Math.PI)} Z`}
                  fill={a.color}
                />
              )
            ) : (
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
            )
          )) : null}
        </svg>
        {tipo === 'pastel' ? null : (
          <div className={`donut-centro${totalTexto.length > 8 ? ' donut-centro-compacto' : ''}`}>
            <strong title={totalTexto}>{totalTexto}</strong>
            <small>{totalEtiqueta}</small>
          </div>
        )}
      </div>

      <div className="donut-leyenda">
        {arcos.map((a) => (
          <div className="donut-item" key={a.etiqueta}>
            <span className="donut-punto" style={{ background: a.color }} />
            <span className="donut-nombre" title={a.etiqueta}>{a.etiqueta}</span>
            <strong className="donut-valor" title={numero(a.valor)}>{numero(a.valor)}</strong>
            <small className="donut-pct">{`${a.porcentaje}%`}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Abrevia montos grandes para que quepan en una columna (el valor exacto va en el tooltip). */
const abreviar = (valor) => {
  const n = Number(valor) || 0;
  const abs = Math.abs(n);
  const decimal = (x) => x.toFixed(1).replace('.', ',');
  if (abs >= 1e9) return `${decimal(n / 1e9)} mil M`;
  if (abs >= 1e6) return `${decimal(n / 1e6)} M`;
  if (abs >= 1e5) return `${Math.round(n / 1e3)} k`;
  if (abs >= 1e3) return `${decimal(n / 1e3)} k`;
  return String(Math.round(n));
};

/** Gráfico de columnas verticales moderno con gradientes de la ASADA, cuadrícula sutil y tooltips interactivos. */
export function GraficoColumnas({
  filas = [],
  etiqueta,
  campo,
  formato = numero,
  color = 'linear-gradient(180deg, #38B6FF 0%, #1A5B8C 100%)',
  mensajeVacio = 'No hay registros para este periodo.',
  pie = 'Periodo / Categoría',
  maximo = 12,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const datos = filas.slice(0, maximo).map((f) => ({
    nombre: typeof etiqueta === 'function' ? etiqueta(f) : String(f[etiqueta] ?? '—'),
    valor: Number(f[campo]) || 0,
  }));
  const max = Math.max(0, ...datos.map((d) => d.valor));
  const esMoneda = formato === moneda || /monto|saldo|recaudado|ingreso|total/i.test(campo);

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
    <div className="lienzo-columnas w-full">
      <div className="relative pt-9 pb-3 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-visible shadow-xs">
        {/* Líneas horizontales de cuadrícula (Grid) sutiles */}
        <div className="absolute inset-x-4 top-10 bottom-12 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-600 w-full" />
          <div className="border-b border-dashed border-slate-600 w-full" />
          <div className="border-b border-dashed border-slate-600 w-full" />
          <div className="border-b border-dashed border-slate-600 w-full" />
        </div>

        {/* Área de columnas */}
        <div className="relative z-10 flex items-end justify-between gap-3 h-[180px]">
          {datos.map((d, i) => {
            const altura = d.valor > 0 ? Math.max(6, Math.round((d.valor / max) * 100)) : 4;
            const completo = esMoneda ? moneda(d.valor) : formato(d.valor);
            const abreviado = completo.length > 8 ? `${esMoneda ? '₡' : ''}${abreviar(d.valor)}` : completo;
            const estaActivo = hoverIndex === i;

            return (
              <div
                key={`${d.nombre}-${i}`}
                className="relative flex-1 flex flex-col items-center justify-end h-full min-w-0 group cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Tooltip moderno flotante animado */}
                {estaActivo ? (
                  <div className="absolute -top-12 z-30 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-2xl text-xs whitespace-nowrap flex flex-col items-center pointer-events-none transform -translate-x-1/2 left-1/2 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">{d.nombre}</span>
                    <strong className="text-sky-400 font-bold tracking-tight mt-0.5">{completo}</strong>
                    <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700/80 transform rotate-45 -mb-1 mt-0.5" />
                  </div>
                ) : null}

                {/* Etiquetas de valores con peso semibold formateados */}
                <span className={`text-[11px] font-semibold tracking-tight mb-2 whitespace-nowrap transition-colors duration-150 ${estaActivo ? 'text-sky-400 scale-105' : 'text-slate-300'}`}>
                  {abreviado}
                </span>

                {/* Barras estilizadas con esquinas redondeadas y gradientes */}
                <div className="w-full flex justify-center items-end flex-1 max-h-[135px]">
                  <div
                    className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ease-out shadow-xs ${estaActivo ? 'brightness-125 shadow-md shadow-sky-500/25 scale-x-105' : 'hover:brightness-110'}`}
                    style={{
                      height: `${altura}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Eje X y etiquetas legibles */}
        <div className="border-t border-slate-700/60 mt-0 pt-2 flex items-center justify-between gap-3">
          {datos.map((d, i) => (
            <div key={`lbl-${i}`} className="flex-1 text-center min-w-0">
              <span
                className={`text-xs font-medium truncate block transition-colors duration-150 ${hoverIndex === i ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
                title={d.nombre}
              >
                {d.nombre}
              </span>
            </div>
          ))}
        </div>
      </div>

      {pie ? <small className="block text-center mt-2.5 text-xs text-slate-500 font-medium tracking-wide">{pie}</small> : null}
    </div>
  );
}

/** Gráfico de barras horizontales estilizado con gradientes de la ASADA y tooltips. */
export function GraficoBarras({ filas, etiqueta, series, formato = numero }) {
  const [hoverBar, setHoverBar] = useState(null);

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
    <div className="space-y-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-xs">
      {series.length > 1 ? (
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 pb-2 border-b border-slate-800">
          {series.map((s) => (
            <span key={s.nombre} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-400 to-[#1A5B8C]" />
              {s.nombre}
            </span>
          ))}
        </div>
      ) : null}

      <div className="space-y-3.5">
        {filas.map((f, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300" title={textoEtiqueta(f)}>
                {textoEtiqueta(f)}
              </span>
            </div>

            <div className="space-y-2">
              {series.map((s) => {
                const valor = Number(f[s.campo]) || 0;
                const pct = Math.max(2, (valor / maximo) * 100);
                const activo = hoverBar === `${idx}-${s.campo}`;

                return (
                  <div
                    key={s.campo}
                    className="relative flex items-center gap-3 cursor-pointer group"
                    onMouseEnter={() => setHoverBar(`${idx}-${s.campo}`)}
                    onMouseLeave={() => setHoverBar(null)}
                  >
                    <div className="flex-1 h-3.5 rounded-full bg-slate-800/80 overflow-hidden relative border border-slate-700/40">
                      <div
                        className={`h-full rounded-r-lg transition-all duration-300 ease-out bg-gradient-to-r from-[#1A5B8C] to-[#38B6FF] ${activo ? 'brightness-125' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <strong className="text-xs font-semibold text-slate-200 min-w-[70px] text-right font-mono">
                      {formato(valor)}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
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
            filas={filas.slice(0, 6)}
            etiqueta={analisis.campoEtiqueta}
            campo={analisis.campoNum}
            formato={analisis.esMoneda ? moneda : numero}
            pie={etiquetaDe(analisis.campoEtiqueta)}
            maximo={6}
          />
        </div>
      ) : null}
    </div>
  );
}
