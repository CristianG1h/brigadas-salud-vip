# Paso a paso: GitHub + Netlify

## Parte 1. Crear el repositorio en GitHub

1. Descomprima el ZIP del proyecto.
2. Entre a GitHub y cree un repositorio nuevo.
3. Nombre recomendado: `brigadas-salud-vip`.
4. Seleccione **Private**.
5. Puede crear el repositorio vacío, sin agregar archivos adicionales.
6. Dentro del repositorio, seleccione **Add file > Upload files**.
7. Abra la carpeta descomprimida y arrastre **el contenido interno**, no el ZIP.
8. Confirme que `index.html` quede en la raíz del repositorio.
9. Escriba como mensaje: `Primera versión de Brigadas Salud VIP`.
10. Confirme el commit en la rama `main`.

## Parte 2. Conectar el sitio existente de Netlify

1. Entre a Netlify.
2. Abra el proyecto que actualmente publica `brigadasaludipsvip.netlify.app`.
3. Abra **Project configuration**.
4. Entre a **Build & deploy > Continuous deployment > Repository**.
5. Seleccione **Link repository**.
6. Elija GitHub y autorice el acceso si Netlify lo solicita.
7. Seleccione el repositorio `brigadas-salud-vip`.
8. Use la rama `main`.
9. Deje vacío el comando de compilación.
10. Use `.` como directorio de publicación, si la pantalla lo solicita.
11. Guarde y permita que Netlify haga el primer deploy.

No cree otro sitio de Netlify. La conexión debe hacerse desde el proyecto existente para conservar la dirección actual.

## Parte 3. Actualizar el formulario después

1. Edite y guarde el nuevo `index.html` en su computador.
2. Entre al repositorio en GitHub.
3. Seleccione **Add file > Upload files**.
4. Suba el nuevo archivo con el mismo nombre exacto: `index.html`.
5. Escriba un mensaje claro, por ejemplo: `Mejora validación de documento`.
6. Confirme el commit en `main`.
7. Netlify detectará el cambio y realizará un nuevo deploy automáticamente.
8. Revise **Deploys** en Netlify hasta que aparezca `Published`.
9. Abra el sitio y presione `Ctrl + F5` para evitar una versión guardada en caché.

## Recuperar una versión anterior

GitHub conserva cada commit. Para identificar versiones con facilidad, utilice mensajes concretos en cada cambio. Netlify también conserva los deploys anteriores y permite revisar el historial del sitio.
