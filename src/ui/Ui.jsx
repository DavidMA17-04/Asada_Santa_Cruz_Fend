import { useCallback, useEffect, useRef, useState } from 'react';
import { registrarUi } from './registro.js';

let seq = 0;

function Dialogo({ modal, onCerrar }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    let vivo = true;
    // showModal en el siguiente frame evita que un close residual del Strict Mode
    // (cleanup del mount anterior) tumbe el modal recién abierto.
    const id = requestAnimationFrame(() => {
      if (!vivo || !el) return;
      try { if (!el.open) el.showModal(); } catch { /* ya visible */ }
    });
    const alClose = () => {
      if (vivo) onCerrar(modal.id);
    };
    // Evita cierre accidental por fondo o Esc; se sale con Cancelar / ×.
    const alCancel = (e) => e.preventDefault();
    el.addEventListener('close', alClose);
    el.addEventListener('cancel', alCancel);
    return () => {
      vivo = false;
      cancelAnimationFrame(id);
      el.removeEventListener('close', alClose);
      el.removeEventListener('cancel', alCancel);
      // No llamar el.close() aquí: el evento close puede llegar al siguiente mount
      // y disparar onCerrar, dejando el modal “sin hacer nada”.
    };
  }, [modal.id, onCerrar]);

  return (
    <dialog ref={ref} className={`modal ${modal.tamano || ''}`}>
      <div className="modal-cabecera">
        <h2>{modal.titulo}</h2>
        <button className="modal-cerrar" type="button" aria-label="Cerrar" onClick={() => ref.current?.close()}>×</button>
      </div>
      <div className="modal-cuerpo">{modal.contenido}</div>
    </dialog>
  );
}

export function UiProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const [modales, setModales] = useState([]);
  const alCerrarRef = useRef(new Map());

  const avisar = useCallback((mensaje, tipo = 'exito') => {
    const id = ++seq;
    setAvisos((lista) => [...lista, { id, mensaje, tipo }]);
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), tipo === 'error' ? 7000 : 4000);
  }, []);

  const quitarModal = useCallback((id) => {
    setModales((lista) => lista.filter((m) => m.id !== id));
    const fn = alCerrarRef.current.get(id);
    alCerrarRef.current.delete(id);
    fn?.();
  }, []);

  const abrirModal = useCallback((titulo, contenido, { tamano = '', alCerrar } = {}) => {
    const id = ++seq;
    if (alCerrar) alCerrarRef.current.set(id, alCerrar);
    setModales((lista) => [...lista, { id, titulo, contenido, tamano }]);
    return {
      cerrar() { quitarModal(id); },
      reemplazar(nuevo) {
        setModales((lista) => lista.map((m) => (m.id === id ? { ...m, contenido: nuevo } : m)));
      },
    };
  }, [quitarModal]);

  const confirmar = useCallback((mensaje, { textoAceptar = 'Confirmar', peligro = false } = {}) => (
    new Promise((resolver) => {
      let respuesta = false;
      const handle = abrirModal('Confirmar', (
        <div>
          <p style={{ margin: 0 }}>{mensaje}</p>
          <div className="form-pie">
            <button className="boton" type="button" onClick={() => handle.cerrar()}>Cancelar</button>
            <button
              className={`boton ${peligro ? 'peligro lleno' : 'primario'}`}
              type="button"
              onClick={() => { respuesta = true; handle.cerrar(); }}
            >
              {textoAceptar}
            </button>
          </div>
        </div>
      ), { tamano: 'chico', alCerrar: () => resolver(respuesta) });
    })
  ), [abrirModal]);

  useEffect(() => {
    registrarUi({ avisar, abrirModal, confirmar });
  }, [avisar, abrirModal, confirmar]);

  return (
    <>
      {children}
      <div id="avisos" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso ${a.tipo}`} role={a.tipo === 'error' ? 'alert' : 'status'}>
            {a.mensaje}
          </div>
        ))}
      </div>
      {modales.map((m) => (
        <Dialogo key={m.id} modal={{ ...m }} onCerrar={quitarModal} />
      ))}
    </>
  );
}
