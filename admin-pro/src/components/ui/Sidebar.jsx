// src/components/ui/Sidebar.jsx
import { NavLink } from "react-router-dom";
import Logo from "./Logo";

const menu = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/categorias", label: "Categorías", icon: "🗂️" },
  { to: "/productos", label: "Productos", icon: "🍽️" },
  { to: "/pedidos", label: "Pedidos", icon: "🛵" },
  { to: "/restaurante", label: "Restaurante", icon: "🏪" },
  { to: "/usuarios", label: "Usuarios", icon: "👤" },
];

export default function Sidebar() {
  return (
    <aside
      className="
        w-64 h-screen bg-white border-r border-gray-200
        flex flex-col shadow-sm overflow-y-auto
      "
    >
      {/* Logo */}
      <div className="px-6 py-8">
        <Logo size={42} textSize="text-2xl" />
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-1 px-3">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
              transition-all duration-200 select-none
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm scale-[1.02]"
                  : "text-gray-700 hover:bg-gray-100 hover:scale-[1.01]"
              }
            `}
            aria-current={({ isActive }) => (isActive ? "page" : undefined)}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-6 py-6 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Sesión activa
        </p>
        <p className="text-sm font-semibold text-gray-700">admin@fastorder.com</p>
      </div>
    </aside>
  );
}
