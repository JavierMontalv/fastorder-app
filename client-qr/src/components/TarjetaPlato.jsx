// ===================================================================
// 🍽️ TarjetaPlato.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// Card premium de producto/plato al estilo Uber Eats / DoorDash:
//  • Imagen con lazy loading
//  • Hover suave y sombras profesionales
//  • Botón “Agregar” integrado con carrito
//  • Adaptado a menú QR (uso con móviles)
//  • Diseño elegante y limpio 2026
// ===================================================================

import React from "react";

export default function TarjetaPlato({ plato, onAgregar }) {
  const { id, nombre, descripcion, precio, imagenUrl, destacado } = plato;

  return (
    <div
      className="
        bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200
        border border-gray-100 overflow-hidden cursor-pointer
      "
    >
      {/* =============================== */}
      {/* Imagen del plato */}
      {/* =============================== */}
      <div className="relative w-full h-40 md:h-48 overflow-hidden">
        <img
          src={imagenUrl || "/placeholder-food.png"}
          alt={nombre}
          loading="lazy"
          className="
            w-full h-full object-cover transition-transform duration-300
            hover:scale-105
          "
        />

        {/* Destacado tipo Uber Eats */}
        {destacado && (
          <span
            className="
              absolute top-2 left-2 bg-black/70 text-white text-xs
              px-2 py-1 rounded-full backdrop-blur-md
            "
          >
            ⭐ Recomendado
          </span>
        )}
      </div>

      {/* =============================== */}
      {/* Información del plato */}
      {/* =============================== */}
      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {nombre}
        </h3>

        {/* Descripción corta */}
        {descripcion && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {descripcion}
          </p>
        )}

        {/* Precio */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${Number(precio).toLocaleString("es-CO")}
          </span>

          {/* Botón agregar */}
          <button
            className="
              px-4 py-1.5 rounded-full bg-black text-white text-sm
              hover:bg-gray-900 transition-all shadow-sm active:scale-95
            "
            onClick={() => onAgregar(plato)}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
