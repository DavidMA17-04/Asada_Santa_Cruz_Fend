import { useSesion } from '../contexto/Sesion.jsx';
import { api } from '../api.js';
import { Formulario } from '../ui/index.js';

export function Login({ mensaje }) {
  const { guardar } = useSesion();

  return (
    <main className="login">
      <div className="login-tarjeta-minimal">
        <div className="login-marca-centrada">
          <img src="/logo-asada.png" alt="Logo ASADA Santa Cruz" className="login-logo-circular" />
          <span className="login-etiqueta-sup">ACUEDUCTO COMUNAL</span>
          <h1>ASADA Santa Cruz</h1>
          <p className="login-sub">Ingrese sus credenciales para acceder al sistema</p>
        </div>

        {mensaje ? <div className="error-form" style={{ margin: '0 0 16px' }}>{mensaje}</div> : null}

        <Formulario
          campos={[
            { nombre: 'usuario', etiqueta: 'Usuario', requerido: true, ancho: true, autocomplete: 'username', marcador: 'Ej. admin' },
            { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, ancho: true, autocomplete: 'current-password', marcador: '••••••••' },
          ]}
          textoEnviar="Ingresar al sistema"
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
