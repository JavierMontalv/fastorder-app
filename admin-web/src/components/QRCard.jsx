import '../styles/Configuracion.css';

export default function QRCard({ qrUrl, menuUrl, onDownload, onCopy, onOpen }) {
  return (
    <div className="config-qr-card">
      <div className="config-qr-head">
        <strong>QR del restaurante</strong>
        <span>Acceso rápido al menú digital</span>
      </div>

      {qrUrl ? (
        <>
          <div className="config-qr-preview">
            <img src={qrUrl} alt="QR del restaurante" className="config-qr-image" />
          </div>

          <div className="config-qr-link">
            <span>Enlace público</span>
            <strong>{menuUrl}</strong>
          </div>

          <div className="config-qr-actions">
            <button type="button" className="config-inline-btn" onClick={onDownload}>
              Descargar PNG
            </button>
            <button type="button" className="config-inline-btn ghost" onClick={onOpen}>
              Abrir app
            </button>
            <button type="button" className="config-inline-btn ghost" onClick={onCopy}>
              Copiar enlace
            </button>
          </div>
        </>
      ) : (
        <div className="config-qr-empty">
          <p>El QR aparecerá automáticamente cuando la configuración esté disponible.</p>
        </div>
      )}
    </div>
  );
}
