import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sandboxConfig, hostedCheckout, verifyEvent, verifiedApprovedTransaction } from './wompi.mjs';

const config = { publicKey: 'pub_test_fixture', integritySecret: 'test_integrity_fixture', eventsSecret: 'test_events_fixture' };
const checkout = { reference: 'PLAN-test-unique', amountInCents: 2990000, currency: 'COP', environment: 'test' };
const tx = { id: 'test-123', status: 'APPROVED', reference: checkout.reference, amount_in_cents: checkout.amountInCents, currency: 'COP' };
function event(transaction = tx) {
  const payload = { event: 'transaction.updated', environment: 'test', timestamp: 1700000000,
    data: { transaction: { ...transaction } }, signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'] } };
  payload.signature.checksum = createHash('sha256').update(`${transaction.id}${transaction.status}${transaction.amount_in_cents}${payload.timestamp}${config.eventsSecret}`).digest('hex');
  return payload;
}
const response = data => async () => ({ ok: true, json: async () => ({ data }) });
test('disabled by default and rejects production key', () => {
  assert.throws(() => sandboxConfig({}), /DISABLED/);
  assert.throws(() => sandboxConfig({ WOMPI_SANDBOX_ENABLED: 'true', WOMPI_SANDBOX_PUBLIC_KEY: 'pub_prod_fixture' }));
});
test('hosted checkout signs server snapshot; no secret appears in URL', () => {
  const url = new URL(hostedCheckout(checkout, config, { redirectUrl: 'https://admin.somoscomanda.com/checkout', allowedOrigin: 'https://admin.somoscomanda.com' }));
  assert.equal(url.hostname, 'checkout.wompi.co');
  assert.equal(url.searchParams.get('amount-in-cents'), '2990000');
  assert.equal(url.searchParams.get('signature:integrity'), createHash('sha256').update('PLAN-test-unique2990000COPtest_integrity_fixture').digest('hex'));
  assert.ok(!url.href.includes(config.integritySecret));
});
test('rejects external redirects, non-integer amounts and wrong environment', () => {
  for (const altered of [{ amountInCents: -1 }, { amountInCents: 29.9 }, { currency: 'USD' }, { environment: 'prod' }]) {
    assert.throws(() => hostedCheckout({ ...checkout, ...altered }, config, { redirectUrl: 'https://admin.somoscomanda.com/checkout', allowedOrigin: 'https://admin.somoscomanda.com' }));
  }
  assert.throws(() => hostedCheckout(checkout, config, { redirectUrl: 'https://attacker.invalid', allowedOrigin: 'https://admin.somoscomanda.com' }));
});
test('documented SHA256 accepts retries and uppercase checksum', () => {
  const payload = event(); payload.signature.checksum = payload.signature.checksum.toUpperCase();
  assert.equal(verifyEvent(payload, config.eventsSecret), true);
});
test('tampered event, environment, checksum header and prototype paths fail', () => {
  for (const mutate of [p => p.data.transaction.amount_in_cents++, p => p.environment = 'prod',
    p => p.signature.properties = ['constructor.name'], p => p.signature.checksum = 'bad', p => p.timestamp = 9999999999999]) {
    const payload = event(); mutate(payload); assert.equal(verifyEvent(payload, config.eventsSecret), false);
  }
  assert.equal(verifyEvent(event(), config.eventsSecret, '0'.repeat(64)), false);
});
test('independent provider lookup confirms reference, status, amount and currency', async () => {
  assert.equal((await verifiedApprovedTransaction({ payload: event(), config, checkout, fetchImpl: response(tx) })).status, 'APPROVED');
  for (const altered of [{ id: 'other' }, { status: 'PENDING' }, { status: 'DECLINED' }, { amount_in_cents: 100 }, { currency: 'USD' }, { reference: 'other-tenant' }]) {
    await assert.rejects(verifiedApprovedTransaction({ payload: event(), config, checkout, fetchImpl: response({ ...tx, ...altered }) }));
  }
});
test('unsigned reference tampering cannot grant another checkout', async () => {
  const payload = event(); payload.data.transaction.reference = 'other';
  assert.equal(verifyEvent(payload, config.eventsSecret), true);
  await assert.rejects(verifiedApprovedTransaction({ payload, config, checkout: { ...checkout, reference: 'other' }, fetchImpl: response(tx) }));
});
test('provider outage fails closed and invalid signatures never call provider', async () => {
  await assert.rejects(verifiedApprovedTransaction({ payload: event(), config, checkout, fetchImpl: async () => ({ ok: false }) }), /UNAVAILABLE/);
  let called = false; const payload = event(); payload.signature.checksum = '0'.repeat(64);
  await assert.rejects(verifiedApprovedTransaction({ payload, config, checkout, fetchImpl: async () => { called = true; } }));
  assert.equal(called, false);
});
