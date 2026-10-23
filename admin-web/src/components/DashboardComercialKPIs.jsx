// admin-web/src/components/DashboardComercialKPIs.jsx
// ======================================================================
// 📊 DashboardComercialKPIs — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Renderiza KPIs comerciales del negocio
// • Consume useAnalytics (NO servicios directos)
// • Reutiliza MetricCard
// • UX tipo Shopify / Stripe
// • Componente delgado y escalable
// ======================================================================

import useAnalytics from '../hooks/useAnalytics';
import MetricCard from './MetricCard';

export default function DashboardComercialKPIs() {
  const { kpis, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border rounded-xl p-6 animate-pulse h-[120px]" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="mt-6 text-sm text-red-600">Error cargando métricas: {error}</div>;
  }

  if (!kpis) return null;

  const { pedidosHoy = 0, ventasHoy = 0, productosActivos = 0, tiempoPromedio = 0 } = kpis;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
      <MetricCard titulo="Pedidos hoy" valor={pedidosHoy} descripcion="Pedidos completados hoy" />

      <MetricCard
        titulo="Ventas hoy"
        valor={`$${ventasHoy.toLocaleString()}`}
        descripcion="Ingresos del día"
      />

      <MetricCard
        titulo="Productos activos"
        valor={productosActivos}
        descripcion="Disponibles en el menú"
      />

      <MetricCard
        titulo="Tiempo promedio"
        valor={`${tiempoPromedio} min`}
        descripcion="Preparación promedio"
      />
    </div>
  );
}
