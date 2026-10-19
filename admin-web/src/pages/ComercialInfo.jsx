import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerExperienciaComercial } from '../api/publicComercialApi';
import '../styles/PublicPortal.css';

const formatCurrencyCOP = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const defaultStats = [
  { label: 'Entrada al producto', value: 'Desde $29.900 COP' },
  { label: 'Activación', value: 'Guiada y trazable' },
  { label: 'Planes disponibles', value: '3 niveles' }
];

const planCtaLabels = {
  base: 'Empezar con Básico QR',
  pro: 'Activar Pro Pedidos',
  ia: 'Activar Premium IA'
};

export default function ComercialInfo() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await obtenerExperienciaComercial();
        setData(response?.data || null);
      } catch (error) {
        console.error('No se pudo cargar la pagina comercial', error);
      }
    };

    load();
  }, []);

  const plans = useMemo(() => data?.plans?.cards || [], [data]);
  const sections = data?.infoPage?.sections || [];
  const stats = data?.infoPage?.sideStats?.length ? data.infoPage.sideStats : defaultStats;

  return (
    <div className="public-shell public-shell--dark">
      <header className="public-topbar">
        <Link className="public-brand" to="/login">
          <img src="/brand/comanda-icon.png" alt="Comanda" />
          <div>
            <strong>{data?.brand?.appName || 'Comanda'}</strong>
            <span>{data?.brand?.appTagline || 'Sistema operativo para restaurantes'}</span>
          </div>
        </Link>

        <div className="public-topbar-actions">
          <Link className="public-link-ghost" to="/login">
            Entrar al panel
          </Link>
        </div>
      </header>

      <main className="public-content">
        <section className="public-hero">
          <div className="public-hero-copy">
            <span className="public-kicker">Menú QR, pedidos y crecimiento comercial</span>
            <h1>Tu restaurante vende mejor cuando la carta, los pedidos y el equipo trabajan en orden</h1>
            <p>
              Comanda reúne menú digital, pedidos por QR, analítica y herramientas comerciales
              para que tus clientes compren fácil y tu operación se vea profesional desde el primer día.
            </p>
            <div className="public-hero-actions">
              <a className="public-button" href="#planes">
                Comparar planes
              </a>
              <Link className="public-button public-button--ghost" to="/login?modo=activar">
                Activar mi restaurante
              </Link>
            </div>
          </div>

          <aside className="public-stats-card">
            <div className="public-stats-card__head">
              <span>Activación clara</span>
              <strong>Elige un plan, crea tu cuenta y deja todo listo para operar</strong>
            </div>
            {stats.map((stat) => (
              <div key={`${stat.label}-${stat.value}`} className="public-stat-row">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </aside>
        </section>

        <section className="public-sections">
          <div className="public-section-heading">
            <span>Qué resuelve Comanda</span>
            <h2>Una experiencia digital simple para el cliente y más control para tu restaurante</h2>
            <p className="public-section-heading__copy">
              Cada módulo está pensado para que el menú sea fácil de consultar, los pedidos lleguen
              con más orden y el equipo tenga una operación más clara.
            </p>
          </div>

          <div className="public-section-grid">
            {sections.map((section, index) => (
              <article key={section.title} className="public-section-card">
                <div className="public-section-card__eyebrow">
                  <span>Bloque {index + 1}</span>
                </div>
                <h3>{section.title}</h3>
                <p>{section.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-plan-showcase" id="planes">
          <div className="public-section-heading">
            <span>Planes para empezar</span>
            <h2>Elige el nivel que necesita tu restaurante hoy</h2>
            <p className="public-section-heading__copy">
              Empieza con carta QR, suma pedidos por mesa cuando quieras ordenar la operación
              y activa IA cuando busques una capa comercial más inteligente.
            </p>
          </div>

          <div className="public-plan-grid">
            {plans.map((plan) => (
              <article
                key={plan.clave}
                className={`public-plan-card ${plan.marketing?.featured ? 'is-featured' : ''}`}
              >
                <div className="public-plan-top">
                  <span className="public-plan-badge">{plan.marketing?.badge}</span>
                  <h3>{plan.nombre}</h3>
                  <strong>{formatCurrencyCOP(plan.precioMensualCOP)}</strong>
                  <p>{plan.marketing?.headline || plan.descripcion}</p>
                </div>
                <p className="public-plan-ideal">{plan.idealPara || plan.descripcion}</p>
                <ul>
                  {(plan.marketing?.bullets || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link className="public-plan-cta" to={`/login?plan=${plan.clave}&modo=activar`}>
                  {planCtaLabels[plan.clave] || plan.marketing?.ctaLabel || `Elegir ${plan.nombre}`}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="public-closing">
          <div>
            <span>{data?.brand?.appName || 'Comanda'}</span>
            <h2>Listo para convertir tu carta en un canal de venta digital</h2>
            <p>
              Selecciona el plan, registra tu restaurante y deja aceptados los documentos
              de activación para comenzar con una base comercial clara.
            </p>
          </div>
          <div className="public-closing-actions">
            <Link className="public-button" to="/login?modo=activar">
              Activar mi restaurante
            </Link>
            <a className="public-button public-button--ghost" href="#planes">
              Ver planes
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
