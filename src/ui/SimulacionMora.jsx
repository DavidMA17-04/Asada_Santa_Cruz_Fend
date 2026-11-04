import { useEffect, useState } from 'react';
import { api, obtener } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { P } from '../permisos.js';
import { MetricCard } from '../components/ui/MetricCard.jsx';
import { Tabla } from './Tabla.jsx';
import { Icono } from './Icono.jsx';
import { avisar, confirmar } from './registro.js';
import { moneda, numero } from './formato.js';

const COLUMNAS = [
  { campo: 'abonado', etiqueta: 'Abonado' },
  { campo: 'id_conexion', etiqueta: 'Conexión' },
  { campo: 'saldo_vencido', etiqueta: 'Saldo vencido' },
  { campo: 'dias_atraso', etiqueta: 'Días de atraso' },
];

/** Simulación de suspensión por morosidad: ajusta los límites y muestra el impacto. */
export function SimulacionMora({ sec }) {
  const { puede } = useSesion();
  const [dias, setDias] = useState(90);
  const [saldo, setSaldo] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  async function simular(d = dias, s = saldo) {
    setCargando(true);
    setError(null);
    try {
      const r = await api('POST', '/mora/suspender', {
        solo_simular: true,
        dias_minimos: Number(d),
        saldo_minimo: Number(s),
      });
      setResultado(r);
    } catch (err) {
      setError(err.message);
      setResultado(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let vivo = true;
    obtener('/mora/parametros')
      .then((r) => {
        if (!vivo) return;
        const mapa = Object.fromEntries((r.datos || []).map((p) => [p.nombre, Number(p.valor)]));
        const d = mapa.dias_mora_suspension ?? 90;
        const s = mapa.saldo_minimo_suspension ?? 0;
        setDias(d);
        setSaldo(s);
        simular(d, s);
      })
      .catch(() => {
        if (vivo) {
          setCargando(false);
          simular(90, 0);
        }
      });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = resultado?.conjuntos?.[0]?.[0] || null;
  const afectadas = resultado?.conjuntos?.[1] || [];
  const cantidad = Number(resumen?.conexiones_suspendidas) || afectadas.length;
  const saldoAfectado = afectadas.reduce((total, f) => total + (Number(f.saldo_vencido) || 0), 0);

  async function suspender() {
    const ok = await confirmar(
      `Se suspenderán ${cantidad} conexiones con los límites actuales (${dias} días, ${moneda(Number(saldo))}). ¿Continuar?`,
      { textoAceptar: 'Suspender', peligro: true },
    );
    if (!ok) return;
    try {
      const r = await api('POST', '/mora/suspender', {
        dias_minimos: Number(dias),
        saldo_minimo: Number(saldo),
      });
      avisar(`${r.salida?.suspendidas ?? 0} conexiones suspendidas.`);
      simular();
    } catch (err) {
      avisar(err.message, 'error');
    }
  }

  return (
    <section className="tarjeta">
      <div className="encabezado-seccion">
        <div>
          <h2>{sec.titulo}</h2>
          {sec.descripcion ? <p className="descripcion">{sec.descripcion}</p> : null}
        </div>
      </div>

      <form
        className="simulacion-form"
        onSubmit={(evento) => {
          evento.preventDefault();
          simular();
        }}
      >
        <div className="campo">
          <label htmlFor="sim-dias">Días mínimos de atraso</label>
          <input
            id="sim-dias"
            type="number"
            min="0"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="sim-saldo">Saldo mínimo (₡)</label>
          <input
            id="sim-saldo"
            type="number"
            min="0"
            step="0.01"
            value={saldo}
            onChange={(e) => setSaldo(e.target.value)}
          />
        </div>
        <button className="boton" type="submit" disabled={cargando}>
          {cargando ? 'Simulando…' : 'Simular'}
        </button>
      </form>

      {error ? <div className="error-form" role="alert">{error}</div> : null}

      {resultado ? (
        <>
          <div className="simulacion-resumen">
            <MetricCard
              titulo="Conexiones a suspender"
              valor={numero(cantidad)}
              detalle={`Con ${dias} días o más de atraso`}
              tono={cantidad > 0 ? 'rojo' : 'verde'}
              icono={cantidad > 0 ? 'alerta' : 'check'}
            />
            <MetricCard
              titulo="Saldo vencido afectado"
              valor={moneda(saldoAfectado)}
              detalle={`${afectadas.length} conexiones en la simulación`}
              tono="ambar"
              icono="factura"
            />
          </div>

          {cantidad === 0 ? (
            <div className="simulacion-vacia">
              <Icono nombre="check" />
              <div>
                <strong>Sin suspensiones con estos límites</strong>
                <span>Baje los días mínimos o el saldo mínimo para ver más resultados.</span>
              </div>
            </div>
          ) : (
            <>
              <Tabla
                filas={afectadas}
                columnas={COLUMNAS}
                mensajeVacio="No hay conexiones que cumplan los límites."
                nombreArchivo="simulacion-suspension"
              />
              <div className="simulacion-acciones">
                <button className="boton" type="button" onClick={() => simular()}>
                  Volver a simular
                </button>
                {puede([P.GESTIONAR_PAGOS]) ? (
                  <button className="boton peligro lleno" type="button" onClick={suspender}>
                    {`Suspender ${cantidad} conexiones`}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </>
      ) : null}
    </section>
  );
}

export default SimulacionMora;
