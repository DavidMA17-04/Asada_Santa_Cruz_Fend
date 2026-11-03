import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useState } from 'react';
import { obtenerCatalogo } from '../api.js';
import { etiquetaDe } from './formato.js';
import { Icono } from './Icono.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Input } from '../components/ui/Input.jsx';
import { consultarHacienda } from '../motor/hacienda.js';

function valorInicial(campo, valores) {
  let v = valores[campo.nombre];
  if (v === undefined || v === null) v = typeof campo.valor === 'function' ? campo.valor() : campo.valor;
  if (v === undefined || v === null) return campo.tipo === 'checkbox' ? false : '';
  if (campo.tipo === 'date' && typeof v === 'string') return v.slice(0, 10);
  if (campo.tipo === 'datetime-local' && typeof v === 'string') return v.slice(0, 16);
  return v;
}

function valoresIniciales(campos, valores) {
  const inicio = {};
  for (const campo of campos) {
    if (campo.tipo === 'oculto') continue;
    inicio[campo.nombre] = valorInicial(campo, valores);
  }
  return inicio;
}

function valoresVacios(campos) {
  const vacio = {};
  for (const campo of campos) {
    if (campo.tipo === 'oculto') continue;
    vacio[campo.nombre] = campo.tipo === 'checkbox' ? false : '';
  }
  return vacio;
}

function leerValor(campo, crudo) {
  if (campo.tipo === 'checkbox') return Boolean(crudo);
  if (crudo === '' || crudo === undefined || crudo === null) return undefined;
  const v = typeof crudo === 'string' ? crudo.trim() : crudo;
  if (v === '') return undefined;
  if (campo.tipo === 'number') return Number(v);
  if (campo.tipo === 'datetime-local') return `${String(v).replace('T', ' ')}:00`;
  if (campo.catalogo && /^\d+$/.test(String(v))) return Number(v);
  return v;
}

function CampoSelect({ campo, value, onChange, id, filtros = false }) {
  const [opciones, setOpciones] = useState(() => {
    if (!campo.opciones) return [];
    return campo.opciones.map((op) => (typeof op === 'string' ? { valor: op, texto: op } : op));
  });
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
        const lista = catalogo.filtro ? filas.filter(catalogo.filtro) : filas;
        setOpciones(
          lista.map((fila) => ({
            valor: fila[catalogo.valor],
            texto: typeof catalogo.texto === 'function' ? catalogo.texto(fila) : fila[catalogo.texto],
          }))
        );
      })
      .catch((err) => {
        if (vivo) setError(err.message);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [campo.catalogo?.ruta]);

  useEffect(() => {
    if (!campo.textoInicial || (value !== '' && value !== undefined && value !== null)) return;
    const match = opciones.find((op) => op.texto === campo.textoInicial);
    if (match) onChange(match.valor);
  }, [campo.textoInicial, opciones, value, onChange]);

  const placeholder = error
    ? `Error: ${error}`
    : cargando
      ? 'Cargando…'
      : campo.requerido
        ? 'Seleccione…'
        : 'Todos';

  return (
    <Select
      id={id}
      name={campo.nombre}
      value={value}
      onChange={onChange}
      opciones={opciones}
      placeholder={placeholder}
      disabled={cargando}
      required={campo.requerido}
      variant={filtros ? 'pill' : 'default'}
    />
  );
}

function Control({
  campo,
  value,
  onChange,
  id,
  onBlurCedula,
  cargandoHacienda,
  exitoHacienda,
  filtros = false,
}) {
  const [verContrasena, setVerContrasena] = useState(false);
  const esCampoCedula = /^(numero_identidad|identificacion|cedula)$/i.test(campo.nombre);

  if (campo.tipo === 'textarea') {
    return (
      <textarea
        id={id}
        name={campo.nombre}
        required={campo.requerido}
        maxLength={campo.max}
        value={value ?? ''}
        placeholder={campo.marcador || 'Escribir…'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto)] focus:ring-2 focus:ring-sky-400 outline-none transition-all text-sm"
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
        className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 cursor-pointer"
      />
    );
  }

  if (campo.opciones || campo.catalogo) {
    return <CampoSelect campo={campo} value={value} onChange={onChange} id={id} filtros={filtros} />;
  }

  if (campo.tipo === 'password') {
    return (
      <Input
        id={id}
        name={campo.nombre}
        type="password"
        value={value}
        onChange={onChange}
        required={campo.requerido}
        maxLength={campo.max}
        placeholder={campo.marcador || 'Escribir…'}
        autoComplete={campo.autocomplete ?? 'new-password'}
        autoFocus={campo.autoFocus}
      />
    );
  }

  return (
    <div className="relative w-full">
      <Input
        id={id}
        name={campo.nombre}
        type={campo.tipo || 'text'}
        value={value}
        onChange={onChange}
        variant={filtros ? 'pill' : 'default'}
        onBlur={() => {
          if (esCampoCedula && onBlurCedula) {
            onBlurCedula(value);
          }
        }}
        required={campo.requerido}
        min={campo.min}
        max={campo.tipo === 'number' || campo.tipo === 'date' ? campo.max : undefined}
        maxLength={campo.tipo === 'number' ? undefined : campo.max}
        step={campo.paso ?? (campo.tipo === 'number' ? 'any' : undefined)}
        placeholder={campo.marcador || (esCampoCedula ? 'Número de cédula…' : (filtros ? 'Buscar…' : 'Escribir…'))}
        autoComplete={campo.autocomplete ?? 'off'}
        autoFocus={campo.autoFocus}
      />

      {esCampoCedula && cargandoHacienda ? (
        <span
          className="absolute right-3.5 top-3 flex items-center gap-1.5 text-xs text-sky-500 font-medium pointer-events-none"
          title="Consultando datos oficiales…"
        >
          <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </span>
      ) : esCampoCedula && exitoHacienda ? (
        <span
          className="absolute right-3.5 top-3 text-xs text-emerald-500 font-medium pointer-events-none"
          title="Datos verificados en padrón oficial"
        >
          ✓
        </span>
      ) : null}
    </div>
  );
}

export const Formulario = forwardRef(function Formulario(
  {
    campos,
    valores = {},
    textoEnviar = 'Guardar',
    alEnviar,
    alCancelar,
    filtros = false,
    extras = null,
    terminoBusqueda,
    alCambiarBusqueda,
    cuentaRegistros,
    alExportar,
  },
  ref
) {
  const baseId = useId();
  const visibles = useMemo(() => campos.filter((c) => c.tipo !== 'oculto'), [campos]);
  const [estado, setEstado] = useState(() => valoresIniciales(campos, valores));
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Estados de consulta de Hacienda para autocompletado en formularios de registro/edición
  const [cargandoHacienda, setCargandoHacienda] = useState(false);
  const [exitoHacienda, setExitoHacienda] = useState(false);
  const [mensajeHacienda, setMensajeHacienda] = useState(null);

  const consultarCedulaHacienda = useCallback(
    async (cedula) => {
      if (filtros) return; // Solo en formularios de registro/edición, NUNCA en filtros
      const limpia = String(cedula || '').replace(/\D/g, '').trim();
      if (limpia.length < 9 || limpia.length > 10) return;

      setCargandoHacienda(true);
      setExitoHacienda(false);
      setMensajeHacienda(null);

      try {
        const res = await consultarHacienda(limpia);
        if (res.ok && res.campos) {
          setEstado((prev) => {
            const nuevo = { ...prev };
            if (res.campos.nombre && 'nombre' in nuevo) nuevo.nombre = res.campos.nombre;
            if (res.campos.apellido1 && 'apellido1' in nuevo) nuevo.apellido1 = res.campos.apellido1;
            if (res.campos.apellido2 && 'apellido2' in nuevo) nuevo.apellido2 = res.campos.apellido2;
            if (res.campos.razon_social && 'razon_social' in nuevo) nuevo.razon_social = res.campos.razon_social;
            return nuevo;
          });
          setExitoHacienda(true);
          setMensajeHacienda(`Datos cargados automáticamente: ${res.nombreCompleto}`);
        } else if (res.noEncontrado) {
          setMensajeHacienda('Cédula no encontrada en el padrón tributario. Ingrese los datos manualmente.');
        }
      } catch {
        setMensajeHacienda('No se pudo consultar el servicio tributario. Continúe con el registro manual.');
      } finally {
        setCargandoHacienda(false);
      }
    },
    [filtros]
  );

  const leerDeEstado = useCallback(
    (mapaEstado) => {
      const datos = {};
      for (const campo of campos) {
        if (campo.tipo === 'oculto' && valores[campo.nombre] !== undefined) {
          datos[campo.nombre] = valores[campo.nombre];
        }
      }
      const actuales = { ...mapaEstado };
      for (const campo of visibles) {
        if (campo.visibleSi && !campo.visibleSi(leerParcial(campos, actuales, valores))) continue;
        const v = leerValor(campo, mapaEstado[campo.nombre]);
        if (v !== undefined) datos[campo.nombre] = v;
      }
      return datos;
    },
    [campos, valores, visibles]
  );

  const leer = useCallback(() => leerDeEstado(estado), [estado, leerDeEstado]);

  useImperativeHandle(ref, () => ({ leer }), [leer]);

  const actualesParaVisibilidad = useMemo(
    () => leerParcial(campos, estado, valores),
    [campos, estado, valores]
  );

  async function onSubmit(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await alEnviar(leer());
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function limpiarFiltros() {
    const limpios = valoresVacios(campos);
    setEstado(limpios);
    setError(null);
    setEnviando(true);
    try {
      await alEnviar(leerDeEstado(limpios));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const botonEnviar = (
    <button
      className={`boton ${filtros ? 'boton-aplicar-filtros' : 'primario'}`}
      type="submit"
      disabled={enviando}
    >
      {enviando ? (
        <span className="spinner" aria-hidden="true" />
      ) : filtros ? (
        <Icono nombre="buscar" tamano={14} />
      ) : null}
      <span>{enviando ? 'Procesando…' : textoEnviar}</span>
    </button>
  );

  return (
    <form noValidate={false} onSubmit={onSubmit} className={filtros ? 'contenedor-filtros' : ''}>
      {filtros ? (
        <div className="filtros-cabecera">
          <div className="filtros-insignia">
            <Icono nombre="filtro" tamano={14} />
            <span>Filtros de consulta</span>
          </div>

          <div className="filtros-acciones">
            <button
              className="boton boton-limpiar"
              type="button"
              disabled={enviando}
              onClick={limpiarFiltros}
              title="Restablecer filtros"
            >
              <Icono nombre="limpiar" tamano={13} />
              <span>Limpiar</span>
            </button>
            {botonEnviar}
          </div>
        </div>
      ) : null}

      {/* Si hay búsqueda unificada integrada a los filtros */}
      {filtros && (alCambiarBusqueda || cuentaRegistros !== undefined || alExportar) ? (
        <div className="filtros-busqueda-fila flex items-center justify-between gap-3">
          {alCambiarBusqueda ? (
            <div className="flex-1 min-w-[240px]">
              <Input
                type="search"
                variant="pill"
                icono="buscar"
                clearable
                placeholder="Buscar por nombre, correo o valor…"
                aria-label="Buscar en los resultados"
                value={terminoBusqueda || ''}
                onChange={(val) => alCambiarBusqueda(val)}
                onClear={() => alCambiarBusqueda('')}
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2.5 shrink-0">
            {cuentaRegistros !== undefined ? (
              <span className="cuenta-filtro-badge">
                <strong>{cuentaRegistros}</strong> {cuentaRegistros === 1 ? 'registro' : 'registros'}
              </span>
            ) : null}

            {alExportar ? (
              <button
                className="boton boton-filtro-exportar"
                type="button"
                onClick={alExportar}
                title="Descargar en formato CSV"
              >
                <Icono nombre="descargar" tamano={13} />
                <span>Exportar CSV</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={filtros ? 'form-filtros-grid' : 'form-rejilla'}>
        {visibles.map((campo) => {
          const oculto = campo.visibleSi ? !campo.visibleSi(actualesParaVisibilidad) : false;
          const id = `${baseId}-${campo.nombre}`;
          const etiqueta = (
            <label
              htmlFor={id}
              className={
                filtros
                  ? 'text-xs font-semibold tracking-wider text-slate-400 uppercase inline-flex items-center gap-1.5 mb-1.5 select-none'
                  : ''
              }
            >
              {filtros ? <Icono nombre="filtro" tamano={12} className="text-sky-400" /> : null}
              <span>{campo.etiqueta ?? etiquetaDe(campo.nombre)}</span>
              {campo.requerido ? <span className="requerido"> *</span> : null}
            </label>
          );
          const control = (
            <Control
              campo={campo}
              id={id}
              value={estado[campo.nombre]}
              onChange={(v) => setEstado((s) => ({ ...s, [campo.nombre]: v }))}
              onBlurCedula={consultarCedulaHacienda}
              cargandoHacienda={cargandoHacienda}
              exitoHacienda={exitoHacienda}
              filtros={filtros}
            />
          );
          return (
            <div
              key={campo.nombre}
              className={`${campo.tipo === 'checkbox'
                  ? 'campo campo-check'
                  : `campo ${campo.ancho || campo.tipo === 'textarea' ? 'ancho-completo' : ''}`
                }${oculto ? ' oculto' : ''}`}
            >
              {campo.tipo === 'checkbox' ? (
                <>
                  {control}
                  {etiqueta}
                </>
              ) : (
                <>
                  {etiqueta}
                  {control}
                  {campo.ayuda ? <div className="ayuda">{campo.ayuda}</div> : null}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Notificación informativa sutil sobre Hacienda en formularios */}
      {!filtros && mensajeHacienda ? (
        <div
          className={`text-xs mt-2 px-3 py-1.5 rounded-lg border flex items-center gap-2 ${exitoHacienda
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
        >
          <span>{exitoHacienda ? '✓' : 'ℹ'}</span>
          <span>{mensajeHacienda}</span>
        </div>
      ) : null}

      {extras}
      {error ? (
        <div className="error-form" role="alert">
          {error}
        </div>
      ) : null}

      {!filtros ? (
        <div className="form-pie">
          {botonEnviar}
          {alCancelar ? (
            <button className="boton" type="button" onClick={alCancelar}>
              Cancelar
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
});

function leerParcial(campos, estado, valores) {
  const datos = {};
  for (const campo of campos) {
    if (campo.tipo === 'oculto' && valores[campo.nombre] !== undefined) {
      datos[campo.nombre] = valores[campo.nombre];
      continue;
    }
    const v = leerValor(campo, estado[campo.nombre]);
    if (v !== undefined) datos[campo.nombre] = v;
  }
  return datos;
}

export default Formulario;
