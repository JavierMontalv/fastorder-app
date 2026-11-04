import test from 'node:test';
import assert from 'node:assert/strict';
import { printKey, normalizePrint, ticketOrders } from '../src/utils/ticketPrint.mjs';
test('print settings never share tenant or user keys', () => {
  assert.notEqual(printKey({
    id: 1,
    restauranteId: 7
  }), printKey({
    id: 1,
    restauranteId: 8
  }));
  assert.notEqual(printKey({
    id: 1,
    restauranteId: 7
  }), printKey({
    id: 2,
    restauranteId: 7
  }));
  assert.equal(printKey({}), null);
  assert.equal(normalizePrint({
    paper: 'bad'
  }).paper, 80);
  assert.equal(normalizePrint({
    paper: 58
  }).paper, 58);
});
test('ticket preserves quantities, removed ingredients and instructions; excludes cancelled orders', () => {
  const d = ticketOrders({
    pedidos: [{
      id: 1,
      estado: 'pendiente',
      items: [{
        nombre: 'Hamburguesa',
        cantidad: 2,
        nota: 'Sin sal',
        modificacionesDetalle: [{
          opciones: [{
            tipo: 'remover',
            nombre: 'Cebolla'
          }]
        }]
      }]
    }, {
      id: 2,
      estado: 'cancelado',
      items: []
    }]
  });
  assert.equal(d.length, 1);
  assert.equal(d[0].items[0].cantidad, 2);
  assert.deepEqual(d[0].items[0].notas, ['Sin sal', 'SIN Cebolla']);
});
