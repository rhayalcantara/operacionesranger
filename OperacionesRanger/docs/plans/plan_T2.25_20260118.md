# Plan de Implementación: T2.25 - Historial de Reportes Generados

**Fecha**: 2026-01-18
**Tarea**: T2.25 - Implementar historial de reportes generados
**Módulo**: Reports & CSV Export (Fase 2)
**Estimación**: 3h 30min

---

## 1. Contexto

### Objetivo
Implementar sistema de historial para reportes CSV generados, permitiendo trazabilidad y re-descarga de reportes anteriores.

### Alcance
- Crear tabla `sys_reportes_generados` para almacenar historial
- Implementar modelo TypeScript `HistorialReporte`
- Extender servicio de reportes con funciones de historial
- Agregar controllers para listar y descargar reportes históricos
- Integrar con endpoints existentes (T2.23 y T2.24)
- Crear tests de integración completos

### Dependencias
- ✅ T2.23: Generación de reporte CSV (completado)
- ✅ T2.24: Marcar turnos como procesados (completado)
- ✅ Authentication & Authorization system (completado)

---

## 2. Diseño Técnico

### 2.1 Tabla Base de Datos

**Tabla**: `sys_reportes_generados`

```sql
CREATE TABLE IF NOT EXISTS sys_reportes_generados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  cantidad_turnos INT NOT NULL DEFAULT 0,
  fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nomina_id INT NULL DEFAULT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,

  -- Foreign keys
  CONSTRAINT fk_reportes_user
    FOREIGN KEY (user_id) REFERENCES sys_usuarios(id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes
  INDEX idx_reportes_user (user_id),
  INDEX idx_reportes_fechas (fecha_inicio, fecha_fin),
  INDEX idx_reportes_nomina (nomina_id),
  INDEX idx_reportes_generacion (fecha_generacion DESC)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de reportes CSV generados para nómina';
```

**Campos**:
- `id`: PK, auto-increment
- `user_id`: FK a sys_usuarios (quién generó el reporte)
- `fecha_inicio`, `fecha_fin`: Rango del reporte
- `cantidad_turnos`: Número de turnos incluidos en el reporte
- `fecha_generacion`: Timestamp de generación (auto)
- `nomina_id`: FK a tabla externa de nómina (NULL hasta que se procese)
- `nombre_archivo`: Nombre del archivo CSV generado

### 2.2 Modelo TypeScript

**Archivo**: `backend/src/models/reporte.model.ts`

```typescript
/**
 * Historial de Reporte (tabla: sys_reportes_generados)
 */
export interface HistorialReporte {
  id: number;
  user_id: number;
  fecha_inicio: string;  // YYYY-MM-DD
  fecha_fin: string;     // YYYY-MM-DD
  cantidad_turnos: number;
  fecha_generacion: Date;
  nomina_id: number | null;
  nombre_archivo: string;
}

/**
 * DTO para crear historial de reporte
 */
export interface CreateHistorialReporteDTO {
  user_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
  nombre_archivo: string;
}

/**
 * DTO para respuesta de historial con datos de usuario
 */
export interface HistorialReporteDTO {
  id: number;
  usuario: {
    id: number;
    username: string;
    nombre_completo: string;
  };
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
  fecha_generacion: Date;
  nomina_id: number | null;
  nombre_archivo: string;
}

/**
 * DTO para respuesta paginada de historial
 */
export interface PaginatedHistorialDTO {
  data: HistorialReporteDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 2.3 Servicio (reportes.service.ts)

**Nuevas funciones**:

1. **`guardarHistorialReporte()`**
   - Parámetros: CreateHistorialReporteDTO
   - Retorna: Promise<number> (id del registro)
   - INSERT en sys_reportes_generados

2. **`getHistorialReportes()`**
   - Parámetros: page, pageSize
   - Retorna: Promise<PaginatedHistorialDTO>
   - SELECT con JOIN a sys_usuarios
   - Ordenado por fecha_generacion DESC

3. **`getHistorialReporteById()`**
   - Parámetros: id
   - Retorna: Promise<HistorialReporteDTO | null>
   - SELECT con JOIN a sys_usuarios

4. **`actualizarNominaIdHistorial()`**
   - Parámetros: fecha_inicio, fecha_fin, nomina_id
   - Retorna: Promise<number> (registros actualizados)
   - UPDATE para marcar nomina_id

5. **`contarTurnosEnRango()`**
   - Parámetros: fecha_inicio, fecha_fin
   - Retorna: Promise<number>
   - COUNT de turnos NO procesados en rango

### 2.4 Controller (reportes.controller.ts)

**Modificaciones**:

1. **`generarReporteNominaController()`** (MODIFICAR)
   - Después de generar CSV exitosamente
   - Contar turnos en rango (contarTurnosEnRango)
   - Guardar en historial (guardarHistorialReporte)
   - Continuar con descarga del CSV

2. **`marcarProcesadosController()`** (MODIFICAR)
   - Después de marcar turnos como procesados
   - Actualizar nomina_id en historial (actualizarNominaIdHistorial)
   - Retornar resultado

**Nuevos controllers**:

3. **`getHistorialController()`** (NUEVO)
   - Query params: page (default: 1), pageSize (default: 10)
   - Llamar a getHistorialReportes()
   - Retornar JSON paginado

4. **`descargarReporteHistorialController()`** (NUEVO)
   - Param: id (reporte)
   - Obtener reporte por ID
   - Validar que existe
   - Regenerar CSV con mismas fechas
   - Retornar CSV con headers apropiados

### 2.5 Routes (reportes.routes.ts)

**Nuevas rutas**:

```typescript
// GET /api/reportes/historial
// Permisos: ADMIN, SUPERVISOR, CONSULTA
router.get(
  '/historial',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  getHistorialController
);

// GET /api/reportes/historial/:id/descargar
// Permisos: ADMIN, SUPERVISOR, CONSULTA
router.get(
  '/historial/:id/descargar',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  descargarReporteHistorialController
);
```

---

## 3. Plan de Ejecución

### Paso 1: Migration SQL (20 min)
- [ ] Crear `database/migrations/006_create_sys_reportes_generados.sql`
- [ ] Definir tabla con estructura especificada
- [ ] Agregar foreign keys e indexes
- [ ] Ejecutar migration en base de datos local
- [ ] Verificar estructura con `DESCRIBE sys_reportes_generados`

### Paso 2: Modelo TypeScript (15 min)
- [ ] Crear `backend/src/models/reporte.model.ts`
- [ ] Definir interfaces:
  - HistorialReporte
  - CreateHistorialReporteDTO
  - HistorialReporteDTO
  - PaginatedHistorialDTO
- [ ] Documentar con JSDoc

### Paso 3: Servicio - Funciones de Historial (45 min)
- [ ] Abrir `backend/src/services/reportes.service.ts`
- [ ] Implementar `contarTurnosEnRango()`
- [ ] Implementar `guardarHistorialReporte()`
- [ ] Implementar `getHistorialReportes()` (con paginación)
- [ ] Implementar `getHistorialReporteById()`
- [ ] Implementar `actualizarNominaIdHistorial()`
- [ ] Agregar logs apropiados
- [ ] Manejar errores con try/catch

### Paso 4: Servicio - Integración (20 min)
- [ ] Modificar `generarReporteNomina()`:
  - Retornar cantidad de turnos junto con CSV
- [ ] Exportar las nuevas funciones

### Paso 5: Controller - Modificaciones (30 min)
- [ ] Abrir `backend/src/controllers/reportes.controller.ts`
- [ ] Modificar `generarReporteNominaController()`:
  - Contar turnos en rango
  - Guardar historial después de generar CSV
  - Obtener user_id de req.user.id
- [ ] Modificar `marcarProcesadosController()`:
  - Actualizar nomina_id en historial después de marcar procesados

### Paso 6: Controller - Nuevos Endpoints (30 min)
- [ ] Implementar `getHistorialController()`:
  - Parsear query params (page, pageSize)
  - Validar parámetros
  - Llamar a service
  - Retornar JSON
- [ ] Implementar `descargarReporteHistorialController()`:
  - Parsear param id
  - Obtener reporte por ID
  - Validar existencia (404 si no existe)
  - Regenerar CSV
  - Retornar con headers apropiados

### Paso 7: Routes (15 min)
- [ ] Abrir `backend/src/routes/reportes.routes.ts`
- [ ] Agregar GET /historial
- [ ] Agregar GET /historial/:id/descargar
- [ ] Aplicar middlewares apropiados
- [ ] Exportar nuevos controllers

### Paso 8: Tests de Integración (60 min)
- [ ] Crear/actualizar `backend/tests/integration/reportes.integration.test.ts`
- [ ] Setup: Crear usuario de prueba, limpiar historial
- [ ] Test Suite 1: Generación de reporte
  - Test 1: Generar reporte guarda en historial
  - Test 2: Historial incluye cantidad_turnos correcta
  - Test 3: Historial incluye nombre_archivo correcto
- [ ] Test Suite 2: Marcar como procesados
  - Test 4: Marcar como procesados actualiza nomina_id en historial
  - Test 5: Nomina_id NULL antes de marcar como procesados
- [ ] Test Suite 3: GET /historial
  - Test 6: Listar historial retorna datos correctos
  - Test 7: Paginación funciona correctamente
  - Test 8: Incluye datos de usuario (JOIN)
  - Test 9: Ordenado por fecha_generacion DESC
- [ ] Test Suite 4: GET /historial/:id/descargar
  - Test 10: Descargar reporte regenera CSV correctamente
  - Test 11: Retorna headers apropiados
  - Test 12: Error 404 si reporte no existe
- [ ] Test Suite 5: Autorización
  - Test 13: ADMIN puede acceder a historial
  - Test 14: SUPERVISOR puede acceder a historial
  - Test 15: CONSULTA puede acceder a historial
- [ ] Cleanup: Eliminar datos de prueba

### Paso 9: Documentación (15 min)
- [ ] Crear `docs/completed/T2.25_historial_reportes.md`
- [ ] Documentar:
  - Resumen de implementación
  - Estructura de tabla
  - Endpoints creados/modificados
  - Flujo de integración
  - Ejemplos de uso
  - Tests implementados
  - Consideraciones de seguridad

### Paso 10: Verificación Manual (15 min)
- [ ] Iniciar servidor con `npm run dev`
- [ ] Generar reporte CSV (POST /api/reportes/nomina)
- [ ] Verificar entrada en historial (GET /api/reportes/historial)
- [ ] Marcar como procesados (POST /api/reportes/marcar-procesados)
- [ ] Verificar actualización de nomina_id
- [ ] Descargar reporte histórico (GET /api/reportes/historial/:id/descargar)
- [ ] Verificar CSV regenerado correctamente

---

## 4. Criterios de Aceptación

- [x] **Migration SQL**:
  - [x] Tabla sys_reportes_generados creada
  - [x] Foreign keys y indexes configurados
  - [x] Ejecutada en base de datos local

- [x] **Modelo TypeScript**:
  - [x] HistorialReporte interface creada
  - [x] DTOs creados (Create, DTO, Paginated)
  - [x] Documentación JSDoc completa

- [x] **Servicio**:
  - [x] 5 funciones nuevas implementadas
  - [x] Logs apropiados
  - [x] Manejo de errores robusto

- [x] **Controller**:
  - [x] generarReporteNominaController modificado (integración)
  - [x] marcarProcesadosController modificado (integración)
  - [x] getHistorialController implementado
  - [x] descargarReporteHistorialController implementado

- [x] **Routes**:
  - [x] GET /historial configurado
  - [x] GET /historial/:id/descargar configurado
  - [x] Middlewares apropiados (auth + role)

- [x] **Tests**:
  - [x] Mínimo 15 tests de integración
  - [x] Cobertura de todos los casos de uso
  - [x] Tests de autorización
  - [x] Tests de errores (404, validación)

- [x] **Documentación**:
  - [x] Archivo T2.25_historial_reportes.md completo
  - [x] Ejemplos de uso incluidos
  - [x] Diagramas de flujo (si necesario)

---

## 5. Consideraciones Técnicas

### Seguridad
- Solo usuarios autenticados pueden acceder a historial
- Todos los roles pueden ver historial (ADMIN, SUPERVISOR, CONSULTA)
- Regeneración de CSV usa mismas validaciones que generación original

### Performance
- Paginación en listado de historial (default: 10 por página)
- Indexes en fecha_generacion para ordenamiento rápido
- JOIN eficiente con sys_usuarios (solo campos necesarios)

### Integridad de Datos
- Foreign key a sys_usuarios (CASCADE en delete)
- nomina_id puede ser NULL (no todas las nóminas se procesan inmediatamente)
- cantidad_turnos calculada en tiempo de generación (snapshot)

### UX
- CSV regenerado on-demand (no se almacena en disco)
- Nombre de archivo consistente con formato: nomina_YYYYMMDD_YYYYMMDD.csv
- Headers HTTP apropiados para descarga

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Regeneración de CSV difiere del original | Media | Alto | Usar mismas fechas, validar que turnos no hayan cambiado |
| JOIN con sys_usuarios lento | Baja | Medio | Agregar index en user_id, limitar campos SELECT |
| Historial crece sin control | Media | Bajo | Considerar política de retención futura |
| Usuario eliminado causa error | Baja | Alto | FK con CASCADE mantiene integridad |

---

## 7. Próximos Pasos (Post-Implementación)

1. **Política de Retención**: Definir cuánto tiempo mantener historial (ej: 1 año)
2. **Archivado**: Implementar archivado automático de reportes antiguos
3. **Exportación Masiva**: Permitir descargar múltiples reportes en ZIP
4. **Filtros Avanzados**: Agregar filtros por fecha, usuario, nomina_id

---

## 8. Referencias

- **Tarea Original**: `docs/tasks/tareas_fase2_backend_core_20260118.md` (T2.25)
- **Dependencia T2.23**: `docs/completed/T2.23_reporte_csv_nomina.md`
- **Dependencia T2.24**: `docs/completed/T2.24_marcar_procesados.md` (pendiente)
- **Arquitectura**: `CLAUDE.md` - Sección Backend Architecture
- **ADR Autenticación**: `docs/decisions/002_estrategia_autenticacion.md`

---

**Tiempo Total Estimado**: 3h 30min

**Estado**: ⏳ Pendiente de ejecución
