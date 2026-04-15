# Plan: T2.08 - Implementar CRUD de Ubicaciones

**Fecha**: 2026-01-18
**Tarea padre**: T2.08
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas
**Dependencias**: T2.07 (CRUD Clientes) ✓

---

## Objetivo

Implementar endpoints CRUD completos para la gestión de ubicaciones (sitios físicos donde se presta servicio de seguridad). Las ubicaciones pertenecen a clientes y contienen puestos de vigilancia.

**Tabla BD**: `ubicaciones`
**Relaciones**:
- FK → `clientes.id` (cliente_id)
- 1:N → `puestos` (una ubicación tiene múltiples puestos)

---

## Contexto

### Estructura de la tabla `ubicaciones`

```sql
CREATE TABLE ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    codigo VARCHAR(20) NOT NULL COMMENT 'Código único de ubicación',
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    provincia VARCHAR(50),
    municipio VARCHAR(50),
    sector VARCHAR(100),
    latitud DECIMAL(10, 8) COMMENT 'Coordenada GPS',
    longitud DECIMAL(11, 8) COMMENT 'Coordenada GPS',
    telefono VARCHAR(20),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_cliente_codigo (cliente_id, codigo),
    INDEX idx_cliente (cliente_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB COMMENT='Ubicaciones físicas de cada cliente';
```

**Campos clave**:
- `cliente_id`: FK hacia clientes (REQUIRED, debe existir y estar activo)
- `codigo`: Código único dentro del cliente (UK compuesto: cliente_id + codigo)
- `latitud`, `longitud`: Coordenadas GPS opcionales
  - Latitud: -90 a 90 (DECIMAL 10,8)
  - Longitud: -180 a 180 (DECIMAL 11,8)
- `provincia`, `municipio`, `sector`: Campos de ubicación geográfica RD
- Soft delete: `activo = false`

### Validaciones Especiales

1. **cliente_id debe existir y estar activo**:
   - Verificar en `clientes` WHERE `id = ? AND activo = TRUE`

2. **Código único por cliente**:
   - Constraint UK: `(cliente_id, codigo)`
   - Permite mismos códigos en diferentes clientes

3. **Coordenadas GPS** (opcionales):
   - Formato esperado del frontend: "latitud,longitud" (ej: "18.486058,-69.931212")
   - Validar rangos:
     - Latitud: -90 <= lat <= 90
     - Longitud: -180 <= lng <= 180
   - Almacenar como DECIMAL separados (latitud, longitud)

4. **No eliminar si tiene puestos activos**:
   - Antes de soft delete, verificar:
     ```sql
     SELECT COUNT(*) FROM puestos
     WHERE ubicacion_id = ? AND activo = TRUE
     ```
   - Si count > 0: 400 Bad Request con mensaje claro

### Permisos por Endpoint

- **GET** `/api/ubicaciones`, `/api/ubicaciones/:id`: ADMIN, SUPERVISOR, CONSULTA (todos)
- **POST** `/api/ubicaciones`: ADMIN, SUPERVISOR
- **PUT** `/api/ubicaciones/:id`: ADMIN, SUPERVISOR
- **DELETE** `/api/ubicaciones/:id`: ADMIN (solo administradores)

### Referencia: Implementación de Clientes

Archivos base creados en T2.07:
- `backend/src/models/cliente.model.ts` - Modelo TypeScript
- `backend/src/schemas/cliente.schema.ts` - Schemas Zod
- `backend/src/services/clientes.service.ts` - Lógica de negocio
- `backend/src/controllers/clientes.controller.ts` - Controladores HTTP
- `backend/src/routes/clientes.routes.ts` - Rutas protegidas

Seguir misma estructura y patrones.

---

## Subtareas

### 1. Crear modelo TypeScript para Ubicaciones

**Descripción**: Definir interfaces, tipos y DTOs para ubicaciones.

**Archivos a crear**:
- `backend/src/models/ubicacion.model.ts`

**Contenido**:

```typescript
// Interfaces principales
export interface Ubicacion {
  id: number;
  cliente_id: number;
  codigo: string;
  nombre: string;
  direccion: string | null;
  provincia: string | null;
  municipio: string | null;
  sector: string | null;
  latitud: number | null;  // DECIMAL(10,8)
  longitud: number | null; // DECIMAL(11,8)
  telefono: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

// DTOs
export interface CreateUbicacionDTO {
  cliente_id: number;
  codigo: string;
  nombre: string;
  direccion?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  sector?: string | null;
  coordenadas_gps?: string | null; // Formato: "lat,lng"
  telefono?: string | null;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
}

export interface UpdateUbicacionDTO {
  codigo?: string;
  nombre?: string;
  direccion?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  sector?: string | null;
  coordenadas_gps?: string | null;
  telefono?: string | null;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
  activo?: boolean;
}

export interface PaginatedUbicacionesDTO {
  data: Ubicacion[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UbicacionConRelaciones extends Ubicacion {
  cliente_nombre: string;
  puestos_count: number;
}

// Utility types
export type NuevaUbicacionDB = Omit<Ubicacion, 'id' | 'created_at' | 'updated_at'>;
export type UbicacionActualizable = Partial<Omit<Ubicacion, 'id' | 'cliente_id' | 'created_at' | 'updated_at'>>;

// Constantes de validación
export const UBICACION_VALIDATION = {
  CODIGO: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    REGEX: /^[A-Z0-9_-]+$/i
  },
  NOMBRE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 150
  },
  PROVINCIA: {
    MAX_LENGTH: 50
  },
  MUNICIPIO: {
    MAX_LENGTH: 50
  },
  SECTOR: {
    MAX_LENGTH: 100
  },
  COORDENADAS: {
    LATITUD_MIN: -90,
    LATITUD_MAX: 90,
    LONGITUD_MIN: -180,
    LONGITUD_MAX: 180
  },
  TELEFONO: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 20
  },
  DIRECCION: {
    MAX_LENGTH: 500
  },
  CONTACTO_NOMBRE: {
    MAX_LENGTH: 100
  }
} as const;

// Helper functions
export function parseCoordenadasGPS(coordenadas: string): { latitud: number; longitud: number } | null;
export function isValidLatitud(lat: number): boolean;
export function isValidLongitud(lng: number): boolean;
export function formatCoordenadasGPS(latitud: number | null, longitud: number | null): string | null;
export function normalizeCodigo(codigo: string): string;
export function dtoToNuevaUbicacionDB(dto: CreateUbicacionDTO): NuevaUbicacionDB;
```

**Resultado esperado**: Archivo con todas las interfaces, tipos, constantes y helpers.

---

### 2. Crear schemas Zod para validación

**Descripción**: Definir schemas de validación para requests, queries y params.

**Archivos a crear**:
- `backend/src/schemas/ubicacion.schema.ts`

**Contenido**:

```typescript
import { z } from 'zod';
import { UBICACION_VALIDATION } from '../models/ubicacion.model';

// Building blocks
const codigoSchema = z.string()
  .min(UBICACION_VALIDATION.CODIGO.MIN_LENGTH)
  .max(UBICACION_VALIDATION.CODIGO.MAX_LENGTH)
  .regex(UBICACION_VALIDATION.CODIGO.REGEX)
  .trim()
  .transform((val) => val.toUpperCase());

const nombreSchema = z.string()
  .min(1)
  .max(UBICACION_VALIDATION.NOMBRE.MAX_LENGTH)
  .trim();

const clienteIdSchema = z.number()
  .int()
  .positive('El cliente_id debe ser un número positivo');

// Schema especial para coordenadas GPS
const coordenadasGPSSchema = z.string()
  .trim()
  .regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, 'Formato inválido. Use: latitud,longitud (ej: 18.486058,-69.931212)')
  .refine((val) => {
    const [lat, lng] = val.split(',').map(Number);
    return lat >= UBICACION_VALIDATION.COORDENADAS.LATITUD_MIN &&
           lat <= UBICACION_VALIDATION.COORDENADAS.LATITUD_MAX &&
           lng >= UBICACION_VALIDATION.COORDENADAS.LONGITUD_MIN &&
           lng <= UBICACION_VALIDATION.COORDENADAS.LONGITUD_MAX;
  }, 'Coordenadas fuera de rango. Latitud: -90 a 90, Longitud: -180 a 180')
  .optional()
  .nullable();

// Schemas de endpoints
export const createUbicacionSchema = z.object({
  cliente_id: clienteIdSchema,
  codigo: codigoSchema,
  nombre: nombreSchema,
  direccion: z.string().max(500).trim().optional().nullable(),
  provincia: z.string().max(50).trim().optional().nullable(),
  municipio: z.string().max(50).trim().optional().nullable(),
  sector: z.string().max(100).trim().optional().nullable(),
  coordenadas_gps: coordenadasGPSSchema,
  telefono: z.string().min(10).max(20).trim().optional().nullable(),
  contacto_nombre: z.string().max(100).trim().optional().nullable(),
  contacto_telefono: z.string().min(10).max(20).trim().optional().nullable()
});

export const updateUbicacionSchema = z.object({
  codigo: codigoSchema.optional(),
  nombre: nombreSchema.optional(),
  direccion: z.string().max(500).trim().optional().nullable(),
  provincia: z.string().max(50).trim().optional().nullable(),
  municipio: z.string().max(50).trim().optional().nullable(),
  sector: z.string().max(100).trim().optional().nullable(),
  coordenadas_gps: coordenadasGPSSchema,
  telefono: z.string().min(10).max(20).trim().optional().nullable(),
  contacto_nombre: z.string().max(100).trim().optional().nullable(),
  contacto_telefono: z.string().min(10).max(20).trim().optional().nullable(),
  activo: z.boolean().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);

export const ubicacionIdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID de ubicación inválido')
    .transform(Number)
    .refine((n) => n > 0, 'ID debe ser positivo')
});

export const ubicacionesPaginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).refine((n) => n > 0),
  pageSize: z.string().optional().default('20').transform(Number).refine((n) => n > 0 && n <= 100),
  search: z.string().optional().transform((val) => val?.trim() || undefined),
  cliente_id: z.string().optional().transform((val) => val ? Number(val) : undefined)
});

export type CreateUbicacionInput = z.infer<typeof createUbicacionSchema>;
export type UpdateUbicacionInput = z.infer<typeof updateUbicacionSchema>;
export type UbicacionIdParam = z.infer<typeof ubicacionIdParamSchema>;
export type UbicacionesPaginationQuery = z.infer<typeof ubicacionesPaginationQuerySchema>;
```

**Resultado esperado**: Schemas Zod completos con validaciones de negocio incluidas (coordenadas GPS).

---

### 3. Crear servicio de ubicaciones

**Descripción**: Implementar lógica de negocio para todas las operaciones CRUD.

**Archivos a crear**:
- `backend/src/services/ubicaciones.service.ts`

**Funciones a implementar**:

```typescript
// 1. Listar con paginación, búsqueda y filtro por cliente
export async function getUbicaciones(
  page: number,
  pageSize: number,
  search?: string,
  cliente_id?: number
): Promise<PaginatedUbicacionesDTO>

// 2. Obtener por ID con JOIN a cliente y count de puestos
export async function getUbicacionById(id: number): Promise<UbicacionConRelaciones>

// 3. Crear nueva ubicación
export async function createUbicacion(dto: CreateUbicacionDTO): Promise<Ubicacion>

// 4. Actualizar ubicación
export async function updateUbicacion(id: number, dto: UpdateUbicacionDTO): Promise<Ubicacion>

// 5. Eliminar (soft delete) con validación de puestos activos
export async function deleteUbicacion(id: number): Promise<void>

// Helpers internos
async function _clienteExisteYActivo(cliente_id: number): Promise<boolean>
async function _ubicacionTienePuestosActivos(ubicacion_id: number): Promise<boolean>
async function _codigoUnicoEnCliente(cliente_id: number, codigo: string, excludeId?: number): Promise<boolean>
```

**Validaciones especiales en servicio**:

1. **createUbicacion**:
   - Verificar cliente existe y está activo
   - Verificar código único dentro del cliente
   - Parsear coordenadas_gps → latitud, longitud separados

2. **updateUbicacion**:
   - Si se cambia código, verificar unicidad en cliente
   - Parsear coordenadas_gps si se proporciona

3. **deleteUbicacion**:
   - Verificar que no tenga puestos activos
   - Si tiene puestos activos: `throw new Error('No se puede eliminar ubicación con puestos activos')`

**Query para getUbicaciones con cliente_id filter**:

```sql
SELECT u.*
FROM ubicaciones u
WHERE (
  (:search IS NULL) OR
  (u.nombre LIKE :search OR u.direccion LIKE :search OR u.provincia LIKE :search OR u.municipio LIKE :search)
)
AND (:cliente_id IS NULL OR u.cliente_id = :cliente_id)
ORDER BY u.nombre ASC
LIMIT :pageSize OFFSET :offset
```

**Query para getUbicacionById con JOIN**:

```sql
SELECT
  u.*,
  c.nombre as cliente_nombre,
  COALESCE(COUNT(p.id), 0) as puestos_count
FROM ubicaciones u
INNER JOIN clientes c ON u.cliente_id = c.id
LEFT JOIN puestos p ON u.id = p.ubicacion_id AND p.activo = TRUE
WHERE u.id = :id
GROUP BY u.id, c.nombre
```

**Resultado esperado**: Servicio completo con todas las funciones y validaciones.

---

### 4. Crear controladores HTTP

**Descripción**: Implementar controladores que manejan requests/responses.

**Archivos a crear**:
- `backend/src/controllers/ubicaciones.controller.ts`

**Controladores a implementar**:

```typescript
// GET /api/ubicaciones
export async function getUbicacionesController(req: Request, res: Response): Promise<void>

// GET /api/ubicaciones/:id
export async function getUbicacionByIdController(req: Request, res: Response): Promise<void>

// POST /api/ubicaciones
export async function createUbicacionController(req: Request, res: Response): Promise<void>

// PUT /api/ubicaciones/:id
export async function updateUbicacionController(req: Request, res: Response): Promise<void>

// DELETE /api/ubicaciones/:id
export async function deleteUbicacionController(req: Request, res: Response): Promise<void>
```

**Manejo de errores**:
- 400 Bad Request: Validación fallida, código duplicado, puestos activos al eliminar
- 404 Not Found: Ubicación no existe, cliente no existe
- 500 Internal Server Error: Errores de BD inesperados

**Formato de respuesta**:

```typescript
// Success (GET list)
{
  data: Ubicacion[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}

// Success (GET by ID, POST, PUT)
{
  id: number,
  cliente_id: number,
  codigo: string,
  nombre: string,
  // ... resto de campos
  cliente_nombre: string,  // Solo en GET by ID
  puestos_count: number    // Solo en GET by ID
}

// Success (DELETE)
{
  message: "Ubicación desactivada exitosamente"
}

// Error
{
  error: string,
  message: string,
  details?: any  // Solo en desarrollo
}
```

**Resultado esperado**: Controladores con manejo completo de errores y responses consistentes.

---

### 5. Crear rutas protegidas

**Descripción**: Definir rutas con autenticación y autorización por roles.

**Archivos a crear**:
- `backend/src/routes/ubicaciones.routes.ts`

**Rutas a definir**:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  getUbicacionesController,
  getUbicacionByIdController,
  createUbicacionController,
  updateUbicacionController,
  deleteUbicacionController
} from '../controllers/ubicaciones.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/ubicaciones - Todos los roles
router.get(
  '/',
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  getUbicacionesController
);

// GET /api/ubicaciones/:id - Todos los roles
router.get(
  '/:id',
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  getUbicacionByIdController
);

// POST /api/ubicaciones - ADMIN y SUPERVISOR
router.post(
  '/',
  requireRole('ADMIN', 'SUPERVISOR'),
  createUbicacionController
);

// PUT /api/ubicaciones/:id - ADMIN y SUPERVISOR
router.put(
  '/:id',
  requireRole('ADMIN', 'SUPERVISOR'),
  updateUbicacionController
);

// DELETE /api/ubicaciones/:id - Solo ADMIN
router.delete(
  '/:id',
  requireRole('ADMIN'),
  deleteUbicacionController
);

export default router;
```

**Integración en server.ts**:

```typescript
// Agregar al final de las rutas existentes en server.ts
import ubicacionesRoutes from './routes/ubicaciones.routes';
app.use('/api/ubicaciones', ubicacionesRoutes);
```

**Resultado esperado**: Rutas configuradas con autenticación y autorización correctas.

---

### 6. Crear tests de integración

**Descripción**: Implementar suite completa de tests para todos los endpoints.

**Archivos a crear**:
- `backend/tests/integration/ubicaciones.test.ts`

**Casos de test a implementar** (mínimo 12):

```typescript
describe('Ubicaciones API', () => {
  describe('POST /api/ubicaciones', () => {
    test('Debe crear ubicación con todos los campos', async () => {});
    test('Debe crear ubicación solo con campos requeridos', async () => {});
    test('Debe crear ubicación con coordenadas GPS válidas', async () => {});
    test('Debe rechazar si cliente_id no existe', async () => {});
    test('Debe rechazar si cliente está inactivo', async () => {});
    test('Debe rechazar si código duplicado en mismo cliente', async () => {});
    test('Debe permitir mismo código en diferentes clientes', async () => {});
    test('Debe rechazar coordenadas GPS inválidas', async () => {});
    test('Debe rechazar sin autenticación', async () => {});
    test('Debe rechazar para rol CONSULTA', async () => {});
  });

  describe('GET /api/ubicaciones', () => {
    test('Debe listar todas las ubicaciones con paginación', async () => {});
    test('Debe filtrar por búsqueda (nombre, dirección, provincia, municipio)', async () => {});
    test('Debe filtrar por cliente_id', async () => {});
    test('Debe funcionar para todos los roles autenticados', async () => {});
  });

  describe('GET /api/ubicaciones/:id', () => {
    test('Debe obtener ubicación con datos de cliente y count de puestos', async () => {});
    test('Debe retornar 404 si no existe', async () => {});
  });

  describe('PUT /api/ubicaciones/:id', () => {
    test('Debe actualizar campos editables', async () => {});
    test('Debe actualizar coordenadas GPS', async () => {});
    test('Debe rechazar código duplicado al cambiar', async () => {});
    test('Debe rechazar para rol CONSULTA', async () => {});
  });

  describe('DELETE /api/ubicaciones/:id', () => {
    test('Debe hacer soft delete si no tiene puestos activos', async () => {});
    test('Debe rechazar si tiene puestos activos', async () => {});
    test('Debe rechazar para roles no-ADMIN', async () => {});
  });
});
```

**Setup de tests**:
- Crear cliente de prueba antes de cada test
- Limpiar datos después de cada test
- Usar tokens JWT válidos
- Simular diferentes roles

**Comando de ejecución**:
```bash
npm test -- ubicaciones.test.ts
```

**Resultado esperado**: 12+ tests implementados y pasando.

---

## Criterios de Aceptación (checklist)

- [ ] **Modelo TypeScript** (`ubicacion.model.ts`):
  - [ ] Interfaces: Ubicacion, CreateUbicacionDTO, UpdateUbicacionDTO, PaginatedUbicacionesDTO, UbicacionConRelaciones
  - [ ] Constantes de validación exportadas
  - [ ] Helpers: parseCoordenadasGPS, isValidLatitud, isValidLongitud, formatCoordenadasGPS

- [ ] **Schemas Zod** (`ubicacion.schema.ts`):
  - [ ] createUbicacionSchema completo
  - [ ] updateUbicacionSchema completo
  - [ ] ubicacionIdParamSchema
  - [ ] ubicacionesPaginationQuerySchema con filtro cliente_id
  - [ ] Validación especial de coordenadas GPS (formato y rangos)

- [ ] **Servicio** (`ubicaciones.service.ts`):
  - [ ] getUbicaciones con paginación, búsqueda y filtro cliente_id
  - [ ] getUbicacionById con JOIN cliente y count puestos
  - [ ] createUbicacion con validación cliente activo
  - [ ] updateUbicacion con validación código único
  - [ ] deleteUbicacion con validación puestos activos

- [ ] **Controladores** (`ubicaciones.controller.ts`):
  - [ ] getUbicacionesController
  - [ ] getUbicacionByIdController
  - [ ] createUbicacionController
  - [ ] updateUbicacionController
  - [ ] deleteUbicacionController
  - [ ] Manejo de errores consistente (400, 404, 500)

- [ ] **Rutas** (`ubicaciones.routes.ts`):
  - [ ] GET /api/ubicaciones (ADMIN, SUPERVISOR, CONSULTA)
  - [ ] GET /api/ubicaciones/:id (ADMIN, SUPERVISOR, CONSULTA)
  - [ ] POST /api/ubicaciones (ADMIN, SUPERVISOR)
  - [ ] PUT /api/ubicaciones/:id (ADMIN, SUPERVISOR)
  - [ ] DELETE /api/ubicaciones/:id (ADMIN)
  - [ ] Integradas en server.ts

- [ ] **Tests de integración** (`ubicaciones.test.ts`):
  - [ ] 12+ casos de test implementados
  - [ ] Tests de validación cliente_id
  - [ ] Tests de coordenadas GPS
  - [ ] Tests de código único por cliente
  - [ ] Tests de validación puestos activos antes de eliminar
  - [ ] Tests de roles/permisos
  - [ ] Todos los tests pasando

---

## Archivos a Generar

| Archivo | Descripción | Líneas Est. |
|---------|-------------|-------------|
| `backend/src/models/ubicacion.model.ts` | Modelo TypeScript | ~400 |
| `backend/src/schemas/ubicacion.schema.ts` | Schemas Zod | ~250 |
| `backend/src/services/ubicaciones.service.ts` | Lógica de negocio | ~450 |
| `backend/src/controllers/ubicaciones.controller.ts` | Controladores HTTP | ~300 |
| `backend/src/routes/ubicaciones.routes.ts` | Rutas Express | ~50 |
| `backend/tests/integration/ubicaciones.test.ts` | Tests de integración | ~600 |
| **TOTAL** | | **~2050 líneas** |

---

## Riesgos y Consideraciones

### Riesgo 1: Validación de Coordenadas GPS
**Problema**: Frontend puede enviar formato incorrecto (ej: objeto {lat, lng} en vez de string)
**Mitigación**:
- Schema Zod valida formato "lat,lng" estricto
- Helper parseCoordenadasGPS valida y parsea
- Documentar formato esperado en error messages

### Riesgo 2: Código Duplicado Entre Clientes
**Problema**: UK compuesto (cliente_id, codigo) puede confundir
**Mitigación**:
- Validar en servicio antes de INSERT
- Mensaje de error claro: "El código XXX ya existe para este cliente"
- Permitir mismo código en diferentes clientes (es intencional)

### Riesgo 3: Eliminación con Puestos Activos
**Problema**: Integridad referencial puede bloquear delete
**Mitigación**:
- Verificar count de puestos activos ANTES de intentar soft delete
- Error 400 con mensaje: "No se puede eliminar ubicación con N puestos activos"
- Sugerir desactivar puestos primero

### Riesgo 4: Filtro por cliente_id Opcional
**Problema**: Query SQL con parámetro opcional puede ser complejo
**Mitigación**:
- Usar construcción condicional de WHERE clause
- Ejemplo: `WHERE (:cliente_id IS NULL OR u.cliente_id = :cliente_id)`
- Testear con y sin filtro

### Riesgo 5: Ejecución en Paralelo con T2.16 (RRHH)
**Problema**: Posible conflicto si ambos modifican archivos compartidos
**Mitigación**:
- **MI ÁMBITO**: ubicacion.model.ts, ubicacion.schema.ts, ubicaciones.*
- **NO TOCAR**: rrhh.* (ámbito del otro subagente)
- **SHARED**: server.ts (solo agregar import y use al final)
- Revisar git status antes de commitear

---

## Notas Adicionales

### Provincias de República Dominicana (referencia)

Para seeds de prueba, provincias válidas:
- Santo Domingo
- Distrito Nacional
- Santiago
- La Vega
- San Cristóbal
- Puerto Plata
- La Romana
- etc. (32 provincias)

### Formato de Coordenadas GPS

**Entrada del frontend**: "18.486058,-69.931212"
**Almacenamiento BD**:
- `latitud`: 18.486058 (DECIMAL 10,8)
- `longitud`: -69.931212 (DECIMAL 11,8)

**Lectura BD → Frontend**:
- Retornar ambos campos separados
- Opcionalmente, agregar campo calculado `coordenadas_gps: "18.486058,-69.931212"`

### Dependencia con T2.09 (Puestos)

Esta tarea NO bloquea T2.09, pero T2.09 depende de esta.

Asegurarse de que la validación de `puestos_count` funcione correctamente cuando T2.09 se implemente.

---

**Última actualización**: 2026-01-18
