# Suite de Tests - OperacionesRanger Backend

Este documento describe la suite completa de tests del backend del Sistema de Gestión de Turnos.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Estructura de Directorios](#estructura-de-directorios)
- [Configuración](#configuración)
  - [Base de Datos de Prueba](#base-de-datos-de-prueba)
  - [Variables de Entorno](#variables-de-entorno)
- [Cómo Ejecutar Tests](#cómo-ejecutar-tests)
- [Helpers Compartidos](#helpers-compartidos)
- [Cómo Crear Nuevos Tests](#cómo-crear-nuevos-tests)
- [Cobertura de Código](#cobertura-de-código)
- [Troubleshooting](#troubleshooting)

---

## Introducción

La suite de tests del backend incluye:

- **Tests Unitarios**: Servicios, middlewares, utilidades
- **Tests de Integración**: Endpoints API completos con base de datos real
- **~350+ tests**: Cubriendo todos los módulos del sistema
- **Cobertura >70%**: En código crítico

### Tecnologías Utilizadas

- **Jest**: Framework de testing
- **Supertest**: Testing de API HTTP
- **TypeScript**: Todos los tests están tipados
- **MySQL**: Base de datos de prueba real (no mocks)

---

## Estructura de Directorios

```
backend/tests/
├── helpers/                    # Utilidades compartidas
│   ├── auth.helpers.ts         # Helpers de autenticación
│   ├── database.helpers.ts     # Helpers de base de datos
│   └── request.helpers.ts      # Helpers de requests HTTP
├── setup/                      # Setup/teardown global
│   ├── global-setup.ts         # Configuración antes de tests
│   └── global-teardown.ts      # Limpieza después de tests
├── integration/                # Tests de integración (API)
│   ├── auth.test.ts            # Autenticación (12 tests)
│   ├── usuarios.test.ts        # CRUD usuarios (25+ tests)
│   ├── clientes.test.ts        # CRUD clientes (22 tests)
│   ├── ubicaciones.test.ts     # CRUD ubicaciones (30+ tests)
│   ├── puestos.test.ts         # CRUD puestos (24 tests)
│   ├── feriados.test.ts        # CRUD feriados (14 tests)
│   ├── config-turnos.test.ts   # Config turnos (20 tests)
│   ├── incentivos.integration.test.ts  # CRUD incentivos (20 tests)
│   ├── rrhh.test.ts            # Integración RRHH (22 tests)
│   ├── turnos.integration.test.ts      # Turnos (48+ tests)
│   ├── reportes.integration.test.ts    # Reporte CSV (14 tests)
│   ├── reportes-historial.integration.test.ts  # Historial (12 tests)
│   └── reportes-resumen.integration.test.ts    # Resúmenes (18 tests)
├── services/                   # Tests unitarios de servicios
│   ├── password.service.test.ts    # Password hashing (22 tests)
│   ├── jwt.service.test.ts         # JWT tokens (29 tests)
│   └── cache.service.test.ts       # Caché (18 tests)
├── middlewares/                # Tests unitarios de middlewares
│   ├── auth.middleware.test.ts         # Autenticación (20 tests)
│   ├── role.middleware.test.ts         # Autorización (19 tests)
│   ├── audit.middleware.test.ts        # Auditoría (31 tests)
│   ├── error-handler.middleware.test.ts
│   ├── pagination.middleware.test.ts
│   └── validation.middleware.test.ts
├── unit/                       # Tests unitarios varios
│   └── turno.validation.test.ts    # Validaciones (24 tests)
├── utils/                      # Tests de utilidades
│   └── response.utils.test.ts
└── README.md                   # Este archivo
```

---

## Configuración

### Base de Datos de Prueba

**IMPORTANTE**: Los tests usan bases de datos **SEPARADAS** de desarrollo/producción.

#### 1. Crear Bases de Datos de Prueba

```bash
mysql -u root -p
```

```sql
-- Base de datos de turnos (prueba)
CREATE DATABASE turnos_guardianes_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Base de datos de RRHH (prueba)
CREATE DATABASE db_aae4a2_ranger_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

#### 2. Cargar Schema

```bash
# Desde la raíz del proyecto
mysql -u root -p turnos_guardianes_test < sistema_turnos_guardianes.sql
```

#### 3. (Opcional) Copiar Datos de RRHH

Si quieres usar datos reales de empleados en tests:

```bash
mysqldump -u root -p db_aae4a2_ranger rh_empleado | \
  mysql -u root -p db_aae4a2_ranger_test
```

### Variables de Entorno

#### 1. Copiar Archivo de Ejemplo

```bash
cp .env.test.example .env.test
```

#### 2. Configurar Variables

Editar `.env.test` con tus credenciales:

```env
# Base de datos de turnos (PRUEBA)
DB_TURNOS_HOST=localhost
DB_TURNOS_PORT=3306
DB_TURNOS_USER=root
DB_TURNOS_PASSWORD=tu_password
DB_TURNOS_NAME=turnos_guardianes_test

# Base de datos de RRHH (PRUEBA)
DB_RRHH_HOST=localhost
DB_RRHH_PORT=3306
DB_RRHH_USER=root
DB_RRHH_PASSWORD=tu_password
DB_RRHH_NAME=db_aae4a2_ranger_test

# JWT
JWT_SECRET=test_secret_key_min_32_characters_long_for_testing_purposes_only

# Logs (reducir ruido en tests)
LOG_LEVEL=error
AUDIT_ENABLED=false
```

---

## Cómo Ejecutar Tests

### Comandos Básicos

```bash
# Ejecutar TODOS los tests
npm test

# Ejecutar tests en modo watch (auto-rerun al cambiar archivos)
npm run test:watch

# Ejecutar con reporte de cobertura
npm run test:coverage
```

### Tests por Categoría

```bash
# Solo tests UNITARIOS (servicios, middlewares, utils)
npm run test:unit

# Solo tests de INTEGRACIÓN (API endpoints)
npm run test:integration
```

### Tests por Módulo Específico

```bash
# Tests de autenticación
npm run test:integration:auth

# Tests de CRUDs (clientes, ubicaciones, puestos, etc.)
npm run test:integration:crud

# Tests de integración RRHH
npm run test:integration:rrhh

# Tests de turnos
npm run test:integration:turnos

# Tests de reportes
npm run test:integration:reportes
```

### Tests Específicos por Archivo

```bash
# Ejecutar un archivo específico
npm test -- auth.test.ts

# Ejecutar con pattern
npm test -- --testNamePattern="login"
```

### Para CI/CD

```bash
# Ejecutar en modo CI (sin watch, con coverage)
npm run test:ci
```

---

## Helpers Compartidos

Los helpers compartidos facilitan la escritura de tests y evitan duplicación de código.

### Auth Helpers (`helpers/auth.helpers.ts`)

```typescript
import {
  createTestUser,
  createTestAdmin,
  getAuthToken,
  loginAsAdmin,
  loginAsSupervisor,
  cleanupTestUsers,
  TEST_ADMIN,
  TEST_SUPERVISOR,
} from '@tests/helpers/auth.helpers';

// Ejemplo de uso
describe('Mi test', () => {
  let adminToken: string;
  let userId: number;

  beforeAll(async () => {
    // Crear usuario admin de prueba
    userId = await createTestAdmin();

    // Obtener token
    adminToken = await loginAsAdmin();
  });

  afterAll(async () => {
    // Limpiar usuario
    await cleanupTestUsers([TEST_ADMIN.username]);
  });

  it('debe acceder a endpoint protegido', async () => {
    const response = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});
```

**Funciones disponibles**:

- `createTestUser(userData)`: Crear usuario de prueba
- `createTestAdmin()`: Crear usuario ADMIN predefinido
- `createTestSupervisor()`: Crear usuario SUPERVISOR predefinido
- `createTestConsulta()`: Crear usuario CONSULTA predefinido
- `createTempUser(rol)`: Crear usuario temporal con nombre único
- `getAuthToken(username, password)`: Obtener access token
- `getAuthTokens(username, password)`: Obtener access + refresh tokens
- `loginAsAdmin()`: Login como admin predefinido
- `loginAsSupervisor()`: Login como supervisor predefinido
- `loginAsConsulta()`: Login como consulta predefinido
- `cleanupTestUsers(usernames)`: Limpiar usuarios de prueba
- `userExists(username)`: Verificar si usuario existe

### Database Helpers (`helpers/database.helpers.ts`)

```typescript
import {
  cleanTable,
  seedTestData,
  seedTestClientes,
  seedTestStructure,
  countRecords,
  getRecordById,
} from '@tests/helpers/database.helpers';

// Ejemplo de uso
describe('Tests con base de datos', () => {
  beforeEach(async () => {
    // Limpiar tabla antes de cada test
    await cleanTable('clientes');
  });

  it('debe crear clientes de prueba', async () => {
    // Insertar datos de prueba
    const ids = await seedTestClientes();

    // Verificar que se insertaron
    const count = await countRecords('clientes');
    expect(count).toBe(2);

    // Obtener un registro
    const cliente = await getRecordById('clientes', ids[0]);
    expect(cliente).toBeTruthy();
    expect(cliente.nombre).toBe('Cliente Test 1');
  });

  it('debe crear estructura completa', async () => {
    // Crear clientes → ubicaciones → puestos
    const { clientes, ubicaciones, puestos } = await seedTestStructure();

    expect(clientes.length).toBe(2);
    expect(ubicaciones.length).toBe(4);
    expect(puestos.length).toBe(8);
  });
});
```

**Funciones disponibles**:

- `cleanTable(tableName)`: Limpiar tabla específica
- `truncateTable(tableName)`: Truncar tabla (más rápido)
- `cleanAllTestData()`: Limpiar todas las tablas de prueba
- `seedTestData(tableName, data[])`: Insertar múltiples registros
- `seedRecord(tableName, data)`: Insertar un registro
- `seedTestClientes()`: Crear clientes de prueba estándar
- `seedTestUbicaciones(clienteId)`: Crear ubicaciones de prueba
- `seedTestPuestos(ubicacionId)`: Crear puestos de prueba
- `seedTestStructure()`: Crear estructura completa (clientes → ubicaciones → puestos)
- `countRecords(tableName, where?, params?)`: Contar registros
- `recordExists(tableName, where, params)`: Verificar si existe registro
- `getRecordById(tableName, id)`: Obtener registro por ID
- `getRecords(tableName, where?, params?)`: Obtener múltiples registros

### Request Helpers (`helpers/request.helpers.ts`)

```typescript
import {
  authenticatedRequest,
  authGet,
  authPost,
  parseCSVResponse,
  parsePaginatedResponse,
  expectSuccess,
  expectUnauthorized,
  expectPaginatedResponse,
} from '@tests/helpers/request.helpers';

// Ejemplo de uso
describe('Tests de API', () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAsAdmin();
  });

  it('debe obtener lista paginada', async () => {
    // Request autenticado (forma 1)
    const response1 = await authenticatedRequest(token)
      .get('/api/clientes')
      .query({ page: 1, pageSize: 10 });

    // Request autenticado (forma 2 - atajo)
    const response2 = await authGet('/api/clientes', token)
      .query({ page: 1, pageSize: 10 });

    // Validar respuesta paginada
    expectPaginatedResponse(response1);

    // Parsear respuesta
    const { data, total } = parsePaginatedResponse(response1);
    expect(data).toBeInstanceOf(Array);
    expect(total).toBeGreaterThanOrEqual(data.length);
  });

  it('debe generar CSV', async () => {
    const response = await authPost('/api/reportes/nomina', token, {
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-01-15',
    });

    expectSuccess(response);
    expect(response.headers['content-type']).toContain('text/csv');

    // Parsear CSV
    const rows = parseCSVResponse(response.text);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('empleado_id');
  });

  it('debe rechazar acceso sin token', async () => {
    const response = await request(app).get('/api/usuarios');
    expectUnauthorized(response);
  });
});
```

**Funciones disponibles**:

**Requests Autenticados**:
- `authenticatedRequest(token)`: Builder pattern para requests
- `authGet(url, token)`: GET autenticado (atajo)
- `authPost(url, token, body?)`: POST autenticado (atajo)
- `authPut(url, token, body?)`: PUT autenticado (atajo)
- `authDelete(url, token)`: DELETE autenticado (atajo)

**Parseo de Respuestas**:
- `parseCSVResponse(csvText)`: Parsear CSV a objetos
- `parsePaginatedResponse(response)`: Parsear respuesta paginada
- `getErrorMessage(response)`: Extraer mensaje de error

**Validación de Respuestas**:
- `expectSuccess(response)`: Esperar 2xx
- `expectUnauthorized(response)`: Esperar 401
- `expectForbidden(response)`: Esperar 403
- `expectNotFound(response)`: Esperar 404
- `expectConflict(response)`: Esperar 409
- `expectPaginatedResponse(response)`: Validar estructura paginada
- `expectCSVResponse(response)`: Validar respuesta CSV
- `expectErrorResponse(response, status, message?)`: Validar error

**Utilidades**:
- `waitFor(condition, timeout)`: Polling para condición
- `sleep(ms)`: Esperar N milisegundos
- `retry(operation, maxRetries, delay)`: Reintentar operación

---

## Cómo Crear Nuevos Tests

### Patrón Recomendado para Tests de Integración

```typescript
/**
 * Tests de Integración - Mi Endpoint
 */

import request from 'supertest';
import app from '../../src/server';
import {
  createTestAdmin,
  loginAsAdmin,
  cleanupTestUsers,
  TEST_ADMIN,
} from '../helpers/auth.helpers';
import {
  cleanTable,
  seedTestClientes,
} from '../helpers/database.helpers';
import {
  authGet,
  authPost,
  expectSuccess,
  expectPaginatedResponse,
} from '../helpers/request.helpers';

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

describe('Mi Endpoint API', () => {
  let adminToken: string;
  let userId: number;

  // Setup antes de todos los tests
  beforeAll(async () => {
    userId = await createTestAdmin();
    adminToken = await loginAsAdmin();
  });

  // Cleanup después de todos los tests
  afterAll(async () => {
    await cleanupTestUsers([TEST_ADMIN.username]);
  });

  // Limpiar datos antes de cada test
  beforeEach(async () => {
    await cleanTable('clientes');
  });

  // ============================================================================
  // TESTS
  // ============================================================================

  describe('GET /api/mi-endpoint', () => {
    it('debe retornar lista vacía cuando no hay datos', async () => {
      const response = await authGet('/api/mi-endpoint', adminToken);

      expectSuccess(response);
      expectPaginatedResponse(response);
      expect(response.body.data).toHaveLength(0);
    });

    it('debe retornar lista con datos', async () => {
      // Insertar datos de prueba
      await seedTestClientes();

      const response = await authGet('/api/mi-endpoint', adminToken);

      expectSuccess(response);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/mi-endpoint', () => {
    it('debe crear registro exitosamente', async () => {
      const data = {
        nombre: 'Test',
        // ... otros campos
      };

      const response = await authPost('/api/mi-endpoint', adminToken, data);

      expectSuccess(response);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe(data.nombre);
    });

    it('debe validar campos requeridos', async () => {
      const response = await authPost('/api/mi-endpoint', adminToken, {});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
```

### Mejores Prácticas

1. **Usar helpers compartidos**: No duplicar código de setup
2. **Limpiar datos**: Usar `beforeEach` para limpiar tablas
3. **Nombres descriptivos**: Tests deben describir QUÉ hacen
4. **Un concepto por test**: Cada test debe verificar una cosa
5. **Arrange-Act-Assert**: Seguir este patrón en tests
6. **Evitar dependencias**: Tests deben ser independientes
7. **Usar async/await**: Todas las operaciones async deben esperarse
8. **Validar errores**: No solo casos exitosos, también errores
9. **Documentar**: Agregar comentarios para lógica compleja

---

## Cobertura de Código

### Objetivo de Cobertura

El proyecto tiene como objetivo **>70% de cobertura** en código crítico.

### Ver Reporte de Cobertura

```bash
# Generar reporte
npm run test:coverage

# Abrir reporte HTML en navegador
# El archivo se genera en: coverage/lcov-report/index.html
```

### Interpretación de Métricas

- **Statements**: % de líneas de código ejecutadas
- **Branches**: % de ramas (if/else) ejecutadas
- **Functions**: % de funciones ejecutadas
- **Lines**: % de líneas de código (similar a statements)

### Áreas con Baja Cobertura

Si ves áreas con cobertura <70%:

1. Verificar si es código crítico (lógica de negocio)
2. Agregar tests específicos para esas áreas
3. Si es código de utilidad simple, puede ser aceptable

### Coverage Threshold

El proyecto tiene configurado un threshold mínimo de 70% en `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

Si la cobertura cae por debajo de 70%, los tests **fallarán** en CI/CD.

---

## Troubleshooting

### Error: "Base de datos no existe"

**Problema**: Tests fallan porque la BD de prueba no existe.

**Solución**:

```bash
mysql -u root -p
CREATE DATABASE turnos_guardianes_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Error: "Tablas no existen"

**Problema**: BD existe pero tablas no están creadas.

**Solución**:

```bash
mysql -u root -p turnos_guardianes_test < sistema_turnos_guardianes.sql
```

### Error: "JWT_SECRET is required"

**Problema**: Archivo `.env.test` no existe o no tiene JWT_SECRET.

**Solución**:

```bash
cp .env.test.example .env.test
# Editar .env.test y configurar JWT_SECRET
```

### Error: "Cannot connect to database"

**Problema**: Credenciales incorrectas en `.env.test`.

**Solución**:

Verificar variables en `.env.test`:

```env
DB_TURNOS_HOST=localhost
DB_TURNOS_USER=root
DB_TURNOS_PASSWORD=tu_password_correcto
```

### Tests Fallan por Timeout

**Problema**: Tests tardan más de 10 segundos.

**Solución 1**: Aumentar timeout en `jest.config.js`:

```javascript
testTimeout: 15000, // 15 segundos
```

**Solución 2**: Aumentar timeout para un test específico:

```typescript
it('test lento', async () => {
  // ... test lento ...
}, 30000); // 30 segundos timeout
```

### Tests Fallan por Datos Previos

**Problema**: Tests fallan porque hay datos de ejecuciones previas.

**Solución**: Agregar cleanup en `beforeEach`:

```typescript
beforeEach(async () => {
  await cleanTable('mi_tabla');
});
```

### Error: "Table already exists"

**Problema**: Intentando crear tabla que ya existe.

**Solución**: Verificar que no estás ejecutando migrations en tests. El setup global debe verificar tablas existentes.

### Tests Pasan Localmente pero Fallan en CI

**Problema**: Diferencias entre entorno local y CI.

**Causas comunes**:

1. Variables de entorno diferentes
2. Versión de Node.js diferente
3. Zona horaria diferente (usar UTC en tests)
4. Base de datos en estado diferente

**Solución**: Usar `npm run test:ci` localmente para simular CI.

### Error: "Port 3000 already in use"

**Problema**: Servidor ya corriendo en puerto 3000.

**Solución**:

```bash
# Usar puerto diferente para tests
# En .env.test:
PORT=3001
```

### Tests de RRHH Fallan

**Problema**: No hay datos de empleados en BD RRHH de prueba.

**Solución**: Copiar datos de BD de desarrollo:

```bash
mysqldump -u root -p db_aae4a2_ranger rh_empleado | \
  mysql -u root -p db_aae4a2_ranger_test
```

---

## Referencias

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## Contacto

Si tienes preguntas sobre los tests o encuentras problemas:

1. Revisar este README
2. Revisar código de tests existentes como referencia
3. Consultar documentación de Jest/Supertest
4. Crear issue en el repositorio

---

**Última actualización**: 2026-01-19
**Mantenedor**: Equipo Backend OperacionesRanger
