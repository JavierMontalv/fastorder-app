// admin-web/src/components/InventarioMovimientos.jsx
import '../styles/InventarioTabla.css';
import '../styles/InventarioAdmin.css';

function formatearFecha(value) {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function IconoEntrada() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
    </svg>
  );
}

function IconoSalida() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  );
}

function IconoAjuste() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12"/>
      <polyline points="10 6 4 12 10 18"/>
      <polyline points="14 6 20 12 14 18"/>
    </svg>
  );
}

function IconoVacio() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

const TIPO_CONFIG = {
  entrada: { label: 'Entrada', cls: 'entrada', Icon: IconoEntrada, delta: (c) => `+${c}` },
  salida:  { label: 'Salida',  cls: 'salida',  Icon: IconoSalida,  delta: (c) => `-${c}` },
  ajuste:  { label: 'Ajuste',  cls: 'ajuste',  Icon: IconoAjuste,  delta: (c) => `${c}`  }
};

export default function InventarioMovimientos({ movimientos = [], cargando = false }) {
  if (cargando) {
    return (
      <div className="inv-tabla-skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="inv-skeleton-row" />
        ))}
      </div>
    );
  }

  if (!movimientos.length) {
    return (
      <div className="inv-tabla-empty">
        <div className="inv-tabla-empty__icon"><IconoVacio /></div>
        <div className="inv-tabla-empty__title">Sin movimientos registrados</div>
        <div className="inv-tabla-empty__desc">
          Los ajustes de entrada, salida y correcciones de stock aparecerán aquí para trazabilidad completa.
        </div>
      </div>
    );
  }

  return (
    <div className="inv-mov-grid">
      {movimientos.map((mov, idx) => {
        const config = TIPO_CONFIG[mov.tipo] ?? TIPO_CONFIG.ajuste;
        const nombre = mov.item?.nombre ?? 'Item sin referencia';
        const seccion = mov.item?.seccion ?? mov.item?.categoria ?? 'Sin sección';
        const unidad  = mov.item?.unidad ?? 'unidad';

        return (
          <div key={mov.id ?? idx} className="inv-mov">
            <div className={`inv-mov__tipo inv-mov__tipo--${config.cls}`}>
              <config.Icon />
            </div>

            <div className="inv-mov__body">
              <div className="inv-mov__nombre">{nombre}</div>
              <div className="inv-mov__meta">
                {seccion} · {unidad}
                {mov.motivo ? ` · ${mov.motivo}` : ''}
              </div>
            </div>

            <div className="inv-mov__right">
              <span className={`inv-mov__delta inv-mov__delta--${config.cls}`}>
                {config.delta(mov.cantidad)}
              </span>
              <span className="inv-mov__flow">
                {mov.cantidadAnterior ?? '?'} → {mov.cantidadNueva ?? '?'} {unidad}
              </span>
              <span className="inv-mov__fecha">{formatearFecha(mov.fecha)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
