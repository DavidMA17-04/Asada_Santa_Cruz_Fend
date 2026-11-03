function aTitulo(texto = '') {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Consulta la API pública de Hacienda por número de cédula física o jurídica costarricense.
 * @param {string} cedula - Número de identificación (9 o 10 dígitos)
 * @returns {Promise<{ ok: boolean, datos?: object, error?: string }>}
 */
export async function consultarHacienda(cedula) {
  const limpia = String(cedula || '').replace(/\D/g, '').trim();
  if (limpia.length < 9 || limpia.length > 12) {
    return { ok: false, error: 'La identificación debe tener entre 9 y 12 dígitos.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${limpia}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        return { ok: false, noEncontrado: true, error: 'Identificación no registrada en el padrón de Hacienda.' };
      }
      return { ok: false, error: `Hacienda respondió con estado ${res.status}.` };
    }

    const data = await res.json();
    const nombreCompleto = String(data.nombre || '').trim();
    if (!nombreCompleto) {
      return { ok: false, error: 'No se obtuvo nombre para la identificación indicada.' };
    }

    const esJuridica = limpia.length === 10 && limpia.startsWith('3');

    if (esJuridica) {
      return {
        ok: true,
        nombreCompleto: aTitulo(nombreCompleto),
        campos: {
          nombre: aTitulo(nombreCompleto),
          razon_social: aTitulo(nombreCompleto),
        },
      };
    }

    // Cédula física de Costa Rica: Hacienda entrega "APELLIDO1 APELLIDO2 NOMBRE(S)"
    const partes = nombreCompleto.split(/\s+/).filter(Boolean);
    let apellido1 = '';
    let apellido2 = '';
    let nombre = '';

    if (partes.length >= 3) {
      apellido1 = aTitulo(partes[0]);
      apellido2 = aTitulo(partes[1]);
      nombre = aTitulo(partes.slice(2).join(' '));
    } else if (partes.length === 2) {
      apellido1 = aTitulo(partes[0]);
      nombre = aTitulo(partes[1]);
    } else {
      nombre = aTitulo(nombreCompleto);
    }

    return {
      ok: true,
      nombreCompleto: aTitulo(nombreCompleto),
      campos: {
        nombre,
        apellido1,
        apellido2,
        nombre_completo: aTitulo(nombreCompleto),
        razon_social: aTitulo(nombreCompleto),
      },
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Tiempo de espera agotado al consultar Hacienda.' };
    }
    return { ok: false, error: 'No se pudo conectar con el servicio de Hacienda. Ingrese los datos manualmente.' };
  }
}

