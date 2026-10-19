export const PEDIDOS_REALTIME_EVENTS = {
  nuevo: 'comanda:pedido-nuevo',
  actualizado: 'comanda:pedido-actualizado',
  eliminado: 'comanda:pedido-eliminado',
  sonido: 'comanda:pedido-sonido',
  grupoCreado: 'comanda:mesas-grupo-creado',
  grupoDisuelto: 'comanda:mesas-grupo-disuelto',
  grupoActualizado: 'comanda:mesas-grupo-actualizado',
  mesasSync: 'comanda:mesas-sync',
  syncSolicitado: 'comanda:pedidos-sync-solicitado'
};

function emitirEvento(nombre, detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(nombre, { detail }));
}

export function emitirPedidoNuevo(pedido) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.nuevo, pedido);
}

export function emitirPedidoActualizado(pedido) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.actualizado, pedido);
}

export function emitirPedidoEliminado(idPedido) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.eliminado, idPedido);
}

export function emitirPreferenciaSonidoPedidos(activo) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.sonido, Boolean(activo));
}

export function emitirGrupoCreado(payload) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.grupoCreado, payload);
}

export function emitirGrupoDisuelto(payload) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.grupoDisuelto, payload);
}

export function emitirGrupoActualizado(payload) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.grupoActualizado, payload);
}

export function emitirMesasSync(detail = null) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.mesasSync, detail);
}

export function emitirSyncPedidosSolicitado(detail = null) {
  emitirEvento(PEDIDOS_REALTIME_EVENTS.syncSolicitado, detail);
}
