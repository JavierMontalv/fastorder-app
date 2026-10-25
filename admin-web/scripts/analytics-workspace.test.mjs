import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsDate, analyticsRange, analyticsRangeError, analyticsQuery, latestAnalyticsRequest } from '../src/utils/analyticsWorkspace.mjs';

test('analytics presets preserve the existing seven/thirty-day endpoint range in local calendar dates', () => {
  const now = new Date(2026, 9, 25, 23, 59);
  assert.equal(analyticsDate(now), '2026-10-25');
  assert.deepEqual(analyticsRange('7d', now), { presetRango: '7d', fechaInicio: '2026-10-18', fechaFin: '2026-10-25', rangoInvalido: false });
  assert.equal(analyticsRange('30d', now).fechaInicio, '2026-09-25');
  assert.equal(analyticsRange('7d', new Date(2024, 2, 1)).fechaInicio, '2024-02-23');
});
test('custom range rejects incomplete, impossible and reversed dates and accepts a same-day query', () => {
  for (const [start, end] of [['', '2026-10-25'], ['2026-10-25', ''], ['2026-02-30', '2026-03-01'], ['2026-10-26', '2026-10-25']]) assert.ok(analyticsRangeError(start, end));
  assert.equal(analyticsRangeError('2026-10-25', '2026-10-25'), '');
  assert.equal(analyticsRangeError('2024-02-29', '2024-03-01'), '');
});
test('commercial connector keeps filtro/desde/hasta contracts for every range', () => {
  assert.deepEqual(analyticsQuery({ presetRango: 'custom', fechaInicio: '2026-10-01', fechaFin: '2026-10-25' }), { filtro: 'rango', desde: '2026-10-01', hasta: '2026-10-25' });
  for (const presetRango of ['7d', '30d']) assert.deepEqual(analyticsQuery({ presetRango }), { filtro: presetRango, desde: undefined, hasta: undefined });
});
test('out-of-order analytics responses cannot replace a later selected range', async () => {
  const guard = latestAnalyticsRequest(), accepted = [];
  let resolveOld, resolveNew;
  const old = new Promise(resolve => { resolveOld = resolve; }), fresh = new Promise(resolve => { resolveNew = resolve; });
  const a = guard.begin(); const oldRead = old.then(value => { if (guard.isCurrent(a)) accepted.push(value); });
  const b = guard.begin(); const newRead = fresh.then(value => { if (guard.isCurrent(b)) accepted.push(value); });
  resolveNew('new-range'); await newRead; resolveOld('old-range'); await oldRead;
  assert.deepEqual(accepted, ['new-range']);
});
test('unmount/range invalidation prevents an abandoned inventory request from updating the view', () => {
  const guard = latestAnalyticsRequest(), pending = guard.begin();
  guard.invalidate(); assert.equal(guard.isCurrent(pending), false);
  const active = guard.begin(); assert.equal(guard.isCurrent(active), true);
});
