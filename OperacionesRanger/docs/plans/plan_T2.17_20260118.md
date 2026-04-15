# Plan: T2.17 - Crear caché de guardianes activos

**Fecha**: 2026-01-18
**Tarea padre**: T2.17
**Fase**: Fase 2 - Backend Core
**Estimación**: 2-3 horas
**Dependencias**: T2.16 (Servicio RRHH) ✅

---

## Objetivo

Implementar sistema de caché en memoria para guardianes activos usando `node-cache`, reduciendo la carga en la base de datos RRHH externa y mejorando el rendimiento de las consultas de guardianes.

---

## Contexto

En T2.16 se implementó el servicio RRHH que consulta la BD externa `db_aae4a2_ranger.rh_empleado` con ~515 guardianes activos. Cada consulta realiza queries SQL costosas. Esta tarea implementa caching para reducir dramáticamente las consultas a BD.

**Beneficio esperado**: Reducir carga en BD RRHH de ~515 registros por consulta a caché en memoria con TTL de 5 minutos.

**Archivos base** (T2.16):
- `backend/src/services/rrhh.service.ts` (330 líneas)
- `backend/src/controllers/rrhh.controller.ts` (290 líneas)
- `backend/src/routes/rrhh.routes.ts` (95 líneas)
- `backend/tests/integration/rrhh.test.ts` (500 líneas)

---

## Subtareas

### 1. Instalar dependencias de caché
**Descripción**: Instalar `node-cache` y sus tipos TypeScript

**Archivos a modificar**: `backend/package.json`

**Comandos**:
```bash
cd backend
npm install node-cache
npm install --save-dev @types/node-cache
```

**Resultado esperado**:
- Dependencias instaladas en `package.json`
- `node_modules/` actualizado
- `package-lock.json` actualizado

**Validación**:
```bash
npm list node-cache
npm list @types/node-cache
```

---

### 2. Crear servicio de caché genérico
**Descripción**: Crear servicio reutilizable `CacheService` que encapsula `node-cache`

**Archivo a crear**: `backend/src/services/cache.service.ts`

**Funcionalidades**:
```typescript
class CacheService {
  private cache: NodeCache;

  constructor(ttlSeconds: number);
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): boolean;
  del(keys: string | string[]): number;
  flush(): void;
  getStats(): CacheStats;
}
```

**Constantes**:
- `DEFAULT_TTL`: 300 segundos (5 minutos)
- `CHECK_PERIOD`: 600 segundos (limpieza automática)

**Resultado esperado**: Archivo TypeScript completo (~150 líneas) con:
- Clase `CacheService` exportada
- Métodos tipados
- Manejo de errores
- Logging de operaciones
- Documentación JSDoc

---

### 3. Modificar servicio RRHH para usar caché
**Descripción**: Integrar `CacheService` en `rrhh.service.ts` agregando lógica de cache-first

**Archivo a modificar**: `backend/src/services/rrhh.service.ts`

**Cambios**:

1. **Importar y crear instancia de caché**:
```typescript
import { CacheService } from './cache.service';
import { env } from '../config/env';

const guardianesCacheEnabled = env.CACHE_ENABLED ?? true;
const guardianesCache = new CacheService(env.CACHE_TTL_SECONDS ?? 300);
```

2. **Modificar `getGuardianes()`**:
   - Generar cache key: `guardianes:active:page:{page}:size:{pageSize}:search:{search}`
   - Verificar caché primero
   - Si hit: retornar datos cacheados
   - Si miss: consultar BD, cachear resultado, retornar

3. **Modificar `getGuardianById()`**:
   - Cache key: `guardian:{id}`
   - Lógica cache-first similar

4. **Agregar método `clearGuardianesCache()`**:
   - Limpiar caché completo
   - Retornar estadísticas

5. **Agregar método `getGuardianesCacheStats()`**:
   - Retornar estadísticas del caché

**Resultado esperado**:
- Servicio con lógica de caché implementada
- Bypass de caché si `CACHE_ENABLED=false`
- ~100 líneas adicionales
- Logging de hits/misses

---

### 4. Agregar endpoints de administración de caché
**Descripción**: Crear controladores y rutas para limpiar caché y ver estadísticas

**Archivo a modificar**: `backend/src/controllers/rrhh.controller.ts`

**Nuevos controladores**:

1. **`clearCache`** (POST /api/rrhh/cache/clear):
```typescript
export async function clearCache(req: Request, res: Response): Promise<void> {
  const stats = await clearGuardianesCache();
  res.status(200).json({
    message: 'Caché limpiado exitosamente',
    stats
  });
}
```

2. **`getCacheStats`** (GET /api/rrhh/cache/stats):
```typescript
export async function getCacheStats(req: Request, res: Response): Promise<void> {
  const stats = await getGuardianesCacheStats();
  res.status(200).json(stats);
}
```

**Archivo a modificar**: `backend/src/routes/rrhh.routes.ts`

**Nuevas rutas**:
```typescript
// Solo ADMIN puede limpiar caché
router.post(
  '/cache/clear',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  clearCache
);

// ADMIN y SUPERVISOR pueden ver stats
router.get(
  '/cache/stats',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR),
  getCacheStats
);
```

**Resultado esperado**:
- 2 nuevos controladores (~50 líneas)
- 2 nuevas rutas (~15 líneas)
- Protección por roles correcta

---

### 5. Actualizar configuración de entorno
**Descripción**: Agregar variables de configuración de caché a `env.ts`

**Archivo a modificar**: `backend/src/config/env.ts`

**Nuevas variables**:
```typescript
export const env = {
  // ... existentes
  CACHE_ENABLED: process.env.CACHE_ENABLED === 'true',
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
};
```

**Archivo a modificar**: `backend/.env.example`

**Nuevas entradas**:
```env
# Caché de guardianes
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300
```

**Resultado esperado**:
- Variables validadas en `env.ts`
- Defaults apropiados
- Ejemplo actualizado

---

### 6. Crear tests unitarios para CacheService
**Descripción**: Crear suite de tests para el servicio de caché

**Archivo a crear**: `backend/tests/services/cache.service.test.ts`

**Tests a implementar** (mínimo 8):
1. `should create cache with default TTL`
2. `should set and get value from cache`
3. `should return undefined for non-existent key`
4. `should delete single key`
5. `should delete multiple keys`
6. `should flush all cache`
7. `should return cache stats`
8. `should expire value after TTL`
9. `should respect custom TTL per key`
10. `should handle errors gracefully`

**Resultado esperado**:
- Archivo de tests (~200 líneas)
- Mínimo 8 tests
- Coverage > 90% de `cache.service.ts`

---

### 7. Agregar tests de integración para caché
**Descripción**: Agregar tests de caché a `rrhh.test.ts`

**Archivo a modificar**: `backend/tests/integration/rrhh.test.ts`

**Nuevos tests** (mínimo 5):

1. **Test de hit de caché**:
   - Primera consulta: miss (va a BD)
   - Segunda consulta: hit (viene de caché)
   - Validar que retorna mismos datos

2. **Test de limpieza de caché**:
   - Cachear datos
   - Limpiar caché (POST /cache/clear)
   - Validar que siguiente consulta va a BD

3. **Test de estadísticas**:
   - Realizar consultas
   - Obtener stats (GET /cache/stats)
   - Validar hits/misses

4. **Test de bypass de caché**:
   - Deshabilitar caché (mockear env.CACHE_ENABLED=false)
   - Validar que siempre consulta BD

5. **Test de TTL expirado**:
   - Cachear datos
   - Esperar TTL+1 segundos
   - Validar que siguiente consulta va a BD

6. **Test de roles en endpoints de caché**:
   - ADMIN puede limpiar caché
   - SUPERVISOR NO puede limpiar caché
   - SUPERVISOR puede ver stats

**Resultado esperado**:
- ~150 líneas adicionales en `rrhh.test.ts`
- Mínimo 5 tests nuevos
- Tests con mocks de tiempo (jest.useFakeTimers)

---

### 8. Documentar implementación
**Descripción**: Crear archivo de resultado con documentación completa

**Archivo a crear**: `docs/completed/T2.17_cache_guardianes.md`

**Contenido**:
- Resumen de implementación
- Archivos creados/modificados
- Configuración de variables de entorno
- Ejemplos de uso
- Beneficios de performance
- Estadísticas de caché
- Próximos pasos

**Resultado esperado**:
- Documento completo (~400 líneas)
- Ejemplos de curl para endpoints
- Métricas de mejora de performance

---

## Criterios de Aceptación (checklist)

- [ ] `node-cache` y `@types/node-cache` instalados
- [ ] `CacheService` implementado en `cache.service.ts`
- [ ] TTL configurable desde `.env` (CACHE_TTL_SECONDS)
- [ ] `rrhh.service.ts` usa caché correctamente (cache-first strategy)
- [ ] Método `clearGuardianesCache()` implementado
- [ ] Método `getGuardianesCacheStats()` implementado
- [ ] Endpoint `POST /api/rrhh/cache/clear` (solo ADMIN)
- [ ] Endpoint `GET /api/rrhh/cache/stats` (ADMIN, SUPERVISOR)
- [ ] Reducción de queries a BD verificada en tests
- [ ] Tests unitarios para `CacheService` (>8 casos)
- [ ] Tests de integración para caché (>5 casos)
- [ ] Configuración `CACHE_ENABLED` puede desactivar caché
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] `env.ts` validando nuevas variables
- [ ] Documentación completa en `T2.17_cache_guardianes.md`

**Total**: 15 criterios

---

## Archivos a Generar

### Archivos Nuevos (3)
1. `backend/src/services/cache.service.ts` - Servicio de caché genérico (~150 líneas)
2. `backend/tests/services/cache.service.test.ts` - Tests unitarios (~200 líneas)
3. `docs/completed/T2.17_cache_guardianes.md` - Documentación de resultado (~400 líneas)

### Archivos a Modificar (5)
4. `backend/package.json` - Agregar dependencias (+2 líneas)
5. `backend/src/services/rrhh.service.ts` - Integrar caché (+100 líneas)
6. `backend/src/controllers/rrhh.controller.ts` - Agregar controladores de caché (+50 líneas)
7. `backend/src/routes/rrhh.routes.ts` - Agregar rutas de caché (+15 líneas)
8. `backend/tests/integration/rrhh.test.ts` - Agregar tests de caché (+150 líneas)
9. `backend/src/config/env.ts` - Agregar variables de caché (+5 líneas)
10. `backend/.env.example` - Documentar variables de caché (+3 líneas)

**Total**: 3 nuevos + 7 modificados = 10 archivos

---

## Riesgos y Consideraciones

### Riesgo 1: Cache invalidation inconsistente
**Descripción**: Si la BD RRHH cambia, caché puede tener datos obsoletos hasta que expire TTL

**Mitigación**:
- TTL corto (5 minutos)
- Endpoint manual de limpieza (ADMIN)
- Documentar que caché es eventual consistency
- En futuro: webhook de BD RRHH para invalidar caché

---

### Riesgo 2: Cache keys con caracteres especiales
**Descripción**: Parámetros de búsqueda pueden tener espacios/caracteres especiales que afecten cache key

**Mitigación**:
- Normalizar cache keys (trim, lowercase)
- Codificar caracteres especiales en key
- Validar formato de keys

---

### Riesgo 3: Memory leak por caché sin límite
**Descripción**: node-cache puede crecer sin límite si hay muchas búsquedas únicas

**Mitigación**:
- node-cache tiene garbage collection automático
- TTL corto (5 minutos)
- Monitorear uso de memoria
- En futuro: agregar maxKeys limit

---

### Riesgo 4: Tests de timing pueden ser flaky
**Descripción**: Tests de expiración de TTL pueden fallar por timing issues

**Mitigación**:
- Usar `jest.useFakeTimers()` para controlar tiempo
- Usar `jest.advanceTimersByTime()` para simular paso del tiempo
- No depender de setTimeout real

---

### Riesgo 5: Conflictos con ejecución paralela de T2.09
**Descripción**: T2.09 (CRUD puestos) se ejecuta en paralelo, puede haber conflictos de archivos

**Mitigación**:
- T2.17 NO toca archivos de puestos
- T2.17 modifica: rrhh.*, cache.*, env.ts
- T2.09 modifica: puestos.*, ubicaciones.* (posiblemente env.ts)
- **Conflicto potencial**: env.ts (ambas tareas lo modifican)
- **Solución**: Coordinar con T2.09 para que no modifiquen env.ts simultáneamente, o resolver merge manual

---

## Estrategia de Cache Keys

**Formato de keys**:

1. **Lista paginada**:
   ```
   guardianes:active:page:{page}:size:{pageSize}:search:{search}

   Ejemplos:
   - guardianes:active:page:1:size:10:search:
   - guardianes:active:page:1:size:20:search:juan
   - guardianes:active:page:2:size:10:search:
   ```

2. **Guardián individual**:
   ```
   guardian:{id}

   Ejemplos:
   - guardian:1001
   - guardian:1523
   ```

**Invalidación**:
- Por TTL: Automático (5 minutos)
- Manual: POST /api/rrhh/cache/clear (ADMIN)
- Por búsqueda específica: No (invalidación total)

---

## Beneficios Esperados

### Performance
- **Consulta sin caché**: ~50-100ms (query SQL + network + serialización)
- **Consulta con caché**: ~1-5ms (memory lookup + deserialización)
- **Mejora**: 10-100x más rápido

### Carga en BD RRHH
- **Sin caché**: 1 query SQL por cada request
- **Con caché (TTL 5min)**: 1 query cada 5 minutos (asumiendo requests repetidos)
- **Reducción**: ~99% menos queries a BD (para consultas repetidas)

### Ejemplo de uso común
Escenario: Dashboard que muestra lista de guardianes cada 30 segundos
- **Sin caché**: 120 queries/hora (1 cada 30s)
- **Con caché**: 12 queries/hora (1 cada 5min)
- **Ahorro**: 108 queries/hora (90%)

---

## Notas Adicionales

### Compatibilidad con T2.09 (CRUD Puestos)
Esta tarea (T2.17) se ejecuta EN PARALELO con T2.09 (CRUD Puestos).

**Archivos NO compartidos** (sin conflictos):
- T2.17: `rrhh.*`, `cache.*`, tests de RRHH
- T2.09: `puestos.*`, tests de puestos

**Archivos COMPARTIDOS** (posible conflicto):
- `env.ts` - Ambas tareas lo modifican
- `server.ts` - Ambas tareas pueden agregarlo (poco probable)
- `.env.example` - Ambas tareas lo modifican

**Estrategia de resolución**:
1. T2.17 agrega al FINAL de `env.ts` (sección CACHE)
2. T2.09 agrega en su propia sección de `env.ts`
3. Si hay merge conflict: resolución manual trivial (ambas agregan líneas)

---

## Referencias

- **Tarea anterior**: T2.16 (Servicio RRHH) - `docs/completed/T2.16_servicio_rrhh.md`
- **Librería**: node-cache - https://www.npmjs.com/package/node-cache
- **Metodología**: `Metodologia.md` sección 2 (Subagente)
- **Archivo de tareas**: `docs/tasks/tareas_fase2_backend_core_20260118.md`

---

**Plan creado**: 2026-01-18
**Listo para ejecución**: ✅ SÍ
**Riesgos identificados**: 5 riesgos con mitigaciones
**Coordinación con T2.09**: Verificar merge de env.ts al finalizar
