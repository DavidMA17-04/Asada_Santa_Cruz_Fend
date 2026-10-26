import { useSesion } from '../contexto/Sesion.jsx';
import { api } from '../api.js';
import { Formulario, Icono } from '../ui/index.js';

const BENEFICIOS = [
  {
    icono: 'gota',
    titulo: 'Cobros y morosidad al día',
    detalle: 'Seguimiento claro de la cartera y los pagos.',
  },
  {
    icono: 'factura',
    titulo: 'Lecturas y facturación centralizadas',
    detalle: 'Información ordenada para cada conexión.',
  },
  {
    icono: 'escudo',
    titulo: 'Información segura y auditable',
    detalle: 'Accesos por rol y bitácora de cambios.',
  },
];

export function Login({ mensaje }) {
  const { guardar } = useSesion();

  return (
    <main className="grid min-h-screen bg-[var(--fondo)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="login-panel-fondo relative flex min-h-[280px] min-w-0 flex-col overflow-hidden px-6 py-10 text-white lg:min-h-screen lg:px-14 lg:py-12">
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-44 w-full text-[#7dd3e8] opacity-20 lg:block"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,202.7C1200,181,1320,139,1380,117.3L1440,96L1440,320L0,320Z"
          />
          <path
            fill="currentColor"
            opacity=".5"
            d="M0,256L80,245.3C160,235,320,213,480,218.7C640,224,800,256,960,261.3C1120,267,1280,245,1360,234.7L1440,224L1440,320L0,320Z"
          />
        </svg>

        <div className="login-anim login-anim-1 relative z-10 flex items-center gap-3">
          <Icono nombre="gota" className="h-10 w-10 text-[#7dd3e8]" />
          <span className="text-xl font-bold tracking-[0.08em]">ASADA</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center lg:max-w-[440px]">
          <h1 className="login-anim login-anim-2 mt-8 text-balance text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-tight lg:mt-10">
            Todo el acueducto,{' '}
            <span className="text-[#7dd3e8]">en un solo lugar.</span>
          </h1>
          <p className="login-anim login-anim-3 mt-6 hidden max-w-[45ch] text-pretty text-base leading-relaxed text-white/80 lg:block">
            Gestione abonados, lecturas, facturación, pagos y mantenimientos
            con información clara y segura.
          </p>

          <ul className="login-anim login-anim-4 mt-10 hidden max-w-[380px] space-y-5 lg:block">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio.titulo} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <Icono nombre={beneficio.icono} className="h-5 w-5 text-[#7dd3e8]" />
                </span>
                <span>
                  <span className="block text-base font-medium text-white">{beneficio.titulo}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-white/65">{beneficio.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <span className="login-anim login-anim-6 relative z-10 mt-10 hidden text-sm font-medium text-white/80 lg:block">
          Santa Cruz · Costa Rica
        </span>

        <div className="login-anim login-anim-5 pointer-events-none absolute bottom-16 right-4 z-10 hidden w-44 rotate-[-3deg] rounded-2xl border border-solid border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md xl:block">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/60">Lecturas del mes</p>
          <p className="mt-2 text-2xl font-semibold text-white">128</p>
          <p className="mt-1 text-xs text-[#7dd3e8]">+12 % vs. mes anterior</p>
        </div>
        <div className="login-anim login-anim-5 pointer-events-none absolute bottom-56 right-16 z-10 hidden w-48 rotate-[2deg] rounded-2xl border border-solid border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md xl:block">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/60">Facturas emitidas</p>
          <p className="mt-2 text-2xl font-semibold text-white">96</p>
          <p className="mt-1 text-xs text-[#7dd3e8]">8 pendientes de cobro</p>
        </div>
      </section>

      <section className="login-formulario min-w-0">
        <div className="login-tarjeta">
          <h2>Bienvenido</h2>
          <p className="login-sub">Ingrese con su usuario institucional.</p>
          {mensaje ? <div className="error-form" style={{ margin: '0 0 16px' }}>{mensaje}</div> : null}
          <Formulario
            campos={[
              {
                nombre: 'usuario', etiqueta: 'Usuario', requerido: true, ancho: true,
                autocomplete: 'username', marcador: 'Ej. admin',
              },
              {
                nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true,
                ancho: true, autocomplete: 'current-password', revelable: true,
              },
            ]}
            textoEnviar="Ingresar"
            alEnviar={async (datos) => {
              const r = await api('POST', '/auth/login', datos);
              guardar({ token: r.token, usuario: r.usuario });
              window.location.hash = '#/inicio';
            }}
          />
          <p className="login-ayuda">
            Si no puede ingresar, contacte al administrador del sistema.
          </p>
          <p className="login-pie">© 2026 ASADA · Sistema de Gestión</p>
        </div>
      </section>
    </main>
  );
}
