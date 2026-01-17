# Notas Importantes - Configuración Docker

## Configuración del Frontend para Docker

### IMPORTANTE: API URL del Frontend

El archivo `rangernomina-frontend/src/environments/environment.ts` actualmente apunta a:
```typescript
apiUrl: 'http://rhayrtx3060.ddns.net:8989/api'
```

### Opciones de Configuración

#### Opción 1: Desarrollo Local (Recomendado)

Si estás ejecutando Docker en tu máquina local, cambia a:

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3333/api'
};
```

#### Opción 2: Servidor de Producción

Si estás desplegando en un servidor, usa:

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://TU_DOMINIO_O_IP:3333/api'
};
```

#### Opción 3: Nginx como Proxy (Avanzado)

Si quieres que Nginx haga proxy al backend (más profesional):

1. Descomenta la sección de proxy en `rangernomina-frontend/nginx.conf`:

```nginx
location /api {
    proxy_pass http://backend:3333;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

2. Cambia el environment a ruta relativa:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // Nginx hará el proxy
};
```

### Rebuild después de cambiar Environment

**IMPORTANTE**: Cada vez que cambies `environment.ts`, debes reconstruir el contenedor del frontend:

```bash
docker-compose up -d --build frontend
```

## Estructura de Red Docker

Los contenedores se comunican en una red privada llamada `ranger-network`:

- **mysql**: Hostname `mysql` (puerto 3306)
- **backend**: Hostname `backend` (puerto 3333)
- **frontend**: Hostname `frontend` (puerto 80)

El backend puede conectarse a MySQL usando `DB_HOST=mysql` (ya configurado en docker-compose.yml).

## Persistencia de Datos

Los datos de MySQL se guardan en un volumen Docker llamado `mysql_data`.

Esto significa que:
- ✅ Puedes detener/iniciar contenedores sin perder datos
- ✅ Puedes reconstruir imágenes sin perder datos
- ⚠️ Solo se borran datos si ejecutas `docker-compose down -v`

Ver volúmenes:
```bash
docker volume ls
```

Inspeccionar volumen:
```bash
docker volume inspect ranger-sistemas_mysql_data
```

## Variables de Entorno en Docker

El archivo `.env` en la raíz se usa para:
- Configurar credenciales de MySQL
- Configurar puerto del backend
- Configurar puerto del frontend
- Configurar JWT_SECRET

**Estas variables se inyectan en `docker-compose.yml`**, que a su vez las pasa a los contenedores.

## Archivos de Carga (Uploads)

El backend puede tener archivos de carga (fotos de empleados, imports Excel, etc.).

Estos se persisten mediante el volumen:
```yaml
volumes:
  - ./backend-ranger-nomina/uploads:/app/uploads
```

Esto significa que los archivos subidos se guardan en tu máquina local en:
```
E:\ranger sistemas\backend-ranger-nomina\uploads\
```

## Base de Datos Inicial

Si colocas un archivo SQL en:
```
backend-ranger-nomina/database/init.sql
```

Este se ejecutará **SOLO la primera vez** que se cree el contenedor de MySQL.

Para forzar la re-ejecución:
```bash
docker-compose down -v  # CUIDADO: Borra todos los datos
docker-compose up -d
```

## Logs

Los logs se guardan en:
- Contenedor backend: `/app/logs/` (si tienes logging configurado)
- Nginx: `/var/log/nginx/access.log` y `/var/log/nginx/error.log`
- MySQL: logs internos de Docker

Ver logs de un contenedor específico:
```bash
docker logs ranger-nomina-backend
docker logs ranger-nomina-frontend
docker logs ranger-nomina-db
```

## Performance

### Recursos Predeterminados

Por defecto, Docker Desktop en Windows asigna:
- 2 GB de RAM
- 2 CPUs

Si experimentas lentitud, incrementa estos valores en Docker Desktop:
1. Settings → Resources → Advanced
2. Incrementa Memory a 4 GB
3. Incrementa CPUs a 4

### Limitar Recursos por Contenedor

Edita `docker-compose.yml` para limitar recursos:

```yaml
backend:
  # ... otras configuraciones
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

## Seguridad en Producción

### Lista de Verificación

- [ ] Cambiar todas las contraseñas en `.env`
- [ ] Usar contraseñas fuertes (mínimo 16 caracteres)
- [ ] No commitear `.env` a Git (ya está en `.gitignore`)
- [ ] Configurar firewall para exponer solo puertos necesarios
- [ ] Usar HTTPS (Nginx + Let's Encrypt)
- [ ] Limitar conexiones MySQL solo a la red interna
- [ ] Configurar backups automáticos de MySQL
- [ ] Usar Docker secrets en lugar de `.env` (avanzado)

### Ejemplo de Firewall (Windows)

```powershell
# Permitir solo puerto 80 (frontend)
New-NetFirewallRule -DisplayName "Ranger Nomina Frontend" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Bloquear acceso directo a backend desde internet (solo localhost)
New-NetFirewallRule -DisplayName "Block Ranger Backend External" -Direction Inbound -LocalPort 3333 -Protocol TCP -Action Block
```

## Troubleshooting Común

### Frontend no carga archivos estáticos (CSS, JS)

Verifica que el build de Angular se haya completado:
```bash
docker-compose logs frontend
```

Busca errores de build. Si encuentras errores, reconstruye:
```bash
docker-compose up -d --build frontend
```

### Backend no puede conectarse a MySQL

Verifica que MySQL esté "healthy":
```bash
docker-compose ps
```

El estado de `mysql` debe ser `healthy`. Si no:
```bash
docker-compose logs mysql
```

### Cambios en código no se reflejan

Docker cachea las capas. Fuerza rebuild sin cache:
```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Error "Cannot find module"

Elimina node_modules del proyecto local (no afecta Docker):
```bash
# Opcional: limpiar node_modules locales
rmdir /s /q backend-ranger-nomina\node_modules
rmdir /s /q rangernomina-frontend\node_modules
```

Luego rebuild:
```bash
docker-compose build --no-cache
```

## Comandos Útiles de Limpieza

```bash
# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes no usados (CUIDADO)
docker volume prune

# Limpiar TODO (PELIGROSO)
docker system prune -a --volumes
```

## Próximos Pasos

Una vez que tengas Docker funcionando localmente:

1. **Producción**: Considera usar Docker Swarm o Kubernetes
2. **CI/CD**: Configura GitHub Actions o GitLab CI para builds automáticos
3. **Monitoreo**: Agrega Prometheus + Grafana
4. **Logging**: Centraliza logs con ELK Stack o Loki
5. **Backups**: Automatiza backups de MySQL con cron jobs
