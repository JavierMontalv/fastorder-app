// admin-web/src/components/InventarioKPI.jsx
import '../styles/InventarioAdmin.css';

function riesgoBadgeCls(riesgo) {
  const r = String(riesgo || '').toLowerCase();
  if (r.includes('crít') || r.includes('crit')) return 'critico';
  if (r.includes('alto'))                        return 'alto';
  if (r.includes('óptimo') || r.includes('optimo')) return 'optimo';
  return 'normal';
}

function IconoRiesgo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

export default function InventarioKPI({ resumen }) {
  if (!resumen) return null;

  const badgeCls = riesgoBadgeCls(resumen.riesgo);

  return (
    <div className="inv-stats-row">
      <div className="inv-stat-card">
        <span className="inv-stat-card__label">Riesgo general</span>
        <div className="inv-stat-card__value" style={{ fontSize: 20, marginTop: 10 }}>
          <span className={`inv-kpi-riesgo__badge inv-kpi-riesgo__badge--${badgeCls}`}>
            <IconoRiesgo />
            {resumen.riesgo ?? 'Normal'}
          </span>
        </div>
        <span className="inv-stat-card__hint">Estado global del inventario</span>
      </div>

      <div className={`inv-stat-card${resumen.alertas > 0 ? ' inv-stat-card--warning' : ' inv-stat-card--ok'}`}>
        <span className="inv-stat-card__label">Alertas activas</span>
        <strong className="inv-stat-card__value">{resumen.alertas ?? 0}</strong>
        <span className="inv-stat-card__hint">Requieren atención inmediata</span>
      </div>

      <div className={`inv-stat-card${resumen.criticos > 0 ? ' inv-stat-card--danger' : ' inv-stat-card--ok'}`}>
        <span className="inv-stat-card__label">Items críticos</span>
        <strong className="inv-stat-card__value">{resumen.criticos ?? 0}</strong>
        <span className="inv-stat-card__hint">Stock mínimo o agotado</span>
      </div>
    </div>
  );
}
