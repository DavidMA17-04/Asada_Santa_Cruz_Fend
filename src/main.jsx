import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { SesionProvider } from './contexto/Sesion.jsx';
import { UiProvider } from './ui/Ui.jsx';
import './estilos.css';

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <SesionProvider>
      <UiProvider>
        <App />
      </UiProvider>
    </SesionProvider>
  </StrictMode>,
);
