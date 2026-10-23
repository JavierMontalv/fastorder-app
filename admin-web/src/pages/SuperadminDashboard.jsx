import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getDashboard } from '../api/superadminDashboardApi';
import MetricCard from '../components/MetricCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const res = await getDashboard();
        setData(res?.data || null);
      } catch (error) {
        console.error('Error cargando dashboard superadmin:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, []);

  if (loading) {
    return <div className="w-full py-20 text-center text-gray-500">Cargando dashboard...</div>;
  }

  if (!data) {
    return <div className="w-full py-20 text-center text-red-500">No se pudieron cargar las metricas.</div>;
  }

  const restaurantes = data.restaurantes || {};
  const suscripciones = data.suscripciones || {};

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard SuperAdmin</h1>
          <p className="mt-1 text-gray-600">Vista comercial de restaurantes, suscripciones y MRR.</p>
        </div>

        <button
          onClick={() => navigate('/superadmin/dashboard/ia')}
          className="rounded-lg bg-black px-5 py-2.5 font-medium text-white transition hover:bg-gray-900"
        >
          Ver Dashboard IA
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard titulo="Restaurantes totales" valor={restaurantes.total || 0} />
        <MetricCard titulo="Restaurantes activos" valor={restaurantes.activos || 0} color="green" />
        <MetricCard titulo="En trial" valor={restaurantes.trial || 0} color="blue" />
        <MetricCard titulo="Suspendidos" valor={restaurantes.suspendidos || 0} color="red" />
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Mix de suscripciones</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <MetricCard titulo="Plan Base" valor={suscripciones.planes?.base || 0} color="gray" />
          <MetricCard titulo="Plan Pro" valor={suscripciones.planes?.pro || 0} color="purple" />
          <MetricCard titulo="Plan IA" valor={suscripciones.planes?.ia || 0} color="black" />
          <MetricCard titulo="Activas" valor={suscripciones.estados?.activas || 0} color="green" />
        </div>

        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-gray-500">Ingreso mensual recurrente estimado</p>
          <p className="mt-1 text-3xl font-bold">{formatCurrency(suscripciones.mrrEstimadoCOP)}</p>
          <p className="mt-2 text-sm text-gray-500">
            ARPA estimado: {formatCurrency(suscripciones.arpaCOP)}
          </p>
        </div>
      </div>
    </div>
  );
}
