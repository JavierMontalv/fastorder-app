// src/components/ui/Modal.jsx
import Button from "./Button";

export default function Modal({
  open,
  onClose,
  title = "",
  children,
  actions,
}) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 bg-black/40 backdrop-blur-sm
        flex items-center justify-center z-50
      "
      aria-modal="true"
      role="dialog"
    >
      <div
        className="
          bg-white w-full max-w-md rounded-xl shadow-lg
          p-6 animate-fadeIn scale-100
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="
              p-2 rounded-full hover:bg-gray-100
              text-gray-500 hover:text-gray-700 transition
            "
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="mb-4">{children}</div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          {actions || (
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
