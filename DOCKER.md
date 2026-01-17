# Docker Deployment Guide - Ranger Nomina

Esta guía explica cómo desplegar **Ranger Nomina** usando Docker y Docker Compose.

## Requisitos Previos

- **Docker Desktop** (Windows) o **Docker Engine** (Linux): [Descargar aquí](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (incluido en Docker Desktop)

Verificar instalación:
```bash
docker --version
docker-compose --version
```

## Estructura de Contenedores

El proyecto usa **3 contenedores**:

1. **mysql**: Base de datos MySQL 8.0
2. **backend**: API Node.js + Express (puerto 3333)
3. **frontend**: Angular + Nginx (puerto 80)

## Configuración Inicial

### 1. Crear archivo .env

Copia el archivo de ejemplo y configura las credenciales:

```bash
cp .env.docker.example .env
```

Edita `.env` y cambia las contraseñas:

```env
DB_ROOT_PASSWORD=TU_CONTRASEÑA_ROOT_SEGURA
DB_PASSWORD=TU_CONTRASEÑA_USER_SEGURA
JWT_SECRET=TU_CLAVE_JWT_SUPER_SECRETA
```

### 2. Preparar Base de Datos (Opcional)

Si tienes un script SQL de inicialización, colócalo en:
```
backend-ranger-nomina/database/init.sql
```

Este archivo se ejecutará automáticamente al crear el contenedor de MySQL por primera vez.

## Comandos Básicos

### Iniciar todos los servicios

```bash
# Build y start en modo detached (background)
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

### Detener servicios

```bash
# Detener sin eliminar contenedores
docker-compose stop

# Detener y eliminar contenedores (mantiene volúmenes/datos)
docker-compose down

# Detener, eliminar contenedores Y volúmenes (CUIDADO: borra la BD)
docker-compose down -v
```

### Ver estado de contenedores

```bash
docker-compose ps
```

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Solo MySQL
docker-compose logs -f mysql
```

### Reiniciar un servicio específico

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

## Acceso a la Aplicación

Una vez iniciados los contenedores:

- **Frontend**: http://localhost:80 (o http://localhost si usas puerto 80)
- **Backend API**: http://localhost:3333
- **MySQL**: localhost:3306

## Comandos Avanzados

### Ejecutar comandos dentro de un contenedor

```bash
# Acceder a shell del backend
docker-compose exec backend sh

# Acceder a shell de MySQL
docker-compose exec mysql bash

# Ejecutar consulta SQL directa
docker-compose exec mysql mysql -u root -p db_aae4a2_ranger
```

### Rebuild un servicio específico

```bash
# Solo rebuild backend
docker-compose up -d --build backend

# Solo rebuild frontend
docker-compose up -d --build frontend
```

### Ver uso de recursos

```bash
docker stats
```

### Limpiar todo (containers, images, volumes)

```bash
# CUIDADO: Esto eliminará TODO
docker-compose down -v
docker system prune -a
```

## Respaldo de Base de Datos

### Crear backup

```bash
# Backup completo
docker-compose exec mysql mysqldump -u root -p db_aae4a2_ranger > backup_$(date +%Y%m%d_%H%M%S).sql

# O usando variables de entorno
docker-compose exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > backup.sql
```

### Restaurar backup

```bash
# Restaurar desde archivo
docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < backup.sql
```

## Variables de Entorno

Puedes personalizar las siguientes variables en `.env`:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_ROOT_PASSWORD` | Contraseña root de MySQL | ranger_root_2024 |
| `DB_NAME` | Nombre de la base de datos | db_aae4a2_ranger |
| `DB_USER` | Usuario de la base de datos | ranger_user |
| `DB_PASSWORD` | Contraseña del usuario | ranger_pass_2024 |
| `DB_PORT` | Puerto expuesto de MySQL | 3306 |
| `BACKEND_PORT` | Puerto del backend | 3333 |
| `FRONTEND_PORT` | Puerto del frontend | 80 |
| `JWT_SECRET` | Secreto para tokens JWT | (debe cambiarse) |

## Troubleshooting

### Error: "Port already in use"

```bash
# Ver qué está usando el puerto
netstat -ano | findstr :3333   # Windows
lsof -i :3333                  # Linux/Mac

# Cambiar puerto en .env
BACKEND_PORT=3334
```

### Error: "Cannot connect to MySQL"

```bash
# Verificar que MySQL esté healthy
docker-compose ps

# Ver logs de MySQL
docker-compose logs mysql

# Esperar a que MySQL termine de inicializarse (puede tomar 30-60s)
```

### Frontend no carga o error 404

```bash
# Verificar build de Angular
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Cambios en código no se reflejan

```bash
# Rebuild el servicio afectado
docker-compose up -d --build backend
# o
docker-compose up -d --build frontend
```

## Despliegue en Producción

### Recomendaciones:

1. **Cambiar todas las contraseñas** en `.env`
2. **Usar volúmenes externos** para persistencia de datos:
   ```yaml
   volumes:
     mysql_data:
       external: true
   ```
3. **Configurar HTTPS** con Nginx reverse proxy o Traefik
4. **Limitar recursos** en docker-compose:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
   ```
5. **Usar secrets** para información sensible en lugar de .env
6. **Configurar backups automáticos** de la base de datos
7. **Monitoreo** con Prometheus + Grafana o similar

### Ejemplo con reverse proxy (Nginx externo):

```nginx
server {
    listen 443 ssl http2;
    server_name nomina.tudominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Health Checks

Los contenedores incluyen health checks automáticos:

- **MySQL**: Verifica conectividad cada 10s
- **Backend**: Endpoint `/health` cada 30s
- **Frontend**: Nginx responde cada 30s

Ver estado de salud:
```bash
docker inspect --format='{{json .State.Health}}' ranger-nomina-backend
```

## Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## Soporte

Para problemas específicos de Docker, consulta:
- Issues del proyecto
- Documentación en `CLAUDE.md`
- Logs detallados: `docker-compose logs -f --tail=100`
