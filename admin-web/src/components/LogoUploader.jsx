import { useRef } from 'react';
import '../styles/Configuracion.css';

export default function LogoUploader({ preview, onChange, onRemove }) {
  const fileRef = useRef(null);

  const abrirSelector = () => fileRef.current?.click();

  const manejarArchivo = (e) => {
    onChange?.(e.target.files?.[0] || null);
  };

  return (
    <div className="config-logo-uploader">
      <div className={`config-logo-dropzone ${preview ? 'has-preview' : ''}`} onClick={abrirSelector}>
        {preview ? (
          <img src={preview} alt="Logo del restaurante" className="config-logo-preview" />
        ) : (
          <div className="config-logo-empty">
            <strong>Subir logo</strong>
            <span>PNG, JPG o WEBP · máximo 5 MB</span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.avif,.svg,image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        onChange={manejarArchivo}
        hidden
      />

      <div className="config-logo-actions">
        <button type="button" className="config-inline-btn" onClick={abrirSelector}>
          {preview ? 'Cambiar logo' : 'Seleccionar archivo'}
        </button>

        {preview && (
          <button type="button" className="config-inline-btn ghost" onClick={onRemove}>
            Quitar logo
          </button>
        )}
      </div>
    </div>
  );
}
