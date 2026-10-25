// Punto de entrada: inicio de sesión, estructura (menú y barra), panel de inicio y navegación por hash (#/modulo).
import { api, obtener, sesion, alExpirarSesion } from './api.js';
import { h, icono, avisar, abrirModal, formulario, moneda } from './ui.js';
import { renderPagina, seccionesVisibles } from './motor.js';
import { P } from './permisos.js';
import abonados from './paginas/abonados.js';
import facturacion from './paginas/facturacion.js';
import pagos from './paginas/pagos.js';
import mantenimiento from './paginas/mantenimiento.js';
import seguridad from './paginas/seguridad.js';
import catalogos from './paginas/catalogos.js';
import { respaldos, dataWarehouse, baseDatos } from './paginas/administracion.js';
import { fechas } from './paginas/comunes.js';

const PAGINAS = [abonados, facturacion, pagos, mantenimiento, catalogos, seguridad, dataWarehouse, respaldos, baseDatos];
const app = document.getElementById('app');

/* ------------------------------- Sesión ------------------------------- */

function pantallaLogin(mensaje) {
  partes = null;
  const form = formulario([
    { nombre: 'usuario', etiqueta: 'Usuario', requerido: true, ancho: true },
    { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, ancho: true },
  ], {
    textoEnviar: 'Ingresar',
    alEnviar: async (datos) => {
      const r = await api('POST', '/auth/login', datos);
      sesion.guardar({ token: r.token, usuario: r.usuario });
      location.hash = '#/inicio';
      iniciarAplicacion();
    },
  });
  form.querySelector('input[name=contrasena]').autocomplete = 'current-password';
  form.querySelector('input[name=usuario]').autocomplete = 'username';

  app.replaceChildren(h('main', { class: 'login' },
    h('div', { class: 'login-tarjeta' },
      h('div', { class: 'login-marca' }, icono('gota'), h('h1', {}, 'ASADA')),
      h('p', { class: 'login-sub' }, 'Sistema de Gestión del Acueducto Comunal'),
      mensaje ? h('div', { class: 'error-form', style: 'margin:0 0 16px' }, mensaje) : null,
      form)));
  form.querySelector('input').focus();
}

async function cerrarSesion() {
  try { await api('POST', '/auth/logout'); } catch { /* el token se descarta igual */ }
  sesion.borrar();
  pantallaLogin();
}

alExpirarSesion((mensaje) => {
  sesion.borrar();
  pantallaLogin(mensaje || 'La sesión expiró. Inicie sesión de nuevo.');
});

function cambiarContrasena() {
  const modal = abrirModal('Cambiar mi contraseña', formulario([
    { nombre: 'actual', etiqueta: 'Contraseña actual', tipo: 'password', requerido: true, ancho: true },
    { nombre: 'nueva', etiqueta: 'Contraseña nueva', tipo: 'password', requerido: true, ancho: true },
    { nombre: 'confirmacion', etiqueta: 'Repita la contraseña nueva', tipo: 'password', requerido: true, ancho: true },
  ], {
    textoEnviar: 'Cambiar contraseña',
    alCancelar: () => modal.cerrar(),
    alEnviar: async ({ actual, nueva, confirmacion }) => {
      if (nueva !== confirmacion) throw new Error('Las contraseñas nuevas no coinciden.');
      await api('PUT', '/auth/contrasena', { actual, nueva });
      modal.cerrar();
      avisar('Contraseña actualizada.');
    },
  }), { tamano: 'chico' });
}

/* ------------------------------ Estructura ----------------------------- */

const INICIO = { id: 'inicio', titulo: 'Inicio', icono: 'inicio' };

function paginasDisponibles() {
  return PAGINAS.filter((p) => seccionesVisibles(p).length > 0);
}

let marco;

function construirMarco() {
  const u = sesion.actual.usuario;
  const iniciales = (u.nombre_empleado || u.nombre_usuario).split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  const menuUsuario = h('div', { class: 'usuario-menu oculto' },
    h('button', { type: 'button', onclick: () => { menuUsuario.classList.add('oculto'); cambiarContrasena(); } }, 'Cambiar mi contraseña'),
    h('button', { type: 'button', onclick: cerrarSesion }, 'Cerrar sesión'));

  const nav = h('nav', { class: 'nav' },
    [INICIO, ...paginasDisponibles()].map((p) =>
      h('a', { href: `#/${p.id}`, 'data-id': p.id }, icono(p.icono), p.titulo)));

  const titulo = h('h1');
  const contenido = h('div', { class: 'contenido' });

  marco = h('div', { class: 'marco' },
    h('aside', { class: 'lateral' },
      h('div', { class: 'lateral-marca' }, icono('gota'), h('div', {}, h('strong', {}, 'ASADA'), h('small', {}, 'Sistema de Gestión'))),
      nav),
    h('div', { class: 'principal' },
      h('header', { class: 'barra' },
        h('button', {
          class: 'boton menu-movil', type: 'button', 'aria-label': 'Menú',
          onclick: () => marco.classList.toggle('menu-abierto'),
        }, icono('menu')),
        titulo,
        h('div', { class: 'usuario' },
          h('button', {
            class: 'usuario-boton', type: 'button',
            onclick: (e) => { e.stopPropagation(); menuUsuario.classList.toggle('oculto'); },
          },
          h('span', { class: 'avatar' }, iniciales),
          h('span', { class: 'usuario-datos' }, h('strong', {}, u.nombre_empleado || u.nombre_usuario), h('small', {}, u.nombre_rol))),
          menuUsuario)),
      h('main', { class: 'contenido-envoltura' }, contenido)));

  app.replaceChildren(marco);
  return { nav, titulo, contenido };
}

/* ------------------------------- Inicio -------------------------------- */

const enCurso = (f) => f.estado === 'Programado' || f.estado === 'En proceso';
const suma = (filas, campo) => filas.reduce((t, f) => t + (Number(f[campo]) || 0), 0);

const INDICADORES = [
  {
    titulo: 'Mis mantenimientos', destino: 'mantenimiento', permisos: [P.EJECUTAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/mios'),
    valor: (d) => d.filter(enCurso).length, detalle: () => 'programados o en proceso',
  },
  {
    titulo: 'Medidores sin lectura', destino: 'facturacion',
    permisos: [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS, P.REGISTRAR_LECTURA, P.REGISTRAR_INCIDENCIA, P.CONSULTAR_FACTURAS],
    cargar: () => obtener('/medidores/sin-lectura'),
    valor: (d) => d.length, detalle: () => 'en el mes actual',
  },
  {
    titulo: 'Facturas por cobrar', destino: 'pagos',
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/facturas/pendientes'),
    valor: (d) => d.length, detalle: (d) => `${moneda(suma(d, 'saldo'))} de saldo`,
  },
  {
    titulo: 'Abonados morosos', destino: 'pagos', alerta: true,
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/mora/morosos'),
    valor: (d) => d.length, detalle: (d) => `${moneda(suma(d, 'saldo_vencido'))} vencido`,
  },
  {
    titulo: 'Alertas de consumo', destino: 'facturacion', alerta: true,
    permisos: [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION],
    cargar: () => obtener('/alertas/activas'),
    valor: (d) => d.length, detalle: () => 'abiertas',
  },
  {
    titulo: 'Incidencias abiertas', destino: 'mantenimiento', alerta: true,
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
    cargar: () => obtener('/incidencias/abiertas'),
    valor: (d) => d.length, detalle: (d) => `${d.filter((f) => f.prioridad === 'Alta').length} de prioridad alta`,
  },
  {
    titulo: 'Mantenimientos pendientes', destino: 'mantenimiento',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/pendientes'),
    valor: (d) => d.length, detalle: () => 'sin finalizar',
  },
  {
    titulo: 'Usuarios bloqueados', destino: 'seguridad', alerta: true,
    permisos: [P.GESTIONAR_SEGURIDAD],
    cargar: () => obtener('/seguridad/usuarios/bloqueados'),
    valor: (d) => d.length, detalle: () => 'por intentos fallidos',
  },
  {
    titulo: 'Respaldos (7 días)', destino: 'respaldos',
    permisos: [P.RESPALDOS],
    cargar: () => obtener('/respaldos/historial', { desde: fechas.haceDias(7) }),
    valor: (d) => d.filter((f) => f.estado === 'Exitoso').length,
    detalle: (d) => `${d.filter((f) => f.estado === 'Fallido').length} fallidos`,
  },
  {
    titulo: 'Cargas ETL fallidas', destino: 'dw', alerta: true,
    permisos: [P.ETL],
    cargar: () => obtener('/dw/etl/fallidas'),
    valor: (d) => d.length, detalle: () => 'sin reintentar',
  },
];

function indicador(def) {
  const valor = h('strong', {}, '…');
  const detalle = h('span', {}, ' ');
  const tarjeta = h('a', { class: 'indicador', href: `#/${def.destino}` }, h('small', {}, def.titulo), valor, detalle);
  def.cargar()
    .then((r) => {
      const n = def.valor(r.datos);
      valor.textContent = n;
      detalle.textContent = def.detalle(r.datos);
      if (def.alerta && n > 0) tarjeta.classList.add('alerta');
    })
    .catch(() => { valor.textContent = '—'; detalle.textContent = 'No disponible'; });
  return tarjeta;
}

function paginaInicio(contenedor) {
  const u = sesion.actual.usuario;
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const disponibles = INDICADORES.filter((i) => sesion.puede(i.permisos));
  const accesos = paginasDisponibles();

  contenedor.replaceChildren(
    h('div', { class: 'saludo' },
      h('h2', {}, `${saludo}, ${(u.nombre_empleado || u.nombre_usuario).split(' ')[0]}`),
      h('p', {}, `${u.nombre_rol}${u.puesto ? ` · ${u.puesto}` : ''}`)),
    disponibles.length ? h('div', { class: 'indicadores' }, disponibles.map(indicador)) : null,
    h('section', { class: 'tarjeta' },
      h('h2', {}, 'Módulos'),
      h('p', { class: 'descripcion' }, 'Solo se muestran los módulos a los que su rol tiene acceso.'),
      h('div', { class: 'indicadores', style: 'margin:0' }, accesos.map((p) =>
        h('a', { class: 'indicador modulo', href: `#/${p.id}` },
          h('strong', {}, p.titulo),
          h('span', {}, seccionesVisibles(p).map((s) => s.pestana || s.titulo).join(' · ')))))));
}

/* ------------------------------ Navegación ----------------------------- */

let partes;

function navegar() {
  if (!sesion.actual || !partes) return; // la estructura se arma después de leer el perfil
  const id = location.hash.replace(/^#\/?/, '') || 'inicio';
  const pagina = paginasDisponibles().find((p) => p.id === id);
  const actual = pagina || INICIO;

  partes.nav.querySelectorAll('a').forEach((a) => a.classList.toggle('activo', a.dataset.id === actual.id));
  partes.titulo.textContent = actual.titulo;
  document.title = `${actual.titulo} · ASADA`;
  marco.classList.remove('menu-abierto');

  if (pagina) renderPagina(pagina, partes.contenido);
  else paginaInicio(partes.contenido);
}

async function iniciarAplicacion() {
  // Refresca permisos y datos del usuario: pudieron cambiar desde el último ingreso.
  try {
    const r = await obtener('/auth/perfil');
    sesion.guardar({ ...sesion.actual, usuario: r.datos });
  } catch (err) {
    if (!sesion.actual) return; // el 401 ya mostró el inicio de sesión
    avisar(err.message, 'error');
  }
  partes = construirMarco();
  navegar();
}

window.addEventListener('hashchange', navegar);
document.addEventListener('click', () => document.querySelector('.usuario-menu')?.classList.add('oculto'));

if (sesion.actual?.token) iniciarAplicacion();
else pantallaLogin();
