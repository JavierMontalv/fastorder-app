// src/components/ChatIAWidget.jsx
// ======================================================================
// 🤖 ChatIAWidget — COMANDA ADMIN (2026)
// ----------------------------------------------------------------------
// • Glass UI
// • Animaciones premium vía CSS
// • Estilo minimal tipo ChatGPT
// • Modo oscuro automático (prefers-color-scheme)
// • Traducción del menú integrada (acciones rápidas)
// • Chat con contexto del restaurante
// • Mensajes de bienvenida inteligentes
// ======================================================================

import { useEffect, useRef, useState } from 'react';

import iaClient from '../api/iaClient';
import { useIAContext } from '../context/IAContext';
import '../styles/SoporteIA.css';

const MENSAJES_SUGERIDOS = [
  '¿Cómo puedo organizar mejor mi menú para vender más?',
  'Recomiéndame una estrategia de promociones para esta semana.',
  'Explícame cómo usar Comanda como si fuera nuevo.',
  'Dame ideas de mensajes para redes sociales de mi restaurante.'
];

export default function ChatIAWidget() {
  const { canUseAI, hasFeature, refreshIAState } = useIAContext();
  const [mensajes, setMensajes] = useState(() => {
    const hora = new Date().getHours();
    let saludo = 'Hola';

    if (hora >= 5 && hora < 12) saludo = 'Buenos días';
    if (hora >= 12 && hora < 18) saludo = 'Buenas tardes';
    if (hora >= 18 || hora < 5) saludo = 'Buenas noches';

    const restauranteNombre =
      localStorage.getItem('comanda_restaurante_nombre') || 'tu restaurante';

    return [
      {
        id: 'sistema-1',
        rol: 'sistema',
        contenido: `${saludo} 👋 Soy tu asistente de Soporte IA Comanda.

Puedo ayudarte a:
• Configurar y entender mejor tu panel
• Diseñar estrategias para aumentar tus ventas
• Resolver dudas sobre Comanda
• Traducir tu menú para clientes extranjeros 🌍

Estás gestionando: ${restauranteNombre}.
Cuéntame qué necesitas o prueba con uno de los mensajes sugeridos.`,
        creadoEn: new Date().toISOString()
      }
    ];
  });

  const [mensajeActual, setMensajeActual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [accionEnProgreso, setAccionEnProgreso] = useState(null);

  const chatRef = useRef(null);

  // =====================================================
  // 📌 Auto scroll al final cuando cambian los mensajes
  // =====================================================
  useEffect(() => {
    if (!chatRef.current) return;
    const el = chatRef.current;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    });
  }, [mensajes]);

  // =====================================================
  // 🧠 Enviar mensaje al backend de Soporte IA
  // =====================================================
  const enviarMensaje = async (texto, opciones = {}) => {
    const contenidoLimpio = (texto || '').trim();
    if (!contenidoLimpio || !canUseAI) return;

    setError(null);
    setCargando(true);

    const restauranteId = localStorage.getItem('comanda_restaurante_id') || null;

    const mensajeUsuario = {
      id: `user-${Date.now()}`,
      rol: 'usuario',
      contenido: contenidoLimpio,
      creadoEn: new Date().toISOString()
    };

    setMensajes((prev) => [...prev, mensajeUsuario]);
    setMensajeActual('');

    try {
      const payload = {
        mensaje: contenidoLimpio,
        accion: opciones.accion || null, // p.ej. "traducir-menu"
        idiomaDestino: opciones.idiomaDestino || null,
        restauranteId
      };

      const res = await iaClient.post('/soporte-ia/chat', payload);

      const respuestaTexto =
        res?.data?.data?.texto ||
        'He recibido tu mensaje. En este momento no tengo una respuesta específica, pero seguiré aprendiendo de tus consultas.';

      const mensajeIA = {
        id: `ia-${Date.now()}`,
        rol: 'ia',
        contenido: respuestaTexto,
        creadoEn: new Date().toISOString()
      };

      setMensajes((prev) => [...prev, mensajeIA]);
      refreshIAState();
    } catch (err) {
      console.error('❌ Error en ChatIAWidget:', err);
      setError('Hubo un problema hablando con Soporte IA. Intenta nuevamente en unos segundos.');
    } finally {
      setCargando(false);
      setAccionEnProgreso(null);
    }
  };

  // =====================================================
  // 🚀 Acción rápida: Traducir menú completo
  // =====================================================
  const manejarTraduccionMenu = async (idiomaDestino = 'en') => {
    if (accionEnProgreso || cargando || !canUseAI || !hasFeature('traducirMenu')) return;

    setAccionEnProgreso('traducir-menu');
    setError(null);

    const idiomaNombre =
      idiomaDestino === 'en'
        ? 'inglés'
        : idiomaDestino === 'fr'
        ? 'francés'
        : idiomaDestino === 'pt'
        ? 'portugués'
        : 'otro idioma';

    const mensajeSistema = `Quiero que analices y traduzcas mi menú completo (categorías y productos) al ${idiomaNombre}, con traducciones naturales y atractivas para clientes extranjeros.`;

    await enviarMensaje(mensajeSistema, {
      accion: 'traducir-menu',
      idiomaDestino
    });
  };

  // =====================================================
  // 🎯 Handlers de UI
  // =====================================================
  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;
    await enviarMensaje(mensajeActual);
  };

  const usarMensajeSugerido = async (texto) => {
    if (cargando) return;
    await enviarMensaje(texto);
  };

  // =====================================================
  // 💬 Render de un mensaje
  // =====================================================
  const renderMensaje = (mensaje) => {
    const esIA = mensaje.rol === 'ia' || mensaje.rol === 'sistema';
    const claseBase = esIA ? 'soporteia-bubble-ia' : 'soporteia-bubble-user';

    return (
      <div key={mensaje.id} className={`soporteia-bubble ${claseBase}`}>
        <div className="soporteia-bubble-header">
          <span className="soporteia-bubble-rol">
            {mensaje.rol === 'ia' ? 'Soporte IA' : mensaje.rol === 'sistema' ? 'Sistema' : 'Tú'}
          </span>
        </div>
        <div className="soporteia-bubble-body">
          {mensaje.contenido.split('\n').map((linea, idx) => (
            <p key={idx}>{linea}</p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="chatia-widget">
      {/* ENCABEZADO DEL WIDGET */}
      <div className="chatia-header">
        <div>
          <h2>Hablar con soporte</h2>
          <p>
            Chatea con Soporte IA para resolver dudas, mejorar tu negocio y traducir tu menú para
            clientes extranjeros.
          </p>
        </div>

        <div className="chatia-quick-actions">
          <button
            type="button"
            className="soporteia-action-btn"
            disabled={cargando || accionEnProgreso === 'traducir-menu'}
            onClick={() => manejarTraduccionMenu('en')}
          >
            🌍 Traducir menú a inglés
          </button>

          <button
            type="button"
            className="soporteia-action-btn secondary"
            disabled={cargando || accionEnProgreso === 'traducir-menu'}
            onClick={() => manejarTraduccionMenu('pt')}
          >
            🇧🇷 Traducir menú a portugués
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="chatia-body">
        {/* SUGERENCIAS Y TIPS */}
        <aside className="soporteia-sidebar">
          <h3>Ideas para empezar</h3>
          <p>Usa uno de estos mensajes y adáptalo a tu negocio.</p>

          <div className="soporteia-suggestions">
            {MENSAJES_SUGERIDOS.map((texto) => (
              <button
                key={texto}
                type="button"
                className="soporteia-suggestion-chip"
                disabled={cargando || !canUseAI}
                onClick={() => usarMensajeSugerido(texto)}
              >
                {texto}
              </button>
            ))}
          </div>

          <div className="soporteia-tip-box">
            <h3>Consejo</h3>
            <p>
              Cuanto más contexto le des a Soporte IA (tipo de negocio, ciudad, horarios, productos
              estrella), mejores serán las recomendaciones.
            </p>
          </div>
        </aside>

        {/* CHAT */}
        <section className="soporteia-chat-wrapper">
          <div ref={chatRef} className="soporteia-chat-window">
            {mensajes.map((m) => renderMensaje(m))}

            {cargando && (
              <div className="soporteia-bubble soporteia-bubble-ia soporteia-bubble-typing">
                <div className="soporteia-bubble-header">
                  <span className="soporteia-bubble-rol">Soporte IA</span>
                </div>
                <div className="soporteia-bubble-body">
                  <div className="soporteia-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <div className="soporteia-error">{error}</div>}

          <form className="soporteia-input-bar" onSubmit={manejarSubmit}>
            <textarea
              placeholder="Escribe aquí tu pregunta para Soporte IA..."
              value={mensajeActual}
              onChange={(e) => setMensajeActual(e.target.value)}
              rows={2}
              disabled={cargando || !canUseAI}
            />

            <div className="soporteia-input-actions">
              <button
                type="submit"
                className="soporteia-send-btn"
                disabled={cargando || !mensajeActual.trim() || !canUseAI}
              >
                {cargando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>

          {accionEnProgreso === 'traducir-menu' && (
            <div className="soporteia-info-banner">
              <span>⏳ Procesando traducción del menú… esto puede tardar unos segundos.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
