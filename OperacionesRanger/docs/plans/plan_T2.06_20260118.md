# Plan: T2.06 - Crear datos de seed para usuarios de prueba

**Fecha**: 2026-01-18
**Tarea padre**: T2.06
**Fase**: Fase 2 - Backend Core
**Módulo**: Autenticación y Usuarios
**Estimación**: 1-2 horas

---

## Objetivo

Crear un script automatizado para cargar usuarios de prueba en la tabla `sys_usuarios` del sistema de gestión de turnos, facilitando el desarrollo y testing con credenciales predefinidas y seguras.

---

## Contexto

### Dependencias Completadas

- **T2.01** ✓: Modelos de autenticación (tabla `sys_usuarios` creada)
- **T2.02** ✓: Servicio de password (hashing bcrypt disponible)
- **T2.05** ✓: CRUD de usuarios (servicio usuarios operativo)

### Recursos Disponibles

1. **PasswordService** (`src/services/password.service.ts`):
   - `hashPassword(password: string): Promise<string>` - async
   - `hashPasswordSync(password: string): string` - sync (para scripts)
   - Bcrypt 10 rounds configurados

2. **Database Connection** (`src/config/database.ts`):
   - `getTurnosPool()` - Pool de conexión a BD principal
   - `closeConnections()` - Cerrar conexiones

3. **Script de Referencia** (`scripts/seed-feriados.ts`):
   - Patrón de args parsing (--year, --force)
   - Validación de NODE_ENV
   - Confirmación de usuario
   - Manejo de duplicados con INSERT IGNORE
   - Mensajes de progreso claros

### Tabla Destino

**Tabla**: `sys_usuarios`

**Campos relevantes**:
- `id_usuario` - INT, PK, AUTO_INCREMENT
- `username` - VARCHAR(50), UNIQUE, NOT NULL
- `password_hash` - VARCHAR(255), NOT NULL
- `email` - VARCHAR(100), UNIQUE, NULLABLE
- `nombre_completo` - VARCHAR(150), NOT NULL
- `rol` - ENUM('ADMIN', 'SUPERVISOR', 'CONSULTA'), NOT NULL
- `activo` - BOOLEAN, DEFAULT TRUE
- `created_at` - TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `created_by` - INT, NULLABLE (puede ser NULL para seed)

---

## Usuarios de Prueba a Crear

### Usuario 1: Administrador

```typescript
{
  username: 'admin',
  password: 'Admin123!',        // Hashear con bcrypt
  email: 'admin@operacionesranger.com',
  nombre_completo: 'Administrador del Sistema',
  rol: 'ADMIN',
  activo: true
}
```

### Usuario 2: Supervisor

```typescript
{
  username: 'supervisor',
  password: 'Super123!',        // Hashear con bcrypt
  email: 'supervisor@operacionesranger.com',
  nombre_completo: 'Supervisor de Turnos',
  rol: 'SUPERVISOR',
  activo: true
}
```

### Usuario 3: Consulta

```typescript
{
  username: 'consulta',
  password: 'Consulta123!',     // Hashear con bcrypt
  email: 'consulta@operacionesranger.com',
  nombre_completo: 'Usuario de Consulta',
  rol: 'CONSULTA',
  activo: true
}
```

**Nota**: Los passwords cumplen con requisitos de PasswordService:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial

---

## Subtareas

### 1. Crear archivo `scripts/seed-usuarios.ts`

**Descripción**: Implementar script TypeScript para carga de usuarios

**Archivos a crear**: `backend/scripts/seed-usuarios.ts`

**Funcionalidades requeridas**:

1. **Parsing de argumentos**:
   - `--force` o `-f`: Eliminar usuarios existentes y recrear
   - Sin flags: Solo insertar si no existen (INSERT IGNORE)

2. **Validación de entorno**:
   - Solo ejecutable en `NODE_ENV=development` o `NODE_ENV=test`
   - Bloquear ejecución en producción

3. **Conexión a base de datos**:
   - Usar `getTurnosPool()` de `src/config/database.ts`
   - Cerrar conexiones al finalizar con `closeConnections()`

4. **Hashing de passwords**:
   - Usar `hashPasswordSync()` de `src/services/password.service.ts`
   - NO usar funciones async (simplificar script)

5. **Inserción de usuarios**:
   - Verificar si usuario ya existe (SELECT por username)
   - Si existe y NO es --force: mostrar mensaje "ya existe" y SKIP
   - Si existe y ES --force: eliminar usuario y recrear
   - Si no existe: insertar nuevo usuario

6. **Manejo de errores**:
   - Try-catch global para errores críticos
   - Try-catch individual para cada usuario
   - Continuar con siguiente usuario si uno falla
   - Mostrar resumen final (insertados, existentes, errores)

7. **Mensajes de progreso**:
   - Header con título del script
   - Progreso de cada usuario (✓ insertado, ⊗ ya existe, ✗ error)
   - Resumen final con estadísticas
   - Recomendaciones de próximos pasos

**Estructura esperada**:

```typescript
import { getTurnosPool, closeConnections } from '../src/config/database';
import { hashPasswordSync } from '../src/services/password.service';
import * as readline from 'readline';

interface Args {
  force: boolean;
}

interface Usuario {
  username: string;
  password: string;
  email: string;
  nombre_completo: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA';
}

function parseArgs(): Args { ... }
function askConfirmation(question: string): Promise<boolean> { ... }
function generarUsuarios(): Usuario[] { ... }
async function main(): Promise<void> { ... }

main();
```

**Resultado esperado**: Script completo y funcional

---

### 2. Agregar script npm en `package.json`

**Descripción**: Configurar comando npm para ejecutar el script de seed

**Archivos a modificar**: `backend/package.json`

**Cambios**:

```json
{
  "scripts": {
    ...
    "db:seed:usuarios": "ts-node scripts/seed-usuarios.ts"
  }
}
```

**Uso**:
```bash
# Insertar usuarios (solo si no existen)
npm run db:seed:usuarios

# Forzar recarga (eliminar y recrear)
npm run db:seed:usuarios -- --force
```

**Resultado esperado**: Script npm funcionando correctamente

---

### 3. Actualizar README.md con documentación

**Descripción**: Documentar el nuevo script en la sección de utilidades de BD

**Archivos a modificar**: `backend/README.md`

**Sección a actualizar**: "Scripts de Utilidades de Base de Datos"

**Contenido a agregar**:

```markdown
### Cargar Usuarios de Prueba

Carga usuarios de prueba en la tabla `sys_usuarios` para desarrollo y testing.

\`\`\`bash
# Cargar usuarios de prueba
npm run db:seed:usuarios

# Forzar recarga (eliminar existentes)
npm run db:seed:usuarios -- --force
\`\`\`

**Usuarios creados**: 3 usuarios de prueba con diferentes roles

| Username | Password | Rol | Email |
|----------|----------|-----|-------|
| admin | Admin123! | ADMIN | admin@operacionesranger.com |
| supervisor | Super123! | SUPERVISOR | supervisor@operacionesranger.com |
| consulta | Consulta123! | CONSULTA | consulta@operacionesranger.com |

**Características**:
- Passwords hasheados con bcrypt (10 rounds)
- Solo ejecutable en NODE_ENV=development
- INSERT IGNORE para evitar duplicados
- Opción --force para recrear usuarios
- Validación de seguridad integrada

**IMPORTANTE**: Cambiar estos passwords en producción. Estos son solo para desarrollo/testing.
\`\`\`

**Actualizar tabla de resumen de scripts**:

| Script | Comando | Descripción | Destructivo |
|--------|---------|-------------|-------------|
| ... | ... | ... | ... |
| `db:seed:usuarios` | `npm run db:seed:usuarios` | Cargar usuarios de prueba | ⚠️ Sí (con --force) |
```

**Resultado esperado**: README.md actualizado con documentación completa

---

### 4. Probar script de seed

**Descripción**: Validar que el script funciona correctamente

**Comandos a ejecutar**:

```bash
# 1. Verificar que BD existe y tiene tabla sys_usuarios
npm run db:test

# 2. Ejecutar seed sin --force (primera vez)
npm run db:seed:usuarios

# 3. Verificar que usuarios se crearon
mysql -u root -p -e "USE turnos_guardianes; SELECT id_usuario, username, email, rol, activo FROM sys_usuarios;"

# 4. Ejecutar seed nuevamente sin --force (debe mostrar "ya existe")
npm run db:seed:usuarios

# 5. Ejecutar seed con --force (debe eliminar y recrear)
npm run db:seed:usuarios -- --force

# 6. Verificar passwords hasheados correctamente
mysql -u root -p -e "USE turnos_guardianes; SELECT username, password_hash, LENGTH(password_hash) as hash_length FROM sys_usuarios;"
# Hash length debe ser 60 caracteres (bcrypt)
```

**Validaciones**:
- [x] Script ejecuta sin errores
- [x] 3 usuarios creados correctamente
- [x] Passwords hasheados (60 caracteres, inician con $2a$10$)
- [x] Roles asignados correctamente (ADMIN, SUPERVISOR, CONSULTA)
- [x] Emails únicos
- [x] Username únicos
- [x] INSERT IGNORE funciona (no duplica usuarios)
- [x] Opción --force funciona (elimina y recrea)
- [x] Bloqueo de producción funciona (solo en development)

**Resultado esperado**: Todos los tests pasan exitosamente

---

### 5. Crear documentación de resultado

**Descripción**: Documentar la completitud de la tarea

**Archivos a crear**: `docs/completed/T2.06_seed_usuarios.md`

**Contenido mínimo**:

```markdown
# Tarea Completada: T2.06 - Crear datos de seed para usuarios de prueba

**Fecha de inicio**: 2026-01-18
**Fecha de finalización**: 2026-01-18
**Tiempo real**: X horas Y minutos
**Estimación original**: 1-2 horas

## Resumen

Se implementó exitosamente el script de seed para cargar usuarios de prueba en el sistema...

## Archivos Generados/Modificados

- `backend/scripts/seed-usuarios.ts` - Script de seed (XXX líneas)
- `backend/package.json` - Agregado script npm
- `backend/README.md` - Documentación actualizada
- `docs/completed/T2.06_seed_usuarios.md` - Este archivo

## Usuarios de Prueba Creados

[Tabla con usuarios y credenciales]

## Criterios de Aceptación Cumplidos

- [x] Script seed-usuarios.ts creado
- [x] 3 usuarios de prueba insertados
- [x] Passwords hasheados correctamente
- [x] npm script configurado
- [x] Solo ejecutable en NODE_ENV=development
- [x] Documentado en README.md

## Pruebas Realizadas

[Descripción de pruebas ejecutadas]

## Notas Adicionales

[Observaciones relevantes]
```

**Resultado esperado**: Documentación completa generada

---

## Criterios de Aceptación (Checklist)

- [ ] Script `scripts/seed-usuarios.ts` creado
- [ ] 3 usuarios de prueba insertados correctamente
- [ ] Passwords hasheados con bcrypt (NO texto plano)
- [ ] Script npm `db:seed:usuarios` configurado en package.json
- [ ] Solo ejecutable en NODE_ENV=development (bloquea producción)
- [ ] Validación de usuarios existentes (no duplicar)
- [ ] Opción --force funcional (eliminar y recrear)
- [ ] README.md actualizado con documentación
- [ ] Script probado exitosamente

---

## Archivos a Generar

1. `backend/scripts/seed-usuarios.ts` - Script principal (~200-300 líneas)
2. `docs/completed/T2.06_seed_usuarios.md` - Documentación de resultado (~200 líneas)

## Archivos a Modificar

1. `backend/package.json` - Agregar 1 línea en scripts
2. `backend/README.md` - Agregar ~50 líneas en sección de utilidades

---

## Riesgos y Consideraciones

### Riesgo 1: Passwords en texto plano en código

**Mitigación**:
- Passwords son de prueba, NO de producción
- Documentar claramente que son para development/testing
- Advertir que deben cambiarse en producción
- Usar passwords diferentes en seed vs producción

### Riesgo 2: Ejecución accidental en producción

**Mitigación**:
- Validar NODE_ENV !== 'production'
- Bloquear ejecución si NODE_ENV=production
- Solicitar confirmación con --force
- Documentar peligros en README

### Riesgo 3: Conflictos con usuarios existentes

**Mitigación**:
- Usar INSERT IGNORE para evitar duplicados
- Verificar existencia antes de insertar
- Opción --force para casos donde se necesita recrear
- Mensajes claros indicando qué usuarios ya existen

### Riesgo 4: Hashing síncrono bloquea event loop

**Mitigación**:
- Aceptable en scripts (no es servidor HTTP)
- Solo 3 usuarios (carga mínima)
- Usar hashPasswordSync() para simplificar código
- Alternativa: usar async/await si se vuelve problema

---

## Notas Adicionales

### Diferencias con seed-feriados.ts

**Similitudes**:
- Parsing de args con --force
- Validación de NODE_ENV
- Confirmación de usuario
- INSERT IGNORE para duplicados
- Mensajes de progreso

**Diferencias**:
- seed-feriados: cálculo de fechas móviles
- seed-usuarios: hashing de passwords
- seed-feriados: argumentos de año
- seed-usuarios: sin argumentos adicionales (usuarios fijos)

### Próximos Pasos Después de Seed

1. **Probar login**: Usar endpoints de T2.03 con usuarios creados
2. **Probar roles**: Validar que ADMIN puede todo, SUPERVISOR limitado, CONSULTA solo lectura
3. **Tests de integración**: Usar usuarios de prueba en tests
4. **Frontend**: Credenciales para testing de interfaz

### Seguridad en Producción

**IMPORTANTE**: Estos usuarios son SOLO para desarrollo y testing.

En producción:
- Crear usuarios con passwords únicos y seguros
- NO usar estos passwords de ejemplo
- Deshabilitar o eliminar estos usuarios de prueba
- Implementar políticas de password (expiración, complejidad)

---

**Estimación de tiempo por subtarea**:

1. Crear script seed-usuarios.ts: 45 minutos
2. Agregar script npm: 5 minutos
3. Actualizar README.md: 15 minutos
4. Probar script: 20 minutos
5. Crear documentación: 15 minutos

**Total estimado**: 1h 40min (dentro del rango de 1-2 horas)

---

**Listo para ejecución**: ✅ SÍ

**Dependencias bloqueadas**: ❌ Ninguna

**Conflictos con otros subagentes**: ❌ Ninguno (archivos únicos)
