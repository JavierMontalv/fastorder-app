import test from 'node:test';
import assert from 'node:assert/strict';
import { agruparPedidosPorMesa, filtrarPedidosPorSesionMesa } from '../src/utils/pedidos.js';

test('una mesa ocupada solo suma tickets de la sesion vigente', () => {
  const mesas = [{ id: 30, estado: 'ocupada', ocupadaDesde: '2026-11-04T20:29:26.000Z' }];
  const pedidos = [
    { id: 18, mesaId: 30, total: 812400, estado: 'entregado', createdAt: '2026-04-12T01:23:16.000Z', items: [{ cantidad: 31, subtotal: 812400 }] },
    { id: 66, mesaId: 30, total: 4500, estado: 'pendiente', createdAt: '2026-11-04T20:29:26.000Z', items: [{ cantidad: 1, subtotal: 4500 }] }
  ];

  const filtrados = filtrarPedidosPorSesionMesa(pedidos, mesas);
  const [grupo] = agruparPedidosPorMesa(filtrados);

  assert.deepEqual(filtrados.map((pedido) => pedido.id), [66]);
  assert.equal(grupo.total, 4500);
  assert.equal(grupo.totalItems, 1);
  assert.equal(grupo.cantidadPedidos, 1);
});

test('conserva pedidos sin mesa y el historial de mesas no ocupadas', () => {
  const pedidos = [
    { id: 1, mesaId: null, total: 1000, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 2, mesaId: 31, total: 2000, createdAt: '2026-01-01T00:00:00.000Z' }
  ];
  const filtrados = filtrarPedidosPorSesionMesa(pedidos, [{ id: 31, estado: 'disponible', ocupadaDesde: null }]);
  assert.deepEqual(filtrados.map((pedido) => pedido.id), [1, 2]);
});
