import { useSesion } from '../contexto/Sesion.jsx';
import { api } from '../api.js';
import { Formulario, Icono } from '../ui/index.js';

export function Login({ mensaje }) {
  const { guardar } = useSesion();

  return (
    <main className="login">
      <div className="login-tarjeta">
        <div className="login-marca">
          <Icono nombre="gota" />
          <h1>ASADA</h1>
        </div>
        <p className="login-sub">Sistema de Gestión del Acueducto Comunal</p>
        {mensaje ? <div className="error-form" style={{ margin: '0 0 16px' }}>{mensaje}</div> : null}
        <Formulario
          campos={[
            { nombre: 'usuario', etiqueta: 'Usuario', requerido: true, ancho: true, autocomplete: 'username' },
            { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, ancho: true, autocomplete: 'current-password' },
          ]}
          textoEnviar="Ingresar"
          alEnviar={async (datos) => {
            const r = await api('POST', '/auth/login', datos);
            guardar({ token: r.token, usuario: r.usuario });
            window.location.hash = '#/inicio';
          }}
        />
      </div>
    </main>
  );
}
