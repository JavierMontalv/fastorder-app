// ======================================================================
// 🏪 HeaderRestaurante.jsx – FASTORDER QR Client (Enterprise 2026)
// ----------------------------------------------------------------------
// Encabezado premium estilo Rappi / UberEats:
//
//  • Banner con degradado
//  • Logo circular en overlay
//  • Estado (abierto/cerrado)
//  • Carga skeleton
//  • Horarios
//  • Branding automático (colores del restaurante)
// ======================================================================

import { useState } from "react";

export default function HeaderRestaurante({ restaurante }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!restaurante) {
    return (
      <div className="w-full mb-6 animate-pulse">
        <div className="h-32 bg-gray-300 rounded-xl"></div>
        <div className="flex gap-3 mt-4 items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-40 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  const {
    nombre,
    descripcion,
    estado,
    logoUrl,
    bannerUrl,
    colorPrimario = "#000000",
    colorSecundario = "#F5F5F5",
  } = restaurante;

  const abierto = estado === "abierto";

  return (
    <header className="w-full mb-6">
      {/* Banner */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}

        <img
          src={bannerUrl || "/banner-default.jpg"}
          onLoad={() => setImgLoaded(true)}
          alt="Banner"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradiente inferior para lectura */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Logo + texto */}
      <div className="flex items-center gap-4 mt-[-32px] px-2">
        {/* Logo */}
        <div
          className="
            w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg flex-shrink-0
          "
          style={{ borderColor: colorPrimario }}
        >
          <img
            src={logoUrl || "/logo-default.png"}
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Información */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{nombre}</h1>

          {descripcion && (
            <p className="text-gray-600 text-sm line-clamp-2">{descripcion}</p>
          )}

          {/* Estado */}
          <p
            className={`mt-1 text-sm font-semibold ${
              abierto ? "text-green-600" : "text-red-600"
            }`}
          >
            {abierto ? "🟢 Abierto" : "🔴 Cerrado"}
          </p>
        </div>
      </div>
    </header>
  );
}
