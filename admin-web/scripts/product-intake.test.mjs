import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { applyIntakeSuggestions, intakeError } from '../src/utils/productIntake.mjs';
import { validateIntake, normalizeIntakeOutput } from '../../infra/aws/menu-intake-backend/services/productIntakeSchema.mjs';

test('suggestions never change the merchant price or confirmed products', () => {
  const rows = [{ id: 'a', nombre: 'Bowl', descripcion: '', precio: '25000', categoriaId: '1', status: 'draft' }, { id: 'b', nombre: 'Guardado', precio: '10000', status: 'saved' }];
  const result = applyIntakeSuggestions(rows, [{ id: 'a', nombre: 'Bowl fresco', precio: 1, descripcion: 'Fresco', categoriaId: 2 }, { id: 'b', nombre: 'No cambiar' }]);
  assert.equal(result[0].precio, '25000'); assert.equal(result[1].nombre, 'Guardado');
  assert.notEqual(intakeError({ nombre: 'Bowl', precio: '', categoriaId: 1 }), '');
});
test('intake rejects oversized batches, remote photos and duplicate identifiers', () => {
  assert.throws(() => validateIntake({ items: Array.from({ length: 5 }, (_, i) => ({ id: String(i), nombre: 'Bowl' })) }));
  assert.throws(() => validateIntake({ items: [{ id: 'a', photo: 'https://example.com/a.jpg' }] }));
  assert.throws(() => validateIntake({ items: [{ id: 'a', nombre: 'A' }, { id: 'a', nombre: 'B' }] }));
});
test('provider results cannot add products, prices or foreign tenant categories', () => {
  const result = normalizeIntakeOutput(JSON.stringify({ items: [{ id: 'a', nombre: 'Bowl', precio: 123, categoriaId: 99 }, { id: 'extra', nombre: 'Inventado' }] }), [{ id: 'a', nombre: 'Original' }], [{ id: 1, nombre: 'Platos' }]);
  assert.equal(result.length, 1); assert.equal(result[0].categoriaId, null); assert.equal('precio' in result[0], false);
  assert.throws(() => normalizeIntakeOutput('{"items":[]}', [{ id: 'a' }], []));
});
test('the published sound has a valid PCM header and the manifest stays on its host', async () => {
  const manifest = JSON.parse(await fs.readFile('public/site.webmanifest', 'utf8'));
  assert.equal(manifest.start_url, '/');
  const wave = await fs.readFile('public/sounds/new-order.wav');
  assert.equal(wave.toString('ascii', 0, 4), 'RIFF'); assert.equal(wave.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wave.readUInt32LE(40), wave.length - 44);
});
