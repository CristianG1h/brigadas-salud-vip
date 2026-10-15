# Recuperación del formulario y fotografía

El formulario guarda un borrador en `sessionStorage` de la pestaña, con vencimiento a las 12 horas sin cambios. Recupera campos, selecciones dependientes, relación acuerdo/empresa en misión, paso, fotografía y firma. Al volver desde el paso final se presenta el paso de foto/firma para revisarlo. No comparte el borrador entre pestañas ni garantiza recuperación tras cerrar el navegador.

Se elimina al completar el envío o mediante «Borrar borrador y empezar de nuevo». Los errores de almacenamiento se muestran al usuario. Una respuesta de error del receptor conserva los datos. No se modifica el contrato existente de Google Apps Script.

La alternativa a la cámara admite JPG, PNG y WebP de hasta 10 MB, comprueba que la imagen se decodifique y la convierte a JPEG de hasta 1000 píxeles por lado. El texto solicita una foto del rostro; no hay reconocimiento facial.

Las consultas de barrios tienen un límite de 12 segundos, caché en memoria por localidad y descarte de respuestas antiguas. Si falla el servicio sigue disponible el ingreso manual del barrio.

Se incluyen los cambios que antes se aplicaban durante el build para verificar el mismo formulario que se publica. Los patches existentes son idempotentes. El patch de países admite archivos con saltos de línea Windows.

## Pruebas reproducibles

Colocar `brigadas-salud-vip`, `biofile-render-endpoint` y `panel-gestion-biofile-vip` como carpetas hermanas. Instalar dependencias y Chromium desde el backend: `npm ci` y `npx playwright install chromium`.

- `node scripts/test-registro-resiliente.mjs`: recuperación, barrio, acuerdo/empresa, cámara denegada, adjunto, envío fallido, limpieza al enviar y caducidad.
- `node scripts/test-todos-nacimientos.mjs`: todas las opciones del formulario construido; selección del robot en Chromium con sugerencias controladas; respaldo de Bogotá escribiendo primero `bogota` y registro del cambio.

No se envían datos reales a los servicios externos en estas pruebas. Las opciones controladas verifican el algoritmo, no la cobertura del catálogo privado de BIOFILE.
