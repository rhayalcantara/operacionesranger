# Plan: T2.23 - Implementar generación de reporte CSV para nómina

**Fecha**: 2026-01-18
**Tarea padre**: T2.23
**Fase**: Fase 2 - Backend Core
**Sprint**: Sprint 4 - Reportes y Documentación
**Estimación**: 4-5 horas

---

## Objetivo

Implementar endpoint POST /api/reportes/nomina que genera un archivo CSV para integración con el sistema de nómina. El endpoint debe llamar al stored procedure `sp_generar_reporte_nomina` y convertir el resultado a formato CSV con encoding UTF-8 BOM para compatibilidad con Excel.

---

## Contexto

### Estado actual del proyecto
- ✅ Stored Procedure `sp_generar_reporte_nomina` ya existe en BD
- ✅ Endpoints de turnos (GET, POST) ya implementados (T2.19, T2.20)
- ✅ Tabla `turnos` con campo `procesado_nomina` para rastrear turnos exportados
- ⏳ NO existe módulo de reportes aún (crear desde cero)

### Integración con sistema de nómina
1. Supervisor selecciona rango de fechas (quincena: 1-15 o 16-fin de mes)
2. Sistema ejecuta `sp_generar_reporte_nomina(fecha_inicio, fecha_fin)`
3. SP retorna turnos NO procesados (`procesado_nomina = FALSE`) en el rango
4. Backend convierte resultado a CSV con formato específico
5. CSV se descarga con nombre: `nomina_YYYYMMDD_YYYYMMDD.csv`
6. Sistema de nómina importa el CSV y asigna `nomina_id`
7. Posteriormente, otro endpoint marcará turnos como procesados (T2.24)

### Formato CSV esperado

```csv
fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo
2026-01-02,1001,P001,10.00,2.00,DIURNO,NO,N/A,120.00
2026-01-03,1001,P001,10.00,0.00,NOCTURNO,NO,N/A,100.00
2026-01-21,1002,P002,8.00,2.00,DIURNO,SI,NACIONAL,0.00
```

**Características**:
- **Encoding**: UTF-8 con BOM (`\uFEFF`) para Excel
- **Decimales**: 2 decimales (XX.XX)
- **Booleanos**: "SI" o "NO" (no true/false)
- **Nulls**: "N/A" para tipo_feriado si no es feriado
- **Separador**: coma (`,`)
- **Line ending**: `\n` (LF)

### Stored Procedure: sp_generar_reporte_nomina

**Definición** (de `sistema_turnos_guardianes.sql` líneas 454-482):

```sql
CREATE PROCEDURE sp_generar_reporte_nomina(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    SELECT
        t.fecha,
        t.empleado_id,
        p.codigo AS puesto_codigo,
        t.horas_normales,
        t.horas_extras,
        t.tipo_turno,
        CASE WHEN t.es_feriado THEN 'SI' ELSE 'NO' END AS es_feriado,
        CASE
            WHEN t.es_feriado THEN f.tipo
            ELSE 'N/A'
        END AS tipo_feriado,
        COALESCE(ROUND(i.valor_hora * (t.horas_normales + t.horas_extras), 2), 0) AS incentivo
    FROM turnos t
    INNER JOIN puestos p ON t.puesto_id = p.id
    LEFT JOIN feriados f ON t.feriado_id = f.id
    LEFT JOIN incentivos_puesto i ON p.id = i.puesto_id
        AND t.fecha BETWEEN i.fecha_inicio AND i.fecha_fin
    WHERE t.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
      AND t.procesado_nomina = FALSE
    ORDER BY t.empleado_id, t.fecha;
END
```

**Retorna**: Array de objetos con las 9 columnas del CSV

---

## Subtareas

### 1. Crear Service de Reportes

**Archivo**: `backend/src/services/reportes.service.ts`

**Métodos a implementar**:

#### 1.1. `generarReporteNomina(fecha_inicio, fecha_fin)`

```typescript
/**
 * Generar reporte CSV para nómina
 *
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @returns String CSV con encoding UTF-8 BOM
 * @throws Error si rango es inválido (> 31 días)
 */
export async function generarReporteNomina(
  fecha_inicio: string,
  fecha_fin: string
): Promise<string>
```

**Lógica**:
1. Validar que `fecha_inicio < fecha_fin`
2. Validar que diferencia de días <= 31 (no sobrecargar)
3. Llamar a SP: `CALL sp_generar_reporte_nomina(?, ?)`
4. Obtener resultado del SP (array de objetos)
5. Convertir a CSV usando `convertToCSV(data)`
6. Retornar string CSV

#### 1.2. `convertToCSV(data: any[])`

```typescript
/**
 * Convertir array de objetos a formato CSV
 *
 * @param data - Array de objetos con campos del reporte
 * @returns String CSV con BOM y headers
 */
function convertToCSV(data: any[]): string
```

**Lógica**:
1. Definir headers: `fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo`
2. Agregar BOM UTF-8: `\uFEFF`
3. Agregar línea de headers
4. Iterar sobre cada fila:
   - Formatear `horas_normales` y `horas_extras` con 2 decimales (.toFixed(2))
   - Formatear `incentivo` con 2 decimales
   - Manejar valores null/undefined: reemplazar por "N/A" o "0.00"
   - Escapar valores si contienen comas (envolverlos en comillas)
5. Unir filas con `\n`
6. Retornar string completo

**Archivos a modificar/crear**:
- `backend/src/services/reportes.service.ts` (CREAR)

**Resultado esperado**:
- Función `generarReporteNomina()` que retorna string CSV
- Función auxiliar `convertToCSV()` para conversión
- Validaciones de rango de fechas

---

### 2. Crear Controller de Reportes

**Archivo**: `backend/src/controllers/reportes.controller.ts`

**Handler a implementar**:

```typescript
/**
 * POST /api/reportes/nomina
 *
 * Generar reporte CSV para nómina
 *
 * Body:
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15"
 * }
 *
 * Response:
 * - Headers: Content-Type: text/csv; charset=utf-8
 * - Headers: Content-Disposition: attachment; filename="nomina_20260101_20260115.csv"
 * - Body: CSV string
 */
export async function generarReporteNominaController(
  req: Request,
  res: Response
): Promise<void>
```

**Lógica**:
1. Validar body con schema Zod (fecha_inicio, fecha_fin)
2. Llamar a `ReportesService.generarReporteNomina()`
3. Construir nombre de archivo: `nomina_${fecha_inicio_YYYYMMDD}_${fecha_fin_YYYYMMDD}.csv`
4. Set headers HTTP:
   ```typescript
   res.setHeader('Content-Type', 'text/csv; charset=utf-8');
   res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
   ```
5. Enviar CSV como response: `res.status(200).send(csv);`
6. Manejo de errores:
   - 400 si rango inválido (fecha_inicio > fecha_fin o > 31 días)
   - 500 si error de BD

**Archivos a modificar/crear**:
- `backend/src/controllers/reportes.controller.ts` (CREAR)

**Resultado esperado**:
- Handler `generarReporteNominaController` funcional
- Set headers correctos para descarga de CSV
- Manejo de errores apropiado

---

### 3. Crear Schema de Validación

**Archivo**: `backend/src/schemas/reporte.schema.ts`

**Schema a implementar**:

```typescript
import { z } from 'zod';

/**
 * Schema para validar body de POST /api/reportes/nomina
 */
export const generarReporteNominaSchema = z.object({
  body: z.object({
    fecha_inicio: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Fecha de inicio debe estar en formato YYYY-MM-DD'
    ),
    fecha_fin: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Fecha de fin debe estar en formato YYYY-MM-DD'
    )
  })
});

export type GenerarReporteNominaInput = z.infer<
  typeof generarReporteNominaSchema
>;
```

**Archivos a modificar/crear**:
- `backend/src/schemas/reporte.schema.ts` (CREAR)

**Resultado esperado**:
- Schema Zod exportado para validación
- Type inference para TypeScript

---

### 4. Crear Routes de Reportes

**Archivo**: `backend/src/routes/reportes.routes.ts`

**Rutas a implementar**:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { generarReporteNominaController } from '../controllers/reportes.controller';
import { generarReporteNominaSchema } from '../schemas/reporte.schema';

const router = Router();

/**
 * POST /api/reportes/nomina
 * Generar reporte CSV para nómina
 * Permisos: ADMIN, SUPERVISOR
 */
router.post(
  '/nomina',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  validationMiddleware(generarReporteNominaSchema),
  generarReporteNominaController
);

export default router;
```

**Archivos a modificar/crear**:
- `backend/src/routes/reportes.routes.ts` (CREAR)

**Resultado esperado**:
- Ruta POST /nomina registrada
- Middleware de autenticación aplicado
- Middleware de roles (ADMIN, SUPERVISOR) aplicado
- Middleware de validación aplicado

---

### 5. Registrar Routes en Server

**Archivo**: `backend/src/server.ts`

**Cambio a realizar**:

Agregar import y registro de rutas de reportes:

```typescript
import reportesRoutes from './routes/reportes.routes';

// ... (otras rutas)

app.use('/api/reportes', reportesRoutes);
```

**Archivos a modificar/crear**:
- `backend/src/server.ts` (MODIFICAR - agregar 2 líneas)

**Resultado esperado**:
- Ruta `/api/reportes/nomina` accesible desde la API

---

### 6. Crear Tests de Integración

**Archivo**: `backend/tests/integration/reportes.integration.test.ts`

**Tests a implementar** (mínimo 12):

#### Grupo 1: Generación exitosa (3 tests)
1. Test: Generar reporte con datos (2+ turnos) - 200 OK
2. Test: Generar reporte vacío (sin turnos en rango) - 200 OK con CSV solo headers
3. Test: Verificar formato CSV correcto (headers, columnas, decimales)

#### Grupo 2: Validación de fechas (3 tests)
4. Test: Fecha inicio > fecha fin - 400 Bad Request
5. Test: Rango > 31 días - 400 Bad Request
6. Test: Formato de fecha inválido - 400 Bad Request

#### Grupo 3: Encoding y formato (2 tests)
7. Test: Verificar UTF-8 con BOM (`\uFEFF` al inicio)
8. Test: Verificar decimales con 2 posiciones (horas, incentivo)

#### Grupo 4: Permisos (4 tests)
9. Test: ADMIN puede generar reporte - 200 OK
10. Test: SUPERVISOR puede generar reporte - 200 OK
11. Test: CONSULTA no puede generar reporte - 403 Forbidden
12. Test: Sin autenticación - 401 Unauthorized

#### Grupo 5: Headers HTTP (2 tests - opcional, total 14)
13. Test: Content-Type es `text/csv; charset=utf-8`
14. Test: Content-Disposition tiene filename correcto

**Estructura del test**:

```typescript
import request from 'supertest';
import app from '../../src/server';

describe('POST /api/reportes/nomina', () => {
  let adminToken: string;
  let supervisorToken: string;
  let consultaToken: string;

  beforeAll(async () => {
    // Login con usuarios de prueba
    adminToken = await loginAs('admin', 'Admin123!');
    supervisorToken = await loginAs('supervisor', 'Super123!');
    consultaToken = await loginAs('consulta', 'Consulta123!');
  });

  describe('Generación exitosa', () => {
    it('Debe generar reporte con datos', async () => {
      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('fecha,empleado_id,puesto_codigo');
      expect(response.text.startsWith('\uFEFF')).toBe(true); // BOM
    });

    // ... más tests
  });

  // ... más grupos
});
```

**Archivos a modificar/crear**:
- `backend/tests/integration/reportes.integration.test.ts` (CREAR)

**Resultado esperado**:
- Mínimo 12 tests implementados
- Cobertura de casos exitosos y de error
- Validación de formato CSV
- Validación de permisos

---

### 7. Documentar Resultado

**Archivo**: `docs/completed/T2.23_reporte_csv_nomina.md`

**Contenido a documentar**:
1. Resumen de lo implementado
2. Archivos creados (5 nuevos)
3. Formato CSV generado (con ejemplo)
4. Ejemplo de uso del endpoint
5. Tests implementados (12+)
6. Observaciones sobre encoding UTF-8 BOM
7. Próximos pasos (T2.24: marcar turnos como procesados)

---

## Criterios de Aceptación (checklist)

- [ ] Service `reportes.service.ts` creado con método `generarReporteNomina`
- [ ] Controller `reportes.controller.ts` creado
- [ ] Routes `reportes.routes.ts` creado y registrado en server.ts
- [ ] Llama correctamente a SP `sp_generar_reporte_nomina`
- [ ] CSV generado con formato correcto (9 columnas)
- [ ] Headers HTTP apropiados (Content-Type, Content-Disposition)
- [ ] Encoding UTF-8 con BOM (\uFEFF)
- [ ] Validaciones de rango de fechas (<=31 días)
- [ ] Solo ADMIN y SUPERVISOR pueden acceder
- [ ] Tests de integración >= 12 tests
- [ ] Documentación completa
- [ ] Decimales formateados correctamente (2 decimales)

---

## Archivos a Generar

1. `backend/src/services/reportes.service.ts` (~150 líneas)
2. `backend/src/controllers/reportes.controller.ts` (~80 líneas)
3. `backend/src/schemas/reporte.schema.ts` (~30 líneas)
4. `backend/src/routes/reportes.routes.ts` (~40 líneas)
5. `backend/tests/integration/reportes.integration.test.ts` (~300 líneas)
6. `docs/completed/T2.23_reporte_csv_nomina.md` (documentación)

**Total estimado**: ~600 líneas de código + tests

---

## Riesgos y Consideraciones

### Riesgo 1: Encoding UTF-8 BOM
**Mitigación**: Agregar explícitamente `\uFEFF` al inicio del string CSV. Verificar con test que BOM existe.

### Riesgo 2: Formato de decimales
**Mitigación**: Usar `.toFixed(2)` para garantizar 2 decimales. Validar con tests.

### Riesgo 3: Valores null/undefined
**Mitigación**: Usar COALESCE en SP y validar en función `convertToCSV()`. Reemplazar null con "N/A" o "0.00" según corresponda.

### Riesgo 4: Rango de fechas muy amplio
**Mitigación**: Validar que rango <= 31 días. Retornar 400 Bad Request si excede.

### Riesgo 5: Compatibilidad con Excel
**Mitigación**: UTF-8 BOM es CRÍTICO para que Excel abra correctamente. Agregar test específico.

---

## Notas Adicionales

### Integración con T2.24
- Esta tarea (T2.23) genera el CSV
- T2.24 marcará los turnos como procesados después de importar en nómina
- Ambos endpoints usan el campo `procesado_nomina` de la tabla `turnos`

### Formato de nombre de archivo
- Patrón: `nomina_YYYYMMDD_YYYYMMDD.csv`
- Ejemplo: `nomina_20260101_20260115.csv`
- Remover guiones de las fechas para el nombre

### Ejemplo de uso esperado

```bash
# Request
curl -X POST http://localhost:3333/api/reportes/nomina \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_inicio": "2026-01-01",
    "fecha_fin": "2026-01-15"
  }' \
  --output nomina_20260101_20260115.csv

# Response Headers
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="nomina_20260101_20260115.csv"

# Response Body (CSV)
﻿fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo
2026-01-02,1001,P001,10.00,2.00,DIURNO,NO,N/A,120.00
2026-01-03,1001,P001,10.00,0.00,NOCTURNO,NO,N/A,100.00
```

---

**Última actualización**: 2026-01-18
**Estado**: Listo para ejecutar
