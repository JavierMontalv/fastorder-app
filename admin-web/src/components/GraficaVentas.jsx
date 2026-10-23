import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { useTheme } from '../context/ThemeContext';
import { getChartTheme } from '../utils/chartTheme';
import '../styles/GraficaVentas.css';

export default function GraficaVentas({ datos = [], titulo = 'Ventas' }) {
  const { isDark } = useTheme();
  const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);

  return (
    <div className="grafica-card">
      <h3 className="grafica-titulo">{titulo}</h3>

      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={datos} margin={{ top: 18, right: 20, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id="graficaVentasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5f57" stopOpacity={0.42} />
              <stop offset="58%" stopColor="#ffc2ba" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#ff5f57" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 10" vertical={false} />
          <XAxis
            dataKey="fecha"
            tickLine={false}
            axisLine={false}
            minTickGap={18}
            tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 760 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={68}
            tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 760 }}
            tickFormatter={(value) => `$${Number(value / 1000).toFixed(0)}k`}
          />

          <Tooltip
            contentStyle={{
              background: chartTheme.tooltipBackground,
              borderRadius: '14px',
              border: `1px solid ${chartTheme.tooltipBorder}`,
              color: chartTheme.tooltipText,
              boxShadow: '0 22px 52px rgba(15, 23, 42, 0.18)',
              backdropFilter: 'blur(16px)'
            }}
            labelStyle={{ color: chartTheme.tooltipText, fontWeight: 700 }}
            formatter={(value) => [`$ ${value.toLocaleString('es-CO')}`, 'Ventas']}
            cursor={{ stroke: '#ff5f57', strokeOpacity: 0.28, strokeWidth: 2 }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="#ff5f57"
            strokeWidth={4.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#graficaVentasGradient)"
            dot={false}
            activeDot={{ r: 6.5, strokeWidth: 3.5, stroke: chartTheme.surfaceStroke, fill: '#ff5f57' }}
            animationDuration={900}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
