// src/context/AuthContext.jsx
// ======================================================================
// 🔐 AuthContext — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// RESPONSABILIDAD REAL (router-agnostic):
//  • Manejar sesión (token + usuario)
//  • Restaurar sesión (refresh)
//  • Exponer estado estable al Router
//
// ❗ Regla de oro (cumplida):
//    • AuthContext NO decide navegación continua
//    • redirectPath SOLO existe para flujos explícitos:
//        - login
//        - completar onboarding
//
// sessionReady === true significa:
// el contexto ya resolvió si hay sesión válida o no
// ======================================================================

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { loginRequest, profileRequest } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔐 Token leído una sola vez (blindaje pro)
  const [token, setToken] = useState(() => localStorage.getItem('comanda_token'));

  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  // 🔁 SOLO para flujos puntuales (login / onboarding)
  const [redirectPath, setRedirectPath] = useState(null);

  // Blindajes
  const sessionLoadedRef = useRef(false);
  const loginInProgressRef = useRef(false);

  // =====================================================
  // 🧠 Resolver destino SOLO para flujos explícitos
  // =====================================================
  const resolverDestinoInicial = useCallback((usuario) => {
    if (!usuario) return '/admin';

    const { rol, onboarding_completado, restauranteId, sedeActivaId } = usuario;

    if (rol === 'superadmin') return '/superadmin/restaurantes';
    if (rol === 'staff') return '/pedidos';
    if ((rol === 'admin' || rol === 'owner') && !onboarding_completado && !restauranteId && !sedeActivaId) {
      return '/onboarding';
    }

    return '/';
  }, []);

  const refreshProfile = useCallback(async () => {
    const perfilRes = await profileRequest();
    const perfil = perfilRes.data ?? perfilRes;
    setUser(perfil);
    return perfil;
  }, []);

  // =====================================================
  // 🔄 Restaurar sesión (NO setea redirect)
  // =====================================================
  useEffect(() => {
    if (sessionLoadedRef.current) return;
    sessionLoadedRef.current = true;

    const loadSession = async () => {
      if (!token) {
        setSessionReady(true);
        setLoading(false);
        return;
      }

      if (loginInProgressRef.current) {
        setLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } catch {
        localStorage.removeItem('comanda_token');
        setToken(null);
        setUser(null);
      } finally {
        setSessionReady(true);
        setLoading(false);
      }
    };

    loadSession();
  }, [refreshProfile, token]);

  // =====================================================
  // 🔐 LOGIN (ÚNICO lugar donde se setea redirectPath)
  // =====================================================
  const login = async (credentials) => {
    loginInProgressRef.current = true;

    try {
      const res = await loginRequest(credentials);
      const payload = res?.data || res;
      const tokenBackend = payload?.token || payload?.data?.token;
      if (!tokenBackend) throw new Error('Token no recibido');

      localStorage.setItem('comanda_token', tokenBackend);
      localStorage.removeItem('comanda_sede_activa_id');
      setToken(tokenBackend);
      setSessionReady(true);

      if (payload?.requiereCambioPassword) {
        setUser(null);
        setRedirectPath('/cambiar-password');
        return '/cambiar-password';
      }

      setSessionReady(false);

      const perfilRes = await profileRequest();
      const perfil = perfilRes.data ?? perfilRes;
      setUser(perfil);

      const destino = resolverDestinoInicial(perfil);
      setRedirectPath(destino);
      return destino;
    } finally {
      setSessionReady(true);
      loginInProgressRef.current = false;
    }
  };

  // =====================================================
  // 🧹 Limpieza explícita (ej. al terminar onboarding)
  // =====================================================
  const limpiarRedirect = () => {
    setRedirectPath(null);
  };

  // =====================================================
  // 🚪 LOGOUT
  // =====================================================
  const logout = () => {
    localStorage.removeItem('comanda_token');
    localStorage.removeItem('comanda_sede_activa_id');
    setToken(null);
    setUser(null);
    setRedirectPath('/admin');
    setSessionReady(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sessionReady,
        redirectPath,
        login,
        logout,
        limpiarRedirect,
        refreshProfile,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
