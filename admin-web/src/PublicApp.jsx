import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Inicio from './pages/Inicio';
import ComandaResource from './pages/ComandaResource';
import { publicPages } from './seo/site.mjs';

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function PublicApp({ initialPortal }) {
  return <BrowserRouter><ScrollReset /><Routes><Route path="/" element={<Inicio initialPortal={initialPortal} />} /><Route path="/inicio" element={<Inicio initialPortal={initialPortal} />} />{publicPages.map(page => <Route key={page.path} path={page.path} element={<ComandaResource page={page} />} />)}</Routes></BrowserRouter>;
}
