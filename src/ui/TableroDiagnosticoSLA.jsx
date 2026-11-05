import { useState } from 'react';
import { Tabla } from './Tabla.jsx';
import { MetricCard } from '../components/ui/MetricCard.jsx';
import { Icono } from './Icono.jsx';

export function TableroDiagnosticoSLA({ r = {}, def = {}, recargar }) {
  const conjuntos = r.conjuntos || [];
  const nombresConjuntos = def.conjuntos || [
    '1. Cumplimiento de SLA por prioridad',
    '2. Carga activa por empleado',
    '3. Resumen operativo por conexión',
  ];

  const [pestanaActiva, setPestanaActiva] = useState(0);

  const datosSla = conjuntos[0] || [];
  const datosEmpleados = (conjuntos[1] || []).filter((row) => {
    const p = String(row.puesto || '').toLowerCase();
    const nom = String(row.fontanero || row.empleado || row.nombre || row.nombre_empleado || '').toLowerCase();
    return !/junta|admin|dba/i.test(p) && !/junta|admin|dba/i.test(nom);
  });
  const datosConexiones = conjuntos[2] || [];

  // Calcular métricas clave consolidadas
  const totalIncidencias = datosSla.reduce(
    (acc, row) => acc + (Number(row.total_incidencias || row.cantidad || row.total) || 0),
    0
  );

  const totalEnTiempo = datosSla.reduce(
    (acc, row) => acc + (Number(row.en_tiempo || row.cumplidas || row.resueltas_en_tiempo) || 0),
    0
  );

  const porcentajeSlaGlobal =
    totalIncidencias > 0 ? Math.round((totalEnTiempo / totalIncidencias) * 100) : 100;

  const totalCargaActiva = datosEmpleados.reduce(
    (acc, row) => acc + (Number(row.carga_activa || row.pendientes || row.en_curso) || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Tarjetas KPI de Diagnóstico Operativo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          titulo="Índice Global SLA"
          valor={`${porcentajeSlaGlobal}%`}
          detalle={`${totalEnTiempo} de ${totalIncidencias} atendidas en tiempo`}
          tono={porcentajeSlaGlobal >= 85 ? 'verde' : porcentajeSlaGlobal >= 70 ? 'ambar' : 'rojo'}
          icono="estadistica"
        />

        <MetricCard
          titulo="Total Incidencias"
          valor={totalIncidencias}
          detalle="Analizadas en el periodo"
          tono="marino"
          icono="alerta"
        />

        <MetricCard
          titulo="Carga de Fontanería"
          valor={totalCargaActiva}
          detalle={`${datosEmpleados.length} técnicos en campo`}
          tono="cielo"
          icono="herramienta"
        />
      </div>

      {/* Pestañas de Navegación entre Conjuntos de Datos */}
      <div className="flex border-b border-[var(--borde)] gap-2">
        {nombresConjuntos.map((nombre, idx) => {
          const activa = pestanaActiva === idx;
          const cantidad = idx === 1 ? datosEmpleados.length : (conjuntos[idx] || []).length;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setPestanaActiva(idx)}
              className={`py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 -mb-[2px]
                ${activa
                  ? 'border-sky-400 text-sky-500 bg-sky-500/5'
                  : 'border-transparent text-[var(--texto-suave)] hover:text-[var(--texto)] hover:bg-[var(--superficie-2)]'}`}
            >
              <span>{nombre}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--borde)] font-normal">
                {cantidad}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div className="pt-2">
        {(pestanaActiva === 1 ? datosEmpleados : conjuntos[pestanaActiva])?.length ? (
          <Tabla
            filas={pestanaActiva === 1 ? datosEmpleados : conjuntos[pestanaActiva]}
            nombreArchivo={`sla-${pestanaActiva + 1}`}
          />
        ) : (
          <div className="py-12 text-center text-[var(--texto-suave)] rounded-xl border border-[var(--borde)] bg-[var(--superficie)]">
            <Icono nombre="info" />
            <p className="mt-2 text-sm font-medium">No hay registros disponibles para este indicador en el rango de fechas seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TableroDiagnosticoSLA;

