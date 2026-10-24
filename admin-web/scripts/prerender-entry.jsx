import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import Inicio from '../src/pages/Inicio';
import ComandaResource from '../src/pages/ComandaResource';
import { publicPages } from '../src/seo/site.mjs';
export { publicPages, pageMetadata, structuredData, SITE_ORIGIN, HOME_PATH } from '../src/seo/site.mjs';

export function render(path, portal) {
  const page = publicPages.find(p => p.path === path);
  return renderToString(<StaticRouter location={path}>{page ? <ComandaResource page={page} /> : <Inicio initialPortal={portal} />}</StaticRouter>);
}
