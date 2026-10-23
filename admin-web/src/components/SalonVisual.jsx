import { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiEdit3,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiUnlock,
  FiX
} from 'react-icons/fi';
import '../styles/SalonVisual.css';

const ACTIVE_RESERVATIONS = new Set(['pendiente', 'confirmada', 'sentada']);

function getMesaId(item) {
  return String(item?.mesaId || item?.id || '');
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function People({ count = 0, capacity = 4 }) {
  const totalPeople = Math.max(Number(count) || 0, 0);
  const visible = Math.min(totalPeople, 12);
  const capacityLabel = Math.max(Number(capacity) || 0, totalPeople, 1);

  if (visible === 0) return null;

  return (
    <div className="salon-people" aria-label={`${totalPeople} personas en la mesa, capacidad ${capacityLabel}`}>
      {Array.from({ length: visible }, (_, index) => (
        <span
          key={index}
          className="salon-person occupied"
          style={{ '--seat-angle': `${(360 / visible) * index}deg` }}
        >
          <FiUser />
        </span>
      ))}
      {totalPeople > visible && <span className="salon-extra-seats">+{totalPeople - visible}</span>}
    </div>
  );
}

function normalizePedidoList(pedidoGroup) {
  if (!pedidoGroup) return [];
  if (Array.isArray(pedidoGroup.pedidos)) return pedidoGroup.pedidos;
  return [pedidoGroup];
}

function getItemName(item = {}) {
  return item.nombre || item.nombreProducto || item.producto?.nombre || 'Producto';
}

function getItemSubtotal(item = {}) {
  return Number(item.subtotal || item.totalItem || item.total || 0);
}

function classifyItemChanges(item = {}) {
  const result = {
    agregar: [],
    retirar: [],
    elegir: [],
    instrucciones: []
  };

  const groups = Array.isArray(item.modificacionesDetalle) ? item.modificacionesDetalle : [];
  groups.forEach((group) => {
    const isInstruction = group?.tipoSeleccion === 'texto';
    (group?.opciones || []).forEach((option) => {
      const name = String(option?.nombre || '').trim();
      if (!name) return;
      const extraPrice = Number(option?.precioExtra || 0);
      const label = extraPrice > 0 ? `${name} +${formatMoney(extraPrice)}` : name;

      if (isInstruction || option?.tipo === 'instruccion') {
        result.instrucciones.push(name);
      } else if (option?.tipo === 'remover') {
        result.retirar.push(name);
      } else if (option?.tipo === 'extra' || extraPrice > 0) {
        result.agregar.push(label);
      } else {
        result.elegir.push(label);
      }
    });
  });

  if (groups.length === 0 && Array.isArray(item.modificaciones)) {
    item.modificaciones
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .forEach((value) => result.elegir.push(value));
  }

  if (item.nota) result.instrucciones.push(item.nota);
  if (item.instrucciones) result.instrucciones.push(item.instrucciones);
  Object.keys(result).forEach((key) => {
    result[key] = [...new Set(result[key])];
  });

  return result;
}

function ItemModifiers({ item }) {
  const changes = classifyItemChanges(item);
  const rows = [
    { key: 'agregar', label: 'Agregar', values: changes.agregar },
    { key: 'retirar', label: 'Sin', values: changes.retirar },
    { key: 'elegir', label: 'Eleccion', values: changes.elegir },
    { key: 'instrucciones', label: 'Nota', values: changes.instrucciones }
  ].filter((row) => row.values.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className="salon-order-modifiers">
      {rows.map((row) => (
        <div key={row.key} className={`salon-order-modifier salon-order-modifier-${row.key}`}>
          <b>{row.label}</b>
          <span>{row.values.join(', ')}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalonVisual({
  mesas = [],
  reservas = [],
  pedidos = [],
  onEditMesa,
  onEditReserva,
  onUpdateComensales,
  onReleaseMesa,
  mesaActionId,
  title = 'Salon en tiempo real',
  description = 'Estado del servicio, ocupacion y reservas en una sola vista.'
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [peopleDraft, setPeopleDraft] = useState(0);

  const items = useMemo(() => {
    const reservasPorMesa = new Map();
    reservas
      .filter((reserva) => reserva?.mesaId && ACTIVE_RESERVATIONS.has(reserva.estado))
      .forEach((reserva) => {
        const key = String(reserva.mesaId);
        const current = reservasPorMesa.get(key);
        if (!current || new Date(reserva.fechaHoraInicio) < new Date(current.fechaHoraInicio)) {
          reservasPorMesa.set(key, reserva);
        }
      });

    const pedidosPorMesa = new Map();
    pedidos.forEach((pedido) => {
      const key = getMesaId(pedido);
      if (!key) return;
      pedidosPorMesa.set(key, pedido);
    });

    return mesas.map((mesa) => {
      const key = String(mesa.id);
      const reserva = reservasPorMesa.get(key) || null;
      const pedido = pedidosPorMesa.get(key) || null;
      const pedidoList = normalizePedidoList(pedido);
      const totalMesa = pedidoList.reduce((sum, current) => sum + (Number(current?.total) || 0), 0);
      const totalItemsMesa = pedidoList.reduce((sum, current) => sum + (Number(current?.totalItems) || 0), 0);
      const status =
        mesa.estado === 'inactiva'
          ? 'inactiva'
          : pedido || mesa.estado === 'ocupada'
            ? 'ocupada'
            : reserva || mesa.estado === 'reservada'
              ? 'reservada'
              : 'disponible';
      const people =
        Number(mesa.comensalesActuales) ||
        Number(reserva?.numeroPersonas) ||
        0;

      return { ...mesa, reserva, pedido, pedidoList, totalMesa, totalItemsMesa, status, people };
    });
  }, [mesas, pedidos, reservas]);

  const reservasSinMesa = useMemo(
    () =>
      reservas
        .filter((reserva) => !reserva?.mesaId && ACTIVE_RESERVATIONS.has(reserva.estado))
        .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio)),
    [reservas]
  );

  const selected = items.find((item) => String(item.id) === String(selectedId)) || null;

  useEffect(() => {
    setPeopleDraft(Math.max(Number(selected?.people) || 0, 0));
  }, [selected?.id, selected?.people]);

  const selectedActiveOrders = selected?.pedidoList?.filter((pedido) =>
    ['pendiente', 'aceptado', 'preparacion', 'listo'].includes(String(pedido?.estado || ''))
  ) || [];
  const selectedActiveCount = selected?.pedido?.pedidosActivos || selectedActiveOrders.length;
  const maxPeopleDraft = Math.max(Number(selected?.capacidad) || 1, Number(selected?.people) || 0, 1);
  const mesaAccionEnCurso = Boolean(mesaActionId) && String(mesaActionId) === String(selected?.id);
  const summary = useMemo(() => ({
    total: items.length,
    ocupadas: items.filter((item) => item.status === 'ocupada').length,
    reservadas: items.filter((item) => item.status === 'reservada').length,
    disponibles: items.filter((item) => item.status === 'disponible').length,
    porAsignar: reservasSinMesa.length,
    personasReservadas: reservas
      .filter((reserva) => ACTIVE_RESERVATIONS.has(reserva.estado))
      .reduce((sum, reserva) => sum + (Number(reserva.numeroPersonas) || 0), 0)
  }), [items, reservas, reservasSinMesa]);

  return (
    <section className="salon-visual">
      <header className="salon-visual-head">
        <div>
          <span className="salon-eyebrow">Gestion de mesas</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="salon-legend" aria-label="Estados de mesa">
          <span><i className="available" /> Disponible</span>
          <span><i className="reserved" /> Reservada</span>
          <span><i className="busy" /> Ocupada</span>
          <button type="button" className="salon-collapse-btn" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <FiChevronDown /> : <FiChevronUp />}
            {collapsed ? 'Mostrar salon' : 'Ocultar salon'}
          </button>
        </div>
      </header>

      <div className="salon-summary-strip" aria-label="Resumen del salon">
        <span><strong>{summary.total}</strong> mesas</span>
        <span><strong>{summary.ocupadas}</strong> ocupadas</span>
        <span><strong>{summary.reservadas}</strong> reservadas</span>
        <span><strong>{summary.disponibles}</strong> libres</span>
        <span><strong>{summary.porAsignar}</strong> por asignar</span>
        <span><strong>{summary.personasReservadas}</strong> personas</span>
      </div>

      {!collapsed && (
        <div className="salon-floor">
          {reservasSinMesa.map((reserva) => (
            <button
              key={`reserva-${reserva.id}`}
              type="button"
              className="salon-table salon-table-reservada salon-table-waitlist"
              onClick={() => onEditReserva?.(reserva)}
            >
              <People count={reserva.numeroPersonas} capacity={reserva.numeroPersonas} />
              <span className="salon-table-surface">
                <FiMapPin />
                <small>Por asignar</small>
              </span>
              <span className="salon-table-meta">
                {formatTime(reserva.fechaHoraInicio)} - {reserva.numeroPersonas} pax
              </span>
            </button>
          ))}
          {items.map((mesa) => (
            <button
              key={mesa.id}
              type="button"
              className={`salon-table salon-table-${mesa.status} salon-table-${mesa.forma || 'redonda'}`}
              onClick={() => setSelectedId(mesa.id)}
            >
              <People count={mesa.people} capacity={mesa.capacidad} />
              <span className="salon-table-surface">
                <strong>{mesa.numero}</strong>
                <small>{mesa.nombre || `Mesa ${mesa.numero}`}</small>
              </span>
              <span className="salon-table-meta">
                {mesa.status === 'ocupada'
                  ? `${mesa.people || mesa.totalItemsMesa || 1} persona(s)`
                  : mesa.reserva
                    ? `${formatTime(mesa.reserva.fechaHoraInicio)} - ${mesa.reserva.numeroPersonas} pax`
                    : `${mesa.capacidad || 1} puestos`}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="salon-detail-backdrop" role="presentation" onMouseDown={() => setSelectedId(null)}>
          <aside
            className="salon-detail"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de Mesa ${selected.numero}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="salon-detail-close" type="button" onClick={() => setSelectedId(null)}>
              <FiX />
            </button>
            <span className={`salon-status salon-status-${selected.status}`}>{selected.status}</span>
            <h3>Mesa {selected.numero}</h3>
            <p>{selected.nombre || 'Salon principal'} - Capacidad {selected.capacidad || 1}</p>

            <div className="salon-detail-metrics">
              <div><FiUsers /><span>Comensales</span><strong>{selected.people}</strong></div>
              <div><FiShoppingBag /><span>Pedidos activos</span><strong>{selectedActiveCount}</strong></div>
              <div><FiShoppingBag /><span>Items</span><strong>{selected.totalItemsMesa || 0}</strong></div>
              <div><FiClock /><span>Total mesa</span><strong>{formatMoney(selected.totalMesa)}</strong></div>
            </div>

            {selected.reserva && (
              <div className="salon-detail-section">
                <span>Reserva asociada</span>
                <strong>{selected.reserva.clienteNombre}</strong>
                <p><FiClock /> {formatTime(selected.reserva.fechaHoraInicio)} - {selected.reserva.numeroPersonas} personas</p>
                {onEditReserva && (
                  <button type="button" onClick={() => onEditReserva(selected.reserva)}>
                    <FiEdit3 /> Gestionar reserva
                  </button>
                )}
              </div>
            )}

            {selectedActiveOrders.length > 0 ? (
              <div className="salon-detail-section">
                <span>Pedidos de esta mesa</span>
                <strong>{selected.pedido.mesaLabel || `Mesa ${selected.numero}`}</strong>
                <p>{selected.totalItemsMesa || 0} item(s) - {selected.pedido.estadoDominante || 'en curso'} - {formatMoney(selected.totalMesa)}</p>
                <div className="salon-orders-list">
                  {selectedActiveOrders.map((pedido) => (
                    <article key={pedido.id || pedido.numero} className="salon-order-card">
                      <div className="salon-order-head">
                        <div>
                          <span>Pedido #{pedido.numero || pedido.id}</span>
                          <strong>{pedido.estado || 'en curso'}</strong>
                        </div>
                        <b>{formatMoney(pedido.total)}</b>
                      </div>
                      <ul>
                        {(pedido.items || []).map((item) => (
                          <li key={item.id || `${pedido.id}-${getItemName(item)}`}>
                            <div>
                              <strong>{item.cantidad || 1}x {getItemName(item)}</strong>
                              <ItemModifiers item={item} />
                            </div>
                            <span>{formatMoney(getItemSubtotal(item))}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="salon-detail-section salon-detail-empty">
                <span>Sin pedidos activos</span>
                <strong>Mesa libre para nueva cuenta</strong>
                <p>Cuando entren pedidos desde el QR se listaran aqui con items, adiciones y total.</p>
              </div>
            )}

            {(onUpdateComensales || onReleaseMesa || onEditMesa) && (
              <div className="salon-detail-section salon-detail-actions">
                <span>Gestion de ocupacion</span>
                <strong>Acciones de mesa</strong>

                {onUpdateComensales && (
                  <div className="salon-occupancy-control">
                    <button
                      type="button"
                      aria-label="Quitar comensal"
                      onClick={() => setPeopleDraft((value) => Math.max(0, Number(value) - 1))}
                      disabled={mesaAccionEnCurso || peopleDraft <= 0}
                    >
                      <FiMinus />
                    </button>
                    <label>
                      <span>Comensales</span>
                      <input
                        type="number"
                        min="0"
                        max={maxPeopleDraft}
                        value={peopleDraft}
                        onChange={(event) => {
                          const next = Math.max(0, Math.min(maxPeopleDraft, Number(event.target.value) || 0));
                          setPeopleDraft(next);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      aria-label="Agregar comensal"
                      onClick={() => setPeopleDraft((value) => Math.min(maxPeopleDraft, Number(value) + 1))}
                      disabled={mesaAccionEnCurso || peopleDraft >= maxPeopleDraft}
                    >
                      <FiPlus />
                    </button>
                  </div>
                )}

                <div className="salon-detail-action-grid">
                  {onUpdateComensales && (
                    <button
                      className="salon-detail-primary"
                      type="button"
                      onClick={() => onUpdateComensales(selected, peopleDraft)}
                      disabled={mesaAccionEnCurso}
                    >
                      <FiUserPlus /> {mesaAccionEnCurso ? 'Guardando...' : 'Guardar comensales'}
                    </button>
                  )}
                  {onReleaseMesa && (
                    <button
                      className="salon-detail-secondary"
                      type="button"
                      onClick={() => onReleaseMesa(selected)}
                      disabled={mesaAccionEnCurso}
                    >
                      <FiUnlock /> {mesaAccionEnCurso ? 'Liberando...' : 'Desocupar mesa'}
                    </button>
                  )}
                  {onEditMesa && (
                    <button className="salon-detail-secondary" type="button" onClick={() => onEditMesa(selected)}>
                      <FiUsers /> Editar mesa
                    </button>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
