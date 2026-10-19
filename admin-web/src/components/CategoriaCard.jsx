// ======================================================================
// 🧩 CategoriaCard.jsx — Tarjeta PRO estilo Shopify/Rappi
// Comanda Admin 2026
// ======================================================================

import "../styles/Categorias.css";

export default function CategoriaCard({ categoria, onEditar, onEliminar }) {
  const {
    id,
    nombre,
    icono,
    descripcion,
    estado,
    productosCount
  } = categoria;

  return (
    <div className={`categoria-card ${estado === "inactivo" ? "categoria-off" : ""}`}>

      {/* Icono grande */}
      <div className="categoria-icono">
        {icono || "📦"}
      </div>

      {/* Nombre + estado */}
      <div className="categoria-info">
        <h3 className="categoria-nombre">{nombre}</h3>

        {descripcion && (
          <p className="categoria-descripcion">{descripcion}</p>
        )}

        <span className={`categoria-estado estado-${estado}`}>
          {estado}
        </span>

        {typeof productosCount === "number" && (
          <p className="categoria-count">
            {productosCount} productos
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="categoria-actions">
        <button className="btn-card editar" onClick={() => onEditar(categoria)}>
          ✏️ Editar
        </button>

        <button className="btn-card eliminar" onClick={() => onEliminar(id)}>
          🗑 Eliminar
        </button>
      </div>
    </div>
  );
}
