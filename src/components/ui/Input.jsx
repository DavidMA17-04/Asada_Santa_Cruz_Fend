import { useState } from 'react';
import { Icono } from '../../ui/Icono.jsx';

export function Input({
  id,
  name,
  type = 'text',
  value = '',
  onChange,
  onClear,
  placeholder = 'Buscar por nombre, correo…',
  icono,
  iconoDerecha,
  disabled = false,
  required = false,
  className = '',
  variant = 'default', // 'default' (rounded-xl) | 'pill' (rounded-full)
  clearable = false,
  ...props
}) {
  const [verPassword, setVerPassword] = useState(false);
  const esPassword = type === 'password';
  const tipoFinal = esPassword ? (verPassword ? 'text' : 'password') : type;

  const esPill = variant === 'pill' || type === 'search';
  const radioClase = esPill ? 'rounded-full' : 'rounded-xl';

  return (
    <div className={`relative flex items-center w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      {icono ? (
        <span className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none transition-colors">
          <Icono nombre={icono} tamano={15} />
        </span>
      ) : null}

      <input
        id={id}
        name={name}
        type={tipoFinal}
        value={value ?? ''}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value, e)}
        className={`w-full py-2.5 text-sm transition-all outline-none
          ${icono ? 'pl-9.5' : 'pl-4'}
          ${(clearable && value) || esPassword || iconoDerecha ? 'pr-9.5' : 'pr-4'}
          ${radioClase}
          bg-[var(--superficie)] dark:bg-slate-900/60
          text-[var(--texto)] dark:text-slate-100
          border border-[var(--borde)] dark:border-slate-700/60
          placeholder:text-[var(--texto-suave)] dark:placeholder:text-slate-400 placeholder:opacity-75
          hover:border-[var(--acento)] dark:hover:border-sky-400/60
          focus:border-[var(--acento)] focus:ring-2 focus:ring-sky-400/40 focus:bg-[var(--superficie)]
          shadow-xs
          ${className}`}
        {...props}
      />

      {/* Acciones del lado derecho */}
      {esPassword ? (
        <button
          type="button"
          onClick={() => setVerPassword((v) => !v)}
          className="absolute right-3.5 p-1 text-slate-400 hover:text-[var(--acento)] transition-colors focus:outline-none"
          title={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          tabIndex={-1}
        >
          <Icono nombre={verPassword ? 'ojo-off' : 'ojo'} tamano={15} />
        </button>
      ) : clearable && value && !disabled ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onClear) onClear();
            else onChange?.('');
          }}
          className="absolute right-3.5 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs transition-colors focus:outline-none cursor-pointer"
          title="Limpiar"
          tabIndex={-1}
        >
          ✕
        </button>
      ) : iconoDerecha ? (
        <span className="absolute right-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
          <Icono nombre={iconoDerecha} tamano={15} />
        </span>
      ) : null}
    </div>
  );
}

export default Input;
