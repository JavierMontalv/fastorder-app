// src/components/ui/Card.jsx

export default function Card({
  title = "",
  value = "",
  icon = null,
  trend = null,
}) {
  const trendColor =
    trend && trend.startsWith("-") ? "text-red-600" : "text-green-600";

  return (
    <div
      className="
        bg-white rounded-xl p-5 shadow-sm border border-gray-200
        flex flex-col gap-3 hover:shadow-md transition-shadow duration-200
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className="text-2xl opacity-70">{icon}</span>
      </div>

      {/* VALUE */}
      <p className="text-3xl font-bold text-gray-900 tracking-tight">
        {value}
      </p>

      {/* TREND */}
      {trend && (
        <span className={`text-sm font-semibold ${trendColor}`}>
          {trend}
        </span>
      )}
    </div>
  );
}
