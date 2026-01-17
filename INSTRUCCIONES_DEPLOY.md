# Instrucciones de Despliegue para Servidor de Pruebas

Sigue estos pasos para desplegar las aplicaciones de backend y frontend en un entorno de pruebas.

---

## 1. Despliegue del Backend (Node.js)

El backend es el cerebro de la aplicación. Se encarga de la lógica de negocio y la conexión con la base de datos.

### Pasos:

1.  **Copiar Archivos al Servidor:**
    *   Copia la carpeta completa `backend-ranger-nomina` a una ubicación en tu servidor (ej: `/home/usuario/app/`).
    *   **IMPORTANTE:** No incluyas la carpeta `node_modules` si existe.

2.  **Instalar Dependencias de Producción:**
    *   Navega a la carpeta `backend-ranger-nomina` en la terminal de tu servidor.
    *   Ejecuta el siguiente comando para instalar únicamente las dependencias necesarias para producción:
        ```bash
        npm install --production
        ```

3.  **Configurar Variables de Entorno:**
    *   Dentro de la carpeta `backend-ranger-nomina` en el servidor, crea un archivo llamado `.env`.
    *   Añade las siguientes variables con los valores correspondientes a tu entorno de pruebas (base de datos, etc.):
        ```env
        DB_HOST=tu_host_de_db
        DB_USER=tu_usuario_de_db
        DB_PASSWORD=tu_contraseña_de_db
        DB_DATABASE=tu_nombre_de_db
        JWT_SECRET=una_clave_secreta_muy_segura_y_larga
        PORT=3333
        ```

4.  **Iniciar el Servidor con un Gestor de Procesos (Recomendado):**
    *   Se recomienda usar un gestor de procesos como `pm2` para mantener la aplicación corriendo de forma continua.
    *   Si no tienes `pm2` instalado, instálalo globalmente: `npm install pm2 -g`.
    *   Inicia la aplicación con el siguiente comando:
        ```bash
        pm2 start server.js --name "ranger-nomina-backend"
        ```
    *   Para ver los logs: `pm2 logs ranger-nomina-backend`.

---

## 2. Despliegue del Frontend (Angular)

El frontend contiene todos los archivos visuales con los que el usuario interactúa. Debe ser servido por un servidor web como Nginx o Apache.

### Pasos:

1.  **Localizar los Archivos Compilados:**
    *   Los archivos listos para producción se encuentran en la carpeta: `rangernomina-frontend/dist/rangernomina-frontend/`.

2.  **Copiar Archivos al Servidor Web:**
    *   Copia **todo el contenido** de la carpeta mencionada en el paso anterior al directorio raíz de tu servidor web.
    *   Ejemplos de directorios raíz comunes:
        *   **Nginx:** `/var/www/html`
        *   **Apache:** `/var/www/html` o `htdocs`
        *   **IIS:** `c:\inetpub\wwwroot`

3.  **Configurar Redirecciones del Servidor Web (¡MUY IMPORTANTE!):**
    *   Las aplicaciones de una sola página (SPA) como Angular requieren una configuración especial en el servidor web. Esto asegura que si un usuario refresca la página o accede a una URL directamente (ej: `/empleados`), el servidor siempre devuelva `index.html` y permita que Angular maneje la ruta.
    *   **Ejemplo de configuración para Nginx:**
        ```nginx
        server {
            listen 80;
            server_name tu_dominio_o_ip;

            root /var/www/html; # Ruta donde copiaste los archivos
            index index.html;

            location / {
                try_files $uri $uri/ /index.html;
            }
        }
        ```
    *   **Ejemplo de configuración para Apache (archivo `.htaccess`):**
        *   Crea un archivo `.htaccess` en el mismo directorio donde copiaste los archivos del frontend y añade lo siguiente:
        ```apache
        RewriteEngine On
        # Si no es un archivo o directorio, redirige a index.html
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^.*$ /index.html [L]
        ```

Una vez completados estos pasos, la aplicación debería estar accesible en la IP o dominio de tu servidor de pruebas.
