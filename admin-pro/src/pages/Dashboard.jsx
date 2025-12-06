// src/pages/Dashboard.jsx

import Card from "../components/ui/Card";
import { TrendingUp, ShoppingBag, Users, Store } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* TÍTULO */}
      <h1 className="text-3xl font-bold tracking-tight text-gray-800">
        Dashboard
      </h1>

      {/* GRID DE MÉTRICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card
          title="Ventas Hoy"
          value="$1,250,000"
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          trend="+12%"
        />

        <Card
          title="Pedidos Activos"
          value="34"
          icon={<ShoppingBag className="w-6 h-6 text-green-600" />}
          trend="+5%"
        />

        <Card
          title="Usuarios"
          value="287"
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend="+3%"
        />

        <Card
          title="Restaurantes"
          value="12"
          icon={<Store className="w-6 h-6 text-orange-600" />}
          trend="Estable"
        />
      </section>

      {/* SECCIÓN DE CONTENIDO */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Actividad Reciente
        </h2>

        <p className="text-gray-500">
          Aquí podrás ver el historial de pedidos, movimientos de usuarios, y
          estadísticas en tiempo real cuando integremos el backend.
        </p>
      </section>
    </div>
  );
}
