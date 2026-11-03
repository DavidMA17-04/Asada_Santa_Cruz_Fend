import { useState } from 'react';
import { BadgeStatus } from '../components/ui/BadgeStatus.jsx';
import { Tabla } from './Tabla.jsx';
import { Icono } from './Icono.jsx';

export function TarjetasMisMantenimientos({ filas = [], alAccion, recargar, opciones = {} }) {
  const [modoVista, setModoVista] = useState('tarjetas'); // 'tarjetas' | 'tabla'

  if (!filas.length) {
    return (
      <div className="py-12 text-center rounded-2xl border border-dashed border-[var(--borde)] bg-[var(--superficie-2)]">
        <div className="w-12 h-12 rounded-full bg-[var(--superficie)] border border-[var(--borde)] flex items-center justify-center mx-auto text-[var(--texto-suave)] mb-3">
          <Icono nombre="herramienta" tamano={22} />
        </div>
        <p className="text-sm font-semibold text-[var(--texto)]">No tienes mantenimientos pendientes</p>
        <p className="text-xs text-[var(--texto-suave)] mt-1">Cuando se te asigne un trabajo en campo, aparecerá en esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de Modo de Vista */}
      <div className="flex items-center justify-between pb-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--texto-suave)] flex items-center gap-2">
          <Icono nombre="herramienta" tamano={13} className="text-[var(--acento)]" />
          <span>Trabajos asignados ({filas.length})</span>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-[var(--superficie-2)] border border-[var(--borde)]">
          <button
            type="button"
            onClick={() => setModoVista('tarjetas')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              modoVista === 'tarjetas'
                ? 'bg-[var(--primario)] text-white shadow-xs'
                : 'text-[var(--texto-suave)] hover:text-[var(--texto)]'
            }`}
          >
            <Icono nombre="panel" tamano={13} />
            <span>Tarjetas de campo</span>
          </button>
          <button
            type="button"
            onClick={() => setModoVista('tabla')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              modoVista === 'tabla'
                ? 'bg-[var(--primario)] text-white shadow-xs'
                : 'text-[var(--texto-suave)] hover:text-[var(--texto)]'
            }`}
          >
            <Icono nombre="lista" tamano={13} />
            <span>Lista tabular</span>
          </button>
        </div>
      </div>

      {modoVista === 'tarjetas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filas.map((f) => {
            const esProgramado = /programad/i.test(String(f.estado || ''));
            const esEnProceso = /proceso/i.test(String(f.estado || ''));
            const esFinalizado = /finalizad/i.test(String(f.estado || ''));

            return (
              <div
                key={f.id_mantenimiento}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  esEnProceso
                    ? 'border-[var(--acento)] bg-[var(--primario-suave)] shadow-sm'
                    : esProgramado
                    ? 'border-amber-500/40 bg-amber-500/5 shadow-xs'
                    : 'border-[var(--borde)] bg-[var(--superficie)] shadow-xs'
                }`}
              >
                {/* Cabecera de la tarjeta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--texto)] text-base">
                      #{f.id_mantenimiento}
                    </span>
                    <BadgeStatus valor={f.estado} />
                  </div>

                  <h4 className="font-semibold text-[var(--texto)] text-sm leading-tight">
                    {f.tipo_trabajo || 'Mantenimiento en red'}
                  </h4>

                  {f.id_incidencia ? (
                    <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Icono nombre="alerta" tamano={11} />
                      <span>Por Incidencia #{f.id_incidencia}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      <Icono nombre="calendario" tamano={11} />
                      <span>Mantenimiento preventivo</span>
                    </div>
                  )}

                  {/* Ubicación y fecha */}
                  <div className="pt-1.5 space-y-1 text-xs text-[var(--texto-suave)]">
                    <div className="flex items-start gap-1.5">
                      <Icono nombre="base" tamano={13} className="text-[var(--texto-suave)] shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[var(--texto)]">{f.ubicacion || 'Conexión sin dirección especificada'}</span>
                    </div>
                    {f.fecha_inicio ? (
                      <div className="flex items-center gap-1.5 text-[var(--texto-suave)] text-[11px]">
                        <Icono nombre="reloj" tamano={12} className="shrink-0" />
                        <span>Programado: {f.fecha_inicio}</span>
                      </div>
                    ) : null}
                  </div>

                  {f.descripcion ? (
                    <p className="text-xs text-[var(--texto)] italic bg-[var(--superficie-2)] p-2.5 rounded-xl border border-[var(--borde)] m-0 line-clamp-3">
                      "{f.descripcion}"
                    </p>
                  ) : null}
                </div>

                {/* Acciones principales de la tarjeta */}
                <div className="pt-2 border-t border-[var(--borde)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => alAccion?.({ texto: 'Historial', metodo: 'GET', ruta: (row) => `/mantenimientos/${row.id_mantenimiento}/historial` }, f)}
                    className="p-2 rounded-xl text-[var(--texto-suave)] hover:text-[var(--texto)] hover:bg-[var(--superficie-2)] transition-colors cursor-pointer"
                    title="Ver historial del trabajo"
                  >
                    <Icono nombre="reloj" tamano={15} />
                  </button>

                  <div className="flex items-center gap-2">
                    {esProgramado ? (
                      <button
                        type="button"
                        onClick={() => alAccion?.({
                          texto: 'Iniciar trabajo',
                          metodo: 'PATCH',
                          ruta: (row) => `/mantenimientos/${row.id_mantenimiento}/estado`,
                          cuerpo: () => ({ nuevo_estado: 'En proceso', anotacion: 'Trabajo iniciado en campo' }),
                          confirmar: (row) => `¿Deseas marcar la orden #${row.id_mantenimiento} como iniciada (En proceso)?`,
                          exito: () => 'Mantenimiento marcado como en proceso.',
                        }, f)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Icono nombre="flecha" tamano={13} />
                        <span>Iniciar trabajo</span>
                      </button>
                    ) : null}

                    {esEnProceso ? (
                      <button
                        type="button"
                        onClick={() => alAccion?.({
                          texto: 'Cerrar orden',
                          metodo: 'POST',
                          ruta: (row) => `/mantenimientos/${row.id_mantenimiento}/cerrar`,
                          campos: (row) => [
                            { nombre: 'detalle', etiqueta: 'Trabajo realizado en campo', tipo: 'textarea', requerido: true, max: 500, marcador: 'Describa la reparación, piezas cambiadas o prueba realizada…' },
                            { nombre: 'fecha_fin', etiqueta: 'Fecha de finalización', tipo: 'date', valor: () => new Date().toISOString().slice(0, 10) },
                            ...(row.id_incidencia
                              ? [{ nombre: 'cerrar_incidencia', etiqueta: `Dar por resuelta la incidencia #${row.id_incidencia}`, tipo: 'checkbox', valor: true }]
                              : []),
                          ],
                          exito: () => 'Mantenimiento finalizado con éxito.',
                        }, f)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Icono nombre="check" tamano={13} />
                        <span>Finalizar orden</span>
                      </button>
                    ) : null}

                    {esFinalizado ? (
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-1 rounded-lg bg-emerald-500/10">
                        ✓ Completado
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Tabla filas={filas} {...opciones} />
      )}
    </div>
  );
}

export default TarjetasMisMantenimientos;
