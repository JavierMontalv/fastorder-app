// src/layouts/DashboardLayout.jsx
// ======================================================================
// 🖥️ COMANDA ENTERPRISE — Dashboard Layout (2026)
// ----------------------------------------------------------------------
// • Sidebar premium con IA integrada
// • Navbar tipo Shopify Admin
// • Contenedor principal optimizado
// • Animaciones fluidas + diseño Glass
// • Compatible con React Router v6 (<Outlet />)
// • Layout ESTABLE (sin remount de páginas)
// ======================================================================

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import AdminPedidosRealtimeBridge from '../components/AdminPedidosRealtimeBridge';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import WelcomePresentation from '../components/WelcomePresentation';
import '../styles/Dashboard.css';

const STORAGE_KEY = 'comanda.sidebar.abierto';

export default function DashboardLayout() {
  const [esMovil, setEsMovil] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1180 : false
  );
  const [sidebarAbierto, setSidebarAbierto] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved === 'true' : true;
  });
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1180px)');

    const syncViewport = (event) => {
      const mobile = Boolean(event.matches ?? mediaQuery.matches);
      setEsMovil(mobile);

      if (!mobile) {
        setMenuMovilAbierto(false);
      }
    };

    syncViewport(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);
      return () => mediaQuery.removeEventListener('change', syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (esMovil) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'false') {
      setSidebarAbierto(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [esMovil]);

  useEffect(() => {
    if (!esMovil) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = menuMovilAbierto ? 'hidden' : originalOverflow;

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [esMovil, menuMovilAbierto]);

  const handleToggle = () => {
    if (esMovil) {
      setMenuMovilAbierto((prev) => !prev);
      return;
    }

    setSidebarAbierto((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const cerrarMenuMovil = () => setMenuMovilAbierto(false);

  return (
    <div
      className={`layout-container ${sidebarAbierto ? '' : 'sidebar-cerrado'} ${esMovil ? 'sidebar-mobile' : ''}`}
    >
      <AdminPedidosRealtimeBridge />
      <WelcomePresentation />

      {/* =======================
          SIDEBAR LATERAL
      ======================= */}
      <Sidebar
        abierto={esMovil ? true : sidebarAbierto}
        onToggle={handleToggle}
        esMovil={esMovil}
        mobileOpen={menuMovilAbierto}
        onCloseMobile={cerrarMenuMovil}
      />

      {esMovil && menuMovilAbierto && (
        <button
          type="button"
          className="layout-sidebar-backdrop"
          onClick={cerrarMenuMovil}
          aria-label="Cerrar menu lateral"
        />
      )}

      {/* =======================
          CONTENEDOR PRINCIPAL
      ======================= */}
      <div className="layout-main">
        {/* NAVBAR SUPERIOR */}
        <Navbar onToggleSidebar={handleToggle} esMovil={esMovil} />

        {/* =======================
            CONTENIDO DINÁMICO
        ======================= */}
        <main className="layout-content layout-content--full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
