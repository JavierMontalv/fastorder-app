// admin-web/src/components/DashboardKPIs.jsx
// ======================================================================
// 📊 DashboardKPIs — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Renderer PURO de KPIs globales
// • Obedece 100 % dashboardConfig
// • Hooks RESUELTOS estáticamente (Rules of Hooks OK)
// • Sin lógica de dominio
// • Sin switch / if semántico
// • Sin decisiones de permisos
// • Sin conocimiento hardcodeado de módulos
// • Agregar módulo = SOLO tocar dashboardConfig
// • Dashboard.jsx permanece delgado
// ======================================================================

import { useContext, useMemo } from 'react';

import dashboardConfig from '../config/dashboardConfig';
import { AuthContext } from '../context/AuthContext';
import MetricCard from './MetricCard';

// ======================================================
// 🔒 Resolver ESTÁTICO de hooks permitidos
// ======================================================
import useInventario from '../hooks/useInventario';

const hookResolvers = {
  useInventario
};

export default function DashboardKPIs() {
  const { user } = useContext(AuthContext);
  const rolUsuario = user?.rol;

  // ======================================================
  // 🧩 Resolver módulos visibles (config manda)
  // ======================================================
  const modulosVisibles = useMemo(() => {
    return Object.entries(dashboardConfig)
      .filter(([, modulo]) => modulo.enabled)
      .filter(([, modulo]) => modulo.roles.includes(rolUsuario))
      .map(([key, modulo]) => ({
        key,
        ...modulo
      }));
  }, [rolUsuario]);

  // ======================================================
  // 📦 Ejecutar TODOS los hooks permitidos (orden fijo)
  // ======================================================
  const hookResults = {
    useInventario: hookResolvers.useInventario({ autoLoad: true })
  };

  // ======================================================
  // 🧠 Asociar resultados a módulos por clave
  // ======================================================
  const resultadosPorModulo = useMemo(() => {
    return modulosVisibles.reduce((acc, modulo) => {
      if (!modulo.hook) return acc;

      const resultado = hookResults[modulo.hook];
      if (!resultado) return acc;

      acc[modulo.key] = resultado;
      return acc;
    }, {});
  }, [modulosVisibles, hookResults]);

  // ======================================================
  // ⏳ Loading por módulo
  // ======================================================
  const algunModuloCargando = Object.values(resultadosPorModulo).some((r) => r?.loading);

  if (algunModuloCargando) return null;

  // ======================================================
  // 📊 Render PURO: config → MetricCard
  // ======================================================
  return (
    <div className="kpi-grid">
      {modulosVisibles.map((modulo) => {
        const resultado = resultadosPorModulo[modulo.key];
        const resumen = resultado?.resumen;

        if (!resumen) return null;
        if (typeof modulo.resolverKPI !== 'function') return null;

        return modulo.kpis
          .sort((a, b) => a.order - b.order)
          .map((kpi) => {
            const data = modulo.resolverKPI({
              kpi,
              resumen
            });

            if (!data) return null;

            // ======================================================
            // 🎯 FIX QUIRÚRGICO — SEMÁNTICA VISUAL DE RIESGO
            // • NO toca lógica
            // • NO toca API
            // • SOLO clase CSS dinámica
            // ======================================================
            const riesgoClass =
              kpi.key === 'riesgo_general' && typeof data.valor === 'string'
                ? `riesgo-${data.valor.toLowerCase()}`
                : '';

            return (
              <div key={`${modulo.key}_${kpi.key}`} className={riesgoClass}>
                <MetricCard
                  titulo={kpi.titulo}
                  valor={data.valor}
                  descripcion={data.descripcion}
                  estadoColor={data.estadoColor}
                />
              </div>
            );
          });
      })}
    </div>
  );
}
