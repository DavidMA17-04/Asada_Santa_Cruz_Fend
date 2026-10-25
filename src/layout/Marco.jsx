import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { seccionesVisibles } from '../motor/MotorPagina.jsx';
import { INICIO, PAGINAS } from '../paginas/index.js';
import { abrirModal, avisar, Formulario, Icono } from '../ui/index.js';

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
  const disponibles = [INICIO, ...PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0)];
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);

  const id = location.pathname.replace(/^\//, '') || 'inicio';
  const actualPagina = disponibles.find((p) => p.id === id) || INICIO;

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
      <aside className="lateral">
        <div className="lateral-marca">
          <Icono nombre="gota" />
          <div>
            <strong>ASADA</strong>
            <small>Sistema de Gestión</small>
          </div>
        </div>
        <nav className="nav">
          {disponibles.map((p) => (
            <NavLink key={p.id} to={`/${p.id}`} className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icono nombre={p.icono} />
              {p.titulo}
            </NavLink>
          ))}
        </nav>
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
              onClick={(e) => { e.stopPropagation(); setMenuUsuario((v) => !v); }}
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
