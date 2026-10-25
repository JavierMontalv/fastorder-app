import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageMetadata, SITE_ORIGIN, structuredData } from './site.mjs';

export default function PublicMetadata({ path = '/inicio' }) {
  const { search } = useLocation();
  useEffect(() => {
    const metadata = pageMetadata(path);
    document.title = metadata.title;
    function meta(selector, attr, value) {
      let el = document.head.querySelector(selector);
      if (!el) { el = document.createElement('meta'); const match = selector.match(/\[(name|property)="(.*?)"\]/); el.setAttribute(match[1], match[2]); document.head.appendChild(el); }
      el.setAttribute(attr, value);
    }
    meta('meta[name="description"]', 'content', metadata.description);
    meta('meta[name="robots"]', 'content', new URLSearchParams(window.location.search).has('modo') ? 'noindex,follow' : 'index,follow,max-image-preview:large');
    meta('meta[property="og:type"]', 'content', 'website');
    meta('meta[property="og:site_name"]', 'content', 'Comanda');
    meta('meta[property="og:locale"]', 'content', 'es_CO');
    meta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    meta('meta[name="twitter:title"]', 'content', metadata.title);
    meta('meta[name="twitter:description"]', 'content', metadata.description);
    meta('meta[name="twitter:image"]', 'content', SITE_ORIGIN + '/brand/comanda-social.png');
    meta('meta[name="twitter:image:alt"]', 'content', 'Comanda: menú QR y pedidos para restaurantes');
    meta('meta[property="og:image:alt"]', 'content', 'Comanda: menú QR y pedidos para restaurantes');
    meta('meta[property="og:title"]', 'content', metadata.title);
    meta('meta[property="og:description"]', 'content', metadata.description);
    meta('meta[property="og:url"]', 'content', metadata.canonical);
    meta('meta[property="og:image"]', 'content', SITE_ORIGIN + '/brand/comanda-social.png');
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = metadata.canonical;
    let schema = document.getElementById('comanda-structured-data');
    if (!schema) { schema = document.createElement('script'); schema.id = 'comanda-structured-data'; schema.type = 'application/ld+json'; document.head.appendChild(schema); }
    schema.textContent = JSON.stringify(structuredData(path));
  }, [path, search]);
  return null;
}
