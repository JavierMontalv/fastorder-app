// admin-web/src/components/ModalAjusteStock.jsx
import { useEffect, useState } from 'react';
import '../styles/ModalAjusteStock.css';

const TIPOS = [
  {
    id:    'entrada',
    label: 'Entrada',
    desc:  'Sumar stock',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
      </svg>
    )
  },
  {
    id:    'salida',
    label: 'Salida',
    desc:  'Restar stock',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
      </svg>
    )
  },
  {
    id:    'ajuste',
    label: 'Ajuste',
    desc:  'Fijar valor',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="12" x2="20" y2="12"/>
        <polyline points="10 6 4 12 10 18"/>
        <polyline points="14 6 20 12 14 18"/>
      </svg>
    )
  }
];

function calcularNuevoStock(stockActual, tipo, cantidad) {
  const actual  = Number(stockActual ?? 0);
  const cant    = Number(cantidad)   || 0;
  if (tipo === 'entrada') return actual + cant;
  if (tipo === 'salida')  return Math.max(0, actual - cant);
  if (tipo === 'ajuste')  return cant;
  return actual;
}

function IconoCerrar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconoCaja() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  );
}

export default function ModalAjusteStock({ abierto, item, onCerrar, onGuardar }) {
  const [tipo,     setTipo]     = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo,   setMotivo]   = useState('');
  const [loading,  setLoading]  = useState(false);

  // Reset completo cada vez que se abre un item diferente
  useEffect(() => {
    if (abierto) {
      setTipo('entrada');
      setCantidad('');
      setMotivo('');
      setLoading(false);
    }
  }, [abierto, item?.id]);

  if (!abierto || !item) return null;

  const nuevoStock    = calcularNuevoStock(item.stockActual, tipo, cantidad);
  const cantNum       = Number(cantidad) || 0;
  const previewValida = cantNum > 0;

  const clasePreview = previewValida
    ? tipo === 'entrada' ? 'inv-modal-preview__value--positive'
    : tipo === 'salida'  ? 'inv-modal-preview__value--negative'
    : 'inv-modal-preview__value--neutral'
    : 'inv-modal-preview__value--muted';

  async function handleGuardar() {
    if (!cantNum || cantNum <= 0) return;
    try {
      setLoading(true);
      await onGuardar({ itemId: item.id, tipo, cantidad: cantNum, motivo });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inv-modal-overlay" onClick={onCerrar}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="inv-modal-header">
          <div className="inv-modal-header__copy">
            <span className="inv-modal-header__kicker">Gestión de stock</span>
            <h2 className="inv-modal-header__title">Ajustar inventario</h2>
          </div>
          <button type="button" className="inv-modal-close" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </div>

        {/* Info del item */}
        <div className="inv-modal-item">
          <div className="inv-modal-item__icon"><IconoCaja /></div>
          <div>
            <div className="inv-modal-item__name">{item.nombre}</div>
            <div className="inv-modal-item__meta">
              {item.seccion ?? item.categoria ?? 'Sin sección'} · {item.unidad ?? 'unidad'}
            </div>
          </div>
          <div className="inv-modal-item__stock">
            <div className="inv-modal-item__stock-label">Stock actual</div>
            <div className="inv-modal-item__stock-value">{item.stockActual ?? 0}</div>
          </div>
        </div>

        {/* Preview antes → después */}
        <div className="inv-modal-preview">
          <div className="inv-modal-preview__block inv-modal-preview__block--before">
            <span className="inv-modal-preview__label">Antes</span>
            <span className="inv-modal-preview__value">{item.stockActual ?? 0}</span>
            <span className="inv-modal-preview__unit">{item.unidad ?? 'unidad'}</span>
          </div>
          <div className="inv-modal-preview__arrow">→</div>
          <div className="inv-modal-preview__block inv-modal-preview__block--after">
            <span className="inv-modal-preview__label">Después</span>
            <span className={`inv-modal-preview__value ${clasePreview}`}>
              {previewValida ? nuevoStock : '—'}
            </span>
            <span className="inv-modal-preview__unit">{item.unidad ?? 'unidad'}</span>
          </div>
        </div>

        {/* Formulario */}
        <div className="inv-modal-body">

          {/* Tipo de ajuste */}
          <div className="inv-field">
            <label className="inv-field__label">Tipo de movimiento</label>
            <div className="inv-tipo-grid">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`inv-tipo-btn inv-tipo-btn--${t.id}${tipo === t.id ? ' inv-tipo-btn--active' : ''}`}
                  onClick={() => setTipo(t.id)}
                >
                  <div className="inv-tipo-btn__icon">{t.icon}</div>
                  <span className="inv-tipo-btn__label">{t.label}</span>
                  <span className="inv-tipo-btn__desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad */}
          <div className="inv-field">
            <label className="inv-field__label">
              {tipo === 'ajuste' ? 'Nuevo valor de stock' : 'Cantidad'}
            </label>
            <div className="inv-cantidad-wrap">
              <input
                className="inv-cantidad-input"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                autoFocus
              />
              <span className="inv-cantidad-unit">{item.unidad ?? 'unidad'}</span>
            </div>
          </div>

          {/* Motivo */}
          <div className="inv-field">
            <label className="inv-field__label">Motivo <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
            <input
              className="inv-motivo-input"
              type="text"
              placeholder="Ej: conteo físico, merma, recepción de proveedor…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="inv-modal-footer">
          <button type="button" className="fo-btn fo-btn-outline" onClick={onCerrar} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="inv-modal-save"
            disabled={loading || !cantNum || cantNum <= 0}
            onClick={handleGuardar}
          >
            {loading && <span className="inv-spinner" />}
            {loading ? 'Guardando…' : 'Confirmar ajuste'}
          </button>
        </div>
      </div>
    </div>
  );
}
