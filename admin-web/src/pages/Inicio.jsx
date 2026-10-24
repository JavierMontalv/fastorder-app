import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { crearCheckoutPlan, obtenerExperienciaComercial } from '../api/publicComercialApi';
import { commercialLegalDocuments, LEGAL_ACCEPTANCE_VERSION, legalDocumentKeys } from '../constants/legalCommercialDocs';
import '../styles/ComandaInicio.css';

const currency = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
const names = { base: 'Básico', pro: 'Pro', ia: 'Premium' };
const copy = {
  base: ['Tu carta, lista para compartir.', 'Para dar el primer paso digital.'],
  pro: ['De la mesa a tu operación.', 'Para conectar pedidos y equipo.'],
  ia: ['Más control para seguir creciendo.', 'Para una operación más completa.']
};
const benefits = [
  ['01', 'Una carta que abre el apetito.', 'Fotos, categorías y precios siempre actualizados. Comparte el enlace de tu menú o deja que tus clientes lo descubran con un QR.', 'Menú digital'],
  ['02', 'Cada pedido, en su lugar.', 'Con Pro y Premium, recibe pedidos desde la mesa y sigue sus estados para que el equipo trabaje con más claridad.', 'Operación conectada'],
  ['03', 'Conoce mejor tu negocio.', 'Consulta la analítica comercial en Pro y Premium. Identifica los productos más vistos o pedidos y organiza tus promociones.', 'Decisiones con información']
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
    {result ? <div className="cm-form-card" role="status"><span className="cm-label">SOLICITUD RECIBIDA</span><h3>Gracias por dar el primer paso.</h3><p>Tu solicitud quedó registrada. El acceso está pendiente de validación comercial y activación.</p>{result.reference ? <p>Referencia: <strong>{result.reference}</strong></p> : null}<a className="cm-button" href="mailto:ventas@somoscomanda.com?subject=Seguimiento%20de%20activaci%C3%B3n%20Comanda">Contactar al equipo ↗</a></div> : <form className="cm-form-card" onSubmit={submit} aria-busy={busy}>
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
    <div className="cm-order-preview"><div className="cm-order-top"><img src="/brand/comanda-icon.png" alt="" /><strong>Tu operación, conectada</strong><span>● En línea</span></div><div className="cm-order-heading"><h3>Pedidos en curso</h3><span>Vista demo</span></div><div className="cm-order-columns"><div><small>RECIBIDOS <b>02</b></small><article><span>Mesa 04 <em>Nuevo</em></span><strong>2 × Burger de la casa</strong><p>1 × Papas artesanales</p><div>$ 58.000 <span>Hace un momento</span></div></article><article><span>Mesa 08</span><strong>1 × Combo especial</strong><p>Sin cebolla</p></article></div><div><small>EN PREPARACIÓN <b>01</b></small><article><span>Mesa 02 <em>En cocina</em></span><strong>1 × Burger especial</strong><p>1 × Limonada natural</p><div>$ 32.000 <span>Hace 3 min</span></div></article></div></div></div>
    <div className="cm-phone"><div className="cm-phone-notch" /><div className="cm-phone-cover"><img src="/landing/burger.jpg" alt="Hamburguesa con pan artesanal, queso y vegetales" fetchPriority="high" /><span>LA CASA<br /><b>BURGER CLUB</b></span></div><div className="cm-phone-body"><div className="cm-phone-greeting"><span>Tu próxima favorita.</span><small>● Abierto</small></div><h3>Buen sabor.<br />Sin complicaciones.</h3><div className="cm-menu-tabs"><strong>Destacados</strong><span>Burgers</span><span>Bebidas</span></div><div className="cm-food-row"><div><strong>Burger de la casa</strong><p>Carne a la parrilla, queso<br />y nuestra salsa especial.</p><b>$ 24.900</b></div><img src="/landing/burger.jpg" alt="" /></div><div className="cm-food-row"><div><strong>Papas artesanales</strong><p>Crocantes y recién hechas.</p><b>$ 8.900</b></div><img src="/landing/fries.jpg" alt="Papas fritas" /></div><div className="cm-phone-cart">Tu pedido <span>Ver carrito →</span></div></div></div>
    <div className="cm-qr-note"><span aria-hidden="true">▦</span><div><strong>Escanea. Descubre. Disfruta.</strong><p>Una mejor experiencia desde la mesa.</p></div></div><small className="cm-art-disclaimer">Vista ilustrativa · Productos y pedidos de demostración</small>
  </div>;
}

export default function Inicio() {
  const [params, setParams] = useSearchParams();
  const [portal, setPortal] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [legal, setLegal] = useState(null);
  const [menu, setMenu] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => { document.title = 'Comanda | Tu restaurante, mejor conectado'; }, []);
  useEffect(() => {
    let active = true;
    obtenerExperienciaComercial().then(response => { if (!response?.data?.plans?.cards?.length) throw new Error('Planes no disponibles'); if (active) { setPortal(response.data); setLoadError(false); } }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [attempt]);
  const selected = portal?.plans?.cards?.find(plan => plan.clave === ({ basico: 'base', premium: 'ia' }[params.get('plan')] || params.get('plan')));
  const activation = params.get('modo') === 'activar' && selected;
  useEffect(() => { if (activation) sectionRef.current?.scrollIntoView({ block: 'start' }); }, [activation]);
  function selectPlan(plan) { setParams({ plan: ({ base: 'basico', ia: 'premium' }[plan] || plan), modo: 'activar' }); }
  function back() { setParams({}); document.getElementById('planes')?.scrollIntoView(); }
  return <div className="cm-public cm-home">
    <a className="cm-skip" href="#contenido">Saltar al contenido</a>
    <header className="cm-nav"><Link className="cm-brand" to="/inicio"><img src="/brand/comanda-icon.png" alt="" /><strong>comanda</strong></Link><button className="cm-menu-button" aria-expanded={menu} aria-controls="cm-navigation" onClick={() => setMenu(!menu)}>Menú {menu ? '×' : '+'}</button><nav id="cm-navigation" className={menu ? 'is-open' : ''} aria-label="Navegación principal"><a href="#solucion" onClick={() => setMenu(false)}>La solución</a><a href="#como-funciona" onClick={() => setMenu(false)}>Cómo funciona</a><a href="#planes" onClick={() => setMenu(false)}>Planes</a><Link className="cm-nav-access" to="/admin">Ingresar a mi restaurante ↗</Link></nav></header>
    <main id="contenido">
      <section className="cm-hero"><div className="cm-hero-copy"><span className="cm-eyebrow"><i /> MÁS QUE UN MENÚ DIGITAL</span><h1>Buen servicio.<br />Mejores conexiones.<br /><em>Eso es Comanda.</em></h1><p>Tu carta abre el apetito. Tu equipo toma el control.<br className="cm-desktop-break" /> Conecta menú QR, pedidos y herramientas comerciales en una experiencia hecha para tu restaurante.</p><div className="cm-hero-actions"><a className="cm-button" href="#planes">Encuentra tu plan <span>↗</span></a><a className="cm-text-link" href="mailto:ventas@somoscomanda.com?subject=Quiero%20una%20demo%20de%20Comanda">Solicitar una demo →</a></div><div className="cm-hero-foot"><span>MENOS FRICCIÓN.<br /><b>MÁS TIEMPO PARA ATENDER.</b></span><div><strong>QR</strong><span>Sin descargar apps<br />para consultar tu menú.</span></div></div></div><ProductPreview /></section>
      <div className="cm-trust-strip"><span>UN SOLO LUGAR. TODO EL RECORRIDO.</span><strong>Carta digital <i>↗</i></strong><strong>Pedidos por mesa <i>↗</i></strong><strong>Control comercial <i>↗</i></strong></div>
      <section className="cm-section" id="solucion"><div className="cm-section-heading"><div><span className="cm-eyebrow">PENSADO PARA TU DÍA A DÍA</span><h2>Que la tecnología fluya.<br /><em>Y tu restaurante también.</em></h2></div><p>Desde el primer vistazo a la carta hasta la gestión de cada pedido. Elige las herramientas que necesita tu negocio.</p></div><div className="cm-benefits">{benefits.map(([number, title, text, label]) => <article key={number}><div><span>{number}</span><span className="cm-feature-icon" aria-hidden="true">{number === '01' ? '▦' : number === '02' ? '↗' : '◷'}</span></div><small>{label}</small><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="cm-how" id="como-funciona"><div><span className="cm-eyebrow">DEL PRIMER CONTACTO AL PRIMER SERVICIO</span><h2>Tu siguiente paso<br />puede ser <em>más simple.</em></h2><a className="cm-button cm-button-light" href="mailto:ventas@somoscomanda.com?subject=Quiero%20conocer%20Comanda">Hablemos de tu restaurante ↗</a></div><ol>{[['Elige cómo empezar', 'Compara los planes o solicita una demo para conocer Comanda con el equipo.'], ['Coordinamos tu activación', 'Confirmamos las condiciones de tu demo o plan y habilitamos las credenciales correspondientes.'], ['Dale vida a tu carta', 'Configura tus productos, comparte el QR y utiliza las funciones incluidas en tu plan.']].map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
      <section className="cm-section cm-plans" id="planes"><div className="cm-section-heading"><div><span className="cm-eyebrow">UN PLAN PARA CADA ETAPA</span><h2>Empieza a tu ritmo.<br /><em>Crece con Comanda.</em></h2></div><p>Precios mensuales en pesos colombianos.<br />Consulta el alcance y las condiciones antes de contratar.</p></div>
        {portal ? <div className="cm-plan-grid">{portal.plans.cards.filter(plan => names[plan.clave]).map(plan => <article key={plan.clave} className={`cm-plan ${plan.clave === 'pro' ? 'cm-plan-featured' : ''}`}><div className="cm-plan-top"><span>{copy[plan.clave][1]}</span>{plan.clave === 'pro' ? <b>PARA TU OPERACIÓN</b> : null}</div><h3>Comanda {names[plan.clave]}</h3><p>{copy[plan.clave][0]}</p><div className="cm-price">{currency(plan.precioMensualCOP)}<small>COP / mes</small></div><button className={`cm-button ${plan.clave === 'pro' ? '' : 'cm-button-outline'}`} onClick={() => selectPlan(plan.clave)}>Elegir {names[plan.clave]} ↗</button><ul>{plan.caracteristicas.filter(item => !/\bia\b|inteligencia artificial|codex/iu.test(item)).map(item => <li key={item}><span>✓</span>{item}</li>)}</ul><div className="cm-plan-limits"><span><b>{plan.limites.productos.toLocaleString('es-CO')}</b> productos</span><span><b>{plan.limites.usuarios}</b> usuarios</span>{plan.limites.pedidosMes ? <span>Hasta <b>{plan.limites.pedidosMes.toLocaleString('es-CO')}</b> pedidos / mes</span> : null}</div></article>)}</div> : <div className="cm-plan-loading" role="status">{loadError ? <><p>No pudimos cargar los planes. Puedes volver a intentarlo o escribir a ventas@somoscomanda.com.</p><button className="cm-button" onClick={() => { setLoadError(false); setAttempt(attempt + 1); }}>Volver a cargar planes</button></> : 'Cargando los planes vigentes…'}</div>}
        <p className="cm-plan-note">Activación sujeta a validación comercial y, cuando corresponda, confirmación de pago. ¿Varias sedes? <a href="mailto:ventas@somoscomanda.com?subject=Cotizaci%C3%B3n%20Comanda%20multisede">Solicita una propuesta.</a></p>
      </section>
      <div ref={sectionRef} className="cm-activation-anchor">{activation ? <Activation key={selected.clave} plan={selected} ready={Boolean(portal.payment?.setupState?.checkoutReady)} onLegal={setLegal} onBack={back} /> : null}</div>
      <section className="cm-section cm-faq"><div><span className="cm-eyebrow">ANTES DE DAR EL PASO</span><h2>Buenas preguntas.<br /><em>Respuestas claras.</em></h2></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="cm-closing"><span className="cm-eyebrow">TU RESTAURANTE TIENE MUCHO POR SERVIR.</span><h2>Conectemos lo<br /><em>que viene.</em></h2><a className="cm-button" href="mailto:ventas@somoscomanda.com?subject=Quiero%20una%20demo%20de%20Comanda">Solicitar una demo ↗</a><p>Se abrirá tu correo para coordinar una demostración con nuestro equipo.</p></section>
    </main>
    <footer className="cm-footer"><div><Link className="cm-brand" to="/inicio"><img src="/brand/comanda-icon.png" alt="" /><strong>comanda</strong></Link><p>Buena tecnología. Mejor servicio.</p><small>Una solución de Brevia Tech SAS.</small></div><div><strong>Hablemos</strong><a href="mailto:ventas@somoscomanda.com">ventas@somoscomanda.com</a><Link to="/admin">Ingresar al administrador ↗</Link></div><div><strong>Condiciones claras</strong>{commercialLegalDocuments.map(doc => <button key={doc.key} onClick={() => setLegal(doc)}>{doc.shortTitle}</button>)}</div><small className="cm-copyright">© {new Date().getFullYear()} Comanda · Brevia Tech SAS. Todos los derechos reservados.</small></footer>
    {legal ? <LegalDialog document={legal} onClose={() => setLegal(null)} /> : null}
  </div>;
}
