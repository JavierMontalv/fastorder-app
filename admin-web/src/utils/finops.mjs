export const CATEGORIAS_GASTO = {
  arriendo: 'Arriendo', servicios_publicos: 'Servicios públicos', internet: 'Internet', nomina: 'Nómina',
  insumos: 'Insumos', mantenimiento: 'Mantenimiento', marketing: 'Marketing', impuestos: 'Impuestos',
  comisiones: 'Comisiones', otros: 'Otros'
};
export const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));
export function rangoMes(date = new Date()) {
  const year = date.getFullYear(), month = date.getMonth();
  const pad = (n) => String(n).padStart(2, '0');
  return { desde: `${year}-${pad(month + 1)}-01`, hasta: `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}` };
}
export function resumenGastos(items = []) {
  return items.reduce((acc, item) => {
    if (item.estado === 'borrador') acc.borradores += 1;
    else { acc.total += Number(item.monto || 0); acc[item.tipo] += Number(item.monto || 0); }
    return acc;
  }, { fijo: 0, variable: 0, total: 0, borradores: 0 });
}
export function toCsv(rows, columns) {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return '\ufeff' + [columns.map((c) => escape(c.label)).join(','), ...rows.map((r) => columns.map((c) => escape(c.value(r))).join(','))].join('\r\n');
}
