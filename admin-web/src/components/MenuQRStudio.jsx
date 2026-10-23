import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { crearPromocion } from '../services/promocionesService';
import { normalizeAssetUrl } from '../config/env';
import '../styles/MenuQRStudio.css';

const INITIAL_STATE = {
  titulo: '',
  descripcion: '',
  imagenUrl: '',
  tipo: 'banner',
  estado: 'activa',
  prioridad: 7,
  botonTexto: 'Ver promo',
  urlDestino: '',
  colorPrincipal: '#2563eb'
};

const MENU_TYPES = [
  { value: 'banner', label: 'Banner del menu QR' },
  { value: 'modal', label: 'Popup del menu QR' },
  { value: 'card', label: 'Tarjeta destacada del menu QR' }
];

function mediaKindFromValue(value = '', file = null) {
  if (file?.type?.startsWith('video/')) return 'video';
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'empty';
  if (raw.startsWith('blob:')) return 'unknown';
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(raw)) return 'video';
  return 'image';
}

export default function MenuQRStudio({ onCreated }) {
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

    if (!isImage) {
      toast.error('Para el Menu QR sube una imagen. Los videos quedan reservados para Pantalla TV.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen supera el limite de 5 MB.');
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
      toast.error('El titulo para Menu QR es obligatorio.');
      return;
    }

    const payloadBase = {
      ...form,
      fechaInicio: null,
      fechaFin: null,
      imagenUrl: form.imagenUrl.trim() || null,
      prioridad: Number(form.prioridad) || 7,
      urlDestino: form.urlDestino.trim() || null
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
      toast.success('Campana del Menu QR creada correctamente.');
      limpiarStudio();
      await onCreated?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo crear la campana del Menu QR.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="menu-studio">
      <div className="menu-studio-copy">
        <span className="promociones-kicker">Menu QR Studio</span>
        <h2>Crea banners y tarjetas pensadas para el menu digital del cliente</h2>
        <p>
          Este bloque produce promociones exclusivas para el Menu QR. Aqui no entran
          videos ni piezas de Pantalla TV, para mantener cada canal limpio y alineado.
        </p>

        <div className="menu-studio-guides">
          <div>
            <span>Canal</span>
            <strong>Solo Menu QR</strong>
          </div>
          <div>
            <span>Formato ideal</span>
            <strong>Imagen vertical o cuadrada</strong>
          </div>
          <div>
            <span>Uso</span>
            <strong>Ofertas, combos, upselling</strong>
          </div>
        </div>
      </div>

      <div className="menu-studio-shell">
        <form className="menu-studio-form" onSubmit={handleSubmit}>
          <label className="menu-studio-field">
            <span>Titulo comercial</span>
            <input
              type="text"
              value={form.titulo}
              onChange={(event) => handleChange('titulo', event.target.value)}
              placeholder="Promo burger del dia"
            />
          </label>

          <label className="menu-studio-field">
            <span>Descripcion breve</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => handleChange('descripcion', event.target.value)}
              placeholder="Mensaje breve para atraer el clic dentro del menu."
            />
          </label>

          <div className="menu-studio-grid">
            <label className="menu-studio-field">
              <span>Formato del Menu QR</span>
              <select
                value={form.tipo}
                onChange={(event) => handleChange('tipo', event.target.value)}
              >
                {MENU_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="menu-studio-field">
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
          </div>

          <div className="menu-studio-grid">
            <label className="menu-studio-field">
              <span>Color principal</span>
              <div className="menu-studio-color-row">
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

            <label className="menu-studio-field">
              <span>Prioridad</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.prioridad}
                onChange={(event) => handleChange('prioridad', event.target.value)}
              />
            </label>
          </div>

          <label className="menu-studio-field">
            <span>Texto del boton</span>
            <input
              type="text"
              value={form.botonTexto}
              onChange={(event) => handleChange('botonTexto', event.target.value)}
              placeholder="Ver promo"
            />
          </label>

          <label className="menu-studio-field">
            <span>URL de destino</span>
            <input
              type="text"
              value={form.urlDestino}
              onChange={(event) => handleChange('urlDestino', event.target.value)}
              placeholder="/menu/combo-burger o https://..."
            />
          </label>

          <label className="menu-studio-field">
            <span>URL de imagen</span>
            <input
              type="text"
              value={form.imagenUrl}
              onChange={(event) => handleChange('imagenUrl', event.target.value)}
              placeholder="https://... imagen promocional"
            />
          </label>

          <label className="menu-studio-upload">
            <span>Subir imagen para Menu QR</span>
            <input type="file" accept="image/*" onChange={handleMediaFile} />
            <small>
              Admite JPG, PNG y WEBP. Las imagenes del Menu QR se mantienen separadas del
              contenido para Pantalla TV.
            </small>
          </label>

          <div className="menu-studio-actions">
            <button type="button" className="menu-studio-secondary" onClick={limpiarStudio}>
              Limpiar
            </button>
            <button type="submit" className="menu-studio-primary" disabled={saving}>
              {saving ? 'Guardando campana...' : 'Guardar en Menu QR'}
            </button>
          </div>
        </form>

        <aside className="menu-studio-preview">
          <span className="promociones-kicker">Preview Menu QR</span>
          <div
            className={`menu-studio-preview-card menu-preview-${form.tipo}`}
            style={{
              '--menu-studio-color': form.colorPrincipal || '#2563eb'
            }}
          >
            <div className="menu-studio-preview-browser">
              <span />
              <span />
              <span />
            </div>

            <div className="menu-studio-preview-surface">
              <div className="menu-studio-preview-media">
                {mediaSrc ? (
                  <img src={mediaSrc} alt={form.titulo || 'Preview Menu QR'} />
                ) : (
                  <div className="menu-studio-preview-empty">
                    Sube una imagen para visualizar la pieza del Menu QR
                  </div>
                )}
              </div>

              <div className="menu-studio-preview-copy">
                <span>{MENU_TYPES.find((type) => type.value === form.tipo)?.label}</span>
                <strong>{form.titulo || 'Tu proxima promocion del menu'}</strong>
                <p>{form.descripcion || 'El cliente vera este mensaje dentro del Menu QR.'}</p>
                <button type="button">{form.botonTexto || 'Ver promo'}</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
