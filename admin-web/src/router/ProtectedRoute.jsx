// admin-web/src/router/ProtectedRoute.jsx
// ======================================================================
// 🛡️ ProtectedRoute — COMANDA ENTERPRISE 2026 (Router-Clean)
// ----------------------------------------------------------------------
// RESPONSABILIDAD REAL (router-safe):
//  • Bloquear acceso sin sesión
//  • Aplicar redirectPath SOLO como efecto de:
//      - login
//      - onboarding
//      - logout
//  • NO forzar navegación en estado estable
//
// ❗ Regla de oro cumplida:
//    ProtectedRoute NO navega imperativamente.
//    SOLO renderiza <Navigate /> cuando corresponde.
// ======================================================================

import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const { loading, sessionReady, isAuthenticated, redirectPath, limpiarRedirect } =
    useContext(AuthContext);

  console.log('🛡️ [ProtectedRoute] Render', {
    ruta: location.pathname,
    loading,
    sessionReady,
    isAuthenticated,
    redirectPath
  });

  // ======================================================
  // ⏳ Esperando sesión
  // ======================================================
  if (loading || !sessionReady) {
    return children;
  }

  // ======================================================
  // ⛔ No autenticado → login
  // ======================================================
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ======================================================
  // 🔁 Redirect explícito (login / onboarding / logout)
  // ======================================================
  if (redirectPath && redirectPath !== location.pathname) {
    limpiarRedirect?.();
    return <Navigate to={redirectPath} replace />;
  }

  // ======================================================
  // ✅ Estado estable → NO intervenir
  // ======================================================
  return children;
}
