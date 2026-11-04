import { useEffect, useRef, useState } from 'react';
import '../styles/OfficialContact.css';
export const OFFICIAL_WHATSAPP = '573016399943';
export default function OfficialContact() {
  const [left, setLeft] = useState(16),
    [hidden, setHidden] = useState(false);
  const widget = useRef(null);
  useEffect(() => {
    let frame;
    function sync() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const sidebar = document.querySelector('.sidebar'),
          layout = document.querySelector('.layout-container'),
          mobile = matchMedia('(max-width:1180px)').matches;
        const rect = sidebar?.getBoundingClientRect();
        const menuVisible = mobile && rect && rect.right > 20 && rect.left >= -10;
        const modal = Boolean(document.querySelector('.op-product-details[open],.pm-overlay,.op-overlay,.ticket-overlay,.pro-modal-overlay,.inv-modal-overlay,[aria-modal="true"]'));
        if((menuVisible||modal)&&widget.current?.open)widget.current.open=false;
        setHidden(Boolean(menuVisible || modal));
        setLeft(layout && !mobile && rect ? Math.max(16, Math.ceil(rect.right) + 16) : 16);
      });
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'open', 'aria-modal'],
      childList: true
    });
    window.addEventListener('resize', sync);
    document.addEventListener('transitionend', sync);
    const escape = e => {
      if (e.key === 'Escape' && widget.current) widget.current.open = false;
    };
    document.addEventListener('keydown', escape);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', sync);
      document.removeEventListener('transitionend', sync);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  const href = 'https://wa.me/' + OFFICIAL_WHATSAPP + '?text=' + encodeURIComponent('Hola COMANDA, quiero comunicarme con un asesor para mi restaurante.');
  return <details ref={widget} className="comanda-support" hidden={hidden} style={{
    left
  }}><summary aria-label="Abrir ayuda de COMANDA"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4.1A8 8 0 1 1 20 11.6Z" stroke="currentColor" strokeWidth="1.8" /><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" /></svg><span>Asesor COMANDA<small>¿Te ayudamos?</small></span><b aria-hidden="true">+</b></summary><div className="comanda-support-panel"><button type="button" onClick={() => {
        widget.current.open = false;
      }} aria-label="Cerrar ayuda">×</button><small>ESTAMOS PARA AYUDARTE</small><h3>¿Quieres comunicarte con un asesor?</h3><p>Conversemos sobre tu restaurante y las herramientas de COMANDA.</p><a href={href} target="_blank" rel="noopener noreferrer">Hablar por WhatsApp ↗</a><span>+57 301 639 9943</span></div></details>;
}
