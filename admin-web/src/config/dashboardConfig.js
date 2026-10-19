// admin-web/src/config/dashboardConfig.js
// ======================================================================
// ⚙️ Dashboard Config — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Política de producto (NO UI)
// • Define módulos, KPIs, orden, acceso y contratos
// • Fuente ÚNICA de verdad del Dashboard
// • Editable sin tocar JSX
// • Enterprise-grade (contratos explícitos, sin supuestos)
// ======================================================================

const dashboardConfig = {
  inventario: {
    // --------------------------------------------------
    // 🧩 Identidad y control del módulo
    // --------------------------------------------------
    enabled: true,
    roles: ['admin', 'superadmin'],

    // --------------------------------------------------
    // 🔌 Fuente de datos (contrato explícito)
    // --------------------------------------------------
    hook: 'useInventario',

    /**
     * Contrato del hook:
     * El hook DEBE retornar un objeto con la siguiente forma mínima:
     *
     * {
     *   resumen: {
     *     riesgo: 'alto' | 'medio' | 'bajo',
     *     alertas: number,
     *     criticos: number
     *   },
     *   loading: boolean
     * }
     */
    contratoHook: {
      resumen: true,
      loading: true
    },

    // --------------------------------------------------
    // 📊 KPIs del módulo (declarativos)
    // --------------------------------------------------
    kpis: [
      {
        key: 'riesgo',
        titulo: 'Riesgo general',
        order: 1,
        tipo: 'estado'
      },
      {
        key: 'alertas',
        titulo: 'Alertas activas',
        order: 2,
        tipo: 'numero'
      },
      {
        key: 'criticos',
        titulo: 'Productos críticos',
        order: 3,
        tipo: 'numero'
      }
    ],

    // --------------------------------------------------
    // 🧠 Resolver de KPIs (política de producto)
    // --------------------------------------------------
    resolverKPI({ kpi, resumen }) {
      if (!resumen) return null;

      switch (kpi.key) {
        case 'riesgo':
          return {
            valor: resumen.riesgo,
            descripcion: 'Estado global del inventario',
            estadoColor:
              resumen.riesgo === 'alto'
                ? 'text-red-600'
                : resumen.riesgo === 'medio'
                ? 'text-yellow-600'
                : 'text-green-600'
          };

        case 'alertas':
          return {
            valor: resumen.alertas,
            descripcion: 'Requieren atención inmediata'
          };

        case 'criticos':
          return {
            valor: resumen.criticos,
            descripcion: 'Stock mínimo o agotado'
          };

        default:
          return null;
      }
    },

    // --------------------------------------------------
    // 🤖 IA — Feature Flags (ENTERPRISE)
    // --------------------------------------------------
    ia: {
      enabled: true,

      // Control por rol
      roles: ['admin', 'superadmin'],

      // Control por plan (referencial / futuro)
      planes: ['pro', 'enterprise'],

      // Visibilidad en dashboard
      visible: true,

      // Contrato de datos esperado por UI
      contrato: {
        titulo: true,
        descripcion: true,
        impactoEstimado: false,
        cta: false
      }
    }
  }
};

export default dashboardConfig;
