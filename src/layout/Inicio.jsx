import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtener } from '../api.js';
import { useSesion } from '../contexto/Sesion.jsx';
import { seccionesVisibles } from '../motor/MotorPagina.jsx';
import { PAGINAS } from '../paginas/index.js';
import { fechas } from '../paginas/comunes.js';
import { P } from '../permisos.js';
import { moneda } from '../ui/formato.js';

const enCurso = (f) => f.estado === 'Programado' || f.estado === 'En proceso';
const suma = (filas, campo) => filas.reduce((t, f) => t + (Number(f[campo]) || 0), 0);

const INDICADORES = [
  {
    titulo: 'Mis mantenimientos', destino: 'mantenimiento', permisos: [P.EJECUTAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/mios'),
    valor: (d) => d.filter(enCurso).length, detalle: () => 'programados o en proceso',
  },
  {
    titulo: 'Medidores sin lectura', destino: 'facturacion',
    permisos: [P.CONSULTAR_ABONADOS, P.GESTIONAR_ABONADOS, P.REGISTRAR_LECTURA, P.REGISTRAR_INCIDENCIA, P.CONSULTAR_FACTURAS],
    cargar: () => obtener('/medidores/sin-lectura'),
    valor: (d) => d.length, detalle: () => 'en el mes actual',
  },
  {
    titulo: 'Facturas por cobrar', destino: 'pagos',
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/facturas/pendientes'),
    valor: (d) => d.length, detalle: (d) => `${moneda(suma(d, 'saldo'))} de saldo`,
  },
  {
    titulo: 'Abonados morosos', destino: 'pagos', alerta: true,
    permisos: [P.CONSULTAR_PAGOS, P.GESTIONAR_PAGOS],
    cargar: () => obtener('/mora/morosos'),
    valor: (d) => d.length, detalle: (d) => `${moneda(suma(d, 'saldo_vencido'))} vencido`,
  },
  {
    titulo: 'Alertas de consumo', destino: 'facturacion', alerta: true,
    permisos: [P.CONSULTAR_FACTURAS, P.GESTIONAR_FACTURACION],
    cargar: () => obtener('/alertas/activas'),
    valor: (d) => d.length, detalle: () => 'abiertas',
  },
  {
    titulo: 'Incidencias abiertas', destino: 'mantenimiento', alerta: true,
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
    cargar: () => obtener('/incidencias/abiertas'),
    valor: (d) => d.length, detalle: (d) => `${d.filter((f) => f.prioridad === 'Alta').length} de prioridad alta`,
  },
  {
    titulo: 'Mantenimientos pendientes', destino: 'mantenimiento',
    permisos: [P.CONSULTAR_MANTENIMIENTO, P.GESTIONAR_MANTENIMIENTO],
    cargar: () => obtener('/mantenimientos/pendientes'),
    valor: (d) => d.length, detalle: () => 'sin finalizar',
  },
  {
    titulo: 'Usuarios bloqueados', destino: 'seguridad', alerta: true,
    permisos: [P.GESTIONAR_SEGURIDAD],
    cargar: () => obtener('/seguridad/usuarios/bloqueados'),
    valor: (d) => d.length, detalle: () => 'por intentos fallidos',
  },
  {
    titulo: 'Respaldos (7 días)', destino: 'respaldos',
    permisos: [P.RESPALDOS],
    cargar: () => obtener('/respaldos/historial', { desde: fechas.haceDias(7) }),
    valor: (d) => d.filter((f) => f.estado === 'Exitoso').length,
    detalle: (d) => `${d.filter((f) => f.estado === 'Fallido').length} fallidos`,
  },
  {
    titulo: 'Cargas ETL fallidas', destino: 'dw', alerta: true,
    permisos: [P.ETL],
    cargar: () => obtener('/dw/etl/fallidas'),
    valor: (d) => d.length, detalle: () => 'sin reintentar',
  },
];

function Indicador({ def }) {
  const [valor, setValor] = useState('…');
  const [detalle, setDetalle] = useState('\u00a0');
  const [alerta, setAlerta] = useState(false);

  useEffect(() => {
    let vivo = true;
    def.cargar()
      .then((r) => {
        if (!vivo) return;
        const n = def.valor(r.datos);
        setValor(n);
        setDetalle(def.detalle(r.datos));
        if (def.alerta && n > 0) setAlerta(true);
      })
      .catch(() => {
        if (!vivo) return;
        setValor('—');
        setDetalle('No disponible');
      });
    return () => { vivo = false; };
  }, [def]);

  return (
    <Link className={`indicador${alerta ? ' alerta' : ''}`} to={`/${def.destino}`}>
      <small>{def.titulo}</small>
      <strong>{valor}</strong>
      <span>{detalle}</span>
    </Link>
  );
}

export function Inicio() {
  const { actual, puede } = useSesion();
  const u = actual.usuario;
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const disponibles = INDICADORES.filter((i) => puede(i.permisos));
  const accesos = PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0);

  return (
    <>
      <div className="saludo">
        <h2>{`${saludo}, ${(u.nombre_empleado || u.nombre_usuario).split(' ')[0]}`}</h2>
        <p>{`${u.nombre_rol}${u.puesto ? ` · ${u.puesto}` : ''}`}</p>
      </div>
      {disponibles.length ? (
        <div className="indicadores">
          {disponibles.map((def) => <Indicador key={def.titulo} def={def} />)}
        </div>
      ) : null}
      <section className="tarjeta">
        <h2>Módulos</h2>
        <p className="descripcion">Solo se muestran los módulos a los que su rol tiene acceso.</p>
        <div className="indicadores" style={{ margin: 0 }}>
          {accesos.map((p) => (
            <Link key={p.id} className="indicador modulo" to={`/${p.id}`}>
              <strong>{p.titulo}</strong>
              <span>{seccionesVisibles(p, puede).map((s) => s.pestana || s.titulo).join(' · ')}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
