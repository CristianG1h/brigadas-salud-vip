# Brigadas Salud VIP

Formulario web de registro para las brigadas de **VIP Salud Ocupacional**.

Este repositorio está listo para publicarse como sitio estático en Netlify y quedar conectado a GitHub para despliegue automático.

## Archivos principales

```text
index.html       Formulario completo y código JavaScript.
logo-vip.png     Logo, favicon e imagen principal.
netlify.toml     Configuración de publicación para Netlify.
README.md        Documentación del proyecto.
CHANGELOG.md     Historial de versiones.
docs/            Guías de publicación y comprobación.
```

## Funcionamiento de los dos Apps Script

El archivo `index.html` utiliza dos direcciones diferentes:

1. `URL_APPS_SCRIPT`: guarda el registro, la foto y la firma en el sistema operativo de BIOFILE.
2. `URL_APPS_SCRIPT_ORDEN`: consulta el Sheet Maestro para saber si la identificación ya tiene una orden y mostrar los exámenes.

No intercambie estas direcciones. La consulta de la orden es complementaria: si no encuentra coincidencia o falla temporalmente, el formulario debe continuar normalmente.

## Publicación en Netlify

No requiere `npm`, compilación ni instalación de dependencias.

Configuración esperada:

```text
Rama de producción: main
Directorio base: vacío
Comando de compilación: vacío
Directorio de publicación: .
```

El archivo `netlify.toml` ya define el directorio de publicación.

## Prueba local opcional

Desde esta carpeta, abra una terminal y ejecute:

```bash
python -m http.server 5500
```

Luego abra:

```text
http://localhost:5500
```

Para probar la cámara, permita el acceso cuando el navegador lo solicite.

## Seguridad del repositorio

Se recomienda crear el repositorio como **privado**. Las direcciones de Apps Script están incluidas en el JavaScript del navegador porque el formulario necesita utilizarlas, pero no deben agregarse contraseñas, archivos JSON de cuentas de servicio ni credenciales privadas al repositorio.

## Verificación de acceso

Conexión de escritura de GitHub verificada correctamente el 8 de agosto de 2026.
