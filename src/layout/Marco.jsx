import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { seccionesVisibles } from '../motor/MotorPagina.jsx';
import { INICIO, PAGINAS } from '../paginas/index.js';
import { abrirModal, avisar, Formulario, Icono } from '../ui/index.js';
import fotoPerfil from '../assets/Imagen-Perfil.png';

const GRUPOS_NAV = [
  { titulo: 'Principal', ids: ['inicio'] },
  { titulo: 'Operación', ids: ['abonados', 'facturacion', 'pagos', 'mantenimiento'] },
  { titulo: 'Administración', ids: ['catalogos', 'seguridad', 'dw', 'respaldos', 'bd'] },
];

function inicialesDe(nombre = '') {
  return nombre.split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
}

function Avatar({ nombre, className = '' }) {
  const [error, setError] = useState(false);
  const clases = `avatar-foto ${className}`.trim();

  if (error) return <span className={`avatar ${className}`.trim()}>{inicialesDe(nombre)}</span>;

  return (
    <img
      src={fotoPerfil}
      alt={`Foto de ${nombre}`}
      className={clases}
      onError={() => setError(true)}
    />
  );
}

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
  const nombre = u.nombre_empleado || u.nombre_usuario;
  const disponibles = [INICIO, ...PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0)];
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);

  const id = location.pathname.replace(/^\//, '') || 'inicio';
  const actualPagina = disponibles.find((p) => p.id === id) || INICIO;

  const grupos = GRUPOS_NAV
    .map((grupo) => ({
      ...grupo,
      paginas: grupo.ids.map((paginaId) => disponibles.find((p) => p.id === paginaId)).filter(Boolean),
    }))
    .filter((grupo) => grupo.paginas.length);

  const idsAgrupados = new Set(GRUPOS_NAV.flatMap((grupo) => grupo.ids));
  const otros = disponibles.filter((p) => !idsAgrupados.has(p.id));
  if (otros.length) grupos.push({ titulo: 'Otros', paginas: otros });

  useEffect(() => {
    document.title = `${actualPagina.titulo} · ASADA`;
    setMenuAbierto(false);
  }, [actualPagina.titulo, location.pathname]);

  useEffect(() => {
    const cerrar = () => setMenuUsuario(false);
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, []);

  async function cerrarSesion() {
    try { await api('POST', '/auth/logout'); } catch { /* el token se descarta igual */ }
    borrar();
    navigate('/', { replace: true });
  }

  return (
    <div className={`marco${menuAbierto ? ' menu-abierto' : ''}`}>
      {menuAbierto ? (
        <button
          className="lateral-fondo"
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      ) : null}

      <aside className="lateral">
        <div className="lateral-marca">
          <Icono nombre="gota" />
          <div>
            <strong>ASADA</strong>
            <small>Sistema de Gestión</small>
          </div>
        </div>

        <nav className="nav">
          {grupos.map((grupo) => (
            <div className="nav-grupo" key={grupo.titulo}>
              <span className="nav-seccion">{grupo.titulo}</span>
              {grupo.paginas.map((p) => (
                <NavLink key={p.id} to={`/${p.id}`} className={({ isActive }) => (isActive ? 'activo' : '')}>
                  <Icono nombre={p.icono} />
                  {p.titulo}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="lateral-pie">
          <button
            type="button"
            className="lateral-logout"
            title="Cerrar la sesión actual"
            onClick={cerrarSesion}
          >
            <Icono nombre="salir" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="principal">
        <header className="barra">
          <button
            className="boton menu-movil"
            type="button"
            aria-label="Menú"
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <Icono nombre="menu" />
          </button>
          <h1>{actualPagina.titulo}</h1>
          <div className="usuario">
            <button
              className="usuario-boton"
              type="button"
              aria-haspopup="true"
              aria-expanded={menuUsuario}
              onClick={(e) => { e.stopPropagation(); setMenuUsuario((v) => !v); }}
            >
              <Avatar nombre={nombre} />
              <span className="usuario-datos">
                <strong>{nombre}</strong>
                <small>{u.nombre_rol}</small>
              </span>
            </button>
            <div className={`usuario-menu${menuUsuario ? '' : ' oculto'}`}>
              <div className="usuario-menu-cabecera">
                <strong>{nombre}</strong>
                <small>{u.nombre_rol}</small>
              </div>
              <button
                type="button"
                onClick={() => { setMenuUsuario(false); cambiarContrasena(); }}
              >
                <Icono nombre="llave" /> Cambiar contraseña
              </button>
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
