import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { formatCurrency, formatMetodoPago, normalizarPedidoBackend } from '../utils/pedidos';

const STORAGE_KEY = 'comanda.pedidos.notifications.session';
const MAX_NOTIFICATIONS = 15;

const PedidosNotificationsContext = createContext(null);

function leerStorage() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarStorage(notifications) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function obtenerMetaEstado(estado = 'pendiente') {
  const estados = {
    pendiente: { label: 'Nuevo', tone: 'new' },
    aceptado: { label: 'Aceptado', tone: 'accepted' },
    preparacion: { label: 'En preparacion', tone: 'preparing' },
    listo: { label: 'Listo', tone: 'ready' },
    entregado: { label: 'Entregado', tone: 'done' },
    cancelado: { label: 'Cancelado', tone: 'muted' }
  };

  return estados[estado] || estados.pendiente;
}

function construirNotificacionPedido(pedido) {
  const pedidoNormalizado = normalizarPedidoBackend(pedido);
  const mesaLabel = pedidoNormalizado?.mesaLabel && pedidoNormalizado.mesaLabel !== 'Sin mesa'
    ? pedidoNormalizado.mesaLabel
    : 'Para llevar';
  const estadoMeta = obtenerMetaEstado(pedidoNormalizado.estado);

  return {
    id: `pedido-${pedidoNormalizado.id}`,
    pedidoId: pedidoNormalizado.id,
    numero: pedidoNormalizado.numero || pedidoNormalizado.id,
    title: `Pedido #${pedidoNormalizado.numero || pedidoNormalizado.id} listo para gestionar`,
    summary: `${mesaLabel} - ${formatMetodoPago(pedidoNormalizado.metodoPago)}`,
    detail: `${pedidoNormalizado.totalItems || 0} item(s) - ${formatCurrency(pedidoNormalizado.total || 0)}`,
    createdAt: pedidoNormalizado.updatedAt || pedidoNormalizado.createdAt || new Date().toISOString(),
    updatedAt: pedidoNormalizado.updatedAt || pedidoNormalizado.createdAt || new Date().toISOString(),
    estado: pedidoNormalizado.estado || 'pendiente',
    stateLabel: estadoMeta.label,
    stateTone: estadoMeta.tone,
    read: false
  };
}

export function PedidosNotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(() => leerStorage());
  const location = useLocation();

  useEffect(() => {
    guardarStorage(notifications);
  }, [notifications]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const estaEnPanel = !['/inicio', '/admin', '/login', '/descubre', '/planes/gracias', '/cambiar-password'].includes(location.pathname);
    if (!estaEnPanel) return undefined;

    const tituloBase = 'Comanda | Panel de control';
    const unread = notifications.filter((item) => !item.read).length;
    document.title = unread > 0 ? `(${unread}) ${tituloBase}` : tituloBase;

    return () => {
      document.title = tituloBase;
    };
  }, [location.pathname, notifications]);

  const registrarPedidoNuevo = useCallback((pedido) => {
    const nueva = construirNotificacionPedido(pedido);

    setNotifications((prev) => {
      const sinDuplicado = prev.filter((item) => item.pedidoId !== nueva.pedidoId);
      return [nueva, ...sinDuplicado].slice(0, MAX_NOTIFICATIONS);
    });

    return nueva;
  }, []);

  const actualizarPedidoNotificacion = useCallback((pedido) => {
    const siguiente = construirNotificacionPedido(pedido);

    setNotifications((prev) =>
      prev.map((item) =>
        item.pedidoId === siguiente.pedidoId
          ? {
              ...item,
              summary: siguiente.summary,
              detail: siguiente.detail,
              estado: siguiente.estado,
              stateLabel: siguiente.stateLabel,
              stateTone: siguiente.stateTone,
              updatedAt: siguiente.updatedAt,
              read: ['entregado', 'cancelado'].includes(siguiente.estado) ? true : item.read
            }
          : item
      )
    );
  }, []);

  const eliminarPedidoNotificacion = useCallback((pedidoId) => {
    setNotifications((prev) => prev.filter((item) => item.pedidoId !== pedidoId));
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const marcarLeida = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    );
  }, []);

  const limpiarNotificaciones = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      registrarPedidoNuevo,
      actualizarPedidoNotificacion,
      eliminarPedidoNotificacion,
      marcarTodasLeidas,
      marcarLeida,
      limpiarNotificaciones
    }),
    [
      actualizarPedidoNotificacion,
      eliminarPedidoNotificacion,
      limpiarNotificaciones,
      marcarLeida,
      marcarTodasLeidas,
      notifications,
      registrarPedidoNuevo,
      unreadCount
    ]
  );

  return (
    <PedidosNotificationsContext.Provider value={value}>
      {children}
    </PedidosNotificationsContext.Provider>
  );
}

export function usePedidosNotifications() {
  const context = useContext(PedidosNotificationsContext);
  if (!context) {
    throw new Error('usePedidosNotifications debe usarse dentro de PedidosNotificationsProvider');
  }
  return context;
}
