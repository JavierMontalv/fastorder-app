// admin-web/src/hooks/useInventarioSocket.js
// ======================================================================
// 📦 useInventarioSocket — COMANDA ENTERPRISE 2026
// Hook WebSocket para el panel de inventario.
//
// • Una sola conexión por montaje del módulo de inventario
// • Se une a sala inventario_<restauranteId> en el backend
// • Callbacks estabilizados con refs (no reconecta en re-renders)
// ======================================================================

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/env';

export default function useInventarioSocket({
  activo = false,
  onItemActualizado,
  onAlertaEstado
}) {
  const socketRef = useRef(null);

  // Refs estables para callbacks — evita reconexiones por cambio de función
  const onItemActualizadoRef = useRef(onItemActualizado);
  const onAlertaEstadoRef    = useRef(onAlertaEstado);

  useEffect(() => {
    onItemActualizadoRef.current = onItemActualizado;
    onAlertaEstadoRef.current    = onAlertaEstado;
  }, [onItemActualizado, onAlertaEstado]);

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
      transports:           ['websocket', 'polling'],
      auth:                 token ? { token } : undefined,
      reconnectionAttempts: 15,
      reconnectionDelay:    500,
      reconnectionDelayMax: 3000,
      timeout:              5000
    });

    socketRef.current = socket;

    const unirse = () => {
      socket.emit('inventario:join');
    };

    socket.on('connect',   unirse);
    socket.on('reconnect', unirse);

    // ── Stock actualizado (siempre que cambia el stock) ────────────────
    socket.on('inventario:item_actualizado', (payload) => {
      if (!payload?.itemId) return;
      onItemActualizadoRef.current?.(payload);
    });

    // ── Estado cambió (bajo/critico/agotado) → recarga alertas/resumen ─
    socket.on('inventario:alerta_estado', (payload) => {
      if (!payload?.itemId) return;
      onAlertaEstadoRef.current?.(payload);
    });

    socket.on('connect_error', (err) => {
      console.warn('[INVENTARIO SOCKET] Error conexión:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activo]);

  return socketRef;
}
