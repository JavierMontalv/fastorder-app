import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { SOCKET_BASE_URL, normalizeAssetUrl } from '../config/env';
import { obtenerDisplayPublico } from '../api/displayApi';
import '../styles/DisplayScreen.css';

function formatClock(date) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function playChime() {
  try {
    const audioContext = new window.AudioContext();
    const now = audioContext.currentTime;
    const notes = [880, 1174, 1568];

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.0001, now + index * 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + index * 0.18 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(now + index * 0.18);
      oscillator.stop(now + index * 0.18 + 0.2);
    });
  } catch {}
}

function mediaKindFromUrl(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'empty';
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(raw)) return 'video';
  return 'image';
}

function getHeadlineLabel(event) {
  if (!event) return 'Esperando proximo turno';
  return event.mesaLabel || event.titulo || (event.numeroPedido ? `Pedido #${event.numeroPedido}` : 'Turno activo');
}

function getTurnValue(event) {
  if (!event) return '--';
  if (event.numeroPedido) return event.numeroPedido;
  const mesaMatch = String(event.mesaLabel || '').match(/\d+/);
  return mesaMatch?.[0] || '--';
}

function normalizarLlamadoEntrante(event) {
  if (!event) return null;

  return {
    ...event,
    id: event.id || event.eventId || `${event.pedidoId || 'call'}-${event.visibleDesde || Date.now()}`,
    eventId: event.eventId || event.id || null,
    visibleNow: event.visibleNow ?? true,
    active: event.active ?? true
  };
}

function sortActiveCalls(events = []) {
  return [...events].sort((left, right) => {
    const leftVisible = left?.visibleNow ? 1 : 0;
    const rightVisible = right?.visibleNow ? 1 : 0;
    if (leftVisible !== rightVisible) return rightVisible - leftVisible;

    const leftTime = new Date(left?.visibleDesde || left?.fecha || 0).getTime() || 0;
    const rightTime = new Date(right?.visibleDesde || right?.fecha || 0).getTime() || 0;

    return rightTime - leftTime;
  });
}

function buildActiveCalls(data) {
  const sources = [];

  if (Array.isArray(data?.activeCalls)) {
    sources.push(...data.activeCalls);
  }

  if (data?.current) {
    sources.push(data.current);
  }

  if (Array.isArray(data?.recent)) {
    sources.push(...data.recent);
  }

  const deduped = new Map();

  for (const rawEvent of sources) {
    const normalized = normalizarLlamadoEntrante(rawEvent);
    if (!normalized) continue;

    deduped.set(normalized.id, {
      ...deduped.get(normalized.id),
      ...normalized
    });
  }

  return sortActiveCalls(Array.from(deduped.values()));
}

function normalizeDisplayPayload(data) {
  const activeCalls = buildActiveCalls(data);
  const current = normalizarLlamadoEntrante(data?.current) || activeCalls.find((event) => event.visibleNow) || null;

  return {
    ...data,
    current,
    activeCalls,
    recent: Array.isArray(data?.recent)
      ? data.recent.map(normalizarLlamadoEntrante).filter(Boolean)
      : [],
    meta: {
      ...(data?.meta || {}),
      queueCount: Number(data?.meta?.queueCount ?? activeCalls.length),
      refreshedAt: data?.meta?.refreshedAt || new Date().toISOString()
    }
  };
}

export default function DisplayScreen() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayData, setDisplayData] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  const [batchIndex, setBatchIndex] = useState(0);
  const [channelState, setChannelState] = useState('syncing');
  const displayDataRef = useRef(null);
  const lastPlayedEventIdRef = useRef(null);
  const requestControllerRef = useRef(null);

  const restaurante = displayData?.restaurante || null;
  const config = displayData?.config || null;
  const promoDestacada = displayData?.promo || null;

  useEffect(() => {
    displayDataRef.current = displayData;
  }, [displayData]);

  const loadDisplay = useCallback(async ({ silent = false } = {}) => {
    if (!slug) {
      setDisplayData(null);
      setError('No se encontro el identificador de la pantalla.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    requestControllerRef.current?.abort?.();
    requestControllerRef.current = controller;

    try {
      if (!silent) {
        setLoading(true);
      }
      if (!silent) {
        setError('');
      }
      const payload = await obtenerDisplayPublico(slug, { signal: controller.signal });
      setDisplayData(normalizeDisplayPayload(payload.data));
      setError('');
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      if (silent) {
        setChannelState('reconnecting');
        if (!displayDataRef.current) {
          setError(err.message || 'No fue posible cargar la pantalla');
        }
      } else {
        setError(err.message || 'No fue posible cargar la pantalla');
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
      if (!silent) {
        setLoading(false);
      }
    }
  }, [slug]);

  useEffect(() => {
    loadDisplay();

    return () => {
      requestControllerRef.current?.abort?.();
    };
  }, [loadDisplay]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!restaurante?.id) return undefined;

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      timeout: 8000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
      reconnectionDelayMax: 2500
    });

    socket.on('connect', () => {
      setChannelState('live');
      socket.emit('display:join', {
        restauranteId: restaurante.id,
        slug
      });
      loadDisplay({ silent: true });
    });

    socket.io.on('reconnect', () => {
      setChannelState('syncing');
      socket.emit('display:join', {
        restauranteId: restaurante.id,
        slug
      });
      loadDisplay({ silent: true });
    });

    socket.on('display:ready', () => {
      setChannelState('live');
      loadDisplay({ silent: true });
    });

    socket.on('display:actualizado', (payload) => {
      if (Number(payload?.restauranteId) !== Number(restaurante.id)) return;

      setDisplayData((prev) => {
        if (!prev) return prev;
        const nextActiveCalls = Array.isArray(payload?.activeCalls)
          ? sortActiveCalls(payload.activeCalls.map(normalizarLlamadoEntrante).filter(Boolean))
          : (Array.isArray(prev.activeCalls) ? prev.activeCalls : []);

        const nextCurrent = normalizarLlamadoEntrante(payload?.current)
          || nextActiveCalls.find((event) => event?.visibleNow)
          || null;

        return {
          ...prev,
          config: payload?.config
            ? {
                ...(prev.config || {}),
                ...payload.config
              }
            : prev.config,
          promo: payload?.promo !== undefined ? payload.promo : prev.promo,
          current: nextCurrent,
          activeCalls: nextActiveCalls,
          meta: {
            ...(prev.meta || {}),
            queueCount: Number(payload?.queueCount ?? nextActiveCalls.length),
            refreshedAt: payload?.refreshedAt || new Date().toISOString(),
            source: payload?.source || 'socket'
          }
        };
      });
    });

    socket.on('disconnect', () => {
      setChannelState('reconnecting');
    });

    socket.on('connect_error', () => {
      setChannelState('reconnecting');
    });

    return () => {
      socket.io.off('reconnect');
      socket.disconnect();
    };
  }, [loadDisplay, restaurante?.id, slug]);

  useEffect(() => {
    if (!restaurante?.id) return undefined;

    const syncTimer = window.setInterval(() => {
      loadDisplay({ silent: true });
    }, 15000);

    return () => window.clearInterval(syncTimer);
  }, [loadDisplay, restaurante?.id]);

  const themeStyle = useMemo(() => ({
    '--display-primary': restaurante?.colorPrimario || '#ff7a4c',
    '--display-secondary': restaurante?.colorSecundario || '#132033'
  }), [restaurante?.colorPrimario, restaurante?.colorSecundario]);

  const activeCalls = useMemo(() => {
    if (Array.isArray(displayData?.activeCalls) && displayData.activeCalls.length > 0) {
      return displayData.activeCalls;
    }

    const fallbackEvents = [displayData?.current, ...(displayData?.recent || [])]
      .filter(Boolean);

    return fallbackEvents.filter((event, index, list) => (
      list.findIndex((candidate) => candidate?.id === event?.id) === index
    ));
  }, [displayData]);

  const liveCalls = useMemo(() => (
    sortActiveCalls(activeCalls.filter((event) => event?.visibleNow))
  ), [activeCalls]);

  const callsPerBatch = Math.max(1, Number(config?.activeBatchSize) || 5);
  const batchDurationMs = Math.max(5000, (Number(config?.activeBatchDurationSeconds) || 60) * 1000);
  const totalBatches = Math.max(1, Math.ceil(activeCalls.length / callsPerBatch));

  useEffect(() => {
    setBatchIndex((prev) => (prev >= totalBatches ? 0 : prev));
  }, [totalBatches]);

  useEffect(() => {
    if (totalBatches <= 1) {
      setBatchIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setBatchIndex((prev) => (prev + 1) % totalBatches);
    }, batchDurationMs);

    return () => window.clearInterval(timer);
  }, [batchDurationMs, totalBatches]);

  const visibleBatch = useMemo(() => {
    if (activeCalls.length === 0) return [];
    const start = batchIndex * callsPerBatch;
    return activeCalls.slice(start, start + callsPerBatch);
  }, [activeCalls, batchIndex, callsPerBatch]);

  const currentEvent = displayData?.current || liveCalls[0] || null;
  const primaryLiveEventId = currentEvent?.eventId || currentEvent?.id || null;
  const promoMediaKind = mediaKindFromUrl(promoDestacada?.imagenUrl);
  const promoMediaSrc = normalizeAssetUrl(promoDestacada?.imagenUrl);
  const fallbackPromoTitle = promoDestacada?.titulo || 'Pantalla lista para el siguiente llamado';
  const headlineLabel = getHeadlineLabel(currentEvent);
  const turnValue = getTurnValue(currentEvent);
  const supportMessage = currentEvent?.submensaje || currentEvent?.mensaje || 'Sin llamado activo';
  const queueCount = Number(displayData?.meta?.queueCount ?? activeCalls.length);
  const channelLabel = channelState === 'live'
    ? 'En vivo'
    : channelState === 'syncing'
      ? 'Sincronizando'
      : 'Reconectando';

  useEffect(() => {
    if (!primaryLiveEventId) return;
    if (lastPlayedEventIdRef.current === primaryLiveEventId) return;
    lastPlayedEventIdRef.current = primaryLiveEventId;

    if (config?.sonidoActivo) {
      playChime();
    }
  }, [config?.sonidoActivo, primaryLiveEventId]);

  if (loading) {
    return (
      <div className="display-screen display-screen-loading">
        <div className="display-loader" />
        <p>Cargando pantalla de llamados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="display-screen display-screen-loading">
        <div className="display-error-card">
          <strong>Pantalla no disponible</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="display-screen" style={themeStyle}>
      <div className="display-stage">
        <div className="display-background-shell">
          {promoMediaSrc ? (
            promoMediaKind === 'video' ? (
              <video
                className="display-background-media"
                src={promoMediaSrc}
                muted
                playsInline
                loop
                autoPlay
              />
            ) : (
              <img
                className="display-background-media"
                src={promoMediaSrc}
                alt={fallbackPromoTitle}
              />
            )
          ) : restaurante?.logoUrl ? (
            <div className="display-background-fallback">
              <img
                className="display-background-logo"
                src={normalizeAssetUrl(restaurante.logoUrl)}
                alt={restaurante.nombre}
              />
            </div>
          ) : (
            <div className="display-background-fallback">
              <strong>{(restaurante?.nombre || 'Comanda').slice(0, 1).toUpperCase()}</strong>
            </div>
          )}
        </div>

        <div className="display-stage-overlay" />

        <div className="display-stage-content">
          <header className="display-stage-header">
            <div className="display-stage-brand">
              <span className="display-eyebrow">Pantalla TV</span>
              <strong>{restaurante?.nombre || 'Comanda Display'}</strong>
            </div>
            <div className="display-stage-status">
              <span className={`display-channel-pill ${channelState}`}>
                {channelLabel}
              </span>
              <div className="display-stage-time">{formatClock(clock)}</div>
            </div>
          </header>

          <section className={`display-call-card ${currentEvent ? 'is-live' : 'is-idle'}`}>
            <span className="display-call-label">
              {currentEvent ? 'Llamado activo' : 'Pantalla en espera'}
            </span>

            <div className="display-call-main">
              <div className="display-call-copy">
                <div className="display-call-kicker">
                  <span className={`display-call-signal ${currentEvent ? 'is-live' : ''}`} aria-hidden="true">
                    🔔
                  </span>
                  <span className="display-call-kicker-text">
                    {currentEvent ? 'Aviso en vivo' : 'Canal listo'}
                  </span>
                </div>
                <h1 className="display-call-headline">
                  {headlineLabel}
                </h1>
                <p className="display-call-subline">
                  {currentEvent
                    ? currentEvent.mensaje || currentEvent.submensaje || 'Tu pedido esta listo para entrega'
                    : activeCalls.length > 0
                      ? 'Los avisos recientes quedan disponibles en tirillas para facilitar nuevos llamados durante el siguiente minuto.'
                      : 'La TV mostrara aqui los turnos listos apenas el equipo haga el llamado.'}
                </p>
              </div>

              <div className="display-turn-card">
                <span className="display-eyebrow">Turno</span>
                <strong>{turnValue}</strong>
                <p>{supportMessage}</p>
              </div>
            </div>

            {visibleBatch.length > 0 && (
              <div className="display-active-rail">
                {totalBatches > 1 && (
                  <div className="display-rail-meta">
                    <span>{batchIndex + 1} / {totalBatches}</span>
                    <span>{queueCount} aviso{queueCount === 1 ? '' : 's'} en cola</span>
                  </div>
                )}

                <div className="display-active-grid">
                  {visibleBatch.map((event) => (
                    <article
                      key={event.id}
                      className={`display-active-chip ${event.visibleNow ? 'is-featured' : ''}`}
                    >
                      <strong>{getHeadlineLabel(event)}</strong>
                      <span>{event.numeroPedido ? `Pedido #${event.numeroPedido}` : 'Llamado activo'}</span>
                      <p>{event.submensaje || event.mensaje || 'Tu pedido esta listo'}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
