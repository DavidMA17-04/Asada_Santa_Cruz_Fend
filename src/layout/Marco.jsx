import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, obtener } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { seccionesVisibles } from '../motor/MotorPagina.jsx';
import { fechas } from '../paginas/comunes.js';
import { INICIO, PAGINAS } from '../paginas/index.js';
import { P } from '../permisos.js';
import { abrirModal, avisar, Formulario, Icono, moneda, suscribirNotificaciones } from '../ui/index.js';

const suma = (filas, campo) => filas.reduce((t, f) => t + (Number(f[campo]) || 0), 0);

const FUENTES_ALERTAS = [
  {
    id: 'abonados-conexiones',
    modulo: 'Abonados y conexiones',
    icono: 'usuarios',
    destino: '/abonados?sec=1',
    permisos: [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS],
    cargar: () => obtener('/conexiones/no-activas'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} conexiones no activas`,
      detalle: 'Suspendidas, cortadas o pendientes de revisión',
      nivel: 'aviso',
      cantidad: filas.length,
    } : null),
  },
  {
    id: 'facturacion-sin-lectura',
    modulo: 'Lecturas y facturación',
    icono: 'medidor',
    destino: '/facturacion?sec=0',
    permisos: [P.REGISTRAR_LECTURA, P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION],
    cargar: () => obtener('/medidores/sin-lectura'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} medidores sin lectura`,
      detalle: 'Pendientes de registrar en la ruta del mes actual',
      nivel: 'info',
      cantidad: filas.length,
    } : null),
  },
  {
    id: 'facturacion-alertas',
    modulo: 'Lecturas y facturación',
    icono: 'alerta',
    destino: '/facturacion?sec=6',
    permisos: [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION],
    cargar: () => obtener('/alertas/activas'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} alertas de consumo anómalo`,
      detalle: 'Lecturas que superan los umbrales configurados',
      nivel: 'peligro',
      cantidad: filas.length,
    } : null),
  },
  {
    id: 'pagos-pendientes',
    modulo: 'Pagos y morosidad',
    icono: 'factura',
    destino: '/pagos?sec=0',
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/facturas/pendientes'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} facturas por cobrar`,
      detalle: `Saldo total pendiente: ${moneda(suma(filas, 'saldo'))}`,
      nivel: 'info',
      cantidad: filas.length,
    } : null),
  },
  {
    id: 'pagos-morosos',
    modulo: 'Pagos y morosidad',
    icono: 'pago',
    destino: '/pagos?sec=2',
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/mora/morosos'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} abonados en morosidad`,
      detalle: `Monto vencido acumulado: ${moneda(suma(filas, 'saldo_vencido'))}`,
      nivel: 'peligro',
      cantidad: filas.length,
    } : null),
  },
  {
    id: 'mantenimiento-incidencias',
    modulo: 'Mantenimiento e incidencias',
    icono: 'alerta',
    destino: '/mantenimiento?sec=1',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
    cargar: () => obtener('/incidencias/abiertas'),
    construir: (filas) => {
      if (!filas.length) return null;
      const altas = filas.filter((f) => f.prioridad === 'Alta').length;
      const vencidas = filas.filter((f) => f.estado_sla === 'Vencida').length;
      return {
        titulo: `${filas.length} incidencias operativas abiertas`,
        detalle: `${altas} de prioridad alta${vencidas ? ` · ${vencidas} con SLA vencido` : ''}`,
        nivel: altas > 0 || vencidas > 0 ? 'peligro' : 'aviso',
        cantidad: filas.length,
      };
    },
  },
  {
    id: 'mantenimiento-ordenes',
    modulo: 'Mantenimiento e incidencias',
    icono: 'herramienta',
    destino: '/mantenimiento?sec=3',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/pendientes'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} órdenes de mantenimiento activas`,
      detalle: 'Programadas o en proceso de ejecución',
      nivel: 'info',
      cantidad: filas.length,
    } : null),
  },
  {
    id: 'mantenimiento-mios',
    modulo: 'Mis mantenimientos',
    icono: 'herramienta',
    destino: '/mantenimiento?sec=0',
    permisos: [P.EJECUTAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/mios'),
    construir: (filas) => {
      const activas = filas.filter((f) => f.estado === 'Programado' || f.estado === 'En proceso');
      return activas.length > 0 ? {
        titulo: `${activas.length} órdenes asignadas a usted`,
        detalle: 'Trabajos pendientes de finalizar',
        nivel: 'aviso',
        cantidad: activas.length,
      } : null;
    },
  },
  {
    id: 'seguridad-bloqueados',
    modulo: 'Seguridad',
    icono: 'escudo',
    destino: '/seguridad?sec=0',
    permisos: [P.GESTIONAR_SEGURIDAD],
    cargar: () => obtener('/seguridad/usuarios/bloqueados'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} usuarios bloqueados`,
      detalle: 'Cuentas bloqueadas por intentos fallidos de acceso',
      nivel: 'peligro',
      cantidad: filas.length,
    } : null),
  },
  {
    id: 'respaldos-estado',
    modulo: 'Respaldos',
    icono: 'respaldo',
    destino: '/respaldos?sec=1',
    permisos: [P.RESPALDOS],
    cargar: () => obtener('/respaldos/historial', { desde: fechas.haceDias(7) }),
    construir: (filas) => {
      const fallidos = filas.filter((f) => f.estado === 'Fallido').length;
      const sinVerificar = filas.filter((f) => f.estado === 'Exitoso' && !f.verificado).length;
      if (fallidos > 0) {
        return {
          titulo: `${fallidos} respaldos fallidos (7 días)`,
          detalle: 'Revise el historial de ejecución de respaldos',
          nivel: 'peligro',
          cantidad: fallidos,
        };
      }
      if (sinVerificar > 0) {
        return {
          titulo: `${sinVerificar} respaldos sin verificar`,
          detalle: 'Pendientes de validación RESTORE VERIFYONLY',
          nivel: 'aviso',
          cantidad: sinVerificar,
        };
      }
      return null;
    },
  },
  {
    id: 'dw-etl-fallidas',
    modulo: 'Reportes y Data Warehouse',
    icono: 'grafico',
    destino: '/dw?sec=4',
    permisos: [P.ETL],
    cargar: () => obtener('/dw/etl/fallidas'),
    construir: (filas) => (filas.length > 0 ? {
      titulo: `${filas.length} cargas ETL fallidas`,
      detalle: 'Procesos pendientes de reintentar hacia ASADA_DW',
      nivel: 'peligro',
      cantidad: filas.length,
    } : null),
  },
];

function cambiarContrasena() {
  const modal = abrirModal('Cambiar mi contraseña', (
    <Formulario
      campos={[
        { nombre: 'actual', etiqueta: 'Contraseña actual', tipo: 'password', requerido: true, ancho: true },
        { nombre: 'nueva', etiqueta: 'Contraseña nueva', tipo: 'password', requerido: true, ancho: true },
        { nombre: 'confirmacion', etiqueta: 'Repita la contraseña nueva', tipo: 'password', requerido: true, ancho: true },
      ]}
      textoEnviar="Cambiar contraseña"
      alCancelar={() => modal.cerrar()}
      alEnviar={async ({ actual, nueva, confirmacion }) => {
        if (nueva !== confirmacion) throw new Error('Las contraseñas nuevas no coinciden.');
        await api('PUT', '/auth/contrasena', { actual, nueva });
        modal.cerrar();
        avisar('Contraseña actualizada.');
      }}
    />
  ), { tamano: 'chico' });
}

export function Marco() {
  const { actual, borrar, puede } = useSesion();
  const u = actual.usuario;
  const iniciales = (u.nombre_empleado || u.nombre_usuario).split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const modulos = PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0);
  const disponibles = [INICIO, ...modulos];
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [colapsado, setColapsado] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [menuNotificaciones, setMenuNotificaciones] = useState(false);
  const [filtroNotif, setFiltroNotif] = useState('todas');
  const [temaOscuro, setTemaOscuro] = useState(() => localStorage.getItem('asada_tema') === 'oscuro');

  const [alertasSistema, setAlertasSistema] = useState([]);
  const [eventosSesion, setEventosSesion] = useState([]);
  const [vistasIds, setVistasIds] = useState(() => new Set());
  const [cargandoNotif, setCargandoNotif] = useState(false);

  const id = location.pathname.replace(/^\//, '') || 'inicio';
  const actualPagina = disponibles.find((p) => p.id === id) || INICIO;
  const secActual = Number(searchParams.get('sec')) || 0;

  const [expandidos, setExpandidos] = useState(() => ({ [id]: true }));

  useEffect(() => {
    if (id && id !== 'inicio') {
      setExpandidos((prev) => ({ ...prev, [id]: true }));
    }
  }, [id]);

  useEffect(() => {
    document.title = `${actualPagina.titulo} · ASADA Santa Cruz`;
    setMenuAbierto(false);
  }, [actualPagina.titulo, location.pathname, searchParams]);

  useEffect(() => {
    document.documentElement.dataset.tema = temaOscuro ? 'oscuro' : 'claro';
    localStorage.setItem('asada_tema', temaOscuro ? 'oscuro' : 'claro');
  }, [temaOscuro]);

  useEffect(() => {
    const cerrar = () => {
      setMenuUsuario(false);
      setMenuNotificaciones(false);
    };
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, []);

  const cargarNotificaciones = useCallback(async () => {
    const activas = FUENTES_ALERTAS.filter((f) => puede(f.permisos));
    if (!activas.length) {
      setAlertasSistema([]);
      return;
    }
    setCargandoNotif(true);
    try {
      const resultados = await Promise.all(
        activas.map(async (f) => {
          try {
            const r = await f.cargar();
            const item = f.construir(r.datos || []);
            if (!item) return null;
            return {
              id: f.id,
              modulo: f.modulo,
              icono: f.icono,
              destino: f.destino,
              ...item,
            };
          } catch {
            return null;
          }
        }),
      );
      setAlertasSistema(resultados.filter(Boolean));
    } finally {
      setCargandoNotif(false);
    }
  }, [puede]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones, location.pathname]);

  useEffect(() => {
    return suscribirNotificaciones((ev) => {
      const paginaActual = disponibles.find((p) => p.id === (window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'inicio')) || INICIO;
      setEventosSesion((prev) => [
        {
          id: ev.id,
          modulo: paginaActual.titulo,
          icono: paginaActual.icono || 'campana',
          destino: window.location.hash.replace(/^#/, '') || '/inicio',
          titulo: ev.mensaje,
          detalle: new Intl.DateTimeFormat('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(ev.fecha),
          nivel: ev.tipo === 'error' ? 'peligro' : 'exito',
          esEvento: true,
        },
        ...prev.slice(0, 19),
      ]);
      cargarNotificaciones();
    });
  }, [cargarNotificaciones, disponibles]);

  function alternarModulo(moduloId) {
    if (colapsado) setColapsado(false);
    setExpandidos((prev) => ({ ...prev, [moduloId]: !prev[moduloId] }));
  }

  function marcarTodasLeidas() {
    const nuevas = new Set(vistasIds);
    alertasSistema.forEach((a) => nuevas.add(a.id));
    eventosSesion.forEach((e) => nuevas.add(e.id));
    setVistasIds(nuevas);
  }

  async function cerrarSesion() {
    try { await api('POST', '/auth/logout'); } catch { /* el token se descarta igual */ }
    borrar();
    navigate('/', { replace: true });
  }

  const subActual = actualPagina.secciones
    ? seccionesVisibles(actualPagina, puede)[secActual]
    : null;

  const todasNotificaciones = [
    ...eventosSesion,
    ...alertasSistema,
  ];

  const noLeidas = todasNotificaciones.filter((n) => !vistasIds.has(n.id)).length;

  const notificacionesFiltradas = todasNotificaciones.filter((n) => {
    if (filtroNotif === 'alertas') return !n.esEvento;
    if (filtroNotif === 'actividad') return Boolean(n.esEvento);
    return true;
  });

  return (
    <div className={`marco${menuAbierto ? ' menu-abierto' : ''}${colapsado ? ' lateral-colapsado' : ''}`}>
      <aside className="lateral">
        <Link to="/inicio" className="lateral-marca">
          <img src="/logo-asada.png" alt="Logo ASADA Santa Cruz" className="lateral-logo-img" />
          <div className="lateral-texto-marca">
            <strong>ASADA Santa Cruz</strong>
            <small>Gestión de Acueducto</small>
          </div>
        </Link>

        <div className="lateral-etiqueta">Menú principal</div>
        <nav className="nav">
          <NavLink
            to="/inicio"
            title={INICIO.titulo}
            className={({ isActive }) => `nav-enlace${isActive ? ' activo' : ''}`}
          >
            <Icono nombre={INICIO.icono} />
            <span>{INICIO.titulo}</span>
          </NavLink>

          {modulos.map((p) => {
            const subsecciones = seccionesVisibles(p, puede);
            const activoModulo = id === p.id;
            const abierto = Boolean(expandidos[p.id]);

            if (subsecciones.length <= 1) {
              return (
                <NavLink
                  key={p.id}
                  to={`/${p.id}`}
                  title={p.titulo}
                  className={({ isActive }) => `nav-enlace${isActive ? ' activo' : ''}`}
                >
                  <Icono nombre={p.icono} />
                  <span>{p.titulo}</span>
                </NavLink>
              );
            }

            return (
              <div key={p.id} className={`nav-grupo${activoModulo ? ' grupo-activo' : ''}${abierto ? ' abierto' : ''}`}>
                <div className={`nav-cabecera-grupo${activoModulo ? ' activo' : ''}`}>
                  <Link
                    to={`/${p.id}?sec=0`}
                    title={p.titulo}
                    className="nav-enlace-principal"
                    onClick={() => {
                      if (colapsado) setColapsado(false);
                      setExpandidos((prev) => ({ ...prev, [p.id]: true }));
                    }}
                  >
                    <Icono nombre={p.icono} />
                    <span>{p.titulo}</span>
                  </Link>
                  <button
                    type="button"
                    className="nav-flecha"
                    aria-label={`Desplegar opciones de ${p.titulo}`}
                    onClick={() => alternarModulo(p.id)}
                  >
                    <Icono nombre="chevron" />
                  </button>
                </div>

                {abierto && !colapsado ? (
                  <div className="nav-sublista">
                    {subsecciones.map((s, idx) => {
                      const subActiva = activoModulo && secActual === idx;
                      return (
                        <Link
                          key={s.pestana || s.titulo}
                          to={`/${p.id}?sec=${idx}`}
                          className={`nav-subitem${subActiva ? ' sub-activo' : ''}`}
                        >
                          <span className="sub-punto" />
                          <span>{s.pestana || s.titulo}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="lateral-pie">
          <span className="punto-activo" />
          <div className="lateral-texto-marca">
            <strong>{u.nombre_rol}</strong>
            <small>{u.nombre_usuario}</small>
          </div>
        </div>
      </aside>

      <div className="principal">
        <header className="barra">
          <button
            className="boton-icono"
            type="button"
            aria-label="Alternar panel lateral"
            title="Mostrar u ocultar menú lateral"
            onClick={() => {
              if (window.innerWidth <= 860) setMenuAbierto((v) => !v);
              else setColapsado((v) => !v);
            }}
          >
            <Icono nombre="panel" />
          </button>

          <div className="barra-titulo">
            <span className="barra-rol-etiqueta">
              {id === 'inicio' ? (u.nombre_rol || 'PANEL').toUpperCase() : actualPagina.titulo.toUpperCase()}
            </span>
            {subActual ? (
              <span className="barra-sub-migaja">
                {`/ ${subActual.pestana || subActual.titulo}`}
              </span>
            ) : null}
          </div>

          <div className="barra-acciones">
            <button
              className="boton-icono"
              type="button"
              title={temaOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              onClick={() => setTemaOscuro((v) => !v)}
            >
              <Icono nombre={temaOscuro ? 'sol' : 'luna'} />
            </button>

            <div className="notificaciones-contenedor" onClick={(e) => e.stopPropagation()}>
              <button
                className={`boton-icono campana-boton${menuNotificaciones ? ' activo' : ''}`}
                type="button"
                title="Centro de notificaciones del sistema"
                onClick={() => {
                  setMenuUsuario(false);
                  setMenuNotificaciones((v) => !v);
                  if (!menuNotificaciones) cargarNotificaciones();
                }}
              >
                <Icono nombre="campana" />
                {noLeidas > 0 ? <em className="campana-insignia">{noLeidas}</em> : null}
              </button>

              <div className={`notificaciones-menu${menuNotificaciones ? '' : ' oculto'}`}>
                <div className="notif-cabecera">
                  <div>
                    <strong>Notificaciones del sistema</strong>
                    <small>{`${todasNotificaciones.length} avisos en módulos activos`}</small>
                  </div>
                  <div className="notif-herramientas">
                    <button
                      type="button"
                      className="enlace-accion-notif"
                      onClick={() => cargarNotificaciones()}
                      title="Actualizar alertas"
                    >
                      {cargandoNotif ? '…' : 'Actualizar'}
                    </button>
                    {noLeidas > 0 ? (
                      <button
                        type="button"
                        className="enlace-accion-notif"
                        onClick={marcarTodasLeidas}
                      >
                        Marcar leídas
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="notif-filtros">
                  <button
                    type="button"
                    className={filtroNotif === 'todas' ? 'activo' : ''}
                    onClick={() => setFiltroNotif('todas')}
                  >
                    {`Todas (${todasNotificaciones.length})`}
                  </button>
                  <button
                    type="button"
                    className={filtroNotif === 'alertas' ? 'activo' : ''}
                    onClick={() => setFiltroNotif('alertas')}
                  >
                    {`Alertas (${alertasSistema.length})`}
                  </button>
                  <button
                    type="button"
                    className={filtroNotif === 'actividad' ? 'activo' : ''}
                    onClick={() => setFiltroNotif('actividad')}
                  >
                    {`Actividad (${eventosSesion.length})`}
                  </button>
                </div>

                <div className="notif-lista">
                  {notificacionesFiltradas.length === 0 ? (
                    <div className="notif-vacio">
                      <span>No hay notificaciones pendientes en esta categoría.</span>
                    </div>
                  ) : (
                    notificacionesFiltradas.map((n) => {
                      const leida = vistasIds.has(n.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          className={`notif-item nivel-${n.nivel || 'info'}${leida ? ' leida' : ''}`}
                          onClick={() => {
                            setVistasIds((prev) => new Set(prev).add(n.id));
                            setMenuNotificaciones(false);
                            navigate(n.destino);
                          }}
                        >
                          <span className={`notif-icono nivel-${n.nivel || 'info'}`}>
                            <Icono nombre={n.icono || 'campana'} />
                          </span>
                          <span className="notif-cuerpo">
                            <span className="notif-meta">
                              <em>{n.modulo}</em>
                              {!leida ? <i className="notif-punto" /> : null}
                            </span>
                            <strong>{n.titulo}</strong>
                            <small>{n.detalle}</small>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="usuario">
              <button
                className="usuario-boton"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuNotificaciones(false);
                  setMenuUsuario((v) => !v);
                }}
              >
                <span className="avatar">{iniciales}</span>
                <span className="usuario-datos">
                  <strong>{u.nombre_empleado || u.nombre_usuario}</strong>
                  <small>{u.nombre_rol}</small>
                </span>
              </button>
              <div className={`usuario-menu${menuUsuario ? '' : ' oculto'}`}>
                <button
                  type="button"
                  onClick={() => { setMenuUsuario(false); cambiarContrasena(); }}
                >
                  Cambiar mi contraseña
                </button>
                <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        </header>
        <main className="contenido-envoltura">
          <div className="contenido">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
