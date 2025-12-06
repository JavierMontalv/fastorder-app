// src/layouts/DashboardLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import Header from "../components/ui/Header";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex">

      {/* SIDEBAR (desktop + mobile) */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* HEADER STICKY */}
        <Header setSidebarOpen={setSidebarOpen} />

        {/* CONTENIDO */}
        <main className="p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
