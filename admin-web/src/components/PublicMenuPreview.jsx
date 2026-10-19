// admin-web/src/components/PublicMenuPreview.jsx
// Vista previa del menú QR — espejo fiel del diseño Fuego/Rappi del client-qr
import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { normalizeAssetUrl } from '../config/env';

function getSlugFromMenuUrl(menuUrl = '') {
  if (!menuUrl) return '';
  try {
    const url = new URL(menuUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[0] || '';
  } catch {
    const sanitized = String(menuUrl).replace(/^https?:\/\/[^/]+/i, '');
    const segments = sanitized.split('/').filter(Boolean);
    return segments[0] || '';
  }
}

function normalizeImageUrl(value) {
  return normalizeAssetUrl(value);
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getFallbackIcon(nombre = '') {
  const key = nombre.toLowerCase();
  if (key.includes('bebida')) return '🥤';
  if (key.includes('postre')) return '🍰';
  if (key.includes('combo')) return '🍔';
  if (key.includes('acompañ') || key.includes('acompa')) return '🍟';
  if (key.includes('extra') || key.includes('salsa')) return '🧀';
  return '🍽️';
}

export default function PublicMenuPreview({
  menuUrl,
  colorPrincipal = '#FF4C29',
  colorSecundario = '#1F1F1F'
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const slug = useMemo(() => getSlugFromMenuUrl(menuUrl), [menuUrl]);

  useEffect(() => {
    if (!slug) {
      setRestaurante(null);
      setCategorias([]);
      setCategoriaActiva(null);
      setLoading(false);
      return;
    }

    let activo = true;

    const cargarMenu = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/public/menu/${slug}`);
        if (!activo) return;
        const restauranteData = data?.data?.restaurante || null;
        const categoriasData = Array.isArray(data?.data?.categorias) ? data.data.categorias : [];
        setRestaurante(restauranteData);
        setCategorias(categoriasData);
        setCategoriaActiva((prev) =>
          categoriasData.some((c) => c.id === prev) ? prev : (categoriasData[0]?.id ?? null)
        );
      } catch (err) {
        if (!activo) return;
        setError(err?.message || 'No se pudo cargar la vista previa.');
        setRestaurante(null);
        setCategorias([]);
        setCategoriaActiva(null);
      } finally {
        if (activo) setLoading(false);
      }
    };

    cargarMenu();
    return () => { activo = false; };
  }, [slug]);

  const categoriaVisible = useMemo(
    () => categorias.find((c) => c.id === categoriaActiva) || null,
    [categoriaActiva, categorias]
  );

  const productosActivos = useMemo(
    () => (Array.isArray(categoriaVisible?.productos) ? categoriaVisible.productos : []),
    [categoriaVisible]
  );

  const logoUrl    = normalizeImageUrl(restaurante?.logoUrl);
  const portadaUrl = normalizeImageUrl(restaurante?.portadaUrl);
  const primary    = restaurante?.colorPrimario || colorPrincipal;
  const secondary  = restaurante?.colorSecundario || colorSecundario;
  const cerrado    = restaurante?.estadoOperacion === 'cerrado';

  if (!slug) {
    return (
      <div className="pv-empty">
        <strong>Sin enlace publico</strong>
        <p>Guarda la configuracion para generar la URL del menu digital.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pv-shell">
        <div className="pv-phone pv-loading">
          <div className="pv-loader" style={{ borderTopColor: primary }} />
          <p>Cargando vista previa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pv-shell">
        <div className="pv-phone pv-error">
          <strong>No se pudo cargar el menu</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-shell">
      <div
        className="pv-phone"
        style={{ '--pv-primary': primary, '--pv-secondary': secondary }}
      >
        {/* ── Status bar ─────────────────────────────────── */}
        <div className="pv-statusbar">
          <span>Vista cliente en tiempo real</span>
          <span className={cerrado ? 'pv-status-closed' : 'pv-status-open'}>
            {cerrado ? 'Cerrado' : 'Abierto'}
          </span>
        </div>

        {/* ── Hero: cover photo + logo overlay ─────────── */}
        <div className="pv-hero">
          {/* Cover photo */}
          <div className="pv-cover">
            {portadaUrl ? (
              <img src={portadaUrl} alt="Portada" className="pv-cover-img" />
            ) : (
              <div
                className="pv-cover-placeholder"
                style={{
                  background: `linear-gradient(135deg,
                    color-mix(in srgb, ${secondary} 88%, #000) 0%,
                    color-mix(in srgb, ${primary} 28%, ${secondary}) 100%)`
                }}
              />
            )}
            <div className="pv-cover-gradient" />
          </div>

          {/* Info strip overlapping cover */}
          <div className="pv-hero-strip">
            <div
              className="pv-logo"
              style={{ borderColor: primary }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="pv-logo-img" />
              ) : (
                <span className="pv-logo-mono" style={{ color: primary }}>
                  {(restaurante?.nombre || 'R').slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div className="pv-hero-copy">
              <h3 className="pv-name">{restaurante?.nombre || 'Restaurante'}</h3>
              <div className="pv-meta">
                <span className={`pv-badge-status ${cerrado ? 'closed' : 'open'}`}>
                  <span className="pv-dot" />
                  {cerrado ? 'Cerrado' : 'Abierto'}
                </span>
              </div>
              {restaurante?.descripcion && (
                <p className="pv-desc">{restaurante.descripcion}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Category nav bar ─────────────────────────── */}
        {categorias.length > 0 && (
          <div className="pv-nav" style={{ background: primary }}>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pv-nav-item ${categoriaActiva === cat.id ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(cat.id)}
              >
                <span>{cat.icono || getFallbackIcon(cat.nombre)}</span>
                <span>{cat.nombre}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Section header ───────────────────────────── */}
        {categoriaVisible && (
          <div className="pv-section-head">
            <span className="pv-section-icon" style={{ background: `color-mix(in srgb, ${primary} 10%, white)` }}>
              {categoriaVisible.icono || getFallbackIcon(categoriaVisible.nombre)}
            </span>
            <strong className="pv-section-name">{categoriaVisible.nombre}</strong>
            <span className="pv-section-count">{productosActivos.length} productos</span>
          </div>
        )}

        {/* ── Product list ─────────────────────────────── */}
        <div className="pv-products">
          {productosActivos.length === 0 ? (
            <div className="pv-empty">
              <strong>Sin productos en esta categoria</strong>
            </div>
          ) : (
            productosActivos.map((p) => (
              <article key={p.id} className="pv-product">
                <div className="pv-product-body">
                  <h4 className="pv-product-name">{p.nombre}</h4>
                  {p.descripcion && <p className="pv-product-desc">{p.descripcion}</p>}
                  <div className="pv-product-footer">
                    <strong className="pv-product-price" style={{ color: primary }}>
                      {formatMoney(p.precio)}
                    </strong>
                    <button
                      type="button"
                      className="pv-product-btn"
                      style={{ background: primary }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                <div className="pv-product-media">
                  {p.imagenUrl ? (
                    <img
                      src={normalizeImageUrl(p.imagenUrl)}
                      alt={p.nombre}
                      className="pv-product-img"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="pv-product-placeholder"
                    style={{
                      display: p.imagenUrl ? 'none' : 'flex',
                      background: `color-mix(in srgb, ${primary} 12%, white)`
                    }}
                  >
                    {p.nombre?.slice(0, 1) || '?'}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
