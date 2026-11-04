import { useEffect, useMemo, useState } from 'react';
import { FiClock, FiRefreshCw, FiShoppingBag, FiUsers, FiX } from 'react-icons/fi';
import { listarMesas, obtenerCuentaUnificada } from '../api/mesaApi';
import '../styles/Mesas.css';

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function unwrap(response, fallback = []) {
  return response?.data?.data ?? response?.data ?? fallback;
}

function itemName(item = {}) {
  return item.nombreProducto || item.nombre || item.producto?.nombre || 'Producto';
}

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const load = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const response = await listarMesas();
      setMesas((unwrap(response, []) || []).filter((mesa) => mesa.estado !== 'inactiva'));
      setError('');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'No fue posible cargar las mesas.');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load({ quiet: true }), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const normalized = useMemo(() => mesas
    .filter((mesa) => !mesa.esMesaSecundaria)
    .map((mesa) => ({
      ...mesa,
      ocupada: mesa.estado === 'ocupada' || Number(mesa.pedidosActivosGrupo || mesa.pedidosActivos || 0) > 0
    })), [mesas]);

  const summary = useMemo(() => ({
    total: normalized.length,
    occupied: normalized.filter((mesa) => mesa.ocupada).length,
    available: normalized.filter((mesa) => !mesa.ocupada).length
  }), [normalized]);

  const open = async (mesa) => {
    setSelected(mesa);
    setAccount(null);
    if (!mesa.ocupada) return;
    setAccountLoading(true);
    try {
      const response = await obtenerCuentaUnificada(mesa.id);
      setAccount(unwrap(response, null));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'No fue posible leer la atención actual.');
    } finally {
      setAccountLoading(false);
    }
  };

  const rounds = account?.pedidos || [];
  const allItems = rounds.flatMap((pedido) => (pedido.items || []).map((item) => ({ ...item, pedidoId: pedido.id })));

  return (
    <div className="page-container mesas-page fadeIn">
      <header className="mesas-heading">
        <div>
          <span className="mesas-kicker">SALÓN EN TIEMPO REAL</span>
          <h1>Mesas</h1>
          <p>Una mesa ocupada representa una sola atención. Sus rondas y pedidos viven dentro de la misma cuenta.</p>
        </div>
        <button type="button" className="mesas-refresh" onClick={() => load()} disabled={loading}>
          <FiRefreshCw className={loading ? 'is-spinning' : ''} /> Actualizar
        </button>
      </header>

      <section className="mesas-summary" aria-label="Resumen de mesas">
        <div><span>Total</span><strong>{summary.total}</strong></div>
        <div className="is-free"><span>Desocupadas</span><strong>{summary.available}</strong></div>
        <div className="is-busy"><span>Ocupadas</span><strong>{summary.occupied}</strong></div>
      </section>

      {error && <div className="mesas-error" role="alert">{error}</div>}
      {loading ? (
        <div className="mesas-grid">{Array.from({ length: 8 }, (_, index) => <div className="mesa-card skeleton" key={index} />)}</div>
      ) : (
        <section className="mesas-grid" aria-label="Estado de las mesas">
          {normalized.map((mesa) => (
            <button type="button" key={mesa.id} className={`mesa-card ${mesa.ocupada ? 'is-busy' : 'is-free'}`} onClick={() => open(mesa)}>
              <span className="mesa-card-status"><i />{mesa.ocupada ? 'Ocupada' : 'Desocupada'}</span>
              <span className="mesa-card-table" aria-hidden="true"><span /><b>{mesa.numero}</b></span>
              <strong>Mesa {mesa.numero}</strong>
              <small>{mesa.ocupada ? 'Ver atención y cuenta actual' : 'Lista para recibir clientes'}</small>
              {mesa.ocupada && <span className="mesa-card-orders">{Number(mesa.pedidosActivosGrupo || mesa.pedidosActivos || 0)} ronda(s) activa(s)</span>}
            </button>
          ))}
        </section>
      )}

      {selected && (
        <div className="mesa-drawer-backdrop" onMouseDown={() => setSelected(null)}>
          <aside className="mesa-drawer" role="dialog" aria-modal="true" aria-label={`Atención de Mesa ${selected.numero}`} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="mesa-drawer-close" onClick={() => setSelected(null)} aria-label="Cerrar"><FiX /></button>
            <span className={`mesa-account-status ${selected.ocupada ? 'is-busy' : 'is-free'}`}>{selected.ocupada ? 'ATENCIÓN ACTIVA' : 'MESA DESOCUPADA'}</span>
            <h2>Mesa {selected.numero}</h2>
            {!selected.ocupada ? (
              <div className="mesa-empty"><strong>Lista para una nueva atención</strong><p>Cuando el cliente escanee el QR y confirme su primera orden, aquí aparecerá una sola cuenta.</p></div>
            ) : accountLoading ? (
              <div className="mesa-empty">Cargando atención actual…</div>
            ) : (
              <>
                <div className="mesa-account-total">
                  <div><span>Cuenta actual</span><strong>{money.format(Number(account?.resumen?.total || 0))}</strong></div>
                  <div><span>Saldo pendiente</span><strong>{money.format(Number(account?.resumen?.pendientePago || 0))}</strong></div>
                </div>
                <div className="mesa-account-metrics">
                  <span><FiShoppingBag /><b>{rounds.length}</b> ronda(s)</span>
                  <span><FiUsers /><b>{selected.comensalesActuales || 0}</b> comensales</span>
                  <span><FiClock /><b>{allItems.reduce((sum, item) => sum + Number(item.cantidad || 1), 0)}</b> unidades</span>
                </div>
                <div className="mesa-account-copy"><strong>Una sola cuenta</strong><span>Las rondas se conservan para cocina, pero el cobro y el total se consolidan una única vez.</span></div>
                <div className="mesa-account-items">
                  {allItems.length ? allItems.map((item, index) => (
                    <div key={item.id || `${item.pedidoId}-${index}`}>
                      <span><b>{item.cantidad || 1}×</b> {itemName(item)}</span>
                      <strong>{money.format(Number(item.subtotal ?? item.totalItem ?? 0))}</strong>
                    </div>
                  )) : <p>La atención todavía no tiene productos activos.</p>}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
