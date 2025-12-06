// src/components/ui/Navbar.jsx
import Logo from "./Logo";

export default function Navbar({ user }) {
  return (
    <nav
      className="
        w-full h-14 bg-white/90 backdrop-blur-sm
        shadow-sm border-b border-gray-200
        px-6 flex items-center justify-between
        sticky top-0 z-40
      "
    >
      {/* Logo */}
      <Logo size={30} textSize="text-xl" />

      {/* Acciones */}
      <div className="flex items-center gap-4">

        {/* Notificaciones */}
        <button
          aria-label="Notificaciones"
          className="
            p-2 rounded-full hover:bg-gray-100
            transition flex items-center justify-center text-gray-600
          "
        >
          🔔
        </button>

        {/* Configuración */}
        <button
          aria-label="Configuración"
          className="
            p-2 rounded-full hover:bg-gray-100
            transition flex items-center justify-center text-gray-600
          "
        >
          ⚙️
        </button>

        {/* Avatar del usuario */}
        <img
          src={user?.avatar || "https://i.pravatar.cc/40"}
          alt="avatar"
          className="w-9 h-9 rounded-full border shadow-sm cursor-pointer hover:scale-105 transition"
        />
      </div>
    </nav>
  );
}
