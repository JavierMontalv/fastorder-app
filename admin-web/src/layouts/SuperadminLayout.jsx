// admin-web/src/layouts/SuperadminLayout.jsx
// ======================================================================
// 👑 SuperadminLayout — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// Layout exclusivo para SuperAdmin:
//  • Sidebar propia (CSS enterprise, sin Tailwind)
//  • Header superior
//  • Área de contenido central
//  • Integrado al design system (.css)
//  • Compatible con React Router v6 (<Outlet />)
// ======================================================================

import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import '../styles/SuperadminLayout.css';

export default function SuperadminLayout() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div className="superadmin-layout">
      {/* ======================================================
          📌 SIDEBAR SUPERADMIN
      ====================================================== */}
      <aside className="superadmin-sidebar">
        <div className="superadmin-sidebar-header">
          <span className="superadmin-brand">Comanda</span>
          <span className="superadmin-badge">SUPERADMIN</span>
        </div>

        <nav className="superadmin-nav">
          <NavLink
            to="/superadmin"
            end
            className={({ isActive }) => (isActive ? 'superadmin-link active' : 'superadmin-link')}
          >
            📊 Dashboard
          </NavLink>

          <NavLink
            to="/superadmin/restaurantes"
            className={({ isActive }) => (isActive ? 'superadmin-link active' : 'superadmin-link')}
          >
            🏪 Restaurantes
          </NavLink>

          <NavLink
            to="/superadmin/planes"
            className={({ isActive }) => (isActive ? 'superadmin-link active' : 'superadmin-link')}
          >
            💳 Planes & Facturación
          </NavLink>

          <NavLink
            to="/superadmin/ia"
            className={({ isActive }) => (isActive ? 'superadmin-link active' : 'superadmin-link')}
          >
            🤖 IA & Uso
          </NavLink>
        </nav>

        <div className="superadmin-sidebar-footer">
          <span className="superadmin-session-label">Sesión activa</span>
          <span className="superadmin-user-email">{usuario?.email}</span>

          <button type="button" className="superadmin-logout-button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ======================================================
          🧱 CONTENIDO PRINCIPAL
      ====================================================== */}
      <main className="superadmin-main">
        <header className="superadmin-header">
          <h1 className="superadmin-title">Panel SuperAdmin</h1>

          <span className="superadmin-subtitle">COMANDA ENTERPRISE 2026</span>
        </header>

        <section className="superadmin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
