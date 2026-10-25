import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useSesion } from './contexto/Sesion.jsx';
import { Inicio } from './layout/Inicio.jsx';
import { Login } from './layout/Login.jsx';
import { Marco } from './layout/Marco.jsx';
import { MotorPagina } from './motor/MotorPagina.jsx';
import { PAGINAS } from './paginas/index.js';

function Rutas() {
  return (
    <Routes>
      <Route element={<Marco />}>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<Inicio />} />
        {PAGINAS.map((p) => (
          <Route key={p.id} path={`/${p.id}`} element={<MotorPagina key={p.id} pagina={p} />} />
        ))}
        <Route path="*" element={<Navigate to="/inicio" replace />} />
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
