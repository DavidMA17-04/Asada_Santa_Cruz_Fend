const TRAZOS = {
  gota: '<path d="M12 2.7C8.4 7.6 6 11 6 14.5a6 6 0 0 0 12 0C18 11 15.6 7.6 12 2.7z"/>',
  inicio: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  medidor: '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M8 5.5V3h8v2.5"/>',
  factura: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  pago: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>',
  herramienta: '<path d="M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"/>',
  escudo: '<path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/><path d="M9 12l2 2 4-4"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  grafico: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
  base: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  respaldo: '<path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M12 3v12M7 10l5 5 5-5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  descargar: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  recargar: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  alerta: '<path d="M12 3.5 21 20H3z"/><path d="M12 9v5M12 17.5v.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  campana: '<path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  ojo: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'ojo-off': '<path d="M3 3l18 18"/><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.1 3.7M6.1 6.1C3.5 8 2 12 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  llave: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M17 6l2 2M15 8l2 2"/>',
  salir: '<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
};

export function Icono({ nombre, className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: TRAZOS[nombre] || '' }}
    />
  );
}

export const icono = (nombre) => <Icono nombre={nombre} />;
