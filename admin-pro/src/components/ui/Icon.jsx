// src/components/ui/Icon.jsx
export default function Icon({
  children,
  size = 20,
  className = "",
  onClick,
  title = "",
}) {
  return (
    <span
      role="img"
      aria-label={title}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        text-gray-600
        ${onClick ? "cursor-pointer hover:text-gray-800" : ""}
        ${className}
      `}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.9,
      }}
    >
      {children}
    </span>
  );
}
