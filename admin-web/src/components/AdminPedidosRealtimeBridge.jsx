import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { usePedidosNotifications } from '../context/PedidosNotificationsContext';
import usePedidosSocket from '../hooks/usePedidosSocket';
import { formatMetodoPago, normalizarPedidoBackend } from '../utils/pedidos';
import {
  emitirPedidoActualizado,
  emitirPedidoEliminado,
  emitirPedidoNuevo,
  emitirGrupoCreado,
  emitirGrupoDisuelto,
  emitirGrupoActualizado,
  emitirMesasSync,
  emitirSyncPedidosSolicitado,
  PEDIDOS_REALTIME_EVENTS
} from '../utils/pedidosRealtime';
import { obtenerCapacidadesUsuario } from '../utils/operationalAccess';

const SOUND_PREFERENCE_KEY = 'comanda.pedidos.sonido';

function construirContextoPedido(pedido) {
  const pedidoNormalizado = normalizarPedidoBackend(pedido);
  const mesaLabel = pedidoNormalizado?.mesaLabel && pedidoNormalizado.mesaLabel !== 'Sin mesa'
    ? pedidoNormalizado.mesaLabel
    : 'Para llevar';
  const metodoPago = formatMetodoPago(pedidoNormalizado?.metodoPago);

  return {
    pedido: pedidoNormalizado,
    lineaPrincipal: `${mesaLabel} - ${metodoPago}`,
    lineaSecundaria: `${pedidoNormalizado?.totalItems || 0} item(s) - ${pedidoNormalizado?.clienteNombre || 'Cliente'}`
  };
}

function NotificationBody({ title, primary, secondary }) {
  return (
    <div className="comanda-order-toast">
      <span className="comanda-order-toast__eyebrow">{title}</span>
      <strong>{primary}</strong>
      <p>{secondary}</p>
      <span className="comanda-order-toast__cta">Abrir pedidos</span>
    </div>
  );
}

export default function AdminPedidosRealtimeBridge() {
  const { user, token, isAuthenticated } = useContext(AuthContext);
  const {
    registrarPedidoNuevo,
    actualizarPedidoNotificacion,
    eliminarPedidoNotificacion
  } = usePedidosNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const pedidosNotificadosRef = useRef(new Map());
  const browserNotificationsRef = useRef(new Map());
  const [sonidoActivado, setSonidoActivado] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem(SOUND_PREFERENCE_KEY);
    return saved !== 'false';
  });

  const puedeEscucharPedidos = useMemo(() => {
    if (!isAuthenticated || !token || !user) return false;
    if (user?.rol === 'superadmin') return false;
    return Boolean(obtenerCapacidadesUsuario(user)?.puedeVerPedidos);
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    const manejarCambioSonido = (event) => {
      setSonidoActivado(Boolean(event?.detail));
    };

    window.addEventListener(PEDIDOS_REALTIME_EVENTS.sonido, manejarCambioSonido);
    return () => {
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.sonido, manejarCambioSonido);
    };
  }, []);

  const marcarComoNotificado = (pedidoId) => {
    if (!pedidoId) return false;

    const ahora = Date.now();
    for (const [id, timestamp] of pedidosNotificadosRef.current.entries()) {
      if (ahora - timestamp > 1000 * 60 * 45) {
        pedidosNotificadosRef.current.delete(id);
      }
    }

    if (pedidosNotificadosRef.current.has(pedidoId)) return false;
    pedidosNotificadosRef.current.set(pedidoId, ahora);
    return true;
  };

  const notificarEnNavegador = (pedidoNormalizado, lineaPrincipal, lineaSecundaria) => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    if (document.visibilityState === 'visible') return;
    if (Notification.permission !== 'granted') return;
    if (!pedidoNormalizado?.id || browserNotificationsRef.current.has(pedidoNormalizado.id)) return;

    const notification = new Notification(`Nuevo pedido #${pedidoNormalizado.numero || pedidoNormalizado.id}`, {
      body: `${lineaPrincipal}\n${lineaSecundaria}`,
      tag: `pedido-${pedidoNormalizado.id}`,
      renotify: true
    });

    notification.onclick = () => {
      window.focus();
      navigate('/pedidos');
      notification.close();
    };

    browserNotificationsRef.current.set(pedidoNormalizado.id, notification);
    window.setTimeout(() => {
      notification.close();
      browserNotificationsRef.current.delete(pedidoNormalizado.id);
    }, 10000);
  };

  usePedidosSocket({
    activo: puedeEscucharPedidos,
    sonidoActivado,
    onNuevoPedido: (pedido) => {
      const { pedido: pedidoNormalizado, lineaPrincipal, lineaSecundaria } = construirContextoPedido(pedido);

      emitirPedidoNuevo(pedidoNormalizado);
      registrarPedidoNuevo(pedidoNormalizado);

      if (!marcarComoNotificado(pedidoNormalizado?.id)) return;

      notificarEnNavegador(pedidoNormalizado, lineaPrincipal, lineaSecundaria);

      toast.info(
        <NotificationBody
          title="Nuevo pedido en tiempo real"
          primary={`Pedido #${pedidoNormalizado?.numero || pedidoNormalizado?.id || ''} listo para gestionar`}
          secondary={`${lineaPrincipal} - ${lineaSecundaria}`}
        />,
        {
          toastId: `pedido-nuevo-${pedidoNormalizado?.id}`,
          className: 'comanda-order-toast-shell',
          bodyClassName: 'comanda-order-toast-body',
          autoClose: 9000,
          onClick: () => {
            if (location.pathname !== '/pedidos') {
              navigate('/pedidos');
            }
          }
        }
      );
    },
    onPedidoActualizado: (pedido) => {
      const pedidoNormalizado = normalizarPedidoBackend(pedido);
      actualizarPedidoNotificacion(pedidoNormalizado);
      emitirPedidoActualizado(pedidoNormalizado);
    },
    onPedidoEliminado: (idPedido) => {
      eliminarPedidoNotificacion(idPedido);
      emitirPedidoEliminado(idPedido);
    },
    onMesaNueva: (mesa) => {
      emitirMesasSync({ type: 'mesa:nueva', mesa });
    },
    onMesaActualizada: (mesa) => {
      emitirMesasSync({ type: 'mesa:actualizada', mesa });
    },
    onMesaEliminada: (mesaId) => {
      emitirMesasSync({ type: 'mesa:eliminada', mesaId });
    },
    onGrupoCreado: (payload) => {
      emitirGrupoCreado(payload);
      emitirMesasSync({ type: 'mesas:grupo_creado', payload });
    },
    onGrupoDisuelto: (payload) => {
      emitirGrupoDisuelto(payload);
      emitirMesasSync({ type: 'mesas:grupo_disuelto', payload });
    },
    onGrupoActualizado: (payload) => {
      emitirGrupoActualizado(payload);
      emitirMesasSync({ type: 'mesas:grupo_actualizado', payload });
    },
    onSyncSolicitado: (payload) => {
      emitirSyncPedidosSolicitado(payload);
    }
  });

  return null;
}
