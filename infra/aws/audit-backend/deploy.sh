set -Eeuo pipefail
APP=/home/ubuntu/fastorder-app/backend
STAGE=$(mktemp -d /tmp/comanda-audit.XXXXXX)
tar -xzf /tmp/comanda-audit.tgz -C "$STAGE"
cd "$APP"
python3 - "$APP" "$STAGE" <<'PY'
import sys, pathlib, hashlib, json
root, stage=map(pathlib.Path,sys.argv[1:])
for name, expected in json.loads((stage/'base-hashes.json').read_text()).items():
    actual=hashlib.sha256((root/name).read_text().replace('\r\n','\n').encode()).hexdigest()
    if actual != expected: raise SystemExit('La fuente actual cambió: '+name+'. No se reemplazó ningún archivo.')
for name in ['routes/auditRoutes.js','utils/auditPolicy.mjs']:
    if (root/name).exists() and (root/name).read_bytes() != (stage/name).read_bytes(): raise SystemExit('El archivo ya existe con otro contenido: '+name)
print('Fuente productiva verificada; esquema y datos históricos conservados.')
PY
for file in index.js middlewares/auditarAccion.js routes/auditRoutes.js utils/auditPolicy.mjs; do node --check "$STAGE/$file"; done
BACKUP="$APP/backups/audit-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP/middlewares"
cp index.js "$BACKUP/index.js"
cp middlewares/auditarAccion.js "$BACKUP/middlewares/auditarAccion.js"
rollback() {
  cp "$BACKUP/index.js" "$APP/index.js"
  cp "$BACKUP/middlewares/auditarAccion.js" "$APP/middlewares/auditarAccion.js"
  pm2 restart fastorder >/dev/null
  printf 'Se restauró la versión anterior.\n'
}
trap rollback ERR
for file in index.js middlewares/auditarAccion.js routes/auditRoutes.js utils/auditPolicy.mjs; do cp "$STAGE/$file" "$APP/$file"; done
pm2 restart fastorder >/dev/null
for attempt in 1 2 3 4 5 6; do
  if curl --fail --silent http://127.0.0.1:4000/api/health >/dev/null; then break; fi
  sleep 2
done
curl --fail --silent http://127.0.0.1:4000/api/health
printf '\nGUARDIA DE ACCESO: '
CODE=$(curl --silent -o /tmp/comanda-audit-auth-check.json -w '%{http_code}' http://127.0.0.1:4000/api/auditoria)
printf '%s\n' "$CODE"
test "$CODE" = 401 || test "$CODE" = 403
trap - ERR
printf 'Aplicación verificada. Respaldo: %s\n' "$BACKUP"
