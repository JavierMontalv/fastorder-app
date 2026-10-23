import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  completarCheckoutPlanPagado,
  consultarEstadoCheckoutPlan
} from '../api/publicComercialApi';
import {
  LEGAL_ACCEPTANCE_VERSION,
  legalDocumentKeys
} from '../constants/legalCommercialDocs';
import '../styles/PublicPortal.css';

const emptyActivation = {
  businessName: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  acceptedTerms: false,
  acceptedDataPolicy: false
};

export default function PlanCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const plan = String(searchParams.get('plan') || '').toUpperCase();
  const reference = searchParams.get('reference') || '';
  const claim = searchParams.get('claim') || '';
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [requiresActivationData, setRequiresActivationData] = useState(false);
  const [activationForm, setActivationForm] = useState(emptyActivation);
  const [activationLoading, setActivationLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const poll = async () => {
      if (!reference || !claim) {
        setError('Falta la referencia de activacion comercial.');
        return;
      }

      try {
        const response = await consultarEstadoCheckoutPlan({ reference, claim });
        const data = response?.data || {};
        if (cancelled) return;

        setStatus(data.status || 'pending');
        setRequiresActivationData(Boolean(data.requiresActivationData));

        if (data.session?.token) {
          setSessionData(data.session);
          localStorage.setItem('comanda_token', data.session.token);
          window.location.replace(data.session.redirectPath || '/onboarding');
          return;
        }

        if (!data.requiresActivationData && !['failed', 'cancelled', 'expired'].includes(data.status)) {
          timer = window.setTimeout(poll, 3500);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || 'No se pudo consultar la activacion.');
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [claim, reference]);

  const handleActivationChange = (event) => {
    const { name, value, type, checked } = event.target;
    setActivationForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCompleteActivation = async (event) => {
    event.preventDefault();
    setError('');

    try {
      setActivationLoading(true);
      const response = await completarCheckoutPlanPagado({
        reference,
        claim,
        customer: {
          ...activationForm,
          legalAcceptance: {
            version: LEGAL_ACCEPTANCE_VERSION,
            documents: legalDocumentKeys,
            acceptedAt: new Date().toISOString()
          }
        }
      });

      const session = response?.data?.session;
      if (session?.token) {
        localStorage.setItem('comanda_token', session.token);
        window.location.replace(session.redirectPath || '/onboarding');
        return;
      }

      setError('La activacion fue recibida, pero no se pudo iniciar sesion automaticamente.');
    } catch (err) {
      setError(err?.message || 'No fue posible completar la activacion.');
    } finally {
      setActivationLoading(false);
    }
  };

  const statusCopy = useMemo(() => {
    if (sessionData) {
      return {
        badge: 'Cuenta activada',
        title: 'Tu pago fue aprobado y estamos entrando a tu panel',
        text: 'Te estamos redirigiendo al onboarding para configurar tu local.'
      };
    }

    if (['failed', 'cancelled', 'expired'].includes(status)) {
      return {
        badge: 'Pago pendiente de resolver',
        title: `Tu solicitud del plan ${plan || 'COMANDA'} aun no pudo activarse`,
        text: 'Verifica el pago en Wompi o vuelve al portal comercial para intentarlo de nuevo.'
      };
    }

    if (requiresActivationData) {
      return {
        badge: 'Pago aprobado',
        title: `Completa los datos para activar ${plan || 'COMANDA'}`,
        text: 'Wompi ya confirmo el pago. Ahora si podemos crear tu restaurante y tu usuario administrador.'
      };
    }

    return {
      badge: 'Activacion automatica',
      title: `Estamos validando el pago de tu plan ${plan || 'COMANDA'}`,
      text: 'En cuanto Wompi confirme la transaccion, desbloquearemos tu cuenta y entraras directo al panel.'
    };
  }, [plan, requiresActivationData, sessionData, status]);

  return (
    <div className="public-shell public-shell--soft">
      <main className="checkout-success">
        <div className="checkout-success-card">
          <img src="/brand/comanda-icon.png" alt="Comanda" />
          <span className="checkout-success-badge">{statusCopy.badge}</span>
          <h1>{statusCopy.title}</h1>
          <p>{statusCopy.text}</p>
          <div className="checkout-success-reference">
            <span>Referencia comercial</span>
            <strong>{reference || 'pendiente'}</strong>
          </div>

          {requiresActivationData ? (
            <form className="marketing-signup-card checkout-success-form" onSubmit={handleCompleteActivation}>
              <div className="marketing-signup-grid">
                <input
                  type="text"
                  name="businessName"
                  placeholder="Nombre del restaurante"
                  value={activationForm.businessName}
                  onChange={handleActivationChange}
                  required
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Tu nombre"
                  value={activationForm.name}
                  onChange={handleActivationChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Correo de acceso"
                  value={activationForm.email}
                  onChange={handleActivationChange}
                  required
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Telefono o WhatsApp"
                  value={activationForm.phone}
                  onChange={handleActivationChange}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Crea tu contrasena"
                  value={activationForm.password}
                  onChange={handleActivationChange}
                  required
                  minLength={8}
                />
              </div>

              <label className="marketing-signup-check">
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={activationForm.acceptedTerms}
                  onChange={handleActivationChange}
                />
                <span>Acepto terminos, contrato SaaS y condiciones del plan pagado.</span>
              </label>

              <label className="marketing-signup-check marketing-signup-check--privacy">
                <input
                  type="checkbox"
                  name="acceptedDataPolicy"
                  checked={activationForm.acceptedDataPolicy}
                  onChange={handleActivationChange}
                />
                <span>Autorizo el tratamiento de datos para crear y administrar mi cuenta Comanda.</span>
              </label>

              <button
                className="public-button"
                type="submit"
                disabled={
                  activationLoading ||
                  !activationForm.acceptedTerms ||
                  !activationForm.acceptedDataPolicy
                }
              >
                {activationLoading ? 'Activando cuenta...' : 'Crear cuenta y entrar'}
              </button>
            </form>
          ) : null}

          {error ? <p className="login-error">{error}</p> : null}
          <div className="checkout-success-actions">
            <Link className="public-button" to="/login">
              Volver al portal comercial
            </Link>
            <Link className="public-button public-button--ghost" to="/descubre">
              Ver la propuesta del producto
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
