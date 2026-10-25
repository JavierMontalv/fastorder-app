import { randomUUID } from 'node:crypto';

const secret = /password|passwd|secret|token|authorization|cookie|credential|tarjeta|cardnumber|cvv|email|telefono|direccion/i;
export function compact(value, depth = 0) {
  if (depth > 4) return '[resumen]';
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.slice(0, 300);
  if (Array.isArray(value)) return value.slice(0, 12).map(v => compact(v, depth + 1));
  if (typeof value !== 'object') return null;
  return Object.fromEntries(Object.entries(value).slice(0, 30).map(([k,v]) => [k, secret.test(k) ? '[protegido]' : compact(v, depth + 1)]));
}
export function boundedMetadata(value) {
  const safe = compact(value);
  if (Buffer.byteLength(JSON.stringify(safe)) <= 6000) return safe;
  return { tipo: 'operacion', detalle: 'Detalle excede el límite de almacenamiento', truncado: true,
    requestId: safe?.requestId, actor: safe?.actor, modulo: safe?.modulo, resultado: safe?.resultado };
}
export function requestContext(req) {
  return { requestId: randomUUID(), actor: { id: req.usuario?.id || 0, nombre: req.usuario?.nombre || 'Sistema', rol: req.usuario?.rol || 'sistema' } };
}
export function routeCategory(path = '') {
  if (/producto|categoria|plato|promocion|modificador/.test(path)) return 'catalog';
  if (/usuario|equipo/.test(path)) return 'team';
  if (/auth|login|acceso/.test(path)) return 'security';
  if (/pedido|pago|mesa|reserva|display|ticket/.test(path)) return 'orders';
  return 'settings';
}
export function shouldCapture(req) {
  return ['POST','PUT','PATCH','DELETE'].includes(req.method) && Boolean(req.usuario?.restauranteId)
    && !/\/auditoria(?:\/|$)/.test(req.originalUrl || '');
}
export function parseQuery(query = {}, now = new Date()) {
  const limit = 30;
  const days = Number(query.days || 7);
  if (![1,7,30,90].includes(days)) throw new Error('Periodo inválido');
  const cursor = query.cursor == null ? null : String(query.cursor);
  if (cursor && !/^[1-9]\d{0,19}$/.test(cursor)) throw new Error('Cursor inválido');
  const since = new Date(now.getTime() - days * 86400000);
  return { limit, cursor, since };
}
