const PRODUCTION_API_ORIGIN = 'https://api.somoscomanda.com';
const FALLBACK_API_BASE_URL = import.meta.env.PROD
  ? `${PRODUCTION_API_ORIGIN}/api`
  : '/api';
const FALLBACK_ASSETS_BASE_URL = import.meta.env.PROD ? PRODUCTION_API_ORIGIN : '';

function normalizeBaseUrl(value, fallback) {
  const normalized = `${value ?? ''}`.trim();
  if (!normalized) return fallback;
  return normalized.replace(/\/+$/, '');
}

function stripApiSuffix(value) {
  return value.replace(/\/api$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL,
  FALLBACK_API_BASE_URL
);

export const ASSETS_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_ASSETS_URL,
  stripApiSuffix(API_BASE_URL) || FALLBACK_ASSETS_BASE_URL
);

export const SOCKET_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_SOCKET_URL,
  stripApiSuffix(API_BASE_URL)
);

export function buildAssetUrl(path = '') {
  const rawValue = `${path ?? ''}`.trim();
  if (!rawValue) return ASSETS_BASE_URL || '/';

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue.replace(/^http:\/\//i, 'https://');
  }

  const sanitizedPath = rawValue.replace(/^\/+/, '');
  if (!ASSETS_BASE_URL) return `/${sanitizedPath}`;
  return `${ASSETS_BASE_URL}/${sanitizedPath}`;
}

export function normalizeAssetUrl(value = '') {
  const rawValue = `${value ?? ''}`.trim();
  if (!rawValue) return '';

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue.replace(/^http:\/\//i, 'https://');
  }

  const normalizedPath = rawValue.includes('/')
    ? rawValue
    : `/uploads/productos/${rawValue}`;

  return buildAssetUrl(normalizedPath);
}
