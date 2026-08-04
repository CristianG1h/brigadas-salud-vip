# Historial de cambios

## 1.0.0 — 2026-08-04

- Se toma como base el archivo más actualizado entregado: `index (8).html`.
- Se conserva el Apps Script principal encargado de guardar registros, fotografías y firmas.
- Se conserva un segundo Apps Script para consultar órdenes del Sheet Maestro.
- La consulta del Maestro es opcional y no bloquea el registro cuando no existe coincidencia o cuando ocurre un error.
- Se muestra en pantalla la empresa, el tipo de examen y la lista de pruebas cuando existe una orden.
- Los municipios y afiliaciones permanecen incorporados dentro del HTML.
- Se incluye el logo local requerido por el formulario.
- Se agrega configuración para GitHub y despliegue continuo en Netlify.


## 1.1.0 — 2026-08-04
- Se agregó favicon.ico y versiones 16x16, 32x32 y Apple Touch.
- Se agregó manifest y control de caché para Netlify.
- Se forzó la actualización del icono con versión `?v=2`.
