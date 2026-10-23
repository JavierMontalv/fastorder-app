// admin-web/src/components/InventarioAlertaCard.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const SEVERIDAD_CONFIG = {
  urgente: {
    borderColor: '#ef4444',
    iconCls: 'inv-alerta__icon--urgente',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    )
  },
  alta: {
    borderColor: '#f59e0b',
    iconCls: 'inv-alerta__icon--alta',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  },
  media: {
    borderColor: '#3b82f6',
    iconCls: 'inv-alerta__icon--media',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  },
  baja: {
    borderColor: '#94a3b8',
    iconCls: 'inv-alerta__icon--baja',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    )
  }
};

export default function InventarioAlertaCard({ alerta, onResolver, onMarcarLeida }) {
  const { user } = useContext(AuthContext);

  if (!alerta) return null;

  const severidad   = alerta.severidad ?? 'media';
  const config      = SEVERIDAD_CONFIG[severidad] ?? SEVERIDAD_CONFIG.media;
  const puedeActuar = user?.rol === 'admin' || user?.rol === 'superadmin';

  const stockActual   = alerta?.contexto?.stockActual;
  const stockMinimo   = alerta?.contexto?.stockMinimo;
  const mostrarStats  = typeof stockActual === 'number' && typeof stockMinimo === 'number';

  return (
    <div
      className="inv-alerta"
      style={{ borderLeftColor: config.borderColor }}
    >
      <div className={`inv-alerta__icon ${config.iconCls}`}>
        {config.icon}
      </div>

      <div className="inv-alerta__body">
        <div className="inv-alerta__titulo">
          {alerta.mensaje ?? 'Alerta de inventario'}
        </div>

        {mostrarStats && (
          <div className="inv-alerta__contexto">
            <div className="inv-alerta__stat">
              <span className="inv-alerta__stat-label">Stock actual</span>
              <span className="inv-alerta__stat-value">{stockActual}</span>
            </div>
            <div className="inv-alerta__stat">
              <span className="inv-alerta__stat-label">Mínimo</span>
              <span className="inv-alerta__stat-value">{stockMinimo}</span>
            </div>
            {stockMinimo > 0 && (
              <div className="inv-alerta__stat">
                <span className="inv-alerta__stat-label">Cobertura</span>
                <span className="inv-alerta__stat-value">
                  {Math.round((stockActual / stockMinimo) * 100)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {alerta.id && puedeActuar && (
        <div className="inv-alerta__actions">
          <button
            type="button"
            className="fo-btn fo-btn-outline"
            style={{ fontSize: 12, padding: '6px 12px', height: 'auto' }}
            onClick={() => onMarcarLeida(alerta.id)}
          >
            Leída
          </button>
          <button
            type="button"
            className="fo-btn fo-btn-primary"
            style={{ fontSize: 12, padding: '6px 12px', height: 'auto' }}
            onClick={() => onResolver(alerta.id)}
          >
            Resolver
          </button>
        </div>
      )}
    </div>
  );
}
