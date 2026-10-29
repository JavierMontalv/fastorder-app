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
const benefits = [
  ['01', 'Tu menú, listo para vender.', 'Muestra fotos, categorías, precios y disponibilidad en una carta diseñada para el celular.', 'Menú QR'],
  ['02', 'Cada pedido con su mesa.', 'Con Pro y Premium, la orden llega al panel con la referencia que tu equipo necesita para atenderla.', 'Pedidos por mesa'],
  ['03', 'Decide con datos reales.', 'Consulta qué productos ven o piden tus clientes y usa esa información para organizar tus promociones.', 'Control comercial']
];
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

const reelItems = [
  { src: '/landing/journey-01-scan.webp', step: '01', label: 'Escanea', title: 'El QR abre el menú', text: 'Sin descargar aplicaciones.', status: 'QR listo' },
  { src: '/landing/journey-02-order.webp', step: '02', label: 'Elige y agrega', title: 'El cliente arma su pedido', text: 'Fotos, precios y botones claros.', status: '+ Agregar' },
  { src: '/landing/journey-03-kitchen.webp', step: '03', label: 'Prepara', title: 'La orden llega a cocina', text: 'El equipo recibe el pedido organizado.', status: 'En cocina' },
  { src: '/landing/journey-04-serve.webp', step: '04', label: 'Entrega', title: 'El pedido llega a la mesa', text: 'El recorrido termina donde empezó.', status: 'Listo' }
];

function PhotoReel() {
  const [position, setPosition] = useState(0);
  const [stepWidth, setStepWidth] = useState(0);
  const [animated, setAnimated] = useState(true);
  const [paused, setPaused] = useState(false);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const active = position % reelItems.length;

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
    if (paused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setAnimated(true);
      setPosition(index => index >= reelItems.length ? 1 : index + 1);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [paused, selectionEpoch]);

  function selectStep(index) {
    setAnimated(true);
    setPosition(index);
    setSelectionEpoch(epoch => epoch + 1);
  }

  function finishTransition(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
    if (position === reelItems.length) {
      setAnimated(false);
      setPosition(0);
    }
  }

  return <section className="cm-photo-reel" aria-labelledby="cm-reel-title" aria-roledescription="carrusel">
    <div className="cm-reel-heading"><span className="cm-eyebrow">EL RECORRIDO COMPLETO DE COMANDA</span><h2 id="cm-reel-title">Del QR a la mesa.<br /><em>Todo conectado.</em></h2><p>Cuatro momentos, una sola experiencia: el cliente pide con facilidad y tu equipo sabe qué hacer después.</p></div>
    <div className="cm-journey-line" role="group" aria-label="Elige un momento del recorrido">{reelItems.map((item, index) => <button type="button" key={item.step} className={active === index ? 'is-active' : ''} aria-pressed={active === index} aria-controls="cm-reel-viewport" onClick={() => selectStep(index)}><b aria-hidden="true">{item.step}</b>{item.label}</button>)}</div>
    <div className="cm-reel-toolbar"><button type="button" className="cm-reel-toggle" aria-controls="cm-reel-viewport" onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{paused ? 'Reanudar recorrido' : 'Pausar recorrido'}</button></div>
    <div className="cm-reel-window" id="cm-reel-viewport" ref={viewportRef} aria-live="off"><div className="cm-reel-track" ref={trackRef} data-active-step={active + 1} data-playing={!paused} onTransitionEnd={finishTransition} style={{ transform: `translate3d(-${position * stepWidth}px, 0, 0)`, transition: animated ? undefined : 'none' }}>{[...reelItems, ...reelItems].map((item, index) => <figure key={`${item.src}-${index}`} aria-hidden={index >= reelItems.length}><img src={item.src} alt={index < reelItems.length ? item.title : ''} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" width="1600" height="900" /><span className={`cm-journey-status cm-journey-status-${item.step}`}>{item.status}</span><figcaption><small><b>{item.step}</b> {item.label} · {item.text}</small><strong>{item.title}</strong></figcaption></figure>)}</div></div>
    <div className="cm-reel-promise"><span><b>01</b> ESCANEA</span><span><b>02</b> PIDE</span><span><b>03</b> PREPARA</span><span><b>04</b> ENTREGA</span><strong>UN QR. TODO EL SERVICIO CONECTADO.</strong></div>
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
          <h1 id="cm-switch-title">¿Todavía entregas un localizador <em>con cada pedido?</em></h1>
          <p className="cm-switch-lead">El siguiente paso está en el celular de tu cliente.</p>
          <p>Con COMANDA, escanea el QR, elige y pide desde la mesa. Tu equipo recibe la orden identificada en el panel y gestiona su preparación en un solo lugar.</p>
          {portal?.plans?.cards?.find(plan => plan.clave === 'base') ? <p className="cm-sales-price">Menú QR desde <strong>{currency(portal.plans.cards.find(plan => plan.clave === 'base').precioMensualCOP)} <span>COP/mes</span></strong><small>Pedidos por mesa en Pro y Premium.</small></p> : null}
          <div className="cm-switch-actions"><a className="cm-button" href="#planes">Quiero COMANDA en mi negocio <span aria-hidden="true">↗</span></a><a className="cm-text-link" href="#cm-reel-title">Mira cómo funciona <span aria-hidden="true">↓</span></a></div>
          <small>Pedidos por mesa en Pro y Premium. Requiere internet. La entrega la realiza tu equipo.</small>
        </div>
        <div className="cm-switch-visual" aria-label="Del localizador físico al pedido digital identificado por mesa">
          <div className="cm-switch-before"><span className="cm-switch-tag">EL LOCALIZADOR</span><div className="cm-pager" aria-hidden="true"><span className="cm-pager-leds">● ● ●</span><div><small>TURNO</small><b>08</b></div><span className="cm-pager-leds">● ● ●</span></div><p>Un dispositivo para llamar.</p></div>
          <span className="cm-switch-arrow" aria-hidden="true">↗</span>
          <div className="cm-switch-after"><span className="cm-switch-tag">LA EXPERIENCIA COMANDA</span><div className="cm-switch-order"><div className="cm-switch-order-top"><img src="/brand/comanda-favicon-192.png" width="32" height="32" alt="" /><strong>comanda</strong><span>EN LÍNEA</span></div><div className="cm-switch-table"><span>Pedido identificado</span><b>Mesa 08</b></div><div className="cm-switch-dish"><img src="/landing/burger.webp" alt="" width="64" height="64" loading="lazy" /><div><strong>2 × Burger de la casa</strong><span>La orden, clara para tu equipo.</span></div></div><div className="cm-switch-state"><i /> Recibido <span>→</span> En preparación</div></div><p>Menú, pedido y mesa. Conectados.</p></div>
        </div>
      </section>
      <PhotoReel />
      <section className="cm-section" id="solucion"><div className="cm-section-heading"><div><span className="cm-eyebrow">MENÚ, PEDIDOS Y CONTROL EN UN SOLO LUGAR</span><h2>Todo lo necesario para<br /><em>vender y atender mejor.</em></h2></div><p>Empieza con un menú QR y añade pedidos por mesa y analítica según las necesidades de tu restaurante.</p></div><div className="cm-benefits">{benefits.map(([number, title, text, label]) => <article key={number}><div><span>{number}</span><span className="cm-feature-icon" aria-hidden="true">{number === '01' ? '▦' : number === '02' ? '↗' : '◷'}</span></div><small>{label}</small><h3>{title}</h3><p>{text}</p></article>)}</div></section>
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
