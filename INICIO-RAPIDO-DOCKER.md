# Inicio Rápido - Docker

Guía de 5 minutos para levantar **Ranger Nomina** con Docker.

## Paso 1: Instalar Docker

Descarga e instala **Docker Desktop** para Windows:
- https://www.docker.com/products/docker-desktop

Reinicia tu computadora después de la instalación.

## Paso 2: Configurar Variables de Entorno

```bash
# En la raíz del proyecto, copia el archivo de ejemplo:
copy .env.docker.example .env
```

Abre `.env` con un editor de texto y **cambia las contraseñas**:

```env
DB_ROOT_PASSWORD=MiPasswordSegura123!
DB_PASSWORD=MiPasswordDB456!
JWT_SECRET=MiClaveJWTSuperSecreta789!
```

## Paso 3: Iniciar Docker

### Opción A: Usar el script (Recomendado)

Doble clic en `docker-start.bat`

### Opción B: Comando manual

```bash
docker-compose up -d --build
```

## Paso 4: Acceder a la Aplicación

Espera 1-2 minutos mientras se inicializan los servicios.

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3333
- **Health Check**: http://localhost:3333/health

## Comandos Útiles

```bash
# Ver logs
docker-compose logs -f

# Ver solo logs del backend
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Reiniciar un servicio
docker-compose restart backend
```

## Scripts Incluidos

- `docker-start.bat` - Inicia todos los servicios
- `docker-stop.bat` - Detiene todos los servicios
- `docker-logs.bat` - Muestra logs en tiempo real

## Solución de Problemas

### Error: "Puerto 80 ya está en uso"

Edita `.env` y cambia:
```env
FRONTEND_PORT=8080
```

Luego accede a: http://localhost:8080

### Error: "Puerto 3333 ya está en uso"

Edita `.env` y cambia:
```env
BACKEND_PORT=3334
```

### MySQL no inicia

Espera 60 segundos. MySQL puede tardar en inicializarse la primera vez.

Ver logs:
```bash
docker-compose logs mysql
```

## Documentación Completa

Para más detalles, consulta `DOCKER.md`
