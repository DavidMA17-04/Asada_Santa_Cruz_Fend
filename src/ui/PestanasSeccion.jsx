/**
 * Barra de pestañas internas de una sección.
 * Se usa cuando una etapa del módulo tiene varias vistas relacionadas
 * (por ejemplo: Facturas → Por cobrar / Estado de cuenta).
 */
export function PestanasSeccion({ vistas = [], activa = 0, alCambiar }) {
  if (vistas.length < 2) return null;

  return (
    <div className="vistas-pestanas" role="tablist" aria-label="Vistas de la sección">
      {vistas.map((vista, indice) => {
        const texto = vista.pestana || vista.titulo || `Vista ${indice + 1}`;
        const seleccionada = indice === activa;
        return (
          <button
            key={`${texto}-${indice}`}
            type="button"
            role="tab"
            aria-selected={seleccionada}
            className={`vista-pestana${seleccionada ? ' activa' : ''}`}
            onClick={() => alCambiar?.(indice)}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}

export default PestanasSeccion;
