// admin-web/src/components/InventarioRecomendaciones.jsx
// ======================================================================
// 🤖 InventarioRecomendaciones — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • IA como copiloto, NO chatbot
// • Texto corto + impacto + CTA
// • Contrato de datos defensivo
// • Empty state saludable
// • Safe-by-default (no undefined.property)
// ======================================================================

export default function InventarioRecomendaciones({ recomendaciones = [], iaHabilitada = true }) {
  // ======================================================
  // 🚫 IA DESHABILITADA (POR PLAN / ROL / FEATURE FLAG)
  // ======================================================
  if (!iaHabilitada) {
    return (
      <div className="fo-empty">
        <div className="fo-empty-icon">🔒</div>
        <div className="fo-empty-title">IA no disponible</div>
        <div className="fo-empty-text">
          Las recomendaciones inteligentes no están habilitadas para este plan.
        </div>
      </div>
    );
  }

  // ======================================================
  // ✅ EMPTY STATE SALUDABLE
  // ======================================================
  if (!Array.isArray(recomendaciones) || recomendaciones.length === 0) {
    return (
      <div className="fo-empty">
        <div className="fo-empty-icon">✅</div>
        <div className="fo-empty-title">Inventario optimizado</div>
        <div className="fo-empty-text">No hay recomendaciones pendientes en este momento.</div>
      </div>
    );
  }

  // ======================================================
  // 🤖 LISTADO DE RECOMENDACIONES
  // ======================================================
  return (
    <div className="fo-flex fo-flex-column gap-md">
      {recomendaciones.map((rec, index) => {
        const {
          titulo = 'Recomendación operativa',
          descripcion = 'Acción sugerida por la IA',
          impactoEstimado = null,
          cta = null
        } = rec || {};

        return (
          <div key={index} className="fo-card">
            <strong>{titulo}</strong>

            <p style={{ marginTop: 6 }}>{descripcion}</p>

            {impactoEstimado && (
              <p className="text-muted" style={{ marginTop: 6 }}>
                Impacto estimado: {impactoEstimado}
              </p>
            )}

            {cta && (
              <div style={{ marginTop: 12 }}>
                <button className="fo-btn fo-btn-primary">{cta}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
