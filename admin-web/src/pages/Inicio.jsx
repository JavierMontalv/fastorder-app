import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { crearCheckoutPlan, obtenerExperienciaComercial } from '../api/publicComercialApi';
import { commercialLegalDocuments, LEGAL_ACCEPTANCE_VERSION, legalDocumentKeys } from '../constants/legalCommercialDocs';
import '../styles/ComandaInicio.css';
import PublicMetadata from '../seo/PublicMetadata';
import { ADMIN_ORIGIN, HOME_PATH, SITE_ORIGIN, publicPages } from '../seo/site.mjs';

const currency = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
const names = { base: 'Básico', pro: 'Pro', ia: 'Premium' };
const copy = {
  base: ['Publica y actualiza tu menú QR.', 'Para mostrar tu carta en línea.'],
  pro: ['Recibe pedidos desde cada mesa.', 'Para ordenar mejor el servicio.'],
  ia: ['Más capacidad y control comercial.', 'Para operaciones que quieren crecer.']
};
const planFeatures = {
  base: ['Menú QR público para tus clientes.', 'Productos, categorías y precios editables.', 'Fotografías, descripciones, logo y colores.', 'Enlace para compartir en Instagram y WhatsApp.', 'Administración de tu carta desde el panel.'],
  pro: ['Todo lo incluido en Comanda Básico.', 'Pedidos desde la mesa y QR por mesa.', 'Estados de los pedidos para organizar al equipo.', 'Promociones y analítica comercial.', 'Configuración inicial del restaurante.'],
  ia: ['Todo lo incluido en Comanda Pro.', 'Productos destacados y promociones.', 'Reportes de los productos más vistos o pedidos.', 'Mayor capacidad de productos, usuarios y pedidos.']
};
const questions = [
  ['¿Necesito instalar una aplicación?', 'Tus clientes consultan el menú desde su navegador al escanear el QR. Tú administras el restaurante desde el panel web. Se necesita conexión a internet.'],
  ['¿Cuál es el plan para empezar?', 'Básico está pensado para publicar y actualizar tu carta digital. Si quieres recibir pedidos desde la mesa y consultar analítica comercial, elige Pro. Premium amplía tu capacidad de productos, usuarios y pedidos.'],
  ['¿Cómo funciona la demo?', 'Solicita una demostración por correo para revisar tu caso con el equipo. Las condiciones, duración y habilitación de una cuenta demo se confirman contigo antes de activarla.'],
  ['¿Cuándo puedo ingresar al administrador?', 'Cuando tu demo o plan haya sido activado y tengas credenciales. Registrar una solicitud no habilita el panel automáticamente. Los clientes actuales conservan su acceso.'],
  ['¿Puedo usar Comanda en varias sedes?', 'Sí. Cuéntanos cuántas sedes necesitas para preparar una propuesta con alcance y precio definidos. Los planes publicados corresponden a una operación individual.']
];

function LegalDialog({ document, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="cm-legal-dialog" onClose={onClose} aria-labelledby="cm-legal-title"><div><button className="cm-text-link cm-dialog-close" onClick={() => ref.current.close()} aria-label="Cerrar documento">Cerrar ×</button><span className="cm-eyebrow">CONDICIONES DEL SERVICIO</span><h2 id="cm-legal-title">{document.title}</h2><p>{document.subtitle}</p>{document.sections.map(section => <section key={section.heading}><h3>{section.heading}</h3><p>{section.body}</p></section>)}<small>Versión {LEGAL_ACCEPTANCE_VERSION} · Brevia Tech SAS</small></div></dialog>;
}

function Activation({ plan, ready, onLegal, onBack }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  async function submit(event) {
    event.preventDefault();
    if (busy || result) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!values.acceptedTerms || !values.acceptedDataPolicy) return;
    setBusy(true); setError('');
    try {
      const response = await crearCheckoutPlan({ plan: plan.clave, customer: { ...values, acceptedTerms: true, acceptedDataPolicy: true, legalAcceptance: { version: LEGAL_ACCEPTANCE_VERSION, documents: legalDocumentKeys, acceptedAt: new Date().toISOString() } } });
      const data = response?.data;
      if (data?.checkoutUrl) {
        const target = new URL(data.checkoutUrl);
        if (target.protocol !== 'https:') throw new Error('No pudimos abrir el pago. Contacta al equipo para continuar.');
        window.location.assign(target.href);
      } else if (data?.reference || data?.mode === 'assisted_activation') {
        event.target.reset(); setResult(data);
      } else { throw new Error('No pudimos confirmar la solicitud. Intenta nuevamente o escríbenos.'); }
    } catch (err) { setError(err.message || 'No pudimos registrar tu solicitud. Intenta nuevamente.'); }
    finally { setBusy(false); }
  }
  return <section className="cm-activation" id="activacion" aria-labelledby="cm-activation-title">
    <div><button className="cm-text-link" onClick={onBack}>← Volver a los planes</button><span className="cm-eyebrow">EL SIGUIENTE PASO</span><h2 id="cm-activation-title">Hagamos espacio<br />para tu restaurante.</h2><p>Comanda {names[plan.clave]} · <strong>{currency(plan.precioMensualCOP)} COP / mes</strong></p><p>{ready ? 'Registra tus datos y revisa las condiciones antes de continuar al pago. El acceso se habilita después de la validación.' : 'Registra tu solicitud. El equipo coordinará contigo las condiciones y la activación. Este paso no realiza un cobro ni habilita una cuenta.'}</p></div>
    {result ? <div className="cm-form-card" role="status"><span className="cm-label">SOLICITUD RECIBIDA</span><h3>Gracias por dar el primer paso.</h3><p>Tu solicitud quedó registrada. El acceso está pendiente de validación comercial y activación.</p>{result.reference ? <p>Referencia: <strong>{result.reference}</strong></p> : null}<a className="cm-button" href="mailto:comercial@somosbreviatech.com?subject=Seguimiento%20de%20activaci%C3%B3n%20Comanda">Contactar al equipo ↗</a></div> : <form className="cm-form-card" onSubmit={submit} aria-busy={busy}>
      <h3>Datos para tu activación</h3><div className="cm-form-grid">{[['businessName', 'Nombre del restaurante', 'text', 'organization'], ['name', 'Tu nombre', 'text', 'name'], ['email', 'Correo electrónico', 'email', 'email'], ['phone', 'Teléfono de contacto', 'tel', 'tel']].map(([name, label, type, autoComplete]) => <label key={name}>{label}<input name={name} type={type} autoComplete={autoComplete} required maxLength={name === 'phone' ? 30 : 150} /></label>)}</div>
      <label>Contraseña para tu futura cuenta<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><small>Mínimo 8 caracteres. La cuenta se habilita después de la activación.</small>
      <div className="cm-legal-links">{commercialLegalDocuments.map(doc => <button key={doc.key} type="button" onClick={() => onLegal(doc)}>{doc.shortTitle}</button>)}</div>
      <label className="cm-check"><input type="checkbox" name="acceptedTerms" required /><span>Leí y acepto los términos, el contrato SaaS y las condiciones del plan seleccionado.</span></label>
      <label className="cm-check"><input type="checkbox" name="acceptedDataPolicy" required /><span>Autorizo el tratamiento de mis datos conforme a la política de Comanda para gestionar esta solicitud y el servicio.</span></label>
      {error ? <p className="cm-error" role="alert">{error}</p> : null}<button className="cm-button" disabled={busy} type="submit">{busy ? 'Procesando…' : ready ? 'Continuar al pago →' : 'Enviar solicitud de activación →'}</button>
    </form>}
  </section>;
}


function ProductPreview() {
  return <div className="cm-product-art" aria-label="Vista ilustrativa del menú y del panel de pedidos de Comanda">
    <div className="cm-art-grid" /><span className="cm-art-caption">DISEÑADO PARA EL RITMO DE TU RESTAURANTE</span>
    <div className="cm-hero-qr"><img src="/landing/comanda-qr.png" alt="Código QR de demostración para abrir Comanda" /><div><strong>Escanea el QR</strong><span>Abre el menú al instante</span></div></div>
    <div className="cm-order-preview"><div className="cm-order-top"><img src="/brand/comanda-favicon-192.png" width="40" height="40" alt="" /><strong>Tu operación, conectada</strong><span>● En línea</span></div><div className="cm-order-heading"><h3>Pedidos en curso</h3><span>Vista demo</span></div><div className="cm-order-columns"><div><small>RECIBIDOS <b>02</b></small><article><span>Mesa 04 <em>Nuevo</em></span><strong>2 × Burger de la casa</strong><p>1 × Papas artesanales</p><div>$ 58.000 <span>Hace un momento</span></div></article><article><span>Mesa 08</span><strong>1 × Combo especial</strong><p>Sin cebolla</p></article></div><div><small>EN PREPARACIÓN <b>01</b></small><article><span>Mesa 02 <em>En cocina</em></span><strong>1 × Burger especial</strong><p>1 × Limonada natural</p><div>$ 32.000 <span>Hace 3 min</span></div></article></div></div></div>
    <div className="cm-phone"><div className="cm-phone-notch" /><div className="cm-phone-cover"><img src="/landing/burger.webp" alt="Hamburguesa con pan artesanal, queso y vegetales" fetchPriority="high" /><span>MENÚ DIGITAL<br /><b>Tu restaurante</b></span></div><div className="cm-phone-body"><div className="cm-phone-greeting"><span>Elige lo que te gusta.</span><small>● Abierto</small></div><h3>Menú claro.<br />Pedido fácil.</h3><div className="cm-menu-tabs"><strong>Destacados</strong><span>Comidas</span><span>Bebidas</span></div><div className="cm-food-row"><div><strong>Burger de la casa</strong><p>Carne a la parrilla, queso<br />y salsa especial.</p><b>$ 24.900</b></div><div className="cm-food-visual"><img src="/landing/burger.webp" alt="" /><button type="button" tabIndex="-1" aria-hidden="true">+</button></div></div><div className="cm-food-row"><div><strong>Papas artesanales</strong><p>Crocantes y recién hechas.</p><b>$ 8.900</b></div><div className="cm-food-visual"><img src="/landing/fries.webp" alt="Papas fritas" /><button type="button" tabIndex="-1" aria-hidden="true">+</button></div></div><div className="cm-phone-cart"><strong>1 producto</strong><span>Ir a canasta →</span></div></div></div>
    <small className="cm-art-disclaimer">Vista ilustrativa · Productos y pedidos de demostración</small>
  </div>;
}



function useHorizontalDrag(onRelease) {
  const start = useRef(null);
  const dragRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  function finish(event, cancelled = false) {
    const point = start.current;
    if (!point || point.id !== event.pointerId) return;
    const delta = point.delta || 0;
    start.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && dragRef.current) onRelease(delta);
    dragRef.current = false;
    setDragging(false); setOffset(0);
  }
  return { offset, dragging, dragRef, bind: {
    onPointerDown(event) {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('button,a,input')) return;
      start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, delta: 0 };
    },
    onPointerMove(event) {
      const point = start.current;
      if (!point || point.id !== event.pointerId) return;
      const dx = event.clientX - point.x, dy = event.clientY - point.y;
      if (!dragRef.current) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { start.current = null; return; }
        if (Math.abs(dx) < 8) return;
        dragRef.current = true; setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      point.delta = dx; setOffset(dx);
    },
    onPointerUp: event => finish(event),
    onPointerCancel: event => finish(event, true),
    onLostPointerCapture: event => { if (start.current) finish(event, true); },
    onDragStart: event => event.preventDefault()
  }};
}

function CarouselArrows({ previous, next, label, light = false }) {
  return <div className={'cm-carousel-arrows' + (light ? ' cm-carousel-arrows-light' : '')} role="group" aria-label={label}>
    <button type="button" onClick={previous} aria-label={'Anterior: ' + label}><span aria-hidden="true">←</span></button>
    <button type="button" onClick={next} aria-label={'Siguiente: ' + label}><span aria-hidden="true">→</span></button>
  </div>;
}

function HeroVisual() {
  const [slide, setSlide] = useState(0);
  const [heroEpoch, setHeroEpoch] = useState(0);
  function moveHero(direction) { setSlide(value => (value + direction + 2) % 2); setHeroEpoch(value => value + 1); }
  const heroDrag = useHorizontalDrag(delta => { if (Math.abs(delta) > 35) moveHero(delta < 0 ? 1 : -1); });
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPaused(motion.matches);
    sync(); motion.addEventListener('change', sync);
    return () => motion.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => { if (document.visibilityState !== 'hidden' && !heroDrag.dragRef.current) setSlide(value => (value + 1) % 2); }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, heroEpoch]);
  return <div className="cm-hero-carousel" role="region" aria-label="Conoce COMANDA" aria-roledescription="carrusel">
    <div className="cm-hero-swipe-window" {...heroDrag.bind} data-dragging={heroDrag.dragging}><div className="cm-hero-scenes" aria-live="off" style={{translate: `${heroDrag.offset}px 0`}}>
      <div className="cm-hero-scene" hidden={slide !== 0}><div className="cm-comparison-intro"><strong>El localizador avisa.</strong><span>COMANDA recibe y organiza tus pedidos por mesa.</span></div><div className="cm-switch-visual" aria-label="Del localizador físico al pedido digital identificado por mesa">
          <div className="cm-switch-before"><span className="cm-switch-tag">EL LOCALIZADOR</span><svg className="cm-round-pagers" viewBox="0 0 260 300" role="img" aria-label="Localizadores redondos con luces rojas, apilados sobre su base de carga">
  <defs><linearGradient id="cm-pager-body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#555854"/><stop offset=".4" stopColor="#252b29"/><stop offset="1" stopColor="#090e0d"/></linearGradient><linearGradient id="cm-pager-edge" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#656864"/><stop offset=".35" stopColor="#191f1d"/><stop offset="1" stopColor="#080d0b"/></linearGradient><radialGradient id="cm-pager-light"><stop stopColor="#fff5d8"/><stop offset=".27" stopColor="#ff7867"/><stop offset=".62" stopColor="#fc251c"/><stop offset="1" stopColor="#8e130d"/></radialGradient><radialGradient id="cm-pager-label"><stop stopColor="#fffefa"/><stop offset="1" stopColor="#d4d8cf"/></radialGradient><filter id="cm-pager-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="2" dy="8" stdDeviation="7" floodColor="#172c20" floodOpacity=".25"/></filter></defs>
  <ellipse cx="135" cy="273" rx="105" ry="12" fill="#223629" opacity=".1"/>
  <g filter="url(#cm-pager-shadow)">
    <path d="M13 224 78 198 128 227 64 258 13 242Z" fill="url(#cm-pager-body)" stroke="#73756d" strokeWidth="1.2"/>
    <path d="m13 242 51 16 64-31v10l-64 31-51-17Z" fill="#161e19"/>
    <path d="M75 198v-47" stroke="#242b25" strokeWidth="4" strokeLinecap="round"/>
    <path d="m39 221 24-10 20 8-24 11Z" fill="#101814" stroke="#61675c"/>
    <text x="60" y="224" fill="#ff5b43" fontSize="8" fontFamily="monospace" transform="rotate(-20 60 224)">08</text>
    {[0,1,2].map(row => [0,1,2].map(col => <ellipse key={row+'-'+col} cx={32+col*13+row*9} cy={233+row*5-col*5} rx="3.2" ry="1.9" fill="#72796b" stroke="#afb3a3" strokeWidth=".5"/>))}
    {[0,1,2,3,4,5,6].map(index => <g key={index} transform={'translate(0 '+(-index*22)+')'}><path d="M99 236v10c0 12 93 12 93 0v-10Z" fill="url(#cm-pager-edge)" stroke="#53594e"/><ellipse cx="145.5" cy="236" rx="46.5" ry="13" fill="url(#cm-pager-body)" stroke="#92968b" strokeWidth="1.3"/><ellipse cx="145.5" cy="236" rx="30" ry="7" fill="#161e19" stroke="#4d554b"/>{[0,1,2,3,4,5,6,7].map(i => <ellipse key={i} cx={145.5+39*Math.cos(i*Math.PI/4)} cy={236+10*Math.sin(i*Math.PI/4)} rx="2.7" ry="1.8" fill="url(#cm-pager-light)"/>)}</g>)}
    <g transform="rotate(16 194 205)"><ellipse cx="198" cy="212" rx="53" ry="65" fill="#0a100d" stroke="#4c5148" strokeWidth="4"/><ellipse cx="194" cy="205" rx="53" ry="65" fill="url(#cm-pager-body)" stroke="#7c8274" strokeWidth="1.5"/><ellipse cx="194" cy="205" rx="43" ry="55" fill="#471b16" stroke="#cc3d29" strokeWidth="1"/>{Array.from({length:18},(_,i)=><ellipse key={i} cx={194+45*Math.cos(i*Math.PI/9)} cy={205+57*Math.sin(i*Math.PI/9)} rx="3.5" ry="4" fill="url(#cm-pager-light)"/>)}<ellipse cx="194" cy="205" rx="33" ry="43" fill="url(#cm-pager-label)" stroke="#9a9f92" strokeWidth="2"/><path d="M182 195a13 13 0 0 1 22-8m0-5v7h-7m8 13a13 13 0 0 1-22 8m0 5v-7h7" fill="none" stroke="#6a7569" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><text x="194" y="225" textAnchor="middle" fontSize="7" fontWeight="700" fill="#3e4a3f" fontFamily="sans-serif" letterSpacing=".7">LOCALIZADOR</text><text x="194" y="237" textAnchor="middle" fontSize="9" fontWeight="700" fill="#3e4a3f" fontFamily="sans-serif">08</text></g>
  </g>
</svg><p>Avisa que el pedido está listo.</p></div>
          <span className="cm-switch-arrow" aria-hidden="true">↗</span>
          <div className="cm-switch-after"><span className="cm-switch-tag">CON COMANDA</span><div className="cm-switch-order"><div className="cm-switch-order-top"><img src="/brand/comanda-favicon-192.png" width="32" height="32" alt="" /><strong>comanda</strong><span>EN LÍNEA</span></div><div className="cm-switch-table"><span>Pedido identificado</span><b>Mesa 08</b></div><div className="cm-switch-dish"><img src="/landing/burger.webp" alt="" width="64" height="64" loading="lazy" /><div><strong>2 × Burger de la casa</strong><span>Productos y mesa en una sola orden.</span></div></div><div className="cm-switch-state"><i /> Recibido <span>→</span> En preparación</div></div><p>Tu cliente elige y pide.<br /><strong>Tu equipo recibe y prepara.</strong></p></div>
        </div></div>
      <div className="cm-hero-scene cm-hero-product-scene" hidden={slide !== 1}><ProductPreview /></div>
    </div>
    </div><CarouselArrows label="Vistas de COMANDA" previous={() => moveHero(-1)} next={() => moveHero(1)} />
    <div className="cm-hero-scene-controls"><div role="group" aria-label="Elige una vista"><button type="button" aria-pressed={slide === 0} onClick={() => { setSlide(0); setHeroEpoch(value => value + 1); }}>La diferencia COMANDA</button><button type="button" aria-pressed={slide === 1} onClick={() => { setSlide(1); setHeroEpoch(value => value + 1); }}>Menú y pedidos</button></div><button type="button" className="cm-hero-scene-pause" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Reanudar vistas' : 'Pausar vistas'}>{paused ? '▷' : 'Ⅱ'}</button></div>
  </div>;
}


function JourneyImage({ src, alt, loading = 'lazy', onReady, ...props }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const imageRef = useRef(null);
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoaded(true);
      readyCallback.current?.();
    } else if (image?.complete && image.naturalWidth === 0) {
      if (attempt < 2) setAttempt(value => value + 1); else setUnavailable(true);
    }
  }, [src, attempt]);
  const base = src.replace(/\.webp$/, '');
  if (unavailable) return <span className="cm-image-unavailable" role="img" aria-label={alt + ': fotografía temporalmente no disponible'}>Fotografía temporalmente no disponible</span>;
  return <img {...props} ref={imageRef} src={attempt === 1 ? src : base + '-960.jpg' + (attempt === 2 ? '?retry=1' : '')}
    srcSet={attempt === 0 ? base + '-960.jpg 960w, ' + base + '-1600.jpg 1600w' : undefined}
    sizes="(max-width: 760px) 82vw, (max-width: 1100px) 40vw, 510px"
    alt={alt} loading={loading} decoding="async" data-ready={loaded}
    onLoad={() => { setLoaded(true); onReady?.(); }}
    onError={() => { setLoaded(false); if (attempt < 2) setAttempt(value => value + 1); else setUnavailable(true); }} />;
}

const reelItems = [
  { src: '/landing/journey-01-scan.webp', step: '01', label: 'Escanea', title: 'El QR abre el menú', text: 'Sin descargar aplicaciones.', status: 'QR listo' },
  { src: '/landing/journey-02-order.webp', step: '02', label: 'Elige y agrega', title: 'El cliente arma su pedido', text: 'Fotos, precios y botones claros.', status: '+ Agregar' },
  { src: '/landing/journey-03-kitchen.webp', step: '03', label: 'Prepara', title: 'La orden llega a cocina', text: 'El equipo recibe el pedido organizado.', status: 'En cocina' },
  { src: '/landing/journey-04-serve.webp', step: '04', label: 'Entrega', title: 'El pedido llega a la mesa', text: 'El recorrido termina donde empezó.', status: 'Listo' }
];

function PhotoReel() {
  const [position, setPosition] = useState(reelItems.length);
  const [stepWidth, setStepWidth] = useState(0);
  const [animated, setAnimated] = useState(true);
  const [paused, setPaused] = useState(false);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [loadedPhotos, setLoadedPhotos] = useState({});
  const photosReady = reelItems.every(item => loadedPhotos[item.src]);
  function markPhotoReady(src) { setLoadedPhotos(value => value[src] ? value : { ...value, [src]: true }); }
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const active = position % reelItems.length;
  function moveReel(direction) { setAnimated(true); setPosition(value => value + direction); setSelectionEpoch(value => value + 1); }
  const reelDrag = useHorizontalDrag(delta => { if (Math.abs(delta) > Math.min(60, stepWidth * .18)) moveReel(delta < 0 ? 1 : -1); });

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setPaused(motion.matches);
    syncMotion();
    motion.addEventListener('change', syncMotion);
    return () => motion.removeEventListener('change', syncMotion);
  }, []);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track?.firstElementChild) return;
      setStepWidth(track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0'));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !photosReady) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden' || reelDrag.dragRef.current) return;
      setAnimated(true);
      setPosition(index => index + 1);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [paused, selectionEpoch, photosReady]);

  function selectStep(index) {
    setAnimated(true);
    setPosition(reelItems.length + index);
    setSelectionEpoch(epoch => epoch + 1);
  }

  function finishTransition(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
    if (position >= reelItems.length * 2 || position < reelItems.length) {
      setAnimated(false);
      setPosition(reelItems.length + ((position % reelItems.length) + reelItems.length) % reelItems.length);
    }
  }

  return <section className="cm-photo-reel" aria-labelledby="cm-reel-title" aria-roledescription="carrusel">
    <div className="cm-reel-heading"><span className="cm-eyebrow">EL RECORRIDO COMPLETO DE COMANDA</span><h2 id="cm-reel-title">Del QR a la mesa.<br /><em>Todo conectado.</em></h2><p>Cuatro momentos, una sola experiencia: el cliente pide con facilidad y tu equipo sabe qué hacer después.</p></div>
    <div className="cm-journey-line" role="group" aria-label="Elige un momento del recorrido">{reelItems.map((item, index) => <button type="button" key={item.step} className={active === index ? 'is-active' : ''} aria-pressed={active === index} aria-controls="cm-reel-viewport" onClick={() => selectStep(index)}><b aria-hidden="true">{item.step}</b>{item.label}</button>)}</div>
    <div className="cm-reel-toolbar"><CarouselArrows label="Recorrido fotográfico" light previous={() => moveReel(-1)} next={() => moveReel(1)} /><button type="button" className="cm-reel-toggle" aria-controls="cm-reel-viewport" aria-label={paused ? 'Reproducir recorrido automático' : 'Pausar recorrido automático'} aria-pressed={paused} onClick={() => setPaused(value => !value)}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">{paused ? <path d="M6 3.5 16 10 6 16.5Z" fill="currentColor" /> : <><rect x="5" y="4" width="3" height="12" rx="1" fill="currentColor" /><rect x="12" y="4" width="3" height="12" rx="1" fill="currentColor" /></>}</svg><span className="cm-reel-toggle-label">{paused ? 'Reproducir' : 'Pausar'}</span></button></div>
    <div className="cm-reel-window" id="cm-reel-viewport" ref={viewportRef} aria-live="off" {...reelDrag.bind} data-dragging={reelDrag.dragging}><div className="cm-reel-track" ref={trackRef} data-active-step={active + 1} data-playing={!paused && photosReady} aria-busy={!photosReady} onTransitionEnd={finishTransition} style={{ transform: `translate3d(${-(position * stepWidth) + reelDrag.offset}px, 0, 0)`, transition: animated && !reelDrag.dragging ? undefined : 'none' }}>{[...reelItems, ...reelItems, ...reelItems].map((item, index) => <figure key={`${item.src}-${index}`} aria-hidden={index < reelItems.length || index >= reelItems.length * 2}><JourneyImage src={item.src} onReady={() => markPhotoReady(item.src)} alt={index >= reelItems.length && index < reelItems.length * 2 ? item.title : ''} loading="eager" width="1600" height="900" /><span className={`cm-journey-status cm-journey-status-${item.step}`}>{item.status}</span><figcaption><small><b>{item.step}</b> {item.label} · {item.text}</small><strong>{item.title}</strong></figcaption></figure>)}</div></div>
    <div className="cm-reel-promise"><span><b>01</b> ESCANEA</span><span><b>02</b> PIDE</span><span><b>03</b> PREPARA</span><span><b>04</b> ENTREGA</span><strong>UN QR. TODO EL SERVICIO CONECTADO.</strong></div>
  </section>;
}


const serviceJourney = [
  { number: '01', audience: 'CLIENTE', title: 'Elige y confirma.', image: '/landing/journey-02-order.webp', alt: 'Cliente eligiendo su pedido desde el celular en el restaurante', person: 'Consulta el menú, elige sus productos y confirma desde la mesa.', systemLabel: 'DESDE EL CELULAR', systemTitle: 'Mi pedido · Mesa 08', detail: '2 × Burger de la casa', state: 'Pedido enviado', phase: 0 },
  { number: '02', audience: 'RESTAURANTE', title: 'La orden queda registrada.', image: '/landing/journey-03-kitchen.webp', alt: 'Integrante del equipo frente al panel de pedidos del restaurante', person: 'El equipo recibe los productos y la mesa en una orden clara.', systemLabel: 'EN EL PANEL COMANDA', systemTitle: 'Nueva orden · Mesa 08', detail: '2 productos · Una misma mesa', state: 'Recibido', phase: 1 },
  { number: '03', audience: 'EQUIPO', title: 'Cocina toma el relevo.', image: '/landing/journey-03-kitchen.webp', alt: 'Cocinero preparando los alimentos de un pedido', person: 'Prepara la orden y actualiza su estado desde el panel.', systemLabel: 'EL EQUIPO ACTUALIZA', systemTitle: 'En preparación', detail: 'Mesa 08 · Orden en cocina', state: 'Preparando', phase: 2 },
  { number: '04', audience: 'CLIENTE', title: 'Consulta cómo va.', image: '/landing/journey-01-scan.webp', alt: 'Persona consultando en su celular mientras espera en la mesa', person: 'Revisa el estado de su pedido desde la vista de seguimiento.', systemLabel: 'EL CLIENTE CONSULTA', systemTitle: 'Tu pedido está en preparación', detail: 'Recibido → En preparación → Listo', state: 'Estado del pedido', phase: 2 },
  { number: '05', audience: 'MESA Y EQUIPO', title: 'Listo para disfrutar.', image: '/landing/journey-04-serve.webp', alt: 'Mesera entregando los platos a dos personas sentadas a la mesa', person: 'El equipo entrega los platos y marca la orden como entregada.', systemLabel: 'EL SERVICIO SE COMPLETA', systemTitle: 'Pedido entregado', detail: 'Mesa 08 · Del primer clic al plato', state: 'Entregado', phase: 3 }
];

function ServiceTimeline() {
  const rollRef = useRef(null);
  const [cycleWidth, setCycleWidth] = useState(0);
  const [manualOffset, setManualOffset] = useState(0);
  const timelineDrag = useHorizontalDrag(delta => setManualOffset(value => value + delta));
  useEffect(() => {
    const measure = () => {
      const roll = rollRef.current;
      if (roll?.firstElementChild) setCycleWidth(roll.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(roll).columnGap || '0'));
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(rollRef.current.firstElementChild);
    return () => observer.disconnect();
  }, []);
  const combinedOffset = manualOffset + timelineDrag.offset;
  const normalizedOffset = cycleWidth ? -(((-combinedOffset % cycleWidth) + cycleWidth) % cycleWidth) : 0;
  function moveTimeline(direction) {
    const card = rollRef.current?.querySelector('.cm-service-moment');
    const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(rollRef.current).columnGap || '0') : 350;
    setManualOffset(value => value - direction * step);
  }
  return <section className="cm-service-timeline" id="solucion" aria-labelledby="cm-service-title">
    <div className="cm-service-heading"><div><span className="cm-eyebrow">PERSONAS Y TECNOLOGÍA, EN EL MISMO RECORRIDO</span><h2 id="cm-service-title">Tu cliente pide.<br /><em>Todo el equipo se conecta.</em></h2></div><div className="cm-service-summary"><p>Una misma orden. Dos experiencias que avanzan juntas: la de quien espera en la mesa y la de quien hace posible el servicio.</p><div className="cm-service-legend"><span><i /> Cliente</span><span><i /> Equipo + COMANDA</span></div></div></div>
    <div className="cm-service-navigation"><CarouselArrows label="Línea de tiempo del servicio" previous={() => moveTimeline(-1)} next={() => moveTimeline(1)} /></div>
    <div className="cm-service-window" aria-label="Recorrido ilustrativo de un pedido, en cinco etapas" {...timelineDrag.bind} data-dragging={timelineDrag.dragging}><div className="cm-service-roll" ref={rollRef} style={{ '--cm-service-cycle': `${cycleWidth}px`, translate: `${normalizedOffset}px 0`, animationPlayState: timelineDrag.dragging ? 'paused' : undefined }}>
      {[0,1,2].map(copy => <ol className="cm-service-sequence" key={copy} aria-hidden={copy !== 0 ? true : undefined}>{serviceJourney.map(item => <li className={'cm-service-moment cm-service-phase-' + item.phase} key={item.number}>
        <div className="cm-service-milestone"><span>{item.number}</span><small>{item.audience}</small><i aria-hidden="true" /></div>
        <article className="cm-service-card"><div className="cm-service-photo"><JourneyImage src={item.image} alt={copy === 0 ? item.alt : ''} width="1600" height="900" loading="eager" /><span className="cm-service-photo-label">LA EXPERIENCIA HUMANA</span></div>
          <div className="cm-service-story"><h3>{item.title}</h3><p>{item.person}</p></div>
          <div className="cm-service-ticket"><div className="cm-service-ticket-head"><img src="/brand/comanda-favicon-192.png" width="24" height="24" alt="" /><small>{item.systemLabel}</small><span aria-hidden="true">↗</span></div><strong>{item.systemTitle}</strong><p>{item.detail}</p><div className="cm-service-progress" aria-hidden="true">{[0,1,2,3].map(index => <i key={index} className={index <= item.phase ? 'is-complete' : ''} />)}</div><span className="cm-service-state"><i aria-hidden="true" />{item.state}</span></div>
        </article>
      </li>)}</ol>)}
    </div></div>
    <div className="cm-service-footnote"><strong>Una orden conecta cada paso.</strong><span>Recorrido ilustrativo · Pedidos por mesa y estados en Pro y Premium.</span></div>
  </section>;
}


export default function Inicio({ initialPortal = null }) {
  const [params, setParams] = useSearchParams();
  const [portal, setPortal] = useState(initialPortal);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [legal, setLegal] = useState(null);
  const [menu, setMenu] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    let active = true;
    obtenerExperienciaComercial().then(response => { if (!response?.data?.plans?.cards?.length) throw new Error('Planes no disponibles'); if (active) { setPortal(response.data); setLoadError(false); } }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [attempt]);
  const selected = portal?.plans?.cards?.find(plan => plan.clave === ({ basico: 'base', premium: 'ia' }[params.get('plan')] || params.get('plan')));
  const activation = params.get('modo') === 'activar' && selected;
  useEffect(() => { if (activation) sectionRef.current?.scrollIntoView({ block: 'start' }); }, [activation]);
  function back() { setParams({}); document.getElementById('planes')?.scrollIntoView(); }
  return <div className="cm-public cm-home"><PublicMetadata />
    <a className="cm-skip" href="#contenido">Saltar al contenido</a>
    <header className="cm-nav"><a className="cm-brand" href={`${SITE_ORIGIN}${HOME_PATH}`}><img src="/brand/comanda-favicon-192.png" width="40" height="40" alt="" /><strong>comanda</strong></a><button className="cm-menu-button" aria-expanded={menu} aria-controls="cm-navigation" onClick={() => setMenu(!menu)}>Menú {menu ? '×' : '+'}</button><nav id="cm-navigation" className={menu ? 'is-open' : ''} aria-label="Navegación principal"><a href="#solucion" onClick={() => setMenu(false)}>La solución</a><a href="#como-funciona" onClick={() => setMenu(false)}>Cómo funciona</a><a href="#planes" onClick={() => setMenu(false)}>Planes</a><a className="cm-nav-access" href={`${ADMIN_ORIGIN}/admin`}>Ingresar a mi restaurante ↗</a></nav></header>
    <main id="contenido">
      <section className="cm-switch cm-sales-hero" aria-labelledby="cm-switch-title">
        <div className="cm-switch-copy">
          <span className="cm-eyebrow"><i /> DA EL SIGUIENTE PASO EN TU SERVICIO</span>
          <h1 id="cm-switch-title" aria-label="¿Todavía entregas un localizador con cada pedido?">¿Todavía entregas un localizador <span className="cm-no-pager" role="img" aria-label="Deja atrás el localizador físico"><svg viewBox="0 0 100 100" width="64" height="64" aria-hidden="true" focusable="false"><defs><linearGradient id="cm-no-pager-shell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#525b51"/><stop offset="1" stopColor="#14251a"/></linearGradient></defs><circle cx="50" cy="52" r="29" fill="#203221" opacity=".12"/><circle cx="50" cy="49" r="28" fill="url(#cm-no-pager-shell)" stroke="#7a8573" strokeWidth="2"/><circle cx="50" cy="49" r="20" fill="#f0f1e8" stroke="#9ca38e" strokeWidth="2"/><text x="50" y="55" textAnchor="middle" fontFamily="sans-serif" fontSize="17" fontWeight="700" fill="#324a36">08</text>{Array.from({length:12},(_,i)=><circle key={i} cx={50+24*Math.cos(i*Math.PI/6)} cy={49+24*Math.sin(i*Math.PI/6)} r="1.7" fill="#fa6850"/>)}<circle cx="50" cy="50" r="40" fill="none" stroke="#d83f2d" strokeWidth="5"/><path d="m22 22 56 56" fill="none" stroke="#fff9ed" strokeWidth="8" strokeLinecap="round"/><path d="m22 22 56 56" fill="none" stroke="#d83f2d" strokeWidth="5" strokeLinecap="round"/></svg></span><em>con cada pedido?</em></h1>
          <p className="cm-switch-lead">Pasa del localizador al QR que toma pedidos.</p>
          <p>Con COMANDA, escanea el QR, elige y pide desde la mesa. Tu equipo recibe la orden identificada en el panel y gestiona su preparación en un solo lugar.</p>
          {portal?.plans?.cards?.find(plan => plan.clave === 'base') ? <p className="cm-sales-price">Menú QR desde <strong>{currency(portal.plans.cards.find(plan => plan.clave === 'base').precioMensualCOP)} <span>COP/mes</span></strong><small>Pedidos por mesa en Pro y Premium.</small></p> : null}
          <div className="cm-switch-actions"><a className="cm-button" href="#planes">Quiero COMANDA en mi negocio <span aria-hidden="true">↗</span></a><a className="cm-text-link" href="#cm-reel-title">Mira cómo funciona <span aria-hidden="true">↓</span></a></div>
          <small>Pedidos por mesa en Pro y Premium. Requiere internet. La entrega la realiza tu equipo.</small>
        </div>
        <HeroVisual />
      </section>
      <PhotoReel />
      <ServiceTimeline />
      <section className="cm-section cm-plans" id="planes"><div className="cm-section-heading"><div><span className="cm-eyebrow">ELIGE LO QUE TU RESTAURANTE NECESITA</span><h2>Un plan claro.<br /><em>Sin pagar de más.</em></h2></div><p>Precios mensuales en pesos colombianos.<br />Compara funciones y capacidad antes de elegir.</p></div>
        {portal ? <div className="cm-plan-grid">{portal.plans.cards.filter(plan => names[plan.clave]).map(plan => <article key={plan.clave} className={`cm-plan ${plan.clave === 'pro' ? 'cm-plan-featured' : ''}`}><div className="cm-plan-top"><span>{copy[plan.clave][1]}</span>{plan.clave === 'pro' ? <b>PEDIDOS POR MESA</b> : null}</div><h3>Comanda {names[plan.clave]}</h3><p>{copy[plan.clave][0]}</p><div className="cm-price">{currency(plan.precioMensualCOP)}<small>COP / mes</small></div><ul>{planFeatures[plan.clave].map(item => <li key={item}><span>✓</span>{item}</li>)}</ul><div className="cm-plan-limits"><span><b>{plan.limites.productos.toLocaleString('es-CO')}</b> productos</span><span><b>{plan.limites.usuarios}</b> usuarios</span>{plan.limites.pedidosMes ? <span>Hasta <b>{plan.limites.pedidosMes.toLocaleString('es-CO')}</b> pedidos / mes</span> : null}</div><a className={`cm-button cm-plan-link ${plan.clave === 'pro' ? '' : 'cm-button-outline'}`} href={`${ADMIN_ORIGIN}/inicio?plan=${({ base: 'basico', ia: 'premium' }[plan.clave] || plan.clave)}&modo=activar`}>Elegir {names[plan.clave]} ↗</a></article>)}</div> : <div className="cm-plan-loading" role="status">{loadError ? <><p>No pudimos cargar los planes. Puedes volver a intentarlo o escribir a comercial@somosbreviatech.com.</p><button className="cm-button" onClick={() => { setLoadError(false); setAttempt(attempt + 1); }}>Volver a cargar planes</button></> : 'Cargando los planes vigentes…'}</div>}
        {loadError && portal ? <p className="cm-error" role="status">No pudimos actualizar los precios. Confírmalos con nuestro equipo antes de contratar.</p> : null}<p className="cm-plan-note">Activación sujeta a validación comercial y, cuando corresponda, confirmación de pago. ¿Varias sedes? <a href="mailto:comercial@somosbreviatech.com?subject=Cotizaci%C3%B3n%20Comanda%20multisede">Solicita una propuesta.</a></p>
      </section>
      <section className="cm-how" id="como-funciona"><div><span className="cm-eyebrow">EMPIEZA SIN COMPLICACIONES</span><h2>Pon tu menú QR<br /><em>a trabajar.</em></h2><a className="cm-button cm-button-light" href="mailto:comercial@somosbreviatech.com?subject=Quiero%20conocer%20Comanda">Solicitar una demo ↗</a></div><ol>{[['Elige tu plan', 'Básico para publicar tu menú. Pro o Premium para recibir pedidos por mesa.'], ['Configura tu restaurante', 'Carga tus productos, precios, fotos y la información de tu negocio.'], ['Comparte el QR', 'Tus clientes abren el menú desde el celular y usan las funciones incluidas en tu plan.']].map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
      <div ref={sectionRef} className="cm-activation-anchor">{activation ? <Activation key={selected.clave} plan={selected} ready={Boolean(portal.payment?.setupState?.checkoutReady)} onLegal={setLegal} onBack={back} /> : null}</div>
      <section className="cm-section cm-faq"><div><span className="cm-eyebrow">ANTES DE DAR EL PASO</span><h2>Buenas preguntas.<br /><em>Respuestas claras.</em></h2></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="cm-section cm-resource-links" aria-labelledby="cm-guides-title"><span className="cm-eyebrow">COMPARA ANTES DE ELEGIR</span><h2 id="cm-guides-title">Información clara para<br /><em>tomar una buena decisión.</em></h2><div>{publicPages.map(page => <a key={page.path} href={page.path}><strong>{page.label}</strong><span>{page.description}</span><b aria-hidden="true">↗</b></a>)}</div></section><section className="cm-closing"><span className="cm-eyebrow">MENOS VUELTAS. MÁS PEDIDOS EN ORDEN.</span><h2>Convierte cada mesa en<br /><em>un punto de pedido.</em></h2><a className="cm-button" href="mailto:comercial@somosbreviatech.com?subject=Quiero%20una%20demo%20de%20Comanda">Solicitar una demo ↗</a><p>Cuéntanos cómo funciona tu restaurante y te mostramos el plan adecuado.</p></section>
    </main>
    <footer className="cm-footer"><div><a className="cm-brand" href={`${SITE_ORIGIN}${HOME_PATH}`}><img src="/brand/comanda-favicon-192.png" width="40" height="40" alt="" /><strong>comanda</strong></a><p>Tu menú en un QR. Tus pedidos en orden.</p><small>Una solución de Brevia Tech SAS.</small></div><div><strong>Hablemos</strong><a href="mailto:comercial@somosbreviatech.com">comercial@somosbreviatech.com</a><a href={`${ADMIN_ORIGIN}/admin`}>Ingresar al administrador ↗</a></div><div><strong>Condiciones claras</strong>{commercialLegalDocuments.map(doc => <button key={doc.key} onClick={() => setLegal(doc)}>{doc.shortTitle}</button>)}</div><small className="cm-copyright">© {new Date().getFullYear()} Comanda · Brevia Tech SAS. Todos los derechos reservados.</small></footer>
    <a className="cm-floating-cta" href="#planes" aria-label="Ver planes de Comanda"><span>Ver planes</span>{portal?.plans?.cards?.find(plan => plan.clave === 'base') ? <small>Desde {currency(portal.plans.cards.find(plan => plan.clave === 'base').precioMensualCOP)} / mes</small> : <small>Elige tu plan</small>}<b aria-hidden="true">↗</b></a>
    {legal ? <LegalDialog document={legal} onClose={() => setLegal(null)} /> : null}
  </div>;
}
