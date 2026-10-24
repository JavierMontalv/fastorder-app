function handler(event) {
  var request = event.request;
  var host = request.headers.host.value.toLowerCase();
  var uri = request.uri || '/';
  var query = request.querystring || {};
  var queryParts = [];
  Object.keys(query).forEach(function (key) {
    var values = query[key].multiValue || [query[key]];
    values.forEach(function (item) { queryParts.push(key + '=' + item.value); });
  });
  var search = queryParts.length ? '?' + queryParts.join('&') : '';
  function redirect(url) {
    return { statusCode: 301, statusDescription: 'Moved Permanently', headers: { location: { value: url }, 'cache-control': { value: 'public,max-age=300' } } };
  }
  if (host === 'somoscomanda.com') return redirect('https://www.somoscomanda.com' + uri + search);
  var routes = {
    '/menu-qr-restaurantes': '/seo/menu-qr-restaurantes.html',
    '/pedidos-qr-por-mesa': '/seo/pedidos-qr-por-mesa.html',
    '/planes-comanda': '/seo/planes-comanda.html',
    '/guias/menu-qr-o-pdf': '/seo/guias-menu-qr-o-pdf.html'
  };
  var trimmed = uri.length > 1 && uri.charAt(uri.length - 1) === '/' ? uri.slice(0, -1) : uri;
  if (routes[trimmed]) {
    if (host === 'admin.somoscomanda.com') return redirect('https://www.somoscomanda.com' + trimmed + search);
    if (trimmed !== uri) return redirect('https://www.somoscomanda.com' + trimmed + search);
    request.uri = routes[trimmed]; return request;
  }
  var isActivation = query.modo || query.plan;
  if (uri === '/inicio' || uri === '/inicio/') {
    if (host === 'admin.somoscomanda.com' && isActivation) { request.uri = '/activation.html'; return request; }
    return redirect('https://www.somoscomanda.com/' + search);
  }
  if (uri === '/descubre') return redirect('https://www.somoscomanda.com/' + search);
  if (uri === '/') { request.uri = host === 'admin.somoscomanda.com' ? '/index.html' : '/landing.html'; return request; }
  var privateRoute = /^\/(admin|login|cambiar-password|onboarding|pedidos|productos|reservas|promociones|categorias|configuracion|analiticas|auditoria|usuarios|soporte-ia|superadmin|display)(\/|$)/.test(uri) || uri === '/planes/gracias';
  if (privateRoute) {
    if (host !== 'admin.somoscomanda.com') return redirect('https://admin.somoscomanda.com' + uri + search);
    request.uri = '/index.html'; return request;
  }
  var segment = uri.substring(uri.lastIndexOf('/') + 1);
  if (segment.indexOf('.') !== -1) return request;
  return { statusCode: 404, statusDescription: 'Not Found', headers: { 'content-type': { value: 'text/html; charset=utf-8' }, 'x-robots-tag': { value: 'noindex,follow' }, 'cache-control': { value: 'public,max-age=60' } }, body: { encoding: 'text', data: '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página no encontrada | Comanda</title><body style="font-family:system-ui;background:#faf9f5;color:#182821;padding:10vh 8vw"><p>COMANDA</p><h1>Esta página no está disponible.</h1><a href="https://www.somoscomanda.com/">Volver a Comanda</a></body></html>' } };
}
