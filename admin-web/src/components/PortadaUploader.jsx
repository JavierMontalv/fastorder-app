// admin-web/src/components/PortadaUploader.jsx
// Uploader de foto de portada (banner) del restaurante para el menú QR
import { useRef } from 'react';
import '../styles/Configuracion.css';

export default function PortadaUploader({ preview, onChange, onRemove }) {
  const fileRef = useRef(null);

  const abrirSelector = () => fileRef.current?.click();

  const manejarArchivo = (e) => {
    onChange?.(e.target.files?.[0] || null);
  };

  return (
    <div className="config-portada-uploader">
      <div
        className={`config-portada-dropzone ${preview ? 'has-preview' : ''}`}
        onClick={abrirSelector}
      >
        {preview ? (
          <img src={preview} alt="Foto de portada del restaurante" className="config-portada-preview" />
        ) : (
          <div className="config-portada-empty">
            <span className="config-portada-icon">🖼️</span>
            <strong>Subir foto de portada</strong>
            <span>Se mostrará como banner en el menú QR · PNG, JPG o WEBP · máx 5 MB</span>
            <span className="config-portada-hint">Recomendado: 1200 × 400 px</span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.avif,image/png,image/jpeg,image/webp,image/avif"
        onChange={manejarArchivo}
        hidden
      />

      <div className="config-logo-actions">
        <button type="button" className="config-inline-btn" onClick={abrirSelector}>
          {preview ? 'Cambiar portada' : 'Seleccionar imagen'}
        </button>
        {preview && (
          <button type="button" className="config-inline-btn ghost" onClick={onRemove}>
            Quitar portada
          </button>
        )}
      </div>
    </div>
  );
}
