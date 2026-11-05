// Flujo por rol del panel: pantalla de entrada y orden del menú.
// Los permisos siguen mandando (lo que se ve sale de dbo.Rol_permiso); esto solo
// decide a dónde llega cada rol y qué módulos ve primero.
// Si se crea un rol nuevo desde Seguridad, usa el perfil por defecto.

// Clave estable para una pestaña: 'Mi jornada' -> 'mi-jornada'.
export const slug = (texto = '') => String(texto)
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Ruta a una pestaña por nombre, no por posición: cada rol ve distintas
// pestañas, así que '?sec=2' no apunta a lo mismo para todos.
export const ruta = (paginaId, seccion, vista) => {
  const params = new URLSearchParams();
  if (seccion) params.set('sec', slug(seccion));
  if (vista) params.set('v', slug(vista));
  const q = params.toString();
  return `/${paginaId}${q ? `?${q}` : ''}`;
};

const PERFILES = {
  'administrador del sistema': {
    descripcion: 'Operación completa de la ASADA',
    inicio: '/inicio',
    orden: ['abonados', 'facturacion', 'pagos', 'mantenimiento', 'historiales', 'catalogos', 'seguridad', 'junta', 'dw', 'respaldos', 'bd'],
  },
  'junta directiva': {
    descripcion: 'Consulta de indicadores y reportes',
    inicio: '/junta',
    orden: ['junta', 'dw', 'pagos', 'facturacion', 'abonados', 'mantenimiento', 'historiales'],
  },
  fontanero: {
    descripcion: 'Trabajo de campo: mantenimientos, incidencias y lecturas',
    inicio: ruta('mantenimiento', 'Mi jornada'),
    orden: ['mantenimiento', 'facturacion', 'abonados', 'historiales'],
  },
  'administrador de bd': {
    descripcion: 'Respaldos, ETL y mantenimiento de la base',
    inicio: '/bd',
    orden: ['bd', 'respaldos', 'dw', 'historiales'],
  },
};

// Una pestaña, vista o botón con `ocultarA: ['Administrador del Sistema']` no se
// muestra a esos roles aunque tengan el permiso (el permiso lo siguen necesitando
// otros roles, p. ej. el Fontanero para "Mi jornada").
export function ocultoParaRol(item, nombreRol) {
  const lista = item?.ocultarA;
  if (!lista?.length || !nombreRol) return false;
  const rol = String(nombreRol).trim().toLowerCase();
  return lista.some((r) => r.toLowerCase() === rol);
}

const POR_DEFECTO = { descripcion: '', inicio: '/inicio', orden: [] };

export function perfilRol(nombreRol) {
  return PERFILES[String(nombreRol || '').trim().toLowerCase()] || POR_DEFECTO;
}

// Pantalla de entrada del rol; si el rol no puede abrirla, cae en Inicio.
export function inicioDelRol(nombreRol, modulosVisibles = []) {
  const { inicio } = perfilRol(nombreRol);
  const id = inicio.replace(/^\//, '').split('?')[0];
  if (id === 'inicio' || modulosVisibles.some((p) => p.id === id)) return inicio;
  return '/inicio';
}

// Ordena los módulos según el rol; los que no estén en la lista quedan al final.
export function ordenarModulos(nombreRol, modulos) {
  const { orden } = perfilRol(nombreRol);
  const pos = (p) => {
    const i = orden.indexOf(p.id);
    return i === -1 ? orden.length : i;
  };
  return [...modulos].sort((a, b) => pos(a) - pos(b));
}
