// Cliente de la API REST (../backend). Guarda el token y el perfil en localStorage.
const BASE = '/api';
const CLAVE = 'asada.sesion';

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || null;
  } catch {
    return null;
  }
}

export const sesion = {
  actual: leerSesion(),

  guardar(datos) {
    this.actual = datos;
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* sin almacenamiento: dura lo que la pestaña */ }
  },

  borrar() {
    this.actual = null;
    try { localStorage.removeItem(CLAVE); } catch { /* idem */ }
  },

  /** true si el usuario tiene al menos uno de los permisos (lista vacía = cualquiera). */
  puede(permisos = []) {
    if (!permisos.length) return true;
    const propios = this.actual?.usuario?.permisos || [];
    return permisos.some((p) => propios.includes(p));
  },
};

export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

// Se llama cuando la API responde 401 con una sesión abierta (token vencido o usuario desactivado).
let alExpirar = () => {};
export function alExpirarSesion(fn) { alExpirar = fn; }

// Los catálogos de los formularios se guardan en memoria y se descartan
// después de cualquier cambio, para que un registro nuevo aparezca de inmediato.
const cache = new Map();

function querystring(filtros = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  }
  const texto = p.toString();
  return texto ? `?${texto}` : '';
}

export async function api(metodo, ruta, cuerpo) {
  const esLectura = metodo === 'GET';
  const url = BASE + ruta + (esLectura ? querystring(cuerpo) : '');
  const token = sesion.actual?.token;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: {
        ...(!esLectura && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: !esLectura && cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Verifique que la API esté en ejecución.');
  }

  let json;
  try {
    json = await respuesta.json();
  } catch {
    throw new ErrorApi(respuesta.status, `El servidor respondió ${respuesta.status} sin datos válidos.`);
  }

  if (!respuesta.ok || json.ok === false) {
    if (respuesta.status === 401 && token && ruta !== '/auth/login') alExpirar(json.mensaje);
    throw new ErrorApi(respuesta.status, json.mensaje || 'Ocurrió un error inesperado.');
  }

  if (!esLectura) cache.clear();
  return json;
}

export const obtener = (ruta, filtros) => api('GET', ruta, filtros);

export function obtenerCatalogo(ruta) {
  if (!cache.has(ruta)) {
    const promesa = obtener(ruta).then((r) => r.datos);
    promesa.catch(() => cache.delete(ruta));
    cache.set(ruta, promesa);
  }
  return cache.get(ruta);
}
