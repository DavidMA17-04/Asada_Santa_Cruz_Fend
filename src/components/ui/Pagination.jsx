import { useMemo } from 'react';
import { Icono } from '../../ui/Icono.jsx';

export function Pagination({
  totalRegistros = 0,
  paginaActual = 0, // 0-based
  porPagina = 25,
  alCambiarPagina,
  className = '',
}) {
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / porPagina));
  const paginaSegura = Math.min(Math.max(0, paginaActual), totalPaginas - 1);

  // Generar páginas numeradas si hay múltiples páginas
  const numerosPagina = useMemo(() => {
    if (totalPaginas <= 1) return [];
    const paginas = [];
    if (totalPaginas <= 7) {
      for (let i = 0; i < totalPaginas; i++) paginas.push(i);
    } else {
      paginas.push(0);
      if (paginaSegura > 2) paginas.push('...');
      const inicio = Math.max(1, paginaSegura - 1);
      const fin = Math.min(totalPaginas - 2, paginaSegura + 1);
      for (let i = inicio; i <= fin; i++) paginas.push(i);
      if (paginaSegura < totalPaginas - 3) paginas.push('...');
      paginas.push(totalPaginas - 1);
    }
    return paginas;
  }, [totalPaginas, paginaSegura]);

  if (totalRegistros <= 0) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 pb-2 text-xs select-none ${className}`}
    >
      {/* 2. Simplificación del Texto de Paginación: Únicamente la píldora informativa */}
      <div className="flex items-center">
        <span className="px-3.5 py-1.5 rounded-full border border-slate-700/50 bg-slate-900/60 text-slate-300 font-medium tracking-wide shadow-xs">
          Página <strong className="text-white font-semibold">{paginaSegura + 1}</strong> de <strong className="text-white font-semibold">{totalPaginas}</strong>
        </span>
      </div>

      {/* 3. Rediseño y Mejora del Componente de Paginación (Botones) */}
      {totalPaginas > 1 ? (
        <div className="flex items-center gap-1.5">
          {/* Botón Anterior */}
          <button
            type="button"
            disabled={paginaSegura === 0}
            onClick={() => alCambiarPagina?.(paginaSegura - 1)}
            className="px-3 py-1.5 rounded-xl border border-slate-700/50 bg-slate-900/60 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 hover:border-sky-500/50 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer font-medium text-xs shadow-xs"
            title="Página anterior"
          >
            <Icono nombre="izquierda" tamano={13} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Números de página */}
          <div className="flex items-center gap-1 mx-1">
            {numerosPagina.map((num, i) => {
              if (num === '...') {
                return (
                  <span key={`puntos-${i}`} className="px-2 text-slate-500 font-medium select-none">
                    …
                  </span>
                );
              }
              const activo = num === paginaSegura;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => alCambiarPagina?.(num)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all flex items-center justify-center cursor-pointer shadow-xs
                    ${activo
                      ? 'bg-sky-600 text-white shadow-sm border border-sky-500/60'
                      : 'bg-slate-900/60 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-sky-500/50 hover:text-white'}`}
                >
                  {num + 1}
                </button>
              );
            })}
          </div>

          {/* Botón Siguiente */}
          <button
            type="button"
            disabled={paginaSegura >= totalPaginas - 1}
            onClick={() => alCambiarPagina?.(paginaSegura + 1)}
            className="px-3 py-1.5 rounded-xl border border-slate-700/50 bg-slate-900/60 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 hover:border-sky-500/50 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer font-medium text-xs shadow-xs"
            title="Página siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <Icono nombre="derecha" tamano={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default Pagination;
