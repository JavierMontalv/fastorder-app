// src/components/auth/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import useAuth from "../../context/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Todavía validando sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600" />
      </div>
    );
  }

  // No autenticado → enviar al login
  if (!user) return <Navigate to="/login" replace />;

  // Autenticado → mostrar contenido
  return children;
}
