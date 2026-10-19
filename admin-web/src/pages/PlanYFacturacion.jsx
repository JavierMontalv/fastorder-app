import { useEffect, useState } from 'react';
import api from '../api/api';
import PlanCard from '../components/PlanCard';

const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const formatUSD = (value) => `$${Number(value || 0).toFixed(2)} USD`;

export default function PlanYFacturacion() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [uso, setUso] = useState(null);
  const [catalogo, setCatalogo] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [planRes, usoRes, catalogoRes] = await Promise.all([
          api.get('/planes/actual'),
          api.get('/planes/uso'),
          api.get('/planes/disponibles')
        ]);

        setPlan(planRes.data.data);
        setUso(usoRes.data.data);
        setCatalogo(catalogoRes.data.data || []);
      } catch (error) {
        console.error('Error cargando plan:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        Cargando plan y facturacion...
      </div>
    );
  }

  const porcentaje = (actual, limite) => {
    if (!limite) return 0;
    return Math.min(Math.round((actual / limite) * 100), 100);
  };

  const BarraUso = ({ titulo, actual, limite, helper }) => {
    const pct = porcentaje(actual, limite);

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{titulo}</span>
          <span>
            {actual} / {limite || '∞'}
          </span>
        </div>

        <div className="w-full h-2 rounded bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded transition-all ${
              pct < 70 ? 'bg-green-500' : pct < 90 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {helper && <p className="text-xs text-gray-500">{helper}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Plan y facturacion</h1>
        <p className="text-gray-500 mt-1">
          Tu local ya tiene un plan asignado. Aqui puedes entender limites, valor y el costo real de IA.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <span className="text-sm text-gray-500">Plan actual</span>
          <h2 className="text-2xl font-bold text-indigo-600 uppercase">{plan?.nombre}</h2>
          <p className="text-gray-500">{plan?.descripcion}</p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span>Precio: {formatCOP(plan?.precioMensualCOP)}</span>
            <span>Suscripcion: {plan?.estadoSuscripcion}</span>
            <span>Ideal para: {plan?.idealPara}</span>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border px-4 py-3 min-w-[260px]">
          <div className="text-xs uppercase tracking-wide text-gray-500">IA del mes</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">
            {formatUSD(plan?.iaEconomia?.costoUSD)} / {formatUSD(plan?.iaEconomia?.presupuestoUSD)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Restante: {formatUSD(plan?.iaEconomia?.restanteUSD)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Uso del plan</h3>

        <BarraUso
          titulo="Productos"
          actual={uso?.productos || 0}
          limite={uso?.productos_limite}
          helper={`${uso?.productos_disponibles ?? 0} cupos disponibles para productos activos.`}
        />

        <BarraUso
          titulo="Usuarios del equipo"
          actual={uso?.usuarios || 0}
          limite={uso?.usuarios_limite}
          helper={`${uso?.usuarios_disponibles ?? 0} cupos disponibles para usuarios activos o suspendidos.`}
        />

        <BarraUso
          titulo="Pedidos este mes"
          actual={uso?.pedidos_mes || 0}
          limite={uso?.pedidos_mes_limite}
        />

        <BarraUso
          titulo="Presupuesto IA"
          actual={Number(uso?.ia_costo_usd_mes || 0).toFixed(2)}
          limite={Number(uso?.ia_presupuesto_usd || 0).toFixed(2)}
          helper={`Sesiones IA: ${uso?.ia_ejecuciones_mes || 0} · Tokens: ${(uso?.ia_tokens_mes || 0).toLocaleString('es-CO')}`}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Catalogo comercial</h3>
          <p className="text-gray-500 text-sm">
            Base para arrancar, Pro para crecer y IA para automatizar sin perder control del margen.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {catalogo.map((item) => (
            <PlanCard
              key={item.clave}
              nombre={item.nombre}
              precio={formatCOP(item.precioMensualCOP)}
              descripcion={item.descripcion}
              destacado={item.clave === 'pro'}
              cta={item.clave === plan?.clave ? 'Plan actual' : 'Solicitar upgrade'}
              limites={[
                `Hasta ${Number(item.limites?.productos || 0).toLocaleString('es-CO')} productos`,
                `${Number(item.limites?.pedidosMes || 0).toLocaleString('es-CO')} pedidos por mes`,
                `${Number(item.limites?.usuarios || 0).toLocaleString('es-CO')} usuarios`,
                `${Number(item.iaEconomia?.presupuestoUSD || 0).toFixed(0)} USD/mes en IA`
              ].concat(item.caracteristicas || [])}
              onSelect={() => alert('Solicita el cambio de plan a soporte comercial o superadmin.')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
