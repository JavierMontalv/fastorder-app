import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  crearCheckoutPlan,
  obtenerExperienciaComercial
} from '../api/publicComercialApi';
import {
  LEGAL_ACCEPTANCE_VERSION,
  commercialLegalDocuments,
  legalDocumentKeys
} from '../constants/legalCommercialDocs';
import { AuthContext } from '../context/AuthContext';
import '../styles/PublicPortal.css';

const emptySignup = {
  name: '',
  email: '',
  phone: '',
  businessName: '',
  password: '',
  acceptedTerms: false,
  acceptedDataPolicy: false
};

const launchMetrics = [
  { label: 'Menú digital', value: 'Siempre actualizado' },
  { label: 'Pedidos', value: 'Más ordenados' },
  { label: 'Soporte inicial', value: 'Incluido' }
];

const legalReadinessItems = [
  'Contrato SaaS y términos aceptados por mensaje de datos.',
  'Política y autorización de tratamiento de datos personales.',
  'Orden de servicio con plan, precio y alcance de activación.',
  'Soporte de versión, fecha, correo y datos del restaurante.'
];

const planAccent = {
  base: 'Para empezar',
  pro: 'Más elegido',
  ia: 'Más completo'
};

const consumerPlanContent = {
  base: {
    badge: 'Entrada rápida',
    name: 'Comanda Básico',
    accent: 'Carta QR',
    headline: 'Publica tu carta por QR, actualiza precios al instante y comparte tu menú en redes.',
    bullets: [
      'Menú QR público para tus clientes.',
      'Carta editable con productos, categorías, fotos y precios.',
      'Logo, colores básicos y enlace para Instagram o WhatsApp.',
      'Ideal para locales que quieren dejar atrás el menú impreso.'
    ],
    cta: 'Activar Comanda Básico'
  },
  pro: {
    badge: 'Más elegido',
    name: 'Comanda Pro',
    accent: 'Operación',
    headline: 'Recibe pedidos desde la mesa, organiza la operación y vende con una experiencia más profesional.',
    bullets: [
      'Incluye todo lo de Comanda Básico.',
      'Pedidos desde la mesa y QR por mesa.',
      'Estados del pedido para operar con más orden.',
      'Promociones visibles, analítica comercial y configuración inicial.'
    ],
    cta: 'Activar Comanda Pro'
  },
  ia: {
    badge: 'Premium',
    name: 'Comanda Premium',
    accent: 'IA comercial',
    headline: 'Suma inteligencia comercial para mejorar descripciones, traducciones, combos y decisiones del menú.',
    bullets: [
      'Incluye todo lo de Comanda Pro.',
      'Descripciones, traducciones y sugerencias con IA.',
      'Productos destacados y promociones inteligentes.',
      'Reportes de productos más vistos o más pedidos.'
    ],
    cta: 'Activar Comanda Premium'
  }
};

const planLimitCopy = (plan) => {
  if (!plan) return [];

  const limits = plan.limites || {};
  const rows = [`${Number(limits.productos || 0).toLocaleString('es-CO')} productos`, `${Number(limits.usuarios || 1).toLocaleString('es-CO')} usuarios`];

  if (plan.clave === 'base') {
    rows.push('Menú QR');
  }

  if (plan.clave === 'pro') {
    rows.push('Pedidos por mesa');
  }

  if (plan.clave === 'ia') {
    rows.push('IA comercial');
  }

  return rows;
};

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const authPanelRef = useRef(null);

  const [portal, setPortal] = useState(null);
  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [error, setError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutPlanLoading, setCheckoutPlanLoading] = useState(null);
  const [activationResult, setActivationResult] = useState(null);
  const [activeLegalDocument, setActiveLegalDocument] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    const modeParam = params.get('modo');

    if (['base', 'pro', 'ia'].includes(planParam)) {
      setSelectedPlan(planParam);
    }

    if (planParam || modeParam === 'activar') {
      setActiveTab('login');
    }
  }, [location.search]);

  useEffect(() => {
    const loadPortal = async () => {
      try {
        const response = await obtenerExperienciaComercial();
        setPortal(response?.data || null);
      } catch (err) {
        console.error('No se pudo cargar la experiencia comercial', err);
      }
    };

    loadPortal();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignupForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const destino = await login(form);
      navigate(destino || '/', { replace: true });
    } catch (err) {
      setError(err?.message || 'No se pudo iniciar sesión.');
    }
  };

  const handleStartCheckout = async (planClave) => {
    setSelectedPlan(planClave);
    setCheckoutError('');
    setActivationResult(null);

    try {
      setCheckoutPlanLoading(planClave);
      const response = await crearCheckoutPlan({ plan: planClave });
      const checkoutUrl = response?.data?.checkoutUrl;

      if (!checkoutUrl) {
        setCheckoutError(
          response?.message || 'No fue posible abrir Wompi. Verifica la configuracion de pagos.'
        );
        return;
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      setCheckoutError(
        err?.message?.includes('Wompi')
          ? 'Wompi todavia no esta configurado. Falta cargar las llaves de Wompi en produccion.'
          : err?.message || 'No fue posible iniciar el pago con Wompi.'
      );
    } finally {
      setCheckoutPlanLoading(null);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (!selectedPlan) {
      setCheckoutError('Selecciona un plan antes de continuar.');
      return;
    }

    if (!signupForm.acceptedTerms || !signupForm.acceptedDataPolicy) {
      setCheckoutError('Para continuar debes leer y aceptar los términos, el contrato SaaS y la política de tratamiento de datos.');
      return;
    }

    try {
      setCheckoutLoading(true);
      const response = await crearCheckoutPlan({
        plan: selectedPlan,
        customer: {
          ...signupForm,
          legalAcceptance: {
            version: LEGAL_ACCEPTANCE_VERSION,
            documents: legalDocumentKeys,
            acceptedAt: new Date().toISOString()
          }
        }
      });

      const checkoutUrl = response?.data?.checkoutUrl;
      if (!checkoutUrl) {
        setActivationResult(response?.data || {
          mode: 'assisted_activation',
          plan: selectedPlan
        });
        return;
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      setCheckoutError(err?.message || 'No se pudo completar la activación del plan.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plans = useMemo(() => portal?.plans?.cards || [], [portal]);
  const legalDocument = commercialLegalDocuments.find((doc) => doc.key === activeLegalDocument);
  const setupReady = Boolean(portal?.payment?.setupState?.checkoutReady);
  const automaticActivationReady = Boolean(portal?.payment?.setupState?.automaticActivationReady);
  const selectedPlanData = plans.find((plan) => plan.clave === selectedPlan) || null;
  const formatCurrencyCOP = (value) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value || 0));

  const getPlanContent = (plan) => consumerPlanContent[plan?.clave] || {
    badge: plan?.marketing?.badge || plan?.nombre || 'Plan',
    name: plan?.nombre || 'Plan COMANDA',
    accent: planAccent[plan?.clave] || 'Plan',
    headline: plan?.marketing?.headline || plan?.descripcion || '',
    bullets: plan?.marketing?.bullets || plan?.caracteristicas || [],
    cta: plan?.marketing?.ctaLabel || 'Elegir plan'
  };

  const handleEnterpriseContact = () => {
    const phone = String(portal?.brand?.supportWhatsApp || '').replace(/\D/g, '');
    const message = 'Hola, quiero cotizar Comanda para varias sedes de mi restaurante.';

    if (phone) {
      window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      return;
    }

    const email = portal?.brand?.supportEmail || 'ventas@somoscomanda.com';
    window.location.href = `mailto:${email}?subject=${encodeURIComponent('Cotización Comanda Multisede')}&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="marketing-login-shell">
      <header className="marketing-login-topbar">
        <Link className="marketing-login-brand" to="/login">
          <img src="/brand/comanda-icon.png" alt="Comanda" />
          <div>
            <strong>{portal?.brand?.appName || 'Comanda'}</strong>
            <span>Menú QR, pedidos y herramientas digitales para restaurantes</span>
          </div>
        </Link>

        <div className="marketing-login-actions">
          <Link className="marketing-login-link" to={portal?.login?.secondaryCtaPath || '/descubre'}>
            Ver cómo funciona
          </Link>
        </div>
      </header>

      <main className="marketing-login-grid marketing-login-grid--wide">
        <section className="marketing-login-left">
          <div className="marketing-plans-head marketing-plans-head--first">
            <div>
              <span>Activación comercial COMANDA</span>
              <h2>Elige tu plan, crea tu cuenta y empieza a vender con una carta digital profesional</h2>
            </div>
            <p>
              En pocos pasos dejas listo el acceso de tu restaurante, seleccionas el alcance que necesitas
              y registras la aceptación de documentos para activar el servicio con trazabilidad.
            </p>
          </div>

          <section className="marketing-legalization-panel" aria-label="Legalización comercial de COMANDA">
            <div className="marketing-legalization-copy">
              <span className="marketing-legal-eyebrow">Compra clara y respaldada</span>
              <h3>Activa con condiciones visibles desde el inicio</h3>
              <p>
                Antes de crear la cuenta puedes revisar términos, contrato SaaS y privacidad.
                Comanda conserva la versión aceptada junto con los datos de activación.
              </p>
            </div>
            <ul className="marketing-legalization-list">
              {legalReadinessItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="marketing-legal-actions marketing-legalization-actions">
              {commercialLegalDocuments.map((doc) => (
                <button
                  key={doc.key}
                  type="button"
                  className="marketing-legal-link"
                  onClick={() => setActiveLegalDocument(doc.key)}
                >
                  Revisar {doc.shortTitle}
                </button>
              ))}
            </div>
          </section>

          <div className="marketing-plans-head marketing-plans-head--secondary">
            <div>
              <span>Elige tu plan</span>
              <h2>Selecciona cómo quieres empezar</h2>
            </div>
            <p>
              Puedes comenzar solo con carta QR, operar pedidos desde mesa o sumar IA comercial
              para mejorar textos, combos y decisiones del menú.
            </p>
          </div>

          <div className="marketing-plan-grid marketing-plan-grid--first">
            {plans.map((plan) => {
              const planContent = getPlanContent(plan);

              return (
              <article
                key={plan.clave}
                className={`marketing-plan-card ${plan.marketing?.featured ? 'is-featured' : ''} ${selectedPlan === plan.clave ? 'is-selected' : ''}`}
              >
                <div className="marketing-plan-card__top">
                  <div>
                    <div className="marketing-plan-badge">{planContent.badge}</div>
                    <h3>{planContent.name}</h3>
                  </div>
                  <span className="marketing-plan-accent">{planContent.accent}</span>
                </div>
                <div className="marketing-plan-price">
                  <strong>{formatCurrencyCOP(plan.precioMensualCOP)} / mes</strong>
                  <span>Precio mensual</span>
                </div>
                <p>{planContent.headline}</p>

                <ul>
                  {planContent.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="marketing-plan-limits">
                  {planLimitCopy(plan).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>

                <button
                  type="button"
                  className="marketing-plan-button"
                  disabled={checkoutPlanLoading === plan.clave}
                  onClick={() => handleStartCheckout(plan.clave)}
                >
                  {checkoutPlanLoading === plan.clave ? 'Abriendo Wompi...' : `Elegir ${planContent.name}`}
                </button>
              </article>
              );
            })}
          </div>

          {checkoutError ? <p className="login-error">{checkoutError}</p> : null}

          <section className="marketing-legal-panel" aria-label="Documentos contractuales de COMANDA">
            <div>
              <span className="marketing-legal-eyebrow">Sin letra pequeña</span>
              <h3>Todo queda claro antes de activar tu restaurante</h3>
              <p>
                Revisas los documentos, eliges el plan y registras la aceptación en la misma experiencia.
                Así el restaurante sabe qué está contratando y qué incluye su activación.
              </p>
            </div>
            <div className="marketing-legal-actions">
              {commercialLegalDocuments.map((doc) => (
                <button
                  key={doc.key}
                  type="button"
                  className="marketing-legal-link"
                  onClick={() => setActiveLegalDocument(doc.key)}
                >
                  Leer {doc.shortTitle}
                </button>
              ))}
            </div>
          </section>

          <div className="marketing-trust-pills">
            {['Menú QR editable', 'Pedidos más ordenados', 'Precios claros', 'Soporte inicial incluido'].map((pill) => (
              <span key={pill}>{pill}</span>
            ))}
          </div>

          <div className="marketing-hero-band marketing-hero-band--compact">
            <div className="marketing-login-copy">
              <span className="marketing-login-kicker">Para vender mejor desde el primer día</span>
              <h1>Menú digital, pedidos y crecimiento en una sola plataforma</h1>
              <p>
                Comanda ayuda a que tus clientes consulten, pidan y entiendan mejor tu oferta, mientras tu equipo
                mantiene productos, precios, disponibilidad y promociones bajo control.
              </p>
            </div>

            <div className="marketing-launch-metrics">
              {launchMetrics.map((metric) => (
                <div key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <article className="marketing-enterprise-strip">
            <div>
              <span>Para varias sedes</span>
              <h3>Una marca, varias operaciones, todo bajo control</h3>
              <p>
                Si tienes más de un punto de venta, podemos configurar una operación multisede para que cada local
                conserve su menú, pedidos, productos, promociones y equipo de trabajo.
              </p>
            </div>
            <div className="marketing-enterprise-pricing">
              <strong>Desde {formatCurrencyCOP(149900)} / mes</strong>
              <span>2 sedes incluidas</span>
              <button type="button" className="marketing-plan-button" onClick={handleEnterpriseContact}>
                Hablar sobre multisede
              </button>
            </div>
          </article>
        </section>

        <section className="marketing-login-right marketing-login-right--stack" ref={authPanelRef}>
          <div className="marketing-auth-card">
            <div className="marketing-auth-tabs">
              <button
                type="button"
                className={activeTab === 'login' ? 'is-active' : ''}
                onClick={() => setActiveTab('login')}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                className={activeTab === 'signup' ? 'is-active' : ''}
                onClick={() => {
                  setActiveTab('login');
                  document.querySelector('.marketing-plan-grid--first')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
              >
                Crear cuenta
              </button>
            </div>

            {activeTab === 'login' ? (
              <form className="marketing-login-card marketing-login-card--flat" onSubmit={handleSubmit}>
                <div className="login-logo">
                  <img className="login-logo-icon" src="/brand/comanda-icon.png" alt="Comanda" />
                </div>

                <h2 className="login-title">Entra a tu restaurante</h2>
                <p className="login-subtitle">
                  Accede para actualizar tu menú, revisar pedidos y administrar tu operación.
                </p>

                {error && <p className="login-error">{error}</p>}

                <input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />

                <button className="login-btn" type="submit">
                  Entrar al panel
                </button>

                <p className="marketing-login-note">
                  Si aún no tienes cuenta, elige un plan y activa Comanda para tu restaurante.
                </p>
              </form>
            ) : activationResult ? (
              <div className="marketing-activation-success">
                <span className="marketing-signup-kicker">Solicitud recibida</span>
                <h2>Ya tenemos tu solicitud</h2>
                <p>
                  Registramos tu restaurante, el plan elegido y tus datos de contacto. Te ayudaremos a completar
                  la activación para que puedas empezar a configurar tu carta.
                </p>

                <div className="marketing-activation-summary">
                  <span>Plan elegido</span>
                  <strong>
                    {selectedPlanData?.nombre || selectedPlan.toUpperCase()} -{' '}
                    {formatCurrencyCOP(activationResult.amountCOP || selectedPlanData?.precioMensualCOP || 0)} / mes
                  </strong>
                </div>

                {activationResult.reference ? (
                  <div className="marketing-activation-reference">
                    <span>Referencia</span>
                    <strong>{activationResult.reference}</strong>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="marketing-plan-button"
                  onClick={() => {
                    setActivationResult(null);
                    setSignupForm(emptySignup);
                    setActiveTab('login');
                  }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form className="marketing-signup-card" onSubmit={handleCheckout}>
                <div className="marketing-signup-head">
                  <span className="marketing-signup-kicker">Activar restaurante</span>
                  <h2>Crea tu cuenta y deja el plan listo</h2>
                  <p>
                    Registra los datos básicos, acepta las condiciones y avanza con la activación del servicio.
                  </p>
                </div>

                <div className="marketing-signup-plan">
                  <span>Plan elegido</span>
                  <strong>
                    {selectedPlanData?.nombre || selectedPlan.toUpperCase()} -{' '}
                    {formatCurrencyCOP(selectedPlanData?.precioMensualCOP || 0)} / mes
                  </strong>
                </div>

                {!setupReady ? (
                  <div className="marketing-checkout-warning">
                    Estamos terminando la activación de pagos en línea. Por ahora registraremos tu solicitud
                    para contactarte y dejar tu plan listo.
                  </div>
                ) : null}

                <div className="marketing-signup-grid">
                  <input
                    type="text"
                    name="businessName"
                    placeholder="Nombre del restaurante"
                    value={signupForm.businessName}
                    onChange={handleSignupChange}
                    required
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Tu nombre"
                    value={signupForm.name}
                    onChange={handleSignupChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo de acceso"
                    value={signupForm.email}
                    onChange={handleSignupChange}
                    required
                  />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Teléfono o WhatsApp"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Crea tu contraseña"
                    value={signupForm.password}
                    onChange={handleSignupChange}
                    required
                  />
                </div>

                <div className="marketing-legal-acceptance">
                  <div>
                    <span>Documentos de compra</span>
                    <p>
                      Revisa las condiciones antes de continuar. Al aceptar, dejaremos constancia de la versión
                      {` ${LEGAL_ACCEPTANCE_VERSION}`}.
                    </p>
                  </div>
                  <div className="marketing-legal-mini-actions">
                    {commercialLegalDocuments.map((doc) => (
                      <button
                        key={doc.key}
                        type="button"
                        onClick={() => setActiveLegalDocument(doc.key)}
                      >
                        {doc.shortTitle}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="marketing-signup-check">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={signupForm.acceptedTerms}
                    onChange={handleSignupChange}
                  />
                  <span>
                    Acepto los términos y condiciones, el contrato SaaS y las condiciones del plan seleccionado.
                    Declaro que ya los leí y entiendo que esta aceptación podrá conservarse como soporte de la compra.
                  </span>
                </label>

                <label className="marketing-signup-check marketing-signup-check--privacy">
                  <input
                    type="checkbox"
                    name="acceptedDataPolicy"
                    checked={signupForm.acceptedDataPolicy}
                    onChange={handleSignupChange}
                  />
                  <span>
                    Autorizo el tratamiento de mis datos personales conforme a la política de tratamiento de datos
                    de COMANDA para gestionar cuenta, activación, pagos, soporte, facturación y comunicaciones del servicio.
                  </span>
                </label>

                {checkoutError ? <p className="login-error">{checkoutError}</p> : null}

                <button
                  className="marketing-plan-button"
                  type="submit"
                  disabled={!selectedPlan || checkoutLoading || !signupForm.acceptedTerms || !signupForm.acceptedDataPolicy}
                >
                  {checkoutLoading ? 'Preparando activación...' : setupReady ? 'Crear cuenta y pagar plan' : 'Solicitar activación'}
                </button>
              </form>
            )}
          </div>

          <aside className="marketing-side-note">
            <div className="marketing-side-note__label">Legalización</div>
            <ol>
              <li>Revisas los documentos contractuales disponibles.</li>
              <li>Eliges el plan y registras los datos del restaurante.</li>
              <li>Aceptas términos, contrato SaaS y tratamiento de datos.</li>
              <li>COMANDA guarda versión, fecha y soporte de la activación.</li>
            </ol>
          </aside>
        </section>
      </main>

      {legalDocument ? (
        <div className="marketing-legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-document-title">
          <div className="marketing-legal-modal__backdrop" onClick={() => setActiveLegalDocument(null)} />
          <article className="marketing-legal-modal__card">
            <header>
              <div>
                <span>Documento comercial</span>
                <h2 id="legal-document-title">{legalDocument.title}</h2>
                <p>{legalDocument.subtitle}</p>
              </div>
              <button type="button" onClick={() => setActiveLegalDocument(null)} aria-label="Cerrar documento">
                ×
              </button>
            </header>

            <div className="marketing-legal-modal__content">
              {legalDocument.sections.map((section) => (
                <section key={section.heading}>
                  <h3>{section.heading}</h3>
                  <p>{section.body}</p>
                </section>
              ))}
              <p className="marketing-legal-version">
                Versión de aceptación: {LEGAL_ACCEPTANCE_VERSION}. BREVIA TECH SAS - NIT 902064436-4.
              </p>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
