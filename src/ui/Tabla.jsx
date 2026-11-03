import { useEffect, useMemo, useState } from 'react';
import { etiquetaDe, formatearCelda } from './formato.js';
import { BadgeStatus } from '../components/ui/BadgeStatus.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Icono } from './Icono.jsx';

const ES_COLUMNA_CANTIDAD = /^(cantidad|cant|total_incidencias|mantenimientos_finalizados|cantidad_pagos|total_pagos|intentos|intentos_fallidos|medidores_activos|usuarios_activos|mes|anio|periodo|dias|dias_desde|dias_hasta)$/i;

function esColumnaCentrada(campo, etiqueta) {
  const c = String(campo || '').toLowerCase();
  const e = String(etiqueta || '').toLowerCase();
  if (c.includes('cantidad') || e.includes('cantidad')) return true;
  if (ES_COLUMNA_CANTIDAD.test(c)) return true;
  if (/^(cant|intentos|num|numero|mes|año|anio|total)/i.test(e)) return true;
  return false;
}

function aCsv(columnas, filas) {
  const escapar = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [
    columnas.map((c) => escapar(c.etiqueta)).join(','),
    ...filas.map((f) => columnas.map((c) => escapar(f[c.campo])).join(',')),
  ].join('\r\n');
}

export function descargarCsv(nombre, columnas, filas) {
  const csv = aCsv(columnas, filas);
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function Tabla({
  filas = [],
  acciones = [],
  alAccion,
  ocultar = [],
  columnas,
  porPagina = 25,
  nombreArchivo = 'datos',
  terminoExterno,
  alCambiarTerminoExterno,
  exportarRef,
  ocultarHerramientas = false,
  mensajeVacio = 'No hay registros para mostrar en este momento.',
}) {
  const cols = useMemo(() => {
    const base = columnas || Object.keys(filas[0] || {}).filter((c) => !ocultar.includes(c));
    return base.map((c) => {
      if (typeof c === 'string') {
        const etiqueta = c === 'activo' ? 'Estado' : etiquetaDe(c);
        return { campo: c, etiqueta };
      }
      const etiqueta = c.campo === 'activo' ? 'Estado' : (c.etiqueta || etiquetaDe(c.campo));
      return { ...c, etiqueta };
    });
  }, [columnas, filas, ocultar]);

  const [terminoInterno, setTerminoInterno] = useState('');
  const [orden, setOrden] = useState(null);
  const [pagina, setPagina] = useState(0);

  const terminoFinal = terminoExterno !== undefined ? terminoExterno : terminoInterno;

  const filtradas = useMemo(() => {
    const t = (terminoFinal || '').trim().toLowerCase();
    let lista = t
      ? filas.filter((f) =>
        cols.some((c) => {
          const val = f[c.campo];
          if (val === null || val === undefined) return false;
          if (c.campo === 'activo') {
            const strVal = val ? 'activo' : 'inactivo';
            return strVal.includes(t);
          }
          return String(val).toLowerCase().includes(t);
        })
      )
      : [...filas];

    if (orden) {
      const { campo, asc } = orden;
      lista.sort((a, b) => {
        const x = a[campo];
        const y = b[campo];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        const r =
          typeof x === 'number' && typeof y === 'number'
            ? x - y
            : String(x).localeCompare(String(y), 'es', { numeric: true });
        return asc ? r : -r;
      });
    }
    return lista;
  }, [filas, cols, terminoFinal, orden]);

  // Exponer función de exportación al ref padre si fue proporcionado
  useEffect(() => {
    if (exportarRef) {
      exportarRef.current = () => descargarCsv(nombreArchivo, cols, filtradas);
    }
  }, [exportarRef, nombreArchivo, cols, filtradas]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtradas.slice(paginaActual * porPagina, (paginaActual + 1) * porPagina);

  function ordenar(campo) {
    setOrden((prev) => (prev?.campo === campo ? { campo, asc: !prev.asc } : { campo, asc: true }));
    setPagina(0);
  }

  function resolverVarianteAccion(accion) {
    if (accion.peligro || /eliminar|desactivar|baja|anular/i.test(accion.texto)) return 'delete';
    if (/editar|modificar|actualizar/i.test(accion.texto)) return 'edit';
    if (/ver|detalle|consultar|historial/i.test(accion.texto) || accion.metodo === 'GET') return 'view';
    return 'outline';
  }

  return (
    <div className="w-full space-y-3">
      {/* Barra de herramientas interna (solo si no se controla externamente por la barra unificada) */}
      {!ocultarHerramientas ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-[var(--borde)]">
          <div className="flex-1 max-w-sm w-full">
            <Input
              type="search"
              variant="pill"
              icono="buscar"
              clearable
              placeholder="Buscar por nombre, correo o valor…"
              aria-label="Buscar en los resultados"
              value={terminoInterno}
              onChange={(val) => {
                setTerminoInterno(val);
                setPagina(0);
              }}
              onClear={() => {
                setTerminoInterno('');
                setPagina(0);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--texto-suave)]">
              {filtradas.length === filas.length
                ? `${filas.length} ${filas.length === 1 ? 'registro' : 'registros'}`
                : `${filtradas.length} de ${filas.length} registros`}
            </span>

            <Button
              variant="export"
              onClick={() => descargarCsv(nombreArchivo, cols, filtradas)}
              title="Descargar datos en formato CSV"
            >
              Exportar CSV
            </Button>
          </div>
        </div>
      ) : null}

      {/* Contenedor de la Tabla */}
      <div className="tabla-envoltura overflow-x-auto rounded-xl border border-[var(--borde)] bg-[var(--superficie)] shadow-2xs">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--borde)] bg-[var(--superficie-2)]/60 text-[var(--texto-suave)] font-semibold text-xs uppercase tracking-wider">
              {cols.map((c) => {
                const activo = orden?.campo === c.campo;
                const centrada = esColumnaCentrada(c.campo, c.etiqueta);
                return (
                  <th
                    key={c.campo}
                    onClick={() => ordenar(c.campo)}
                    className={`py-3 px-4 cursor-pointer hover:text-[var(--acento)] select-none transition-colors ${centrada ? 'text-center col-cantidad' : 'text-left'
                      }`}
                    title="Ordenar por esta columna"
                  >
                    <div className={`inline-flex items-center gap-1.5 ${centrada ? 'justify-center w-full' : ''}`}>
                      <span>{c.etiqueta}</span>
                      {activo ? (
                        <span className="text-sky-400">{orden.asc ? '▲' : '▼'}</span>
                      ) : null}
                    </div>
                  </th>
                );
              })}
              {acciones.length ? (
                <th className="py-3 px-4 text-center font-semibold text-xs tracking-wider uppercase text-slate-400 w-[200px]">
                  ACCIONES
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--borde)]">
            {visibles.length ? (
              visibles.map((fila, i) => (
                <tr
                  key={i}
                  className="hover:bg-sky-500/5 transition-colors group"
                >
                  {cols.map((c) => {
                    // Si el campo es activo o estado, renderizar BadgeStatus
                    if (c.campo === 'activo' || c.campo === 'estado' || c.campo === 'estado_factura' || c.campo === 'estado_conexion') {
                      return (
                        <td key={c.campo} className="py-3 px-4 whitespace-nowrap">
                          <BadgeStatus valor={fila[c.campo]} />
                        </td>
                      );
                    }

                    const centrada = esColumnaCentrada(c.campo, c.etiqueta);
                    const { contenido, clase } = formatearCelda(c.campo, fila[c.campo]);
                    const claseFinal = centrada ? `${clase || ''} text-center col-cantidad`.trim() : (clase || '');
                    return (
                      <td key={c.campo} className={`py-3 px-4 ${claseFinal}`}>
                        {contenido}
                      </td>
                    );
                  })}

                  {/* Acciones centradas con botones estandarizados */}
                  {acciones.length ? (
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {acciones
                          .filter((a) => !a.visible || a.visible(fila))
                          .map((a) => {
                            const variante = resolverVarianteAccion(a);
                            return (
                              <Button
                                key={a.texto}
                                variant={variante}
                                size="sm"
                                onClick={() => alAccion(a, fila)}
                                title={a.texto}
                              >
                                {a.texto}
                              </Button>
                            );
                          })}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={cols.length + (acciones.length ? 1 : 0)}
                  className="py-8 text-center text-[var(--texto-suave)]"
                >
                  {mensajeVacio}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        totalRegistros={filtradas.length}
        paginaActual={paginaActual}
        porPagina={porPagina}
        alCambiarPagina={(nuevaPagina) => setPagina(nuevaPagina)}
      />
    </div>
  );
}

export default Tabla;
