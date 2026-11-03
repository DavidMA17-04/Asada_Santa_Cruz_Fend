import { BadgeStatus } from '../components/ui/BadgeStatus.jsx';
import { Icono } from './Icono.jsx';

const FECHA_HORA = new Intl.DateTimeFormat('es-CR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function formatearFechaHora(texto) {
  if (!texto) return '—';
  const f = new Date(texto);
  if (Number.isNaN(f.getTime())) return texto;
  return FECHA_HORA.format(f);
}

function tonoPorEstado(estado) {
  const e = String(estado || '').toLowerCase();
  if (/finalizad|resuelt|cumplid/i.test(e)) return 'emerald';
  if (/proceso|curso/i.test(e)) return 'sky';
  if (/cancelad|vencid|critico/i.test(e)) return 'rose';
  if (/programad|abiert|pendiente/i.test(e)) return 'amber';
  return 'slate';
}

export function TimelineHistorial({ eventos = [], r }) {
  const datosBrutos = r
    ? (r.datos || (r.conjuntos && r.conjuntos[0]) || (Array.isArray(r) ? r : [r]))
    : eventos;

  const lista = Array.isArray(datosBrutos) ? datosBrutos : (datosBrutos ? [datosBrutos] : []);

  if (!lista.length) {
    return (
      <div className="py-8 text-center text-[var(--texto-suave)]">
        <Icono nombre="herramienta" tamano={24} className="mx-auto mb-2 opacity-60" />
        <p className="text-sm font-medium text-[var(--texto)]">Sin eventos registrados</p>
        <p className="text-xs text-[var(--texto-suave)] mt-0.5">Esta orden de fontanería aún no presenta transiciones de estado.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-1">
      {/* Cabecera sutil con contexto ASADA */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--borde)]">
        <div className="flex items-center gap-2">
          <Icono nombre="herramienta" tamano={15} className="text-[var(--acento)]" />
          <span className="text-xs font-semibold text-[var(--texto)]">
            Bitácora técnica de fontanería
          </span>
        </div>
        <span className="text-[11px] font-medium text-[var(--texto-suave)] bg-[var(--superficie-2)] px-2.5 py-0.5 rounded-full border border-[var(--borde)]">
          {lista.length} {lista.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Línea de tiempo cronológica */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--borde)]">
        {lista.map((ev, idx) => {
          const idEvento = ev.id_historial_mantenimiento || ev.id_historial_incidencia || ev.id_historial || idx + 1;
          const estadoActual = ev.estado_actual || ev.estado || '—';
          const estadoAnterior = ev.estado_anterior;
          const empleado = ev.empleado || ev.nombre_empleado || ev.responsable || 'Administración ASADA';
          const nota = ev.anotacion || ev.observacion || ev.motivo || ev.detalle;
          const fecha = ev.fecha_evento || ev.fecha;
          const tono = tonoPorEstado(estadoActual);

          return (
            <div key={idEvento} className="relative">
              {/* Nodo indicador en la línea */}
              <div
                className={`absolute -left-[23px] top-2.5 w-3 h-3 rounded-full ring-4 ring-[var(--superficie)] ${
                  tono === 'emerald'
                    ? 'bg-emerald-500'
                    : tono === 'sky'
                    ? 'bg-sky-500'
                    : tono === 'rose'
                    ? 'bg-rose-500'
                    : tono === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />

              {/* Tarjeta del evento de bitácora */}
              <div className="rounded-xl border border-[var(--borde)] bg-[var(--superficie)] p-3.5 space-y-2 shadow-2xs hover:border-[var(--borde-fuerte)] transition-all">
                {/* Fila superior: Transición de estados y fecha/hora */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 flex-wrap">
                    {estadoAnterior ? (
                      <BadgeStatus valor={estadoAnterior} />
                    ) : (
                      <span className="text-[11px] font-medium text-[var(--texto-suave)] bg-[var(--superficie-2)] px-2 py-0.5 rounded-full border border-[var(--borde)]">
                        Creación inicial
                      </span>
                    )}
                    <span className="text-xs text-[var(--texto-suave)] font-bold">→</span>
                    <BadgeStatus valor={estadoActual} />
                  </div>

                  <span className="text-xs text-[var(--texto-suave)] font-medium">
                    {formatearFechaHora(fecha)}
                  </span>
                </div>

                {/* Fila intermedia: Fontanero / Técnico a cargo */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--texto-suave)]">
                  <Icono nombre="usuarios" tamano={13} />
                  <span>Fontanero / Técnico:</span>
                  <span className="font-semibold text-[var(--texto)]">{empleado}</span>
                </div>

                {/* Fila inferior: Bitácora de campo */}
                {nota ? (
                  <div className="pt-2 mt-1 border-t border-[var(--borde)]/60 text-xs">
                    <span className="text-[11px] font-semibold text-[var(--texto-suave)] uppercase tracking-wider block mb-0.5">
                      Bitácora de campo:
                    </span>
                    <p className="text-[var(--texto)] whitespace-pre-line leading-relaxed font-normal bg-[var(--superficie-2)]/50 p-2.5 rounded-lg border border-[var(--borde)]/40">
                      {nota}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelineHistorial;
