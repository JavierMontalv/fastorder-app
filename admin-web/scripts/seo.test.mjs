import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const routeConfig = JSON.parse(await fs.readFile('dist/seo-routes.json', 'utf8'));
const functionSource = await fs.readFile('../infra/aws/comanda-seo-router.js', 'utf8');
const route = (host, uri, querystring = {}) => vm.runInNewContext(functionSource + ';handler', {})({ request: { uri, querystring, headers: { host: { value: host } } } });

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
  assert.match(await fs.readFile('dist/index.html', 'utf8'), /name="robots" content="noindex,follow"/);
  const sitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, routeConfig.pages.length + 1);
  assert.doesNotMatch(sitemap, /\/admin|\/login|\?plan|\/superadmin/);
  assert.ok((await fs.readFile('dist/robots.txt', 'utf8')).includes(`Sitemap: ${routeConfig.origin}/sitemap.xml`));
});
test('the canonical host, old URLs and private routes preserve working destinations', () => {
  assert.equal(route('somoscomanda.com', '/').headers.location.value, 'https://www.somoscomanda.com/');
  assert.equal(route('www.somoscomanda.com', '/inicio').headers.location.value, 'https://www.somoscomanda.com/');
  assert.equal(route('www.somoscomanda.com', '/admin').headers.location.value, 'https://admin.somoscomanda.com/admin');
  assert.equal(route('admin.somoscomanda.com', '/').uri, '/index.html');
  assert.equal(route('admin.somoscomanda.com', '/productos').uri, '/index.html');
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
  const embedded = template.split('  CommercialSeoFunction:')[1].split('  AdminDistribution:')[0].split('      FunctionCode: |\n')[1].split('\n').map(line => line.replace(/^        /, '')).join('\n').trim();
  assert.equal(embedded, functionSource.trim());
});
