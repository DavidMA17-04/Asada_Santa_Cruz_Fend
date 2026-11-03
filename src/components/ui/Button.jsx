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
      estiloVariante = 'rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:border-sky-400/60 shadow-xs px-4 py-2 text-sm';
      iconoAuto = iconoAuto || 'recargar';
      tamanoIcono = 14;
      break;

    case 'view':
      // Botón Ver: estilo outline / neutro redondeado con icono de ojo
      estiloVariante = 'rounded-full border border-slate-600/50 bg-slate-800/40 text-slate-300 hover:bg-slate-700/60 hover:text-white hover:border-slate-500 px-3 py-1 text-xs shadow-2xs';
      iconoAuto = iconoAuto || 'ojo';
      tamanoIcono = 13;
      break;

    case 'edit':
      // Botón Editar: estilo outline / azul suave con icono de lápiz
      estiloVariante = 'rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:border-sky-400/70 px-3 py-1 text-xs shadow-2xs';
      iconoAuto = iconoAuto || 'editar';
      tamanoIcono = 13;
      break;

    case 'delete':
    case 'danger':
      // Botón Eliminar: estilo pill con borde o fondo rojizo translúcido
      estiloVariante = 'rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 px-3 py-1 text-xs shadow-2xs';
      iconoAuto = iconoAuto || 'peligro';
      tamanoIcono = 13;
      break;

    case 'export':
      // Botón Exportar CSV con diseño redondeado e icono de descarga
      estiloVariante = 'rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 shadow-xs px-3.5 py-1.5 text-xs';
      iconoAuto = iconoAuto || 'descargar';
      tamanoIcono = 13;
      break;

    case 'outline':
      estiloVariante = 'rounded-full border border-[var(--borde)] dark:border-slate-700/70 bg-transparent text-[var(--texto)] dark:text-slate-300 hover:bg-slate-800/40 hover:border-[var(--acento)] px-3 py-1 text-xs shadow-2xs';
      tamanoIcono = 13;
      break;

    case 'primary':
    default:
      estiloVariante = 'rounded-xl bg-[#0C3B5E] text-white hover:bg-[#1A5B8C] border border-[#0C3B5E]/20 shadow-xs px-4 py-2 text-sm';
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
