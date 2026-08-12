# Brigadas Salud VIP

Formulario web de registro para las brigadas de **VIP Salud Ocupacional**. El proyecto funciona como sitio estático, está conectado a GitHub y puede publicarse automáticamente en **Netlify**.

> **Documentación actualizada: 12 de agosto de 2026.**

## Objetivo

El formulario permite recopilar la información necesaria del paciente antes de continuar con el proceso operativo de salud ocupacional y BIOFILE.

Actualmente incluye:

- datos de identificación y contacto;
- información personal y laboral;
- lugar y fecha de nacimiento;
- selección de país de nacimiento con listado internacional ampliado;
- dirección y datos de residencia;
- fotografía tomada desde la cámara;
- firma;
- consulta complementaria de órdenes/exámenes existentes;
- envío de la información mediante Google Apps Script;
- diseño responsive para computador y celular;
- identidad gráfica de VIP Salud Ocupacional.

## Flujo general

```text
Paciente abre formulario
        │
        ├── Completa datos personales/laborales
        ├── Selecciona lugar de nacimiento
        ├── Permite cámara y toma fotografía
        ├── Registra firma
        │
        ├── Consulta complementaria de orden/exámenes
        │
        └── Envía registro
                 │
                 ▼
          Google Apps Script
                 │
                 ▼
          Google Sheets / flujo BIOFILE
```

## Lugar de nacimiento

El formulario fue ampliado para manejar **todos los países incluidos en el registro**, no solamente Colombia.

Esta mejora trabaja en conjunto con `biofile-render-endpoint`, que posteriormente interpreta municipio/departamento/país y busca la opción más adecuada dentro de BIOFILE.

Para Colombia se conserva el detalle de ciudad/municipio cuando está disponible. Para registros internacionales se conserva el país seleccionado para que el robot pueda aplicar sus reglas de equivalencias y capitales de respaldo cuando sea necesario.

## Cámara y fotografía

La captura de fotografía recibió varias mejoras para que sea más clara para el usuario y funcione mejor desde celular.

### Fondo VIP automático

El proyecto incluye:

```text
fondo-camara-vip.png
```

Este recurso se utiliza como fondo visual durante la experiencia de cámara para reducir la distracción del entorno y orientar al usuario a ubicar correctamente el rostro.

### Optimización móvil

La implementación fue ajustada para:

- abrir la cámara de forma más estable en celulares;
- mejorar el comportamiento del desenfoque/fondo;
- mantener visible el rostro dentro de la zona indicada;
- evitar que el usuario interprete la captura como una fotografía de la cédula;
- conservar una experiencia responsive.

El navegador debe tener permiso para utilizar la cámara. En producción se recomienda siempre servir el sitio mediante **HTTPS**, como lo hace Netlify.

## Funcionamiento de los dos Apps Script

El archivo `index.html` utiliza dos servicios diferentes y no deben intercambiarse.

### `URL_APPS_SCRIPT`

Guarda el registro principal y gestiona la información enviada por el formulario, incluyendo los recursos asociados al paciente según el flujo configurado.

### `URL_APPS_SCRIPT_ORDEN`

Consulta el Sheet Maestro para verificar si la identificación ya tiene una orden y mostrar los exámenes asociados.

La consulta de orden es **complementaria y no debe bloquear el registro**. Si no existe coincidencia o el servicio presenta una falla temporal, el formulario debe poder continuar con su funcionamiento principal.

## Archivos principales

```text
index.html                  Formulario completo y lógica JavaScript
fondo-camara-vip.png        Fondo utilizado en la experiencia de cámara
logo-vip.png                Identidad gráfica principal
favicon.ico                 Favicon principal
favicon-16x16.png           Favicon 16 px
favicon-32x32.png           Favicon 32 px
apple-touch-icon.png        Icono para dispositivos Apple
android-chrome-*.png        Iconos para dispositivos compatibles
netlify.toml                Configuración de publicación
_headers                    Cabeceras del sitio
README.md                   Documentación general
CHANGELOG.md                Historial de versiones
VERSION.txt                 Referencia de versión
docs/                       Guías complementarias
```

## Publicación en Netlify

No requiere `npm`, compilación ni instalación de dependencias.

Configuración esperada:

```text
Rama de producción: main
Directorio base: vacío
Comando de compilación: vacío
Directorio de publicación: .
```

El archivo `netlify.toml` contiene la configuración necesaria para servir el proyecto como sitio estático.

Cuando Netlify está conectado al repositorio, los cambios enviados a `main` pueden generar un nuevo despliegue automáticamente.

## Prueba local opcional

Desde la carpeta del proyecto:

```bash
python -m http.server 5500
```

Después abra:

```text
http://localhost:5500
```

Para probar la cámara, permita el acceso cuando el navegador lo solicite. Algunas funciones de cámara pueden comportarse de forma diferente fuera de HTTPS; la validación final debe hacerse también sobre el sitio publicado.

## Seguridad

- No agregar contraseñas al HTML.
- No subir archivos JSON de cuentas de servicio.
- No guardar tokens privados en GitHub.
- Las URLs de Apps Script utilizadas por el navegador son parte de la integración del frontend, pero las credenciales administrativas deben mantenerse fuera del repositorio.
- La lógica sensible de BIOFILE se mantiene en el backend `biofile-render-endpoint`, no en este sitio estático.

## Relación con otros repositorios VIP

```text
brigadas-salud-vip
        │
        ├── recopila datos, foto y firma
        ▼
Google Sheets / Apps Script
        │
        ▼
biofile-render-endpoint
        │
        ▼
BIOFILE

panel-gestion-biofile-vip
        └── permite al equipo revisar y procesar esos registros
```

## Cambios recientes consolidados

### 4 de agosto de 2026

- Fondo VIP automático para la experiencia de cámara.
- Corrección y conservación del fondo durante la captura.
- Favicon e identidad visual ajustados.
- Cámara y desenfoque optimizados para celulares.

### 12 de agosto de 2026

- Lista de países ampliada para el registro de nacimiento.
- Versión actual aplicada al sitio desplegado mediante Netlify.

---

**VIP Salud Ocupacional — Registro de Brigadas**
