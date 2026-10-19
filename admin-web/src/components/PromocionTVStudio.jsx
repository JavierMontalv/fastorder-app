import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { crearPromocion } from '../services/promocionesService';
import { normalizeAssetUrl } from '../config/env';
import '../styles/PromocionTVStudio.css';

const INITIAL_STATE = {
  titulo: '',
  descripcion: '',
  imagenUrl: '',
  estado: 'activa',
  prioridad: 8,
  colorPrincipal: '#ff5f36'
};

function mediaKindFromValue(value = '', file = null) {
  if (file?.type?.startsWith('video/')) return 'video';
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'empty';
  if (raw.startsWith('blob:')) return 'unknown';
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(raw)) return 'video';
  return 'image';
}

export default function PromocionTVStudio({ onCreated }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [mediaArchivo, setMediaArchivo] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mediaPreview?.startsWith('blob:')) return undefined;

    return () => {
      window.URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const mediaActual = mediaPreview || form.imagenUrl || '';
  const mediaKind = useMemo(
    () => mediaKindFromValue(mediaActual, mediaArchivo),
    [mediaActual, mediaArchivo]
  );

  const mediaSrc = mediaPreview || normalizeAssetUrl(form.imagenUrl);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMediaFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = String(file.type || '').startsWith('image/');
    const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);

    if (!isImage && !isVideo) {
      toast.error('Solo se admiten fotos o videos cortos MP4, WEBM o MOV para la pantalla TV.');
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      toast.error('La foto supera el limite de 5 MB.');
      return;
    }

    if (isVideo && file.size > 25 * 1024 * 1024) {
      toast.error('El video supera el limite de 25 MB.');
      return;
    }

    setMediaArchivo(file);
    setMediaPreview(window.URL.createObjectURL(file));
  };

  const limpiarStudio = () => {
    setForm(INITIAL_STATE);
    setMediaArchivo(null);
    setMediaPreview('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.titulo.trim()) {
      toast.error('El titulo para pantalla TV es obligatorio.');
      return;
    }

    if (!mediaArchivo && !form.imagenUrl.trim()) {
      toast.error('Sube una foto, un video corto o pega una URL de media para la pantalla TV.');
      return;
    }

    const payloadBase = {
      ...form,
      tipo: 'full',
      botonTexto: 'Ver promo',
      urlDestino: null,
      fechaInicio: null,
      fechaFin: null,
      imagenUrl: form.imagenUrl.trim() || null,
      prioridad: Number(form.prioridad) || 8
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
      await crearPromocion(payload);
      toast.success('Contenido TV creado y listo para mostrarse en pantalla.');
      limpiarStudio();
      await onCreated?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo crear el contenido para pantalla TV.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="tv-studio">
      <div className="tv-studio-copy">
        <span className="promociones-kicker">Pantalla TV Studio</span>
        <h2>Sube fotos o videos cortos directo al espacio de espera de la TV</h2>
        <p>
          Este bloque crea contenido premium para la pantalla donde tambien aparecen los
          pedidos listos. Cuando no haya un llamado activo, la TV puede mostrar estas
          piezas automaticamente, sin mezclarlas con las promociones del menu QR.
        </p>

        <div className="tv-studio-guides">
          <div>
            <span>Formato ideal</span>
            <strong>Horizontal 16:9</strong>
          </div>
          <div>
            <span>Video recomendado</span>
            <strong>6 a 15 segundos</strong>
          </div>
          <div>
            <span>Uso</span>
            <strong>Combos, lanzamientos, branding</strong>
          </div>
        </div>
      </div>

      <div className="tv-studio-shell">
        <form className="tv-studio-form" onSubmit={handleSubmit}>
          <label className="tv-studio-field">
            <span>Titulo de pantalla</span>
            <input
              type="text"
              value={form.titulo}
              onChange={(event) => handleChange('titulo', event.target.value)}
              placeholder="Combo burger + papas + bebida"
            />
          </label>

          <label className="tv-studio-field">
            <span>Descripcion breve</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => handleChange('descripcion', event.target.value)}
              placeholder="Mensaje corto y potente pensado para verse a distancia."
            />
          </label>

          <div className="tv-studio-grid">
            <label className="tv-studio-field">
              <span>Color base</span>
              <div className="tv-studio-color-row">
                <input
                  type="color"
                  value={form.colorPrincipal}
                  onChange={(event) => handleChange('colorPrincipal', event.target.value)}
                />
                <input
                  type="text"
                  value={form.colorPrincipal}
                  onChange={(event) => handleChange('colorPrincipal', event.target.value)}
                />
              </div>
            </label>

            <label className="tv-studio-field">
              <span>Prioridad en TV</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.prioridad}
                onChange={(event) => handleChange('prioridad', event.target.value)}
              />
            </label>
          </div>

          <div className="tv-studio-grid">
            <label className="tv-studio-field">
              <span>Estado</span>
              <select
                value={form.estado}
                onChange={(event) => handleChange('estado', event.target.value)}
              >
                <option value="activa">Activa</option>
                <option value="programada">Programada</option>
                <option value="borrador">Borrador</option>
                <option value="pausada">Pausada</option>
              </select>
            </label>

            <label className="tv-studio-field">
              <span>URL de imagen o video</span>
              <input
                type="text"
                value={form.imagenUrl}
                onChange={(event) => handleChange('imagenUrl', event.target.value)}
                placeholder="https://... media horizontal"
              />
            </label>
          </div>

          <label className="tv-studio-upload">
            <span>Subir foto o video corto para TV</span>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={handleMediaFile}
            />
            <small>
              Admite JPG, PNG, WEBP, MP4, WEBM y MOV. Si subes video, se usara como
              pieza principal del espacio TV.
            </small>
          </label>

          <div className="tv-studio-actions">
            <button type="button" className="tv-studio-secondary" onClick={limpiarStudio}>
              Limpiar
            </button>
            <button type="submit" className="tv-studio-primary" disabled={saving}>
              {saving ? 'Guardando pieza TV...' : 'Guardar en pantalla TV'}
            </button>
          </div>
        </form>

        <aside className="tv-studio-preview">
          <span className="promociones-kicker">Preview TV</span>
          <div
            className="tv-studio-preview-screen"
            style={{
              '--tv-studio-color': form.colorPrincipal || '#ff5f36'
            }}
          >
            {mediaSrc ? (
              mediaKind === 'video' ? (
                <video
                  className="tv-studio-preview-media"
                  src={mediaSrc}
                  muted
                  playsInline
                  loop
                  autoPlay
                />
              ) : (
                <img
                  className="tv-studio-preview-media"
                  src={mediaSrc}
                  alt={form.titulo || 'Preview TV'}
                />
              )
            ) : (
              <div className="tv-studio-preview-empty">
                Arrastra o selecciona una pieza visual para la pantalla TV
              </div>
            )}

            <div className="tv-studio-preview-overlay">
              <span>{mediaKind === 'video' ? 'Video corto' : 'Pieza TV'}</span>
              <strong>{form.titulo || 'Tu contenido premium de pantalla'}</strong>
              <p>{form.descripcion || 'Se mostrara aqui cuando no haya un pedido listo en foco.'}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
