import { useEffect, useState } from 'react';
import { obtener } from '../api.js';
import { BadgeStatus } from '../components/ui/BadgeStatus.jsx';
import { BadgeSLA } from '../components/ui/BadgeSLA.jsx';
import { Icono } from './Icono.jsx';

export function FichaSeguimientoIncidencia({ incidencia = {}, onAccion, cerrar }) {
  const [historial, setHistorial] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const id = incidencia.id_incidencia;

  useEffect(() => {
    let activo = true;
    async function cargarDetalles() {
      setCargando(true);
      setError(null);
      try {
        const [resHistorial, resMantenimientos] = await Promise.all([
          obtener(`/incidencias/${id}/historial`).catch(() => ({ datos: [] })),
          obtener('/mantenimientos', { id_incidencia: id }).catch(() => ({ datos: [] })),
        ]);
        if (activo) {
          setHistorial(resHistorial?.datos || []);
          setMantenimientos(resMantenimientos?.datos || []);
        }
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    if (id) {
      cargarDetalles();
    }
    return () => {
      activo = false;
    };
  }, [id]);

  const tieneOrden = mantenimientos.length > 0;
  const esAbierta = incidencia.estado !== 'Resuelta';

  return (
    <div className="space-y-6 text-sm text-[var(--texto)]">
      {/* 1. Encabezado de la Ficha con SLA y Prioridad */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--superficie-2)] border border-[var(--borde)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primario-suave)] border border-[var(--acento)]/30 flex items-center justify-center text-[var(--acento)] shrink-0">
            <Icono nombre="alerta" tamano={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[var(--texto)]">Incidencia #{incidencia.id_incidencia}</span>
              <span className="text-[var(--texto-suave)] font-medium">• {incidencia.tipo || 'Incidente general'}</span>
            </div>
            <div className="text-xs text-[var(--texto-suave)] mt-0.5">
              Reportada el {incidencia.fecha_incidente || '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BadgeStatus valor={incidencia.estado} />
          <BadgeStatus valor={incidencia.prioridad} />
          <BadgeSLA
            estadoSla={incidencia.estado_sla}
            horasResolucion={incidencia.horas_resolucion}
            slaHoras={incidencia.sla_horas}
            estadoIncidencia={incidencia.estado}
          />
        </div>
      </div>

      {/* 2. Detalles del Sitio y Descripción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--texto-suave)] flex items-center gap-1.5">
            <Icono nombre="base" tamano={13} />
            <span>Ubicación y Conexión</span>
          </div>
          <div className="text-[var(--texto)]">
            <strong>Ubicación:</strong> {incidencia.ubicacion || '—'}
          </div>
          <div className="text-xs text-[var(--texto-suave)] flex items-center gap-4">
            <span><strong>Medidor:</strong> {incidencia.medidor || '—'}</span>
            <span><strong>Conexión Nº:</strong> {incidencia.id_conexion || '—'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--texto-suave)] flex items-center gap-1.5">
            <Icono nombre="info" tamano={13} />
            <span>Descripción del Problema</span>
          </div>
          <p className="text-[var(--texto)] text-xs leading-relaxed italic m-0">
            "{incidencia.descripcion || 'Sin descripción detallada'}"
          </p>
        </div>
      </div>

      {/* 3. Orden de Mantenimiento Vinculada */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-[var(--texto)] text-xs tracking-wider uppercase flex items-center gap-2">
            <Icono nombre="herramienta" tamano={14} className="text-[var(--acento)]" />
            <span>Atención en Campo (Mantenimiento)</span>
          </h4>
        </div>

        {cargando ? (
          <div className="p-4 text-center text-xs text-[var(--texto-suave)] animate-pulse">
            Verificando órdenes de trabajo…
          </div>
        ) : tieneOrden ? (
          <div className="space-y-2">
            {mantenimientos.map((m) => (
              <div
                key={m.id_mantenimiento}
                className="p-3.5 rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--texto)]">Orden #{m.id_mantenimiento}</span>
                    <span className="text-xs text-[var(--texto-suave)]">• {m.tipo_trabajo || 'Mantenimiento'}</span>
                  </div>
                  <div className="text-xs text-[var(--texto-suave)]">
                    Asignado a: <strong className="text-[var(--texto)]">{m.responsable || 'Técnico sin asignar'}</strong>
                    {m.fecha_inicio ? ` • Programado: ${m.fecha_inicio}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BadgeStatus valor={m.estado} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs">
              <Icono nombre="alerta" tamano={16} className="text-amber-500 shrink-0" />
              <span>Esta incidencia aún no tiene técnico ni orden de trabajo asignada.</span>
            </div>

            {esAbierta && onAccion ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
                  onClick={() => {
                    cerrar?.();
                    onAccion('auto-asignar', incidencia);
                  }}
                >
                  ⚡ Auto-asignar fontanero
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--borde)] bg-[var(--superficie)] hover:bg-[var(--superficie-2)] text-[var(--texto)] transition-colors cursor-pointer"
                  onClick={() => {
                    cerrar?.();
                    onAccion('asignar', incidencia);
                  }}
                >
                  Asignar manual
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 4. Línea de Tiempo (Timeline de Eventos) */}
      <div className="space-y-3">
        <h4 className="font-semibold text-[var(--texto)] text-xs tracking-wider uppercase flex items-center gap-2">
          <Icono nombre="reloj" tamano={14} className="text-[var(--acento)]" />
          <span>Línea de Tiempo del Caso</span>
        </h4>

        {cargando ? (
          <div className="p-4 text-center text-xs text-[var(--texto-suave)] animate-pulse">
            Cargando historial de eventos…
          </div>
        ) : historial.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--borde)]">
            {historial.map((ev, idx) => (
              <div key={ev.id_historial_incidencia || idx} className="relative group">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-sky-500 bg-[var(--superficie)] group-hover:scale-125 transition-transform" />
                <div className="p-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--borde)] space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[var(--texto)]">
                      {ev.estado_actual ? `Cambio a: ${ev.estado_actual}` : 'Registro de evento'}
                    </span>
                    <span className="text-[var(--texto-suave)]">
                      {ev.fecha_evento || '—'}
                    </span>
                  </div>
                  {ev.empleado ? (
                    <div className="text-[11px] text-[var(--acento)]">
                      Por: {ev.empleado}
                    </div>
                  ) : null}
                  {ev.observacion ? (
                    <p className="text-xs text-[var(--texto)] italic m-0 pt-1">
                      "{ev.observacion}"
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[var(--texto-suave)] rounded-xl bg-[var(--superficie-2)] border border-[var(--borde)]">
            No hay cambios registrados en la bitácora aún.
          </div>
        )}
      </div>

      {/* Pie con botón de cerrar */}
      <div className="pt-3 border-t border-[var(--borde)] flex justify-end">
        <button
          type="button"
          onClick={cerrar}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--superficie-2)] border border-[var(--borde)] hover:bg-[var(--borde)] text-[var(--texto)] transition-colors cursor-pointer"
        >
          Cerrar ficha
        </button>
      </div>
    </div>
  );
}

export default FichaSeguimientoIncidencia;
