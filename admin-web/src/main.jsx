// ======================================================================
// 🚀 COMANDA ADMIN — Entry Point (Enterprise 2026)
// ----------------------------------------------------------------------
// • StrictMode desactivado intencionalmente
// • Comportamiento idéntico a producción
// • Evita remounts artificiales en dashboards
// ======================================================================

import ReactDOM from 'react-dom/client';
import App from './App';

import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/inter';

// =======================
// Estilos globales
// =======================
import './index.css';
import './styles/Theme.css';

// =======================
// React Toastify (OBLIGATORIO)
// =======================
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
