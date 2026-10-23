const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export function parseCopInput(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : 0;
  }

  const raw = String(value ?? '').trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d.,-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === ',') return 0;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  const separatorIndex = Math.max(lastDot, lastComma);

  if (separatorIndex === -1) {
    return Math.max(0, Math.round(Number(cleaned.replace(/\D/g, '')) || 0));
  }

  const integerPartRaw = cleaned.slice(0, separatorIndex);
  const decimalPartRaw = cleaned.slice(separatorIndex + 1);
  const hasBothSeparators = lastDot !== -1 && lastComma !== -1;
  const decimalDigitsOnly = decimalPartRaw.replace(/\D/g, '');
  const looksLikeThousandsWithExtraZero =
    decimalDigitsOnly.length > 3 && /^0+$/.test(decimalDigitsOnly.slice(1));
  const lastGroupLooksLikeThousands = decimalPartRaw.length === 3 && !hasBothSeparators;

  if (looksLikeThousandsWithExtraZero && !hasBothSeparators) {
    return Math.max(0, Math.round(Number(`${integerPartRaw.replace(/\D/g, '')}000`) || 0));
  }

  if (lastGroupLooksLikeThousands) {
    return Math.max(0, Math.round(Number(cleaned.replace(/\D/g, '')) || 0));
  }

  const integerDigits = integerPartRaw.replace(/\D/g, '') || '0';
  const decimalDigits = decimalPartRaw.replace(/\D/g, '');
  const normalized = decimalDigits ? `${integerDigits}.${decimalDigits}` : integerDigits;

  return Math.max(0, Math.round(Number(normalized) || 0));
}

export function formatCop(value) {
  return COP_FORMATTER.format(parseCopInput(value));
}

export function formatCopInput(value) {
  const amount = parseCopInput(value);
  return amount ? amount.toLocaleString('es-CO') : '';
}
