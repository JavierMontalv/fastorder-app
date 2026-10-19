import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import iaClient from '../api/iaClient';
import { useIAContext } from '../context/IAContext';
import '../styles/SoporteIA.css';

const IDIOMAS = [
  { code: 'en', label: 'Ingles', flag: 'US' },
  { code: 'pt', label: 'Portugues', flag: 'BR' },
  { code: 'fr', label: 'Frances', flag: 'FR' },
  { code: 'zh', label: 'Chino', flag: 'CN' }
];

const CATEGORIAS_PROMPTS = [
  {
    id: 'ventas',
    label: 'Estrategia',
    icon: '📈',
    prompts: [
      'Cuales son las mejores estrategias para aumentar mis ventas este mes?',
      'Disena una promocion especial para aumentar el ticket promedio.',
      'Como puedo organizar mejor mi menu para vender mas?',
      'Analiza mi situacion actual y dame recomendaciones de precio.'
    ]
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: '🍽',
    prompts: [
      'Ayudame a mejorar las descripciones de mis productos estrella.',
      'Cuales productos deberia destacar en mi menu?',
      'Dame ideas para crear combos rentables con mis productos.',
      'Sugiere como reorganizar mis categorias para mejorar la experiencia.'
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: '📣',
    prompts: [
      'Dame 3 ideas de posts para Instagram sobre mi restaurante.',
      'Crea un mensaje de bienvenida atractivo para mis clientes.',
      'Escribe textos para promocionar el menu del dia en redes sociales.',
      'Como puedo fidelizar clientes con el menu digital de Comanda?'
    ]
  },
  {
    id: 'soporte',
    label: 'Ayuda',
    icon: '🛠',
    prompts: [
      'Explicame como usar Comanda como si fuera nuevo.',
      'Como configuro los horarios de atencion de mi restaurante?',
      'Que debo hacer si un cliente no puede ver el menu QR?'
    ]
  }
];

const monedaCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

function getSaludo() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos dias';
  if (h >= 12 && h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatHora(isoStr) {
  return new Date(isoStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const MENSAJE_INICIAL = {
  id: 'sistema-1',
  rol: 'sistema',
  contenido: `${getSaludo()}. Soy tu asistente IA de Comanda.

Puedo ayudarte a:
- aumentar ventas con estrategias personalizadas
- optimizar tu menu y las descripciones de productos
- crear contenido para marketing
- traducir tu menu para clientes extranjeros
- resolver dudas sobre como usar Comanda`,
  creadoEn: new Date().toISOString()
};

export default function SoporteIA() {
  const [mensajes, setMensajes] = useState([MENSAJE_INICIAL]);
  const [mensajeActual, setMensajeActual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('ventas');
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('en');
  const [copiado, setCopiado] = useState(null);

  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    estadoIA,
    cargandoEstadoIA,
    planAllowsAI,
    canUseAI,
    refreshIAState,
    hasFeature
  } = useIAContext();

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = async (texto, opciones = {}) => {
    const limpio = (texto || '').trim();
    if (!limpio || cargando || !canUseAI) return;

    setError(null);
    setCargando(true);
    setMensajes((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, rol: 'usuario', contenido: limpio, creadoEn: new Date().toISOString() }
    ]);
    setMensajeActual('');

    try {
      const restauranteId = localStorage.getItem('comanda_restaurante_id');
      const res = await iaClient.post('/soporte-ia/chat', {
        mensaje: limpio,
        accion: opciones.accion || null,
        idiomaDestino: opciones.idiomaDestino || null,
        restauranteId: restauranteId ? Number(restauranteId) : null
      });

      const respuesta =
        res?.data?.data?.texto || res?.data?.data?.mensaje || 'Mensaje procesado correctamente.';

      setMensajes((prev) => [
        ...prev,
        { id: `ia-${Date.now()}`, rol: 'ia', contenido: respuesta, creadoEn: new Date().toISOString() }
      ]);

      refreshIAState();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Hubo un problema al contactar con la IA.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  const traducirMenu = async () => {
    if (!canUseAI || !hasFeature('traducirMenu')) return;
    const idioma = IDIOMAS.find((item) => item.code === idiomaSeleccionado);
    await enviarMensaje(`Quiero traducir mi menu completo al ${idioma?.label || 'Ingles'}.`, {
      accion: 'traducir-menu',
      idiomaDestino: idiomaSeleccionado
    });
  };

  const copiarTexto = async (id, texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // noop
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje(mensajeActual);
    }
  };

  const promptsActivos = useMemo(
    () => CATEGORIAS_PROMPTS.find((c) => c.id === categoriaActiva)?.prompts || [],
    [categoriaActiva]
  );

  const renderEstadoBadge = () => {
    if (cargandoEstadoIA) return <span className="sia-badge sia-badge--loading">Cargando...</span>;
    if (!estadoIA) return null;

    const badges = {
      activa: 'sia-badge--activa',
      trial: 'sia-badge--trial',
      agotada: 'sia-badge--agotada',
      desactivada: 'sia-badge--desactivada',
      bloqueada: 'sia-badge--bloqueada',
      no_disponible: 'sia-badge--bloqueada'
    };

    const labels = {
      activa: 'IA activa',
      trial: 'IA trial',
      agotada: 'Limite alcanzado',
      desactivada: 'IA desactivada',
      bloqueada: 'IA bloqueada',
      no_disponible: 'Sin IA por plan'
    };

    return (
      <span className={`sia-badge ${badges[estadoIA.estado] || 'sia-badge--activa'}`}>
        {labels[estadoIA.estado] || estadoIA.estado}
      </span>
    );
  };

  const renderBurbuja = (msg) => {
    const esIA = msg.rol === 'ia' || msg.rol === 'sistema';
    return (
      <div key={msg.id} className={`sia-bubble ${esIA ? 'sia-bubble--ia' : 'sia-bubble--user'}`}>
        {esIA && (
          <div className="sia-bubble__avatar">
            <span>IA</span>
          </div>
        )}
        <div className="sia-bubble__content">
          <div className="sia-bubble__body">
            <ReactMarkdown>{msg.contenido}</ReactMarkdown>
          </div>
          <div className="sia-bubble__meta">
            <span className="sia-bubble__time">{formatHora(msg.creadoEn)}</span>
            {esIA && msg.rol !== 'sistema' && (
              <button
                className={`sia-copy-btn ${copiado === msg.id ? 'sia-copy-btn--ok' : ''}`}
                onClick={() => copiarTexto(msg.id, msg.contenido)}
                title="Copiar respuesta"
              >
                {copiado === msg.id ? 'Copiado' : 'Copiar'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const mostrarPantallaBloqueada = !cargandoEstadoIA && estadoIA && !planAllowsAI;
  const mostrarPantallaPausada = !cargandoEstadoIA && estadoIA && planAllowsAI && !canUseAI;

  return (
    <div className="sia-page">
      <header className="sia-header">
        <div className="sia-header__left">
          <h1 className="sia-header__title">
            <span className="sia-header__icon">AI</span>
            Asistente IA
          </h1>
          <p className="sia-header__sub">Contexto de operacion, menu, promociones y display</p>
        </div>
        <div className="sia-header__right">
          {renderEstadoBadge()}
          {estadoIA && <span className="sia-plan-badge">Plan {estadoIA.plan}</span>}
        </div>
      </header>

      {estadoIA && (
        <div className="sia-stats-bar">
          <div className="sia-stat">
            <span className="sia-stat__label">Presupuesto IA del mes</span>
            <span className="sia-stat__value">
              <strong>USD {Number(estadoIA.costoMesUSD || 0).toFixed(2)}</strong>
              <span className="sia-stat__sep">/</span>
              USD {Number(estadoIA.presupuestoUSD || 0).toFixed(2)}
            </span>
          </div>
          <div className="sia-stat sia-stat--bar">
            <div className="sia-progress-track">
              <div
                className={`sia-progress-fill ${
                  Number(estadoIA.porcentajePresupuestoUSD || 0) >= 90
                    ? 'sia-progress-fill--danger'
                    : Number(estadoIA.porcentajePresupuestoUSD || 0) >= 70
                      ? 'sia-progress-fill--warn'
                      : ''
                }`}
                style={{ width: `${Math.min(100, Number(estadoIA.porcentajePresupuestoUSD || 0))}%` }}
              />
            </div>
            <span className="sia-stat__pct">
              {Math.min(100, Number(estadoIA.porcentajePresupuestoUSD || 0))}% del presupuesto
            </span>
          </div>
          <div className="sia-stat">
            <span className="sia-stat__label">Saldo disponible</span>
            <span className="sia-stat__value sia-stat__value--highlight">
              USD {Number(estadoIA.restanteUSD || 0).toFixed(2)}
            </span>
          </div>
          <div className="sia-stat">
            <span className="sia-stat__label">Ejecuciones</span>
            <span className="sia-stat__value">{Number(estadoIA.ejecucionesMes || 0)}</span>
          </div>
          {!estadoIA.puedeConsumir && (
            <div className="sia-stat sia-stat--warning">
              <span className="sia-stat__warn-icon">!</span>
              <span>{estadoIA.motivo}</span>
            </div>
          )}
        </div>
      )}

      {(mostrarPantallaBloqueada || mostrarPantallaPausada) && (
        <section className="sia-locked-shell">
          <article className="sia-locked-card">
            <span className="sia-economics-kicker">Contrato de IA</span>
            <h3>
              {mostrarPantallaBloqueada
                ? 'Este restaurante no puede usar IA con su plan actual'
                : 'La IA esta temporalmente sin capacidad de consumo'}
            </h3>
            <p>
              {mostrarPantallaBloqueada
                ? 'La pagina sigue visible para transparencia comercial, pero el chat y las acciones inteligentes quedan bloqueadas hasta tener un plan con IA.'
                : estadoIA?.motivo || 'El estado actual impide nuevas ejecuciones.'}
            </p>

            <div className="sia-locked-grid">
              <div>
                <span>Plan conectado</span>
                <strong>{estadoIA?.planNombre || `Plan ${estadoIA?.plan || ''}`}</strong>
              </div>
              <div>
                <span>Presupuesto</span>
                <strong>{monedaCOP.format(Number(estadoIA?.presupuestoCOP || 0))}</strong>
              </div>
              <div>
                <span>Funciones IA</span>
                <strong>{(estadoIA?.funcionesDisponibles || []).length}</strong>
              </div>
              <div>
                <span>Motivo</span>
                <strong>{estadoIA?.motivo || 'Sin disponibilidad'}</strong>
              </div>
            </div>
          </article>
        </section>
      )}

      {estadoIA && !mostrarPantallaBloqueada && (
        <section className="sia-economics-grid">
          <article className="sia-economics-card sia-economics-card--hero">
            <span className="sia-economics-kicker">Plan conectado</span>
            <h3>{estadoIA.planNombre || `Plan ${estadoIA.plan}`}</h3>
            <p>
              Tu restaurante opera con un presupuesto IA de{' '}
              <strong>{monedaCOP.format(Number(estadoIA.presupuestoCOP || 0))}</strong> al mes.
            </p>

            <div className="sia-economics-list">
              <div>
                <span>Costo acumulado</span>
                <strong>{monedaCOP.format(Number(estadoIA.costoMesCOP || 0))}</strong>
              </div>
              <div>
                <span>Saldo restante</span>
                <strong>{monedaCOP.format(Number(estadoIA.restanteCOP || 0))}</strong>
              </div>
              <div>
                <span>Peso sobre el plan</span>
                <strong>{Number(estadoIA.ratioCostoPlan || 0).toFixed(2)}%</strong>
              </div>
            </div>
          </article>

          <article className="sia-economics-card">
            <span className="sia-economics-kicker">Uso mensual</span>
            <div className="sia-economics-metrics">
              <div>
                <span>Ejecuciones</span>
                <strong>{Number(estadoIA.ejecucionesMes || 0)}</strong>
              </div>
              <div>
                <span>Tokens</span>
                <strong>{Number(estadoIA.tokensMes || 0).toLocaleString('es-CO')}</strong>
              </div>
              <div>
                <span>Consumo del cupo</span>
                <strong>{Number(estadoIA.porcentajeUsado || 0).toFixed(1)}%</strong>
              </div>
              <div>
                <span>Disponibles</span>
                <strong>{Number(estadoIA.restantes || 0).toLocaleString('es-CO')}</strong>
              </div>
            </div>
          </article>

          <article className="sia-economics-card">
            <span className="sia-economics-kicker">Funciones habilitadas</span>
            {Array.isArray(estadoIA.funcionesDisponibles) && estadoIA.funcionesDisponibles.length ? (
              <div className="sia-feature-cloud">
                {estadoIA.funcionesDisponibles.map((feature) => (
                  <span key={feature} className="sia-feature-pill">{feature}</span>
                ))}
              </div>
            ) : (
              <p className="sia-feature-empty">Tu plan actual no tiene funciones IA habilitadas.</p>
            )}
          </article>
        </section>
      )}

      {!mostrarPantallaBloqueada && (
        <div className="sia-layout">
          <aside className="sia-sidebar">
            <div className="sia-sidebar__tabs">
              {CATEGORIAS_PROMPTS.map((cat) => (
                <button
                  key={cat.id}
                  className={`sia-tab ${categoriaActiva === cat.id ? 'sia-tab--active' : ''}`}
                  onClick={() => setCategoriaActiva(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="sia-sidebar__prompts">
              <p className="sia-sidebar__section-title">Preguntas sugeridas</p>
              {promptsActivos.map((texto) => (
                <button
                  key={texto}
                  type="button"
                  className="sia-prompt-btn"
                  disabled={cargando || !canUseAI}
                  onClick={() => enviarMensaje(texto)}
                  title={texto}
                >
                  <span className="sia-prompt-btn__text">{texto}</span>
                  <span className="sia-prompt-btn__icon" aria-hidden="true">›</span>
                </button>
              ))}
            </div>

            <div className="sia-sidebar__divider" />

            <div className="sia-sidebar__translate">
              <p className="sia-sidebar__section-title">Traducir menu</p>
              <p className="sia-sidebar__section-desc">
                Traduce automaticamente tus productos y categorias cuando el plan lo permita.
              </p>
              <div className="sia-lang-grid">
                {IDIOMAS.map((idioma) => (
                  <button
                    key={idioma.code}
                    className={`sia-lang-btn ${idiomaSeleccionado === idioma.code ? 'sia-lang-btn--active' : ''}`}
                    onClick={() => setIdiomaSeleccionado(idioma.code)}
                    disabled={!canUseAI || !hasFeature('traducirMenu')}
                  >
                    <span>{idioma.flag}</span>
                    <span>{idioma.label}</span>
                  </button>
                ))}
              </div>
              <button
                className="sia-translate-cta"
                disabled={cargando || !canUseAI || !hasFeature('traducirMenu')}
                onClick={traducirMenu}
              >
                {cargando ? 'Procesando...' : `Traducir al ${IDIOMAS.find((i) => i.code === idiomaSeleccionado)?.label}`}
              </button>
            </div>
          </aside>

          <section className="sia-chat-panel">
            <div ref={chatRef} className="sia-chat-window">
              {mensajes.map(renderBurbuja)}

              {cargando && (
                <div className="sia-bubble sia-bubble--ia">
                  <div className="sia-bubble__avatar"><span>IA</span></div>
                  <div className="sia-bubble__content">
                    <div className="sia-bubble__body sia-bubble__body--typing">
                      <span className="sia-dot" />
                      <span className="sia-dot" />
                      <span className="sia-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="sia-error-bar">
                <span>{error}</span>
                <button onClick={() => setError(null)}>X</button>
              </div>
            )}

            <form
              className="sia-input-area"
              onSubmit={(e) => {
                e.preventDefault();
                enviarMensaje(mensajeActual);
              }}
            >
              <div className="sia-textarea-wrap">
                <textarea
                  ref={textareaRef}
                  className="sia-textarea"
                  placeholder="Escribe tu consulta... (Enter para enviar · Shift+Enter para nueva linea)"
                  value={mensajeActual}
                  onChange={(e) => setMensajeActual(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={cargando || !canUseAI}
                  maxLength={2000}
                  rows={3}
                />
                <span className="sia-char-count">{mensajeActual.length}/2000</span>
              </div>
              <div className="sia-input-actions">
                <button
                  type="submit"
                  className="sia-send-btn"
                  disabled={cargando || !mensajeActual.trim() || !canUseAI}
                >
                  {cargando ? <span className="sia-send-spinner" /> : <>Enviar</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
