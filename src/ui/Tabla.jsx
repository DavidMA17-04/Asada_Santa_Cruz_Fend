import { useMemo, useState } from 'react';
import { etiquetaDe, formatearCelda } from './formato.js';
import { Icono } from './Icono.jsx';

function aCsv(columnas, filas) {
  const escapar = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [columnas.map((c) => escapar(c.etiqueta)).join(','),
    ...filas.map((f) => columnas.map((c) => escapar(f[c.campo])).join(','))].join('\r\n');
}

function descargar(nombre, texto) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', texto], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function Tabla({
  filas,
  acciones = [],
  alAccion,
  ocultar = [],
  columnas,
  porPagina = 25,
  nombreArchivo = 'datos',
  mensajeVacio = 'No hay registros para mostrar.',
}) {
  const cols = useMemo(() => (
    (columnas || Object.keys(filas[0] || {}).filter((c) => !ocultar.includes(c)))
      .map((c) => (typeof c === 'string' ? { campo: c, etiqueta: etiquetaDe(c) } : { etiqueta: etiquetaDe(c.campo), ...c }))
  ), [columnas, filas, ocultar]);

  const claseDeCol = (col, fila) => (typeof col.clase === 'function' ? col.clase(fila) : col.clase);

  const claseCelda = (col, fila) => {
    const base = formatearCelda(col.campo, fila[col.campo]).clase;
    return [base, claseDeCol(col, fila)].filter(Boolean).join(' ');
  };

  const [termino, setTermino] = useState('');
  const [orden, setOrden] = useState(null);
  const [pagina, setPagina] = useState(0);

  const filtradas = useMemo(() => {
    const t = termino.trim().toLowerCase();
    let lista = t
      ? filas.filter((f) => cols.some((c) => String(f[c.campo] ?? '').toLowerCase().includes(t)))
      : [...filas];
    if (orden) {
      const { campo, asc } = orden;
      lista.sort((a, b) => {
        const x = a[campo];
        const y = b[campo];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true });
        return asc ? r : -r;
      });
    }
    return lista;
  }, [filas, cols, termino, orden]);

  if (!filas.length) {
    return <div className="vacio tabla-envoltura">{mensajeVacio}</div>;
  }

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtradas.slice(paginaActual * porPagina, (paginaActual + 1) * porPagina);

  function ordenar(campo) {
    setOrden((prev) => (prev?.campo === campo ? { campo, asc: !prev.asc } : { campo, asc: true }));
    setPagina(0);
  }

  return (
    <div>
      <div className="tabla-barra">
        <input
          type="search"
          placeholder="Buscar en los resultados…"
          aria-label="Buscar en los resultados"
          value={termino}
          onChange={(e) => { setTermino(e.target.value); setPagina(0); }}
        />
        <span className="cuenta">
          {filtradas.length === filas.length
            ? `${filas.length} registro${filas.length === 1 ? '' : 's'}`
            : `${filtradas.length} de ${filas.length} registros`}
        </span>
        <button
          className="boton chico"
          type="button"
          title="Descargar CSV"
          onClick={() => descargar(`${nombreArchivo}.csv`, aCsv(cols, filtradas))}
        >
          <Icono nombre="descargar" /> CSV
        </button>
      </div>
      <div className="tabla-envoltura">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.campo}
                  className={typeof c.clase === 'string' ? c.clase : ''}
                  onClick={() => ordenar(c.campo)}
                  title="Ordenar"
                >
                  {c.etiqueta}
                </th>
              ))}
              {acciones.length ? <th className="acciones">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {visibles.length ? visibles.map((fila, i) => (
              <tr key={i}>
                {cols.map((c) => {
                  const { contenido } = formatearCelda(c.campo, fila[c.campo]);
                  return <td key={c.campo} className={claseCelda(c, fila)}>{contenido}</td>;
                })}
                {acciones.length ? (
                  <td className="acciones">
                    {acciones.filter((a) => !a.visible || a.visible(fila)).map((a) => (
                      <button
                        key={a.texto}
                        className={`boton chico${a.primario ? ' primario' : ''}${a.peligro ? ' peligro' : ''}${a.suave ? ' suave' : ''}`}
                        type="button"
                        onClick={() => {
                          if (!alAccion) return;
                          Promise.resolve(alAccion(a, fila)).catch(() => {});
                        }}
                      >
                        {a.texto}
                      </button>
                    ))}
                  </td>
                ) : null}
              </tr>
            )) : (
              <tr>
                <td colSpan={cols.length + (acciones.length ? 1 : 0)} className="vacio">
                  Ningún registro coincide con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 ? (
        <div className="paginacion">
          <button className="boton chico" type="button" disabled={paginaActual === 0} onClick={() => setPagina(paginaActual - 1)}>Anterior</button>
          {`Página ${paginaActual + 1} de ${totalPaginas}`}
          <button className="boton chico" type="button" disabled={paginaActual >= totalPaginas - 1} onClick={() => setPagina(paginaActual + 1)}>Siguiente</button>
        </div>
      ) : null}
    </div>
  );
}
