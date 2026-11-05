import React from 'react';
import * as LucideIcons from 'lucide-react';

const MAPA_LUCIDE = {
  gota: LucideIcons.Droplet,
  inicio: LucideIcons.Home,
  usuarios: LucideIcons.Users,
  perfil: LucideIcons.User,
  medidor: LucideIcons.Gauge,
  factura: LucideIcons.Receipt,
  pago: LucideIcons.CreditCard,
  herramienta: LucideIcons.Wrench,
  escudo: LucideIcons.ShieldCheck,
  lista: LucideIcons.List,
  grafico: LucideIcons.BarChart3,
  base: LucideIcons.Database,
  respaldo: LucideIcons.HardDriveDownload,
  menu: LucideIcons.Menu,
  panel: LucideIcons.LayoutDashboard,
  descargar: LucideIcons.Download,
  recargar: LucideIcons.RotateCcw,
  mas: LucideIcons.Plus,
  buscar: LucideIcons.Search,
  filtro: LucideIcons.Filter,
  chevron: LucideIcons.ChevronRight,
  limpiar: LucideIcons.X,
  sol: LucideIcons.Sun,
  luna: LucideIcons.Moon,
  alerta: LucideIcons.AlertTriangle,
  check: LucideIcons.Check,
  exito: LucideIcons.CheckCircle2,
  flecha: LucideIcons.ArrowRight,
  izquierda: LucideIcons.ChevronLeft,
  derecha: LucideIcons.ChevronRight,
  abajo: LucideIcons.ChevronDown,
  reloj: LucideIcons.Clock,
  campana: LucideIcons.Bell,
  calendario: LucideIcons.Calendar,
  ojo: LucideIcons.Eye,
  'ojo-off': LucideIcons.EyeOff,
  llave: LucideIcons.Key,
  salir: LucideIcons.LogOut,
  editar: LucideIcons.Pencil,
  peligro: LucideIcons.Trash2,
  estadistica: LucideIcons.LineChart,
  info: LucideIcons.Info,
  historial: LucideIcons.History,
  desactivar: LucideIcons.PowerOff,
  modificar: LucideIcons.Pencil,
  ver: LucideIcons.Eye,
  registrar: LucideIcons.PlusCircle,
  agregar: LucideIcons.PlusCircle,
  crear: LucideIcons.Plus,
};

export function Icono({ nombre, className = '', tamano = 18 }) {
  if (!nombre) return null;
  const Componente = MAPA_LUCIDE[nombre];
  if (!Componente) return null;
  return (
    <Componente
      size={tamano}
      className={`icono shrink-0 inline-block align-middle ${className}`.trim()}
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

export const icono = (nombre, tamano = 18) => <Icono nombre={nombre} tamano={tamano} />;

export default Icono;
