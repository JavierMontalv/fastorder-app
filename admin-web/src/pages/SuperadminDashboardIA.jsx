import { useEffect, useState } from 'react';

import { getDashboardIA } from '../api/superadminDashboardApi';
import MetricCard from '../components/MetricCard';

const formatUsd = (value) => `USD ${Number(value || 0).toFixed(2)}`;
const formatCop = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export default function SuperadminDashboardIA() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDashboardIA = async () => {
      try {
        const res = await getDashboardIA();
        setData(res?.data || null);
      } catch (error) {
        console.error('Error cargando dashboard IA:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboardIA();
  }, []);

  if (loading) {
    return <div className="w-full py-20 text-center text-gray-500">Cargando metricas de IA...</div>;
  }

  if (!data) {
    return <div className="w-full py-20 text-center text-red-500">No se pudieron cargar las metricas de IA.</div>;
  }

  const uso = data.uso || {};
  const costos = data.costos || {};
  const impacto = data.impacto || {};
  const funcionesTop = Array.isArray(data.funcionesTop) ? data.funcionesTop : [];

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard IA</h1>
        <p className="mt-1 text-gray-600">
          Consumo real, costo operativo y ahorro estimado de la capa de inteligencia artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard titulo="Requests IA (mes)" valor={uso.requestsMes || 0} />
        <MetricCard titulo="Requests IA (hoy)" valor={uso.requestsHoy || 0} color="blue" />
        <MetricCard titulo="Costo IA total" valor={formatUsd(costos.costoTotalUSD)} color="red" />
        <MetricCard titulo="Restaurantes usando IA" valor={uso.restaurantesIA || 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <MetricCard titulo="Costo promedio por ejecucion" valor={formatUsd(costos.costoPromedioUSD)} color="gray" />
        <MetricCard titulo="Horas ahorradas" valor={impacto.horasAhorradas || 0} color="green" />
        <MetricCard titulo="Ahorro estimado" valor={formatCop(impacto.ahorroEstimadoCOP)} color="black" />
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Funciones IA mas utilizadas</h2>

        <ul className="space-y-3">
          {funcionesTop.length === 0 ? (
            <li className="text-sm text-gray-500">Aun no hay uso suficiente para mostrar ranking.</li>
          ) : (
            funcionesTop.map((item, index) => (
              <li key={`${item.funcion}-${index}`} className="flex items-center justify-between border-b pb-2 text-sm">
                <span className="font-medium">{item.funcion}</span>
                <span className="text-gray-600">{item.total} usos</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
