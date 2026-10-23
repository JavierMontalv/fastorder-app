import { useNavigate } from 'react-router-dom';
import { usePedidosNotifications } from '../context/PedidosNotificationsContext';
import '../styles/PedidosNotifications.css';

function formatNotificationTime(value) {
  if (!value) return 'Ahora';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ahora';

  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function formatStatusTime(createdAt, updatedAt) {
  return formatNotificationTime(updatedAt || createdAt);
}

export default function PedidosNotificationsPanel({ open, onClose }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    marcarLeida,
    marcarTodasLeidas,
    limpiarNotificaciones
  } = usePedidosNotifications();

  if (!open) return null;

  const abrirPedidos = (notificationId = null) => {
    if (notificationId) {
      marcarLeida(notificationId);
    } else {
      marcarTodasLeidas();
    }

    onClose?.();
    navigate('/pedidos');
  };

  return (
    <div className="pedidos-alerts-panel" role="dialog" aria-label="Centro de avisos de pedidos">
      <div className="pedidos-alerts-panel__header">
        <div>
          <span className="pedidos-alerts-panel__eyebrow">Centro de avisos</span>
          <h3>Pedidos entrantes</h3>
          <p>
            {unreadCount > 0
              ? `${unreadCount} aviso(s) sin revisar`
              : 'Todo el flujo ya fue revisado'}
          </p>
        </div>

        <button type="button" className="pedidos-alerts-panel__close" onClick={onClose}>
          x
        </button>
      </div>

      <div className="pedidos-alerts-panel__actions">
        <button type="button" className="pedidos-alerts-panel__ghost" onClick={marcarTodasLeidas}>
          Marcar revisados
        </button>
        <button type="button" className="pedidos-alerts-panel__ghost" onClick={limpiarNotificaciones}>
          Limpiar
        </button>
      </div>

      <div className="pedidos-alerts-panel__list">
        {notifications.length === 0 ? (
          <div className="pedidos-alerts-panel__empty">
            <strong>Sin avisos pendientes</strong>
            <p>Cuando entre un pedido nuevo lo veras aqui y podras abrir pedidos con un click.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className={`pedidos-alerts-item ${notification.read ? '' : 'pedidos-alerts-item--unread'}`}
              onClick={() => abrirPedidos(notification.id)}
            >
              <div className="pedidos-alerts-item__dot" />
              <div className="pedidos-alerts-item__content">
                <div className="pedidos-alerts-item__top">
                  <strong>{notification.title}</strong>
                  <span>{formatStatusTime(notification.createdAt, notification.updatedAt)}</span>
                </div>
                <div className="pedidos-alerts-item__meta">
                  <span className={`pedidos-alerts-item__status pedidos-alerts-item__status--${notification.stateTone || 'new'}`}>
                    {notification.stateLabel || 'Nuevo'}
                  </span>
                </div>
                <p>{notification.summary}</p>
                <small>{notification.detail}</small>
              </div>
            </button>
          ))
        )}
      </div>

      <button type="button" className="pedidos-alerts-panel__cta" onClick={() => abrirPedidos()}>
        Abrir panel de pedidos
      </button>
    </div>
  );
}
