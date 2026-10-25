# Auditoría operativa

La interfaz consulta GET /api/auditoria con el JWT y la sede activa existentes. Solo admin/owner de esa sede pueden leer. No acepta un restauranteId del navegador para ampliar el ámbito. Las métricas y filtros describen los registros cargados, no totales globales.

## Cobertura

Se reutiliza auditorias y req.auditar. Los controladores que ya registraban cambios conservan sus eventos, diferencias y notificaciones críticas IA. Una captura central añade un evento si una solicitud POST/PUT/PATCH/DELETE autenticada no generó uno explícito. Incluye reservas, ajustes, cargas y operaciones futuras bajo el middleware. Registra método, ruta sin parámetros de consulta, identidad validada, sede, estado HTTP y referencia aleatoria generada en servidor. También registra accesos exitosos con identidad del controlador de login.

No equivale a registrar cualquier clic: lecturas, navegación, cierre de sesión local, intentos de login sin identidad validada, conexiones interrumpidas, escrituras directas a DB y procesos/socket sin evento explícito quedan fuera. No se inventan valores previos ni éxito de negocio a partir del estado HTTP: el evento genérico describe una solicitud finalizada. Los eventos explícitos anteriores se muestran como registrados, no se recalifica su resultado.

## Economía y privacidad

Una consulta indexable por entidad/sede, rango acotado y cursor id, máximo 31 filas para devolver 30 y detectar siguiente página. Sin COUNT, OFFSET, polling, llamadas IA, servicios AWS nuevos ni duplicación de imágenes/cuerpos completos de solicitudes. Metadatos hasta 6 KB con profundidad/listas/textos limitados y protección recursiva de credenciales y datos personales comunes. Se preserva la tabla y su historial; no hay borrado automático. Revisar crecimiento real antes de definir una política de archivo o retención; no se promete un costo fijo.

La auditoría existente sigue siendo fail-open: un fallo de persistencia se informa al logger y no impide operar. No es una bitácora transaccional infalible ni resistente a cambios de un administrador de DB. Para garantías de no pérdida ante caídas se requiere outbox dentro de cada transacción, especialmente financiera. No llamar a este mecanismo prueba legal inmutable.

## Entrega backend

infra/aws/audit-backend contiene únicamente los archivos del backend productivo que cambian y los nuevos módulos. base-hashes.json identifica la fuente obtenida de producción el 25/10/2026. No sustituir backend/ (copia antigua) ni sincronizarlo a producción. Verificar hashes, respaldar archivos, comprobar sintaxis, reiniciar PM2, validar health/401, y restaurar respaldo si falla. No modifica esquema ni datos históricos.

Pruebas: node --test infra/aws/audit-backend/tests/audit.test.mjs. Cubren redacción, límites, selección de mutaciones, deduplicación, resultado HTTP, autorización, aislamiento de sede y cursor. La prueba visual usa datos simulados; no altera restaurantes reales.
