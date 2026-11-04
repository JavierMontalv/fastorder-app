import { createHash, timingSafeEqual } from 'node:crypto';

const hash = value => createHash('sha256').update(value, 'utf8').digest('hex');
const fail = () => { throw new Error('WOMPI_SANDBOX_VALIDATION_FAILED'); };
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 256;
const cents = value => Number.isSafeInteger(value) && value > 0;

export function sandboxConfig(env = process.env) {
  if (env.WOMPI_SANDBOX_ENABLED !== 'true') throw new Error('WOMPI_SANDBOX_DISABLED');
  const { WOMPI_SANDBOX_PUBLIC_KEY: publicKey, WOMPI_SANDBOX_INTEGRITY_SECRET: integritySecret,
    WOMPI_SANDBOX_EVENTS_SECRET: eventsSecret } = env;
  if (!publicKey?.startsWith('pub_test_') || !text(integritySecret) || !text(eventsSecret)) fail();
  return { publicKey, integritySecret, eventsSecret };
}

// Call only with a server-side persisted checkout, never amounts from req.body.
export function hostedCheckout(checkout, config, { redirectUrl, allowedOrigin }) {
  if (!config.publicKey?.startsWith('pub_test_') || !text(config.integritySecret)) fail();
  if (!text(checkout.reference) || !cents(checkout.amountInCents) || checkout.currency !== 'COP'
      || checkout.environment !== 'test') fail();
  const redirect = new URL(redirectUrl);
  if (redirect.protocol !== 'https:' || redirect.origin !== allowedOrigin || redirect.username || redirect.password) fail();
  const signature = hash(`${checkout.reference}${checkout.amountInCents}COP${config.integritySecret}`);
  const url = new URL('https://checkout.wompi.co/p/');
  url.search = new URLSearchParams({ 'public-key': config.publicKey, currency: 'COP',
    'amount-in-cents': String(checkout.amountInCents), reference: checkout.reference,
    'signature:integrity': signature, 'redirect-url': redirect.href }).toString();
  return url.href;
}

function property(data, path) {
  if (typeof path !== 'string' || path.length > 200) fail();
  const parts = path.split('.');
  let value = data;
  for (const part of parts) {
    if (!/^[a-zA-Z0-9_]+$/.test(part) || ['__proto__', 'constructor', 'prototype'].includes(part)
        || !value || !Object.hasOwn(value, part)) fail();
    value = value[part];
  }
  if (!['string', 'number', 'boolean'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) fail();
  return String(value);
}

export function verifyEvent(payload, eventsSecret, headerChecksum, now = Date.now()) {
  try {
    if (!text(eventsSecret) || payload?.environment !== 'test' || payload?.event !== 'transaction.updated') return false;
    if (!Number.isSafeInteger(payload.timestamp) || payload.timestamp <= 0 || payload.timestamp * 1000 > now + 300000) return false;
    // Old, valid events may be retries. Replay protection belongs in the DB transaction.
    const properties = payload.signature?.properties;
    if (!Array.isArray(properties) || properties.length < 1 || properties.length > 32) return false;
    const calculated = hash(properties.map(path => property(payload.data, path)).join('') + payload.timestamp + eventsSecret);
    const checksums = [payload.signature?.checksum, headerChecksum].filter(value => value !== undefined);
    return checksums.length > 0 && checksums.every(value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value)
      && timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(value, 'hex')));
  } catch { return false; }
}

// The provider lookup is mandatory: the signature's properties can vary and may
// not cover reference/currency. Never grant access from redirect or event alone.
export async function verifiedApprovedTransaction({ payload, config, checkout, fetchImpl = fetch }) {
  if (!verifyEvent(payload, config.eventsSecret) || !config.publicKey?.startsWith('pub_test_')) fail();
  const incoming = payload.data?.transaction;
  if (!text(incoming?.id) || !/^[a-zA-Z0-9_-]+$/.test(incoming.id)) fail();
  const response = await fetchImpl(`https://sandbox.wompi.co/v1/transactions/${encodeURIComponent(incoming.id)}`, {
    headers: { Authorization: `Bearer ${config.publicKey}` }, redirect: 'error', signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('WOMPI_LOOKUP_UNAVAILABLE');
  const transaction = (await response.json())?.data;
  if (checkout.environment !== 'test' || !cents(checkout.amountInCents) || checkout.currency !== 'COP'
      || !text(checkout.reference) || transaction?.id !== incoming.id || transaction.status !== 'APPROVED'
      || transaction.reference !== checkout.reference || transaction.currency !== checkout.currency
      || transaction.amount_in_cents !== checkout.amountInCents) fail();
  return { id: transaction.id, reference: transaction.reference, status: 'APPROVED',
    currency: 'COP', amountInCents: transaction.amount_in_cents, environment: 'test' };
}
