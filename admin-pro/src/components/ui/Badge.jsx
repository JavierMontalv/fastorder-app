// src/components/ui/Badge.jsx

export default function Badge({
  children,
  variant = "primary",
  size = "md",
  rounded = "full", // full | md
  icon = null,
  className = "",
}) {
  const base =
    "inline-flex items-center font-medium transition-all select-none";

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  const radius = {
    full: "rounded-full",
    md: "rounded-md",
  };

  const variants = {
    primary: "bg-blue-100 text-blue-700 border border-blue-200",
    success: "bg-green-100 text-green-700 border border-green-200",
    danger: "bg-red-100 text-red-700 border border-red-200",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    info: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    dark: "bg-gray-800 text-white border border-gray-700",
    subtle: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <span
      className={`
        ${base}
        ${sizes[size]}
        ${radius[rounded]}
        ${variants[variant]}
        ${className}
      `}
    >
      {icon && <span className="mr-1.5 text-sm">{icon}</span>}
      {children}
    </span>
  );
}
