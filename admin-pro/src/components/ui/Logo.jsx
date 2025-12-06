// src/components/ui/Logo.jsx
export default function Logo({ size = 40, textSize = "text-xl", className = "" }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src="/logo-fastorder.svg"
        alt="FastOrder"
        width={size}
        height={size}
        className="drop-shadow-sm object-contain"
        onError={(e) => (e.target.src = "/vite.svg")}
      />
      <span className={`font-bold tracking-tight ${textSize}`}>
        Fast<span className="text-blue-600">Order</span>
      </span>
    </div>
  );
}
