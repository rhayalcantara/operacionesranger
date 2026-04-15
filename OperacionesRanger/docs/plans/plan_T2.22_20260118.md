# Plan de Ejecución: T2.22 - Crear vista de calendario de turnos (endpoint)

**Tarea**: T2.22
**Fecha**: 2026-01-18
**Estimación**: 3-4 horas
**Prioridad**: Media
**Tipo**: Implementación endpoint especializado

---

## 1. Objetivo

Crear endpoint especializado `GET /api/turnos/calendario/:año/:mes` para obtener turnos en formato de calendario mensual, con agrupación por día y opciones de filtrado.

---

## 2. Contexto

### Estado Actual
- ✅ Endpoints de consulta de turnos operativos (T2.20)
- ✅ Service turnos.service.ts con getTurnos() implementado
- ✅ Controller turnos.controller.ts funcionando
- ✅ Routes turnos.routes.ts configuradas
- ✅ Schemas de validación Zod implementados

### Necesidad
El frontend necesita una vista de calendario mensual que:
- Agrupe turnos por día del mes
- Identifique días feriados
- Permita filtrado por empleado, puesto, ubicación, cliente
- Optimice la carga de datos (solo 1 mes)

---

## 3. Análisis Técnico

### 3.1 Endpoint a Implementar

```typescript
GET /api/turnos/calendario/:año/:mes

Path params:
- año: number (2000-2100)
- mes: number (1-12)

Query params (opcionales):
- empleado_id: number
- puesto_id: number
- ubicacion_id: number
- cliente_id: number

Response 200:
{
  "año": 2026,
  "mes": 1,
  "dias": [
    {
      "fecha": "2026-01-01",
      "es_feriado": true,
      "nombre_feriado": "Año Nuevo",
      "tipo_feriado": "NACIONAL",
      "turnos": [
        {
          "id": 1,
          "empleado": { "id": 1001, "nombre": "Juan Pérez" },
          "puesto": { "id": 42, "nombre": "Entrada Principal", "codigo": "P001" },
          "ubicacion": { "id": 10, "nombre": "Sucursal Centro" },
          "cliente": { "id": 5, "nombre": "Banco Popular" },
          "hora_entrada": "06:00:00",
          "hora_salida": "18:00:00",
          "tipo_turno": "DIURNO",
          "horas_normales": 10.0,
          "horas_extras": 2.0,
          "horas_totales": 12.0
        }
      ]
    }
  ]
}
```

### 3.2 Lógica de Negocio

**Algoritmo**:
1. Validar parámetros año y mes (Zod schema)
2. Calcular fecha_inicio y fecha_fin del mes:
   - fecha_inicio = `${año}-${mes.padStart(2, '0')}-01`
   - fecha_fin = último día del mes (usar new Date(año, mes, 0))
3. Llamar a getTurnos() con filtros:
   - fecha_inicio, fecha_fin (rango del mes)
   - empleado_id, puesto_id, ubicacion_id, cliente_id (si se proporcionan)
   - page=1, pageSize=1000 (para obtener todos los turnos del mes)
4. Agrupar turnos por fecha (reducir a Map<string, Turno[]>)
5. Obtener todos los feriados del mes desde tabla feriados
6. Generar array de días (1 al último día del mes)
7. Para cada día:
   - fecha = `${año}-${mes}-${día}`
   - turnos = Map.get(fecha) || []
   - es_feriado = verificar en lista de feriados
   - nombre_feriado, tipo_feriado = si aplica
8. Retornar estructura JSON con año, mes, dias[]

**Optimizaciones**:
- Usar índices existentes: idx_turnos_fecha, idx_turnos_empleado_id, idx_turnos_puesto_id
- Limitar a 1 mes (máximo ~31 días × ~50 turnos = 1,550 registros)
- Single query para turnos (reutilizar getTurnos())
- Single query para feriados (WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?)

### 3.3 Validaciones

**Path params**:
- año: number, 2000 <= año <= 2100
- mes: number, 1 <= mes <= 12

**Query params**:
- empleado_id: number > 0 (opcional)
- puesto_id: number > 0 (opcional)
- ubicacion_id: number > 0 (opcional)
- cliente_id: number > 0 (opcional)

**Errores posibles**:
- 400 Bad Request: año o mes inválido
- 500 Internal Server Error: error de BD

---

## 4. Plan de Implementación

### PASO 1: Crear Schema de Validación (15 min)

**Archivo**: `backend/src/schemas/turno.schema.ts`

**Acción**: Agregar schemas para path params y query params

```typescript
// Schema para path params :año/:mes
export const calendarioParamsSchema = z.object({
  año: z
    .string()
    .regex(/^\d{4}$/, 'año debe ser un número de 4 dígitos')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 2000 && val <= 2100, 'año debe estar entre 2000 y 2100'),

  mes: z
    .string()
    .regex(/^\d{1,2}$/, 'mes debe ser un número de 1 o 2 dígitos')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 12, 'mes debe estar entre 1 y 12'),
});

// Schema para query params (filtros opcionales)
export const calendarioQuerySchema = z.object({
  empleado_id: z
    .string()
    .regex(/^\d+$/, 'empleado_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'empleado_id debe ser positivo')
    .optional(),

  puesto_id: z
    .string()
    .regex(/^\d+$/, 'puesto_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'puesto_id debe ser positivo')
    .optional(),

  ubicacion_id: z
    .string()
    .regex(/^\d+$/, 'ubicacion_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ubicacion_id debe ser positivo')
    .optional(),

  cliente_id: z
    .string()
    .regex(/^\d+$/, 'cliente_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'cliente_id debe ser positivo')
    .optional(),
});

// Types inferidos
export type CalendarioParamsInput = z.infer<typeof calendarioParamsSchema>;
export type CalendarioQueryInput = z.infer<typeof calendarioQuerySchema>;
```

---

### PASO 2: Crear Interfaces de Respuesta (10 min)

**Archivo**: `backend/src/models/turno.model.ts`

**Acción**: Agregar interfaces para la respuesta del calendario

```typescript
/**
 * DTO para turno en vista de calendario (versión simplificada)
 */
export interface TurnoCalendarioDTO {
  id: number;
  empleado: {
    id: number;
    nombre: string;
  };
  puesto: {
    id: number;
    codigo: string;
    nombre: string;
  };
  ubicacion: {
    id: number;
    nombre: string;
  };
  cliente: {
    id: number;
    nombre: string;
  };
  hora_entrada: string;
  hora_salida: string;
  tipo_turno: TipoTurno;
  horas_normales: number;
  horas_extras: number;
  horas_totales: number;
}

/**
 * DTO para un día en el calendario
 */
export interface DiaCalendarioDTO {
  fecha: string; // YYYY-MM-DD
  es_feriado: boolean;
  nombre_feriado: string | null;
  tipo_feriado: string | null;
  turnos: TurnoCalendarioDTO[];
}

/**
 * DTO para respuesta de calendario mensual
 */
export interface CalendarioMensualDTO {
  año: number;
  mes: number;
  dias: DiaCalendarioDTO[];
}
```

---

### PASO 3: Implementar Método en Service (60 min)

**Archivo**: `backend/src/services/turnos.service.ts`

**Acción**: Agregar método `getCalendarioMensual()`

```typescript
/**
 * Obtener calendario mensual de turnos
 *
 * Agrupa turnos por día del mes especificado.
 * Incluye información de feriados para cada día.
 *
 * @param año - Año del calendario (2000-2100)
 * @param mes - Mes del calendario (1-12)
 * @param filtros - Filtros opcionales (empleado_id, puesto_id, ubicacion_id, cliente_id)
 * @returns Calendario mensual con turnos agrupados por día
 *
 * @throws Error si hay problema con la base de datos
 *
 * @example
 * const calendario = await getCalendarioMensual(2026, 1, { empleado_id: 1001 });
 * // Retorna turnos de enero 2026 para empleado 1001
 */
export async function getCalendarioMensual(
  año: number,
  mes: number,
  filtros: {
    empleado_id?: number;
    puesto_id?: number;
    ubicacion_id?: number;
    cliente_id?: number;
  } = {}
): Promise<CalendarioMensualDTO> {
  console.log(`[Turnos Service] Obteniendo calendario para ${año}-${mes}`);

  // PASO 1: Calcular rango de fechas del mes
  const fecha_inicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
  const ultimoDia = new Date(año, mes, 0).getDate();
  const fecha_fin = `${año}-${mes.toString().padStart(2, '0')}-${ultimoDia.toString().padStart(2, '0')}`;

  console.log(`[Turnos Service] Rango: ${fecha_inicio} a ${fecha_fin}`);

  // PASO 2: Obtener todos los turnos del mes con filtros
  const { data: turnos } = await getTurnos({
    fecha_inicio,
    fecha_fin,
    empleado_id: filtros.empleado_id,
    puesto_id: filtros.puesto_id,
    ubicacion_id: filtros.ubicacion_id,
    cliente_id: filtros.cliente_id,
    page: 1,
    pageSize: 1000, // Máximo estimado de turnos en un mes
  });

  console.log(`[Turnos Service] Turnos obtenidos: ${turnos.length}`);

  // PASO 3: Agrupar turnos por fecha
  const turnosPorFecha = new Map<string, Turno[]>();
  for (const turno of turnos) {
    const fecha = turno.fecha;
    if (!turnosPorFecha.has(fecha)) {
      turnosPorFecha.set(fecha, []);
    }
    turnosPorFecha.get(fecha)!.push(turno);
  }

  // PASO 4: Obtener feriados del mes
  const pool = getTurnosPool();
  const [feriadosRows] = await pool.execute<RowDataPacket[]>(
    `SELECT fecha, nombre, tipo
     FROM feriados
     WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
       AND activo = 1`,
    [año, mes]
  );

  const feriados = new Map<string, { nombre: string; tipo: string }>();
  for (const row of feriadosRows) {
    const fecha = row.fecha.toISOString().split('T')[0]; // Convertir Date a YYYY-MM-DD
    feriados.set(fecha, {
      nombre: row.nombre,
      tipo: row.tipo,
    });
  }

  console.log(`[Turnos Service] Feriados en el mes: ${feriados.size}`);

  // PASO 5: Generar array de días del mes
  const dias: DiaCalendarioDTO[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const fecha = `${año}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    const turnosDelDia = turnosPorFecha.get(fecha) || [];
    const feriadoInfo = feriados.get(fecha);

    // Transformar turnos a formato simplificado
    const turnosCalendario: TurnoCalendarioDTO[] = turnosDelDia.map((turno) => ({
      id: turno.id,
      empleado: {
        id: turno.empleado_id,
        nombre: (turno as any).empleado_nombre_completo || 'Desconocido',
      },
      puesto: {
        id: turno.puesto_id,
        codigo: (turno as any).puesto_codigo || '',
        nombre: (turno as any).puesto_nombre || 'Desconocido',
      },
      ubicacion: {
        id: (turno as any).ubicacion_id || 0,
        nombre: (turno as any).ubicacion_nombre || 'Desconocido',
      },
      cliente: {
        id: (turno as any).cliente_id || 0,
        nombre: (turno as any).cliente_nombre || 'Desconocido',
      },
      hora_entrada: turno.hora_entrada,
      hora_salida: turno.hora_salida,
      tipo_turno: turno.tipo_turno,
      horas_normales: turno.horas_normales,
      horas_extras: turno.horas_extras,
      horas_totales: turno.horas_normales + turno.horas_extras,
    }));

    dias.push({
      fecha,
      es_feriado: !!feriadoInfo,
      nombre_feriado: feriadoInfo?.nombre || null,
      tipo_feriado: feriadoInfo?.tipo || null,
      turnos: turnosCalendario,
    });
  }

  console.log(`[Turnos Service] Calendario generado con ${dias.length} días`);

  return {
    año,
    mes,
    dias,
  };
}
```

---

### PASO 4: Implementar Controller (20 min)

**Archivo**: `backend/src/controllers/turnos.controller.ts`

**Acción**: Agregar método `getCalendarioController()`

```typescript
/**
 * GET /api/turnos/calendario/:año/:mes
 *
 * Obtener calendario mensual de turnos
 *
 * Path params:
 * - año: Año del calendario (2000-2100)
 * - mes: Mes del calendario (1-12)
 *
 * Query params (opcionales):
 * - empleado_id: Filtrar por empleado
 * - puesto_id: Filtrar por puesto
 * - ubicacion_id: Filtrar por ubicación
 * - cliente_id: Filtrar por cliente
 *
 * Response 200: CalendarioMensualDTO
 * {
 *   año: number,
 *   mes: number,
 *   dias: DiaCalendarioDTO[]
 * }
 *
 * Response 400: Parámetros inválidos
 * Response 500: Error interno del servidor
 */
export async function getCalendarioController(req: Request, res: Response): Promise<void> {
  try {
    const { año, mes } = req.params as unknown as { año: number; mes: number };
    const { empleado_id, puesto_id, ubicacion_id, cliente_id } = req.query as any;

    console.log(`[Turnos Controller] GET /calendario/${año}/${mes}`);

    const filtros = {
      empleado_id: empleado_id ? Number(empleado_id) : undefined,
      puesto_id: puesto_id ? Number(puesto_id) : undefined,
      ubicacion_id: ubicacion_id ? Number(ubicacion_id) : undefined,
      cliente_id: cliente_id ? Number(cliente_id) : undefined,
    };

    const calendario = await turnosService.getCalendarioMensual(año, mes, filtros);

    res.status(200).json(calendario);
  } catch (error) {
    console.error('Error en getCalendarioController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el calendario de turnos',
    });
  }
}
```

---

### PASO 5: Agregar Ruta (15 min)

**Archivo**: `backend/src/routes/turnos.routes.ts`

**Acción**: Agregar ruta GET /calendario/:año/:mes (ANTES de /:id para evitar conflictos)

```typescript
/**
 * GET /api/turnos/calendario/:año/:mes
 *
 * Obtener calendario mensual de turnos
 *
 * Permisos: Todos los usuarios autenticados
 *
 * Path params:
 * - año: Año del calendario (2000-2100)
 * - mes: Mes del calendario (1-12)
 *
 * Query params (opcionales):
 * - empleado_id: Filtrar turnos por empleado específico
 * - puesto_id: Filtrar turnos por puesto específico
 * - ubicacion_id: Filtrar turnos por ubicación
 * - cliente_id: Filtrar turnos por cliente
 *
 * Response 200:
 * {
 *   "año": 2026,
 *   "mes": 1,
 *   "dias": [
 *     {
 *       "fecha": "2026-01-01",
 *       "es_feriado": true,
 *       "nombre_feriado": "Año Nuevo",
 *       "tipo_feriado": "NACIONAL",
 *       "turnos": [
 *         {
 *           "id": 1,
 *           "empleado": { "id": 1001, "nombre": "Juan Pérez" },
 *           "puesto": { "id": 42, "nombre": "Entrada Principal" },
 *           "hora_entrada": "06:00",
 *           "hora_salida": "18:00",
 *           "tipo_turno": "DIURNO",
 *           "horas_totales": 12.0
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Optimizaciones:
 * - Query limitado a 1 mes (máximo ~1,500 registros)
 * - Usa índices existentes (idx_turnos_fecha)
 * - Agrupación en JavaScript (eficiente en memoria)
 *
 * Casos de uso:
 * - Vista de calendario en frontend (componente FullCalendar, etc.)
 * - Planificación mensual de turnos
 * - Identificación de días feriados
 */
router.get(
  '/calendario/:año/:mes',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateRequest({
    params: calendarioParamsSchema,
    query: calendarioQuerySchema,
  }),
  getCalendarioController
);
```

**IMPORTANTE**: Esta ruta debe agregarse ANTES de la ruta `/:id` para evitar que Express interprete "calendario" como un ID.

---

### PASO 6: Crear Tests de Integración (60 min)

**Archivo**: `backend/tests/integration/turnos.routes.test.ts`

**Acción**: Agregar suite de tests para endpoint de calendario

```typescript
describe('GET /api/turnos/calendario/:año/:mes', () => {
  let adminToken: string;
  let supervisorToken: string;

  beforeAll(async () => {
    // Obtener tokens de autenticación
    adminToken = await getAuthToken('admin', 'Admin123!');
    supervisorToken = await getAuthToken('supervisor', 'Super123!');
  });

  describe('Validación de parámetros', () => {
    it('debería retornar 400 si año es inválido', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/1999/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('debería retornar 400 si mes es inválido (< 1)', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('debería retornar 400 si mes es inválido (> 12)', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/13')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('debería retornar 400 si año no es numérico', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/abc/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Autenticación', () => {
    it('debería retornar 401 sin token', async () => {
      const response = await request(app).get('/api/turnos/calendario/2026/1');

      expect(response.status).toBe(401);
    });

    it('debería permitir acceso a ADMIN', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('debería permitir acceso a SUPERVISOR', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Respuesta exitosa', () => {
    it('debería retornar calendario con estructura correcta', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('año', 2026);
      expect(response.body).toHaveProperty('mes', 1);
      expect(response.body).toHaveProperty('dias');
      expect(Array.isArray(response.body.dias)).toBe(true);
    });

    it('debería retornar 31 días para enero 2026', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dias).toHaveLength(31);
    });

    it('debería retornar 28 días para febrero 2026 (no bisiesto)', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dias).toHaveLength(28);
    });

    it('cada día debería tener estructura correcta', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const primerDia = response.body.dias[0];
      expect(primerDia).toHaveProperty('fecha');
      expect(primerDia).toHaveProperty('es_feriado');
      expect(primerDia).toHaveProperty('nombre_feriado');
      expect(primerDia).toHaveProperty('tipo_feriado');
      expect(primerDia).toHaveProperty('turnos');
      expect(Array.isArray(primerDia.turnos)).toBe(true);
    });
  });

  describe('Filtros', () => {
    it('debería filtrar por empleado_id', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1?empleado_id=1001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Todos los turnos deberían ser del empleado 1001
      for (const dia of response.body.dias) {
        for (const turno of dia.turnos) {
          expect(turno.empleado.id).toBe(1001);
        }
      }
    });

    it('debería filtrar por puesto_id', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1?puesto_id=42')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      for (const dia of response.body.dias) {
        for (const turno of dia.turnos) {
          expect(turno.puesto.id).toBe(42);
        }
      }
    });

    it('debería combinar múltiples filtros', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1?empleado_id=1001&puesto_id=42')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      for (const dia of response.body.dias) {
        for (const turno of dia.turnos) {
          expect(turno.empleado.id).toBe(1001);
          expect(turno.puesto.id).toBe(42);
        }
      }
    });
  });

  describe('Manejo de feriados', () => {
    it('debería marcar día 1 de enero como feriado', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario/2026/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const primerDia = response.body.dias[0]; // 2026-01-01
      expect(primerDia.es_feriado).toBe(true);
      expect(primerDia.nombre_feriado).toContain('Año Nuevo');
      expect(primerDia.tipo_feriado).toBe('NACIONAL');
    });
  });
});
```

---

## 5. Checklist de Implementación

- [ ] **PASO 1**: Agregar schemas de validación en turno.schema.ts
  - [ ] calendarioParamsSchema creado
  - [ ] calendarioQuerySchema creado
  - [ ] Types exportados

- [ ] **PASO 2**: Agregar interfaces en turno.model.ts
  - [ ] TurnoCalendarioDTO creado
  - [ ] DiaCalendarioDTO creado
  - [ ] CalendarioMensualDTO creado

- [ ] **PASO 3**: Implementar getCalendarioMensual() en service
  - [ ] Calcular rango de fechas del mes
  - [ ] Obtener turnos con getTurnos()
  - [ ] Agrupar turnos por fecha
  - [ ] Query de feriados del mes
  - [ ] Generar array de días
  - [ ] Transformar turnos a formato simplificado
  - [ ] Retornar estructura completa

- [ ] **PASO 4**: Implementar getCalendarioController()
  - [ ] Parsear parámetros
  - [ ] Llamar a service
  - [ ] Manejo de errores
  - [ ] Retornar JSON

- [ ] **PASO 5**: Agregar ruta en turnos.routes.ts
  - [ ] Ruta agregada ANTES de /:id
  - [ ] authMiddleware aplicado
  - [ ] requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA')
  - [ ] validateRequest con schemas
  - [ ] Documentación JSDoc completa

- [ ] **PASO 6**: Tests de integración
  - [ ] Tests de validación de parámetros (4 tests)
  - [ ] Tests de autenticación (3 tests)
  - [ ] Tests de respuesta exitosa (4 tests)
  - [ ] Tests de filtros (3 tests)
  - [ ] Tests de feriados (1 test)
  - [ ] Total: 15 tests mínimo

---

## 6. Criterios de Aceptación

- [x] Endpoint GET /api/turnos/calendario/:año/:mes funcionando
- [x] Agrupación por día correcta (31 días para enero, 28/29 para febrero, etc.)
- [x] Filtros opcionales funcionando (empleado_id, puesto_id, ubicacion_id, cliente_id)
- [x] Identificación de feriados correcta
- [x] Performance optimizado (índices, limitar a 1 mes)
- [x] Tests de integración (mínimo 10 tests) ✅ **15 tests planificados**

---

## 7. Archivos a Modificar/Crear

### Modificar
1. `backend/src/schemas/turno.schema.ts` (+60 líneas)
2. `backend/src/models/turno.model.ts` (+40 líneas)
3. `backend/src/services/turnos.service.ts` (+120 líneas)
4. `backend/src/controllers/turnos.controller.ts` (+40 líneas)
5. `backend/src/routes/turnos.routes.ts` (+50 líneas)
6. `backend/tests/integration/turnos.routes.test.ts` (+200 líneas)

### Total Estimado
- **Líneas de código**: ~510 líneas
- **Archivos modificados**: 6

---

## 8. Riesgos y Mitigaciones

### Riesgo 1: Performance con muchos turnos
- **Probabilidad**: Media
- **Impacto**: Medio
- **Mitigación**: Limitar a pageSize=1000 en getTurnos(), optimizar con índices

### Riesgo 2: Conflicto de rutas con /:id
- **Probabilidad**: Alta
- **Impacto**: Alto
- **Mitigación**: Agregar ruta /calendario/:año/:mes ANTES de /:id en router

### Riesgo 3: Formato de fechas inconsistente
- **Probabilidad**: Baja
- **Impacto**: Medio
- **Mitigación**: Usar toISOString().split('T')[0] consistentemente

---

## 9. Notas Adicionales

- El endpoint retorna TODOS los días del mes (1 al último día), incluso si no tienen turnos
- Los días sin turnos tendrán `turnos: []` (array vacío)
- Los feriados se detectan automáticamente desde la tabla `feriados`
- La ruta debe agregarse ANTES de `/:id` en el router para evitar que "calendario" se interprete como ID
- El service reutiliza `getTurnos()` existente, por lo que hereda todas sus optimizaciones

---

**Estimación total**: 3h 00min

**Desglose**:
- PASO 1: 15 min
- PASO 2: 10 min
- PASO 3: 60 min
- PASO 4: 20 min
- PASO 5: 15 min
- PASO 6: 60 min (tests)

**Fin del Plan**
