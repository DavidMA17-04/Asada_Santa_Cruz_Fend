import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtener } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { seccionesVisibles } from '../motor/MotorPagina.jsx';
import { PAGINAS } from '../paginas/index.js';
import { P } from '../permisos.js';
import { moneda, numero } from '../ui/formato.js';
import { GraficoColumnas, GraficoDonut } from '../ui/Grafico.jsx';
import { Icono } from '../ui/Icono.jsx';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const claveMes = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const moverMes = (clave, delta) => {
  const [anio, mes] = String(clave).split('-').map(Number);
  const d = new Date(anio, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const etiquetaMes = (clave) => {
  const [anio, mes] = String(clave).split('-').map(Number);
  return `${MESES_CORTOS[mes - 1]} ${anio}`;
};

const etiquetaLarga = (clave) => {
  const [anio, mes] = String(clave).split('-').map(Number);
  return `${MESES_LARGOS[mes - 1]} de ${anio}`;
};

const sumar = (filas, campo) => filas.reduce((total, fila) => total + (Number(fila[campo]) || 0), 0);

const sumarMapa = (mapa, campo, meses) => meses.reduce(
  (total, clave) => total + (Number(mapa.get(clave)?.[campo]) || 0),
  0,
);

const formatoPorcentaje = (valor) => `${Number(valor).toFixed(1).replace('.', ',')} %`;

/** Agrupa filas por mes sumando o contando campos. */
function agruparPorMes(filas, campoFecha, acumuladores) {
  const mapa = new Map();
  (filas || []).forEach((fila) => {
    const clave = claveMes(fila[campoFecha]);
    if (!clave) return;
    const actual = mapa.get(clave) || {};
    acumuladores.forEach(({ campo, fuente = campo, contar = false, filtro }) => {
      if (filtro && !filtro(fila)) return;
      actual[campo] = (actual[campo] || 0) + (contar ? 1 : (Number(fila[fuente]) || 0));
    });
    mapa.set(clave, actual);
  });
  return mapa;
}

const VISTAS_GRAFICO = [
  {
    id: 'recaudacion',
    titulo: 'Recaudación vs facturación',
    etiqueta: 'Recaudación',
    subtitulo: 'Facturado y recaudado por mes',
    series: [{ campo: 'facturado', nombre: 'Facturado' }, { campo: 'recaudado', nombre: 'Recaudado' }],
    formato: moneda,
  },
  {
    id: 'consumo',
    titulo: 'Consumo de agua',
    etiqueta: 'Consumo',
    subtitulo: 'Metros cúbicos facturados por mes',
    series: [{ campo: 'consumo', nombre: 'Consumo (m³)' }],
    formato: (n) => `${numero(n)} m³`,
  },
  {
    id: 'incidencias',
    titulo: 'Incidencias y SLA',
    etiqueta: 'Incidencias y SLA',
    subtitulo: 'Incidencias reportadas y resueltas',
    series: [{ campo: 'incidencias', nombre: 'Reportadas' }, { campo: 'resueltas', nombre: 'Resueltas' }],
    formato: numero,
  },
  {
    id: 'mantenimientos',
    titulo: 'Mantenimientos',
    etiqueta: 'Mantenimientos',
    subtitulo: 'Órdenes de trabajo registradas',
    series: [{ campo: 'mantenimientos', nombre: 'Órdenes' }],
    formato: numero,
  },
];

export function Inicio() {
  const { puede } = useSesion();

  const verPagos = puede([P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS]);
  const verFacturas = puede([P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION]);
  const verAbonados = puede([P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS]);
  const verMantenimiento = puede([P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO, P.REGISTRAR_INCIDENCIA, P.EJECUTAR_MANTENIMIENTO]);

  const [datos, setDatos] = useState({
    abonados: [], pagos: [], facturas: [], pendientes: [], mora: null,
    incidencias: [], abiertas: [], mantenimientos: [],
  });
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState(0);
  const [desplazamiento, setDesplazamiento] = useState(0);

  useEffect(() => {
    let vivo = true;
    const tareas = [];
    const pedir = (ruta, clave, habilitado) => {
      if (!habilitado) return;
      tareas.push(obtener(ruta).then((r) => [clave, r.datos || r]));
    };

    pedir('/abonados', 'abonados', verAbonados);
    pedir('/pagos', 'pagos', verPagos);
    pedir('/facturas', 'facturas', verPagos || verFacturas);
    pedir('/facturas/pendientes', 'pendientes', verPagos || verFacturas);
    pedir('/mora/resumen', 'mora', verPagos);
    pedir('/incidencias', 'incidencias', verMantenimiento);
    pedir('/incidencias/abiertas', 'abiertas', verMantenimiento);
    pedir('/mantenimientos', 'mantenimientos', verMantenimiento);

    Promise.allSettled(tareas).then((resultados) => {
      if (!vivo) return;
      const nuevo = {
        abonados: [], pagos: [], facturas: [], pendientes: [], mora: null,
        incidencias: [], abiertas: [], mantenimientos: [],
      };
      resultados.forEach((r) => {
        if (r.status !== 'fulfilled') return;
        const [clave, valor] = r.value;
        nuevo[clave] = valor;
      });
      setDatos(nuevo);
      setCargando(false);
    });

    return () => { vivo = false; };
  }, [verPagos, verFacturas, verAbonados, verMantenimiento]);

  const facturas = datos.facturas || [];
  const pagos = datos.pagos || [];
  const incidencias = datos.incidencias || [];
  const mantenimientos = datos.mantenimientos || [];
  const abonados = datos.abonados || [];
  const pendientes = datos.pendientes || [];
  const abiertas = datos.abiertas || [];
  const mora = (datos.mora || [])[0] || {};

  const facturasValidas = useMemo(() => facturas.filter((f) => String(f.estado) !== 'Anulada'), [facturas]);
  const pagosValidos = useMemo(() => pagos.filter((p) => String(p.estado) !== 'Anulado'), [pagos]);

  const facturadoPorMes = useMemo(
    () => agruparPorMes(facturasValidas, 'fecha_emision', [{ campo: 'facturado', fuente: 'monto_total' }, { campo: 'consumo', fuente: 'consumo' }]),
    [facturasValidas],
  );
  const recaudadoPorMes = useMemo(
    () => agruparPorMes(pagosValidos, 'fecha_pago', [{ campo: 'recaudado', fuente: 'monto' }]),
    [pagosValidos],
  );
  const incidenciasPorMes = useMemo(
    () => agruparPorMes(incidencias, 'fecha_incidente', [
      { campo: 'incidencias', contar: true },
      { campo: 'resueltas', contar: true, filtro: (f) => String(f.estado) === 'Resuelta' },
    ]),
    [incidencias],
  );
  const mantenimientosPorMes = useMemo(
    () => agruparPorMes(mantenimientos, 'fecha_inicio', [{ campo: 'mantenimientos', contar: true }]),
    [mantenimientos],
  );

  const mesesConDatos = useMemo(() => {
    const claves = new Set();
    const agregar = (filas, campo) => filas.forEach((f) => {
      const clave = claveMes(f[campo]);
      if (clave) claves.add(clave);
    });
    agregar(facturasValidas, 'fecha_emision');
    agregar(pagosValidos, 'fecha_pago');
    agregar(incidencias, 'fecha_incidente');
    agregar(mantenimientos, 'fecha_inicio');
    return [...claves].sort();
  }, [facturasValidas, pagosValidos, incidencias, mantenimientos]);

  // El periodo financiero manda: así la ventana siempre tiene facturación y pagos.
  const mesesFinancieros = useMemo(() => {
    const claves = new Set();
    facturasValidas.forEach((f) => {
      const clave = claveMes(f.fecha_emision);
      if (clave) claves.add(clave);
    });
    pagosValidos.forEach((p) => {
      const clave = claveMes(p.fecha_pago);
      if (clave) claves.add(clave);
    });
    return [...claves].sort();
  }, [facturasValidas, pagosValidos]);

  const mesesIncidencias = useMemo(
    () => [...new Set(incidencias.map((i) => claveMes(i.fecha_incidente)).filter(Boolean))].sort(),
    [incidencias],
  );
  const mesesMantenimientos = useMemo(
    () => [...new Set(mantenimientos.map((m) => claveMes(m.fecha_inicio)).filter(Boolean))].sort(),
    [mantenimientos],
  );

  const mesActual = claveMes(new Date());
  const vista = VISTAS_GRAFICO[vistaActiva] || VISTAS_GRAFICO[0];

  // Cada pestaña usa los 6 meses más recientes de su propia fuente de datos.
  const mesesFuente = vista.id === 'incidencias'
    ? mesesIncidencias
    : vista.id === 'mantenimientos'
      ? mesesMantenimientos
      : (mesesFinancieros.length ? mesesFinancieros : mesesConDatos);

  const mesFinVista = mesesFuente[mesesFuente.length - 1] || mesActual;
  const maxDesplazamiento = Math.max(0, mesesFuente.length - 6);
  const desplazamientoSeguro = Math.min(desplazamiento, maxDesplazamiento);

  const meses = useMemo(() => {
    const fin = moverMes(mesFinVista, -desplazamientoSeguro);
    return Array.from({ length: 6 }, (_, i) => moverMes(fin, i - 5));
  }, [mesFinVista, desplazamientoSeguro]);

  const filasGrafico = useMemo(() => meses.map((clave) => ({
    nombre: etiquetaMes(clave).split(' ')[0],
    etiquetaLarga: etiquetaLarga(clave),
    facturado: Number(facturadoPorMes.get(clave)?.facturado) || 0,
    recaudado: Number(recaudadoPorMes.get(clave)?.recaudado) || 0,
    consumo: Number(facturadoPorMes.get(clave)?.consumo) || 0,
    incidencias: Number(incidenciasPorMes.get(clave)?.incidencias) || 0,
    resueltas: Number(incidenciasPorMes.get(clave)?.resueltas) || 0,
    mantenimientos: Number(mantenimientosPorMes.get(clave)?.mantenimientos) || 0,
  })), [meses, facturadoPorMes, recaudadoPorMes, incidenciasPorMes, mantenimientosPorMes]);

  const rangoTexto = `${etiquetaMes(meses[0])} – ${etiquetaMes(meses[meses.length - 1])}`;

  // Los KPI financieros usan siempre la ventana de facturación/pagos.
  const mesesFinancierosVentana = useMemo(() => {
    const fin = mesesFinancieros[mesesFinancieros.length - 1] || mesActual;
    return Array.from({ length: 6 }, (_, i) => moverMes(fin, i - 5));
  }, [mesesFinancieros, mesActual]);

  const rangoFinanciero = `${etiquetaMes(mesesFinancierosVentana[0])} – ${etiquetaMes(mesesFinancierosVentana[mesesFinancierosVentana.length - 1])}`;

  const recaudadoPeriodo = sumarMapa(recaudadoPorMes, 'recaudado', mesesFinancierosVentana);
  const pagosPeriodo = pagosValidos.filter((p) => mesesFinancierosVentana.includes(claveMes(p.fecha_pago))).length;
  const ultimoMesFinanciero = mesesFinancierosVentana[mesesFinancierosVentana.length - 1];
  const recaudadoUltimo = Number(recaudadoPorMes.get(ultimoMesFinanciero)?.recaudado) || 0;
  const recaudadoPenultimo = Number(recaudadoPorMes.get(moverMes(ultimoMesFinanciero, -1))?.recaudado) || 0;
  const tendencia = recaudadoPenultimo > 0
    ? Math.round(((recaudadoUltimo - recaudadoPenultimo) / recaudadoPenultimo) * 100)
    : null;

  const totalPorCobrar = sumar(pendientes, 'saldo');
  const totalAbonados = abonados.length;
  const abonadosActivos = abonados.filter((f) => f.estado === 'Activo' || f.activo !== false).length;
  const abonadosInactivos = Math.max(0, totalAbonados - abonadosActivos);
  const altas = abiertas.filter((f) => String(f.prioridad) === 'Alta').length;
  const totalVencido = Number(mora.total_vencido) || totalPorCobrar;
  const totalCartera = Number(mora.total_por_cobrar) || totalPorCobrar;
  const proporcionVencida = totalCartera > 0 ? (totalVencido / totalCartera) * 100 : 0;
  const morosos = Number(mora.conexiones_morosas) || 0;
  const mantenimientosPendientes = mantenimientos.filter((f) => f.estado === 'Programado' || f.estado === 'En proceso').length;

  const kpis = [];
  if (verPagos) {
    kpis.push({
      id: 'ingresos',
      titulo: 'Ingresos',
      valor: moneda(recaudadoPeriodo),
      detalle: `${pagosPeriodo} pagos en el periodo · ${rangoFinanciero}`,
      tono: 'marino',
      icono: 'pago',
      variante: 'destacado',
      tendencia,
      destino: '/pagos?sec=2',
    });
  }
  if (verPagos || verFacturas) {
    kpis.push({
      id: 'por-cobrar',
      titulo: 'Facturas por cobrar',
      valor: moneda(totalPorCobrar),
      detalle: `${pendientes.length} facturas pendientes`,
      tono: 'cielo',
      icono: 'factura',
      variante: 'borde',
      destino: '/pagos?sec=1',
    });
  }
  if (verPagos) {
    kpis.push({
      id: 'morosidad',
      titulo: 'Morosidad',
      valor: formatoPorcentaje(proporcionVencida),
      detalle: 'De la cartera sigue sin pagar',
      tono: 'ambar',
      icono: 'reloj',
      destino: '/pagos?sec=3',
    });
  }
  if (verAbonados) {
    kpis.push({
      id: 'abonados',
      titulo: 'Abonados',
      valor: numero(totalAbonados),
      detalle: `${abonadosActivos} activos · ${abonadosInactivos} inactivos`,
      tono: 'verde',
      icono: 'usuarios',
      destino: '/abonados',
    });
  }
  if (verMantenimiento) {
    kpis.push({
      id: 'alertas',
      titulo: 'Alertas e incidencias',
      valor: numero(abiertas.length),
      detalle: `${altas} de prioridad alta`,
      tono: 'rojo',
      icono: 'alerta',
      variante: 'alerta',
      enlace: 'Ver detalle',
      destino: '/mantenimiento?sec=1',
    });
  }

  const atencion = [];
  if (altas > 0) {
    atencion.push({
      nivel: 'alta',
      texto: `${altas} incidencia${altas === 1 ? '' : 's'} de prioridad alta abierta${altas === 1 ? '' : 's'}`,
      accion: 'Atender',
      destino: '/mantenimiento?sec=1',
    });
  }
  if (pendientes.length > 0) {
    atencion.push({
      nivel: 'media',
      texto: `${pendientes.length} facturas pendientes de cobro`,
      accion: 'Revisar',
      destino: '/pagos?sec=1',
    });
  }
  if (morosos > 0) {
    atencion.push({
      nivel: 'media',
      texto: `${morosos} conexiones en morosidad`,
      accion: 'Revisar',
      destino: '/pagos?sec=3',
    });
  }
  if (mantenimientosPendientes > 0) {
    atencion.push({
      nivel: 'baja',
      texto: `${mantenimientosPendientes} órdenes de mantenimiento pendientes`,
      accion: 'Ver',
      destino: '/mantenimiento?sec=2',
    });
  }

  const accesos = PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0);

  const estadoDonut = {
    titulo: 'Estado de abonados',
    enlace: '/abonados',
    totalEtiqueta: 'Abonados totales',
    segmentos: [
      { etiqueta: 'Activos', valor: abonadosActivos, color: '#144272' },
      { etiqueta: 'Inactivos', valor: abonadosInactivos, color: '#cce5f0' },
    ],
  };

  return (
    <div className="dashboard-minimal">
      <section className="dashboard-kpis">
        {kpis.map((k) => (
          <Link
            key={k.id}
            className={`dash-kpi${k.variante ? ` dash-kpi-${k.variante}` : ''}`}
            to={k.destino}
          >
            <div className="dash-kpi-top">
              <span className="dash-kpi-titulo">{k.titulo}</span>
              <span className={`dash-kpi-icono tono-${k.tono}`}>
                <Icono nombre={k.icono} />
              </span>
            </div>
            <strong className="dash-kpi-valor">{cargando ? '—' : k.valor}</strong>
            {k.tendencia != null ? (
              <span className={`dash-kpi-tendencia ${k.tendencia >= 0 ? 'positiva' : 'negativa'}`}>
                {`${k.tendencia >= 0 ? '▲' : '▼'} ${Math.abs(k.tendencia)}% vs mes anterior`}
              </span>
            ) : null}
            <small className="dash-kpi-detalle">{k.detalle}</small>
            {k.enlace ? <span className="dash-kpi-enlace">{`${k.enlace} →`}</span> : null}
          </Link>
        ))}
      </section>

      <div className="dashboard-fila">
        <section className="dash-card dash-principal">
          <div className="dash-card-cabecera">
            <div>
              <h2>{vista.titulo}</h2>
              <p className="dash-subtitulo">{`${vista.subtitulo} · ${rangoTexto}`}</p>
            </div>
            <div className="dash-periodo">
              <button
                type="button"
                aria-label="Periodo anterior"
                disabled={desplazamientoSeguro >= maxDesplazamiento}
                onClick={() => setDesplazamiento(Math.min(desplazamientoSeguro + 1, maxDesplazamiento))}
              >
                ‹
              </button>
              <span>{rangoTexto}</span>
              <button
                type="button"
                aria-label="Periodo siguiente"
                disabled={desplazamientoSeguro <= 0}
                onClick={() => setDesplazamiento(Math.max(desplazamientoSeguro - 1, 0))}
              >
                ›
              </button>
            </div>
          </div>

          <div className="pastillas-filtro">
            {VISTAS_GRAFICO.map((v, idx) => (
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

          {cargando ? (
            <div className="lienzo-grafico-vacio">
              <div className="caja-punteada"><span>Cargando métricas…</span></div>
            </div>
          ) : (
            <GraficoColumnas
              filas={filasGrafico}
              etiqueta="nombre"
              series={vista.series}
              formato={vista.formato}
              mensajeVacio="No hay datos para este periodo."
              pie={null}
            />
          )}
        </section>

        <div className="dashboard-lateral">
          <section className="dash-card dash-atencion">
            <div className="dash-card-cabecera dash-cabecera-compacta">
              <h2>Requiere atención</h2>
              <Link className="enlace-sutil" to="/mantenimiento?sec=1">Ver todo</Link>
            </div>

            <div className="atencion-lista">
              {atencion.length ? atencion.slice(0, 3).map((a) => (
                <div className={`atencion-item nivel-${a.nivel}`} key={a.texto}>
                  <span className="atencion-nivel">{a.nivel === 'alta' ? 'Alta' : a.nivel === 'media' ? 'Media' : 'Baja'}</span>
                  <span className="atencion-texto">{a.texto}</span>
                  <Link className="atencion-accion" to={a.destino}>{a.accion}</Link>
                </div>
              )) : (
                <div className="atencion-vacia">
                  <Icono nombre="check" />
                  <span>Sin pendientes críticos.</span>
                </div>
              )}
            </div>
          </section>

          <section className="dash-card">
            <div className="dash-card-cabecera dash-cabecera-compacta">
              <h2>{estadoDonut.titulo}</h2>
              <Link className="enlace-sutil" to={estadoDonut.enlace}>Ver todos</Link>
            </div>
            <GraficoDonut
              segmentos={estadoDonut.segmentos}
              totalEtiqueta={estadoDonut.totalEtiqueta}
            />
          </section>
        </div>
      </div>

      <section className="dash-card">
        <div className="dash-card-cabecera dash-cabecera-compacta">
          <h2>Acceso rápido</h2>
          <span className="etiqueta-sutil">{`${accesos.length} módulos`}</span>
        </div>
        <div className="acceso-rapido-fila">
          {accesos.map((p) => (
            <Link key={p.id} className="acceso-rapido-item" to={`/${p.id}`}>
              <Icono nombre={p.icono} />
              <span>{p.titulo}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
