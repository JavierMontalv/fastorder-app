export function analyticsDate(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function analyticsRange(preset = '7d', now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - (preset === '30d' ? 30 : 7));
  return { presetRango: preset, fechaInicio: analyticsDate(start), fechaFin: analyticsDate(now), rangoInvalido: false };
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && analyticsDate(date) === value;
}

export function analyticsRangeError(start, end) {
  if (!validDate(start) || !validDate(end)) return 'Selecciona una fecha válida de inicio y de fin.';
  if (start > end) return 'La fecha final debe ser igual o posterior a la inicial.';
  return '';
}

export function analyticsQuery({ presetRango, fechaInicio, fechaFin }) {
  return { filtro: presetRango === 'custom' ? 'rango' : presetRango === '30d' ? '30d' : '7d', desde: presetRango === 'custom' ? fechaInicio : undefined, hasta: presetRango === 'custom' ? fechaFin : undefined };
}

// One request may finish after a later range has already been selected.
export function latestAnalyticsRequest() {
  let version = 0;
  return { begin: () => ++version, isCurrent: request => request === version, invalidate: () => { version++; } };
}
