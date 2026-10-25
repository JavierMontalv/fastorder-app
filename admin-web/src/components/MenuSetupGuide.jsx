import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiChevronLeft, FiChevronDown, FiSettings, FiGrid, FiCoffee, FiShare2, FiX } from 'react-icons/fi';
import { menuSetupSteps, readGuideProgress, saveGuideProgress } from '../config/menuSetupGuide.mjs';
import '../styles/WelcomePresentation.css';

const icons = [FiSettings, FiGrid, FiCoffee, FiShare2];
const guideStorage = () => { try { return window.localStorage; } catch { return null; } };

export default function MenuSetupGuide({ storageKey }) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(() => readGuideProgress(guideStorage(), storageKey));
  const [open, setOpen] = useState(() => !progress.dismissed);
  const [current, setCurrent] = useState(() => {
    const next = menuSetupSteps.findIndex(step => !progress.completed.includes(step.id));
    return next < 0 ? 0 : next;
  });
  const [dock, setDock] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const dialogRef = useRef(null);
  const dockRef = useRef(null);
  const stepHeadingRef = useRef(null);
  const step = menuSetupSteps[current];
  const Icon = icons[current];
  const complete = progress.completed.length === menuSetupSteps.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    stepHeadingRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else dockRef.current?.querySelector('button')?.focus();
    };
  }, [open]);

  useEffect(() => { if (open) stepHeadingRef.current?.focus(); }, [current, open, complete]);

  function updateProgress(next) {
    setProgress(next);
    setStorageWarning(!saveGuideProgress(guideStorage(), storageKey, next));
  }
  function closeGuide() {
    updateProgress({ ...progress, dismissed: true });
    setOpen(false);
  }
  function visitStep() {
    closeGuide();
    setDock(true);
    navigate(step.route);
  }
  function markStep() {
    const completed = [...new Set([...progress.completed, step.id])];
    updateProgress({ dismissed: true, completed });
    const next = menuSetupSteps.findIndex(item => !completed.includes(item.id));
    if (next >= 0) setCurrent(next);
    setOpen(true);
    setDock(false);
  }

  return <>
    {!open && <aside ref={dockRef} className={`mq-guide-dock ${dock ? 'is-expanded' : ''}`} aria-label="Guía de configuración del menú QR">
      {dock ? <>
        <div className="mq-dock-heading"><span>PASO {current + 1} DE 4 · {step.label}</span><button type="button" aria-label="Minimizar guía" onClick={() => setDock(false)}><FiChevronDown /></button></div>
        <p>{step.section}</p><small>Guarda los cambios en el panel antes de continuar.</small>
        <div className="mq-dock-actions"><button type="button" className="mq-primary" onClick={markStep}>Ya guardé y revisé <FiCheck /></button><button type="button" className="mq-text" onClick={() => setOpen(true)}>Ver instrucciones</button></div>
      </> : <button type="button" className="mq-guide-launcher" onClick={() => setOpen(true)}><img src="/brand/comanda-favicon-96.png" alt="" /><span>{complete ? 'Revisar guía del menú QR' : 'Configurar mi menú QR'}<small>{progress.completed.length} de 4 pasos revisados</small></span><FiArrowRight /></button>}
    </aside>}
    {open && <dialog ref={dialogRef} className="mq-guide-dialog" aria-labelledby="mq-guide-title" aria-describedby="mq-guide-description" onCancel={event => { event.preventDefault(); closeGuide(); }}>
      <div className="mq-guide-shell">
        <header className="mq-guide-header"><span className="mq-guide-brand"><img src="/brand/comanda-favicon-96.png" alt="" /><strong>comanda</strong></span><button type="button" className="mq-close" aria-label="Continuar más tarde" onClick={closeGuide}><FiX /></button></header>
        <div className="mq-guide-intro"><span className="mq-kicker">TU MENÚ QR, PASO A PASO</span><h2 id="mq-guide-title">Tu menú QR, <em>paso a paso.</em></h2><p id="mq-guide-description">Configura lo esencial. Guarda cada cambio en el panel y retoma la guía cuando quieras.</p></div>
        <div className="mq-progress"><span>{progress.completed.length} de 4 pasos revisados</span><progress aria-label="Pasos revisados" value={progress.completed.length} max={4} /></div>
        {complete ? <section className="mq-guide-finish" aria-live="polite"><span className="mq-finish-icon"><FiCheck /></span><h3 ref={stepHeadingRef} tabIndex={-1}>¡Terminaste el recorrido!</h3><p>Marcaste los cuatro pasos como revisados. Antes de compartir tu QR, confirma que el menú real muestre los productos y precios correctos.</p><button type="button" className="mq-primary" onClick={() => { closeGuide(); navigate('/configuracion'); }}>Ir a mi menú y QR <FiArrowRight /></button><button type="button" className="mq-text" onClick={() => { updateProgress({ dismissed: true, completed: [] }); setCurrent(0); }}>Volver a recorrer la guía</button></section> : <>
          <nav className="mq-step-tabs" aria-label="Pasos de configuración">{menuSetupSteps.map((item, index) => <button type="button" key={item.id} aria-current={current === index ? 'step' : undefined} onClick={() => setCurrent(index)}><span>{progress.completed.includes(item.id) ? <FiCheck aria-label="Revisado" /> : index + 1}</span>{item.label}</button>)}</nav>
          <section className="mq-guide-content" aria-labelledby="mq-step-title"><div className="mq-guide-instructions"><span className="mq-step-kicker"><Icon /> PASO {current + 1} DE 4</span><h3 id="mq-step-title" ref={stepHeadingRef} tabIndex={-1}>{step.title}</h3><p>{step.description}</p><ol>{step.tasks.map(task => <li key={task}>{task}</li>)}</ol><p className="mq-guide-tip"><strong>Para hacerlo fácil</strong>{step.tip}</p></div>
            <aside className={`mq-example mq-example-${step.id}`} aria-label="Ejemplo ilustrativo"><span>EJEMPLO · NO MODIFICA TU MENÚ</span><div className="mq-example-card"><Icon size={28} /><strong>{step.example[0]}</strong>{step.example.slice(1).map(line => <p key={line}>{line}</p>)}{current === 1 && <small>Organiza tu carta en secciones claras.</small>}{current === 3 && <small>Revisa el enlace real desde Configuración.</small>}</div><small>El nombre, las fotos y los precios los eliges tú.</small></aside>
          </section>
          <footer className="mq-guide-actions"><button type="button" className="mq-primary" onClick={visitStep}>{step.action} <FiArrowRight /></button><button type="button" className="mq-secondary" onClick={markStep}>{current === 3 ? 'Ya probé mi menú' : 'Ya guardé este paso'} <FiCheck /></button></footer>
          <div className="mq-guide-bottom"><button type="button" className="mq-text" disabled={current === 0} onClick={() => setCurrent(current - 1)}><FiChevronLeft /> Anterior</button><p>Marcar un paso no guarda cambios en tu restaurante.</p><button type="button" className="mq-text" onClick={closeGuide}>Continuar después</button></div>
        </>}
        {storageWarning && <p role="status" className="mq-storage-note">Puedes seguir usando la guía, pero este navegador no pudo recordar tu progreso.</p>}
      </div>
    </dialog>}
  </>;
}
