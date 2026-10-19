// admin-web/src/components/PlanCard.jsx
// ======================================================================
// 💳 PlanCard — COMANDA Enterprise 2026
// ----------------------------------------------------------------------
// • Tarjetas de planes orientadas a conversión
// • Copy persuasivo + jerarquía visual
// • Estilo Shopify / Stripe SaaS
// • Componente PRESENTACIONAL (sin llamadas a API)
// ======================================================================

export default function PlanCard({
  nombre,
  precio,
  descripcion,
  limites = [],
  destacado = false,
  cta = 'Elegir plan',
  onSelect
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
        destacado
          ? 'border-indigo-600 shadow-xl scale-[1.03]'
          : 'border-gray-200 shadow-sm hover:shadow-lg'
      } bg-white`}
    >
      {/* ================================================== */}
      {/* ⭐ Badge recomendado */}
      {/* ================================================== */}
      {destacado && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
          ⭐ Más elegido
        </span>
      )}

      {/* ================================================== */}
      {/* 🧠 Header */}
      {/* ================================================== */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 uppercase">{nombre}</h3>

        <p className="text-gray-500 mt-1 text-sm">{descripcion}</p>

        <div className="mt-4">
          <span className="text-4xl font-extrabold text-gray-900">{precio}</span>
          {precio !== 'Gratis' && <span className="text-gray-500 text-sm"> / mes</span>}
        </div>
      </div>

      {/* ================================================== */}
      {/* 📦 Límites / beneficios */}
      {/* ================================================== */}
      <ul className="flex-1 space-y-3 mb-6">
        {limites.map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-green-500">✔</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* ================================================== */}
      {/* 🚀 CTA */}
      {/* ================================================== */}
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-semibold transition ${
          destacado
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}
