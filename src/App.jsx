import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useSesion } from './contexto/Sesion.jsx';
import { Inicio } from './layout/Inicio.jsx';
import { Login } from './layout/Login.jsx';
import { Marco } from './layout/Marco.jsx';
import { SinPermiso } from './layout/SinPermiso.jsx';
import { MotorPagina, seccionesVisibles } from './motor/MotorPagina.jsx';
import { PAGINAS } from './paginas/index.js';
import { inicioDelRol } from './roles.js';

function Rutas() {
  const { actual, puede } = useSesion();
  const visibles = PAGINAS.filter((p) => seccionesVisibles(p, puede).length > 0);
  // Cada rol entra a su pantalla: Fontanero a su jornada, Junta a su tablero, etc.
  const inicioRol = inicioDelRol(actual?.usuario?.nombre_rol, visibles);

  return (
    <Routes>
      <Route element={<Marco />}>
        <Route path="/" element={<Navigate to={inicioRol} replace />} />
        <Route path="/inicio" element={<Inicio />} />
        {PAGINAS.map((p) => (
          <Route
            key={p.id}
            path={`/${p.id}`}
            element={visibles.includes(p)
              ? <MotorPagina key={p.id} pagina={p} />
              : <SinPermiso modulo={p.titulo} destino={inicioRol} />}
          />
        ))}
        <Route path="*" element={<Navigate to={inicioRol} replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { actual, listo, mensajeExpiracion } = useSesion();

  if (!listo) return <div className="cargando">Cargando…</div>;
  if (!actual?.token) return <Login mensaje={mensajeExpiracion} />;

  return (
    <HashRouter>
      <Rutas />
    </HashRouter>
  );
}
