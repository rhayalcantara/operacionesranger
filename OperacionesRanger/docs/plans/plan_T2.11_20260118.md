# Plan: T2.11 - Implementar CRUD de Configuración de Turnos

**Fecha**: 2026-01-18
**Tarea padre**: T2.11
**Fase**: Fase 2 - Backend Core
**Estimación**: 2-3 horas

## Objetivo

Implementar endpoints para la gestión de configuración de turnos (horarios día/noche). La tabla `configuracion_turnos` contiene únicamente 2 registros (DIURNO y NOCTURNO) que NO se crean ni eliminan, solo se actualizan. Estos horarios determinan cómo se clasifican automáticamente los turnos según la hora de entrada.

## Contexto

### Tabla de Base de Datos
```sql
CREATE TABLE configuracion_turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_turno ENUM('DIURNO', 'NOCTURNO') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tipo_turno (tipo_turno)
);

-- Datos iniciales (ya existen)
INSERT INTO configuracion_turnos (tipo_turno, hora_inicio, hora_fin, descripcion) VALUES
('DIURNO', '06:00:00', '18:00:00', 'Turno diurno: 6:00 AM a 6:00 PM'),
('NOCTURNO', '18:00:00', '06:00:00', 'Turno nocturno: 6:00 PM a 6:00 AM');
```

### Reglas de Negocio Importantes

1. **Solo 2 registros**: La tabla siempre tiene exactamente 2 registros (DIURNO y NOCTURNO)
2. **No CREATE ni DELETE**: Solo se implementa UPDATE (no POST ni DELETE endpoints)
3. **Validación de horarios**:
   - `hora_inicio` y `hora_fin` deben tener formato TIME válido (HH:MM:SS o HH:MM)
   - Los horarios DIURNO y NOCTURNO deben cubrir 24 horas
   - No puede haber solapamiento (aunque los horarios nocturnos cruzan medianoche)
4. **Impacto en sistema**: Estos horarios son usados por `sp_determinar_tipo_turno` para clasificar turnos automáticamente
5. **Permisos**: Solo ADMIN puede actualizar, todos los usuarios autenticados pueden consultar

### Arquitectura Existente

El proyecto sigue estos patrones (basados en archivos existentes):

- **Modelos**: Interfaces TypeScript en `src/models/*.model.ts`
- **Schemas**: Validación Zod en `src/schemas/*.schema.ts`
- **Servicios**: Lógica de negocio en `src/services/*.service.ts`
- **Controladores**: Handlers de rutas en `src/controllers/*.controller.ts`
- **Rutas**: Definición de endpoints en `src/routes/*.routes.ts`
- **Middlewares**: `authMiddleware` + `requireRole('ADMIN')` para protección

## Subtareas

### 1. Crear modelo de datos (config-turnos.model.ts)
- **Descripción**: Definir interfaces TypeScript para ConfiguracionTurno
- **Archivos a crear**: `backend/src/models/config-turnos.model.ts`
- **Resultado esperado**:
  - Interface `ConfiguracionTurno` con todos los campos de la tabla
  - Type `TipoTurno` como enum ('DIURNO' | 'NOCTURNO')
  - DTO `UpdateConfigTurnoDTO` con campos actualizables
  - DTO `ConfigTurnoResponseDTO` para respuestas de API
  - Type guard `isValidTipoTurno()`

### 2. Crear schemas de validación (config-turnos.schema.ts)
- **Descripción**: Schemas Zod para validar requests de endpoints
- **Archivos a crear**: `backend/src/schemas/config-turnos.schema.ts`
- **Resultado esperado**:
  - `updateConfigTurnoSchema`: Validación para PUT (hora_inicio, hora_fin, descripcion, activo opcionales)
  - `configTurnoIdParamSchema`: Validación para parámetro :id
  - Validación de formato TIME usando regex o refinement
  - Mensajes de error descriptivos en español

### 3. Implementar servicio de lógica de negocio (config-turnos.service.ts)
- **Descripción**: Servicio con operaciones CRUD y validaciones de horarios
- **Archivos a crear**: `backend/src/services/config-turnos.service.ts`
- **Funciones a implementar**:
  - `getAllConfiguraciones()`: Obtener las 2 configuraciones
  - `getConfiguracionById(id)`: Obtener una configuración por ID
  - `updateConfiguracion(id, data)`: Actualizar configuración con validaciones
  - `validateHorarios(id, hora_inicio, hora_fin)`: Validar que no haya solapamiento y que cubran 24h
- **Validaciones especiales**:
  - Verificar que solo existan 2 configuraciones (DIURNO y NOCTURNO)
  - Validar que no haya solapamiento de horarios
  - Validar que los horarios cubran exactamente 24 horas
  - Manejar horarios que cruzan medianoche (ej: 18:00 - 06:00)
- **Manejo de errores**: Lanzar errores descriptivos para validaciones fallidas

### 4. Crear controladores (config-turnos.controller.ts)
- **Descripción**: Handlers de rutas que usan el servicio
- **Archivos a crear**: `backend/src/controllers/config-turnos.controller.ts`
- **Funciones a implementar**:
  - `getConfiguraciones`: GET /api/configuracion-turnos (todos)
  - `getConfiguracionById`: GET /api/configuracion-turnos/:id (por ID)
  - `updateConfiguracion`: PUT /api/configuracion-turnos/:id (actualizar)
- **Manejo de errores**: Try-catch con respuestas HTTP apropiadas
- **Respuestas**:
  - 200 OK: Operación exitosa
  - 400 Bad Request: Validación fallida
  - 404 Not Found: Configuración no encontrada
  - 500 Internal Server Error: Error del servidor

### 5. Definir rutas (config-turnos.routes.ts)
- **Descripción**: Definir endpoints con middlewares de autenticación/autorización
- **Archivos a crear**: `backend/src/routes/config-turnos.routes.ts`
- **Rutas a definir**:
  ```typescript
  GET    /api/configuracion-turnos          -> authMiddleware -> getConfiguraciones
  GET    /api/configuracion-turnos/:id      -> authMiddleware -> getConfiguracionById
  PUT    /api/configuracion-turnos/:id      -> authMiddleware -> requireRole('ADMIN') -> updateConfiguracion
  ```
- **NO implementar**: POST (create) ni DELETE endpoints
- **Middlewares**: authMiddleware para todas, requireRole('ADMIN') solo para PUT

### 6. Registrar rutas en servidor
- **Descripción**: Agregar rutas de config-turnos al servidor Express
- **Archivos a modificar**: `backend/src/server.ts` o archivo de rutas central
- **Acción**: Importar y registrar `configTurnosRoutes` en el path `/api/configuracion-turnos`

### 7. Crear tests de integración (config-turnos.test.ts)
- **Descripción**: Suite completa de tests con Supertest
- **Archivos a crear**: `backend/tests/integration/config-turnos.test.ts`
- **Casos de prueba a implementar** (mínimo 8):
  1. GET /api/configuracion-turnos - obtener todas (debe retornar 2)
  2. GET /api/configuracion-turnos/:id - obtener DIURNO por ID
  3. GET /api/configuracion-turnos/:id - obtener NOCTURNO por ID
  4. GET /api/configuracion-turnos/:id - error 404 con ID inválido
  5. PUT /api/configuracion-turnos/:id - actualizar horario DIURNO (como ADMIN)
  6. PUT /api/configuracion-turnos/:id - actualizar descripción
  7. PUT /api/configuracion-turnos/:id - error 403 sin rol ADMIN
  8. PUT /api/configuracion-turnos/:id - error 400 con horario inválido (solapamiento)
  9. PUT /api/configuracion-turnos/:id - error 400 con formato TIME inválido
  10. GET /api/configuracion-turnos - error 401 sin token
- **Setup de tests**:
  - Usar base de datos de prueba
  - Crear usuario ADMIN para autenticación
  - Limpiar/restaurar datos después de cada test
  - Generar tokens JWT válidos

## Criterios de Aceptación (checklist)

- [ ] **Modelo** (`config-turnos.model.ts`): Interfaces TypeScript creadas y exportadas
- [ ] **Schemas** (`config-turnos.schema.ts`): Schemas Zod funcionando correctamente
- [ ] **Servicio** (`config-turnos.service.ts`): Funciones CRUD implementadas con validaciones
- [ ] **Controladores** (`config-turnos.controller.ts`): 3 controladores (GET list, GET by id, PUT)
- [ ] **Rutas** (`config-turnos.routes.ts`): Solo 3 rutas (GET, GET/:id, PUT/:id)
- [ ] **Servidor**: Rutas registradas en servidor Express
- [ ] **Tests** (`config-turnos.test.ts`): Mínimo 8 tests de integración pasando
- [ ] **Validación de horarios**: No permite solapamiento entre DIURNO y NOCTURNO
- [ ] **Permisos**: Solo ADMIN puede actualizar (PUT)
- [ ] **NO implementado**: POST (create) ni DELETE endpoints
- [ ] **Respuestas HTTP**: Códigos apropiados (200, 400, 403, 404, 500)

## Archivos a Generar

- `backend/src/models/config-turnos.model.ts` - Interfaces TypeScript
- `backend/src/schemas/config-turnos.schema.ts` - Schemas de validación Zod
- `backend/src/services/config-turnos.service.ts` - Lógica de negocio
- `backend/src/controllers/config-turnos.controller.ts` - Controladores HTTP
- `backend/src/routes/config-turnos.routes.ts` - Definición de rutas
- `backend/tests/integration/config-turnos.test.ts` - Tests de integración

## Riesgos y Consideraciones

### Riesgo 1: Validación de horarios que cruzan medianoche
**Descripción**: El turno NOCTURNO (18:00-06:00) cruza medianoche, lo cual puede complicar la validación de solapamiento.

**Mitigación**:
- Implementar lógica especial para horarios que cruzan medianoche
- Considerar que un horario cruza medianoche si `hora_fin < hora_inicio`
- Validar usando rangos de tiempo absolutos (convertir a minutos desde medianoche)

### Riesgo 2: Impacto en procedimiento almacenado `sp_determinar_tipo_turno`
**Descripción**: Cambiar los horarios afecta directamente cómo se clasifican los turnos en el stored procedure.

**Mitigación**:
- Documentar claramente en comentarios que estos cambios afectan clasificación de turnos
- Considerar agregar validación de que al menos una configuración esté activa

### Riesgo 3: Conflictos con otras tareas en paralelo
**Descripción**: Se están ejecutando T2.05 (usuarios), T2.07 (clientes), T2.10 (feriados) en paralelo.

**Mitigación**:
- Esta tarea NO toca archivos de usuarios, clientes o feriados
- Solo crea archivos nuevos con prefijo `config-turnos.*`
- Única modificación compartida: `server.ts` para registrar rutas (conflicto bajo)
- Si server.ts ya fue modificado, agregar línea de registro de rutas sin tocar lo existente

### Riesgo 4: No hay datos de seed
**Descripción**: Los 2 registros iniciales ya están en el schema SQL, pero no hay script de seed.

**Mitigación**:
- Asumir que los datos iniciales ya existen (fueron creados por schema SQL)
- En tests, verificar que existen antes de ejecutar
- Si no existen en BD de prueba, insertar en beforeAll() de tests

## Notas Adicionales

### Validación de Cobertura de 24 Horas

Algoritmo para validar que DIURNO y NOCTURNO cubren exactamente 24 horas:

```typescript
function validateCobertura24Horas(diurno: ConfigTurno, nocturno: ConfigTurno): boolean {
  // DIURNO debe terminar donde empieza NOCTURNO
  if (diurno.hora_fin !== nocturno.hora_inicio) return false;

  // NOCTURNO debe terminar donde empieza DIURNO (puede cruzar medianoche)
  if (nocturno.hora_fin !== diurno.hora_inicio) return false;

  return true;
}
```

### Formato de Respuesta de API

```json
// GET /api/configuracion-turnos
{
  "data": [
    {
      "id": 1,
      "tipo_turno": "DIURNO",
      "hora_inicio": "06:00:00",
      "hora_fin": "18:00:00",
      "descripcion": "Turno diurno: 6:00 AM a 6:00 PM",
      "activo": true,
      "created_at": "2026-01-17T12:00:00.000Z",
      "updated_at": "2026-01-18T10:30:00.000Z"
    },
    {
      "id": 2,
      "tipo_turno": "NOCTURNO",
      "hora_inicio": "18:00:00",
      "hora_fin": "06:00:00",
      "descripcion": "Turno nocturno: 6:00 PM a 6:00 AM",
      "activo": true,
      "created_at": "2026-01-17T12:00:00.000Z",
      "updated_at": "2026-01-17T12:00:00.000Z"
    }
  ],
  "total": 2
}

// PUT /api/configuracion-turnos/1
// Body: { "hora_inicio": "07:00:00", "hora_fin": "19:00:00", "descripcion": "Turno diurno actualizado" }
{
  "message": "Configuración actualizada exitosamente",
  "data": {
    "id": 1,
    "tipo_turno": "DIURNO",
    "hora_inicio": "07:00:00",
    "hora_fin": "19:00:00",
    "descripcion": "Turno diurno actualizado",
    "activo": true,
    "updated_at": "2026-01-18T15:45:00.000Z"
  }
}
```

### Conexión con Base de Datos

Usar el pool de conexión existente (debe estar configurado en `src/config/database.ts` de T2.07):

```typescript
import pool from '../config/database';

// Ejemplo de query
const [rows] = await pool.execute(
  'SELECT * FROM configuracion_turnos WHERE id = ?',
  [id]
);
```

---

**Estado**: Listo para ejecución
**Dependencias verificadas**: T2.04 (middlewares) ✓
**Conflictos potenciales**: Ninguno (archivos nuevos, mínima modificación a server.ts)
