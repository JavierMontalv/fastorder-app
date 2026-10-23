// admin-web/src/components/TarjetaProducto.jsx
import { buildAssetUrl } from '../config/env';
import '../styles/Productos.css';

const PLACEHOLDER = '/img/placeholder-producto.svg';

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

export default function TarjetaProducto({ producto, onEdit, onDelete }) {
  if (producto.estado === 'eliminado') return null;

  const imagenSrc = producto.imagen
    ? buildAssetUrl(`uploads/productos/${producto.imagen}`)
    : producto.imagenUrl
      ? buildAssetUrl(producto.imagenUrl)
      : PLACEHOLDER;

  const precioFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(producto.precio || 0);

  const estaActivo = producto.estado !== 'inactivo';
  const disponible = producto.disponible !== false;
  const alergenos = producto?.plato?.alergenos || producto?.alergenos || '';
  const stockBadgeClass = producto.estadoStock || 'sin_control';
  const stockResumen =
    producto.stockFuente === 'inventario'
      ? `${producto.inventarioItemNombre || 'Inventario'} · ${producto.stockActual ?? 0}`
      : producto.stockFuente === 'producto'
        ? `${producto.stockActual ?? 0} u. disponibles`
        : 'Sin control de stock';

  return (
    <article className="pro-card">

      {/* ── IMAGEN ── */}
      <div className="pro-card-img-wrap">
        <img
          src={imagenSrc}
          alt={producto.nombre}
          className="pro-card-img"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />

        {/* Categoría — top-right glass pill */}
        {producto.categoria?.nombre && (
          <span className="pro-cat-badge">{producto.categoria.nombre}</span>
        )}

        {/* Estado — bottom-left sobre el gradient */}
        <span className={`pro-estado-badge ${estaActivo ? 'activo' : 'inactivo'}`}>
          <span className="pro-estado-dot" />
          {estaActivo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* ── CUERPO ── */}
      <div className="pro-card-body">
        <div className="pro-card-info">
          <h3 className="pro-card-title">{producto.nombre}</h3>
          {producto.descripcion?.trim() && (
            <p className="pro-card-desc">{producto.descripcion}</p>
          )}
          {alergenos ? (
            <div className="pro-allergen-note" title={`Alergenos: ${alergenos}`}>
              <span>!</span>
              <strong>Alergenos</strong>
              <em>{alergenos}</em>
            </div>
          ) : null}
          <div className="pro-stock-row">
            <span className={`pro-stock-badge ${stockBadgeClass}`}>
              {disponible ? (producto.estadoStock === 'sin_control' ? 'Disponible' : producto.estadoStock) : 'Agotado'}
            </span>
            <span className="pro-stock-text">{stockResumen}</span>
          </div>
        </div>

        {/* ── FOOTER: precio + acciones ── */}
        <div className="pro-card-footer">
          <span className="pro-card-precio">{precioFormateado}</span>

          <div className="pro-card-actions">
            <button
              className="pro-card-btn-edit"
              onClick={() => onEdit(producto)}
              title="Editar producto"
            >
              <IconEdit />
              Editar
            </button>

            {onDelete && (
              <button
                className="pro-card-btn-delete"
                onClick={() => onDelete(producto.id)}
                title="Eliminar producto"
              >
                <IconTrash />
              </button>
            )}
          </div>
        </div>
      </div>

    </article>
  );
}
