export default function Spinner({
  size = 32,
  color = "blue",
  center = false,
  className = "",
}) {
  const colors = {
    blue: "border-t-blue-600",
    green: "border-t-green-600",
    red: "border-t-red-600",
    orange: "border-t-orange-500",
    white: "border-t-white",
    gray: "border-t-gray-500",
  };

  return (
    <div
      className={`${center ? "flex justify-center items-center w-full py-6" : ""}`}
    >
      <div
        role="status"
        aria-label="Cargando"
        className={`
          animate-spin rounded-full
          border-4 border-gray-200
          ${colors[color] || colors.blue}
          shadow-sm
          ${className}
        `}
        style={{
          width: size,
          height: size,
          borderTopColor: "currentColor",
        }}
      />
    </div>
  );
}
