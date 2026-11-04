import { useState } from 'react';
import { PestanasSeccion } from './PestanasSeccion.jsx';
import { Tabla } from './Tabla.jsx';
import { MetricCard } from '../components/ui/MetricCard.jsx';
import { moneda, numero } from './formato.js';

const COLUMNAS = {
  1: [
    { campo: 'id_factura', etiqueta: 'Factura' },
    { campo: 'fecha_emision', etiqueta: 'Emisión' },
    { campo: 'fecha_vencimiento', etiqueta: 'Vence' },
    { campo: 'monto_total', etiqueta: 'Total' },
    { campo: 'recargos', etiqueta: 'Recargos' },
    { campo: 'pagado', etiqueta: 'Pagado' },
    { campo: 'saldo', etiqueta: 'Saldo' },
    { campo: 'estado', etiqueta: 'Estado' },
  ],
  2: [
    { campo: 'id_pago', etiqueta: 'Pago' },
    { campo: 'fecha_pago', etiqueta: 'Fecha' },
    { campo: 'monto', etiqueta: 'Monto' },
    { campo: 'nombre_metodo', etiqueta: 'Método' },
    { campo: 'estado', etiqueta: 'Estado' },
  ],
  3: [
    { campo: 'id_recargo', etiqueta: 'Recargo' },
    { campo: 'id_factura', etiqueta: 'Factura' },
    { campo: 'fecha_calculo', etiqueta: 'Calculado' },
    { campo: 'porcentaje_aplicado', etiqueta: '%' },
    { campo: 'monto_recargo', etiqueta: 'Monto' },
    { campo: 'estado', etiqueta: 'Estado' },
  ],
};

const fecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'short' }).format(d);
};

function iniciales(nombre = '') {
  return String(nombre).split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

/** Estado de cuenta de un abonado: cabecera, cifras clave y tablas por conjunto. */
export function EstadoCuenta({ r, def }) {
  const [activa, setActiva] = useState(0);
  const conjuntos = r?.conjuntos || [];
  const titulos = def?.conjuntos || ['Resumen', 'Facturas', 'Pagos', 'Recargos'];
  const resumen = conjuntos[0]?.[0] || {};
  const filas = conjuntos[activa] || [];

  const vistas = titulos.map((titulo, i) => ({
    pestana: `${titulo}${i > 0 && conjuntos[i]?.length ? ` (${conjuntos[i].length})` : ''}`,
  }));

  return (
    <div className="estado-cuenta">
      <div className="estado-cuenta-cabecera">
        <div className="estado-cuenta-identidad">
          <span className="avatar avatar-grande">{iniciales(resumen.nombre_completo)}</span>
          <div>
            <h3>{resumen.nombre_completo || 'Abonado'}</h3>
            <p>
              {resumen.identificacion || '—'}
              {resumen.tipo_abonado ? ` · ${resumen.tipo_abonado}` : ''}
              {resumen.direccion ? ` · ${resumen.direccion}` : ''}
            </p>
            {resumen.telefono ? <small>Tel. {resumen.telefono}</small> : null}
          </div>
        </div>
        <span className="estado-cuenta-corte">
          {`Corte: ${fecha(resumen.fecha_corte)}`}
        </span>
      </div>

      <div className="estado-cuenta-kpis">
        <MetricCard
          titulo="Saldo pendiente"
          valor={moneda(resumen.saldo_pendiente || 0)}
          detalle={`${numero(resumen.facturas_pendientes || 0)} facturas pendientes`}
          tono="ambar"
          icono="factura"
        />
        <MetricCard
          titulo="Saldo vencido"
          valor={moneda(resumen.saldo_vencido || 0)}
          detalle={`${numero(resumen.facturas_vencidas || 0)} facturas vencidas`}
          tono="rojo"
          icono="alerta"
        />
        <MetricCard
          titulo="Total pagado"
          valor={moneda(resumen.total_pagado || 0)}
          detalle="Pagos aplicados"
          tono="verde"
          icono="pago"
        />
        <MetricCard
          titulo="Días de atraso"
          valor={numero(resumen.dias_atraso_maximo || 0)}
          detalle={`${numero(resumen.conexiones || 0)} ${Number(resumen.conexiones) === 1 ? 'conexión' : 'conexiones'}`}
          tono="marino"
          icono="reloj"
        />
      </div>

      <PestanasSeccion vistas={vistas} activa={activa} alCambiar={setActiva} />

      {activa === 0 ? (
        <div className="estado-cuenta-detalle">
          <div><span>Conexiones</span><strong>{numero(resumen.conexiones || 0)}</strong></div>
          <div><span>Conexiones activas</span><strong>{numero(resumen.conexiones_activas || 0)}</strong></div>
          <div><span>Total facturado</span><strong>{moneda(resumen.total_facturado || 0)}</strong></div>
          <div><span>Total recargos</span><strong>{moneda(resumen.total_recargos || 0)}</strong></div>
          <div><span>Facturas pendientes</span><strong>{numero(resumen.facturas_pendientes || 0)}</strong></div>
          <div><span>Facturas vencidas</span><strong>{numero(resumen.facturas_vencidas || 0)}</strong></div>
        </div>
      ) : (
        <Tabla
          filas={filas}
          columnas={COLUMNAS[activa]}
          mensajeVacio="No hay registros en esta sección para el abonado."
          nombreArchivo={`estado-cuenta-${activa}`}
        />
      )}
    </div>
  );
}

export default EstadoCuenta;
