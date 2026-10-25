import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { obtenerRestaurante } from '../api/restauranteApi';
import { AuthContext } from '../context/AuthContext';
import {
  actualizarPromocion,
  cambiarEstadoPromocion,
  crearPromocion,
  eliminarPromocion,
  obtenerPromociones
} from '../services/promocionesService';
import { normalizeAssetUrl } from '../config/env';
import { filterPromotions, promotionMediaKind, promotionFileError, promotionFormError, promotionDateInput as toDateInput, promotionDateLabel as formatDate } from '../utils/promociones.mjs';
import '../styles/Promociones.css';
import '../styles/PromocionesWorkspace.css';

const ESTADOS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'programada', label: 'Programada' },
  { value: 'activa', label: 'Activa' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'finalizada', label: 'Finalizada' }
];

const TIPOS = [
  { value: 'banner', label: 'Banner del menú QR' },
  { value: 'modal', label: 'Ventana emergente del menú QR' },
  { value: 'card', label: 'Tarjeta destacada del menú QR' },
  { value: 'full', label: 'Pantalla TV' }
];

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  imagenUrl: '',
  tipo: 'banner',
  estado: 'borrador',
  fechaInicio: '',
  fechaFin: '',
  prioridad: 5,
  botonTexto: 'Ver promo',
  urlDestino: '',
  colorPrincipal: '#ff5f36'
};

const decimal = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function estadoBadgeLabel(estado) {
  return ESTADOS.find((item) => item.value === estado)?.label || estado;
}

const mediaKindFromUrl = promotionMediaKind;

function renderMediaPreview(src, alt, className = '') {
  const mediaKind = mediaKindFromUrl(src);
  const normalized = normalizeAssetUrl(src);

  if (!normalized) return null;

  if (mediaKind === 'video') {
    return (
      <video className={className} src={normalized} muted playsInline loop autoPlay />
    );
  }

  return <img className={className} src={normalized} alt={alt} />;
}

function isTvPromo(promo) {
  return promo?.tipo === 'full';
}

function getPromoChannelLabel(tipo) {
  return tipo === 'full' ? 'Pantalla TV' : 'Menú QR';
}

function getPreviewLabel(tipo) {
  return TIPOS.find((item) => item.value === tipo)?.label || 'Promoción';
}

export default function Promociones() {
  const { user } = useContext(AuthContext);
  const [promociones, setPromociones] = useState([]);
  const [restaurante, setRestaurante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [form, setForm] = useState(EMPTY_FORM);
  const [mediaArchivo, setMediaArchivo] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCanal, setFiltroCanal] = useState('todos');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [deletePromo, setDeletePromo] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const saveLock = useRef(false);
  const actionLock = useRef(false);
  const editorRef = useRef(null);
  const confirmRef = useRef(null);


  const promocionesTV = useMemo(
    () => promociones.filter((promo) => isTvPromo(promo)),
    [promociones]
  );

  const promocionesMenu = useMemo(
    () => promociones.filter((promo) => !isTvPromo(promo)),
    [promociones]
  );

  const promocionesFiltradasMenu = useMemo(() => filterPromotions(promociones, { estado: filtroEstado, canal: 'menu', query: busqueda }), [promociones, filtroEstado, busqueda]);
  const promocionesFiltradasTV = useMemo(() => filterPromotions(promociones, { estado: filtroEstado, canal: 'tv', query: busqueda }), [promociones, filtroEstado, busqueda]);

  const resumen = useMemo(() => {
    const activas = promociones.filter((promo) => promo.estado === 'activa').length;
    const programadas = promociones.filter((promo) => promo.estado === 'programada').length;
    const tv = promocionesTV.length;
    const menu = promocionesMenu.length;
    const ctrPromedio = promociones.length
      ? promociones.reduce((acc, promo) => acc + Number(promo.ctr || 0), 0) / promociones.length
      : 0;

    return {
      total: promociones.length,
      activas,
      programadas,
      tv,
      menu,
      ctrPromedio
    };
  }, [promociones, promocionesMenu.length, promocionesTV.length]);

  const promoEditando = useMemo(
    () => promociones.find((promo) => promo.id === editingPromoId) || null,
    [promociones, editingPromoId]
  );

  const mediaActual = mediaPreview || form.imagenUrl || '';
  const mediaActualKind = mediaArchivo?.type?.startsWith('video/')
    ? 'video'
    : mediaKindFromUrl(mediaActual);
  const tvDisplayUrl = useMemo(() => {
    if (!restaurante?.slug || typeof window === 'undefined') return '';
    return new URL(`/display/${restaurante.slug}`, window.location.origin).toString();
  }, [restaurante?.slug]);
  const restauranteActivoId = useMemo(() => {
    const sedeGuardada = typeof window !== 'undefined'
      ? Number(window.localStorage.getItem('comanda_sede_activa_id') || 0)
      : 0;
    const perfilActivo = Number(user?.sedeActivaId || user?.restauranteId || 0);
    return sedeGuardada || perfilActivo || null;
  }, [user?.restauranteId, user?.sedeActivaId]);

  const cargarPromociones = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await obtenerPromociones();
      const lista = Array.isArray(data) ? data : [];
      const sedeActualId = typeof window !== 'undefined'
        ? Number(window.localStorage.getItem('comanda_sede_activa_id') || 0)
        : 0;
      const tenantActualId = sedeActualId || restauranteActivoId;
      const listaTenant = tenantActualId
        ? lista.filter((promo) => Number(promo?.restauranteId) === Number(tenantActualId))
        : lista;
      setPromociones(listaTenant);
    } catch (error) {
      setLoadError(error?.response?.data?.message || 'No se pudieron cargar las promociones. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPromociones();
  }, [restauranteActivoId]);

  useEffect(() => {
    const cargarRestaurante = async () => {
      try {
        const response = await obtenerRestaurante();
        setRestaurante(response?.data?.data || response?.data || null);
      } catch {
        setRestaurante(null);
      }
    };

    cargarRestaurante();
  }, [restauranteActivoId]);

  useEffect(() => {
    const handleSedeChanged = () => {
      setPromociones([]);
      setRestaurante(null);
      setDeletePromo(null);
      cerrarEditor();
      cargarPromociones();
      obtenerRestaurante().then(response => setRestaurante(response?.data?.data || response?.data || null)).catch(() => setRestaurante(null));
    };

    window.addEventListener('comanda:sede-changed', handleSedeChanged);
    return () => window.removeEventListener('comanda:sede-changed', handleSedeChanged);
  }, [restauranteActivoId]);

  useEffect(() => {
    if (!mediaPreview?.startsWith('blob:')) return undefined;

    return () => {
      window.URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  useEffect(() => {
    if (formError && editorOpen) editorRef.current?.querySelector('[role="alert"]')?.focus();
  }, [formError, editorOpen]);

  useEffect(() => {
    if (!editorOpen && !deletePromo) return undefined;
    const dialog = deletePromo ? confirmRef.current : editorRef.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(node => node.getClientRects().length);
    controls()[0]?.focus();
    const onKey = event => {
      if (event.key === 'Escape' && !saveLock.current && !actionLock.current) { if (deletePromo) setDeletePromo(null); else setEditorOpen(false); }
      if (event.key === 'Tab') {
        const list = controls(), first = list[0], last = list[list.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus(); };
  }, [editorOpen, deletePromo]);

  const abrirEditor = (promo = null, defaults = {}) => {
    if (promo) {
      setEditingPromoId(promo.id);
      setForm({
        titulo: promo.titulo || '',
        descripcion: promo.descripcion || '',
        imagenUrl: normalizeAssetUrl(promo.imagenUrl) || '',
        tipo: promo.tipo || 'banner',
        estado: promo.estado || 'borrador',
        fechaInicio: toDateInput(promo.fechaInicio),
        fechaFin: toDateInput(promo.fechaFin),
        prioridad: promo.prioridad || 5,
        botonTexto: promo.botonTexto || 'Ver promo',
        urlDestino: promo.urlDestino || '',
        colorPrincipal: promo.colorPrincipal || '#ff5f36'
      });
      setMediaArchivo(null);
      setMediaPreview('');
    } else {
      setEditingPromoId(null);
      setForm({ ...EMPTY_FORM, ...defaults });
      setMediaArchivo(null);
      setMediaPreview('');
    }

    setFormError('');
    setEditorOpen(true);
  };

  const cerrarEditor = () => {
    if (saveLock.current) return;
    setFormError('');
    setEditorOpen(false);
    setEditingPromoId(null);
    setForm(EMPTY_FORM);
    setMediaArchivo(null);
    setMediaPreview('');
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMediaFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = promotionFileError(file);
    if (error) { setFormError(error); event.target.value = ''; return; }
    const isVideo = file.type.startsWith('video/');
    setFormError('');
    setMediaArchivo(file);
    setMediaPreview(window.URL.createObjectURL(file));

    if (isVideo) {
      setForm((prev) => ({ ...prev, tipo: 'full' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saveLock.current) return;
    const currentForm = { ...form, ...Object.fromEntries(new FormData(event.currentTarget)) };
    setForm(currentForm);
    const error = promotionFormError(currentForm, mediaArchivo);
    if (error) { setFormError(error); return; }
    setFormError('');
    saveLock.current = true;

    const payloadBase = {
      ...currentForm,
      imagenUrl: currentForm.imagenUrl?.trim() || null,
      prioridad: Number(currentForm.prioridad) || 1,
      fechaInicio: currentForm.fechaInicio || null,
      fechaFin: currentForm.fechaFin || null
    };

    const payload = mediaArchivo
      ? (() => {
          const multipart = new FormData();
          Object.entries(payloadBase).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            multipart.append(key, value);
          });
          multipart.append('imagen', mediaArchivo);
          return multipart;
        })()
      : payloadBase;

    try {
      setSaving(true);

      if (editingPromoId) {
        await actualizarPromocion(editingPromoId, payload);
        toast.success('Promoción actualizada.');
      } else {
        await crearPromocion(payload);
        toast.success('Promoción creada.');
      }

      saveLock.current = false;
      cerrarEditor();
      await cargarPromociones();
    } catch (error) {
      setFormError(error?.response?.data?.message || 'No se pudo guardar la promoción. Puedes intentarlo nuevamente.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const handleDelete = async (promo) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setPendingAction(promo.id);

    try {
      await eliminarPromocion(promo.id);
      setDeletePromo(null);
      toast.success('Promoción eliminada.');
      await cargarPromociones();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo eliminar la promoción.');
    } finally { actionLock.current = false; setPendingAction(null); }
  };

  const handleToggleEstado = async (promo) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setPendingAction(promo.id);
    const estadoObjetivo = promo.estado === 'activa' ? 'pausada' : 'activa';

    try {
      await cambiarEstadoPromocion(promo.id, { estado: estadoObjetivo });
      toast.success(`Promoción ${estadoObjetivo === 'activa' ? 'activada' : 'pausada'}.`);
      await cargarPromociones();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo cambiar el estado.');
    } finally { actionLock.current = false; setPendingAction(null); }
  };

  const abrirPantallaTV = () => {
    if (!restaurante?.slug) {
      toast.error('Completa la configuración del restaurante para abrir la TV.');
      return;
    }

    window.open(`/display/${restaurante.slug}`, '_blank', 'noopener,noreferrer');
  };

  const copiarUrlTV = async () => {
    if (!tvDisplayUrl) {
      toast.error('El enlace de la TV aún no está disponible.');
      return;
    }

    try {
      await navigator.clipboard.writeText(tvDisplayUrl);
      toast.success('URL de la TV copiada.');
    } catch {
      toast.error('No se pudo copiar la URL de la TV.');
    }
  };

  const renderPromoCard = (promo) => {
    const mediaKind = mediaKindFromUrl(promo.imagenUrl);
    const esPantallaTV = isTvPromo(promo);
    const tvReady = esPantallaTV || mediaKind === 'video';

    return (
      <article key={promo.id} className={`promocion-card ${esPantallaTV ? 'promocion-card-tv' : ''}`}>
        <div
          className="promocion-card-media"
          style={{
            background: `linear-gradient(135deg, ${promo.colorPrincipal || '#ff5f36'}, #111827)`
          }}
        >
          {promo.imagenUrl ? (
            renderMediaPreview(promo.imagenUrl, promo.titulo, 'promocion-media-asset')
          ) : (
            <div className="promocion-card-placeholder">
              {promo.titulo?.slice(0, 1) || 'P'}
            </div>
          )}

          <div className={`promocion-badge estado-${promo.estado}`}>
            {estadoBadgeLabel(promo.estado)}
          </div>
          <div className="promocion-badge tipo">{getPreviewLabel(promo.tipo)}</div>
          {tvReady && (
            <div className="promocion-badge tv">
              {esPantallaTV ? 'Solo TV' : 'Visual TV'}
            </div>
          )}
          {mediaKind === 'video' && (
            <div className="promocion-badge media-kind">Video corto</div>
          )}
        </div>

        <div className="promocion-card-body">
          <div className="promocion-copy">
            <h3>{promo.titulo}</h3>
            <p>{promo.descripcion || 'Añade una descripción para presentar tu oferta.'}</p>
          </div>

          <div className="promocion-meta">
            <div>
              <span>Canal</span>
              <strong>{getPromoChannelLabel(promo.tipo)}</strong>
            </div>
            <div>
              <span>Vigencia</span>
              <strong>{formatDate(promo.fechaInicio)} - {formatDate(promo.fechaFin)}</strong>
            </div>
            <div>
              <span>Prioridad</span>
              <strong>{promo.prioridad || 1}/10</strong>
            </div>
            <div>
              <span>Impresiones</span>
              <strong>{promo.impresiones || 0}</strong>
            </div>
          </div>

          <div className="promocion-tv-box">
            <span>Publicación</span>
            <strong>
              {esPantallaTV
                ? 'Exclusiva para Pantalla TV'
                : 'Visible dentro del menú QR'}
            </strong>
            <p>
              {esPantallaTV
                ? 'Se muestra en la TV durante la espera entre llamados.'
                : 'Tus clientes la verán al consultar la carta.'}
            </p>
          </div>

          <div className="promocion-actions">
            <button type="button" className="promocion-action-btn" disabled={pendingAction !== null} aria-label={`Editar ${promo.titulo}`} onClick={() => abrirEditor(promo)}>
              Editar
            </button>
            <button type="button" className="promocion-action-btn ghost" disabled={pendingAction !== null} aria-label={`${promo.estado === 'activa' ? 'Pausar' : 'Activar'} ${promo.titulo}`} onClick={() => handleToggleEstado(promo)}>
              {promo.estado === 'activa' ? 'Pausar' : 'Activar'}
            </button>
            <button type="button" className="promocion-action-btn danger" disabled={pendingAction !== null} aria-label={`Eliminar ${promo.titulo}`} onClick={() => setDeletePromo(promo)}>
              Eliminar
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="promociones-page promociones-workspace">
      <section className="promociones-hero">
        <div className="promociones-hero-copy">
          <span className="promociones-kicker">Marketing visual</span>
          <h1>Promociones</h1>
          <p>
            Dale visibilidad a tus ofertas. Organiza las campañas de tu menú QR y el contenido de la pantalla TV.
          </p>
        </div>

        <div className="promociones-hero-actions">
          <div className="promociones-quick-actions">
            <div className="promociones-quick-buttons">
              <button
                type="button"
                className="promocion-action-btn"
                onClick={() => abrirEditor(null, { tipo: 'banner', estado: 'activa', prioridad: 7 })}
              >
                Nueva promo QR
              </button>
              <button
                type="button"
                className="promocion-action-btn ghost"
                onClick={() => abrirEditor(null, { tipo: 'full', estado: 'activa', prioridad: 8, botonTexto: 'Ver en TV' })}
              >
                Nuevo contenido TV
              </button>
            </div>
          </div>

        </div>
      </section>

      <section className="promociones-summary">
        <article className="promociones-stat-card">
          <span>Campañas</span>
          <strong>{resumen.total}</strong>
          <small>Contenido total registrado para marketing.</small>
        </article>

        <article className="promociones-stat-card">
          <span>Menú QR</span>
          <strong>{resumen.menu}</strong>
          <small>Banners, ventanas emergentes y tarjetas.</small>
        </article>

        <article className="promociones-stat-card">
          <span>Pantalla TV</span>
          <strong>{resumen.tv}</strong>
          <small>Fotos y videos para los momentos de espera.</small>
        </article>

        <article className="promociones-stat-card">
          <span>CTR promedio</span>
          <strong>{decimal.format(resumen.ctrPromedio)}%</strong>
          <small>Promedio de clics por impresiones de cada campaña.</small>
        </article>
      </section>

      <section className="pr-tools" aria-label="Filtros de promociones">
        <nav className="pr-channels" aria-label="Canal de publicación">
          {[['todos', 'Todos', resumen.total], ['menu', 'Menú QR', resumen.menu], ['tv', 'Pantalla TV', resumen.tv]].map(([value, label, count]) => <button key={value} type="button" aria-pressed={filtroCanal === value} onClick={() => setFiltroCanal(value)}>{label}<span>{count}</span></button>)}
        </nav>
        <div className="pr-filter-row">
          <label className="pr-search">Buscar campaña<input type="search" value={busqueda} onChange={event => setBusqueda(event.target.value)} placeholder="Título o descripción…" /></label>
          <label className="promociones-filter">Estado<select value={filtroEstado} onChange={event => setFiltroEstado(event.target.value)}><option value="todos">Todos los estados</option>{ESTADOS.map(estado => <option key={estado.value} value={estado.value}>{estado.label}</option>)}</select></label>
          {(busqueda || filtroEstado !== 'todos' || filtroCanal !== 'todos') && <button className="promocion-action-btn ghost" type="button" onClick={() => { setBusqueda(''); setFiltroEstado('todos'); setFiltroCanal('todos'); }}>Limpiar filtros</button>}
          <button className="promocion-action-btn ghost" type="button" disabled={loading || pendingAction !== null} onClick={cargarPromociones}>Actualizar</button>
        </div>
      </section>
      {loadError && <div className="pr-error" role="alert"><span>{loadError}</span><button type="button" onClick={cargarPromociones}>Reintentar</button></div>}

      <section className="promociones-tv-spotlight">
        <div className="promociones-tv-guidelines">
          <div className="promociones-tv-access-card">
            <span>Pantalla de tu restaurante</span>
            <strong>{restaurante?.slug ? 'Lleva tus novedades a la TV' : 'Configura el restaurante'}</strong>
            <p>
              {restaurante?.slug
                ? 'Abre este enlace en el navegador de la TV del local.'
                : 'Completa la configuración del restaurante para obtener el enlace.'}
            </p>
            <div className="promociones-tv-access-url">
              {tvDisplayUrl || 'URL no disponible'}
            </div>
            <div className="promociones-tv-access-actions">
              <button
                type="button"
                className="promocion-action-btn"
                onClick={abrirPantallaTV}
                disabled={!restaurante?.slug}
              >
                Abrir pantalla TV
              </button>
              <button
                type="button"
                className="promocion-action-btn ghost"
                onClick={copiarUrlTV}
                disabled={!tvDisplayUrl}
              >
                Copiar URL
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="promociones-split-layout">
        <div className="promociones-split-column" hidden={filtroCanal === 'tv'}>
          <div className="promociones-section-head">
            <div>
              <span className="promociones-kicker">Campañas del menú QR</span>
              <h2>Promociones en tu menú</h2>
            </div>
            <button
              type="button"
              className="promocion-action-btn ghost"
              onClick={() => abrirEditor(null, { tipo: 'banner', estado: 'activa', prioridad: 7 })}
            >
              Nueva promo QR
            </button>
          </div>

          <div className="promociones-content">
            {loading ? (
              <div className="promociones-empty">Cargando promociones...</div>
            ) : promocionesFiltradasMenu.length === 0 ? (
              <div className="promociones-empty">
                <strong>{loadError ? 'No pudimos cargar tus campañas.' : 'No hay promociones QR en esta vista.'}</strong>
                <span>Prueba otros filtros o crea una promoción para tu carta.</span>
              </div>
            ) : (
              <div className="promociones-grid promociones-grid-single">
                {promocionesFiltradasMenu.map(renderPromoCard)}
              </div>
            )}
          </div>
        </div>

        <div className="promociones-split-column" hidden={filtroCanal === 'menu'}>
          <div className="promociones-section-head">
            <div>
              <span className="promociones-kicker">Biblioteca Pantalla TV</span>
              <h2>Contenido para tu pantalla</h2>
            </div>
            <button
              type="button"
              className="promocion-action-btn ghost"
              onClick={() => abrirEditor(null, { tipo: 'full', estado: 'activa', prioridad: 8, botonTexto: 'Ver en TV' })}
            >
              Nuevo contenido TV
            </button>
          </div>

          <div className="promociones-content">
            {loading ? (
              <div className="promociones-empty">Cargando contenido TV...</div>
            ) : promocionesFiltradasTV.length === 0 ? (
              <div className="promociones-empty">
                <strong>{loadError ? 'No pudimos cargar tu contenido.' : 'No hay contenido TV en esta vista.'}</strong>
                <span>Prueba otros filtros o añade una foto o un video.</span>
              </div>
            ) : (
              <div className="promociones-grid promociones-grid-single">
                {promocionesFiltradasTV.map(renderPromoCard)}
              </div>
            )}
          </div>
        </div>
      </section>

      {editorOpen && (
        <div className="promocion-editor-overlay">
          <div className="promocion-editor-shell" ref={editorRef} role="dialog" aria-modal="true" aria-labelledby="pr-editor-title">
            <section className="promocion-editor-panel">
              <div className="promocion-editor-head">
                <div>
                  <span className="promociones-kicker">Editor de campaña</span>
                  <h2 id="pr-editor-title">{promoEditando ? 'Editar campaña' : 'Nueva campaña'}</h2>
                </div>
                <button type="button" className="promocion-close-btn" disabled={saving} aria-label="Cerrar editor" onClick={cerrarEditor}>
                  X
                </button>
              </div>

              <form className="promocion-form-grid" onSubmit={handleSubmit}>
                {formError && <div className="pr-error promocion-field-span-2" role="alert" tabIndex={-1}>{formError}</div>}
                <label className="promocion-field promocion-field-span-2">
                  <span>Título *</span>
                  <input
                    disabled={saving}
                    name="titulo"
                    value={form.titulo}
                    onChange={(event) => updateField('titulo', event.target.value)}
                  />
                </label>

                <label className="promocion-field promocion-field-span-2">
                  <span>Descripción</span>
                  <textarea
                    disabled={saving}
                    name="descripcion"
                    value={form.descripcion}
                    onChange={(event) => updateField('descripcion', event.target.value)}
                    placeholder="Cuenta la oferta, novedad o motivo de la campaña."
                  />
                </label>

                <label className="promocion-field">
                  <span>Dónde se publica</span>
                  <select
                    disabled={saving}
                    name="tipo"
                    value={form.tipo}
                    onChange={(event) => updateField('tipo', event.target.value)}
                  >
                    {TIPOS.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="promocion-field">
                  <span>Estado</span>
                  <select
                    disabled={saving}
                    name="estado"
                    value={form.estado}
                    onChange={(event) => updateField('estado', event.target.value)}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={`promocion-target-hint ${form.tipo === 'full' ? 'is-tv' : 'is-menu'}`}>
                  <span>{form.tipo === 'full' ? 'Canal: Pantalla TV' : 'Canal: Menú QR'}</span>
                  <strong>
                    {form.tipo === 'full'
                      ? 'Esta pieza se publicará solo en la Pantalla TV del local.'
                      : 'Esta pieza se publicará dentro del menú QR del cliente.'}
                  </strong>
                  <p>
                    {form.tipo === 'full'
                      ? 'Perfecta para fotos o videos cortos que no deben mezclarse con las promociones del menú.'
                      : 'Si tu objetivo es el display del local, cambia esta opción a Pantalla TV.'}
                  </p>
                </div>

                <label className="promocion-field">
                  <span>Fecha inicio</span>
                  <input
                    disabled={saving}
                    type="date"
                    name="fechaInicio"
                    value={form.fechaInicio}
                    onChange={(event) => updateField('fechaInicio', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>Fecha fin</span>
                  <input
                    disabled={saving}
                    type="date"
                    name="fechaFin"
                    value={form.fechaFin}
                    onChange={(event) => updateField('fechaFin', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>Prioridad</span>
                  <input
                    disabled={saving}
                    type="number"
                    min="1"
                    max="10"
                    name="prioridad"
                    value={form.prioridad}
                    onChange={(event) => updateField('prioridad', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>Color principal</span>
                  <div className="promocion-color-row">
                    <input
                    disabled={saving}
                      type="color"
                      aria-label="Elegir color principal"
                      value={form.colorPrincipal}
                      onChange={(event) => updateField('colorPrincipal', event.target.value)}
                    />
                    <input
                    disabled={saving}
                      aria-label="Color principal hexadecimal"
                      name="colorPrincipal"
                      value={form.colorPrincipal}
                      onChange={(event) => updateField('colorPrincipal', event.target.value)}
                    />
                  </div>
                </label>

                <label className="promocion-field promocion-field-span-2">
                  <span>Imagen o video desde enlace</span>
                  <input
                    disabled={saving}
                    name="imagenUrl"
                    value={form.imagenUrl}
                    onChange={(event) => updateField('imagenUrl', event.target.value)}
                    placeholder="https://... imagen o video corto"
                  />
                </label>

                <label className="promocion-field promocion-field-span-2">
                  <span>Subir imagen o video</span>
                  <input
                    disabled={saving}
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    onChange={handleMediaFile}
                  />
                </label>

                <label className="promocion-field">
                  <span>Texto del botón</span>
                  <input
                    disabled={saving}
                    name="botonTexto"
                    value={form.botonTexto}
                    onChange={(event) => updateField('botonTexto', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>URL de destino</span>
                  <input
                    disabled={saving}
                    name="urlDestino"
                    value={form.urlDestino}
                    onChange={(event) => updateField('urlDestino', event.target.value)}
                    placeholder="https://tu-destino.com"
                  />
                </label>

                <div className="promocion-editor-actions promocion-field-span-2">
                  <button type="button" className="promocion-action-btn ghost" disabled={saving} onClick={cerrarEditor}>
                    Cancelar
                  </button>
                  <button type="submit" className="promociones-primary-btn" disabled={saving}>
                    {saving ? 'Guardando...' : promoEditando ? 'Actualizar campaña' : 'Crear campaña'}
                  </button>
                </div>
              </form>
            </section>

            <aside className="promocion-preview-panel">
              <span className="promociones-kicker">Vista previa</span>
              <div
                className="promocion-preview-card"
                style={{
                  background: `linear-gradient(145deg, ${form.colorPrincipal || '#ff5f36'}, #111827)`
                }}
              >
                <div className="promocion-preview-top">
                  <span className="promocion-badge estado-preview">{estadoBadgeLabel(form.estado)}</span>
                  <span className="promocion-badge tipo">{getPreviewLabel(form.tipo)}</span>
                </div>

                <div className="promocion-preview-media">
                  {mediaActual ? (
                    mediaActualKind === 'video' ? (
                      <video
                        src={mediaPreview || normalizeAssetUrl(form.imagenUrl)}
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        src={mediaPreview || normalizeAssetUrl(form.imagenUrl)}
                        alt={form.titulo || 'Promoción'}
                      />
                    )
                  ) : (
                    <div className="promocion-card-placeholder">{form.titulo?.slice(0, 1) || 'P'}</div>
                  )}
                </div>

                <div className="promocion-preview-copy">
                  <h3>{form.titulo || 'Tu nueva campaña'}</h3>
                  <p>{form.descripcion || 'Define el mensaje principal de la pieza.'}</p>
                  <button type="button">{form.botonTexto || 'Ver promo'}</button>
                </div>
              </div>

              <div className="promocion-tv-preview-panel">
                <span className="promociones-kicker">Vista previa de TV</span>
                <div className="promocion-tv-preview-frame">
                  <div className="promocion-tv-preview-screen">
                    {mediaActual ? (
                      mediaActualKind === 'video' ? (
                        <video
                          src={mediaPreview || normalizeAssetUrl(form.imagenUrl)}
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : (
                        <img
                          src={mediaPreview || normalizeAssetUrl(form.imagenUrl)}
                          alt={form.titulo || 'Promoción TV'}
                        />
                      )
                    ) : (
                      <div className="promocion-tv-preview-placeholder">
                        Sube una foto o un video corto para Pantalla TV
                      </div>
                    )}
                    <div className="promocion-tv-preview-overlay">
                      <span>{form.tipo === 'full' ? 'Canal TV' : 'Canal menú QR'}</span>
                      <strong>{form.titulo || 'Campaña sin título'}</strong>
                    </div>
                  </div>
                </div>
                <ul className="promocion-tv-checklist">
                  <li>Usa Pantalla TV para piezas exclusivas del display del local.</li>
                  <li>Usa Menú QR para promociones dentro del menú del cliente.</li>
                  <li>Video corto y texto grande funcionan mejor en TV.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      )}
      {deletePromo && <div className="promocion-editor-overlay"><section className="pr-confirm" ref={confirmRef} role="dialog" aria-modal="true" aria-labelledby="pr-delete-title" aria-describedby="pr-delete-description">
        <span className="promociones-kicker">Eliminar campaña</span><h2 id="pr-delete-title">¿Eliminar «{deletePromo.titulo}»?</h2>
        <p id="pr-delete-description">Esta acción elimina la campaña y su publicación. Puedes pausarla desde la tarjeta si deseas conservarla.</p>
        <div className="promocion-actions"><button type="button" className="promocion-action-btn ghost" disabled={pendingAction !== null} onClick={() => setDeletePromo(null)}>Conservar campaña</button><button type="button" className="promocion-action-btn danger" disabled={pendingAction !== null} onClick={() => handleDelete(deletePromo)}>{pendingAction !== null ? 'Eliminando…' : 'Eliminar campaña'}</button></div>
      </section></div>}
    </div>
  );
}
