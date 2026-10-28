import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const routeConfig = JSON.parse(await fs.readFile('dist/seo-routes.json', 'utf8'));
const functionSource = await fs.readFile('../infra/aws/comanda-seo-router.js', 'utf8');
const noIndexFunctionSource = await fs.readFile('../infra/aws/admin-noindex-response.js', 'utf8');
const route = (host, uri, querystring = {}) => vm.runInNewContext(functionSource + ';handler', {})({ request: { uri, querystring, headers: { host: { value: host } } } });
const respond = host => vm.runInNewContext(noIndexFunctionSource + ';handler', {})({ request: { headers: { host: { value: host } } }, response: { statusCode: 200, headers: {} } });
const embeddedFunction = (template, resource, nextResource) => template.split(`  ${resource}:`)[1].split(`  ${nextResource}:`)[0].split(/      FunctionCode: \|\r?\n/)[1].split(/\r?\n/).map(line => line.replace(/^        /, '')).join('\n').trim();

test('all public pages ship readable content, a unique canonical and valid structured data', async () => {
  for (const page of ['/inicio', ...routeConfig.pages]) {
    const file = page === '/inicio' ? 'landing.html' : `seo/${page.slice(1).replaceAll('/', '-')}.html`;
    const html = await fs.readFile(`dist/${file}`, 'utf8');
    assert.match(html, /<h1[ >]/);
    assert.doesNotMatch(html, /name="robots" content="noindex/);
    const expected = routeConfig.origin + (page === '/inicio' ? routeConfig.homePath : page);
    assert.ok(html.includes(`rel="canonical" href="${expected}"`));
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    const schema = JSON.parse(html.match(/id="comanda-structured-data" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.ok(schema['@graph'].some(node => node['@type'] === 'Organization' && node.name === 'Comanda'));
    assert.doesNotMatch(html, /aggregateRating|reviewCount/);
  }
});
test('administration is noindex; sitemap and robots identify only public canonical URLs', async () => {
  assert.match(await fs.readFile('dist/index.html', 'utf8'), /name="robots" content="noindex,nofollow,noarchive"/);
  const sitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, routeConfig.pages.length + 1);
  assert.doesNotMatch(sitemap, /\/admin|\/login|\?plan|\/superadmin/);
  assert.ok((await fs.readFile('dist/robots.txt', 'utf8')).includes(`Sitemap: ${routeConfig.origin}/sitemap.xml`));
});
test('every admin response is noindex while all commercial hosts stay indexable', async () => {
  assert.equal(respond('admin.somoscomanda.com').headers['x-robots-tag'].value, 'noindex, nofollow, noarchive');
  assert.equal(respond('www.somoscomanda.com').headers['x-robots-tag'], undefined);
  assert.equal(respond('somoscomanda.com').headers['x-robots-tag'], undefined);
  const template = await fs.readFile('../infra/aws/static-frontends.yml', 'utf8');
  assert.match(template, /EventType: viewer-response\s+FunctionARN: !GetAtt AdminNoIndexFunction\.FunctionARN/);
  const embedded = embeddedFunction(template, 'AdminNoIndexFunction', 'AdminDistribution');
  assert.equal(embedded, noIndexFunctionSource.replaceAll('\r\n', '\n').trim());
});
test('the canonical host, old URLs and private routes preserve working destinations', () => {
  assert.equal(route('somoscomanda.com', '/').headers.location.value, 'https://www.somoscomanda.com/');
  assert.equal(route('www.somoscomanda.com', '/inicio').headers.location.value, 'https://www.somoscomanda.com/');
  assert.equal(route('www.somoscomanda.com', '/admin').headers.location.value, 'https://admin.somoscomanda.com/admin');
  assert.equal(route('admin.somoscomanda.com', '/').uri, '/index.html');
  assert.equal(route('admin.somoscomanda.com', '/productos').uri, '/index.html');
  assert.equal(route('admin.somoscomanda.com', '/descubre').headers['x-robots-tag'].value, 'noindex, nofollow, noarchive');
  assert.equal(route('admin.somoscomanda.com', '/inicio', { modo: { value: 'activar' }, plan: { value: 'premium' } }).uri, '/activation.html');
  assert.equal(route('www.somoscomanda.com', '/login', { plan: { value: 'pro' } }).headers.location.value, 'https://admin.somoscomanda.com/login?plan=pro');
});
test('all published content routes resolve and missing pages return a real 404', () => {
  for (const page of routeConfig.pages) assert.equal(route('www.somoscomanda.com', page).uri, `/seo/${page.slice(1).replaceAll('/', '-')}.html`);
  assert.equal(route('www.somoscomanda.com', '/no-existe').statusCode, 404);
  assert.equal(route('admin.somoscomanda.com', '/no-existe').headers['x-robots-tag'].value, 'noindex,follow');
  assert.equal(route('www.somoscomanda.com', '/assets/missing.js').uri, '/assets/missing.js');
  assert.equal(route('www.somoscomanda.com', '/robots.txt').uri, '/robots.txt');
});
test('the commercial router is separate from the existing restaurant menu router', async () => {
  const template = await fs.readFile('../infra/aws/static-frontends.yml', 'utf8');
  const menuSection = template.split('  MenuDistribution:')[1].split('  AdminBucketPolicy:')[0];
  assert.match(menuSection, /FunctionARN: !GetAtt SpaRewriteFunction.FunctionARN/);
  const embedded = embeddedFunction(template, 'CommercialSeoFunction', 'AdminNoIndexFunction');
  assert.equal(embedded, functionSource.replaceAll('\r\n', '\n').trim());
});

test('public identity uses the approved orange book with crawlable square assets', async () => {
  for (const filename of ['landing.html', ...routeConfig.pages.map(p => `seo/${p.slice(1).replaceAll('/', '-')}.html`)]) {
    const html = await fs.readFile(`dist/${filename}`, 'utf8');
    const explicitIcons = [...html.matchAll(/<link\b[^>]*\brel="icon"[^>]*>/g)];
    assert.equal(explicitIcons.length, 1, 'one unambiguous search favicon per public page');
    assert.ok(explicitIcons[0][0].includes(`href="${routeConfig.origin}/brand/comanda-favicon-96.png"`));
    assert.match(explicitIcons[0][0], /type="image\/png" sizes="96x96"/);
    assert.doesNotMatch(html, /rel="(?:shortcut )?icon"[^>]*(?:vite\.svg|brevia-tab-icon)/);
    const schema = JSON.parse(html.match(/id="comanda-structured-data" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const organization = schema['@graph'].find(n => n['@type'] === 'Organization');
    assert.equal(organization.logo.url, routeConfig.origin + '/brand/comanda-favicon-512.png');
    assert.equal(organization.logo.width, 512);
    assert.ok(schema['@graph'].some(n => n['@type'] === 'WebApplication' && n.provider['@id'] === organization['@id']));
    assert.match(html, /name="twitter:image"/);
    assert.doesNotMatch(html, /src="\/brand\/comanda-icon.png"/);
  }
  for (const size of [96, 192, 512]) {
    const png = await fs.readFile(`dist/brand/comanda-favicon-${size}.png`);
    assert.equal(png.subarray(1,4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size);
  }
  assert.equal((await fs.readFile('dist/favicon.ico')).readUInt16LE(2), 1);
});
test('guide navigation targets existing readable sections without broken fragments', async () => {
  for (const page of routeConfig.pages) {
    const html = await fs.readFile(`dist/seo/${page.slice(1).replaceAll('/', '-')}.html`, 'utf8');
    assert.match(html, /aria-label="En esta página"/);
    const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
    assert.ok(anchors.length >= 5);
    assert.equal(new Set(anchors).size, anchors.length);
    for (const anchor of anchors) assert.ok(html.includes(`id="${anchor}"`));
  }
});
