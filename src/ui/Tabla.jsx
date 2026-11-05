import { useEffect, useMemo, useRef, useState } from 'react';
import { etiquetaDe, formatearCelda } from './formato.js';
import { avisar } from './registro.js';
import { BadgeStatus } from '../components/ui/BadgeStatus.jsx';
import { BadgeSLA } from '../components/ui/BadgeSLA.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Icono } from './Icono.jsx';

function iconoAccion(accion) {
  if (accion.icono && accion.icono !== 'accion' && accion.icono !== 'puntos') return accion.icono;
  const t = String(accion.texto || '').toLowerCase();
  if (/auto-?asignar|asignar/.test(t)) return 'usuarios';
  if (/prioridad|alerta/.test(t)) return 'alerta';
  if (/modificar|editar|corregir|estado/.test(t)) return 'editar';
  if (/cerrar|finalizar|resolver/.test(t)) return 'check';
  if (/reabrir|reactivar|recargar/.test(t)) return 'recargar';
  if (/historial/.test(t)) return 'historial';
  if (/ver|detalle/.test(t)) return 'ojo';
  if (/desactivar|suspender|baja/.test(t)) return 'desactivar';
  if (/anular|eliminar/.test(t)) return 'peligro';
  if (/pago|registrar pago/.test(t)) return 'pago';
  if (/pr[oó]rroga|recargo/.test(t)) return 'factura';
  if (/registrar|crear|nuevo|agregar|reporte/.test(t)) return 'registrar';
  return null;
}

function esAccionPeligro(accion) {
  return Boolean(accion.peligro || /eliminar|desactivar|baja|anular|suspender/i.test(accion.texto || ''));
}

function tipoClaseAccion(accion) {
  if (esAccionPeligro(accion)) return 'peligro';
  const t = String(accion.texto || '').toLowerCase();
  if (/historial|ver|detalle/.test(t)) return 'historial';
  if (/modificar|editar|corregir/.test(t)) return 'editar';
  if (/cerrar|finalizar|resolver|check/.test(t)) return 'exito';
  if (/asignar|auto-asignar/.test(t)) return 'primario';
  if (/registrar|crear|agregar/.test(t)) return 'registrar';
  return 'normal';
}

const PRIORIDADES_ACCION = {
  historial: 1,
  ver: 2,
  registrar: 5,
  normal: 10,
  editar: 20,
  exito: 30,
  primario: 40,
  peligro: 90,
};

function MenuAccionesFila({ acciones, fila, alAccion }) {
  const [abierto, setAbierto] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const ref = useRef(null);
  const botonRef = useRef(null);
  const visibles = acciones.filter((a) => !a.visible || a.visible(fila));

  function posicionar() {
    const r = botonRef.current?.getBoundingClientRect();
    if (!r) return;
    setCoords({
      top: Math.round(r.bottom + 6),
      right: Math.round(window.innerWidth - r.right),
    });
  }

  useEffect(() => {
    if (!abierto) return undefined;
    posicionar();
    const alClicFuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    const alEscape = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    const reposicionar = () => posicionar();

    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alEscape);
    window.addEventListener('resize', reposicionar);
    window.addEventListener('scroll', reposicionar, true);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alEscape);
      window.removeEventListener('resize', reposicionar);
      window.removeEventListener('scroll', reposicionar, true);
    };
  }, [abierto]);

  if (!visibles.length) return <span className="text-[var(--texto-suave)] text-xs">—</span>;

  // Orden consistente: 1. Historial / Ver  ->  2. Registrar / Modificar  ->  3. Desactivar / Peligro
  const ordenadas = [...visibles].sort((a, b) => {
    const tipoA = tipoClaseAccion(a);
    const tipoB = tipoClaseAccion(b);
    return (PRIORIDADES_ACCION[tipoA] ?? 50) - (PRIORIDADES_ACCION[tipoB] ?? 50);
  });

  return (
    <div className={`menu-acciones-fila relative inline-flex items-center justify-center${abierto ? ' abierto' : ''}`} ref={ref}>
      <button
        ref={botonRef}
        type="button"
        className="menu-acciones-trigger"
        aria-expanded={abierto}
        aria-haspopup="menu"
        title="Acciones"
        onClick={() => {
          if (!abierto) posicionar();
          setAbierto((v) => !v);
        }}
      >
        <span>Acciones</span>
        <Icono nombre="abajo" tamano={12} className={`icono-flecha-menu ${abierto ? 'rotado' : ''}`} />
      </button>

      {abierto ? (
        <div
          className="menu-acciones-lista"
          role="menu"
          style={{ top: coords.top, right: coords.right }}
        >
          {ordenadas.map((a) => {
            const iconName = iconoAccion(a);
            const esPeligro = esAccionPeligro(a);
            return (
              <button
                key={a.texto}
                type="button"
                role="menuitem"
                className={`menu-acciones-item${esPeligro ? ' peligro' : ''}`}
                onClick={() => {
                  setAbierto(false);
                  alAccion?.(a, fila);
                }}
              >
                {iconName ? <Icono nombre={iconName} tamano={14} className="shrink-0" /> : null}
                <span>{a.texto}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const ES_COLUMNA_CANTIDAD = /^(id|id_\w+|nº|num|numero|cantidad|cant|total\w*|mantenimientos_\w*|abiertas\w*|resueltas|en_tiempo|por_vencer|vencidas\w*|intentos\w*|medidores_\w*|usuarios_\w*|mes|anio|año|periodo|dias\w*|horas\w*|sla\w*|promedio\w*|porcentaje|lectura\w*|consumo|prioridad|estado\w*|activo)$/i;

function esColumnaCentrada(campo, etiqueta) {
  const c = String(campo || '').toLowerCase();
  const e = String(etiqueta || '').toLowerCase();
  if (c.includes('cantidad') || e.includes('cantidad')) return true;
  if (c.startsWith('fecha') || e.includes('fecha')) return true;
  if (ES_COLUMNA_CANTIDAD.test(c)) return true;
  if (/^(nº|num|núm|número|id|total|abiertas|resueltas|en tiempo|por vencer|vencidas|sla|horas|promedio|días|dias|mes|año|anio|prioridad|estado|semáforo|semaforo)/i.test(e)) return true;
  return false;
}

function arreglarMojibake(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return texto
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/\u00c3\u00ad/g, 'í')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã /g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã /g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã‘/g, 'Ñ')
    .replace(/Âº/g, 'º')
    .replace(/Âª/g, 'ª')
    .replace(/Â/g, '');
}

function formatearValorCsv(valor, campo) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'number') return String(valor);
  if (typeof valor === 'string') {
    // Si es fecha ISO con hora (e.g. 2026-11-02 18:00 o 2026-11-03T10:09:00.000Z)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(valor)) {
      const d = new Date(valor);
      if (!Number.isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      }
    }
    return arreglarMojibake(valor.trim());
  }
  return String(valor);
}

function aCsv(columnas, filas, separador = ';') {
  const escapar = (v) => {
    let t = v === null || v === undefined ? '' : String(v);
    t = arreglarMojibake(t);
    // Si contiene comillas dobles, saltos de línea o el separador (;), se encierra entre comillas
    if (t.includes('"') || t.includes('\n') || t.includes('\r') || t.includes(separador)) {
      return `"${t.replace(/"/g, '""')}"`;
    }
    return t;
  };

  const lineas = [
    'sep=' + separador,
    columnas.map((c) => escapar(c.etiqueta || etiquetaDe(c.campo))).join(separador),
    ...filas.map((f) => columnas.map((c) => escapar(formatearValorCsv(f[c.campo], c.campo))).join(separador)),
  ];
  return lineas.join('\r\n');
}

export function descargarCsv(nombre, columnas, filas) {
  if (!filas || filas.length === 0) {
    avisar('No hay datos para exportar con los filtros seleccionados.', 'alerta');
    return;
  }
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const nombreLimpio = String(nombre || 'datos')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const nombreArchivoFinal = `ASADA_${nombreLimpio}_${fechaHoy}.csv`;

  const csv = aCsv(columnas, filas);
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivoFinal;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  avisar(`Reporte CSV descargado con éxito (${filas.length} ${filas.length === 1 ? 'registro' : 'registros'}).`, 'exito');
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
            <span className="cuenta-filtro-badge">
              {filtradas.length === filas.length ? (
                <>
                  <strong>{filas.length}</strong> {filas.length === 1 ? 'registro' : 'registros'}
                </>
              ) : (
                <>
                  <strong>{filtradas.length}</strong> de {filas.length} registros
                </>
              )}
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
      <div className="tabla-envoltura rounded-xl border border-[var(--borde)] bg-[var(--superficie)] shadow-2xs">
        <table className="w-full text-center text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--borde)] dark:border-[#1E3142] bg-[var(--superficie-2)] dark:bg-[#15222E] text-[var(--texto-suave)] dark:text-[#94a9be] font-semibold text-xs uppercase tracking-wider">
              {cols.map((c) => {
                const activo = orden?.campo === c.campo;
                const centrada = esColumnaCentrada(c.campo, c.etiqueta);
                return (
                  <th
                    key={c.campo}
                    onClick={() => ordenar(c.campo)}
                    className="py-3 px-3 cursor-pointer hover:text-[var(--acento)] select-none transition-colors text-center bg-inherit"
                    title="Ordenar por esta columna"
                  >
                    <div className="inline-flex items-center justify-center gap-1.5 w-full">
                      <span>{c.etiqueta}</span>
                      {activo ? (
                        <span className="text-sky-400">{orden.asc ? '▲' : '▼'}</span>
                      ) : null}
                    </div>
                  </th>
                );
              })}
              {acciones.length ? (
                <th className="th-acciones py-3 px-3 font-semibold text-xs tracking-wider uppercase text-center bg-inherit">
                  Acciones
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
                    // SLA: insignia con semáforo dinámico
                    if (c.campo === 'estado_sla' || c.campo === 'sla' || c.campo === 'sla_horas') {
                      return (
                        <td key={c.campo} className="tabla-td whitespace-nowrap">
                          <BadgeSLA
                            estadoSla={fila.estado_sla}
                            horasResolucion={fila.horas_resolucion}
                            slaHoras={fila.sla_horas}
                            estadoIncidencia={fila.estado}
                          />
                        </td>
                      );
                    }

                    // Estado / prioridad: insignia con color
                    if (
                      c.campo === 'activo'
                      || c.campo === 'estado'
                      || c.campo === 'estado_factura'
                      || c.campo === 'estado_conexion'
                      || c.campo === 'prioridad'
                    ) {
                      return (
                        <td key={c.campo} className="tabla-td whitespace-nowrap">
                          <BadgeStatus valor={fila[c.campo]} />
                        </td>
                      );
                    }

                    const { contenido, clase } = formatearCelda(c.campo, fila[c.campo]);
                    return (
                      <td key={c.campo} className={`tabla-td text-center ${clase || ''}`}>
                        {contenido}
                      </td>
                    );
                  })}

                  {acciones.length ? (
                    <td className="tabla-celda-acciones">
                      <MenuAccionesFila acciones={acciones} fila={fila} alAccion={alAccion} />
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
