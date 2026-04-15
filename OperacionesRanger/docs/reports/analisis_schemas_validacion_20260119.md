# Análisis de Schemas de Validación - Problemas Detectados
**Fecha**: 2026-01-19
**Autor**: Claude Code (Anthropic)
**Contexto**: Pruebas de Frontend - Requests Colgados

---

## Resumen

Durante las pruebas del frontend se detectó que múltiples requests HTTP quedaban en estado `pending` indefinidamente. El análisis reveló que **los schemas Zod de validación no están sincronizados con los parámetros que el frontend envía**, causando rechazo silencioso de las peticiones.

---

## Problema Global: Desincronización Frontend-Backend

### Causa Raíz
Los schemas Zod están configurados de forma **estricta** (rechaza parámetros desconocidos) pero **NO incluyen todos los parámetros** que el frontend envía.

### Comportamiento Observado
- Petición llega con parámetro no definido en schema (ej: `activo=true`)
- Zod rechaza la validación silenciosamente
- Controller recibe validación fallida pero NO responde con error 400
- Request queda en estado `pending` indefinidamente
- Frontend muestra spinner infinito

---

## 1. Schema de Clientes 🔴 CRÍTICO

**Archivo**: `backend/src/schemas/cliente.schema.ts:253-267`

**Schema Actual**:
```typescript
export const clientesPaginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0'),
  pageSize: z.string().optional().default('20').transform(Number)
    .refine((n) => n > 0 && n <= 100, 'El tamaño de página debe estar entre 1 y 100'),
  search: z.string().optional()
    .transform((val) => val?.trim() || undefined)
});
```

**Request del Frontend**:
```
GET /api/clientes?page=1&pageSize=10&activo=true
```

**Parámetro Faltante**: `activo` (boolean)

**Solución**:
```typescript
export const clientesPaginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0'),
  pageSize: z.string().optional().default('20').transform(Number)
    .refine((n) => n > 0 && n <= 100, 'El tamaño de página debe estar entre 1 y 100'),
  search: z.string().optional()
    .transform((val) => val?.trim() || undefined),
  // ⬇️ AGREGAR ESTE PARÁMETRO
  activo: z.string().optional()
    .transform((val) => val === 'true' || val === '1')
});
```

**Archivos a Modificar**:
1. `backend/src/schemas/cliente.schema.ts` - Agregar parámetro `activo`
2. `backend/src/controllers/clientes.controller.ts` - Extraer y pasar `activo` al servicio
3. `backend/src/services/clientes.service.ts` - Agregar parámetro `activo?: boolean` y filtrar en WHERE clause

---

## 2. Schema de Ubicaciones 🔴 CRÍTICO

**Archivo**: `backend/src/schemas/ubicacion.schema.ts:371-391`

**Schema Actual**:
```typescript
export const ubicacionesPaginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0'),
  pageSize: z.string().optional().default('20').transform(Number)
    .refine((n) => n > 0 && n <= 100, 'El tamaño de página debe estar entre 1 y 100'),
  search: z.string().optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  cliente_id: z.string().optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || val > 0, 'cliente_id debe ser positivo')
});
```

**Request Esperado del Frontend**:
```
GET /api/ubicaciones?page=1&pageSize=10&activo=true&cliente_id=5
```

**Parámetro Faltante**: `activo` (boolean)

**Solución**:
```typescript
export const ubicacionesPaginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0'),
  pageSize: z.string().optional().default('20').transform(Number)
    .refine((n) => n > 0 && n <= 100, 'El tamaño de página debe estar entre 1 y 100'),
  search: z.string().optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  cliente_id: z.string().optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || val > 0, 'cliente_id debe ser positivo'),
  // ⬇️ AGREGAR ESTE PARÁMETRO
  activo: z.string().optional()
    .transform((val) => val === 'true' || val === '1')
});
```

**Archivos a Modificar**:
1. `backend/src/schemas/ubicacion.schema.ts` - Agregar parámetro `activo`
2. `backend/src/controllers/ubicaciones.controller.ts` - Extraer y pasar `activo` al servicio
3. `backend/src/services/ubicaciones.service.ts` - Agregar filtro WHERE por `activo`

---

## 3. Schema de Puestos 🔴 CRÍTICO

**Archivo**: `backend/src/schemas/puesto.schema.ts:215-235`

**Schema Actual**:
```typescript
export const getPuestosQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'page debe ser un número')
    .default('1').transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 1, 'page debe ser >= 1').optional(),
  pageSize: z.string().regex(/^\d+$/, 'pageSize debe ser un número')
    .default('10').transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 1 && val <= 100, 'pageSize debe estar entre 1 y 100').optional(),
  search: z.string().trim()
    .min(1, 'search no puede estar vacío si se proporciona').optional()
});
```

**Request Esperado del Frontend**:
```
GET /api/puestos?page=1&pageSize=10&activo=true&ubicacion_id=8
```

**Parámetros Faltantes**: `activo` (boolean), `ubicacion_id` (number)

**Solución**:
```typescript
export const getPuestosQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'page debe ser un número')
    .default('1').transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 1, 'page debe ser >= 1').optional(),
  pageSize: z.string().regex(/^\d+$/, 'pageSize debe ser un número')
    .default('10').transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 1 && val <= 100, 'pageSize debe estar entre 1 y 100').optional(),
  search: z.string().trim()
    .min(1, 'search no puede estar vacío si se proporciona').optional(),
  // ⬇️ AGREGAR ESTOS PARÁMETROS
  activo: z.string().optional()
    .transform((val) => val === 'true' || val === '1'),
  ubicacion_id: z.string().optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || val > 0, 'ubicacion_id debe ser positivo')
});
```

**Archivos a Modificar**:
1. `backend/src/schemas/puesto.schema.ts` - Agregar parámetros `activo` y `ubicacion_id`
2. `backend/src/controllers/puestos.controller.ts` - Extraer y pasar parámetros al servicio
3. `backend/src/services/puestos.service.ts` - Agregar filtros WHERE correspondientes

---

## 4. Schema de Turnos 🔴 CRÍTICO

**Archivo**: `backend/src/schemas/turno.schema.ts:320-370`

**Schema Actual**:
```typescript
export const getTurnosQuerySchema = z.object({
  page: z.string().optional().default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'page debe ser >= 1'),
  pageSize: z.string().optional().default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'PageSize debe ser mayor o igual a 1')
    .refine((val) => val <= 100, 'PageSize no puede exceder 100'),
  fecha_inicio: z.string()
    .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_inicio debe tener formato YYYY-MM-DD')
    .refine(/* validación de fecha */)
    .optional(),
  fecha_fin: z.string()
    .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_fin debe tener formato YYYY-MM-DD')
    .refine(/* validación de fecha */)
    .optional(),
  // ... más validaciones ...
});
```

**Requests del Frontend**:
```
GET /api/turnos?fecha_inicio=2026-01-01&fecha_fin=2026-01-31
GET /api/turnos?procesado_nomina=false
```

**Parámetro Faltante**: `procesado_nomina` (boolean)

**Problema Adicional**: El schema requiere AMBOS `fecha_inicio` Y `fecha_fin` pero el segundo request solo envía `procesado_nomina`.

**Solución**:
```typescript
export const getTurnosQuerySchema = z.object({
  page: z.string().optional().default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'page debe ser >= 1'),
  pageSize: z.string().optional().default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'PageSize debe ser mayor o igual a 1')
    .refine((val) => val <= 100, 'PageSize no puede exceder 100'),
  fecha_inicio: z.string()
    .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_inicio debe tener formato YYYY-MM-DD')
    .refine(/* validación de fecha */)
    .optional(),
  fecha_fin: z.string()
    .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_fin debe tener formato YYYY-MM-DD')
    .refine(/* validación de fecha */)
    .optional(),
  // ⬇️ AGREGAR ESTE PARÁMETRO
  procesado_nomina: z.string().optional()
    .transform((val) => val === 'true' || val === '1'),
  // ... resto de campos ...
});
```

**Archivos a Modificar**:
1. `backend/src/schemas/turno.schema.ts` - Agregar parámetro `procesado_nomina`
2. `backend/src/controllers/turnos.controller.ts` - Extraer y pasar parámetro al servicio
3. `backend/src/services/turnos.service.ts` - Agregar filtro WHERE por `procesado_nomina`

---

## 5. Schema de RRHH/Guardianes 🟡 ADVERTENCIA

**Request del Frontend**:
```
GET /api/rrhh/guardianes?status=1
```

**Análisis Pendiente**: No se encontró el schema de validación para este endpoint. Puede estar:
- Sin validación de schema (error arquitectural)
- Con validación incorrecta
- En archivo diferente

**Acción Requerida**: Localizar el controller y servicio de RRHH para verificar validación.

---

## Patrón de Error Común

### Problema
Todos los schemas **omiten el parámetro `activo`** que es estándar para filtrado soft-delete en la aplicación.

### Por qué ocurre
1. Los schemas fueron creados sin considerar el filtrado por estado activo/inactivo
2. El frontend implementó el filtro `activo=true` de forma estándar
3. No hay sincronización entre contratos de frontend y backend

### Impacto
- ❌ **Bloquea todos los módulos CRUD**
- ❌ **Dashboard no carga estadísticas**
- ❌ **Experiencia de usuario degradada**
- ❌ **Sistema parece no funcionar**

---

## Solución Global Recomendada

### Opción 1: Agregar Parámetro `activo` a TODOS los Schemas (RECOMENDADO)

**Ventajas**:
- Solución explícita y clara
- Type-safety completo
- Documentación automática en Swagger
- Fácil de mantener

**Desventajas**:
- Requiere modificar múltiples archivos
- Trabajo manual repetitivo

**Implementación**:
1. Crear helper de Zod reutilizable:
   ```typescript
   // backend/src/schemas/common.schema.ts
   import { z } from 'zod';

   export const activoQueryParam = z.string().optional()
     .transform((val) => val === 'true' || val === '1');

   export const basePaginationSchema = z.object({
     page: z.string().optional().default('1').transform(Number)
       .refine((n) => n > 0, 'La página debe ser mayor a 0'),
     pageSize: z.string().optional().default('20').transform(Number)
       .refine((n) => n > 0 && n <= 100, 'El tamaño de página debe estar entre 1 y 100'),
     search: z.string().optional()
       .transform((val) => val?.trim() || undefined),
     activo: activoQueryParam
   });
   ```

2. Extender en cada schema específico:
   ```typescript
   export const clientesPaginationQuerySchema = basePaginationSchema.extend({
     // campos específicos si hay
   });
   ```

3. Actualizar servicios para aceptar parámetro `activo?: boolean`

4. Agregar filtro WHERE en queries SQL:
   ```typescript
   let whereClause = '';
   const params: any[] = [];

   if (activo !== undefined) {
     whereClause += ' WHERE activo = ?';
     params.push(activo);
   }
   ```

### Opción 2: Usar `.passthrough()` en Schemas

**Ventajas**:
- Fix rápido (1 línea por schema)
- No requiere cambios en servicios

**Desventajas**:
- ⚠️ **Pierde type-safety**
- ⚠️ **No valida parámetros desconocidos**
- ⚠️ **Puede enmascarar errores**
- ⚠️ **Swagger no documenta parámetros adicionales**

**Implementación**:
```typescript
export const clientesPaginationQuerySchema = z.object({
  // campos existentes...
}).passthrough(); // ⚠️ Permite cualquier parámetro adicional
```

**⛔ NO RECOMENDADO** para aplicaciones en producción.

### Opción 3: Usar `.strict(false)`

Similar a Opción 2, con los mismos problemas de seguridad y mantenibilidad.

**⛔ NO RECOMENDADO**.

---

## Plan de Implementación

### Fase 1: Fix Urgente (2-4 horas)
1. ✅ Crear `backend/src/schemas/common.schema.ts` con helpers reutilizables
2. ✅ Actualizar schema de Clientes (más crítico)
3. ✅ Actualizar servicio y controller de Clientes
4. ✅ Probar endpoint: `GET /api/clientes?activo=true`
5. ✅ Verificar que frontend carga correctamente

### Fase 2: Aplicar a Resto de Módulos (4-6 horas)
6. ✅ Actualizar schemas de Ubicaciones, Puestos, Feriados, Incentivos
7. ✅ Actualizar servicios correspondientes
8. ✅ Actualizar controllers correspondientes
9. ✅ Agregar `procesado_nomina` al schema de Turnos
10. ✅ Probar todos los endpoints uno por uno

### Fase 3: Testing (2-3 horas)
11. ✅ Tests unitarios para validaciones de schemas
12. ✅ Tests de integración para endpoints con filtro `activo`
13. ✅ Pruebas end-to-end en frontend
14. ✅ Validar que Swagger documenta correctamente los parámetros

### Fase 4: Documentación (1 hora)
15. ✅ Actualizar `CLAUDE.md` con patrón de paginación estándar
16. ✅ Documentar en README que `activo` es parámetro estándar
17. ✅ Crear ADR (Architecture Decision Record) sobre manejo de soft-delete

---

## Testing Recomendado

### Tests Unitarios (Jest)
```typescript
describe('clientesPaginationQuerySchema', () => {
  it('debe aceptar parámetro activo=true', () => {
    const result = clientesPaginationQuerySchema.safeParse({
      page: '1',
      pageSize: '10',
      activo: 'true'
    });
    expect(result.success).toBe(true);
    expect(result.data?.activo).toBe(true);
  });

  it('debe aceptar parámetro activo=false', () => {
    const result = clientesPaginationQuerySchema.safeParse({
      page: '1',
      pageSize: '10',
      activo: 'false'
    });
    expect(result.success).toBe(true);
    expect(result.data?.activo).toBe(false);
  });

  it('debe ser opcional el parámetro activo', () => {
    const result = clientesPaginationQuerySchema.safeParse({
      page: '1',
      pageSize: '10'
    });
    expect(result.success).toBe(true);
    expect(result.data?.activo).toBeUndefined();
  });
});
```

### Tests de Integración (Supertest)
```typescript
describe('GET /api/clientes', () => {
  it('debe filtrar clientes activos cuando activo=true', async () => {
    const response = await request(app)
      .get('/api/clientes?activo=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toBeInstanceOf(Array);
    response.body.data.forEach((cliente: any) => {
      expect(cliente.activo).toBe(true);
    });
  });

  it('debe filtrar clientes inactivos cuando activo=false', async () => {
    const response = await request(app)
      .get('/api/clientes?activo=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toBeInstanceOf(Array);
    response.body.data.forEach((cliente: any) => {
      expect(cliente.activo).toBe(false);
    });
  });

  it('debe retornar todos cuando activo no se especifica', async () => {
    const response = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toBeInstanceOf(Array);
    // No validar activo, puede haber mixto
  });
});
```

---

## Checklist de Archivos a Modificar

### Nuevos Archivos
- [ ] `backend/src/schemas/common.schema.ts` - Helpers reutilizables

### Schemas (9 archivos)
- [ ] `backend/src/schemas/cliente.schema.ts`
- [ ] `backend/src/schemas/ubicacion.schema.ts`
- [ ] `backend/src/schemas/puesto.schema.ts`
- [ ] `backend/src/schemas/feriado.schema.ts`
- [ ] `backend/src/schemas/incentivo.schema.ts`
- [ ] `backend/src/schemas/turno.schema.ts`
- [ ] `backend/src/schemas/config-turnos.schema.ts`
- [ ] `backend/src/schemas/reporte.schema.ts`
- [ ] `backend/src/schemas/auth.schema.ts` (usuarios)

### Services (9 archivos)
- [ ] `backend/src/services/clientes.service.ts`
- [ ] `backend/src/services/ubicaciones.service.ts`
- [ ] `backend/src/services/puestos.service.ts`
- [ ] `backend/src/services/feriados.service.ts`
- [ ] `backend/src/services/incentivos.service.ts`
- [ ] `backend/src/services/turnos.service.ts`
- [ ] `backend/src/services/config-turnos.service.ts`
- [ ] `backend/src/services/reportes.service.ts`
- [ ] `backend/src/services/usuarios.service.ts`

### Controllers (9 archivos)
- [ ] `backend/src/controllers/clientes.controller.ts`
- [ ] `backend/src/controllers/ubicaciones.controller.ts`
- [ ] `backend/src/controllers/puestos.controller.ts`
- [ ] `backend/src/controllers/feriados.controller.ts`
- [ ] `backend/src/controllers/incentivos.controller.ts`
- [ ] `backend/src/controllers/turnos.controller.ts`
- [ ] `backend/src/controllers/config-turnos.controller.ts`
- [ ] `backend/src/controllers/reportes.controller.ts`
- [ ] `backend/src/controllers/usuarios.controller.ts`

### Tests (~27 archivos)
- [ ] Tests unitarios para cada schema (9 archivos)
- [ ] Tests de integración para cada endpoint (9 archivos)
- [ ] Tests de servicio con filtro activo (9 archivos)

**Total Estimado**: ~55 archivos modificados

---

## Conclusiones

### Problema Identificado
❌ **Desincronización crítica** entre contratos de API frontend-backend causada por schemas Zod incompletos.

### Impacto
- 🔴 **CRÍTICO**: Todos los módulos CRUD bloqueados
- 🔴 **CRÍTICO**: Dashboard no funcional
- 🔴 **CRÍTICO**: Sistema parece roto para el usuario

### Solución
✅ Implementar Opción 1 (schemas explícitos con parámetro `activo`)

### Tiempo Estimado
- **Urgente (Clientes)**: 2-4 horas
- **Completo (Todos los módulos)**: 8-12 horas
- **Con testing completo**: 12-16 horas

### Prioridad
🔴 **MÁXIMA** - Bloquea funcionalidad core del sistema

---

**Documento Generado**: 2026-01-19
**Próxima Revisión**: Después de implementar Fase 1
