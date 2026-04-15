# Plan: T2.12 - Implementar CRUD de Incentivos por Puesto

**Fecha**: 2026-01-18
**Tarea padre**: T2.12
**Fase**: Fase 2 - Backend Core (Módulo 2: Maestros CRUD)
**Estimación**: 4-5 horas

---

## Objetivo

Crear endpoints CRUD completos para la gestión de incentivos asignados por puesto y periodo quincenal (quincena). Los incentivos permiten asignar montos adicionales a guardianes que trabajen en puestos específicos durante periodos definidos. El sistema debe calcular automáticamente el valor por hora basado en 360 horas por quincena (15 días × 24 horas) y validar que no haya solapamiento de fechas para el mismo puesto.

---

## Contexto

### Tabla de Base de Datos: `incentivos_puesto`

Estructura actual (según DESCRIBE):
```sql
id               INT           AUTO_INCREMENT PRIMARY KEY
puesto_id        INT           NOT NULL (FK → puestos.id)
anio             SMALLINT      NOT NULL (año del incentivo)
quincena         TINYINT       NOT NULL (1 o 2)
monto            DECIMAL(12,2) NOT NULL (monto total del incentivo)
valor_hora       DECIMAL(10,4) GENERATED STORED (monto / 360)
fecha_inicio     DATE          NOT NULL (inicio periodo)
fecha_fin        DATE          NOT NULL (fin periodo)
observaciones    TEXT          NULL
created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE

ÍNDICES:
- PRIMARY KEY: id
- INDEX: puesto_id
- INDEX: anio, quincena
- INDEX: fecha_inicio

CONSTRAINT:
- FK: puesto_id → puestos.id (ON DELETE RESTRICT)
```

**NOTA IMPORTANTE**: La estructura real difiere ligeramente de la especificación inicial:
- Usa `anio` + `quincena` en lugar de `quincena_inicio` + `quincena_fin`
- Tiene `fecha_inicio` y `fecha_fin` separadas (lo cual es correcto)
- NO tiene campo `concepto` ni `activo` (según DESCRIBE)
- El campo `valor_hora` es GENERATED STORED (calculado automáticamente)

### Patrón Existente

El proyecto sigue un patrón bien establecido para CRUDs:

**Estructura de archivos**:
```
backend/src/
├── models/incentivo.model.ts         (Interfaces, DTOs, validaciones)
├── schemas/incentivo.schema.ts       (Schemas Zod para validación)
├── services/incentivos.service.ts    (Lógica de negocio)
├── controllers/incentivos.controller.ts (Controladores HTTP)
└── routes/incentivos.routes.ts       (Definición de rutas)
```

**Tecnologías**:
- TypeScript con tipado estricto
- Zod para validación de schemas
- Express para routing
- mysql2/promise para queries
- Middlewares: authMiddleware, requireRole, validateRequest

**Referencia**: Basarse en implementación de `puestos.service.ts`, `puestos.controller.ts`, `puestos.routes.ts` como patrón.

---

## Subtareas

### 1. Crear modelo y DTOs de incentivos
**Descripción**: Crear archivo `backend/src/models/incentivo.model.ts` con interfaces TypeScript, DTOs y funciones helper.

**Archivos a crear**:
- `backend/src/models/incentivo.model.ts`

**Contenido**:
- Interface `Incentivo` (mapeo 1:1 con tabla BD)
- Interface `CreateIncentivoDTO` (datos para crear incentivo)
- Interface `UpdateIncentivoDTO` (datos para actualizar, todos opcionales)
- Interface `IncentivoConRelaciones` (con datos de puesto, ubicación, cliente)
- Type `NuevoIncentivoDB` (datos para INSERT)
- Type `IncentivoActualizable` (datos para UPDATE)
- Constantes `INCENTIVO_VALIDATION` (límites de validación)
- Funciones helper:
  - `dtoToNuevoIncentivoDB(dto: CreateIncentivoDTO): NuevoIncentivoDB`
  - `dtoToIncentivoActualizable(dto: UpdateIncentivoDTO): IncentivoActualizable`
  - `validarPeriodoQuincenal(fecha_inicio, fecha_fin): boolean` - validar que sea periodo válido
  - `calcularQuincena(fecha: Date): 1 | 2` - determinar quincena de una fecha

**Validaciones de negocio**:
- `monto` > 0
- `fecha_inicio` < `fecha_fin`
- `anio` entre 2020 y 2100
- `quincena` debe ser 1 o 2

**Resultado esperado**: Archivo TypeScript con todos los tipos e interfaces documentados.

---

### 2. Crear schemas de validación Zod
**Descripción**: Crear archivo `backend/src/schemas/incentivo.schema.ts` con schemas Zod para validar requests.

**Archivos a crear**:
- `backend/src/schemas/incentivo.schema.ts`

**Schemas a implementar**:

1. **createIncentivoSchema** (POST /api/incentivos):
   - `puesto_id`: number, integer, positive
   - `anio`: number, integer, between 2020-2100
   - `quincena`: number, integer, 1 or 2
   - `monto`: number, positive, max 2 decimals
   - `fecha_inicio`: string, ISO date format (YYYY-MM-DD)
   - `fecha_fin`: string, ISO date format (YYYY-MM-DD)
   - `observaciones`: string optional, max 1000 chars
   - **Refine**: `fecha_inicio < fecha_fin`

2. **updateIncentivoSchema** (PUT /api/incentivos/:id):
   - Mismo que create pero todos opcionales
   - **Refine**: Si ambas fechas presentes, `fecha_inicio < fecha_fin`

3. **incentivoIdSchema** (params :id):
   - `id`: string → transform to number, positive integer

4. **getIncentivosQuerySchema** (GET /api/incentivos):
   - `page`: string → number, >= 1, default 1
   - `pageSize`: string → number, 1-100, default 10
   - `puesto_id`: optional, string → number, positive
   - `anio`: optional, string → number, integer
   - `quincena`: optional, string → number, 1 or 2
   - `fecha_inicio`: optional, string, ISO date
   - `fecha_fin`: optional, string, ISO date
   - **Refine**: Si ambas fechas, `fecha_inicio <= fecha_fin`

5. **getIncentivosQuincenaParamsSchema** (GET /api/incentivos/quincena/:fecha):
   - `fecha`: string, ISO date format

**Resultado esperado**: Schemas Zod completos con validaciones y mensajes de error en español.

---

### 3. Crear servicio de incentivos
**Descripción**: Crear archivo `backend/src/services/incentivos.service.ts` con lógica de negocio.

**Archivos a crear**:
- `backend/src/services/incentivos.service.ts`

**Funciones a implementar**:

1. **getIncentivos(filters)**: PaginatedResult<Incentivo>
   - Listar incentivos con paginación
   - Filtros: puesto_id, anio, quincena, rango de fechas
   - JOIN con puestos, ubicaciones, clientes para incluir nombres
   - Ordenar por fecha_inicio DESC

2. **getIncentivoById(id)**: Incentivo | null
   - Obtener incentivo por ID con relaciones
   - JOIN con puesto, ubicación, cliente
   - Retornar null si no existe

3. **getIncentivosActivosParaFecha(fecha)**: Incentivo[]
   - Obtener incentivos donde fecha_inicio <= fecha <= fecha_fin
   - Retornar solo incentivos activos (puesto activo)
   - Usado para cálculo de incentivos en turnos

4. **createIncentivo(data)**: IncentivoConRelaciones
   - Validar que puesto_id existe y está activo
   - **Validar NO solapamiento**: No permitir crear incentivo si ya existe otro para el mismo puesto con fechas solapadas
   - Insertar incentivo (valor_hora se calcula automáticamente por GENERATED column)
   - Retornar incentivo creado con relaciones

5. **updateIncentivo(id, data)**: IncentivoConRelaciones
   - Verificar que incentivo existe
   - Si actualiza fechas, validar NO solapamiento (excluyendo el incentivo actual)
   - UPDATE con campos proporcionados
   - Retornar incentivo actualizado con relaciones

6. **deleteIncentivo(id)**: { message, id }
   - Verificar que incentivo existe
   - Hard delete (DELETE) - NO soft delete
   - Retornar confirmación

7. **verificarSolapamiento(puesto_id, fecha_inicio, fecha_fin, excludeId?)**: boolean
   - Query para detectar solapamiento de fechas:
     ```sql
     SELECT COUNT(*) FROM incentivos_puesto
     WHERE puesto_id = ?
       AND id != ? (si excludeId)
       AND (
         (fecha_inicio <= ? AND fecha_fin >= ?) OR
         (fecha_inicio <= ? AND fecha_fin >= ?) OR
         (fecha_inicio >= ? AND fecha_fin <= ?)
       )
     ```
   - Retornar true si hay solapamiento

**Interfaces**:
```typescript
interface GetIncentivosFilters {
  page?: number;
  pageSize?: number;
  puesto_id?: number;
  anio?: number;
  quincena?: 1 | 2;
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}
```

**Resultado esperado**: Servicio completo con todas las funciones documentadas, validaciones de negocio y manejo de errores.

---

### 4. Crear controladores de incentivos
**Descripción**: Crear archivo `backend/src/controllers/incentivos.controller.ts` con controladores HTTP.

**Archivos a crear**:
- `backend/src/controllers/incentivos.controller.ts`

**Controladores a implementar**:

1. **getIncentivosController** (GET /api/incentivos)
   - Extraer query params
   - Llamar a `incentivosService.getIncentivos(filters)`
   - Calcular totalPages
   - Retornar 200 con { data, total, page, pageSize, totalPages }
   - Error → 500

2. **getIncentivoByIdController** (GET /api/incentivos/:id)
   - Extraer id de params
   - Llamar a `incentivosService.getIncentivoById(id)`
   - Si null → 404
   - Retornar 200 con incentivo
   - Error → 500

3. **getIncentivosQuincenaController** (GET /api/incentivos/quincena/:fecha)
   - Extraer fecha de params
   - Llamar a `incentivosService.getIncentivosActivosParaFecha(fecha)`
   - Retornar 200 con array de incentivos
   - Error → 500

4. **createIncentivoController** (POST /api/incentivos)
   - Extraer body
   - Llamar a `incentivosService.createIncentivo(data)`
   - Retornar 201 con incentivo creado
   - Errores:
     - "Puesto no encontrado" → 404
     - "ya existe" o "solapamiento" → 400
     - Otros → 500

5. **updateIncentivoController** (PUT /api/incentivos/:id)
   - Extraer id y body
   - Llamar a `incentivosService.updateIncentivo(id, data)`
   - Retornar 200 con incentivo actualizado
   - Errores:
     - "no encontrado" → 404
     - "solapamiento" → 400
     - Otros → 500

6. **deleteIncentivoController** (DELETE /api/incentivos/:id)
   - Extraer id
   - Llamar a `incentivosService.deleteIncentivo(id)`
   - Retornar 200 con { message, id }
   - Errores:
     - "no encontrado" → 404
     - Otros → 500

**Patrón de manejo de errores**: Igual que en puestos.controller.ts

**Resultado esperado**: 6 controladores funcionando con manejo de errores apropiado.

---

### 5. Crear rutas de incentivos
**Descripción**: Crear archivo `backend/src/routes/incentivos.routes.ts` con definición de rutas.

**Archivos a crear**:
- `backend/src/routes/incentivos.routes.ts`

**Rutas a implementar**:

```typescript
// Consulta (todos los roles autenticados)
GET    /api/incentivos                     - Lista paginada
GET    /api/incentivos/:id                 - Obtener por ID
GET    /api/incentivos/quincena/:fecha     - Incentivos para fecha específica

// Modificación (ADMIN, SUPERVISOR)
POST   /api/incentivos                     - Crear incentivo
PUT    /api/incentivos/:id                 - Actualizar incentivo

// Eliminación (solo ADMIN)
DELETE /api/incentivos/:id                 - Eliminar incentivo
```

**Middlewares por ruta**:
- GET: `authMiddleware`, `requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA')`, `validateRequest`
- POST, PUT: `authMiddleware`, `requireRole('ADMIN', 'SUPERVISOR')`, `validateRequest`
- DELETE: `authMiddleware`, `requireRole('ADMIN')`, `validateRequest`

**Schemas de validación**:
- GET /: `query: getIncentivosQuerySchema`
- GET /:id: `params: incentivoIdSchema`
- GET /quincena/:fecha: `params: getIncentivosQuincenaParamsSchema`
- POST /: `body: createIncentivoSchema`
- PUT /:id: `params: incentivoIdSchema`, `body: updateIncentivoSchema`
- DELETE /:id: `params: incentivoIdSchema`

**Documentación JSDoc**: Documentar cada ruta con JSDoc comments (permisos, body, response, etc.)

**Resultado esperado**: Router exportado con 6 rutas documentadas y protegidas.

---

### 6. Registrar rutas en server.ts
**Descripción**: Integrar las nuevas rutas de incentivos en el servidor Express.

**Archivos a modificar**:
- `backend/src/server.ts`

**Cambios**:
1. Importar router: `import incentivosRoutes from './routes/incentivos.routes';`
2. Registrar ruta: `app.use('/api/incentivos', incentivosRoutes);`
3. Ordenar alfabéticamente con otras rutas

**Resultado esperado**: Rutas de incentivos accesibles en `/api/incentivos/*`

---

### 7. Crear tests de integración
**Descripción**: Crear archivo `backend/tests/incentivos.test.ts` con suite completa de tests.

**Archivos a crear**:
- `backend/tests/incentivos.test.ts`

**Tests a implementar** (mínimo 15 tests):

**Suite: Autenticación y Autorización (3 tests)**
1. GET /incentivos sin token → 401
2. POST /incentivos como CONSULTA → 403
3. DELETE /incentivos como SUPERVISOR → 403

**Suite: Crear Incentivo (4 tests)**
4. Crear incentivo válido → 201
5. Crear con puesto_id inexistente → 404
6. Crear con monto <= 0 → 400
7. Crear con solapamiento de fechas → 400

**Suite: Listar Incentivos (3 tests)**
8. Listar todos con paginación → 200
9. Filtrar por puesto_id → 200
10. Filtrar por año y quincena → 200

**Suite: Obtener por ID (2 tests)**
11. Obtener incentivo existente → 200
12. Obtener incentivo inexistente → 404

**Suite: Obtener por Quincena (2 tests)**
13. Obtener incentivos para fecha con incentivos → 200, array con datos
14. Obtener incentivos para fecha sin incentivos → 200, array vacío

**Suite: Actualizar Incentivo (2 tests)**
15. Actualizar monto → 200, monto actualizado
16. Actualizar creando solapamiento → 400

**Suite: Eliminar Incentivo (2 tests)**
17. Eliminar incentivo existente → 200
18. Eliminar incentivo inexistente → 404

**Suite: Validación de Solapamiento (2 tests)**
19. Detectar solapamiento total (fecha_inicio dentro de otro periodo)
20. Detectar solapamiento parcial (fecha_fin dentro de otro periodo)

**Total estimado**: 18 tests (120% del requisito mínimo de 15)

**Setup de tests**:
- Usar base de datos de prueba
- beforeAll: crear cliente, ubicación, puesto de prueba
- beforeEach: limpiar tabla incentivos_puesto
- afterAll: cleanup

**Comando para ejecutar**:
```bash
npm test -- incentivos.test.ts
```

**Resultado esperado**: Suite de tests completa con >80% de los tests pasando (mínimo 15/18).

---

### 8. Ejecutar tests y validar funcionamiento
**Descripción**: Ejecutar tests de integración y validar que el CRUD funciona correctamente.

**Comando/herramienta**: npm test

**Resultado esperado**:
- ✅ Todos los tests de incentivos pasan (o al menos 15/18)
- ✅ Validación de solapamiento funciona correctamente
- ✅ Cálculo automático de valor_hora funciona (GENERATED column)
- ✅ No hay errores de TypeScript
- ✅ Endpoints responden correctamente

**Acción si falla**:
- Revisar logs de error
- Corregir código
- Re-ejecutar tests

---

### 9. Crear documentación de resultado
**Descripción**: Documentar la tarea completada en `docs/completed/T2.12_crud_incentivos.md`.

**Archivos a crear**:
- `docs/completed/T2.12_crud_incentivos.md`

**Contenido**:
- Resumen de la tarea
- Subtareas completadas
- Archivos generados/modificados
- Criterios de aceptación cumplidos
- Comandos ejecutados
- Tests implementados y resultados
- Problemas encontrados y soluciones
- Decisiones técnicas tomadas
- Próximos pasos sugeridos

**Resultado esperado**: Documentación completa y profesional.

---

## Criterios de Aceptación (checklist)

- [ ] **6 endpoints funcionando**:
  - [ ] GET /api/incentivos (paginado, filtros)
  - [ ] GET /api/incentivos/:id
  - [ ] GET /api/incentivos/quincena/:fecha
  - [ ] POST /api/incentivos (ADMIN, SUPERVISOR)
  - [ ] PUT /api/incentivos/:id (ADMIN, SUPERVISOR)
  - [ ] DELETE /api/incentivos/:id (ADMIN)

- [ ] **Validaciones de negocio implementadas**:
  - [ ] puesto_id debe existir y estar activo
  - [ ] monto > 0
  - [ ] fecha_inicio < fecha_fin
  - [ ] anio entre 2020-2100
  - [ ] quincena debe ser 1 o 2
  - [ ] No permitir solapamiento de fechas para mismo puesto

- [ ] **Cálculo automático**:
  - [ ] valor_hora se calcula automáticamente (monto / 360) por GENERATED column

- [ ] **Filtrado**:
  - [ ] Filtrar por puesto_id
  - [ ] Filtrar por año y quincena
  - [ ] Filtrar por rango de fechas
  - [ ] Endpoint /quincena/:fecha devuelve incentivos aplicables

- [ ] **Tests de integración**:
  - [ ] Mínimo 15 tests implementados
  - [ ] Al menos 12 tests pasando (80%)
  - [ ] Cobertura de casos exitosos y errores
  - [ ] Tests de validación de solapamiento

- [ ] **Código de calidad**:
  - [ ] Sin errores de TypeScript
  - [ ] Código documentado con JSDoc
  - [ ] Patrón consistente con otros CRUDs
  - [ ] Manejo de errores robusto

- [ ] **Documentación**:
  - [ ] Plan creado en docs/plans/
  - [ ] Resultado documentado en docs/completed/
  - [ ] README actualizado (si necesario)

---

## Archivos a Generar

1. **backend/src/models/incentivo.model.ts** - Interfaces y DTOs
2. **backend/src/schemas/incentivo.schema.ts** - Schemas Zod
3. **backend/src/services/incentivos.service.ts** - Lógica de negocio
4. **backend/src/controllers/incentivos.controller.ts** - Controladores HTTP
5. **backend/src/routes/incentivos.routes.ts** - Definición de rutas
6. **backend/tests/incentivos.test.ts** - Tests de integración
7. **docs/completed/T2.12_crud_incentivos.md** - Documentación de resultado

## Archivos a Modificar

1. **backend/src/server.ts** - Registrar rutas de incentivos

---

## Riesgos y Consideraciones

### Riesgo 1: Validación de solapamiento compleja
**Descripción**: La lógica de detección de solapamiento de fechas puede ser compleja y propensa a bugs.

**Mitigación**:
- Implementar función dedicada `verificarSolapamiento()`
- Probar exhaustivamente con tests de casos borde
- Usar query SQL probada para detectar solapamiento:
  ```sql
  WHERE (fecha_inicio <= ? AND fecha_fin >= ?)
     OR (fecha_inicio <= ? AND fecha_fin >= ?)
     OR (fecha_inicio >= ? AND fecha_fin <= ?)
  ```

### Riesgo 2: Estructura de tabla diferente a especificación
**Descripción**: La tabla tiene `anio` + `quincena` en lugar de `quincena_inicio` + `quincena_fin` como se especificó inicialmente.

**Mitigación**:
- Usar estructura real de la tabla (anio + quincena)
- Los campos `fecha_inicio` y `fecha_fin` ya están presentes y son suficientes
- NO incluir campos `concepto` ni `activo` ya que no existen en la BD

### Riesgo 3: Campo GENERATED `valor_hora`
**Descripción**: El campo `valor_hora` es GENERATED STORED, se calcula automáticamente.

**Mitigación**:
- NO intentar insertar valor para `valor_hora` en INSERT/UPDATE
- Excluirlo de CreateDTO y UpdateDTO
- Confiar en el cálculo automático de MySQL
- Verificar en tests que el cálculo es correcto

### Riesgo 4: Consistencia de fechas con quincena
**Descripción**: Los campos `fecha_inicio`, `fecha_fin` deben ser consistentes con `anio` y `quincena`.

**Mitigación**:
- Validar en servicio que las fechas corresponden al año/quincena especificados
- Calcular automáticamente quincena basada en fecha_inicio
- Permitir que usuario proporcione fechas exactas (más flexible que solo año/quincena)

---

## Notas Adicionales

### Diferencia con especificación original

**Especificación original**:
```
quincena_inicio, quincena_fin, monto, concepto, valor_hora (GENERATED), activo
```

**Estructura real de BD**:
```
anio, quincena, monto, valor_hora (GENERATED), fecha_inicio, fecha_fin, observaciones
```

**Decisión**: Usar estructura real de la BD. La estructura real es superior porque:
- `anio` + `quincena` + `fecha_inicio`/`fecha_fin` es más explícito
- `observaciones` reemplaza a `concepto` (más flexible)
- NO necesitamos campo `activo` (se puede eliminar el incentivo si ya no aplica)

### Cálculo de valor_hora

El valor_hora se calcula automáticamente como `monto / 360`:
- 15 días por quincena × 24 horas = 360 horas
- Esto es un promedio; los guardianes reciben incentivo proporcional a sus horas trabajadas
- El cálculo es automático gracias a GENERATED STORED column

### Endpoint especial: /quincena/:fecha

Este endpoint es crucial para el módulo de turnos:
- Cuando se registra un turno, se consulta si hay incentivos aplicables
- La fecha del turno se compara con fecha_inicio/fecha_fin de incentivos
- Solo se retornan incentivos del puesto específico donde se registra el turno

---

**Última actualización**: 2026-01-18
**Tiempo estimado total**: 4-5 horas
**Próximo paso**: Ejecutar subtarea 2 (Crear modelo y DTOs)
