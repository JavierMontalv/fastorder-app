export const CHART_PALETTE = {
  revenue: '#ff5f57',
  revenueSoft: '#ffc2ba',
  orders: '#0ea5e9',
  ordersSoft: '#bae6fd',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6'
};

export const PAYMENT_COLORS = [
  '#ff5f57',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#f43f5e'
];

export function getChartTheme(isDark = false) {
  return {
    axis: isDark ? '#d7e2f2' : '#243247',
    grid: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.2)',
    cursor: isDark ? 'rgba(255, 95, 87, 0.12)' : 'rgba(255, 95, 87, 0.09)',
    tooltipBackground: isDark ? 'rgba(7, 11, 19, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    tooltipBorder: isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(203, 213, 225, 0.9)',
    tooltipText: isDark ? '#fbfdff' : '#0b1220',
    surfaceStroke: isDark ? 'rgba(8, 13, 22, 0.98)' : '#ffffff'
  };
}
