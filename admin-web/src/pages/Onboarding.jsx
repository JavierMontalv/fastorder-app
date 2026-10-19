// src/pages/Onboarding.jsx

import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { obtenerConfigRestaurante } from '../api/restauranteApi';
import { AuthContext } from '../context/AuthContext';

import '../styles/Onboarding.css';

const STEPS = [
  {
    id: 1,
    key: 'identity',
    title: 'Identidad',
    description: 'Nombre y presentacion',
    helper: 'La identidad aparece en el panel, el menu publico y los QR.'
  },
  {
    id: 2,
    key: 'contact',
    title: 'Contacto',
    description: 'Telefono y direccion',
    helper: 'Estos datos son opcionales. Sirven para ubicar el local y apoyar al cliente.'
  },
  {
    id: 3,
    key: 'hours',
    title: 'Horario',
    description: 'Apertura y cierre',
    helper: 'Este horario define si el menu puede recibir pedidos y hasta que hora aparece abierto.'
  },
  {
    id: 4,
    key: 'settings',
    title: 'Operacion',
    description: 'Idioma principal',
    helper: 'Define la base del menu. Puedes ajustar logo, portada y colores desde Configuracion.'
  }
];

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  telefono: '',
  direccion: '',
  horarioApertura: '08:00',
  horarioCierre: '22:00',
  idiomaMenu: 'es'
};

const unwrapApiData = (response) => response?.data?.data ?? response?.data ?? response ?? null;

const compactPayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

const cleanText = (value) => String(value || '').trim();
const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(cleanText(value));
const buildHorarioPayload = (apertura, cierre) => ({
  timezone: 'America/Bogota',
  mode: 'same_every_day',
  dias: {
    domingo: { abierto: true, apertura, cierre },
    lunes: { abierto: true, apertura, cierre },
    martes: { abierto: true, apertura, cierre },
    miercoles: { abierto: true, apertura, cierre },
    jueves: { abierto: true, apertura, cierre },
    viernes: { abierto: true, apertura, cierre },
    sabado: { abierto: true, apertura, cierre }
  }
});

export default function Onboarding() {
  const { limpiarRedirect, refreshProfile, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [hasRestaurant, setHasRestaurant] = useState(Boolean(user?.restauranteId || user?.sedeActivaId));

  useEffect(() => {
    if (user?.onboarding_completado) {
      limpiarRedirect?.();
      navigate('/', { replace: true });
    }
  }, [limpiarRedirect, navigate, user?.onboarding_completado]);

  useEffect(() => {
    let mounted = true;

    const loadExistingConfig = async () => {
      setLoadingConfig(true);
      setError(null);

      try {
        const response = await obtenerConfigRestaurante();
        const config = unwrapApiData(response);
        if (!mounted || !config) return;

        const nextForm = {
          nombre: config.nombre || '',
          descripcion: config.descripcion || '',
          telefono: config.telefono || '',
          direccion: config.direccion || '',
          horarioApertura: config.horarioApertura || config.horarios?.dias?.lunes?.apertura || '08:00',
          horarioCierre: config.horarioCierre || config.horarios?.dias?.lunes?.cierre || '22:00',
          idiomaMenu: config.idiomaMenu || 'es'
        };

        setForm(nextForm);
        setHasRestaurant(Boolean(cleanText(nextForm.nombre) || user?.restauranteId || user?.sedeActivaId));
      } catch (err) {
        console.error('[Onboarding] Error cargando configuracion existente:', err);
        if (mounted) {
          setError('No pudimos cargar la configuracion actual. Puedes entrar al panel y continuar desde Configuracion.');
          setHasRestaurant(Boolean(user?.restauranteId || user?.sedeActivaId));
        }
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    };

    loadExistingConfig();

    return () => {
      mounted = false;
    };
  }, [user?.restauranteId, user?.sedeActivaId]);

  const currentStep = STEPS.find((step) => step.id === activeStep) || STEPS[0];
  const progress = Math.round((activeStep / STEPS.length) * 100);
  const canEnterPanel = hasRestaurant || Boolean(cleanText(form.nombre));

  const validation = useMemo(() => {
    const name = cleanText(form.nombre);
    const description = cleanText(form.descripcion);
    const phone = cleanText(form.telefono);
    const address = cleanText(form.direccion);

    if (activeStep === 1) {
      if (!name) return { ok: false, message: 'Ingresa el nombre del restaurante.' };
      if (name.length < 2) return { ok: false, message: 'El nombre debe tener al menos 2 caracteres.' };
      if (name.length > 150) return { ok: false, message: 'El nombre no puede superar 150 caracteres.' };
      if (description.length > 500) return { ok: false, message: 'La descripcion no puede superar 500 caracteres.' };
    }

    if (activeStep === 2) {
      if (phone.length > 40) return { ok: false, message: 'El telefono no puede superar 40 caracteres.' };
      if (address.length > 250) return { ok: false, message: 'La direccion no puede superar 250 caracteres.' };
    }

    if (activeStep === 3) {
      if (!isValidTime(form.horarioApertura)) return { ok: false, message: 'Ingresa una hora de apertura valida.' };
      if (!isValidTime(form.horarioCierre)) return { ok: false, message: 'Ingresa una hora de cierre valida.' };
      if (form.horarioApertura === form.horarioCierre) {
        return { ok: false, message: 'La apertura y el cierre no pueden ser la misma hora.' };
      }
    }

    if (activeStep === 4 && !cleanText(form.idiomaMenu)) {
      return { ok: false, message: 'Selecciona el idioma principal del menu.' };
    }

    return { ok: true, message: null };
  }, [activeStep, form]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setError(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProgress = async (payload) => {
    const cleanPayload = compactPayload(payload);
    if (Object.keys(cleanPayload).length === 0) return true;

    setSaving(true);
    setError(null);

    try {
      await api.put('/restaurantes', cleanPayload);
      return true;
    } catch (err) {
      console.error('[Onboarding] Error guardando progreso:', err);
      setError(err?.message || 'No fue posible guardar la informacion.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goToPanel = async () => {
    limpiarRedirect?.();
    navigate('/', { replace: true });
  };

  const goBack = () => {
    setError(null);
    setActiveStep((step) => Math.max(1, step - 1));
  };

  const goNext = async () => {
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    if (activeStep === 1) {
      const saved = await saveProgress({
        nombre: cleanText(form.nombre),
        descripcion: cleanText(form.descripcion)
      });
      if (saved) {
        setHasRestaurant(true);
        setActiveStep(2);
      }
      return;
    }

    if (activeStep === 2) {
      const saved = await saveProgress({
        telefono: cleanText(form.telefono),
        direccion: cleanText(form.direccion)
      });
      if (saved) setActiveStep(3);
      return;
    }

    if (activeStep === 3) {
      const apertura = cleanText(form.horarioApertura);
      const cierre = cleanText(form.horarioCierre);
      const saved = await saveProgress({
        horarioApertura: apertura,
        horarioCierre: cierre,
        horarios: buildHorarioPayload(apertura, cierre)
      });
      if (saved) setActiveStep(4);
      return;
    }

    const saved = await saveProgress({ idiomaMenu: form.idiomaMenu });
    if (!saved) return;

    setSaving(true);
    setError(null);

    try {
      await api.post('/restaurantes/onboarding');
      await refreshProfile?.();
      limpiarRedirect?.();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[Onboarding] Error completando onboarding:', err);
      setError(err?.message || 'No fue posible finalizar la configuracion.');
    } finally {
      setSaving(false);
    }
  };

  const disabled = saving || loadingConfig;

  return (
    <div className="fo-onboarding">
      <main className="fo-onboarding-shell">
        <header className="fo-onboarding-header">
          <section className="fo-onboarding-hero" aria-labelledby="onboarding-title">
            <span className="fo-onboarding-eyebrow">Configuracion guiada</span>
            <h1 id="onboarding-title" className="fo-onboarding-title">
              Prepara tu restaurante sin bloquear la operacion
            </h1>
            <p className="fo-onboarding-subtitle">
              Completa solo lo esencial. Si el restaurante ya existe, puedes entrar al panel y terminar logo,
              portada, productos o pedidos desde los modulos normales.
            </p>
          </section>

          <aside className="fo-onboarding-status" aria-label="Estado del onboarding">
            <div className="fo-onboarding-status-row">
              <span className="fo-onboarding-pill">{currentStep.title}</span>
              <span className="fo-onboarding-percent">{progress}%</span>
            </div>
            <div className="fo-onboarding-progressbar">
              <div className="fo-onboarding-progressfill" style={{ width: `${progress}%` }} />
            </div>
            <div className="fo-onboarding-status-copy">
              {canEnterPanel ? 'Panel disponible' : 'Falta asociar o nombrar el restaurante'}
            </div>
          </aside>
        </header>

        <div className="fo-onboarding-grid">
          <aside className="fo-onboarding-aside">
            <div className="fo-onboarding-stepper" aria-label="Pasos de configuracion">
              {STEPS.map((step) => {
                const state =
                  step.id < activeStep ? 'done' : step.id === activeStep ? 'active' : 'pending';

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`fo-step fo-step-${state}`}
                    onClick={() => step.id < activeStep && setActiveStep(step.id)}
                    disabled={disabled || step.id > activeStep}
                  >
                    <span className="fo-step-index">{state === 'done' ? 'OK' : step.id}</span>
                    <span className="fo-step-copy">
                      <span className="fo-step-title">{step.title}</span>
                      <span className="fo-step-desc">{step.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="fo-onboarding-policy">
              <div className="fo-onboarding-policy-title">Regla operativa</div>
              <p>
                Onboarding incompleto no bloquea el panel cuando ya existe un restaurante asociado.
                Solo se usa como guia de activacion.
              </p>
            </div>
          </aside>

          <section className="fo-onboarding-card" aria-live="polite">
            {loadingConfig && (
              <div className="fo-onboarding-loading">
                <span className="fo-spinner" />
                Cargando informacion actual del restaurante...
              </div>
            )}

            {error && (
              <div className="fo-onboarding-alert">
                <div className="fo-onboarding-alert-title">Revisa este punto</div>
                <div className="fo-onboarding-alert-text">{error}</div>
              </div>
            )}

            <div className="fo-onboarding-card-head">
              <span className="fo-onboarding-card-kicker">Paso {activeStep} de {STEPS.length}</span>
              <h2 className="fo-onboarding-h2">{currentStep.title}</h2>
              <p className="fo-onboarding-p">{currentStep.helper}</p>
            </div>

            {activeStep === 1 && (
              <div className="fo-onboarding-form">
                <div className="fo-field">
                  <label className="fo-label" htmlFor="restaurant-name">Nombre del restaurante *</label>
                  <input
                    id="restaurant-name"
                    className="fo-input"
                    name="nombre"
                    value={form.nombre}
                    onChange={updateField}
                    disabled={disabled}
                    placeholder="Ej: El Gloton Burguer"
                    autoComplete="organization"
                  />
                </div>

                <div className="fo-field">
                  <label className="fo-label" htmlFor="restaurant-description">Descripcion</label>
                  <textarea
                    id="restaurant-description"
                    className="fo-input fo-textarea"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={updateField}
                    disabled={disabled}
                    placeholder="Ej: Hamburguesas artesanales, combos y bebidas para pedir desde mesa."
                    maxLength={500}
                  />
                  <div className="fo-field-hint">{cleanText(form.descripcion).length}/500</div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="fo-onboarding-form fo-onboarding-form-two">
                <div className="fo-field">
                  <label className="fo-label" htmlFor="restaurant-phone">Telefono</label>
                  <input
                    id="restaurant-phone"
                    className="fo-input"
                    name="telefono"
                    value={form.telefono}
                    onChange={updateField}
                    disabled={disabled}
                    placeholder="Ej: 300 000 0000"
                    autoComplete="tel"
                  />
                </div>

                <div className="fo-field">
                  <label className="fo-label" htmlFor="restaurant-address">Direccion</label>
                  <input
                    id="restaurant-address"
                    className="fo-input"
                    name="direccion"
                    value={form.direccion}
                    onChange={updateField}
                    disabled={disabled}
                    placeholder="Direccion del local"
                    autoComplete="street-address"
                  />
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="fo-onboarding-form fo-onboarding-form-two">
                <div className="fo-field">
                  <label className="fo-label" htmlFor="restaurant-opening">Hora de apertura *</label>
                  <input
                    id="restaurant-opening"
                    className="fo-input"
                    name="horarioApertura"
                    type="time"
                    value={form.horarioApertura}
                    onChange={updateField}
                    disabled={disabled}
                  />
                </div>

                <div className="fo-field">
                  <label className="fo-label" htmlFor="restaurant-closing">Hora de cierre *</label>
                  <input
                    id="restaurant-closing"
                    className="fo-input"
                    name="horarioCierre"
                    type="time"
                    value={form.horarioCierre}
                    onChange={updateField}
                    disabled={disabled}
                  />
                </div>

                <div className="fo-onboarding-next fo-onboarding-next-wide">
                  Por defecto aplicamos este horario todos los dias. Luego puedes ajustar horarios especiales desde
                  Configuracion.
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="fo-onboarding-form">
                <div className="fo-field">
                  <label className="fo-label" htmlFor="restaurant-language">Idioma principal del menu *</label>
                  <select
                    id="restaurant-language"
                    className="fo-input"
                    name="idiomaMenu"
                    value={form.idiomaMenu}
                    onChange={updateField}
                    disabled={disabled}
                  >
                    <option value="es">Espanol</option>
                    <option value="en">Ingles</option>
                  </select>
                </div>

                <div className="fo-onboarding-next">
                  Logo, portada, colores y metodos de pago se configuran mejor desde Configuracion.
                </div>
              </div>
            )}

            <footer className="fo-onboarding-actions">
              <button
                type="button"
                className="fo-btn fo-btn-outline"
                onClick={goBack}
                disabled={disabled || activeStep === 1}
              >
                Atras
              </button>

              <div className="fo-onboarding-actions-right">
                {canEnterPanel && (
                  <button
                    type="button"
                    className="fo-btn fo-btn-ghost"
                    onClick={goToPanel}
                    disabled={disabled}
                  >
                    Completar despues
                  </button>
                )}

                <button
                  type="button"
                  className="fo-btn fo-btn-primary"
                  onClick={goNext}
                  disabled={!validation.ok || disabled}
                >
                  {saving ? 'Guardando...' : activeStep === STEPS.length ? 'Finalizar configuracion' : 'Guardar y continuar'}
                </button>
              </div>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
