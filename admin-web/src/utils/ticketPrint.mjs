export const DEFAULT_PRINT = {
  paper: 80,
  showPrices: false,
  heading: 'COMANDA DE COCINA',
  footer: ''
};
export function printKey(user = {}) {
  const restaurant = String(user.sedeActivaId || user.restauranteId || '');
  if (!restaurant) return null;
  return 'comanda:print:v1:' + restaurant + ':' + String(user.id || '');
}
export function normalizePrint(value = {}) {
  return {
    paper: Number(value.paper) === 58 ? 58 : 80,
    showPrices: value.showPrices === true,
    heading: String(value.heading || DEFAULT_PRINT.heading).slice(0, 60),
    footer: String(value.footer || '').slice(0, 140)
  };
}
export function readPrint(user) {
  try {
    const key = printKey(user);
    return key ? normalizePrint(JSON.parse(localStorage.getItem(key) || '{}')) : {
      ...DEFAULT_PRINT
    };
  } catch {
    return {
      ...DEFAULT_PRINT
    };
  }
}
export function ticketOrders(grupo = {}) {
  const source = Array.isArray(grupo.pedidos) ? grupo.pedidos : grupo.items ? [grupo] : [];
  return source.filter(p => p.estado !== 'cancelado').map(p => ({
    id: String(p.numero || p.id || ''),
    estado: String(p.estado || ''),
    items: (Array.isArray(p.items) ? p.items : []).map(i => ({
      nombre: String(i.nombre || i.producto?.nombre || 'Producto'),
      cantidad: Number.isFinite(Number(i.cantidad)) ? Number(i.cantidad) : 0,
      precio: Number.isFinite(Number(i.precioUnitario ?? i.precio)) ? Number(i.precioUnitario ?? i.precio) : null,
      notas: [i.nota, i.instrucciones, ...(i.modificaciones || []).filter(v => typeof v === 'string'), ...(i.modificacionesDetalle || []).flatMap(g => (g.opciones || []).map(o => (o.tipo === 'remover' ? 'SIN ' : '') + String(o.nombre || '')))].filter(Boolean).map(String)
    })),
    nota: String(p.nota || p.observaciones || '')
  }));
}
