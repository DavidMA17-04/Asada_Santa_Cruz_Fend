import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, obtener, sesion } from '../api.js';
import {
  abrirModal,
  avisar,
  confirmar,
  Formulario,
  Icono,
  Tabla,
  TableroDiagnosticoSLA,
  MetricsSummary,
  UnifiedFilterBar,
} from '../ui/index.js';
import { etiquetaDe, formatearCelda } from '../ui/formato.js';


function estiloAccion(b = {}) {
  let icono = b.icono;
  let claseTono = '';
  const texto = String(b.texto || '').toLowerCase();
  if (b.peligro || /eliminar|desactivar|baja|anular/i.test(texto)) {
    icono = icono || 'peligro';
    claseTono = 'peligro';
  } else if (/editar|modificar/i.test(texto)) {
    icono = icono || 'editar';
    claseTono = 'secundario';
  } else if (/nuevo|agregar|crear|registrar|programar/i.test(texto)) {
    icono = icono || 'mas';
    claseTono = 'primario';
  } else if (/ver|detalle|consultar|historial/i.test(texto)) {
    icono = icono || 'ojo';
    claseTono = 'neutro';
  } else if (/descargar|exportar/i.test(texto)) {
    icono = icono || 'descargar';
    claseTono = 'secundario';
  } else {
    icono = icono || 'accion';
  }
  return { icono, claseTono };
}

const resolver = (valor, ...args) => (typeof valor === 'function' ? valor(...args) : valor);
const permitidos = (lista = []) => lista.filter((x) => sesion.puede(x.permisos || []));
const camposDe = (campos, fila) => permitidos(resolver(campos, fila) || []);

const TEXTO_SCRIPT = /^(RESTORE|BACKUP|DBCC|ALTER|USE|--)/m;

function segmentosPastel(filas, config) {
  const conteos = new Map((config.estados || []).map((estado) => [estado, 0]));
  filas.forEach((fila) => {
    const estado = fila[config.campo] || 'Sin estado';
    conteos.set(estado, (conteos.get(estado) || 0) + 1);
  });
  return [...conteos.entries()].map(([etiqueta, valor]) => ({
    etiqueta,
    valor,
    color: config.colores?.[etiqueta],
  }));
}

function BloqueTabla({ filas, opciones = {} }) {
  if (filas.length === 1 && Object.keys(filas[0]).length === 1) {
    const valor = Object.values(filas[0])[0];
    if (typeof valor === 'string' && (valor.length > 120 || TEXTO_SCRIPT.test(valor))) {
      return <pre className="script">{valor}</pre>;
    }
  }
  return <Tabla filas={filas} {...opciones} />;
}

export function VistaResultado({ r, titulos = [] }) {
  const partes = [];
  const salida = Object.entries(r.salida || {});
  if (salida.length) {
    partes.push(
      <div className="resumen-salida" key="salida">
        {salida.map(([k, v]) => (
          <div key={k}>{etiquetaDe(k)}<b>{v === null ? '—' : String(v)}</b></div>
        ))}
      </div>,
    );
  }
  const conjuntos = (r.conjuntos || [r.datos || []]).filter((c) => c.length);
  conjuntos.forEach((filas, i) => {
    if (conjuntos.length > 1 || titulos[i]) {
      partes.push(<h3 key={`t-${i}`}>{titulos[i] || `Resultado ${i + 1}`}</h3>);
    }
    partes.push(<BloqueTabla key={`b-${i}`} filas={filas} />);
  });
  if (!partes.length) {
    partes.push(<p className="descripcion" key="vacio">La operación terminó sin datos que mostrar.</p>);
  }
  return <div>{partes}</div>;
}

function mostrarResultado(titulo, r, titulos) {
  abrirModal(titulo, <VistaResultado r={r} titulos={titulos} />, { tamano: 'ancho' });
}

export async function ejecutarAccion(accion, fila, recargar) {
  try {
    const metodo = accion.metodo || 'POST';
    const ruta = resolver(accion.ruta, fila || {});
    const titulo = resolver(accion.titulo, fila || {}) || accion.texto;

    if (metodo === 'GET') {
      const esDetalle = !accion.acciones && !accion.columnas && !accion.botones && !accion.filtros;
      const modal = abrirModal(titulo, <div className="cargando">Cargando…</div>, { tamano: esDetalle ? 'chico' : 'ancho' });
      const cargar = async () => {
        try {
          const r = await obtener(ruta);
          if (esDetalle) {
            modal.reemplazar(<VistaResultado r={r} titulos={accion.titulosResultado} />);
            return;
          }
          modal.reemplazar(
            <ContenidoConsulta
              def={{
                ...accion,
                nombreArchivo: titulo,
                acciones: resolver(accion.acciones, fila),
                botones: resolver(accion.botones, fila),
              }}
              r={r}
              recargar={() => { cargar(); recargar?.(); }}
            />,
          );
        } catch (err) {
          modal.reemplazar(<div className="error-form" role="alert">{err.message}</div>);
        }
      };
      cargar();
      return;
    }

    const enviar = async (datos) => {
      const r = await api(metodo, ruta, { ...(accion.cuerpo?.(fila || {}) || {}), ...datos });
      avisar(accion.exito ? accion.exito(r, fila) : 'Operación realizada.');
      if (accion.mostrarResultado) mostrarResultado(titulo, r, accion.titulosResultado);
      recargar?.();
    };

    if (accion.campos) {
      let campos;
      try {
        campos = camposDe(accion.campos, fila);
      } catch (err) {
        avisar(err.message || 'No se pudo preparar el formulario.', 'error');
        return;
      }
      if (!campos.length) {
        avisar('No hay campos disponibles para esta acción con su permiso actual.', 'error');
        return;
      }
      const modalRef = { actual: null };
      modalRef.actual = abrirModal(titulo, (
        <Formulario
          campos={campos}
          valores={accion.inicial?.(fila || {}) || {}}
          textoEnviar={accion.textoEnviar || accion.texto}
          alCancelar={() => modalRef.actual?.cerrar()}
          alEnviar={async (datos) => {
            await enviar(datos);
            modalRef.actual?.cerrar();
          }}
        />
      ));
      return;
    }

    if (accion.confirmar) {
      const ok = await confirmar(resolver(accion.confirmar, fila || {}), { textoAceptar: accion.texto, peligro: accion.peligro });
      if (!ok) return;
    }
    await enviar({});
  } catch (err) {
    avisar(err.message || 'No se pudo ejecutar la acción.', 'error');
  }
}

function Botones({ lista, recargar }) {
  return permitidos(lista).map((b) => {
    const { icono: ic, claseTono } = estiloAccion(b);
    return (
      <button
        key={b.texto}
        className={`boton ${b.primario ? 'primario' : claseTono}`}
        type="button"
        onClick={() => ejecutarAccion(b, null, recargar)}
      >
        <Icono nombre={ic} />
        <span>{b.texto}</span>
      </button>
    );
  });
}

function ContenidoConsulta({
  def,
  r,
  recargar,
  terminoBusqueda,
  alCambiarBusqueda,
  exportarRef,
}) {
  if (def.ruta === '/mantenimientos/resumen-operativo' && r?.conjuntos) {
    return <TableroDiagnosticoSLA r={r} def={def} recargar={recargar} />;
  }

  const acciones = permitidos(def.acciones);
  const opciones = {
    acciones,
    alAccion: (a, fila) => ejecutarAccion(a, fila, recargar),
    ocultar: def.ocultar,
    columnas: def.columnas,
    mensajeVacio: def.mensajeVacio,
    nombreArchivo: String(def.nombreArchivo || def.titulo || 'datos').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-'),
    terminoExterno: terminoBusqueda,
    alCambiarTerminoExterno: alCambiarBusqueda,
    exportarRef,
    ocultarHerramientas: Boolean(exportarRef || alCambiarBusqueda),
  };
  const botones = permitidos(def.botones || []);

  return (
    <div className="modal-cuerpo-interno">
      {botones.length && def.metodo === 'GET' ? (
        <div className="herramientas" style={{ marginBottom: 14 }}>
          <Botones lista={def.botones || []} recargar={recargar} />
        </div>
      ) : null}
      {def.conjuntos && r.conjuntos ? (
        r.conjuntos.map((filas, i) => (
          <div className="bloque-conjunto" key={i}>
            <h3>{def.conjuntos[i] || `Resultado ${i + 1}`}</h3>
            <BloqueTabla filas={filas} />
          </div>
        ))
      ) : (
        <Tabla filas={r.datos || []} {...opciones} />
      )}
    </div>
  );
}

function Encabezado({ sec, pagina, herramientas }) {
  return (
    <div className="encabezado-seccion">
      <div className="encabezado-textos">
        {pagina ? (
          <div className="modulo-pill">
            <Icono nombre={pagina.icono || 'lista'} tamano={14} />
            <span>{pagina.titulo}</span>
          </div>
        ) : null}
        <h2>{sec.titulo}</h2>
        {sec.descripcion ? <p className="descripcion">{sec.descripcion}</p> : null}
      </div>
      {herramientas?.length ? <div className="herramientas">{herramientas}</div> : null}
    </div>
  );
}

function SeccionConsulta({ sec, pagina }) {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(sec.cargarAlInicio !== false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const exportarRef = useRef(null);
  const filtrosRef = useRef(null);
  const filtrosActuales = useRef({});

  const cargar = async (filtros = filtrosActuales.current) => {
    const preparados = sec.prepararFiltros ? sec.prepararFiltros(filtros) : filtros;
    filtrosActuales.current = filtros;
    setCargando(true);
    setError(null);
    try {
      const r = await obtener(sec.ruta, preparados);
      if (sec.transformar && r?.datos) {
        setResultado({ ...r, datos: sec.transformar(r.datos) });
      } else {
        setResultado(r);
      }
    } catch (err) {
      setError(err.message);
      setResultado(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (sec.cargarAlInicio === false) return undefined;
    cargar(filtrosRef.current ? filtrosRef.current.leer() : {});
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec.ruta]);

  const campos = camposDe(sec.filtros);
  const tieneDatos = Boolean(resultado?.datos?.length);

  const totalRegistrosActual = useMemo(() => {
    const lista = resultado?.datos || [];
    if (!terminoBusqueda.trim()) return lista.length;
    const t = terminoBusqueda.trim().toLowerCase();
    return lista.filter((f) => Object.values(f).some((v) => String(v ?? '').toLowerCase().includes(t))).length;
  }, [resultado?.datos, terminoBusqueda]);

  const herramientas = [
    ...permitidos(sec.botones || []).map((b) => {
      const { icono: ic, claseTono } = estiloAccion(b);
      return (
        <button
          key={b.texto}
          className={`boton ${b.primario ? 'primario' : claseTono}`}
          type="button"
          onClick={() => ejecutarAccion(b, null, () => cargar())}
        >
          <Icono nombre={ic} />
          <span>{b.texto}</span>
        </button>
      );
    }),
    <button key="act" className="boton-actualizar-pill" type="button" title="Actualizar datos" onClick={() => cargar()}>
      <Icono nombre="recargar" />
      <span>Actualizar</span>
    </button>,
  ];

  return (
    <section className="tarjeta">
      {/* 1. Título y descripción del módulo con botón de acción rápida superior */}
      <Encabezado sec={sec} pagina={pagina} herramientas={herramientas} />

      {/* 2. Resumen métrico de estados (conteo numérico por categoría sin gráficas) */}
      {resultado?.datos?.length ? (
        <MetricsSummary filas={resultado.datos} tituloModulo={sec.titulo} />
      ) : null}

      {/* 3. Barra de filtros unificada (Búsqueda + Selects + Contador de registros + Botón Exportar CSV) */}
      {campos.length ? (
        <Formulario
          key={sec.ruta}
          ref={filtrosRef}
          campos={campos}
          filtros
          textoEnviar="Aplicar filtros"
          alEnviar={async (datos) => cargar(datos)}
          alExportar={tieneDatos ? () => exportarRef.current?.() : null}
          terminoBusqueda={terminoBusqueda}
          alCambiarBusqueda={setTerminoBusqueda}
          cuentaRegistros={totalRegistrosActual}
        />
      ) : (
        <UnifiedFilterBar
          terminoBusqueda={terminoBusqueda}
          alCambiarBusqueda={setTerminoBusqueda}
          totalRegistros={totalRegistrosActual}
          alExportarCsv={tieneDatos ? () => exportarRef.current?.() : null}
          placeholderBusqueda="Filtrar en los resultados…"
        />
      )}

      {/* 4. Tabla o lista de datos ordenada con columnas claras y 5. Paginación */}
      {cargando ? <div className="resultado"><div className="cargando">Cargando…</div></div> : null}
      {!cargando && error ? <div className="resultado"><div className="error-form" role="alert">{error}</div></div> : null}
      {!cargando && !error && resultado ? (
        <div className="resultado">
          <ContenidoConsulta
            def={sec}
            r={resultado}
            recargar={() => cargar()}
            terminoBusqueda={terminoBusqueda}
            alCambiarBusqueda={setTerminoBusqueda}
            exportarRef={exportarRef}
          />
        </div>
      ) : null}
      {!cargando && !error && !resultado && sec.cargarAlInicio === false ? (
        <p className="descripcion">Complete los filtros de consulta y presione Aplicar filtros.</p>
      ) : null}
    </section>
  );
}

function SeccionResumen({ sec, pagina }) {
  const [fila, setFila] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await obtener(sec.ruta);
      setFila((r.datos || [])[0] || {});
    } catch (err) {
      setError(err.message);
      setFila(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec.ruta]);

  const grupos = sec.grupos || [{ tarjetas: sec.tarjetas || [] }];
  const filas = [];
  const tarjetasDestacadas = [];

  if (fila) {
    if (fila.fecha_corte) {
      filas.push({
        grupo: 'Corte',
        indicador: 'Fecha de corte',
        valor: formatearCelda('fecha_corte', fila.fecha_corte).contenido,
        detalle: 'Información al día',
      });
    }

    const agregarBarra = (barra, grupo) => {
      const total = Number(fila[barra.total]) || 0;
      const parte = Number(fila[barra.parte]) || 0;
      const porcentaje = total > 0 ? Math.min(100, Math.max(0, (parte / total) * 100)) : 0;
      filas.push({
        grupo,
        indicador: barra.etiqueta,
        valor: `${porcentaje.toFixed(1)} %`,
        detalle: 'Porcentaje del saldo que está vencido',
      });
    };

    const tonosRotacion = ['azul', 'coral', 'menta'];
    let idxTarjeta = 0;

    grupos.forEach((grupo) => {
      (grupo.tarjetas || []).forEach((t) => {
        const valor = t.calcular ? t.calcular(fila) : fila[t.campo];
        const vacio = valor === null || valor === undefined || valor === '';
        const valorFormateado = vacio ? '—' : (t.formato ? t.formato(valor) : String(valor));
        const tituloInd = t.etiqueta || etiquetaDe(t.campo || '');
        filas.push({
          grupo: grupo.titulo || 'Resumen',
          indicador: tituloInd,
          valor: valorFormateado,
          detalle: t.ayuda || '',
        });
        if (tarjetasDestacadas.length < 3) {
          tarjetasDestacadas.push({
            tono: tonosRotacion[idxTarjeta % tonosRotacion.length],
            icono: t.icono || 'moneda',
            titulo: tituloInd,
            valor: valorFormateado,
            subtitulo: t.ayuda || grupo.titulo || 'Resumen de cartera',
          });
          idxTarjeta += 1;
        }
      });
      if (grupo.barra) agregarBarra(grupo.barra, grupo.titulo || 'Resumen');
    });

    if (sec.barra) agregarBarra(sec.barra, 'Resumen');
  }

  const columnas = [
    { campo: 'grupo', etiqueta: 'Grupo' },
    { campo: 'indicador', etiqueta: 'Indicador' },
    { campo: 'valor', etiqueta: 'Valor' },
    { campo: 'detalle', etiqueta: 'Detalle' },
  ];

  return (
    <section className="tarjeta">
      <Encabezado
        sec={sec}
        pagina={pagina}
        herramientas={[
          <button key="act" className="boton-actualizar-pill" type="button" title="Actualizar datos" onClick={cargar}>
            <Icono nombre="recargar" />
            <span>Actualizar</span>
          </button>,
        ]}
      />
      {cargando ? <div className="cargando">Cargando…</div> : null}
      {!cargando && error ? <div className="error-form" role="alert">{error}</div> : null}
      {!cargando && !error && fila ? (
        <div className="resultado">
          {tarjetasDestacadas.length ? (
            <div className="tarjetas-repositorio-grid">
              {tarjetasDestacadas.map((t, i) => (
                <div className="tarjeta-repositorio" key={i}>
                  <div className={`tarjeta-repositorio-icono tono-${t.tono}`}>
                    <Icono nombre={t.icono} />
                  </div>
                  <div className="tarjeta-repositorio-info">
                    <span className="tarjeta-repositorio-titulo">{t.titulo}</span>
                    <strong className="tarjeta-repositorio-valor">{t.valor}</strong>
                    <small className="tarjeta-repositorio-sub">{t.subtitulo}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <Tabla filas={filas} columnas={columnas} nombreArchivo="resumen-cartera" />
        </div>
      ) : null}
    </section>
  );
}

function SeccionFormulario({ sec, pagina }) {
  const [clave, setClave] = useState(0);

  return (
    <section className="tarjeta">
      <Encabezado sec={sec} pagina={pagina} />
      <div className="form-panel">
        <Formulario
          key={clave}
          campos={camposDe(sec.campos)}
          textoEnviar={sec.textoEnviar || 'Guardar'}
          alEnviar={async (datos) => {
            const r = await api(sec.metodo || 'POST', resolver(sec.ruta, datos), datos);
            avisar(sec.exito ? sec.exito(r, datos) : 'Registro guardado.');
            if (sec.mostrarResultado) mostrarResultado(sec.titulo, r, sec.titulosResultado);
            if (sec.limpiar !== false) setClave((n) => n + 1);
          }}
        />
      </div>
    </section>
  );
}

function SeccionAcciones({ sec, pagina }) {
  return (
    <section className="tarjeta">
      <Encabezado sec={sec} pagina={pagina} />
      <div className="herramientas">
        <Botones lista={sec.botones || []} />
      </div>
    </section>
  );
}

const TIPOS = {
  consulta: SeccionConsulta,
  formulario: SeccionFormulario,
  acciones: SeccionAcciones,
  resumen: SeccionResumen,
};

export function seccionesVisibles(pagina, puede = (p) => sesion.puede(p)) {
  if (pagina.requiereTodos?.some((p) => !puede([p]))) return [];
  return (pagina.secciones || []).filter((s) => puede(s.permisos ?? pagina.permisos ?? []));
}

export function MotorPagina({ pagina }) {
  const secciones = seccionesVisibles(pagina);
  const [searchParams] = useSearchParams();

  if (!secciones.length) {
    return <div className="tarjeta">Su rol no tiene acceso a ninguna sección de este módulo.</div>;
  }

  const paramSec = Number(searchParams.get('sec'));
  const indice = Number.isInteger(paramSec) && paramSec >= 0 && paramSec < secciones.length ? paramSec : 0;
  const sec = secciones[indice];
  const Tipo = TIPOS[sec.tipo || 'consulta'];

  return <Tipo key={`${pagina.id}-${indice}`} sec={sec} pagina={pagina} />;
}
