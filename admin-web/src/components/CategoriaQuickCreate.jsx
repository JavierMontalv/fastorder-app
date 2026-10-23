// admin-web/src/components/CategoriaQuickCreate.jsx
// ======================================================================
// 🗂️ CategoriaQuickCreate.jsx — Comanda Admin 2026
// Modal rápido de creación de categoría
// • UX ágil (inline)
// • Nombre obligatorio
// • Icono opcional
// • Callback onCreated()
// • Dominio ADMIN
// ======================================================================
// 🔧 CORRECCIÓN QUIRÚRGICA:
// - ❌ ELIMINADO throw agresivo “Respuesta inválida del servidor”
// - ✅ Si no hubo excepción → creación válida
// - ❌ NO se fuerza forma del objeto de respuesta
// ======================================================================

import { useState } from 'react';
import '../styles/Productos.css';

export default function CategoriaQuickCreate({ open, onClose, onCreate, onCreated }) {
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ======================================================
  // 🧠 Validación mínima
  // ======================================================
  const validar = () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    return true;
  };

  // ======================================================
  // 💾 Crear categoría
  // ======================================================
  const handleCreate = async () => {
    if (!validar()) return;

    if (!onCreate) {
      setError('Servicio de categorías no disponible');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nueva = await onCreate({
        nombre: nombre.trim(),
        icono: icono.trim() || null
      });

      // ✅ ÉXITO SI NO HUBO EXCEPCIÓN
      setNombre('');
      setIcono('');

      if (onCreated) {
        onCreated(nueva);
      }

      onClose();
    } catch (err) {
      setError(err?.message || 'No se pudo crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pro-modal-overlay">
      <div className="pro-modal small">
        <div className="pro-modal-header">
          <h3>Nueva categoría</h3>
          <button className="pro-close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        <div className="pro-modal-body">
          <label>Nombre *</label>
          <input
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError(null);
            }}
            placeholder="Ej: Bebidas"
          />

          <label>Icono (opcional)</label>
          <input value={icono} onChange={(e) => setIcono(e.target.value)} placeholder="Ej: 🍹" />

          {error && <span className="error-text">{error}</span>}
        </div>

        <div className="pro-modal-actions">
          <button className="pro-btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="pro-save-btn" disabled={loading} onClick={handleCreate}>
            {loading ? 'Creando…' : 'Crear categoría'}
          </button>
        </div>
      </div>
    </div>
  );
}
