const ESTADOS_LABEL = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  preparacion: 'En preparacion',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  pendiente_pago: 'Pendiente de pago'
};

const PAGOS_LABEL = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  aprobado: 'Pagado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  caja: 'Pago en caja'
};

const METODOS_PAGO_LABEL = {
  caja: 'Pago en caja',
  efectivo: 'Efectivo',
  cash: 'Efectivo',
  pse: 'PSE',
  pce: 'PCE',
  tarjeta: 'Tarjeta',
  online: 'Pago online',
  transferencia: 'Transferencia'
};

export const ESTADOS_PEDIDO_ABIERTO = ['pendiente', 'aceptado', 'preparacion', 'listo'];
export const ESTADOS_PEDIDO_CERRADO = ['entregado', 'cancelado'];

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizarTexto(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function normalizarEstado(value) {
  const estado = normalizarTexto(value || 'pendiente').toLowerCase();
  if (estado === 'en_preparacion' || estado === 'preparando') return 'preparacion';
  if (estado === 'preparado') return 'listo';
  return estado || 'pendiente';
}

function normalizarEstadoPago(value) {
  return normalizarTexto(value || 'pendiente').toLowerCase();
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function formatCurrency(value = 0) {
  const amount = toNumber(value);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount);
}

export function formatEstadoPedido(estado = 'pendiente') {
  const key = normalizarEstado(estado);
  return ESTADOS_LABEL[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatEstadoPago(estado = 'pendiente') {
  const key = normalizarEstadoPago(estado);
  return PAGOS_LABEL[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatMetodoPago(metodo = 'caja') {
  const key = normalizarTexto(metodo || 'caja').toLowerCase();
  return METODOS_PAGO_LABEL[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatTiempoTranscurrido(value) {
  const date = formatDate(value);
  if (!date) return 'Sin fecha';

  const diffMs = Math.max(Date.now() - date.getTime(), 0);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest} min` : `${hours}h`;
}

export function pedidoEstaCerrado(pedido = {}) {
  return ESTADOS_PEDIDO_CERRADO.includes(normalizarEstado(pedido.estado));
}

export function pedidoEstaActivo(pedido = {}) {
  return ESTADOS_PEDIDO_ABIERTO.includes(normalizarEstado(pedido.estado));
}

export function pedidoPagoPendienteOperativo(pedido = {}) {
  const estadoPago = normalizarEstadoPago(pedido.estadoPago || pedido.estado_pago);
  const metodoPago = normalizarTexto(pedido.metodoPago || pedido.metodo_pago || 'caja').toLowerCase();
  return !pedidoEstaCerrado(pedido) && ['caja', 'efectivo', 'cash'].includes(metodoPago) && !['pagado', 'aprobado'].includes(estadoPago);
}

export function pedidoTieneAccionPendiente(pedido = {}) {
  const estado = normalizarEstado(pedido.estado);
  return ['pendiente', 'listo'].includes(estado) || pedidoPagoPendienteOperativo(pedido);
}

export function obtenerMetodoPagoParaCaja(pedido = {}) {
  const metodo = normalizarTexto(pedido.metodoPago || pedido.metodo_pago || 'caja').toLowerCase();
  return ['caja', 'efectivo', 'cash'].includes(metodo) ? 'efectivo' : metodo;
}

export function obtenerAccionPrimariaPedido(pedido = {}) {
  const estado = normalizarEstado(pedido.estado);
  if (estado === 'pendiente') return { estado: 'aceptado', next: 'aceptado', label: 'Aceptar pedido' };
  if (estado === 'aceptado') return { estado: 'preparacion', next: 'preparacion', label: 'Enviar a preparacion' };
  if (estado === 'preparacion') return { estado: 'listo', next: 'listo', label: 'Marcar listo' };
  if (estado === 'listo') return { estado: 'entregado', next: 'entregado', label: 'Entregar pedido' };
  return null;
}

export function obtenerEtiquetaMesa(grupo = {}) {
  if (grupo?.mesaLabel) return grupo.mesaLabel;
  if (grupo?.mesaNumero) return `Mesa ${grupo.mesaNumero}`;
  if (grupo?.pedidoPrincipal?.mesaLabel) return grupo.pedidoPrincipal.mesaLabel;
  if (grupo?.pedidoPrincipal?.mesa?.numero) return `Mesa ${grupo.pedidoPrincipal.mesa.numero}`;
  return 'Sin mesa';
}

function normalizarOpcionDetalle(opcion = {}) {
  if (typeof opcion === 'string') {
    return { id: opcion, nombre: opcion, precioExtra: 0, tipo: 'eleccion' };
  }

  const precioExtra = toNumber(opcion.precioExtra ?? opcion.precio ?? opcion.valor ?? opcion.precioAdicional);
  const tipoRaw = normalizarTexto(opcion.tipo || opcion.tipoOpcion || opcion.accion || '').toLowerCase();
  const nombre = normalizarTexto(opcion.nombre || opcion.label || opcion.titulo || opcion.opcionNombre);
  let tipo = tipoRaw || 'eleccion';

  if (tipoRaw.includes('remov') || tipoRaw.includes('quitar') || nombre.toLowerCase().startsWith('sin ')) {
    tipo = 'remover';
  } else if (tipoRaw.includes('extra') || tipoRaw.includes('adicion') || precioExtra > 0) {
    tipo = 'extra';
  }

  return {
    ...opcion,
    id: opcion.id ?? opcion.opcionId ?? nombre,
    nombre,
    precioExtra,
    tipo
  };
}

function normalizarGrupoDetalle(grupo = {}) {
  if (typeof grupo === 'string') {
    return {
      id: grupo,
      nombre: 'Personalizacion',
      tipoSeleccion: 'multiple',
      opciones: [normalizarOpcionDetalle(grupo)]
    };
  }

  const opciones = Array.isArray(grupo.opciones)
    ? grupo.opciones
    : Array.isArray(grupo.items)
      ? grupo.items
      : Array.isArray(grupo.selecciones)
        ? grupo.selecciones
        : [];

  return {
    ...grupo,
    id: grupo.id ?? grupo.grupoId ?? grupo.nombre,
    nombre: normalizarTexto(grupo.nombre || grupo.titulo || grupo.grupoNombre || 'Personalizacion'),
    tipoSeleccion: normalizarTexto(grupo.tipoSeleccion || grupo.tipo || 'multiple').toLowerCase(),
    opciones: opciones.map(normalizarOpcionDetalle).filter((opcion) => opcion.nombre)
  };
}

function normalizarModificacionesDetalle(item = {}) {
  const grupos = Array.isArray(item.modificacionesDetalle)
    ? item.modificacionesDetalle
    : Array.isArray(item.personalizaciones)
      ? item.personalizaciones
      : Array.isArray(item.modificadores)
        ? item.modificadores
        : [];

  const normalizados = grupos.map(normalizarGrupoDetalle).filter((grupo) => grupo.opciones.length > 0);

  if (normalizados.length === 0 && Array.isArray(item.modificaciones)) {
    normalizados.push(
      ...item.modificaciones
        .map(normalizarGrupoDetalle)
        .filter((grupo) => grupo.opciones.length > 0)
    );
  }

  const nota = normalizarTexto(item.instrucciones || item.nota);
  if (nota) {
    normalizados.push({
      id: 'instrucciones',
      nombre: 'Nota para cocina',
      tipoSeleccion: 'texto',
      opciones: [{ id: 'nota', nombre: nota, precioExtra: 0, tipo: 'instruccion' }]
    });
  }

  return normalizados;
}

function normalizarItemPedido(item = {}) {
  const producto = item.producto || item.Producto || {};
  const nombre = normalizarTexto(item.nombre || item.nombreProducto || producto.nombre || 'Producto');
  const cantidad = Math.max(1, toNumber(item.cantidad, 1));
  const precioUnitario = toNumber(item.precioUnitario ?? item.precio ?? producto.precio);
  const subtotal = toNumber(item.subtotal ?? item.totalItem ?? item.total, precioUnitario * cantidad);

  return {
    ...item,
    id: item.id ?? item.pedidoItemId ?? item.productoId ?? producto.id ?? nombre,
    productoId: item.productoId ?? producto.id ?? null,
    nombre,
    nombreProducto: nombre,
    cantidad,
    precioUnitario,
    subtotal,
    totalItem: subtotal,
    modificacionesDetalle: normalizarModificacionesDetalle(item),
    modificaciones: Array.isArray(item.modificaciones) ? item.modificaciones : [],
    instrucciones: normalizarTexto(item.instrucciones || item.nota)
  };
}

function obtenerMesaLabel(pedido = {}) {
  const mesa = pedido.mesa || pedido.Mesa || {};
  const mesaNumero = pedido.mesaNumero || mesa.numero;
  if (pedido.mesaLabel) return pedido.mesaLabel;
  if (mesaNumero) return `Mesa ${mesaNumero}`;
  if (pedido.tipoPedido === 'mesa') return 'Mesa';
  return 'Sin mesa';
}

export function normalizarPedidoBackend(pedido = {}) {
  const itemsRaw = Array.isArray(pedido.items)
    ? pedido.items
    : Array.isArray(pedido.PedidoItems)
      ? pedido.PedidoItems
      : Array.isArray(pedido.detalle)
        ? pedido.detalle
        : [];

  const items = itemsRaw.map(normalizarItemPedido);
  const totalItems = items.reduce((sum, item) => sum + toNumber(item.cantidad), 0);
  const totalCalculado = items.reduce((sum, item) => sum + toNumber(item.subtotal ?? item.totalItem), 0);
  const mesa = pedido.mesa || pedido.Mesa || {};
  const estado = normalizarEstado(pedido.estado);
  const metodoPago = normalizarTexto(pedido.metodoPago || pedido.metodo_pago || 'caja').toLowerCase();
  const estadoPago = normalizarEstadoPago(pedido.estadoPago || pedido.estado_pago);

  return {
    ...pedido,
    id: pedido.id ?? pedido.pedidoId ?? pedido.numero,
    numero: pedido.numero ?? pedido.id,
    estado,
    estadoPago,
    metodoPago,
    clienteNombre: normalizarTexto(pedido.clienteNombre || pedido.cliente || pedido.nombreCliente || mesa.nombre || ''),
    mesaId: pedido.mesaId ?? mesa.id ?? null,
    mesaNumero: pedido.mesaNumero ?? mesa.numero ?? null,
    mesaLabel: obtenerMesaLabel(pedido),
    mesa,
    items,
    totalItems: toNumber(pedido.totalItems, totalItems),
    total: toNumber(pedido.total ?? pedido.totalPedido ?? pedido.valorTotal, totalCalculado),
    subtotal: toNumber(pedido.subtotal, totalCalculado),
    propina: toNumber(pedido.propina),
    createdAt: pedido.createdAt || pedido.fechaCreacion || pedido.fecha || new Date().toISOString(),
    updatedAt: pedido.updatedAt || pedido.fechaActualizacion || pedido.createdAt || new Date().toISOString(),
    tiempoTexto: formatTiempoTranscurrido(pedido.createdAt || pedido.fechaCreacion || pedido.fecha)
  };
}

function obtenerPrioridadEstado(estado) {
  const orden = {
    pendiente: 5,
    aceptado: 4,
    preparacion: 3,
    listo: 2,
    pendiente_pago: 1,
    entregado: 0,
    cancelado: -1
  };
  return orden[normalizarEstado(estado)] ?? 0;
}

function resumirItems(pedidos = []) {
  const map = new Map();

  pedidos.forEach((pedido) => {
    pedido.items.forEach((item) => {
      const key = item.productoId || item.nombre;
      const prev = map.get(key) || { nombre: item.nombre, cantidad: 0, total: 0 };
      prev.cantidad += toNumber(item.cantidad);
      prev.total += toNumber(item.subtotal ?? item.totalItem);
      map.set(key, prev);
    });
  });

  return [...map.values()].sort((a, b) => b.cantidad - a.cantidad);
}

function crearGrupoMesa(key, pedido) {
  const mesa = pedido.mesa || {};
  return {
    id: key,
    mesaId: pedido.mesaId,
    mesaNumero: pedido.mesaNumero,
    mesaLabel: pedido.mesaLabel,
    mesaNombre: mesa.nombre || '',
    mesaCapacidad: toNumber(mesa.capacidad),
    mesaEstado: mesa.estado || (pedido.mesaId ? 'ocupada' : 'sin_mesa'),
    clienteNombre: pedido.clienteNombre,
    pedidos: [],
    total: 0,
    totalItems: 0,
    pagosPendientes: 0,
    cantidadPedidos: 0,
    pedidoPrincipal: null,
    tiempoTexto: pedido.tiempoTexto,
    estadoDominante: pedido.estado,
    resumenItems: [],
    tieneAccionPendiente: false,
    pedidosActivos: 0
  };
}

export function agruparPedidosPorMesa(pedidos = []) {
  const grupos = new Map();
  const normalizados = pedidos.map(normalizarPedidoBackend);

  normalizados.forEach((pedido) => {
    const key = pedido.mesaId ? `mesa-${pedido.mesaId}` : `pedido-${pedido.id}`;
    if (!grupos.has(key)) grupos.set(key, crearGrupoMesa(key, pedido));

    const grupo = grupos.get(key);
    grupo.pedidos.push(pedido);
    grupo.total += toNumber(pedido.total);
    grupo.totalItems += toNumber(pedido.totalItems);
    grupo.pagosPendientes += pedidoPagoPendienteOperativo(pedido) ? 1 : 0;
    grupo.cantidadPedidos += 1;
    grupo.pedidosActivos += pedidoEstaActivo(pedido) ? 1 : 0;
    grupo.tieneAccionPendiente = grupo.tieneAccionPendiente || pedidoTieneAccionPendiente(pedido);

    if (!grupo.pedidoPrincipal || obtenerPrioridadEstado(pedido.estado) > obtenerPrioridadEstado(grupo.pedidoPrincipal.estado)) {
      grupo.pedidoPrincipal = pedido;
      grupo.estadoDominante = pedido.estado;
      grupo.tiempoTexto = pedido.tiempoTexto;
    }
  });

  return [...grupos.values()].map((grupo) => ({
    ...grupo,
    resumenItems: resumirItems(grupo.pedidos),
    total: Math.round(grupo.total)
  }));
}
