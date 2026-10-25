import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPromotions, promotionMediaKind, promotionFileError, promotionFormError, promotionDateInput, promotionDateLabel } from '../src/utils/promociones.mjs';

const form = { titulo: 'Menú del día', tipo: 'banner', prioridad: 7, colorPrincipal: '#315c43', fechaInicio: '', fechaFin: '', imagenUrl: '' };
test('campaign calendar dates do not shift to the previous day in Colombia', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/Bogota';
  try {
    assert.equal(promotionDateInput('2026-11-01T00:00:00.000Z'), '2026-11-01');
    assert.match(promotionDateLabel('2026-11-01'), /^01/);
    assert.match(promotionDateLabel('2026-11-01T00:00:00.000Z'), /^01/);
    assert.equal(promotionDateInput('2026-02-30'), '');
    assert.equal(promotionDateLabel('invalid'), 'Sin fecha');
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test('promotion filters combine channel, all five states and accent-insensitive search without mutating data', () => {
  const items = ['borrador', 'programada', 'activa', 'pausada', 'finalizada'].flatMap((estado, id) => [{ id, titulo: 'Menú especial', descripcion: 'Fresco', estado, tipo: 'banner' }, { id: id + 10, titulo: 'TV especial', estado, tipo: 'full' }]);
  assert.equal(filterPromotions(items).length, 10);
  for (const estado of ['borrador', 'programada', 'activa', 'pausada', 'finalizada']) {
    assert.equal(filterPromotions(items, { estado, canal: 'menu', query: 'menu' }).length, 1);
    assert.equal(filterPromotions(items, { estado, canal: 'tv' }).length, 1);
  }
  assert.equal(filterPromotions(items, { query: 'fresco' }).length, 5);
  assert.deepEqual(filterPromotions(items, { query: 'sin coincidencias' }), []);
  assert.equal(items.length, 10);
});
test('campaign validation accepts open-ended and same-day schedules and rejects reversed dates', () => {
  assert.equal(promotionFormError(form), '');
  assert.equal(promotionFormError({ ...form, fechaInicio: '2026-10-25', fechaFin: '2026-10-25' }), '');
  assert.match(promotionFormError({ ...form, fechaInicio: '2026-10-26', fechaFin: '2026-10-25' }), /fecha final/);
  assert.match(promotionFormError({ ...form, titulo: '   ' }), /título/);
});
test('priority and brand color must be valid before invoking the connector', () => {
  for (const prioridad of [0, 11, 2.5, 'no']) assert.match(promotionFormError({ ...form, prioridad }), /prioridad/);
  for (const prioridad of [1, 10, '5']) assert.equal(promotionFormError({ ...form, prioridad }), '');
  assert.match(promotionFormError({ ...form, colorPrincipal: 'rojo' }), /color/);
});
test('image and video upload boundaries preserve the existing 5 MB and 25 MB limits', () => {
  assert.equal(promotionFileError({ type: 'image/png', size: 5 * 1024 * 1024 }), '');
  assert.match(promotionFileError({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }), /5 MB/);
  for (const type of ['video/mp4', 'video/webm', 'video/quicktime']) assert.equal(promotionFileError({ type, size: 25 * 1024 * 1024 }), '');
  assert.match(promotionFileError({ type: 'video/mp4', size: 25 * 1024 * 1024 + 1 }), /25 MB/);
  assert.match(promotionFileError({ type: 'text/html', size: 50 }), /Solo puedes/);
});
test('videos stay in the TV channel for uploaded media and signed media URLs', () => {
  assert.equal(promotionMediaKind('https://cdn.example/spot.MP4?token=x#start'), 'video');
  assert.equal(promotionMediaKind('blob:preview'), 'unknown');
  assert.equal(promotionMediaKind(''), 'empty');
  const file = { type: 'video/mp4', size: 1024 };
  assert.match(promotionFormError(form, file), /Pantalla TV/);
  assert.equal(promotionFormError({ ...form, tipo: 'full' }, file), '');
  assert.match(promotionFormError({ ...form, imagenUrl: 'https://cdn.example/clip.webm?sig=x' }), /Pantalla TV/);
});
