# Plan de Ejecución: T2.28 - Suite de Tests de Integración Completa

**Tarea**: T2.28 - Crear suite de tests de integración completa
**Fecha de creación**: 2026-01-19
**Dependencias**: Todas las tareas anteriores de Fase 2
**Estimación**: 6-8 horas
**Prioridad**: Alta

---

## 1. Análisis de Situación Actual

### Tests Existentes (Inventario)

**Tests de Integración** (directorio: `backend/tests/integration/`):
- ✅ `auth.test.ts` - 12 tests de autenticación
- ✅ `usuarios.test.ts` - 25+ tests de CRUD usuarios
- ✅ `clientes.test.ts` - 22 tests de CRUD clientes
- ✅ `ubicaciones.test.ts` - 30+ tests de CRUD ubicaciones
- ✅ `puestos.test.ts` - 24 tests de CRUD puestos
- ✅ `feriados.test.ts` - 14 tests de CRUD feriados
- ✅ `config-turnos.test.ts` - 20 tests de configuración de turnos
- ✅ `rrhh.test.ts` - 22 tests de integración RRHH
- ✅ `turnos.integration.test.ts` - Tests de turnos (cantidad a verificar)
- ✅ `reportes.integration.test.ts` - 14 tests de reporte nómina
- ✅ `reportes-historial.integration.test.ts` - 12 tests de historial
- ✅ `reportes-resumen.integration.test.ts` - 18 tests de resúmenes

**Tests Unitarios** (otros directorios):
- ✅ `services/password.service.test.ts` - 22 tests
- ✅ `services/jwt.service.test.ts` - 29 tests
- ✅ `services/cache.service.test.ts` - 18 tests
- ✅ `middlewares/auth.middleware.test.ts` - 20 tests
- ✅ `middlewares/role.middleware.test.ts` - 19 tests
- ✅ `middlewares/audit.middleware.test.ts` - 31 tests
- ✅ `middlewares/error-handler.middleware.test.ts` - Tests existentes
- ✅ `middlewares/pagination.middleware.test.ts` - Tests existentes
- ✅ `middlewares/validation.middleware.test.ts` - Tests existentes
- ✅ `unit/turno.validation.test.ts` - 24 tests
- ✅ `utils/response.utils.test.ts` - Tests existentes
- ✅ `incentivos.test.ts` - 20 tests (ubicado en raíz de tests, mover a integration/)

**Total estimado**: ~350+ tests ya implementados

### Gaps Identificados

1. **Falta de helpers compartidos**: Cada test tiene su propio setup/teardown
2. **Falta de archivo de incentivos en integration/**: `incentivos.test.ts` está en la raíz
3. **Falta de script consolidado**: No hay un comando para ejecutar solo tests de integración
4. **Falta de configuración de BD de prueba**: `.env.test` no existe
5. **Falta de documentación**: No hay guía de cómo ejecutar los tests
6. **Posibles tests faltantes**: Necesito verificar cobertura de:
   - Cache RRHH endpoints (T2.17)
   - Marcar turnos procesados (T2.24)

---

## 2. Objetivos de la Tarea

### Objetivos Principales
1. ✅ Consolidar y organizar todos los tests de integración existentes
2. ✅ Crear helpers/utilities compartidos para evitar duplicación de código
3. ✅ Crear setup/teardown centralizado para BD de prueba
4. ✅ Agregar tests faltantes para completar cobertura >70%
5. ✅ Configurar scripts npm para ejecutar tests de integración
6. ✅ Documentar cómo ejecutar y mantener los tests
7. ✅ Verificar que todos los tests existentes pasen (o documentar issues)

### Objetivos Secundarios
- Crear archivo `.env.test.example` con configuración de BD de prueba
- Agregar badge de cobertura al README
- Configurar CI/CD ready (GitHub Actions config)

---

## 3. Plan de Implementación

### Fase 1: Análisis y Consolidación (1h)
**Acción**: Revisar todos los archivos de tests existentes

1. ✅ Contar tests por archivo (usando grep/wc)
2. ✅ Identificar patrones comunes de setup/teardown
3. ✅ Identificar helpers duplicados (createTestUser, getAuthToken, etc.)
4. ✅ Listar tests faltantes por módulo
5. ✅ Documentar issues de compilación existentes

**Entregables**:
- Inventario completo de tests (markdown en el plan)
- Lista de helpers a crear
- Lista de tests faltantes

---

### Fase 2: Crear Infraestructura de Testing (2h)
**Acción**: Crear helpers, setup files y utilities compartidas

#### 2.1 Crear `backend/tests/helpers/auth.helpers.ts`
**Funciones**:
```typescript
// Crear usuario de prueba
export async function createTestUser(userData: Partial<User>): Promise<number>

// Obtener token de autenticación
export async function getAuthToken(username: string, password: string): Promise<string>

// Limpiar usuarios de prueba
export async function cleanupTestUsers(usernames: string[]): Promise<void>

// Login como admin/supervisor/consulta
export async function loginAsAdmin(): Promise<string>
export async function loginAsSupervisor(): Promise<string>
export async function loginAsConsulta(): Promise<string>
```

#### 2.2 Crear `backend/tests/helpers/database.helpers.ts`
**Funciones**:
```typescript
// Limpiar tabla específica
export async function cleanTable(tableName: string): Promise<void>

// Limpiar todas las tablas de prueba
export async function cleanAllTestData(): Promise<void>

// Insertar datos de prueba
export async function seedTestData(entity: string, data: any[]): Promise<number[]>

// Contar registros
export async function countRecords(tableName: string, where?: string): Promise<number>
```

#### 2.3 Crear `backend/tests/helpers/request.helpers.ts`
**Funciones**:
```typescript
// Request autenticado
export function authenticatedRequest(token: string) => SuperTest

// Parsear respuesta CSV
export function parseCSVResponse(response: string): any[]

// Esperar condición (polling)
export async function waitFor(condition: () => boolean, timeout: number): Promise<void>
```

#### 2.4 Crear `backend/tests/setup/global-setup.ts`
**Funciones**:
- Verificar que BD de prueba existe
- Crear tablas si no existen
- Cargar datos iniciales (feriados, config turnos)

#### 2.5 Crear `backend/tests/setup/global-teardown.ts`
**Funciones**:
- Limpiar todas las tablas de prueba
- Cerrar conexiones de BD

#### 2.6 Crear `.env.test.example`
```env
NODE_ENV=test
PORT=3001

# Base de datos de prueba - Turnos
DB_TURNOS_HOST=localhost
DB_TURNOS_PORT=3306
DB_TURNOS_USER=root
DB_TURNOS_PASSWORD=your_password
DB_TURNOS_NAME=turnos_guardianes_test

# Base de datos de prueba - RRHH
DB_RRHH_HOST=localhost
DB_RRHH_PORT=3306
DB_RRHH_USER=root
DB_RRHH_PASSWORD=your_password
DB_RRHH_NAME=db_aae4a2_ranger_test

# JWT
JWT_SECRET=test_secret_key_min_32_characters_long_for_testing_purposes
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cache
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300

# Logs
LOG_LEVEL=error
LOG_FILE_PATH=logs/test.log

# Auditoría
AUDIT_ENABLED=false
```

**Entregables**:
- 3 archivos de helpers (~300 líneas cada uno)
- 2 archivos de setup/teardown (~150 líneas cada uno)
- `.env.test.example` (50 líneas)
- **Total estimado**: ~1,200 líneas de código nuevo

---

### Fase 3: Agregar Tests Faltantes (2h)
**Acción**: Identificar y crear tests que faltan para completar cobertura

#### 3.1 Verificar Tests Existentes
**Revisar archivos**:
1. ✅ `turnos.integration.test.ts` - Verificar si tiene todos los tests de T2.19, T2.20, T2.21, T2.22
2. ✅ `reportes.integration.test.ts` - Verificar si incluye marcar procesados (T2.24)
3. ⚠️ `incentivos.test.ts` - Mover de raíz a `integration/` y renombrar a `incentivos.integration.test.ts`

#### 3.2 Crear Tests Faltantes (si es necesario)
**Posibles tests a agregar**:

**A. `rrhh-cache.integration.test.ts`** (si no existe):
- Endpoint POST /api/rrhh/cache/clear (ADMIN)
- Endpoint GET /api/rrhh/cache/stats
- Verificar que cache reduce queries a BD
- **Estimación**: 10-15 tests

**B. `reportes-marcar-procesados.integration.test.ts`** (si no existe separado):
- POST /api/reportes/marcar-procesados
- Validación de permisos (solo ADMIN)
- Validación de parámetros
- Inmutabilidad (no re-procesar turnos)
- **Estimación**: 10 tests

**C. Tests adicionales de autorización** (`authorization.integration.test.ts`):
- Endpoints protegidos sin token (401)
- Endpoints restringidos por rol (403)
- 5-10 endpoints críticos
- **Estimación**: 15-20 tests

**Entregables**:
- Tests faltantes agregados (~300-600 líneas por archivo)
- Total: 2-3 archivos nuevos con ~35-45 tests adicionales

---

### Fase 4: Configurar Scripts NPM y Jest (1h)
**Acción**: Crear comandos específicos para ejecutar tests de integración

#### 4.1 Agregar scripts a `package.json`
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern='(services|middlewares|unit|utils)' --testPathIgnorePatterns='integration'",
    "test:integration": "jest --testPathPattern='integration'",
    "test:integration:auth": "jest --testPathPattern='integration/auth'",
    "test:integration:crud": "jest --testPathPattern='integration/(clientes|ubicaciones|puestos|feriados|config-turnos|incentivos)'",
    "test:integration:rrhh": "jest --testPathPattern='integration/rrhh'",
    "test:integration:turnos": "jest --testPathPattern='integration/turnos'",
    "test:integration:reportes": "jest --testPathPattern='integration/reportes'",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:integration": "jest --coverage --testPathPattern='integration'",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

#### 4.2 Actualizar `jest.config.js`
**Agregar**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Setup files
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',

  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Performance
  verbose: true,
  testTimeout: 15000,
  maxWorkers: '50%',

  // Module aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
};
```

**Entregables**:
- `package.json` actualizado (+12 scripts nuevos)
- `jest.config.js` mejorado (+20 líneas)

---

### Fase 5: Documentación (1h)
**Acción**: Crear guía completa de testing

#### 5.1 Crear `backend/tests/README.md`
**Contenido**:
1. Introducción a la suite de tests
2. Estructura de directorios
3. Configuración de BD de prueba
4. Cómo ejecutar tests
   - Todos los tests
   - Solo tests de integración
   - Solo tests unitarios
   - Tests por módulo
5. Cómo crear nuevos tests
   - Usar helpers compartidos
   - Patrones de setup/teardown
   - Ejemplos de tests
6. Troubleshooting
   - Errores comunes
   - BD de prueba no conecta
   - Tests fallando
7. Cobertura de código
   - Objetivo: >70%
   - Cómo ver reporte
   - Áreas sin cobertura

**Extensión estimada**: 500-800 líneas

#### 5.2 Actualizar `backend/README.md`
**Agregar sección**:
- "Testing" con link a `tests/README.md`
- Comandos principales
- Badge de cobertura

**Entregables**:
- `backend/tests/README.md` (500-800 líneas)
- `backend/README.md` actualizado (+50 líneas)

---

### Fase 6: Verificación y Reporte (1h)
**Acción**: Ejecutar todos los tests y documentar resultados

#### 6.1 Verificar Compilación
```bash
npm run build
```
**Acción**: Documentar errores de compilación existentes (NO corregirlos, solo documentar)

#### 6.2 Ejecutar Tests (sin arreglar errores)
```bash
# Intentar ejecutar tests de integración
npm run test:integration 2>&1 | tee test-results.txt
```
**Acción**: Capturar salida y documentar:
- Cuántos tests pasan
- Cuántos tests fallan (y por qué)
- Errores de compilación bloqueantes
- Cobertura actual

#### 6.3 Generar Reporte de Cobertura
```bash
npm run test:coverage:integration
```
**Acción**: Capturar métricas de cobertura

#### 6.4 Crear Archivo de Resultado
**Archivo**: `docs/completed/T2.28_tests_integracion.md`

**Contenido**:
1. Resumen ejecutivo
2. Inventario completo de tests (tabla)
3. Infraestructura creada (helpers, setup, etc.)
4. Scripts npm agregados
5. Documentación creada
6. Resultados de ejecución (con disclaimers de errores existentes)
7. Métricas de cobertura
8. Trabajo futuro recomendado

**Extensión estimada**: 1,000-1,500 líneas

**Entregables**:
- Reporte completo de testing
- Capturas de salida de tests
- Métricas de cobertura

---

## 4. Entregables Finales

### Archivos Nuevos (Estimados)
1. `backend/tests/helpers/auth.helpers.ts` (~300 líneas)
2. `backend/tests/helpers/database.helpers.ts` (~300 líneas)
3. `backend/tests/helpers/request.helpers.ts` (~200 líneas)
4. `backend/tests/setup/global-setup.ts` (~150 líneas)
5. `backend/tests/setup/global-teardown.ts` (~100 líneas)
6. `backend/.env.test.example` (~50 líneas)
7. `backend/tests/README.md` (~700 líneas)
8. Posibles nuevos tests de integración (~900 líneas)
9. `docs/completed/T2.28_tests_integracion.md` (~1,500 líneas)

**Total estimado**: ~4,200 líneas de código nuevo

### Archivos Modificados
1. `backend/package.json` (+12 scripts)
2. `backend/jest.config.js` (+20 líneas)
3. `backend/README.md` (+50 líneas)
4. Mover `backend/tests/incentivos.test.ts` → `backend/tests/integration/incentivos.integration.test.ts`
5. `docs/tasks/tareas_fase2_backend_core_20260118.md` (actualizar estado T2.28 a [✓])

**Total estimado**: ~100 líneas modificadas + 1 archivo movido

---

## 5. Criterios de Aceptación

### Requisitos Funcionales
- [x] Inventario completo de tests existentes documentado
- [ ] Helpers compartidos creados y funcionando
- [ ] Setup/teardown global configurado
- [ ] Scripts npm para ejecutar tests de integración
- [ ] `.env.test.example` creado
- [ ] Documentación completa en `tests/README.md`
- [ ] Tests faltantes agregados (si es necesario)
- [ ] Archivo `incentivos.test.ts` movido a `integration/`

### Requisitos de Calidad
- [ ] Todos los helpers tienen tests unitarios
- [ ] Documentación clara y con ejemplos
- [ ] Código sigue estándares del proyecto (ESLint, Prettier)
- [ ] TypeScript strict mode sin errores (en archivos nuevos)

### Requisitos de Cobertura
- [ ] Cobertura >70% en endpoints críticos
- [ ] Todos los módulos principales tienen tests
- [ ] Reporte de cobertura generado

### Documentación
- [ ] `docs/completed/T2.28_tests_integracion.md` creado
- [ ] Estado de tarea actualizado a [✓] Completada
- [ ] README.md actualizado con guía de testing

---

## 6. Riesgos y Mitigaciones

### Riesgo 1: Tests bloqueados por errores de compilación existentes
**Probabilidad**: Alta
**Impacto**: Medio
**Mitigación**:
- Documentar claramente en el reporte que errores existentes bloquean la ejecución
- NO intentar corregir errores (fuera del scope)
- Proveer recomendaciones para trabajo futuro

### Riesgo 2: BD de prueba no existe
**Probabilidad**: Media
**Impacto**: Alto
**Mitigación**:
- Crear script de creación de BD en global-setup
- Documentar claramente requisitos de BD
- Proveer comandos SQL para crear BD manualmente

### Riesgo 3: Tests existentes tienen lógica incorrecta
**Probabilidad**: Baja
**Impacto**: Medio
**Mitigación**:
- Revisar lógica de tests durante análisis
- Documentar issues encontrados
- Crear tickets para correcciones futuras

---

## 7. Estimación de Tiempo

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1 | Análisis y consolidación | 1h |
| 2 | Crear infraestructura de testing | 2h |
| 3 | Agregar tests faltantes | 2h |
| 4 | Configurar scripts npm y Jest | 1h |
| 5 | Documentación | 1h |
| 6 | Verificación y reporte | 1h |
| **TOTAL** | | **8h** |

**Nota**: La estimación de 8h está en el límite superior del rango 6-8h estimado en la tarea.

---

## 8. Decisiones Técnicas

### Decisión 1: No ejecutar tests durante la tarea
**Razón**: Errores de compilación existentes bloquean la ejecución
**Alternativa**: Documentar estado actual y proveer scripts para ejecución futura
**Aprobada por**: Instrucciones del usuario

### Decisión 2: Priorizar calidad de infraestructura sobre cantidad de tests
**Razón**: Helpers reutilizables son más valiosos que tests adicionales
**Alternativa**: Agregar 100+ tests sin helpers
**Aprobada por**: Mejores prácticas de testing

### Decisión 3: Usar Jest global setup/teardown
**Razón**: Más eficiente que setup/teardown por archivo
**Alternativa**: Repetir setup en cada archivo
**Aprobada por**: Documentación de Jest

---

## 9. Checklist de Ejecución

### Pre-ejecución
- [x] Leer CLAUDE.md y Metodologia.md
- [x] Revisar tareas completadas (T2.01 - T2.27)
- [x] Identificar tests existentes

### Durante Ejecución
- [ ] Crear helpers compartidos
- [ ] Crear setup/teardown global
- [ ] Agregar tests faltantes
- [ ] Configurar scripts npm
- [ ] Crear documentación
- [ ] Generar reporte

### Post-ejecución
- [ ] Crear archivo en `docs/completed/`
- [ ] Actualizar estado de tarea a [✓]
- [ ] Commit con mensaje descriptivo
- [ ] Verificar que todos los archivos están en git

---

## 10. Referencias

- **Tarea**: `docs/tasks/tareas_fase2_backend_core_20260118.md` (línea 1279)
- **Metodología**: `Metodologia.md`
- **Jest Docs**: https://jestjs.io/docs/configuration
- **Supertest Docs**: https://github.com/ladjs/supertest
- **Test anterior exitoso**: T2.02 (51 tests, 100% passing)

---

**Creado por**: Agente Subagente
**Fecha**: 2026-01-19
**Versión**: 1.0
**Estado**: Listo para ejecución
