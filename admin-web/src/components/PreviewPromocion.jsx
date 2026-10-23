// src/components/PreviewPromocion.jsx
// ======================================================================
// 🎨 Vista Previa de Promoción — COMANDA CLIENT + ADMIN 2026
// ----------------------------------------------------------------------
// • Animación fade-in estilo banners de Rappi / Uber Eats
// • Admite imagen o placeholder elegante
// • Render para administración y para menú público QR
// • Componente altamente reusable
// • Diseño moderno, minimalista y elegante
// ======================================================================

import "../styles/PreviewPromocion.css";

export default function PreviewPromocion({ promo, modo = "admin" }) {
  if (!promo) {
    return (
      <div className="preview-promo-container empty">
        <p>Selecciona o crea una promoción para ver la vista previa.</p>
      </div>
    );
  }

  const { titulo, descripcion, imagenUrl, fechaInicio, fechaFin, activa } = promo;

  // ======================================================================
  // Presentación visual adaptada al modo:
  // • admin  → vista rectangular horizontal (banners)
  // • public → vista vertical con botón "Cerrar"
  // ======================================================================

  return (
    <div
      className={`preview-promo-container ${modo} ${
        activa ? "promo-activa" : "promo-inactiva"
      }`}
    >
      {/* Imagen */}
      <div className="preview-promo-img-wrapper">
        {imagenUrl ? (
          <img className="preview-promo-img" src={imagenUrl} alt={titulo} />
        ) : (
          <div className="preview-promo-placeholder">Sin imagen</div>
        )}
      </div>

      {/* Contenido */}
      <div className="preview-promo-content">
        <h2 className="preview-promo-title">{titulo}</h2>

        {descripcion && (
          <p className="preview-promo-desc">{descripcion}</p>
        )}

        <div className="preview-promo-dates">
          <span>Válido:</span> {fechaInicio} — {fechaFin}
        </div>

        {/* Modo cliente: botón cerrar overlay */}
        {modo === "public" && (
          <button className="preview-promo-close-btn">✕</button>
        )}
      </div>
    </div>
  );
}
