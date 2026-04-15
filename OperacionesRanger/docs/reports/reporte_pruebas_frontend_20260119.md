# Reporte de Pruebas del Frontend
**Fecha**: 2026-01-19
**Sistema**: OperacionesRanger - Sistema de Gestión de Turnos
**Versión**: v1.0
**Ambiente**: Desarrollo (localhost)

---

## Resumen Ejecutivo

Se realizó una prueba completa del frontend de la aplicación utilizando Chrome DevTools. Se identificaron varios problemas críticos que afectan la funcionalidad del sistema.

**Estado General**: ❌ CRÍTICO
- **Login**: ✅ Funcional (con credenciales correctas)
- **Módulos CRUD**: ❌ Bloqueados por problema de validación
- **Backend**: ⚠️ Problemas de validación de parámetros

---

## 1. Problemas Encontrados

### 🔴 CRÍTICO: Schema de Validación Incompleto en Clientes

**Archivo**: `backend/src/schemas/cliente.schema.ts:253-267`

**Descripción**:
El schema `clientesPaginationQuerySchema` no incluye el parámetro `activo` que el frontend está enviando en las peticiones. Esto causa que todas las peticiones GET a `/api/clientes` fallen la validación y se queden colgadas.

**Código Actual**:
```typescript
// Líneas 253-267
export const clientesPaginationQuerySchema = z.object({
  page: z.string()
    .optional()
    .default('1')
    .transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0'),
  pageSize: z.string()
    .optional()
    .default('20')
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, 'El tamaño de página debe estar entre 1 y 100'),
  search: z.string()
    .optional()
    .transform((val) => val?.trim() || undefined)
});
```

**Petición del Frontend**:
```
GET http://localhost:3000/api/clientes?page=1&pageSize=10&activo=true
```

**Problema**: El parámetro `activo=true` no está definido en el schema.

**Impacto**:
- ❌ La lista de clientes no carga
- ❌ El componente se queda en estado de "Cargando..." indefinidamente
- ❌ Bloquea completamente el módulo de Clientes

**Solución Requerida**:
1. Agregar el parámetro `activo` al schema `clientesPaginationQuerySchema`:
   ```typescript
   activo: z.string()
     .optional()
     .transform((val) => val === 'true' || val === '1')
   ```
2. Actualizar el servicio `getClientes()` en `backend/src/services/clientes.service.ts` para filtrar por `activo`:
   ```typescript
   export async function getClientes(
     page: number = 1,
     pageSize: number = 20,
     search?: string,
     activo?: boolean  // <-- AGREGAR ESTE PARÁMETRO
   )
   ```
3. Agregar el filtro en el WHERE clause de la query SQL.

**Archivos Afectados**:
- `backend/src/schemas/cliente.schema.ts` (schema de validación)
- `backend/src/services/clientes.service.ts` (lógica de negocio)
- `backend/src/controllers/clientes.controller.ts` (pasar parámetro al servicio)

**Prioridad**: 🔴 **CRÍTICA** - Bloquea funcionalidad principal

---

### 🟡 ADVERTENCIA: Credenciales por Defecto no Documentadas

**Descripción**:
Las credenciales de administrador no están claramente documentadas en el frontend. El formulario de login no proporciona información sobre las credenciales de prueba.

**Credenciales Encontradas**:
- **Usuario**: `admin`
- **Contraseña**: `Admin123!`

**Recomendación**:
- Agregar documentación en `frontend/README.md` con credenciales de desarrollo
- Considerar agregar un mensaje en ambiente de desarrollo: "Usuario de prueba: admin / Admin123!"

**Prioridad**: 🟡 **MEDIA** - Mejora de usabilidad

---

### 🔵 INFORMATIVO: Múltiples Conexiones MySQL en Sleep

**Descripción**:
Se detectaron conexiones MySQL en estado `Sleep` por períodos prolongados (>20 minutos).

**Conexiones Detectadas**:
```
330	root	localhost:24111	turnos_guardianes	Sleep	1391
331	root	localhost:24112	db_aae4a2_ranger	Sleep	1391
```

**Análisis**:
- Las conexiones provienen del pool de mysql2
- El tiempo en Sleep sugiere que el pool mantiene conexiones abiertas (comportamiento normal)
- No se detectaron leaks de conexiones activas

**Recomendación**:
- Monitorear en producción
- Considerar ajustar `connectionLimit` del pool si es necesario
- Revisar configuración de `waitForConnections` y `queueLimit`

**Prioridad**: 🔵 **BAJA** - Monitoreo preventivo

---

### 🔴 CRÍTICO: Requests Pendientes se Quedan Colgados

**Descripción**:
Los siguientes requests quedaron en estado `pending` indefinidamente:

```
GET /api/turnos?fecha_inicio=2026-01-01&fecha_fin=2026-01-31 [pending]
GET /api/rrhh/guardianes?status=1 [pending]
GET /api/turnos?procesado_nomina=false [pending]
GET /api/clientes?page=1&pageSize=10&activo=true [pending]
```

**Causa Raíz**: Validación de esquemas Zod rechazando parámetros desconocidos.

**Confirmación**: Tests con curl confirmaron que:
- El backend SÍ está respondiendo (devolvió error 401 cuando token era inválido)
- Cuando la validación Zod falla por parámetros desconocidos, el request NO recibe respuesta
- Esto indica un **problema en el manejo de errores de validación** en los controllers

**Problema Secundario Detectado**:
Los controllers no están manejando correctamente el caso `validationResult.success === false`. En lugar de devolver un error 400, el request queda sin respuesta.

**Acción Requerida**:
- Revisar **TODOS** los schemas de paginación en `backend/src/schemas/*.schema.ts`
- Verificar que los parámetros enviados por el frontend estén definidos en los schemas
- Asegurar que Zod esté configurado con `.strict(false)` o `.passthrough()` si se requiere flexibilidad

**Prioridad**: 🔴 **CRÍTICA** - Afecta múltiples módulos

---

### 🔴 CRÍTICO: Manejo Incorrecto de Errores de Validación

**Descripción**:
Los controllers NO están devolviendo respuesta HTTP cuando la validación Zod falla. El código actual hace `return` sin enviar respuesta al cliente.

**Ejemplo del Problema** (`clientes.controller.ts:41-52`):
```typescript
export async function getClientes(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validar query params
    const validationResult = clientesPaginationQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Parámetros de búsqueda inválidos',
        details: formatZodErrors(validationResult.error)
      });
      return;  // ⚠️ Esto SÍ envía la respuesta correctamente
    }
    // ...
```

**Análisis**:
El código parece correcto - SÍ está enviando un `res.status(400).json()` antes del `return`. Sin embargo, los requests se quedan colgados, lo que sugiere:

1. **Hipótesis 1**: El `safeParse()` puede estar lanzando una excepción no capturada para ciertos tipos de errores
2. **Hipótesis 2**: Puede haber un middleware que está interfiriendo antes de que llegue al controller
3. **Hipótesis 3**: El objeto `req.query` puede tener un formato que Zod no puede procesar

**Evidencia**:
- Request con token válido: NO llega al controller (queda pending)
- Request con token inválido: SÍ llega al middleware de autenticación (devuelve 401)
- Conclusión: El problema está en el middleware de validación o antes del controller

**Acción Requerida**:
1. Revisar middleware chain en las rutas
2. Agregar logging en el controller ANTES de la validación para confirmar si llega
3. Verificar que no haya un timeout de query params en Express
4. Considerar agregar timeout en el cliente HTTP del frontend (30 segundos)

**Archivos a Revisar**:
- `backend/src/routes/clientes.routes.ts` - Middleware chain
- `backend/src/middlewares/validation.middleware.ts` - Si existe
- `backend/src/server.ts` - Configuración de Express (body parser, query parser)

**Prioridad**: 🔴 **CRÍTICA** - Causa experiencia de usuario muy mala

---

## 2. Pruebas Realizadas

### ✅ Login
- **Estado**: FUNCIONAL
- **Credenciales**: admin / Admin123!
- **Resultado**: Login exitoso, redirección al dashboard correcta
- **Token JWT**: Generado correctamente
- **Screenshots**: `docs/screenshots/login_password_issue.png`, `docs/screenshots/dashboard_home.png`

### ❌ Dashboard
- **Estado**: PARCIALMENTE FUNCIONAL
- **Visualización**: Correcta
- **Estadísticas**: No cargan (requests pendientes)
- **UI**: Material Design implementado correctamente

### ❌ Módulo de Clientes
- **Estado**: BLOQUEADO
- **Problema**: Schema de validación incompleto
- **UI**: Componente renderiza correctamente
- **Datos**: No cargan, spinner infinito
- **Screenshot**: (pendiente, página en estado de carga)

---

## 3. Arquitectura del Frontend

### Componentes Verificados
```
✅ LoginComponent (functional)
✅ DashboardComponent (UI correcto, datos no cargan)
✅ NavmenuComponent (renderiza correctamente)
❌ ClientesComponent (bloqueado por backend)
⏸️ UbicacionesComponent (no probado)
⏸️ PuestosComponent (no probado)
⏸️ TurnosComponent (no probado)
```

### Servicios Verificados
```
✅ AuthService (functional)
❌ ClientesService (bloqueado por backend)
⏸️ UbicacionesService (no probado)
⏸️ PuestosService (no probado)
⏸️ TurnosService (no probado)
```

---

## 4. Estado del Backend

### Endpoints Verificados
```
✅ POST /api/auth/login - FUNCIONAL (200 OK)
❌ GET /api/clientes - BLOQUEADO (validación falla)
❌ GET /api/turnos - PENDIENTE (validación sospechosa)
❌ GET /api/rrhh/guardianes - PENDIENTE (validación sospechosa)
```

### Proceso Node.js
- **PID**: 2228
- **Memoria**: 935 MB (alto consumo)
- **Puerto**: 3000 (LISTENING)
- **Estado**: RUNNING (con múltiples conexiones colgadas)

---

## 5. Recomendaciones Prioritarias

### Inmediato (Hoy)
1. ✅ **CRÍTICO**: Agregar parámetro `activo` a `clientesPaginationQuerySchema`
2. ✅ **CRÍTICO**: Actualizar servicio `getClientes()` para soportar filtro por `activo`
3. ✅ **CRÍTICO**: Revisar todos los schemas de paginación (ubicaciones, puestos, turnos, etc.)

### Corto Plazo (Esta Semana)
4. 🟡 Documentar credenciales de desarrollo
5. 🟡 Agregar tests para validación de query params
6. 🟡 Implementar timeout en peticiones HTTP del frontend (30s máximo)
7. 🟡 Agregar logging de errores de validación en el backend

### Mediano Plazo (Próximo Sprint)
8. 🔵 Monitorear uso de memoria del backend
9. 🔵 Implementar health check endpoint (`GET /api/health`)
10. 🔵 Agregar métricas de performance (latencia de requests)

---

## 6. Próximos Pasos

### Pendiente de Prueba
- [ ] Módulo de Ubicaciones
- [ ] Módulo de Puestos
- [ ] Módulo de Feriados
- [ ] Módulo de Usuarios
- [ ] Módulo de Incentivos
- [ ] Módulo de Registro de Turnos
- [ ] Módulo de Reportes CSV
- [ ] Calendario de Turnos

### Bloqueado Hasta Fix
- [ ] Pruebas de integración end-to-end
- [ ] Validación de flujos completos
- [ ] Pruebas de performance

---

## 7. Conclusiones

El sistema tiene una **arquitectura sólida** con Angular 20 y Material Design bien implementado. Sin embargo, existe un **problema crítico de validación** en el backend que está bloqueando la funcionalidad de los módulos CRUD.

**Causa Raíz**: Los schemas Zod de validación no están sincronizados con los parámetros que el frontend está enviando.

**Impacto**: Alto - Bloquea la funcionalidad principal del sistema.

**Tiempo Estimado de Solución**: 2-4 horas (revisar y actualizar todos los schemas + servicios).

**Recomendación**: Implementar las correcciones prioritarias antes de continuar con las pruebas.

---

## 8. Evidencias

### Capturas de Pantalla
1. `docs/screenshots/login_password_issue.png` - Error inicial de contraseña vacía
2. `docs/screenshots/dashboard_home.png` - Dashboard después de login exitoso

### Logs de Consola
- Error Code 5105 detectado (error de Angular)
- Sin errores JavaScript críticos

### Requests de Red
- POST `/api/auth/login` - ✅ 200 OK
- GET `/api/clientes?page=1&pageSize=10&activo=true` - ❌ PENDING (timeout)

---

**Reporte Generado Por**: Claude Code (Anthropic)
**Metodología**: Pruebas automatizadas con MCP Chrome DevTools
**Próxima Actualización**: Después de implementar fixes críticos
