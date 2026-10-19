'use strict';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  ajustarStock as ajustarStockService,
  crearItemInventario,
  marcarAlertaLeida,
  obtenerAlertasInventario,
  obtenerItemsInventario,
  obtenerMovimientosInventario,
  obtenerRecomendacionesIA,
  obtenerResumenOperativo,
  resolverAlerta
} from '../services/inventarioService';

import { AuthContext } from '../context/AuthContext';
import useInventarioSocket from './useInventarioSocket';

export default function useInventario({ autoLoad = true, activo = true } = {}) {
  const { user } = useContext(AuthContext);
  const esAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';

  const [resumen,     setResumen]     = useState(null);
  const [alertas,     setAlertas]     = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [items,       setItems]       = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const [loading,            setLoading]            = useState(false);
  const [loadingItems,       setLoadingItems]       = useState(false);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [error,              setError]              = useState(null);

  const mountedRef  = useRef(false);
  const loadingRef  = useRef(false);

  // ── HTTP loaders ───────────────────────────────────────────────────

  const cargarInventario = useCallback(async () => {
    if (loadingRef.current || !activo) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const [resumenOperativo, alertasOperativas, recomendacionesIA] = await Promise.all([
        obtenerResumenOperativo(),
        obtenerAlertasInventario(),
        obtenerRecomendacionesIA()
      ]);

      if (!mountedRef.current) return;
      setResumen(resumenOperativo || null);
      setAlertas(Array.isArray(alertasOperativas) ? alertasOperativas : []);
      setRecomendaciones(Array.isArray(recomendacionesIA) ? recomendacionesIA : []);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Error cargando inventario');
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [activo]);

  const cargarItems = useCallback(async () => {
    if (!activo) return;
    try {
      setLoadingItems(true);
      const data = await obtenerItemsInventario();
      if (!mountedRef.current) return;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      if (!mountedRef.current) return;
      setItems([]);
    } finally {
      if (mountedRef.current) setLoadingItems(false);
    }
  }, [activo]);

  const cargarMovimientos = useCallback(async () => {
    if (!activo) return;
    try {
      setLoadingMovimientos(true);
      const data = await obtenerMovimientosInventario();
      if (!mountedRef.current) return;
      setMovimientos(Array.isArray(data) ? data : []);
    } catch {
      if (!mountedRef.current) return;
      setMovimientos([]);
    } finally {
      if (mountedRef.current) setLoadingMovimientos(false);
    }
  }, [activo]);

  // ── Socket handlers (quirúrgicos, sin refetch completo) ────────────

  // Cuando el backend confirma un cambio de stock: actualiza sólo ese item
  const onItemActualizado = useCallback((payload) => {
    if (!payload?.itemId || !mountedRef.current) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === payload.itemId
          ? {
              ...item,
              stockActual:  payload.stockActual  ?? item.stockActual,
              estadoStock:  payload.estadoNuevo  ?? item.estadoStock
            }
          : item
      )
    );
  }, []);

  // Cuando el estado del stock cambia (bajo/critico/agotado): recargar
  // KPIs y alertas (son ligeros — 2 queries) sin tocar la tabla
  const onAlertaEstado = useCallback(() => {
    if (!mountedRef.current) return;
    cargarInventario();
  }, [cargarInventario]);

  useInventarioSocket({
    activo: activo && esAdmin,
    onItemActualizado,
    onAlertaEstado
  });

  // ── Acciones ───────────────────────────────────────────────────────

  const ajustarStock = useCallback(
    async ({ itemId, tipo, cantidad, motivo }) => {
      if (!esAdmin || !itemId || !tipo || !cantidad) return;

      await ajustarStockService({ itemId, tipo, cantidad, motivo });

      // Socket actualizará el item en ~50ms; refrescamos movimientos y
      // resumen/alertas en paralelo. cargarItems() queda como fallback
      // por si el socket no está disponible en ese instante.
      await Promise.all([cargarItems(), cargarMovimientos(), cargarInventario()]);
    },
    [esAdmin, cargarInventario, cargarItems, cargarMovimientos]
  );

  const crearItem = useCallback(
    async (payload) => {
      if (!esAdmin) return null;
      const itemCreado = await crearItemInventario(payload);
      await Promise.all([cargarItems(), cargarInventario()]);
      return itemCreado;
    },
    [esAdmin, cargarInventario, cargarItems]
  );

  const resolverAlertaInventario = useCallback(
    async (alertaId) => {
      if (!alertaId || !esAdmin) return;
      await resolverAlerta(alertaId);
      await cargarInventario();
    },
    [esAdmin, cargarInventario]
  );

  const marcarAlertaLeidaInventario = useCallback(
    async (alertaId) => {
      if (!alertaId || !esAdmin) return;
      await marcarAlertaLeida(alertaId);
      await cargarInventario();
    },
    [esAdmin, cargarInventario]
  );

  // ── Auto-carga inicial ─────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    if (autoLoad && activo) {
      cargarInventario();
      cargarItems();
      cargarMovimientos();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [autoLoad, activo, cargarInventario, cargarItems, cargarMovimientos]);

  // ── Derived state ──────────────────────────────────────────────────

  const tieneAlertas        = alertas.length > 0;
  const tieneRecomendaciones = recomendaciones.length > 0;
  const estadoSaludable     = !tieneAlertas && !tieneRecomendaciones;

  return {
    resumen,
    alertas,
    recomendaciones,
    items,
    movimientos,
    loading,
    loadingItems,
    loadingMovimientos,
    error,
    cargarInventario,
    cargarItems,
    cargarMovimientos,
    ajustarStock,
    crearItem,
    resolverAlerta:    resolverAlertaInventario,
    marcarAlertaLeida: marcarAlertaLeidaInventario,
    puedeActuar:       esAdmin,
    tieneAlertas,
    tieneRecomendaciones,
    estadoSaludable
  };
}
