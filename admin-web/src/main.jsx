import ReactDOM from 'react-dom/client';
import './styles/PublicFonts.css';
import './index.css';
import './styles/Theme.css';
import './styles/ComandaInicio.css';

const root = document.getElementById('root');
const publicPaths = ['/inicio', '/menu-qr-restaurantes', '/pedidos-qr-por-mesa', '/planes-comanda', '/guias/menu-qr-o-pdf'];
const path = window.location.pathname.replace(/\/$/, '') || '/';
const isPublic = publicPaths.includes(path) || (path === '/' && window.location.hostname !== 'admin.somoscomanda.com' && !window.localStorage.getItem('comanda_token'));

if (isPublic) {
  const { default: PublicApp } = await import('./PublicApp');
  const snapshot = document.getElementById('comanda-public-data');
  const initialPortal = snapshot ? JSON.parse(snapshot.textContent) : null;
  const app = <PublicApp initialPortal={initialPortal} />;
  if (root.hasChildNodes() && snapshot) ReactDOM.hydrateRoot(root, app);
  else ReactDOM.createRoot(root).render(app);
} else {
  const { default: App } = await import('./App');
  await import('./styles/Responsive.css');
  await import('@fontsource-variable/inter');
  await import('react-toastify/dist/ReactToastify.css');
  ReactDOM.createRoot(root).render(<App />);
}
