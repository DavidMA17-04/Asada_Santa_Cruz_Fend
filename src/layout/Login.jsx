import { useState } from 'react';
import { useSesion } from '../contexto/Sesion.jsx';
import { api } from '../api.js';
import { Formulario } from '../ui/index.js';

const CLAVE_USUARIO = 'asada.usuario';
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login({ mensaje }) {
  const { guardar } = useSesion();
  const [vista, setVista] = useState('login');
  const [recordar, setRecordar] = useState(() => Boolean(localStorage.getItem(CLAVE_USUARIO)));
  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState(null);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState(false);

  const usuarioRecordado = localStorage.getItem(CLAVE_USUARIO) || '';

  async function entrar(datos) {
    const r = await api('POST', '/auth/login', {
      usuario: datos.usuario,
      contrasena: datos.contrasena,
    });

    if (recordar && datos.usuario) localStorage.setItem(CLAVE_USUARIO, datos.usuario);
    else localStorage.removeItem(CLAVE_USUARIO);

    guardar({ token: r.token, usuario: r.usuario });
    window.location.hash = '#/inicio';
  }

  function abrirRecuperar() {
    setCorreo('');
    setErrorCorreo(null);
    setCorreoEnviado(false);
    setVista('recuperar');
  }

  async function enviarCorreo(evento) {
    evento.preventDefault();
    setErrorCorreo(null);

    const limpio = correo.trim();
    if (!CORREO_VALIDO.test(limpio)) {
      setErrorCorreo('Escriba un correo electrónico válido.');
      return;
    }

    setEnviandoCorreo(true);
    // Solo visual: no se envía nada al servidor.
    await new Promise((listo) => setTimeout(listo, 900));
    setEnviandoCorreo(false);
    setCorreoEnviado(true);
  }

  return (
    <main className="login">
      <div className="login-tarjeta-minimal">
        <div className="login-marca-centrada">
          <img src="/logo-asada.png" alt="Logo ASADA Santa Cruz" className="login-logo-circular" />
          <span className="login-etiqueta-sup">ACUEDUCTO COMUNAL</span>
          <h1>ASADA Santa Cruz</h1>
          {vista === 'login' ? (
            <p className="login-sub">Ingrese sus credenciales para acceder al sistema</p>
          ) : null}
        </div>

        {vista === 'login' ? (
          <>
            {mensaje ? <div className="error-form" style={{ margin: '0 0 16px' }}>{mensaje}</div> : null}

            <Formulario
              campos={[
                { nombre: 'usuario', etiqueta: 'Usuario', requerido: true, ancho: true, autoFocus: true, autocomplete: 'username', marcador: 'Ej. admin' },
                { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, ancho: true, autocomplete: 'current-password', marcador: '••••••••' },
              ]}
              valores={{ usuario: usuarioRecordado }}
              textoEnviar="Ingresar al sistema"
              alEnviar={entrar}
              extras={(
                <div className="login-opciones">
                  <label className="login-recordar">
                    <input
                      type="checkbox"
                      checked={recordar}
                      onChange={(e) => setRecordar(e.target.checked)}
                    />
                    <span>Recordar usuario</span>
                  </label>
                  <button type="button" className="login-enlace" onClick={abrirRecuperar}>
                    ¿Olvidó su contraseña?
                  </button>
                </div>
              )}
            />
          </>
        ) : (
          <form className="login-recuperar" onSubmit={enviarCorreo} noValidate>
            {correoEnviado ? (
              <>
                <h2>Correo enviado</h2>
                <p className="login-sub">
                  Si el correo está registrado, recibirá las instrucciones para restablecer la contraseña.
                </p>
                <button
                  type="button"
                  className="boton primario login-ancho"
                  onClick={() => setVista('login')}
                >
                  Volver al inicio de sesión
                </button>
              </>
            ) : (
              <>
                <h2>Recuperar contraseña</h2>
                <p className="login-sub">Escriba el correo con el que fue registrado.</p>

                <div className="campo ancho-completo">
                  <label htmlFor="correo-recuperar">Correo electrónico</label>
                  <input
                    id="correo-recuperar"
                    name="correo"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="correo@ejemplo.com"
                    value={correo}
                    onChange={(e) => { setCorreo(e.target.value); setErrorCorreo(null); }}
                  />
                </div>

                {errorCorreo ? <div className="error-form" role="alert">{errorCorreo}</div> : null}

                <button className="boton primario login-ancho" type="submit" disabled={enviandoCorreo}>
                  {enviandoCorreo ? <span className="spinner" aria-hidden="true" /> : null}
                  <span>{enviandoCorreo ? 'Enviando…' : 'Enviar instrucciones'}</span>
                </button>

                <button type="button" className="login-volver" onClick={() => setVista('login')}>
                  ← Volver al inicio de sesión
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
