// src/components/ui/Header.jsx
export default function Header({
  title = "Panel de Control",
  user = {},
}) {
  return (
    <header className="
      h-16 bg-white border-b border-gray-200
      flex items-center justify-between
      px-6 shadow-sm
    ">

      {/* TÍTULO */}
      <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
        {title}
      </h1>

      {/* USUARIO / ACCIONES */}
      <div className="flex items-center gap-4">

        {/* Notificaciones (placeholder futuro) */}
        <button className="text-gray-500 hover:text-gray-700 transition text-xl">
          🔔
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {user.name || "Administrador"}
          </span>

          <img
            src={user.avatar || "https://i.pravatar.cc/100?img=12"}
            alt="avatar"
            className="w-10 h-10 rounded-full border shadow-sm object-cover"
          />
        </div>
      </div>
    </header>
  );
}
