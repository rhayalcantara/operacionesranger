# Configuración de Archivos Environment

**Fecha:** 2025-12-15
**Cambios:** Archivos de configuración excluidos del repositorio Git

---

## ¿Por qué?

Los archivos de configuración contienen información sensible como:
- Contraseñas de base de datos
- URLs de producción
- Secretos JWT
- Configuraciones específicas del servidor

**NO deben estar en el repositorio Git** para evitar exponer credenciales.

---

## Archivos Excluidos

### Frontend (`rangernomina-frontend/`)

Los siguientes archivos ya NO están en Git:

```
src/environments/environment.ts
src/environments/environment.development.ts
src/environments/environment.producion.ts
src/environments/environment.prod.ts
src/environments/environment.production.ts
```

### Backend (`backend-ranger-nomina/`)

Los siguientes archivos ya NO están en Git:

```
.env
.env.production
```

---

## Cómo Configurar en un Nuevo Ambiente

### 1. Frontend

Copia el archivo de ejemplo:

```bash
cd rangernomina-frontend/src/environments
cp environment.example.ts environment.ts
cp environment.example.ts environment.development.ts
cp environment.example.ts environment.producion.ts
```

Edita cada archivo según el ambiente:

**`environment.ts` (desarrollo local):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3333/api'
};
```

**`environment.producion.ts` (producción):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'  // URL real de producción
};
```

### 2. Backend

Copia el archivo de ejemplo:

```bash
cd backend-ranger-nomina
cp .env.example .env
```

Edita `.env` con tus valores reales:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_real
DB_NAME=db_aae4a2_ranger
PORT=3333
JWT_SECRET=tu_secret_jwt_real
FRONTEND_URL=http://localhost:4200
```

---

## Configuración de Producción

Los archivos de configuración de producción deben:

1. ✅ Estar en el servidor de producción
2. ✅ Tener valores correctos para el ambiente de producción
3. ✅ Estar protegidos con permisos adecuados
4. ❌ NO estar en el repositorio Git
5. ❌ NO compartirse en canales públicos

---

## Cambios en `.gitignore`

### Frontend (`.gitignore`)

```gitignore
# Environment files (production config)
/src/environments/environment.ts
/src/environments/environment.development.ts
/src/environments/environment.producion.ts
/src/environments/environment.prod.ts
/src/environments/environment.production.ts
```

### Backend (`.gitignore`)

```gitignore
# Environment variables
.env
.env.production
```

---

## Archivos de Ejemplo Incluidos

✅ **SÍ están en Git** (seguros, sin credenciales):

- `rangernomina-frontend/src/environments/environment.example.ts`
- `backend-ranger-nomina/.env.example`

Estos archivos muestran la estructura necesaria sin exponer información sensible.

---

## Comandos Git Aplicados

```bash
# Frontend - Remover archivos del seguimiento de Git (mantenerlos en el sistema)
cd rangernomina-frontend
git rm --cached src/environments/environment.ts
git rm --cached src/environments/environment.development.ts
git rm --cached src/environments/environment.producion.ts

# Los archivos físicos siguen en tu máquina, pero ya no se enviarán al repositorio
```

---

## Para Equipos de Desarrollo

Cuando un nuevo desarrollador clone el proyecto:

1. Debe copiar los archivos `.example` como se indica arriba
2. Debe configurar sus propios valores (localhost, etc.)
3. **NUNCA** debe hacer commit de archivos environment con credenciales reales
4. Git ignorará automáticamente estos archivos (según `.gitignore`)

---

## Verificación

Para verificar que los archivos están correctamente excluidos:

```bash
# Frontend
cd rangernomina-frontend
git status

# Deberías ver:
# D  src/environments/environment.ts         (marcado para eliminar)
# M  .gitignore                              (modificado)
# ?? src/environments/environment.example.ts (no rastreado, OK)

# Backend
cd backend-ranger-nomina
git status

# No deberías ver .env en la lista (está siendo ignorado)
```

---

## Próximo Commit

En tu próximo commit al repositorio:

```bash
git add .gitignore
git add src/environments/environment.example.ts
git add backend-ranger-nomina/.env.example
git commit -m "chore: excluir archivos de configuración sensibles del repositorio

- Agregar environment files a .gitignore
- Remover archivos environment del seguimiento de Git
- Agregar archivos .example como plantillas
- Documentar proceso de configuración"
```

---

**Estado:** ✅ Configurado
**Verificado por:** Claude Code
**Siguiente acción:** Hacer commit de los cambios