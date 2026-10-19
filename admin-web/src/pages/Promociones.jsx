import { useContext, useEffect, useMemo, useState } from 'react';
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
import '../styles/Promociones.css';

const ESTADOS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'programada', label: 'Programada' },
  { value: 'activa', label: 'Activa' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'finalizada', label: 'Finalizada' }
];

const TIPOS = [
  { value: 'banner', label: 'Banner del menu QR' },
  { value: 'modal', label: 'Popup del menu QR' },
  { value: 'card', label: 'Tarjeta destacada del menu QR' },
  { value: 'full', label: 'Pantalla TV (solo display de turnos)' }
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

function formatDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function toDateInput(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function estadoBadgeLabel(estado) {
  return ESTADOS.find((item) => item.value === estado)?.label || estado;
}

function mediaKindFromUrl(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'empty';
  if (raw.startsWith('blob:')) return 'unknown';
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(raw)) return 'video';
  return 'image';
}

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
  return tipo === 'full' ? 'Pantalla TV' : 'Menu QR';
}

function getPreviewLabel(tipo) {
  return TIPOS.find((item) => item.value === tipo)?.label || 'Promocion';
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

  const promocionesTV = useMemo(
    () => promociones.filter((promo) => isTvPromo(promo)),
    [promociones]
  );

  const promocionesMenu = useMemo(
    () => promociones.filter((promo) => !isTvPromo(promo)),
    [promociones]
  );

  const promocionesFiltradasMenu = useMemo(() => {
    return promociones.filter((promo) => {
      const cumpleEstado = filtroEstado === 'todos' || promo.estado === filtroEstado;
      return cumpleEstado && !isTvPromo(promo);
    });
  }, [filtroEstado, promociones]);

  const promocionesFiltradasTV = useMemo(() => {
    return promociones.filter((promo) => {
      const cumpleEstado = filtroEstado === 'todos' || promo.estado === filtroEstado;
      return cumpleEstado && isTvPromo(promo);
    });
  }, [filtroEstado, promociones]);

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
      toast.error(error?.response?.data?.message || 'No se pudieron cargar las promociones.');
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
      cerrarEditor();
      cargarPromociones();
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
      setMediaPreview(normalizeAssetUrl(promo.imagenUrl) || '');
    } else {
      setEditingPromoId(null);
      setForm({ ...EMPTY_FORM, ...defaults });
      setMediaArchivo(null);
      setMediaPreview('');
    }

    setEditorOpen(true);
  };

  const cerrarEditor = () => {
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

    const isImage = String(file.type || '').startsWith('image/');
    const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);

    if (!isImage && !isVideo) {
      toast.error('Solo puedes subir imagenes o videos cortos MP4, WEBM o MOV.');
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      toast.error('La imagen supera el limite de 5 MB.');
      return;
    }

    if (isVideo && file.size > 25 * 1024 * 1024) {
      toast.error('El video supera el limite de 25 MB.');
      return;
    }

    setMediaArchivo(file);
    setMediaPreview(window.URL.createObjectURL(file));

    if (isVideo) {
      setForm((prev) => ({ ...prev, tipo: 'full' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.titulo.trim()) {
      toast.error('El titulo de la promocion es obligatorio.');
      return;
    }

    if (form.fechaInicio && form.fechaFin && form.fechaInicio > form.fechaFin) {
      toast.error('La fecha final no puede ser menor que la fecha inicial.');
      return;
    }

    const payloadBase = {
      ...form,
      imagenUrl: form.imagenUrl?.trim() || null,
      prioridad: Number(form.prioridad) || 1,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null
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
        toast.success('Promocion actualizada.');
      } else {
        await crearPromocion(payload);
        toast.success('Promocion creada.');
      }

      cerrarEditor();
      await cargarPromociones();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo guardar la promocion.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo) => {
    if (!window.confirm(`Eliminar la promocion "${promo.titulo}"?`)) return;

    try {
      await eliminarPromocion(promo.id);
      toast.success('Promocion eliminada.');
      await cargarPromociones();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo eliminar la promocion.');
    }
  };

  const handleToggleEstado = async (promo) => {
    const estadoObjetivo = promo.estado === 'activa' ? 'pausada' : 'activa';

    try {
      await cambiarEstadoPromocion(promo.id, { estado: estadoObjetivo });
      toast.success(`Promocion ${estadoObjetivo === 'activa' ? 'activada' : 'pausada'}.`);
      await cargarPromociones();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo cambiar el estado.');
    }
  };

  const abrirPantallaTV = () => {
    if (!restaurante?.slug) {
      toast.error('No se encontro el slug del restaurante para la TV.');
      return;
    }

    window.open(`/display/${restaurante.slug}`, '_blank', 'noopener,noreferrer');
  };

  const copiarUrlTV = async () => {
    if (!tvDisplayUrl) {
      toast.error('La URL de la TV aun no esta disponible.');
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
            <p>{promo.descripcion || 'Sin descripcion comercial todavia.'}</p>
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
            <span>Publicacion</span>
            <strong>
              {esPantallaTV
                ? 'Exclusiva para Pantalla TV'
                : 'Visible dentro del menu QR'}
            </strong>
            <p>
              {esPantallaTV
                ? 'Se usa en el display del local cuando no hay un pedido listo en foco.'
                : 'Esta promocion pertenece al menu QR del cliente.'}
            </p>
          </div>

          <div className="promocion-actions">
            <button type="button" className="promocion-action-btn" onClick={() => abrirEditor(promo)}>
              Editar
            </button>
            <button type="button" className="promocion-action-btn ghost" onClick={() => handleToggleEstado(promo)}>
              {promo.estado === 'activa' ? 'Pausar' : 'Activar'}
            </button>
            <button type="button" className="promocion-action-btn danger" onClick={() => handleDelete(promo)}>
              Eliminar
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="promociones-page">
      <section className="promociones-hero">
        <div className="promociones-hero-copy">
          <span className="promociones-kicker">Marketing visual</span>
          <h1>Menu QR y Pantalla TV en un solo panel, pero separados</h1>
          <p>
            Gestiona promociones del menu QR y contenido exclusivo para Pantalla TV sin
            mezclar canales. Cada pieza deja claro donde se publica.
          </p>
        </div>

        <div className="promociones-hero-actions">
          <div className="promociones-quick-actions">
            <span>Crear contenido</span>
            <strong>Elige el canal y publica sin confundir piezas.</strong>
            <p>Para administradores nuevos o expertos: una accion, un canal, una vista previa.</p>
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

          <div className="promociones-filter">
            <span>Filtrar por estado</span>
            <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
              <option value="todos">Todos</option>
              {ESTADOS.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="promociones-summary">
        <article className="promociones-stat-card">
          <span>Total campanas</span>
          <strong>{resumen.total}</strong>
          <small>Contenido total registrado para marketing.</small>
        </article>

        <article className="promociones-stat-card">
          <span>Menu QR</span>
          <strong>{resumen.menu}</strong>
          <small>Piezas que si aparecen dentro del menu del cliente.</small>
        </article>

        <article className="promociones-stat-card">
          <span>Pantalla TV</span>
          <strong>{resumen.tv}</strong>
          <small>Contenido exclusivo para el display de turnos y espera.</small>
        </article>

        <article className="promociones-stat-card">
          <span>CTR promedio</span>
          <strong>{decimal.format(resumen.ctrPromedio)}%</strong>
          <small>Promedio de interaccion por campana.</small>
        </article>
      </section>

      <section className="promociones-tv-spotlight">
        <div className="promociones-tv-guidelines">
          <div className="promociones-tv-access-card">
            <span>URL profesional de la TV</span>
            <strong>{restaurante?.slug ? 'Pantalla lista para instalar' : 'Configura el restaurante'}</strong>
            <p>
              {restaurante?.slug
                ? 'Usa este enlace en el navegador de la TV del local. Queda conectado al display en tiempo real.'
                : 'Cuando el restaurante tenga slug disponible, aqui aparecera la URL final para la TV.'}
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
        <div className="promociones-split-column">
          <div className="promociones-section-head">
            <div>
              <span className="promociones-kicker">Campanas Menu QR</span>
              <h2>Piezas visibles dentro del menu del cliente</h2>
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
                <strong>No hay campanas de Menu QR para este estado.</strong>
                <span>Crea banners, popups o tarjetas con el boton Nueva promo QR.</span>
              </div>
            ) : (
              <div className="promociones-grid promociones-grid-single">
                {promocionesFiltradasMenu.map(renderPromoCard)}
              </div>
            )}
          </div>
        </div>

        <div className="promociones-split-column">
          <div className="promociones-section-head">
            <div>
              <span className="promociones-kicker">Biblioteca Pantalla TV</span>
              <h2>Fotos y videos cortos para el display del local</h2>
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
                <strong>Aun no hay contenido exclusivo para Pantalla TV.</strong>
                <span>Sube una foto o video corto con el boton Nuevo contenido TV.</span>
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
          <div className="promocion-editor-shell">
            <section className="promocion-editor-panel">
              <div className="promocion-editor-head">
                <div>
                  <span className="promociones-kicker">Editor de campana</span>
                  <h2>{promoEditando ? 'Editar campana' : 'Nueva campana'}</h2>
                </div>
                <button type="button" className="promocion-close-btn" onClick={cerrarEditor}>
                  X
                </button>
              </div>

              <form className="promocion-form-grid" onSubmit={handleSubmit}>
                <label className="promocion-field promocion-field-span-2">
                  <span>Titulo</span>
                  <input
                    value={form.titulo}
                    onChange={(event) => updateField('titulo', event.target.value)}
                  />
                </label>

                <label className="promocion-field promocion-field-span-2">
                  <span>Descripcion</span>
                  <textarea
                    value={form.descripcion}
                    onChange={(event) => updateField('descripcion', event.target.value)}
                    placeholder="Cuenta la oferta, novedad o motivo de la campana."
                  />
                </label>

                <label className="promocion-field">
                  <span>Donde se publica</span>
                  <select
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
                  <span>{form.tipo === 'full' ? 'Canal: Pantalla TV' : 'Canal: Menu QR'}</span>
                  <strong>
                    {form.tipo === 'full'
                      ? 'Esta pieza se publicara solo en la Pantalla TV del local.'
                      : 'Esta pieza se publicara dentro del menu QR del cliente.'}
                  </strong>
                  <p>
                    {form.tipo === 'full'
                      ? 'Perfecta para fotos o videos cortos que no deben mezclarse con las promos del menu.'
                      : 'Si tu objetivo es el display del local, cambia esta opcion a Pantalla TV.'}
                  </p>
                </div>

                <label className="promocion-field">
                  <span>Fecha inicio</span>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(event) => updateField('fechaInicio', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>Fecha fin</span>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={(event) => updateField('fechaFin', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>Prioridad</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.prioridad}
                    onChange={(event) => updateField('prioridad', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>Color principal</span>
                  <div className="promocion-color-row">
                    <input
                      type="color"
                      value={form.colorPrincipal}
                      onChange={(event) => updateField('colorPrincipal', event.target.value)}
                    />
                    <input
                      value={form.colorPrincipal}
                      onChange={(event) => updateField('colorPrincipal', event.target.value)}
                    />
                  </div>
                </label>

                <label className="promocion-field promocion-field-span-2">
                  <span>Imagen o video desde enlace</span>
                  <input
                    value={form.imagenUrl}
                    onChange={(event) => updateField('imagenUrl', event.target.value)}
                    placeholder="https://... imagen o video corto"
                  />
                </label>

                <label className="promocion-field promocion-field-span-2">
                  <span>Subir imagen o video</span>
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    onChange={handleMediaFile}
                  />
                </label>

                <label className="promocion-field">
                  <span>Texto del boton</span>
                  <input
                    value={form.botonTexto}
                    onChange={(event) => updateField('botonTexto', event.target.value)}
                  />
                </label>

                <label className="promocion-field">
                  <span>URL de destino</span>
                  <input
                    value={form.urlDestino}
                    onChange={(event) => updateField('urlDestino', event.target.value)}
                    placeholder="https://tu-destino.com"
                  />
                </label>

                <div className="promocion-editor-actions promocion-field-span-2">
                  <button type="button" className="promocion-action-btn ghost" onClick={cerrarEditor}>
                    Cancelar
                  </button>
                  <button type="submit" className="promociones-primary-btn" disabled={saving}>
                    {saving ? 'Guardando...' : promoEditando ? 'Actualizar campana' : 'Crear campana'}
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
                        alt={form.titulo || 'Promocion'}
                      />
                    )
                  ) : (
                    <div className="promocion-card-placeholder">{form.titulo?.slice(0, 1) || 'P'}</div>
                  )}
                </div>

                <div className="promocion-preview-copy">
                  <h3>{form.titulo || 'Tu nueva campana'}</h3>
                  <p>{form.descripcion || 'Define el mensaje principal de la pieza.'}</p>
                  <button type="button">{form.botonTexto || 'Ver promo'}</button>
                </div>
              </div>

              <div className="promocion-tv-preview-panel">
                <span className="promociones-kicker">Preview Pantalla TV</span>
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
                          alt={form.titulo || 'Promocion TV'}
                        />
                      )
                    ) : (
                      <div className="promocion-tv-preview-placeholder">
                        Sube una foto o un video corto para Pantalla TV
                      </div>
                    )}
                    <div className="promocion-tv-preview-overlay">
                      <span>{form.tipo === 'full' ? 'Canal TV' : 'Canal menu QR'}</span>
                      <strong>{form.titulo || 'Campana sin titulo'}</strong>
                    </div>
                  </div>
                </div>
                <ul className="promocion-tv-checklist">
                  <li>Usa Pantalla TV para piezas exclusivas del display del local.</li>
                  <li>Usa Menu QR para promociones dentro del menu del cliente.</li>
                  <li>Video corto y texto grande funcionan mejor en TV.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
