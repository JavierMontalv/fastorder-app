// admin-web/src/components/ProtectedRoute.jsx
// ======================================================================
// 🔐 ProtectedRoute — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// Responsabilidad (CLARA Y ÚNICA):
//  • Esperar a que AuthContext resuelva la sesión (sessionReady)
//  • Redirigir UNA SOLA VEZ según redirectPath
//  • NO decidir reglas de negocio (eso vive en AuthContext)
// ----------------------------------------------------------------------
// ❌ No se refactoriza Auth
// ❌ No se duplica lógica de rol / onboarding
// ✅ Solo obedece estados expuestos
// ======================================================================

import { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, sessionReady, redirectPath, limpiarRedirect, user } =
    useContext(AuthContext);

  const location = useLocation();

  useEffect(() => {
    if (sessionReady && isAuthenticated && redirectPath === location.pathname) {
      limpiarRedirect();
    }
  }, [sessionReady, isAuthenticated, redirectPath, location.pathname, limpiarRedirect]);

  // ======================================================
  // ⏳ Esperar a que AuthContext decida TODO
  // ======================================================
  if (!sessionReady) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Cargando sesión…
      </div>
    );
  }

  // ======================================================
  // 🔐 No autenticado → Login
  // ======================================================
  if (!isAuthenticated) {
    return <Navigate to={location.pathname === '/' ? '/inicio' : '/admin'} replace />;
  }

  // ======================================================
  // 🧭 Redirección inicial controlada
  // (evita doble redirect y flashes)
  // Limpia redirectPath una vez llegamos al destino para
  // no bloquear la navegación posterior.
  // ======================================================
  if (redirectPath && location.pathname !== redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // ======================================================
  // 🛡️ Guard de rol (opcional: prop roles={['superadmin']})
  // ======================================================
  if (roles && roles.length > 0 && !roles.includes(user?.rol)) {
    return <Navigate to={user?.rol === 'staff' ? '/pedidos' : '/'} replace />;
  }

  // ======================================================
  // ✔ Acceso permitido
  // ======================================================
  return children;
}
