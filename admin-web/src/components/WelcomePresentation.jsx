import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiSettings,
  FiShoppingBag,
  FiUsers,
  FiX,
  FiZap
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import '../styles/WelcomePresentation.css';

const STEPS = [
  {
    icon: <FiSettings size={17} />,
    title: 'Configura la identidad del local',
    description: 'Completa nombre, horarios, imagen y datos visibles para tus clientes.'
  },
  {
    icon: <FiShoppingBag size={17} />,
    title: 'Construye tu carta digital',
    description: 'Organiza categorías, productos, precios, disponibilidad y promociones.'
  },
  {
    icon: <FiZap size={17} />,
    title: 'Recibe y opera pedidos QR',
    description: 'El cliente escanea, ordena y tu equipo administra el servicio en tiempo real.'
  },
  {
    icon: <FiUsers size={17} />,
    title: 'Define quién puede hacer qué',
    description: 'Invita a tu equipo y asigna perfiles para cocina, mesa, caja o supervisión.'
  },
  {
    icon: <FiBarChart2 size={17} />,
    title: 'Mide y mejora la operación',
    description: 'Consulta ventas, demanda, productos destacados y señales para decidir mejor.'
  }
];

const storageKeyFor = (user) => `comanda.welcome.v1.${user?.id || user?.email || 'session'}`;

export default function WelcomePresentation() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const primaryButtonRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);

  const eligible = useMemo(
    () => Boolean(user && ['owner', 'admin'].includes(user.rol)),
    [user]
  );

  const markSeen = useCallback(() => {
    localStorage.setItem(storageKeyFor(user), 'seen');
    setDismissed(true);
  }, [user]);

  const dismiss = useCallback(() => markSeen(), [markSeen]);

  const open = Boolean(
    eligible && !dismissed && localStorage.getItem(storageKeyFor(user)) !== 'seen'
  );

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    primaryButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dismiss, open]);

  const start = () => {
    markSeen();
    navigate('/configuracion');
  };

  if (!open) return null;

  return (
    <div className="welcome-overlay" role="presentation">
      <section
        className="welcome-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-description"
      >
        <button type="button" className="welcome-close" onClick={dismiss} aria-label="Cerrar bienvenida">
          <FiX size={18} />
        </button>

        <header className="welcome-header">
          <span className="welcome-kicker"><FiCheck size={14} /> Tu operación, en un solo lugar</span>
          <h1 id="welcome-title">Bienvenido a COMANDA</h1>
          <p id="welcome-description">
            Empieza con lo esencial y activa cada módulo cuando tu restaurante lo necesite.
          </p>
        </header>

        <ol className="welcome-steps">
          {STEPS.map(({ icon, title, description }, index) => (
            <li key={title} className="welcome-step">
              <span className="welcome-step-number">{index + 1}</span>
              <span className="welcome-step-icon">{icon}</span>
              <span className="welcome-step-copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </li>
          ))}
        </ol>

        <p className="welcome-note">
          Puedes volver a estas opciones desde Configuración y usar Soporte IA cuando esté incluido en tu plan.
        </p>

        <footer className="welcome-actions">
          <button ref={primaryButtonRef} type="button" className="welcome-primary" onClick={start}>
            Configurar mi restaurante <FiArrowRight size={16} />
          </button>
          <button type="button" className="welcome-secondary" onClick={dismiss}>
            Explorar el panel
          </button>
        </footer>
      </section>
    </div>
  );
}
