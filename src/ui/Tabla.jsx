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
}) {
  const cols = useMemo(() => (
    (columnas || Object.keys(filas[0] || {}).filter((c) => !ocultar.includes(c)))
      .map((c) => (typeof c === 'string' ? { campo: c, etiqueta: etiquetaDe(c) } : { etiqueta: etiquetaDe(c.campo), ...c }))
  ), [columnas, filas, ocultar]);

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
    return (
      <div className="vacio tabla-envoltura">
        <span>No hay registros para mostrar en este momento.</span>
      </div>
    );
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
        <div className="buscador-tabla">
          <Icono nombre="buscar" />
          <input
            type="search"
            placeholder="Filtrar en los resultados…"
            aria-label="Buscar en los resultados"
            value={termino}
            onChange={(e) => { setTermino(e.target.value); setPagina(0); }}
          />
        </div>
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
          <Icono nombre="descargar" /> Exportar CSV
        </button>
      </div>
      <div className="tabla-envoltura">
        <table>
          <thead>
            <tr>
              {cols.map((c) => {
                const activo = orden?.campo === c.campo;
                return (
                  <th key={c.campo} onClick={() => ordenar(c.campo)} title="Ordenar por esta columna">
                    <span>{c.etiqueta}</span>
                    {activo ? <em className="orden-flecha">{orden.asc ? ' ▲' : ' ▼'}</em> : null}
                  </th>
                );
              })}
              {acciones.length ? <th className="th-acciones">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {visibles.length ? visibles.map((fila, i) => (
              <tr key={i}>
                {cols.map((c) => {
                  const { contenido, clase } = formatearCelda(c.campo, fila[c.campo]);
                  return <td key={c.campo} className={clase}>{contenido}</td>;
                })}
                {acciones.length ? (
                  <td className="acciones">
                    {acciones.filter((a) => !a.visible || a.visible(fila)).map((a) => (
                      <button
                        key={a.texto}
                        className={`boton chico ${a.peligro ? 'peligro' : ''} ${a.primario ? 'primario' : ''}`}
                        type="button"
                        onClick={() => alAccion(a, fila)}
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
          <span>{`Página ${paginaActual + 1} de ${totalPaginas}`}</span>
          <button className="boton chico" type="button" disabled={paginaActual >= totalPaginas - 1} onClick={() => setPagina(paginaActual + 1)}>Siguiente</button>
        </div>
      ) : null}
    </div>
  );
}
