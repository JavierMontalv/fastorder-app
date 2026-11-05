import api from '../api/api';
import { obtenerRecomendacionesIA as obtenerRecomendacionesIAAnalitica } from './inventarioAnaliticaService';

export async function obtenerResumenOperativo() {
  const { data } = await api.get('/inventario/resumen-operativo');
  return data?.data || null;
}

export async function obtenerItemsInventario() {
  const { data } = await api.get('/inventario/items');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function crearItemInventario(payload) {
  const { data } = await api.post('/inventario/items', payload);
  return data?.data || null;
}

export async function actualizarItemInventario(itemId, payload) {
  const { data } = await api.put(`/inventario/items/${itemId}`, payload);
  return data?.data || null;
}

export async function obtenerEntradasMercancia() {
  const { data } = await api.get('/inventario/entradas');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function crearEntradaMercancia(payload) {
  const { data } = await api.post('/inventario/entradas', payload);
  return data?.data || null;
}

export async function obtenerTransformaciones() {
  const { data } = await api.get('/inventario/transformaciones');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function crearTransformacion(payload) {
  const { data } = await api.post('/inventario/transformaciones', payload);
  return data?.data || null;
}

export async function ajustarStock(itemIdOrPayload, tipo, cantidad, motivo = '') {
  const entrada =
    typeof itemIdOrPayload === 'object' && itemIdOrPayload !== null
      ? itemIdOrPayload
      : { itemId: itemIdOrPayload, tipo, cantidad, motivo };

  const {
    itemId,
    tipo: tipoAjuste,
    cantidad: cantidadAjuste,
    motivo: motivoAjuste = ''
  } = entrada;

  if (!itemId) throw new Error('itemId es obligatorio');
  if (!tipoAjuste) throw new Error('tipo de ajuste es obligatorio');
  if (!cantidadAjuste || Number(cantidadAjuste) <= 0) throw new Error('cantidad invalida');

  const payload = {
    tipo: tipoAjuste,
    cantidad: cantidadAjuste,
    motivo: motivoAjuste
  };

  const { data } = await api.patch(`/inventario/items/${itemId}/stock`, payload);
  return data?.data || null;
}

export async function obtenerAlertasInventario() {
  const { data } = await api.get('/inventario/alertas');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function obtenerMovimientosInventario(limit = 20) {
  const { data } = await api.get(`/inventario/movimientos?limit=${limit}`);
  return Array.isArray(data?.data) ? data.data : [];
}

export async function obtenerRecomendacionesIA() {
  try {
    const resultado = await obtenerRecomendacionesIAAnalitica();
    return Array.isArray(resultado) ? resultado : [];
  } catch {
    return [];
  }
}

export async function obtenerProductosParaReceta() {
  const { data } = await api.get('/inventario/productos');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function obtenerRecetaProducto(productoId) {
  const { data } = await api.get(`/inventario/productos/${productoId}/receta`);
  return data?.data || { receta: [], costoEstimado: 0 };
}

export async function guardarRecetaProducto(productoId, ingredientes) {
  const { data } = await api.put(`/inventario/productos/${productoId}/receta`, { ingredientes });
  return data?.data || null;
}

export async function resolverAlerta(alertaId) {
  if (!alertaId) throw new Error('ID de alerta invalido');
  const { data } = await api.patch(`/inventario/alertas/${alertaId}/resolver`);
  return data?.data || null;
}

export async function marcarAlertaLeida(alertaId) {
  if (!alertaId) throw new Error('ID de alerta invalido');
  const { data } = await api.patch(`/inventario/alertas/${alertaId}/leida`);
  return data?.data || null;
}

export default {
  obtenerResumenOperativo,
  obtenerItemsInventario,
  crearItemInventario,
  actualizarItemInventario,
  obtenerEntradasMercancia,
  crearEntradaMercancia,
  obtenerTransformaciones,
  crearTransformacion,
  ajustarStock,
  obtenerAlertasInventario,
  obtenerMovimientosInventario,
  obtenerRecomendacionesIA,
  obtenerProductosParaReceta,
  obtenerRecetaProducto,
  guardarRecetaProducto,
  resolverAlerta,
  marcarAlertaLeida
};
