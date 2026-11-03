import { useEffect, useState } from 'react';
import { Input } from './Input.jsx';
import { Button } from './Button.jsx';
import { Icono } from '../../ui/Icono.jsx';

export function UnifiedFilterBar({
  terminoBusqueda = '',
  alCambiarBusqueda,
  totalRegistros = 0,
  alExportarCsv,
  alLimpiar,
  filtrosExtras = null,
  placeholderBusqueda = 'Buscar por nombre, correo…',
  tituloSeccion = 'Filtros de consulta',
  mostrarCabecera = true,
  cargando = false,
  className = '',
}) {
  // Manejo de debounce para la búsqueda de texto sin mutar estado abruptamente
  const [textoLocal, setTextoLocal] = useState(terminoBusqueda);

  useEffect(() => {
    setTextoLocal(terminoBusqueda);
  }, [terminoBusqueda]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (textoLocal !== terminoBusqueda) {
        alCambiarBusqueda?.(textoLocal);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [textoLocal, terminoBusqueda, alCambiarBusqueda]);

  return (
    <div
      className={`rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-4 shadow-xs mb-5 space-y-3.5 ${className}`}
    >
      {/* Cabecera de filtros (Opcional según diseño) */}
      {mostrarCabecera ? (
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--borde)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--acento)]">
            <Icono nombre="filtro" tamano={13} />
            <span>{tituloSeccion}</span>
          </div>

          <div className="flex items-center gap-2">
            {alLimpiar ? (
              <button
                type="button"
                onClick={alLimpiar}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[var(--texto-suave)] hover:text-slate-900 dark:hover:text-white border border-[var(--borde)] bg-transparent hover:bg-[var(--superficie-2)] transition-colors cursor-pointer"
                title="Restablecer filtros"
              >
                <Icono nombre="limpiar" tamano={13} />
                <span>Limpiar</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Controles de filtro principales */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Input de búsqueda textual con debounce y pill rounded */}
        <div className="flex-1 min-w-[260px] max-w-xl">
          <Input
            type="search"
            variant="pill"
            icono="buscar"
            clearable
            placeholder={placeholderBusqueda}
            value={textoLocal}
            onChange={(val) => setTextoLocal(val)}
            onClear={() => {
              setTextoLocal('');
              alCambiarBusqueda?.('');
            }}
          />
        </div>

        {/* Filtros específicos del módulo (Selects adicionales) */}
        {filtrosExtras ? (
          <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-start lg:justify-end">
            {filtrosExtras}
          </div>
        ) : null}

        {/* Indicador numérico de registros y botón de exportar si no hay cabecera */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
          <span className="cuenta-filtro-badge">
            <strong>{totalRegistros}</strong> {totalRegistros === 1 ? 'registro' : 'registros'}
          </span>

          {alExportarCsv ? (
            <Button
              variant="export"
              onClick={alExportarCsv}
              disabled={cargando || totalRegistros === 0}
              title="Descargar datos en formato CSV"
            >
              Exportar CSV
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default UnifiedFilterBar;

