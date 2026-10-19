import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import iaClient from '../api/iaClient';
import { AuthContext } from './AuthContext';

const IAContext = createContext({
  estadoIA: null,
  cargandoEstadoIA: true,
  planAllowsAI: false,
  canUseAI: false,
  refreshIAState: async () => {},
  hasFeature: () => false
});

export function IAProvider({ children }) {
  const { isAuthenticated, sessionReady } = useContext(AuthContext);
  const [estadoIA, setEstadoIA] = useState(null);
  const [cargandoEstadoIA, setCargandoEstadoIA] = useState(true);

  const refreshIAState = useCallback(async () => {
    if (!sessionReady || !isAuthenticated) {
      setEstadoIA(null);
      setCargandoEstadoIA(false);
      return null;
    }

    try {
      setCargandoEstadoIA(true);
      const response = await iaClient.get('/soporte-ia/estado');
      const nextState = response?.data?.data || null;
      setEstadoIA(nextState);
      return nextState;
    } catch {
      setEstadoIA(null);
      return null;
    } finally {
      setCargandoEstadoIA(false);
    }
  }, [isAuthenticated, sessionReady]);

  useEffect(() => {
    refreshIAState();
  }, [refreshIAState]);

  useEffect(() => {
    const handlePlanOrSedeChanged = () => refreshIAState();

    window.addEventListener('comanda:plan-refreshed', handlePlanOrSedeChanged);
    window.addEventListener('comanda:sede-changed', handlePlanOrSedeChanged);
    window.addEventListener('focus', handlePlanOrSedeChanged);

    return () => {
      window.removeEventListener('comanda:plan-refreshed', handlePlanOrSedeChanged);
      window.removeEventListener('comanda:sede-changed', handlePlanOrSedeChanged);
      window.removeEventListener('focus', handlePlanOrSedeChanged);
    };
  }, [refreshIAState]);

  const value = useMemo(() => {
    const planAllowsAI = Boolean(estadoIA?.iaPermitidaPorPlan);
    const canUseAI = planAllowsAI && Boolean(estadoIA?.puedeConsumir);
    const featureSet = new Set(estadoIA?.funcionesDisponibles || []);

    return {
      estadoIA,
      cargandoEstadoIA,
      planAllowsAI,
      canUseAI,
      refreshIAState,
      hasFeature: (feature) => featureSet.has(feature)
    };
  }, [estadoIA, cargandoEstadoIA, refreshIAState]);

  return <IAContext.Provider value={value}>{children}</IAContext.Provider>;
}

export function useIAContext() {
  return useContext(IAContext);
}

export default IAContext;
