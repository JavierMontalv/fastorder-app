import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

await build({ build: { ssr: 'scripts/prerender-entry.jsx', outDir: '.seo-build', emptyOutDir: true, minify: false } });
const { render, publicPages, pageMetadata, structuredData, SITE_ORIGIN, HOME_PATH } = await import(pathToFileURL(path.resolve('.seo-build/prerender-entry.js')).href);
const configResponse = await fetch('https://api.somoscomanda.com/api/public/comercial/config', { signal: AbortSignal.timeout(15000) });
if (!configResponse.ok) throw new Error(`No se pueden publicar precios sin validar: HTTP ${configResponse.status}`);
const portal = (await configResponse.json()).data;
if (!portal?.plans?.cards?.length) throw new Error('La configuración de planes no es válida');
const snapshot = { plans: portal.plans, payment: { setupState: { checkoutReady: Boolean(portal.payment?.setupState?.checkoutReady) } } };
const shell = await fs.readFile('dist/index.html', 'utf8');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
await fs.mkdir('dist/seo', { recursive: true });
await fs.writeFile('dist/activation.html', shell);
for (const route of ['/inicio', ...publicPages.map(p => p.path)]) {
  const metadata = pageMetadata(route);
  const tags = `<meta name="robots" content="index,follow,max-image-preview:large" />
<link rel="canonical" href="${metadata.canonical}" />
<meta property="og:type" content="website" /><meta property="og:site_name" content="Comanda" />
<meta property="og:locale" content="es_CO" /><meta property="og:title" content="${escape(metadata.title)}" />
<meta property="og:description" content="${escape(metadata.description)}" /><meta property="og:url" content="${metadata.canonical}" />
<meta property="og:image" content="${SITE_ORIGIN}/brand/comanda-social.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" /><script id="comanda-structured-data" type="application/ld+json">${json(structuredData(route))}</script>`;
  const html = shell.replace(/<title>.*?<\/title>/s, `<title>${escape(metadata.title)}</title>`)
    .replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${escape(metadata.description)}" />`)
    .replace(/<meta name="robots" content=".*?"\s*\/>/, tags)
    .replace('<div id="root"></div>', `<div id="root">${render(route, snapshot)}</div><script id="comanda-public-data" type="application/json">${json(snapshot)}</script>`);
  const file = route === '/inicio' ? 'landing.html' : `seo/${route.slice(1).replaceAll('/', '-')}.html`;
  await fs.writeFile(`dist/${file}`, html);
}
const urls = [SITE_ORIGIN + HOME_PATH, ...publicPages.map(p => SITE_ORIGIN + p.path)];
await fs.writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
await fs.writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
await fs.writeFile('dist/seo-routes.json', JSON.stringify({ origin: SITE_ORIGIN, homePath: HOME_PATH, pages: publicPages.map(p => p.path) }));
await fs.writeFile('dist/404.html', `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Página no encontrada | Comanda</title><style>body{font-family:system-ui;background:#faf9f5;color:#182821;max-width:620px;margin:15vh auto;padding:24px}a{color:#c7472e}h1{font-size:42px}</style></head><body><p>COMANDA</p><h1>Esta página no está disponible.</h1><p>Encuentra los planes y la información del servicio en nuestra página de Inicio.</p><a href="${SITE_ORIGIN + HOME_PATH}">Ir a Comanda →</a></body></html>`);
console.log(`SEO: ${urls.length} páginas públicas generadas en ${SITE_ORIGIN}.`);
