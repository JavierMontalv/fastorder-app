'use strict';

import '../styles/InventarioTabla.css';

const ESTADOS_META = {
  ok:      { label: 'OK',      cls: 'ok' },
  bajo:    { label: 'Bajo',    cls: 'bajo' },
  critico: { label: 'Crítico', cls: 'critico' },
  agotado: { label: 'Agotado', cls: 'agotado' }
};

function calcularAnchoBarra(stockActual, stockMinimo) {
  const actual  = Number(stockActual ?? 0);
  const minimo  = Number(stockMinimo ?? 0);
  if (minimo <= 0) return actual > 0 ? 100 : 0;
  const pct = (actual / (minimo * 2)) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

function ProductosCell({ item }) {
  const productos = Array.isArray(item?.productos) ? item.productos : [];
  if (productos.length === 0) {
    return <span className="inv-productos-none">Sin productos ligados</span>;
  }
  const visibles   = productos.slice(0, 2).map((p) => p.nombre).join(', ');
  const faltantes  = productos.length - 2;
  return (
    <div className="inv-productos-cell">
      <span className="inv-productos-count">{item.productosVinculados} producto{item.productosVinculados !== 1 ? 's' : ''}</span>
      <span className="inv-productos-names">
        {visibles}{faltantes > 0 ? ` +${faltantes} más` : ''}
      </span>
    </div>
  );
}

function IconoAjustar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconoVacio() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

export default function InventarioTabla({ items = [], onAjustarStock, cargando = false }) {
  const lista = Array.isArray(items) ? items : [];

  if (cargando) {
    return (
      <div className="inv-tabla-skeleton">
        <div className="inv-skeleton-row" style={{ height: 38 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="inv-skeleton-row" />
        ))}
      </div>
    );
  }

  if (!lista.length) {
    return (
      <div className="inv-tabla-empty">
        <div className="inv-tabla-empty__icon"><IconoVacio /></div>
        <div className="inv-tabla-empty__title">Sin items de stock</div>
        <div className="inv-tabla-empty__desc">
          Crea tu primer item para empezar a gestionar inventario y vincular productos.
        </div>
      </div>
    );
  }

  return (
    <div className="inv-tabla-wrap">
      <table className="inv-tabla">
        <thead>
          <tr>
            <th className="inv-th">Item / Unidad</th>
            <th className="inv-th">Sección</th>
            <th className="inv-th">Stock actual</th>
            <th className="inv-th">Mínimo</th>
            <th className="inv-th">Productos ligados</th>
            <th className="inv-th">Estado</th>
            <th className="inv-th inv-th--right">Ajustar</th>
          </tr>
        </thead>

        <tbody>
          {lista.map((item, idx) => {
            const estadoKey  = item?.estadoStock ?? 'ok';
            const meta       = ESTADOS_META[estadoKey] ?? ESTADOS_META.ok;
            const anchoBarra = calcularAnchoBarra(item?.stockActual, item?.stockMinimo);
            const puedeAjustar = typeof onAjustarStock === 'function';

            return (
              <tr
                key={item.id ?? idx}
                className={`inv-tr inv-tr--${estadoKey} ${idx % 2 === 0 ? 'inv-tr--even' : 'inv-tr--odd'}`}
              >
                {/* Nombre + unidad */}
                <td className="inv-td">
                  <div className="inv-item-cell">
                    <span className="inv-item-name">{item?.nombre ?? '—'}</span>
                    <span className="inv-item-unit">{item?.unidad ?? 'unidad'}</span>
                  </div>
                </td>

                {/* Sección */}
                <td className="inv-td">
                  <span className="inv-seccion-pill">
                    {item?.seccion ?? item?.categoria ?? 'Sin sección'}
                  </span>
                </td>

                {/* Stock actual + barra */}
                <td className="inv-td">
                  <div className="inv-stock-cell">
                    <span className={`inv-stock-num inv-stock-num--${meta.cls}`}>
                      {item?.stockActual ?? 0}
                    </span>
                    <div className="inv-stock-track">
                      <div
                        className={`inv-stock-fill inv-stock-fill--${meta.cls}`}
                        style={{ width: `${anchoBarra}%` }}
                      />
                    </div>
                    <span className="inv-stock-min">mín {item?.stockMinimo ?? 0}</span>
                  </div>
                </td>

                {/* Mínimo */}
                <td className="inv-td">
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                    {item?.stockMinimo ?? 0}
                  </span>
                </td>

                {/* Productos ligados */}
                <td className="inv-td">
                  <ProductosCell item={item} />
                </td>

                {/* Estado badge */}
                <td className="inv-td">
                  <span className={`inv-estado-badge inv-estado-badge--${meta.cls}`}>
                    <span className="inv-estado-badge__dot" />
                    {meta.label}
                  </span>
                </td>

                {/* Acción */}
                <td className="inv-td inv-td--right">
                  <button
                    type="button"
                    className="inv-ajustar-btn"
                    disabled={!puedeAjustar}
                    onClick={() => puedeAjustar && onAjustarStock(item)}
                  >
                    <IconoAjustar />
                    Ajustar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
