// ======================================================================
// 🛒 FloatingCart.jsx – FASTORDER QR Client (Enterprise 2026)
// ----------------------------------------------------------------------
// Botón flotante tipo Rappi / UberEats:
//  • Badge con cantidad
//  • Subtotal dinámico
//  • Animación de aparición
//  • Vibración suave al actualizar (si el dispositivo lo soporta)
//  • Ultra responsive para móviles
// ======================================================================

import { useEffect, useState } from "react";

export default function FloatingCart({ items = [], onOpenCart }) {
  const [visible, setVisible] = useState(false);
  const [subtotal, setSubtotal] = useState(0);

  // ---------------------------------------------------
  // 🧮 Calcular subtotal y mostrar botón
  // ---------------------------------------------------
  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce(
        (acc, item) => acc + item.cantidad * item.precio,
        0
      );
      setSubtotal(total);
      setVisible(true);

      // Vibración suave estilo apps modernas
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(15);
      }
    } else {
      setVisible(false);
    }
  }, [items]);

  if (!visible) return null;

  // ---------------------------------------------------
  // 🎨 Estilos premium
  // ---------------------------------------------------
  return (
    <div
      className="
        fixed bottom-4 left-1/2 transform -translate-x-1/2
        z-50
        w-[90%] max-w-sm
        animate-slide-up
      "
    >
      <button
        onClick={onOpenCart}
        className="
          w-full flex items-center justify-between
          bg-black text-white
          rounded-full px-5 py-3 shadow-xl
          active:scale-95 transition-transform
        "
        style={{
          background: "linear-gradient(135deg, #000000, #1a1a1a)",
        }}
      >
        {/* Cantidad (badge) */}
        <div
          className="
            bg-white text-black font-bold
            w-8 h-8 flex items-center justify-center rounded-full mr-3
          "
        >
          {items.length}
        </div>

        {/* Texto */}
        <span className="text-base font-semibold">Ver carrito</span>

        {/* Subtotal */}
        <span className="text-base font-bold">
          ${subtotal.toLocaleString("es-CO")}
        </span>
      </button>
    </div>
  );
}
