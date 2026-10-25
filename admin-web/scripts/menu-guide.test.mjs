import test from 'node:test';
import assert from 'node:assert/strict';
import { guideStorageKey, parseGuideProgress, readGuideProgress, saveGuideProgress, menuSetupSteps } from '../src/config/menuSetupGuide.mjs';

test('progress is isolated by user, restaurant and active branch', () => {
  const user = { id: 12, restauranteId: 1, sedeActivaId: 4 };
  const key = guideStorageKey(user);
  for (const change of [{ id: 13 }, { restauranteId: 2 }, { sedeActivaId: 5 }]) assert.notEqual(guideStorageKey({ ...user, ...change }), key);
});
test('corrupt and stale progress cannot complete unknown steps', () => {
  assert.deepEqual(parseGuideProgress('{invalid'), { dismissed: false, completed: [] });
  assert.deepEqual(parseGuideProgress('{"completed":"restaurant"}').completed, []);
  assert.deepEqual(parseGuideProgress('{"completed":["product","product","unknown"],"dismissed":true}'), { dismissed: true, completed: ['product'] });
});
test('storage failure never blocks the configuration guide', () => {
  const unavailable = { getItem() { throw Error('Unavailable'); }, setItem() { throw Error('Full'); } };
  assert.deepEqual(readGuideProgress(unavailable, 'key'), { dismissed: false, completed: [] });
  assert.equal(saveGuideProgress(unavailable, 'key', { completed: [] }), false);
});
test('saved progress resumes without marking unreviewed steps as complete', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
  saveGuideProgress(storage, 'key', { dismissed: true, completed: ['restaurant'] });
  assert.deepEqual(readGuideProgress(storage, 'key'), { dismissed: true, completed: ['restaurant'] });
  assert.equal(menuSetupSteps.find(step => !readGuideProgress(storage, 'key').completed.includes(step.id)).id, 'category');
});
test('the guide uses the functional category flow and existing QR controls', () => {
  assert.equal(menuSetupSteps.length, 4);
  assert.equal(menuSetupSteps[1].route, '/productos');
  assert.ok(menuSetupSteps.every(step => ['/configuracion', '/productos'].includes(step.route)));
  assert.match(menuSetupSteps[3].tasks.join(' '), /Abrir app.*Descargar PNG.*Copiar enlace.*Escanea/s);
});
