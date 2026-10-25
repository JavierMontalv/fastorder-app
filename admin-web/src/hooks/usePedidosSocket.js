// ======================================================================
// 🛰️ usePedidosSocket — COMANDA ENTERPRISE 2026
// Hook WebSocket estable para lista de pedidos y grupos de mesas
// ======================================================================

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/env';

export default function usePedidosSocket({
  activo = false,
  onNuevoPedido,
  onPedidoActualizado,
  onPedidoEliminado,
  onMesaNueva,
  onMesaActualizada,
  onMesaEliminada,
  onGrupoCreado,
  onGrupoDisuelto,
  onGrupoActualizado,
  onSyncSolicitado,
  sonidoActivado = true
}) {
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  // ======================================================
  // Callbacks estables (evita re-conexiones)
  // ======================================================
  const onNuevoPedidoRef = useRef(onNuevoPedido);
  const onPedidoActualizadoRef = useRef(onPedidoActualizado);
  const onPedidoEliminadoRef = useRef(onPedidoEliminado);
  const onMesaNuevaRef = useRef(onMesaNueva);
  const onMesaActualizadaRef = useRef(onMesaActualizada);
  const onMesaEliminadaRef = useRef(onMesaEliminada);
  const onGrupoCreadoRef = useRef(onGrupoCreado);
  const onGrupoDisueltoRef = useRef(onGrupoDisuelto);
  const onGrupoActualizadoRef = useRef(onGrupoActualizado);
  const onSyncSolicitadoRef = useRef(onSyncSolicitado);

  useEffect(() => {
    onNuevoPedidoRef.current = onNuevoPedido;
    onPedidoActualizadoRef.current = onPedidoActualizado;
    onPedidoEliminadoRef.current = onPedidoEliminado;
    onMesaNuevaRef.current = onMesaNueva;
    onMesaActualizadaRef.current = onMesaActualizada;
    onMesaEliminadaRef.current = onMesaEliminada;
    onGrupoCreadoRef.current = onGrupoCreado;
    onGrupoDisueltoRef.current = onGrupoDisuelto;
    onGrupoActualizadoRef.current = onGrupoActualizado;
    onSyncSolicitadoRef.current = onSyncSolicitado;
  }, [
    onNuevoPedido,
    onPedidoActualizado,
    onPedidoEliminado,
    onMesaNueva,
    onMesaActualizada,
    onMesaEliminada,
    onGrupoCreado,
    onGrupoDisuelto,
    onGrupoActualizado,
    onSyncSolicitado
  ]);

  useEffect(() => {
    if (typeof Audio === 'undefined' || !activo || !sonidoActivado) return;

    try {
      const audio = new Audio('/sounds/new-order.wav');
      audio.preload = 'none';
      audio.volume = 0.7;
      audioRef.current = audio;
    } catch {
      audioRef.current = null;
    }

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [activo, sonidoActivado]);

  // ======================================================
  // Deduplicación de eventos (tamaño acotado para evitar memory leak)
  // ======================================================
  const pedidosProcesadosRef = useRef(new Set());
  const MAX_DEDUP_SIZE = 150;

  useEffect(() => {
    if (!activo) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current) return;

    const token = localStorage.getItem('comanda_token');

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnectionAttempts: 15,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 5000
    });

    socketRef.current = socket;

    const solicitarSnapshot = (reason, payload = {}) => {
      onSyncSolicitadoRef.current?.({
        reason,
        ...payload,
        at: new Date().toISOString()
      });
    };

    socket.on('connect', () => {
      solicitarSnapshot('socket:connect', { socketId: socket.id });
    });

    socket.on('pedidos:ready', (payload) => {
      solicitarSnapshot('pedidos:ready', payload);
    });

    socket.io.on('reconnect', (attempt) => {
      solicitarSnapshot('socket:reconnect', { attempt, socketId: socket.id });
    });

    socket.on('connect_error', (err) => {
      console.error('[SOCKET] Error conexión:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[SOCKET] Desconectado:', reason);
    });

    // ===============================
    // 📦 Pedido nuevo
    // ===============================
    socket.on('pedido:nuevo', (pedido) => {
      if (!pedido?.id) return;
      if (pedidosProcesadosRef.current.has(pedido.id)) return;

      if (pedidosProcesadosRef.current.size >= MAX_DEDUP_SIZE) {
        pedidosProcesadosRef.current.clear();
      }
      pedidosProcesadosRef.current.add(pedido.id);
      onNuevoPedidoRef.current?.(pedido);

      if (sonidoActivado) {
        try {
          const audio = audioRef.current || new Audio('/sounds/new-order.wav');
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    // ===============================
    // 🔄 Pedido actualizado
    // ===============================
    socket.on('pedido:actualizado', (payload) => {
      const pedidoActualizado = payload?.pedido || payload;
      if (!pedidoActualizado?.id) return;

      pedidosProcesadosRef.current.add(pedidoActualizado.id);
      onPedidoActualizadoRef.current?.(pedidoActualizado);
    });

    // ===============================
    // 🗑️ Pedido eliminado
    // ===============================
    socket.on('pedido:eliminado', (idPedido) => {
      if (!idPedido) return;

      pedidosProcesadosRef.current.delete(idPedido);
      onPedidoEliminadoRef.current?.(idPedido);
    });

    socket.on('mesa:nueva', (payload) => {
      if (!payload?.id) return;
      onMesaNuevaRef.current?.(payload);
    });

    socket.on('mesa:actualizada', (payload) => {
      if (!payload?.id) return;
      onMesaActualizadaRef.current?.(payload);
    });

    socket.on('mesa:eliminada', (mesaId) => {
      if (!mesaId) return;
      onMesaEliminadaRef.current?.(mesaId);
    });

    // ===============================
    // 🔗 Grupo de mesas creado
    // ===============================
    socket.on('mesas:grupo_creado', (payload) => {
      if (!payload?.mesaPrincipalId) return;
      onGrupoCreadoRef.current?.(payload);
    });

    // ===============================
    // 🔓 Grupo de mesas disuelto
    // ===============================
    socket.on('mesas:grupo_disuelto', (payload) => {
      if (!payload?.mesaPrincipalId) return;
      onGrupoDisueltoRef.current?.(payload);
    });

    socket.on('mesas:grupo_actualizado', (payload) => {
      if (!payload?.mesaPrincipalId) return;
      onGrupoActualizadoRef.current?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      pedidosProcesadosRef.current.clear();
    };
  }, [activo, sonidoActivado]);

  return socketRef;
}
