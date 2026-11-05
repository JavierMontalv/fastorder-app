import assert from 'node:assert/strict';
import test from 'node:test';
import { rangoMes, resumenGastos, toCsv } from '../src/utils/finops.mjs';

test('resumen de gastos separa fijos, variables y borradores', () => {
  assert.deepEqual(resumenGastos([
    { tipo: 'fijo', estado: 'pagado', monto: '100000' },
    { tipo: 'variable', estado: 'pagado', monto: '50000' },
    { tipo: 'fijo', estado: 'borrador', monto: '999999' }
  ]), { fijo: 100000, variable: 50000, total: 150000, borradores: 1 });
});

test('rango mensual respeta el ultimo dia real', () => {
  assert.deepEqual(rangoMes(new Date(2026, 1, 10)), { desde: '2026-02-01', hasta: '2026-02-28' });
});

test('CSV conserva acentos y escapa comillas', () => {
  const csv = toCsv([{ text: 'Nómina "equipo"' }], [{ label: 'Descripción', value: x => x.text }]);
  assert.ok(csv.startsWith('\ufeff'));
  assert.match(csv, /"Nómina ""equipo"""/);
});
