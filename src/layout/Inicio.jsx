import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtener } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { seccionesVisibles } from '../motor/MotorPagina.jsx';
import { PAGINAS } from '../paginas/index.js';
import { fechas } from '../paginas/comunes.js';
import { P } from '../permisos.js';
import { moneda, numero } from '../ui/formato.js';
import { GraficoColumnas, GraficoDonut } from '../ui/Grafico.jsx';
import { Icono } from '../ui/Icono.jsx';

const suma = (filas, campo) => filas.reduce((t, f) => t + (Number(f[campo]) || 0), 0);
const enCurso = (f) => f.estado === 'Programado' || f.estado === 'En proceso';

const TARJETAS_KPI = [
  {
    id: 'abonados-total',
    titulo: 'Total de abonados',
    destino: 'abonados',
    icono: 'usuarios',
    tono: 'marino',
    permisos: [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS],
    cargar: () => obtener('/abonados'),
    valor: (d) => numero(d.length),
    detalle: () => 'Registrados en el sistema',
  },
  {
    id: 'abonados-activos',
    titulo: 'Abonados activos',
    destino: 'abonados',
    icono: 'usuarios',
    tono: 'verde',
    permisos: [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS],
    cargar: () => obtener('/abonados'),
    valor: (d) => numero(d.filter((f) => f.estado === 'Activo' || f.activo !== false).length),
    detalle: () => 'Con estado activo',
  },
  {
    id: 'recaudacion-mes',
    titulo: 'Ingresos del mes',
    destino: 'pagos',
    icono: 'pago',
    tono: 'oceano',
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/pagos/por-metodo', { desde: fechas.inicioMes(), hasta: fechas.hoy() }),
    valor: (d) => moneda(suma(d, 'total_recaudado')),
    detalle: (d) => `${numero(suma(d, 'cantidad_pagos'))} pagos registrados`,
  },
  {
    id: 'por-cobrar',
    titulo: 'Facturas por cobrar',
    destino: 'pagos',
    icono: 'factura',
    tono: 'cielo',
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS, P.CONSULTAR_FACTURAS],
    cargar: () => obtener('/facturas/pendientes'),
    valor: (d) => moneda(suma(d, 'saldo')),
    detalle: (d) => `${numero(d.length)} facturas pendientes`,
  },
  {
    id: 'alertas-incidencias',
    titulo: 'Alertas e incidencias',
    destino: 'mantenimiento?sec=1',
    icono: 'alerta',
    tono: 'ambar',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO, P.REGISTRAR_INCIDENCIA],
    cargar: () => obtener('/incidencias/abiertas'),
    valor: (d) => numero(d.length),
    detalle: (d) => `${d.filter((f) => f.prioridad === 'Alta').length} de prioridad alta`,
  },
  {
    id: 'mis-mantenimientos',
    titulo: 'Mis mantenimientos',
    destino: 'mantenimiento?sec=0',
    icono: 'herramienta',
    tono: 'marino',
    permisos: [P.EJECUTAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/mios'),
    valor: (d) => numero(d.filter(enCurso).length),
    detalle: () => 'Órdenes asignadas en curso',
  },
  {
    id: 'mantenimientos-pendientes',
    titulo: 'Órdenes pendientes',
    destino: 'mantenimiento?sec=3',
    icono: 'herramienta',
    tono: 'verde',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/pendientes'),
    valor: (d) => numero(d.length),
    detalle: () => 'Mantenimientos por finalizar',
  },
  {
    id: 'medidores-sin-lectura',
    titulo: 'Sin lectura este mes',
    destino: 'facturacion?sec=0',
    icono: 'medidor',
    tono: 'cielo',
    permisos: [P.REGISTRAR_LECTURA, P.CONSULTAR_FACTURAS],
    cargar: () => obtener('/medidores/sin-lectura'),
    valor: (d) => numero(d.length),
    detalle: () => 'Medidores pendientes de ruta',
  },
  {
    id: 'respaldos-recientes',
    titulo: 'Respaldos exitosos',
    destino: 'respaldos',
    icono: 'respaldo',
    tono: 'verde',
    permisos: [P.RESPALDOS],
    cargar: () => obtener('/respaldos/historial', { desde: fechas.haceDias(7) }),
    valor: (d) => numero(d.filter((f) => f.estado === 'Exitoso').length),
    detalle: () => 'En los últimos 7 días',
  },
  {
    id: 'etl-fallidas',
    titulo: 'Alertas de ETL',
    destino: 'dw',
    icono: 'alerta',
    tono: 'ambar',
    permisos: [P.ETL],
    cargar: () => obtener('/dw/etl/fallidas'),
    valor: (d) => numero(d.length),
    detalle: () => 'Cargas pendientes de reintento',
  },
];

const VISTAS_GRAFICO = [
  {
    id: 'general',
    etiqueta: 'General (Consumo)',
    subtitulo: 'Facturación y consumo mensual registrado en el acueducto.',
    permisos: [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION],
    cargar: () => obtener('/facturas/resumen-mensual'),
    etiquetaFila: (f) => `${f.mes}/${f.anio}`,
    campo: 'total_facturado',
    formato: moneda,
    pie: 'Mes de facturación',
    vacio: 'No hay facturación registrada para este periodo.',
  },
  {
    id: 'recaudacion',
    etiqueta: 'Recaudación',
    subtitulo: 'Ingresos recaudados según método de pago.',
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/pagos/por-metodo', { desde: fechas.haceDias(90), hasta: fechas.hoy() }),
    etiquetaFila: 'metodo_pago',
    campo: 'total_recaudado',
    formato: moneda,
    pie: 'Método de pago',
    vacio: 'No hay pagos registrados para este periodo.',
  },
  {
    id: 'incidencias',
    etiqueta: 'Incidencias y SLA',
    subtitulo: 'Incidencias operativas agrupadas por prioridad de atención.',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO, P.REGISTRAR_INCIDENCIA],
    cargar: async () => {
      const r = await obtener('/incidencias');
      const filas = r.datos || [];
      const mapa = new Map([['Alta', 0], ['Media', 0], ['Baja', 0]]);
      filas.forEach((f) => {
        const p = f.prioridad || 'Media';
        mapa.set(p, (mapa.get(p) || 0) + 1);
      });
      return { datos: [...mapa.entries()].map(([prioridad, cantidad]) => ({ prioridad, cantidad })) };
    },
    etiquetaFila: 'prioridad',
    campo: 'cantidad',
    formato: numero,
    pie: 'Nivel de prioridad',
    vacio: 'No hay incidencias registradas para este periodo.',
  },
  {
    id: 'mantenimientos',
    etiqueta: 'Mantenimientos',
    subtitulo: 'Órdenes de trabajo según estado operativo.',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO, P.EJECUTAR_MANTENIMIENTO],
    cargar: async () => {
      const r = await obtener('/mantenimientos/mios').catch(() => obtener('/mantenimientos/pendientes'));
      const filas = r.datos || [];
      const mapa = new Map();
      filas.forEach((f) => {
        const e = f.estado || 'Programado';
        mapa.set(e, (mapa.get(e) || 0) + 1);
      });
      return { datos: [...mapa.entries()].map(([estado, cantidad]) => ({ estado, cantidad })) };
    },
    etiquetaFila: 'estado',
    campo: 'cantidad',
    formato: numero,
    pie: 'Estado de la orden',
    vacio: 'No hay órdenes de mantenimiento registradas para este periodo.',
  },
];

function TarjetaKpi({ def }) {
  const [valor, setValor] = useState('0');
  const [detalle, setDetalle] = useState('Cargando…');

  useEffect(() => {
    let vivo = true;
    def.cargar()
      .then((r) => {
        if (!vivo) return;
        const datos = r.datos || [];
        setValor(def.valor(datos));
        setDetalle(def.detalle(datos));
      })
      .catch(() => {
        if (!vivo) return;
        setValor('0');
        setDetalle('Sin registros');
      });
    return () => { vivo = false; };
  }, [def]);

  return (
    <Link className="kpi-card" to={`/${def.destino}`}>
      <div className="kpi-top">
        <span className="kpi-titulo">{def.titulo}</span>
        <span className={`kpi-icono tono-${def.tono || 'marino'}`}>
          <Icono nombre={def.icono || 'grafico'} />
        </span>
      </div>
      <strong className="kpi-valor">{valor}</strong>
      <small className="kpi-sub">{detalle}</small>
    </Link>
  );
}

export function Inicio() {
  const { puede } = useSesion();
  const kpis = TARJETAS_KPI.filter((k) => puede(k.permisos)).slice(0, 5);
  const vistas = VISTAS_GRAFICO.filter((v) => puede(v.permisos));
  const accesos = PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0);

  const [vistaActiva, setVistaActiva] = useState(0);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [cargandoGrafico, setCargandoGrafico] = useState(false);

  const [estadoDonut, setEstadoDonut] = useState({
    titulo: 'Estado de abonados',
    enlace: '/abonados',
    totalEtiqueta: 'Abonados totales',
    segmentos: [
      { etiqueta: 'Activos', valor: 0, color: '#144272' },
      { etiqueta: 'Inactivos', valor: 0, color: '#cce5f0' },
    ],
  });

  const vista = vistas[Math.min(vistaActiva, Math.max(vistas.length - 1, 0))] || VISTAS_GRAFICO[0];

  useEffect(() => {
    let vivo = true;
    if (!vista) return undefined;
    setCargandoGrafico(true);
    vista.cargar()
      .then((r) => {
        if (!vivo) return;
        setDatosGrafico(r.datos || []);
      })
      .catch(() => {
        if (!vivo) return;
        setDatosGrafico([]);
      })
      .finally(() => {
        if (vivo) setCargandoGrafico(false);
      });
    return () => { vivo = false; };
  }, [vista]);

  useEffect(() => {
    let vivo = true;
    if (puede([P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS])) {
      obtener('/abonados')
        .then((r) => {
          if (!vivo) return;
          const filas = r.datos || [];
          const activos = filas.filter((f) => f.estado === 'Activo' || f.activo !== false).length;
          const inactivos = Math.max(0, filas.length - activos);
          setEstadoDonut({
            titulo: 'Estado de abonados',
            enlace: '/abonados',
            totalEtiqueta: 'Abonados totales',
            segmentos: [
              { etiqueta: 'Activos', valor: activos, color: '#144272' },
              { etiqueta: 'Inactivos', valor: inactivos, color: '#cce5f0' },
            ],
          });
        })
        .catch(() => {});
    } else if (puede([P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO, P.EJECUTAR_MANTENIMIENTO])) {
      obtener('/mantenimientos/mios')
        .catch(() => obtener('/mantenimientos/pendientes'))
        .then((r) => {
          if (!vivo) return;
          const filas = r.datos || [];
          const finalizados = filas.filter((f) => f.estado === 'Finalizado').length;
          const pendientes = Math.max(0, filas.length - finalizados);
          setEstadoDonut({
            titulo: 'Estado de órdenes',
            enlace: '/mantenimiento',
            totalEtiqueta: 'Órdenes totales',
            segmentos: [
              { etiqueta: 'En curso', valor: pendientes, color: '#1b76a6' },
              { etiqueta: 'Finalizadas', valor: finalizados, color: '#2e7d47' },
            ],
          });
        })
        .catch(() => {});
    }
    return () => { vivo = false; };
  }, [puede]);

  const periodoActual = new Intl.DateTimeFormat('es-CR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="dashboard-minimal">
      {kpis.length ? (
        <section className="kpi-fila">
          {kpis.map((def) => <TarjetaKpi key={def.id} def={def} />)}
        </section>
      ) : null}

      <div className="bento-grid">
        <section className="bento-card bento-principal">
          <div className="bento-cabecera">
            <div>
              <div className="bento-titulo-linea">
                <Icono nombre="grafico" />
                <h2>Actividad operativa y financiera</h2>
              </div>
              <p className="bento-subtitulo">{vista?.subtitulo}</p>
            </div>
            <div className="periodo-pill">
              <span>{periodoActual}</span>
              <Icono nombre="calendario" />
            </div>
          </div>

          {vistas.length > 1 ? (
            <div className="pastillas-filtro">
              {vistas.map((v, idx) => (
                <button
                  key={v.id}
                  type="button"
                  className={idx === vistaActiva ? 'activa' : ''}
                  onClick={() => setVistaActiva(idx)}
                >
                  {v.etiqueta}
                </button>
              ))}
            </div>
          ) : null}

          {cargandoGrafico ? (
            <div className="lienzo-grafico-vacio">
              <div className="caja-punteada">
                <span>Cargando métricas del periodo…</span>
              </div>
            </div>
          ) : (
            <GraficoColumnas
              filas={datosGrafico}
              etiqueta={vista.etiquetaFila}
              campo={vista.campo}
              formato={vista.formato}
              mensajeVacio={vista.vacio}
              pie={vista.pie}
            />
          )}
        </section>

        <div className="bento-lateral">
          <section className="bento-card">
            <div className="bento-cabecera-compacta">
              <div className="bento-titulo-linea">
                <Icono nombre="usuarios" />
                <h2>{estadoDonut.titulo}</h2>
              </div>
              <Link className="enlace-sutil" to={estadoDonut.enlace}>Ver todos</Link>
            </div>
            <GraficoDonut
              segmentos={estadoDonut.segmentos}
              totalEtiqueta={estadoDonut.totalEtiqueta}
            />
          </section>

          <section className="bento-card">
            <div className="bento-cabecera-compacta">
              <h2>Acceso rápido</h2>
              <span className="etiqueta-sutil">{`${accesos.length} módulos`}</span>
            </div>
            <div className="acceso-rapido-grid">
              {accesos.map((p) => (
                <Link key={p.id} className="boton-acceso-rapido" to={`/${p.id}`}>
                  <Icono nombre={p.icono} />
                  <span>{p.titulo}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
