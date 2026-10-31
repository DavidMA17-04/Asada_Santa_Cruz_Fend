import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useState } from 'react';
import { obtenerCatalogo } from '../api.js';
import { Icono } from './Icono.jsx';
import { etiquetaDe } from './formato.js';

function valoresOpcion(opciones = []) {
  return opciones.map((op) => (typeof op === 'string' ? op : op.valor));
}

function valorPorDefecto(campo) {
  const def = typeof campo.valor === 'function' ? campo.valor() : campo.valor;
  if (def === undefined || def === null) return campo.tipo === 'checkbox' ? false : '';
  return def;
}

function valorInicial(campo, valores) {
  let v = valores[campo.nombre];
  if (v === undefined || v === null) v = valorPorDefecto(campo);
  if (v === undefined || v === null) return campo.tipo === 'checkbox' ? false : '';
  if (campo.tipo === 'date' && typeof v === 'string') return v.slice(0, 10);
  if (campo.tipo === 'datetime-local' && typeof v === 'string') return v.slice(0, 16);
  if (campo.tipo === 'info') return '';
  if (campo.opciones?.length && !valoresOpcion(campo.opciones).map(String).includes(String(v))) {
    return valorPorDefecto(campo);
  }
  return v;
}

function valoresIniciales(campos, valores) {
  const inicio = {};
  for (const campo of campos) {
    if (campo.tipo === 'oculto' || campo.tipo === 'info') continue;
    inicio[campo.nombre] = valorInicial(campo, valores);
  }
  return inicio;
}

function leerValor(campo, crudo) {
  if (campo.tipo === 'info') return undefined;
  if (campo.tipo === 'checkbox') return Boolean(crudo);
  if (crudo === '' || crudo === undefined || crudo === null) return undefined;
  let v = typeof crudo === 'string' ? crudo.trim() : crudo;
  if (v === '') return undefined;
  if (campo.opciones?.length && !valoresOpcion(campo.opciones).map(String).includes(String(v))) {
    v = valorPorDefecto(campo);
    if (v === '' || v === undefined || v === null) return undefined;
  }
  if (campo.tipo === 'number') return Number(v);
  if (campo.tipo === 'datetime-local') return `${String(v).replace('T', ' ')}:00`;
  if (campo.catalogo && /^\d+$/.test(String(v))) return Number(v);
  return v;
}

function valorOpcionCatalogo(catalogo, fila) {
  return typeof catalogo.valor === 'function' ? catalogo.valor(fila) : fila[catalogo.valor];
}

function CampoSelect({ campo, value, onChange, id, onFilas }) {
  const [opcionesCatalogo, setOpcionesCatalogo] = useState([]);
  const [cargando, setCargando] = useState(Boolean(campo.catalogo));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!campo.catalogo) return undefined;
    let vivo = true;
    setCargando(true);
    const catalogo = campo.catalogo;
    obtenerCatalogo(catalogo.ruta)
      .then((filas) => {
        if (!vivo) return;
        const lista = catalogo.filtro ? filas.filter((f) => catalogo.filtro(f)) : filas;
        onFilas?.(campo.nombre, lista);
        setOpcionesCatalogo(lista.map((fila) => ({
          valor: valorOpcionCatalogo(catalogo, fila),
          texto: typeof catalogo.texto === 'function' ? catalogo.texto(fila) : fila[catalogo.texto],
        })));
      })
      .catch((err) => { if (vivo) setError(err.message); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [campo.catalogo?.ruta, campo.nombre, onFilas]);

  const opciones = campo.opciones
    ? campo.opciones.map((op) => (typeof op === 'string' ? { valor: op, texto: op } : op))
    : opcionesCatalogo;

  useEffect(() => {
    if (!campo.textoInicial || (value !== '' && value !== undefined && value !== null)) return;
    const match = opciones.find((op) => op.texto === campo.textoInicial);
    if (match) onChange(match.valor);
  }, [campo.textoInicial, opciones, value, onChange]);

  const placeholder = error
    ? `No se pudo cargar: ${error}`
    : cargando
      ? 'Cargando…'
      : campo.requerido ? 'Seleccione…' : '(Todos)';

  const actual = value === undefined || value === null ? '' : String(value);

  return (
    <select
      id={id}
      name={campo.nombre}
      required={campo.requerido}
      disabled={cargando}
      value={actual}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {opciones.map((op) => (
        <option key={String(op.valor)} value={op.valor}>{op.texto}</option>
      ))}
    </select>
  );
}

function CampoClave({ campo, value, onChange, id }) {
  const [visible, setVisible] = useState(false);
  const texto = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';

  return (
    <div className="campo-clave">
      <input
        id={id}
        name={campo.nombre}
        type={visible ? 'text' : 'password'}
        required={campo.requerido}
        value={value ?? ''}
        maxLength={campo.max}
        placeholder={campo.marcador}
        autoComplete={campo.autocomplete ?? 'current-password'}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="campo-clave-boton"
        onClick={() => setVisible((v) => !v)}
        aria-label={texto}
        title={texto}
      >
        <Icono nombre={visible ? 'ojo-off' : 'ojo'} />
      </button>
    </div>
  );
}

function CampoInfo({ campo, id, valores, filasCatalogo }) {
  let texto = typeof campo.texto === 'string' ? campo.texto : '';
  let vacio = !texto;
  if (campo.desdeCampo) {
    const clave = valores[campo.desdeCampo];
    if (clave === undefined || clave === null || clave === '') {
      texto = campo.textoVacio || 'Seleccione una opción para ver el detalle.';
      vacio = true;
    } else {
      const filas = filasCatalogo[campo.desdeCampo] || [];
      const fila = filas.find((f) => {
        if (f.id_medidor !== undefined && String(f.id_medidor) === String(clave)) return true;
        if (f.id_conexion !== undefined && String(f.id_conexion) === String(clave)) return true;
        return false;
      });
      if (fila && campo.textoDesdeFila) {
        texto = campo.textoDesdeFila(fila);
        vacio = false;
      } else {
        texto = campo.textoVacio || 'No hay datos de referencia para esta selección.';
        vacio = true;
      }
    }
  }
  return (
    <div id={id} className={`campo-info${vacio ? ' campo-info-vacio' : ''}`} role="status">
      {texto}
    </div>
  );
}

function Control({ campo, value, onChange, id, onFilas, valores, filasCatalogo }) {
  if (campo.tipo === 'info') {
    return <CampoInfo campo={campo} id={id} valores={valores} filasCatalogo={filasCatalogo} />;
  }
  if (campo.tipo === 'password' && campo.revelable) {
    return <CampoClave campo={campo} value={value} onChange={onChange} id={id} />;
  }
  if (campo.tipo === 'textarea') {
    return (
      <textarea
        id={id}
        name={campo.nombre}
        required={campo.requerido}
        maxLength={campo.max}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (campo.tipo === 'checkbox') {
    return (
      <input
        id={id}
        name={campo.nombre}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  if (campo.opciones || campo.catalogo) {
    return <CampoSelect campo={campo} value={value} onChange={onChange} id={id} onFilas={onFilas} />;
  }
  return (
    <input
      id={id}
      name={campo.nombre}
      type={campo.tipo || 'text'}
      required={campo.requerido}
      value={value ?? ''}
      min={campo.min}
      max={campo.tipo === 'number' || campo.tipo === 'date' ? campo.max : undefined}
      maxLength={campo.tipo === 'number' ? undefined : campo.max}
      step={campo.paso ?? (campo.tipo === 'number' ? 'any' : undefined)}
      placeholder={campo.marcador}
      autoComplete={campo.autocomplete ?? (campo.tipo === 'password' ? 'new-password' : 'off')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export const Formulario = forwardRef(function Formulario({
  campos,
  valores = {},
  textoEnviar = 'Guardar',
  alEnviar,
  alCancelar,
  filtros = false,
}, ref) {
  const baseId = useId();
  const visibles = useMemo(() => campos.filter((c) => c.tipo !== 'oculto'), [campos]);
  const firmaCampos = useMemo(
    () => campos.map((c) => `${c.nombre}:${valoresOpcion(c.opciones).join(',')}`).join('|'),
    [campos],
  );
  const [estado, setEstado] = useState(() => valoresIniciales(campos, valores));
  const [firmaAplicada, setFirmaAplicada] = useState(firmaCampos);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [filasCatalogo, setFilasCatalogo] = useState({});

  if (firmaCampos !== firmaAplicada) {
    setFirmaAplicada(firmaCampos);
    setEstado(valoresIniciales(campos, estado));
  }

  const onFilas = useCallback((nombre, filas) => {
    setFilasCatalogo((prev) => (prev[nombre] === filas ? prev : { ...prev, [nombre]: filas }));
  }, []);

  const leer = useCallback(() => {
    const datos = {};
    for (const campo of campos) {
      if (campo.tipo === 'oculto' && valores[campo.nombre] !== undefined) {
        datos[campo.nombre] = valores[campo.nombre];
      }
    }
    const actuales = { ...estado };
    for (const campo of visibles) {
      if (campo.tipo === 'info') continue;
      if (campo.visibleSi && !campo.visibleSi(leerParcial(campos, actuales, valores))) continue;
      const v = leerValor(campo, estado[campo.nombre]);
      if (v !== undefined) datos[campo.nombre] = v;
    }
    return datos;
  }, [campos, estado, valores, visibles]);

  useImperativeHandle(ref, () => ({ leer }), [leer]);

  const actualesParaVisibilidad = useMemo(
    () => leerParcial(campos, estado, valores),
    [campos, estado, valores],
  );

  async function onSubmit(evento) {
    evento.preventDefault();
    setError(null);
    const datos = leer();
    const contexto = { filasCatalogo };
    for (const campo of visibles) {
      if (campo.tipo === 'info') continue;
      if (campo.visibleSi && !campo.visibleSi(datos)) continue;
      if (campo.requerido && (datos[campo.nombre] === undefined || datos[campo.nombre] === '')) {
        setError(`Complete el campo "${campo.etiqueta ?? etiquetaDe(campo.nombre)}".`);
        return;
      }
      if (typeof campo.validar === 'function') {
        const mensaje = campo.validar(datos[campo.nombre], datos, contexto);
        if (mensaje) {
          setError(mensaje);
          return;
        }
      }
    }
    setEnviando(true);
    try {
      await alEnviar(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const enviar = (
    <button className="boton primario" type="submit" disabled={enviando}>
      {enviando ? 'Procesando…' : textoEnviar}
    </button>
  );

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className={filtros ? 'form-filtros' : 'form-rejilla'}>
        {visibles.map((campo) => {
          const oculto = campo.visibleSi ? !campo.visibleSi(actualesParaVisibilidad) : false;
          const id = `${baseId}-${campo.nombre}`;
          const etiqueta = (
            <label htmlFor={id}>
              {campo.etiqueta ?? etiquetaDe(campo.nombre)}
              {campo.requerido ? <span className="requerido"> *</span> : null}
            </label>
          );
          const control = (
            <Control
              campo={campo}
              id={id}
              value={estado[campo.nombre]}
              valores={estado}
              filasCatalogo={filasCatalogo}
              onFilas={onFilas}
              onChange={(v) => setEstado((s) => ({ ...s, [campo.nombre]: v }))}
            />
          );
          return (
            <div
              key={campo.nombre}
              className={`${campo.tipo === 'checkbox' ? 'campo campo-check' : `campo ${campo.ancho || campo.tipo === 'textarea' || campo.tipo === 'info' ? 'ancho-completo' : ''}`}${oculto ? ' oculto' : ''}`}
            >
              {campo.tipo === 'checkbox' ? <>{control}{etiqueta}</> : <>{etiqueta}{control}{campo.ayuda ? <div className="ayuda">{campo.ayuda}</div> : null}</>}
            </div>
          );
        })}
        {filtros ? enviar : null}
      </div>
      {!filtros ? (
        <div className="form-pie">
          {alCancelar ? <button className="boton" type="button" onClick={alCancelar}>Cancelar</button> : null}
          {enviar}
        </div>
      ) : null}
      {error ? <div className="error-form" role="alert">{error}</div> : null}
    </form>
  );
});

function leerParcial(campos, estado, valores) {
  const datos = {};
  for (const campo of campos) {
    if (campo.tipo === 'info') continue;
    if (campo.tipo === 'oculto' && valores[campo.nombre] !== undefined) {
      datos[campo.nombre] = valores[campo.nombre];
      continue;
    }
    const v = leerValor(campo, estado[campo.nombre]);
    if (v !== undefined) datos[campo.nombre] = v;
  }
  return datos;
}
