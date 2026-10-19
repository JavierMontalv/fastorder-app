// src/components/FormPromocion.jsx
// ======================================================================
// 🟣 Formulario de Promociones — COMANDA ADMIN WEB 2026
// ----------------------------------------------------------------------
// • Reusable en crear y editar
// • Validación liviana
// • Vista previa del banner tipo Rappi Ads
// • Soporte para imagen URL o archivo local
// • Usa callbacks para manejar submit y cancel
// ======================================================================

import { useState, useEffect } from "react";
import "../styles/FormPromocion.css";

export default function FormPromocion({
  initialData = null,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    imagenUrl: "",
    activa: true,
  });

  const [preview, setPreview] = useState(null);

  // ======================================================
  // Cargar modo edición si initialData existe
  // ======================================================
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setPreview(initialData.imagenUrl || null);
    }
  }, [initialData]);

  // ======================================================
  // Manejar cambios en inputs
  // ======================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ======================================================
  // Manejar imagen (URL o archivo local)
  // ======================================================
  const handleImageInput = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
        setForm((prev) => ({
          ...prev,
          imagenUrl: reader.result, // Base64 para vista previa inmediata
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ======================================================
  // Validaciones básicas
  // ======================================================
  const isValid = () => {
    if (!form.titulo.trim()) return false;
    if (!form.fechaInicio || !form.fechaFin) return false;
    return true;
  };

  // ======================================================
  // Enviar formulario
  // ======================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid()) return alert("Completa los campos obligatorios.");
    onSubmit(form);
  };

  // ======================================================
  // Render
  // ======================================================
  return (
    <div className="form-promocion-container">
      <h2 className="form-title">
        {initialData ? "Editar promoción" : "Nueva promoción"}
      </h2>

      {/* ======================================================
          PREVIEW TIPO BANNER (Rappi Ads Style)
      ====================================================== */}
      <div className="promo-preview">
        {preview ? (
          <img src={preview} alt="preview promoción" />
        ) : (
          <div className="preview-placeholder">Vista previa del banner</div>
        )}
      </div>

      <form className="promo-form" onSubmit={handleSubmit}>
        {/* ======================================================
            DATOS PRINCIPALES
        ====================================================== */}
        <label>Título *</label>
        <input
          type="text"
          name="titulo"
          value={form.titulo}
          onChange={handleChange}
          placeholder="Ej: Combo 2x1 toda la semana"
          required
        />

        <label>Descripción</label>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Texto opcional que describe la promoción"
        />

        {/* ======================================================
            FECHAS
        ====================================================== */}
        <div className="dates-row">
          <div>
            <label>Fecha inicio *</label>
            <input
              type="date"
              name="fechaInicio"
              value={form.fechaInicio}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Fecha fin *</label>
            <input
              type="date"
              name="fechaFin"
              value={form.fechaFin}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ======================================================
            IMAGEN (URL O ARCHIVO)
        ====================================================== */}
        <label>Imagen (URL opcional)</label>
        <input
          type="text"
          name="imagenUrl"
          placeholder="https://mi-banner.com/img.png"
          value={form.imagenUrl}
          onChange={(e) => {
            handleChange(e);
            setPreview(e.target.value || null);
          }}
        />

        <label>O subir archivo</label>
        <input type="file" accept="image/*" onChange={handleImageInput} />

        {/* ======================================================
            ESTADO
        ====================================================== */}
        <label className="switch-label">
          Activa
          <input
            type="checkbox"
            name="activa"
            checked={form.activa}
            onChange={handleChange}
          />
        </label>

        {/* ======================================================
            BOTONES
        ====================================================== */}
        <div className="form-buttons">
          <button type="submit" className="btn-guardar">
            Guardar
          </button>

          <button type="button" className="btn-cancelar" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
