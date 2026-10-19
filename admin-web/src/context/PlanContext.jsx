import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';
import { AuthContext } from './AuthContext';

const PlanContext = createContext({
  planActual: null,
  planFeatures: null,
  cargandoPlan: false,
  refreshPlan: async () => null,
  featureEnabled: () => true
});

export function PlanProvider({ children }) {
  const { user, isAuthenticated, sessionReady } = useContext(AuthContext);
  const location = useLocation();
  const [planActual, setPlanActual] = useState(null);
  const [cargandoPlan, setCargandoPlan] = useState(false);

  const refreshPlan = useCallback(async () => {
    if (!sessionReady || !isAuthenticated || !user?.restauranteId || user?.rol === 'superadmin') {
      setPlanActual(null);
      setCargandoPlan(false);
      return null;
    }

    try {
      setCargandoPlan(true);
      const response = await api.get('/planes/actual');
      const nextPlan = response?.data?.data || null;
      setPlanActual(nextPlan);
      window.dispatchEvent(new CustomEvent('comanda:plan-refreshed', { detail: nextPlan }));
      return nextPlan;
    } catch {
      setPlanActual(null);
      return null;
    } finally {
      setCargandoPlan(false);
    }
  }, [isAuthenticated, sessionReady, user?.restauranteId, user?.rol]);

  useEffect(() => {
    refreshPlan();
  }, [refreshPlan, location.pathname]);

  useEffect(() => {
    const handleFocus = () => refreshPlan();
    const handleSedeChanged = () => refreshPlan();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('comanda:sede-changed', handleSedeChanged);

    const interval = window.setInterval(refreshPlan, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('comanda:sede-changed', handleSedeChanged);
      window.clearInterval(interval);
    };
  }, [refreshPlan]);

  const value = useMemo(() => {
    const planFeatures = planActual?.features || null;

    return {
      planActual,
      planFeatures,
      cargandoPlan,
      refreshPlan,
      featureEnabled: (feature) => {
        if (user?.rol === 'superadmin') return true;
        if (!planFeatures) return true;
        return Boolean(planFeatures[feature]);
      }
    };
  }, [cargandoPlan, planActual, refreshPlan, user?.rol]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlanContext() {
  return useContext(PlanContext);
}

export default PlanContext;
