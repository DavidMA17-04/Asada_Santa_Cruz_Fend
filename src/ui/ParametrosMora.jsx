import { moneda, numero } from './formato.js';

const ETIQUETAS = {
  dias_mora_suspension: 'Días de mora para suspender',
  saldo_minimo_suspension: 'Saldo mínimo para suspender',
  plazo_pago_dias: 'Plazo de pago',
};

const fecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'short' }).format(d);
};

/** Parámetros de morosidad como tarjetas de configuración. */
export function ParametrosMora({ filas = [], acciones = [], alAccion }) {
  const editar = acciones.find((a) => /editar/i.test(a.texto || ''));

  return (
    <div className="parametros-grid">
      {filas.map((fila) => {
        const esMoneda = /saldo|monto/i.test(fila.nombre);
        return (
          <div className="parametro-card" key={fila.nombre}>
            <div className="parametro-cabecera">
              <span>{ETIQUETAS[fila.nombre] || fila.nombre}</span>
              <strong>
                {esMoneda ? moneda(Number(fila.valor) || 0) : numero(Number(fila.valor) || 0)}
              </strong>
            </div>
            <p>{fila.descripcion || 'Sin descripción.'}</p>
            <div className="parametro-pie">
              <small>{`Modificado: ${fecha(fila.fecha_modificacion)}`}</small>
              {editar ? (
                <button
                  className="boton chico"
                  type="button"
                  onClick={() => alAccion?.(editar, fila)}
                >
                  Editar
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ParametrosMora;
