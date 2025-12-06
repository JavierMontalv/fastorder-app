// src/components/ui/Input.jsx
export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  helperText = "",
  icon = null,
  className = "",
}) {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="mb-1 text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <div
        className={`flex items-center gap-2 px-3 py-2 border rounded-md bg-white transition-all
        ${
          error
            ? "border-red-400 focus-within:border-red-500"
            : "border-gray-300 focus-within:border-blue-500"
        } ${className}`}
      >
        {/* Ícono opcional */}
        {icon && <span className="text-gray-400 text-lg">{icon}</span>}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 text-sm focus:outline-none"
        />
      </div>

      {/* Error o helper text */}
      {error ? (
        <span className="text-xs text-red-500 mt-1">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500 mt-1">{helperText}</span>
      ) : null}
    </div>
  );
}
