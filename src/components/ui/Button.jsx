import { Icono } from '../../ui/Icono.jsx';

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'refresh' | 'view' | 'edit' | 'delete' | 'outline' | 'export'
  icono,
  disabled = false,
  cargando = false,
  className = '',
  title,
  size = 'md', // 'sm' | 'md' | 'lg'
  ...props
}) {
  let estiloBase = 'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';
  let estiloVariante = '';
  let iconoAuto = icono;
  let tamanoIcono = 15;

  switch (variant) {
    case 'refresh':
      estiloVariante = 'rounded-full border border-sky-400/50 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-400/70 shadow-xs px-4 py-2 text-sm hover:-translate-y-0.5 transition-all duration-200';
      iconoAuto = iconoAuto || 'recargar';
      tamanoIcono = 14;
      break;

    case 'view':
      estiloVariante = 'boton-accion-ver';
      iconoAuto = iconoAuto || 'ojo';
      tamanoIcono = 13;
      break;

    case 'edit':
      estiloVariante = 'boton-accion-editar';
      iconoAuto = iconoAuto || 'editar';
      tamanoIcono = 13;
      break;

    case 'delete':
    case 'danger':
      estiloVariante = 'boton-accion-peligro';
      iconoAuto = iconoAuto || 'peligro';
      tamanoIcono = 13;
      break;

    case 'export':
      // Clase CSS propia: el color global de button gana sobre utilidades Tailwind
      estiloVariante = 'boton-exportar shadow-xs';
      iconoAuto = iconoAuto || 'descargar';
      tamanoIcono = 13;
      break;

    case 'outline':
      estiloVariante = 'rounded-full border border-[var(--borde)] dark:border-slate-700/70 bg-transparent text-[var(--texto)] dark:text-slate-300 hover:bg-slate-800/40 hover:border-[var(--acento)] px-3 py-1 text-xs shadow-2xs';
      tamanoIcono = 13;
      break;

    case 'primary':
    default:
      estiloVariante = 'rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:via-sky-400 hover:to-cyan-400 text-white font-semibold shadow-sm shadow-sky-500/25 hover:shadow-md hover:shadow-sky-500/35 border border-sky-400/40 px-4 py-2 text-sm hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:scale-[0.98]';
      tamanoIcono = 15;
      break;
  }

  if (size === 'sm' && variant !== 'view' && variant !== 'edit' && variant !== 'delete' && variant !== 'export' && variant !== 'outline') {
    estiloVariante += ' px-2.5 py-1 text-xs';
  }

  return (
    <button
      type={type}
      disabled={disabled || cargando}
      onClick={onClick}
      title={title}
      className={`${estiloBase} ${estiloVariante} ${className}`}
      {...props}
    >
      {cargando ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : iconoAuto ? (
        <Icono nombre={iconoAuto} tamano={tamanoIcono} />
      ) : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

export default Button;
