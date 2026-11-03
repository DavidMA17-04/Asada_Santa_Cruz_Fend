import { useMemo } from 'react';
import { Icono } from '../../ui/Icono.jsx';

export function Pagination({
  totalRegistros = 0,
  paginaActual = 0,
  porPagina = 25,
  alCambiarPagina,
  className = '',
}) {
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / porPagina));
  const paginaSegura = Math.min(Math.max(0, paginaActual), totalPaginas - 1);

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
    <div className={`paginacion-barra ${className}`.trim()}>
      <span className="paginacion-info">
        Página <strong>{paginaSegura + 1}</strong> de <strong>{totalPaginas}</strong>
      </span>

      {totalPaginas > 1 ? (
        <div className="paginacion-controles">
          <button
            type="button"
            className="paginacion-nav"
            disabled={paginaSegura === 0}
            onClick={() => alCambiarPagina?.(paginaSegura - 1)}
            title="Página anterior"
          >
            <Icono nombre="izquierda" tamano={13} />
            <span className="paginacion-nav-texto">Anterior</span>
          </button>

          <div className="paginacion-numeros">
            {numerosPagina.map((num, i) => {
              if (num === '...') {
                return (
                  <span key={`puntos-${i}`} className="paginacion-puntos">
                    …
                  </span>
                );
              }
              const activo = num === paginaSegura;
              return (
                <button
                  key={num}
                  type="button"
                  className={`paginacion-num${activo ? ' activo' : ''}`}
                  onClick={() => alCambiarPagina?.(num)}
                  aria-current={activo ? 'page' : undefined}
                >
                  {num + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="paginacion-nav"
            disabled={paginaSegura >= totalPaginas - 1}
            onClick={() => alCambiarPagina?.(paginaSegura + 1)}
            title="Página siguiente"
          >
            <span className="paginacion-nav-texto">Siguiente</span>
            <Icono nombre="derecha" tamano={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default Pagination;
