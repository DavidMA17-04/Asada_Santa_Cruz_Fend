import { useEffect, useRef, useState } from 'react';
import { Icono } from '../../ui/Icono.jsx';

export function Select({
  id,
  name,
  value,
  onChange,
  opciones = [],
  placeholder = 'Seleccione…',
  disabled = false,
  required = false,
  icono,
  variant = 'pill', // 'pill' (rounded-full) | 'default' (rounded-xl)
  className = '',
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  // Normalizar opciones
  const listaOpciones = opciones.map((op) =>
    typeof op === 'string' ? { valor: op, texto: op } : op
  );

  const opcionSeleccionada = listaOpciones.find(
    (op) => String(op.valor) === String(value)
  );

  // Cerrar al hacer clic fuera o presionar Esc
  useEffect(() => {
    function clickFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function tecla(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', clickFuera);
      document.addEventListener('keydown', tecla);
    }
    return () => {
      document.removeEventListener('mousedown', clickFuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const textoMostrado = opcionSeleccionada ? opcionSeleccionada.texto : placeholder;
  const tieneValor = value !== undefined && value !== null && value !== '';

  const radioClase = variant === 'pill' ? 'rounded-full' : 'rounded-xl';

  return (
    <div
      ref={contenedorRef}
      className={`relative inline-block w-full min-w-[150px] ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Botón visual del selector tipo píldora */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setAbierto((prev) => !prev)}
        className={`w-full py-2.5 text-sm flex items-center justify-between gap-2.5 transition-all outline-none text-left
          ${icono ? 'pl-9.5' : 'pl-4'} pr-9.5
          ${radioClase}
          bg-[var(--superficie)]
          border border-[var(--borde)]
          hover:border-[var(--acento)]
          ${tieneValor ? 'text-[var(--texto)] font-medium' : 'text-[var(--texto-suave)]'}
          ${abierto ? 'ring-2 ring-[color-mix(in_srgb,var(--acento)_35%,transparent)] border-[var(--acento)]' : ''}
          shadow-xs cursor-pointer select-none`}
      >
        {icono ? (
          <span className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
            <Icono nombre={icono} tamano={15} />
          </span>
        ) : null}

        <span className="truncate block">{textoMostrado}</span>

        <span
          className={`absolute right-3.5 flex items-center justify-center text-slate-400 transition-transform duration-200 pointer-events-none ${abierto ? 'rotate-180 text-sky-400' : ''}`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </span>
      </button>

      {/* Menú flotante moderno sin barras toscas */}
      {abierto && !disabled ? (
        <div
          className="select-menu-flotante absolute z-50 left-0 mt-1.5 w-full min-w-[180px] max-h-60 overflow-y-auto rounded-xl
            bg-[var(--superficie)] border border-[var(--borde)] shadow-xl py-1 backdrop-blur-md"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {!required && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.('');
                setAbierto(false);
              }}
              className={`select-menu-item w-full text-left px-3.5 py-2 text-xs text-[var(--texto-suave)] hover:bg-sky-500/10 hover:text-sky-400 transition-colors flex items-center justify-between cursor-pointer
                ${!tieneValor ? 'font-semibold text-sky-400 bg-sky-500/5' : ''}`}
            >
              <span>{placeholder}</span>
              {!tieneValor && <span>✓</span>}
            </button>
          )}

          {listaOpciones.map((op) => {
            const estaActivo = String(op.valor) === String(value);
            return (
              <button
                key={String(op.valor)}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange?.(op.valor);
                  setAbierto(false);
                }}
                className={`select-menu-item w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center justify-between cursor-pointer
                  hover:bg-sky-500/10 hover:text-sky-400
                  ${estaActivo ? 'bg-sky-500/10 text-sky-400 font-semibold' : 'text-[var(--texto)] dark:text-slate-200'}`}
              >
                <span className="truncate mr-2">{op.texto}</span>
                {estaActivo && <span className="text-sky-400 text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default Select;
