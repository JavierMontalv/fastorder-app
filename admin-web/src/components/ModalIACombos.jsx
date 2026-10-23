// admin-web/src/components/ModalIACombos.jsx
// ======================================================================
// 🤖 ModalIACombos.jsx — Comanda Admin 2026
// IA de Upsell / Combos Automáticos
// Enfoque negocio · Margen estimado · Dinero puro
// ======================================================================

import '../styles/Productos.css';

export default function ModalIACombos({ open, onClose, combos = [], onAplicarCombo }) {
  if (!open) return null;

  return (
    <div className="pro-modal-overlay">
      <div className="pro-modal pro-modal-wide">
        {/* ============================================================
            HEADER
        ============================================================ */}
        <div className="pro-modal-header">
          <h2>🤖 Combos sugeridos por IA</h2>
          <button className="pro-close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* ============================================================
            BODY
        ============================================================ */}
        <div className="pro-modal-body">
          {combos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍔</div>
              <h3 className="empty-state-title">No hay combos sugeridos</h3>
              <p className="empty-state-text">
                La IA no encontró combinaciones óptimas con los productos actuales.
              </p>
            </div>
          ) : (
            <div className="combos-grid">
              {combos.map((combo, index) => (
                <div key={index} className="combo-card">
                  {/* ------------------ TÍTULO ------------------ */}
                  <h3 className="combo-title">{combo.nombre}</h3>

                  {/* ------------------ PRODUCTOS ------------------ */}
                  <ul className="combo-productos">
                    {combo.productos.map((p, i) => (
                      <li key={i}>
                        <span>{p.nombre}</span>
                        <span className="combo-precio">${p.precio.toLocaleString('es-CO')}</span>
                      </li>
                    ))}
                  </ul>

                  {/* ------------------ RESUMEN ------------------ */}
                  <div className="combo-resumen">
                    <p>
                      <strong>Precio combo:</strong>{' '}
                      <span className="precio-destacado">
                        ${combo.precioCombo.toLocaleString('es-CO')}
                      </span>
                    </p>

                    <p>
                      <strong>Margen estimado:</strong>{' '}
                      <span
                        className={combo.margenEstimado >= 0.3 ? 'margen-alto' : 'margen-medio'}
                      >
                        {(combo.margenEstimado * 100).toFixed(0)}%
                      </span>
                    </p>
                  </div>

                  {/* ------------------ CTA ------------------ */}
                  <button
                    className="pro-btn-primary full-width"
                    onClick={() => onAplicarCombo(combo)}
                  >
                    ➕ Aplicar combo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================
            ACTIONS
        ============================================================ */}
        <div className="pro-modal-actions">
          <button className="pro-btn-outline" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
