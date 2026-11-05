import { Link } from 'react-router-dom';
import { useSesion } from '../contexto/Sesion.jsx';
import { Icono } from '../ui/index.js';

// Se muestra cuando el rol entra (por enlace o escribiendo la URL) a un módulo
// que no le corresponde. La API igual rechazaría las consultas.
export function SinPermiso({ modulo, destino }) {
  const { actual } = useSesion();
  const rol = actual?.usuario?.nombre_rol;

  return (
    <section className="tarjeta sin-permiso">
      <Icono nombre="escudo" tamano={36} />
      <h2>Sin acceso a este módulo</h2>
      <p>
        {modulo ? `«${modulo}» no está disponible` : 'Esta pantalla no está disponible'}
        {rol ? ` para el rol ${rol}.` : ' para su rol.'}
        {' '}Si lo necesita, pida al administrador del sistema que le asigne el permiso.
      </p>
      <Link className="boton primario" to={destino}>Ir a mi inicio</Link>
    </section>
  );
}
