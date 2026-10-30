import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtener } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { seccionesVisibles } from '../motor/MotorPagina.jsx';
import { PAGINAS } from '../paginas/index.js';
import { fechas } from '../paginas/comunes.js';
import { P } from '../permisos.js';
import { formatearCelda, moneda } from '../ui/formato.js';
import { Icono } from '../ui/index.js';

const PERM_PAGOS = [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS];
const PERM_MANTENIMIENTO = [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO];
const PERM_FACTURACION = [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION];
const PERM_ABONADOS = [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS];

const enCurso = (f) => f.estado === 'Programado' || f.estado === 'En proceso';
const fallidos = (filas) => (filas || []).filter((f) => f.estado === 'Fallido').length;

const ACCIONES = [
  { texto: 'Registrar pago', icono: 'pago', destino: 'pagos', permisos: [P.GESTIONAR_PAGOS] },
  { texto: 'Registrar lectura', icono: 'medidor', destino: 'facturacion', permisos: [P.REGISTRAR_LECTURA] },
  { texto: 'Nuevo abonado', icono: 'usuarios', destino: 'abonados', permisos: [P.GESTIONAR_ABONADOS] },
  { texto: 'Registrar incidencia', icono: 'herramienta', destino: 'mantenimiento', permisos: [P.REGISTRAR_INCIDENCIA] },
  { texto: 'Generar facturación', icono: 'factura', destino: 'facturacion', permisos: [P.GESTIONAR_FACTURACION] },
];

const INDICADORES = [
  {
    clave: 'misMantenimientos', titulo: 'Mis mantenimientos', destino: 'campo',
    permisos: [P.EJECUTAR_MANTENIMIENTO], ruta: '/mantenimientos/mios',
    valor: (d) => (d || []).filter(enCurso).length,
    detalle: () => 'programados o en proceso', icono: 'herramienta', color: 'azul',
  },
  {
    clave: 'medidores', titulo: 'Medidores sin lectura', destino: 'facturacion',
    permisos: [...PERM_ABONADOS, P.REGISTRAR_LECTURA, P.REGISTRAR_INCIDENCIA, P.CONSULTAR_FACTURAS],
    ruta: '/medidores/sin-lectura',
    valor: (d) => (d || []).length,
    detalle: () => 'en el mes actual', icono: 'medidor', color: 'ambar',
  },
  {
    clave: 'alertas', titulo: 'Alertas de consumo', destino: 'facturacion',
    permisos: PERM_FACTURACION, ruta: '/alertas/activas',
    valor: (d) => (d || []).length,
    detalle: () => 'pendientes de revisión', icono: 'grafico', color: 'ambar',
  },
  {
    clave: 'incidencias', titulo: 'Incidencias abiertas', destino: 'mantenimiento',
    permisos: PERM_MANTENIMIENTO, ruta: '/incidencias/abiertas',
    valor: (d) => (d || []).length,
    detalle: (d) => `${(d || []).filter((f) => f.prioridad === 'Alta').length} de prioridad alta`,
    icono: 'herramienta', color: 'rojo',
  },
  {
    clave: 'mantenimientos', titulo: 'Mantenimientos pendientes', destino: 'mantenimiento',
    permisos: PERM_MANTENIMIENTO, ruta: '/mantenimientos/pendientes',
    valor: (d) => (d || []).length,
    detalle: () => 'sin finalizar', icono: 'lista', color: 'ambar',
  },
  {
    clave: 'bloqueados', titulo: 'Usuarios bloqueados', destino: 'seguridad',
    permisos: [P.GESTIONAR_SEGURIDAD], ruta: '/seguridad/usuarios/bloqueados',
    valor: (d) => (d || []).length,
    detalle: () => 'por intentos fallidos', icono: 'escudo', color: 'ambar',
  },
  {
    clave: 'respaldos', titulo: 'Respaldos (7 días)', destino: 'respaldos',
    permisos: [P.RESPALDOS], ruta: '/respaldos/historial', filtros: { desde: fechas.haceDias(7) },
    valor: (d) => (d || []).filter((f) => f.estado === 'Exitoso').length,
    detalle: (d) => `${fallidos(d)} fallidos`, icono: 'respaldo', color: 'rojo',
  },
  {
    clave: 'etl', titulo: 'Cargas ETL fallidas', destino: 'dw',
    permisos: [P.ETL], ruta: '/dw/etl/fallidas',
    valor: (d) => (d || []).length,
    detalle: () => 'sin reintentar', icono: 'base', color: 'rojo',
  },
];

const ALERTAS = [
  {
    clave: 'incidencias', titulo: 'Incidencias abiertas', gravedad: 'rojo', icono: 'herramienta',
    destino: 'mantenimiento', permisos: PERM_MANTENIMIENTO,
    detalle: (d) => `${(d || []).filter((f) => f.prioridad === 'Alta').length} de prioridad alta`,
  },
  {
    clave: 'alertas', titulo: 'Alertas de consumo', gravedad: 'ambar', icono: 'grafico',
    destino: 'facturacion', permisos: PERM_FACTURACION,
    detalle: () => 'pendientes de revisión',
  },
  {
    clave: 'medidores', titulo: 'Medidores sin lectura', gravedad: 'ambar', icono: 'medidor',
    destino: 'facturacion', permisos: [...PERM_ABONADOS, P.REGISTRAR_LECTURA, P.REGISTRAR_INCIDENCIA, P.CONSULTAR_FACTURAS],
    detalle: () => 'en el mes actual',
  },
  {
    clave: 'mantenimientos', titulo: 'Mantenimientos pendientes', gravedad: 'ambar', icono: 'lista',
    destino: 'mantenimiento', permisos: PERM_MANTENIMIENTO,
    detalle: () => 'sin finalizar',
  },
  {
    clave: 'bloqueados', titulo: 'Usuarios bloqueados', gravedad: 'ambar', icono: 'escudo',
    destino: 'seguridad', permisos: [P.GESTIONAR_SEGURIDAD],
    detalle: () => 'por intentos fallidos',
  },
  {
    clave: 'respaldos', titulo: 'Respaldos fallidos', gravedad: 'rojo', icono: 'respaldo',
    destino: 'respaldos', permisos: [P.RESPALDOS], valor: fallidos,
    detalle: () => 'en los últimos 7 días',
  },
  {
    clave: 'etl', titulo: 'Cargas ETL fallidas', gravedad: 'rojo', icono: 'base',
    destino: 'dw', permisos: [P.ETL],
    detalle: () => 'sin reintentar',
  },
];

function KpiEsqueleto() {
  return (
    <div className="kpi kpi-esqueleto" aria-hidden="true">
      <div className="esqueleto esqueleto-icono" />
      <div className="kpi-cuerpo">
        <div className="esqueleto esqueleto-linea" style={{ width: '65%' }} />
        <div className="esqueleto esqueleto-valor" />
        <div className="esqueleto esqueleto-linea" style={{ width: '45%' }} />
      </div>
    </div>
  );
}

function ListaEsqueleto({ filas = 3 }) {
  return (
    <div className="lista-esqueleto" aria-hidden="true">
      {Array.from({ length: filas }).map((_, i) => <div key={i} className="esqueleto esqueleto-fila" />)}
    </div>
  );
}

function DonaCartera({ tramos, total }) {
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;

  return (
    <div className="dona-envoltura">
      <svg className="dona" viewBox="0 0 120 120" role="img" aria-label="Distribución de la cartera por antigüedad">
        <circle className="dona-fondo" cx="60" cy="60" r={radio} />
        {tramos.map((t) => {
          const parte = total > 0 ? t.monto / total : 0;
          const trazo = parte * circunferencia;
          const desplazamiento = -acumulado * circunferencia;
          acumulado += parte;
          return (
            <circle
              key={t.etiqueta}
              className={`dona-segmento ${t.color}`}
              cx="60"
              cy="60"
              r={radio}
              strokeDasharray={`${trazo} ${circunferencia - trazo}`}
              strokeDashoffset={desplazamiento}
              transform="rotate(-90 60 60)"
            />
          );
        })}
        <text className="dona-total" x="60" y="58" textAnchor="middle">{moneda(total)}</text>
        <text className="dona-sub" x="60" y="73" textAnchor="middle">cartera total</text>
      </svg>
      <ul className="dona-leyenda">
        {tramos.map((t) => (
          <li key={t.etiqueta}>
            <i className={t.color} />
            <span>{t.etiqueta}</span>
            <b>
              {moneda(t.monto)}
              <small>{total > 0 ? `${((t.monto / total) * 100).toFixed(1)} %` : '0 %'}</small>
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Inicio() {
  const { actual, puede } = useSesion();
  const u = actual.usuario;
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    const cargados = {};
    const tareas = [];

    const pedir = (clave, ruta, filtros) => {
      tareas.push(
        obtener(ruta, filtros)
          .then((r) => { cargados[clave] = Array.isArray(r.datos) ? r.datos : []; })
          .catch(() => { cargados[clave] = null; })
      );
    };

    if (puede(PERM_PAGOS)) {
      tareas.push(
        obtener('/mora/resumen')
          .then((r) => { cargados.resumen = (r.datos || [])[0] || null; })
          .catch(() => { cargados.resumen = null; })
      );
      pedir('facturas', '/facturas/pendientes');
    }

    INDICADORES.forEach((i) => {
      if (puede(i.permisos)) pedir(i.clave, i.ruta, i.filtros);
    });

    if (puede([P.CONSULTAR_BITACORA])) pedir('bitacora', '/seguridad/bitacora/reciente');

    Promise.all(tareas).then(() => {
      if (!vivo) return;
      setDatos(cargados);
      setCargando(false);
    });

    return () => { vivo = false; };
    // El dashboard se monta una vez por sesión; los permisos ya están resueltos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = (u.nombre_empleado || u.nombre_usuario).split(' ')[0];
  const fechaTexto = new Intl.DateTimeFormat('es-CR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
  const fechaCapitalizada = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

  const resumen = datos.resumen || null;
  const corte = resumen?.fecha_corte
    ? formatearCelda('fecha_corte', resumen.fecha_corte).contenido
    : null;

  const acciones = ACCIONES.filter((a) => puede(a.permisos));
  const accesos = PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0);
  const verBitacora = puede([P.CONSULTAR_BITACORA]);
  const actividad = Array.isArray(datos.bitacora) ? datos.bitacora.slice(0, 5) : [];

  const kpis = puede(PERM_PAGOS)
    ? [
      {
        titulo: 'Cartera por cobrar', destino: 'pagos', icono: 'factura', color: 'azul',
        valor: resumen ? moneda(resumen.total_por_cobrar) : '—',
        detalle: resumen ? `${resumen.facturas_pendientes} facturas pendientes` : 'No disponible',
      },
      {
        titulo: 'Recaudado del mes', destino: 'pagos', icono: 'pago', color: 'verde',
        valor: resumen ? moneda(resumen.recaudado_mes) : '—',
        detalle: resumen ? `${resumen.pagos_mes} pagos aplicados` : 'No disponible',
      },
      {
        titulo: 'Saldo vencido', destino: 'pagos', icono: 'alerta', color: 'rojo',
        valor: resumen ? moneda(resumen.total_vencido) : '—',
        detalle: resumen ? `${resumen.facturas_vencidas} facturas vencidas` : 'No disponible',
      },
      {
        titulo: 'Conexiones morosas', destino: 'pagos', icono: 'usuarios', color: 'ambar',
        valor: resumen ? resumen.conexiones_morosas : '—',
        detalle: resumen ? `${resumen.conexiones_suspendidas} suspendidas` : 'No disponible',
      },
    ]
    : INDICADORES
      .filter((i) => puede(i.permisos) && Array.isArray(datos[i.clave]))
      .slice(0, 4)
      .map((i) => ({
        titulo: i.titulo, destino: i.destino, icono: i.icono, color: i.color,
        valor: i.valor(datos[i.clave]), detalle: i.detalle(datos[i.clave]),
      }));

  const alertas = [];
  if (resumen) {
    if (resumen.facturas_vencidas > 0) {
      alertas.push({
        titulo: 'Facturas vencidas', gravedad: 'rojo', icono: 'factura', destino: 'pagos',
        cantidad: resumen.facturas_vencidas,
        detalle: `${moneda(resumen.total_vencido)} de saldo vencido`,
      });
    }
    if (resumen.conexiones_morosas > 0) {
      alertas.push({
        titulo: 'Conexiones morosas', gravedad: 'ambar', icono: 'usuarios', destino: 'pagos',
        cantidad: resumen.conexiones_morosas,
        detalle: `${resumen.conexiones_suspendidas} conexiones suspendidas`,
      });
    }
  }

  ALERTAS.forEach((def) => {
    if (!puede(def.permisos)) return;
    const filas = datos[def.clave];
    if (!Array.isArray(filas)) return;
    const cantidad = def.valor ? def.valor(filas) : filas.length;
    if (cantidad > 0) {
      alertas.push({
        titulo: def.titulo, gravedad: def.gravedad, icono: def.icono,
        destino: def.destino, cantidad, detalle: def.detalle(filas),
      });
    }
  });

  const orden = { rojo: 0, ambar: 1 };
  alertas.sort((a, b) => (orden[a.gravedad] - orden[b.gravedad]) || (b.cantidad - a.cantidad));

  const gruposCartera = [
    { etiqueta: 'Al día', color: 'verde', monto: 0, incluye: (d) => d <= 0 },
    { etiqueta: '1 a 30 días', color: 'ambar', monto: 0, incluye: (d) => d >= 1 && d <= 30 },
    { etiqueta: '31 a 60 días', color: 'naranja', monto: 0, incluye: (d) => d >= 31 && d <= 60 },
    { etiqueta: 'Más de 60 días', color: 'rojo', monto: 0, incluye: (d) => d > 60 },
  ];
  if (Array.isArray(datos.facturas)) {
    datos.facturas.forEach((f) => {
      const dias = Number(f.dias_atraso) || 0;
      const grupo = gruposCartera.find((g) => g.incluye(dias));
      if (grupo) grupo.monto += Number(f.saldo) || 0;
    });
  }
  const totalCartera = gruposCartera.reduce((t, g) => t + g.monto, 0);
  const carteraError = datos.facturas === null;
  const sinCartera = !cargando && !carteraError && totalCartera === 0;

  return (
    <>
      <header className="panel-cabecera">
        <div className="panel-bienvenida">
          <p className="panel-fecha">
            {fechaCapitalizada}
            {corte ? ` · Corte ${corte}` : ''}
          </p>
          <h2>{`${saludo}, ${nombre}`}</h2>
          <p className="panel-rol">{`${u.nombre_rol}${u.puesto ? ` · ${u.puesto}` : ''}`}</p>
        </div>
        {acciones.length ? (
          <div className="panel-acciones">
            {acciones.map((a) => (
              <Link key={a.texto} className="boton accion-rapida" to={`/${a.destino}`}>
                <Icono nombre={a.icono} /> {a.texto}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      <section className="kpis" aria-label="Indicadores principales">
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => <KpiEsqueleto key={i} />)
          : kpis.map((k) => (
            <Link key={k.titulo} className={`kpi kpi-${k.color}`} to={`/${k.destino}`}>
              <span className="kpi-icono"><Icono nombre={k.icono} /></span>
              <span className="kpi-cuerpo">
                <small>{k.titulo}</small>
                <strong>{k.valor}</strong>
                <span>{k.detalle}</span>
              </span>
            </Link>
          ))}
      </section>

      <div className="panel-grid">
        {puede(PERM_PAGOS) ? (
          <section className="tarjeta panel-col-7">
            <div className="panel-titulo">
              <div>
                <h2>Antigüedad de la cartera</h2>
                <p className="descripcion">Saldo pendiente según los días de atraso.</p>
              </div>
              <Link className="panel-enlace" to="/pagos">Ver cartera →</Link>
            </div>
            {cargando ? <ListaEsqueleto filas={4} /> : carteraError ? (
              <div className="panel-vacio error">
                <Icono nombre="alerta" />
                <span>No se pudo cargar la cartera.</span>
              </div>
            ) : sinCartera ? (
              <div className="panel-vacio">
                <Icono nombre="check" />
                <span>No hay cartera pendiente registrada.</span>
              </div>
            ) : (
              <DonaCartera tramos={gruposCartera} total={totalCartera} />
            )}
          </section>
        ) : null}

        <section className={`tarjeta ${puede(PERM_PAGOS) ? 'panel-col-5' : 'panel-col-12'}`}>
          <div className="panel-titulo">
            <div>
              <h2>Alertas y pendientes</h2>
              <p className="descripcion">Lo que requiere atención hoy.</p>
            </div>
            {!cargando && alertas.length ? <span className="contador">{alertas.length}</span> : null}
          </div>
          {cargando ? <ListaEsqueleto filas={4} /> : alertas.length ? (
            <div className="alerta-lista">
              {alertas.map((a) => (
                <Link key={a.titulo} className="alerta-item" to={`/${a.destino}`}>
                  <span className={`alerta-icono ${a.gravedad}`}><Icono nombre={a.icono} /></span>
                  <span className="alerta-texto">
                    <strong>{a.titulo}</strong>
                    <span>{a.detalle}</span>
                  </span>
                  <span className={`alerta-cantidad ${a.gravedad}`}>{a.cantidad}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel-vacio">
              <Icono nombre="check" />
              <span>Sin alertas pendientes. Todo en orden.</span>
            </div>
          )}
        </section>
      </div>

      <div className="panel-grid">
        <section className={`tarjeta ${verBitacora ? 'panel-col-7' : 'panel-col-12'}`}>
          <div className="panel-titulo">
            <div>
              <h2>Módulos</h2>
              <p className="descripcion">Acceso rápido a las áreas disponibles para su rol.</p>
            </div>
          </div>
          <div className="modulo-lista">
            {accesos.map((p) => (
              <Link key={p.id} className="modulo-item" to={`/${p.id}`}>
                <span className="modulo-icono"><Icono nombre={p.icono} /></span>
                <span className="modulo-texto">
                  <strong>{p.titulo}</strong>
                  <span>{seccionesVisibles(p, puede).map((s) => s.pestana || s.titulo).join(' · ')}</span>
                </span>
                <Icono nombre="flecha" />
              </Link>
            ))}
          </div>
        </section>

        {verBitacora ? (
          <section className="tarjeta panel-col-5">
            <div className="panel-titulo">
              <div>
                <h2>Actividad reciente</h2>
                <p className="descripcion">Últimos movimientos registrados.</p>
              </div>
              <Link className="panel-enlace" to="/seguridad">Ver bitácora →</Link>
            </div>
            {cargando ? <ListaEsqueleto filas={4} /> : actividad.length ? (
              <ul className="actividad-lista">
                {actividad.map((a) => (
                  <li key={a.id_bitacora} className="actividad-item">
                    <span className="actividad-punto" />
                    <span className="actividad-texto">
                      <strong>{a.usuario || 'Sistema'} · {a.accion}</strong>
                      <span>{a.descripcion || a.tabla_afectada || 'Sin descripción'}</span>
                    </span>
                    <span className="actividad-fecha">
                      {formatearCelda('fecha_registro', a.fecha_registro).contenido}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="panel-vacio">
                <Icono nombre="reloj" />
                <span>Sin movimientos recientes.</span>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}
