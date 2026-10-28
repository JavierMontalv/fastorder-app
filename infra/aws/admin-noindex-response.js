function handler(event) {
  var response = event.response;
  var host = event.request.headers.host && event.request.headers.host.value;
  if (host && host.toLowerCase() === 'admin.somoscomanda.com') {
    response.headers['x-robots-tag'] = { value: 'noindex, nofollow, noarchive' };
  }
  return response;
}
