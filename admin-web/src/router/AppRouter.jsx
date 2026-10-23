// src/router/AppRouter.jsx
// ======================================================================
// 🚀 COMANDA ADMIN — AppRouter (Enterprise 2026)
// ----------------------------------------------------------------------
// • Rutas estructuradas estilo Shopify / Stripe Dashboard
// • ProtectedRoute para bloquear sin login
// • DashboardLayout aplicado automáticamente
// • IA de soporte incluida
// • Animaciones fadeIn en todas las vistas
// ======================================================================

import { Navigate, Route, Routes } from 'react-router-dom';

// Layout Principal
import DashboardLayout from '../layouts/DashboardLayout';

// Middleware
import ProtectedRoute from './ProtectedRoute';

// Pages (Admin)
import Analiticas from '../pages/Analiticas';
import Categorias from '../pages/Categorias';
import Estadisticas from '../pages/Estadisticas';
import Login from '../pages/Login';
import Pedidos from '../pages/Pedidos';
import Productos from '../pages/Productos';
import ProductosEditar from '../pages/ProductosEditar';
import SoporteIA from '../pages/SoporteIA';

export default function AppRouter() {
  return (
    <Routes>
      {/* ======================================================
          RUTA: LOGIN (PÚBLICA)
      ====================================================== */}
      <Route path="/login" element={<Login />} />

      {/* ======================================================
          RUTAS PROTEGIDAS (ADMIN)
      ====================================================== */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <div className="fadeIn">{/* Este wrapper da animación global */}</div>
            </DashboardLayout>
          </ProtectedRoute>
        }
      >
        {/* ======================================================
            DASHBOARD (redirect a pedidos o analítica)
        ====================================================== */}
        <Route index element={<Navigate to="/pedidos" replace />} />

        {/* ======================================================
            MÓDULO — PEDIDOS (tiempo real)
        ====================================================== */}
        <Route path="pedidos" element={<Pedidos />} />

        {/* ======================================================
            MÓDULO — PRODUCTOS
        ====================================================== */}
        <Route path="productos" element={<Productos />} />
        <Route path="productos/editar/:id" element={<ProductosEditar />} />

        {/* ======================================================
            MÓDULO — CATEGORÍAS
        ====================================================== */}
        <Route path="categorias" element={<Categorias />} />

        {/* ======================================================
            MÓDULO — ANALÍTICAS PRO
        ====================================================== */}
        <Route path="analiticas" element={<Analiticas />} />

        {/* ======================================================
            MÓDULO — ESTADÍSTICAS
        ====================================================== */}
        <Route path="estadisticas" element={<Estadisticas />} />

        {/* ======================================================
            MÓDULO — SOPORTE IA (ChatGPT interno)
        ====================================================== */}
        <Route path="soporte-ia" element={<SoporteIA />} />
      </Route>

      {/* ======================================================
          ANY OTHER → Redirigir
      ====================================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
