/**
 * Tests de Integración: Reportes de Resumen (JSON)
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar los endpoints GET de reportes de resumen:
 * - GET /api/reportes/resumen-quincena
 * - GET /api/reportes/resumen-por-guardian
 * - GET /api/reportes/resumen-por-puesto
 *
 * Valida schemas Zod, cálculos de estadísticas, filtros opcionales,
 * paginación, y permisos de acceso (todos los roles autenticados).
 *
 * @group integration
 * @group reportes
 * @group T2.26
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { hashPasswordSync } from '../../src/services/password.service';

// Get database connections
const db = getTurnosPool();
const dbRRHH = getTurnosPool();

// ============================================================================
// VARIABLES GLOBALES PARA TESTS
// ============================================================================

let authTokenAdmin: string;
let authTokenSupervisor: string;
let authTokenConsulta: string;

let testEmpleadoId1: number;
let testEmpleadoId2: number;
let testClienteId: number;
let testUbicacionId: number;
let testPuestoId1: number;
let testPuestoId2: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

beforeAll(async () => {
  // 1. Crear usuarios de prueba y obtener tokens
  await createTestUsers();
  authTokenAdmin = await getAuthToken('admin_resumen', 'Admin123!');
  authTokenSupervisor = await getAuthToken('supervisor_resumen', 'Super123!');
  authTokenConsulta = await getAuthToken('consulta_resumen', 'Consulta123!');

  // 2. Crear datos de prueba en BD RRHH (2 empleados)
  testEmpleadoId1 = await createTestEmpleadoRRHH('001-1234567-8', 'Juan', 'Pérez');
  testEmpleadoId2 = await createTestEmpleadoRRHH('001-9876543-2', 'María', 'García');

  // 3. Crear datos de prueba en BD Turnos
  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId1 = await createTestPuesto(testUbicacionId, 'P-RES-001', 'Puesto Test 1');
  testPuestoId2 = await createTestPuesto(testUbicacionId, 'P-RES-002', 'Puesto Test 2');

  // 4. Crear feriado de prueba (2026-01-05 para tests)
  await createTestFeriado('2026-01-05', 'Día de Reyes', 'NACIONAL');

  // 5. Crear turnos de prueba para estadísticas
  await createTestTurnos();
});

afterAll(async () => {
  // Limpiar datos de prueba
  await cleanupTestData();
});

// ============================================================================
// FUNCIONES AUXILIARES: SETUP
// ============================================================================

/**
 * Crear usuarios de prueba para autenticación
 */
async function createTestUsers(): Promise<void> {
  const users = [
    { username: 'admin_resumen', password: 'Admin123!', rol: 'ADMIN' },
    { username: 'supervisor_resumen', password: 'Super123!', rol: 'SUPERVISOR' },
    { username: 'consulta_resumen', password: 'Consulta123!', rol: 'CONSULTA' },
  ];

  const usernames = users.map(u => u.username);
  await db.execute(
    `DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`,
    usernames
  );
  await db.execute(
    `DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`,
    usernames
  );
  await db.execute(`DELETE FROM ot_sys_usuarios WHERE username IN (?, ?, ?)`, usernames);

  for (const user of users) {
    await db.execute(
      `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
       VALUES (?, ?, ?, ?, ?, true)`,
      [user.username, hashPasswordSync(user.password), `${user.username}@test.com`, `${user.username} Test`, user.rol]
    );
  }
}

/**
 * Obtener token JWT para un usuario
 */
async function getAuthToken(username: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  return response.body.accessToken;
}

/**
 * Crear empleado de prueba en BD RRHH
 */
async function createTestEmpleadoRRHH(cedula: string, nombres: string, apellidos: string): Promise<number> {
  // Verificar si existe
  const [exists] = await dbRRHH.query<RowDataPacket[]>(
    'SELECT id_empleado FROM rh_empleado WHERE cedula_empleado = ?',
    [cedula]
  );

  if (exists.length > 0) {
    return exists[0].id_empleado;
  }

  // Crear nuevo empleado
  const [result] = await dbRRHH.execute<ResultSetHeader>(
    `INSERT INTO rh_empleado
     (cedula_empleado, nombres, apellidos, id_puesto, status)
     VALUES (?, ?, ?, 97, 1)`,
    [cedula, nombres, apellidos]
  );

  return result.insertId;
}

/**
 * Crear cliente de prueba
 */
async function createTestCliente(): Promise<number> {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO ot_clientes (codigo, nombre, activo)
     VALUES (?, ?, true)`,
    ['CLI-RESUMEN', 'Cliente Test Resumen']
  );

  return result.insertId;
}

/**
 * Crear ubicación de prueba
 */
async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo)
     VALUES (?, ?, ?, true)`,
    [clienteId, 'UBI-RESUMEN', 'Ubicación Test Resumen']
  );

  return result.insertId;
}

/**
 * Crear puesto de prueba
 */
async function createTestPuesto(ubicacionId: number, codigo: string, nombre: string): Promise<number> {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, activo)
     VALUES (?, ?, ?, true)`,
    [ubicacionId, codigo, nombre]
  );

  return result.insertId;
}

/**
 * Crear feriado de prueba
 */
async function createTestFeriado(fecha: string, nombre: string, tipo: string): Promise<void> {
  // Verificar si existe
  const [exists] = await db.query<RowDataPacket[]>(
    'SELECT id FROM ot_feriados WHERE fecha = ?',
    [fecha]
  );

  if (exists.length === 0) {
    await db.execute(
      `INSERT INTO ot_feriados (fecha, nombre, tipo)
       VALUES (?, ?, ?)`,
      [fecha, nombre, tipo]
    );
  }
}

/**
 * Crear turnos de prueba para estadísticas
 *
 * Esquema de turnos:
 * - Empleado 1: 5 turnos diurnos (2026-01-02 al 2026-01-06), total 50h normales + 10h extras
 * - Empleado 1: 2 turnos nocturnos (2026-01-07 y 2026-01-08), total 20h normales + 4h extras
 * - Empleado 2: 3 turnos diurnos (2026-01-03 al 2026-01-05), total 30h normales + 6h extras
 * - Puesto 1: 7 turnos, Puesto 2: 3 turnos
 * - Feriado: 2026-01-05 (1 turno)
 */
async function createTestTurnos(): Promise<void> {
  const turnos = [
    // Empleado 1, Puesto 1, Diurnos (5 turnos)
    { empleado_id: testEmpleadoId1, puesto_id: testPuestoId1, fecha: '2026-01-02', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 },
    { empleado_id: testEmpleadoId1, puesto_id: testPuestoId1, fecha: '2026-01-03', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 },
    { empleado_id: testEmpleadoId1, puesto_id: testPuestoId1, fecha: '2026-01-04', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 },
    { empleado_id: testEmpleadoId1, puesto_id: testPuestoId1, fecha: '2026-01-05', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 }, // FERIADO
    { empleado_id: testEmpleadoId1, puesto_id: testPuestoId1, fecha: '2026-01-06', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 },

    // Empleado 1, Puesto 1, Nocturnos (2 turnos)
    { empleado_id: testEmpleadoId1, puesto_id: testPuestoId1, fecha: '2026-01-07', hora_entrada: '18:00:00', hora_salida: '06:00:00', horas_normales: 10, horas_extras: 2 },
    { empleado_id: testEmpleadoId1, puesto_id: testPuestoId1, fecha: '2026-01-08', hora_entrada: '18:00:00', hora_salida: '06:00:00', horas_normales: 10, horas_extras: 2 },

    // Empleado 2, Puesto 2, Diurnos (3 turnos)
    { empleado_id: testEmpleadoId2, puesto_id: testPuestoId2, fecha: '2026-01-03', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 },
    { empleado_id: testEmpleadoId2, puesto_id: testPuestoId2, fecha: '2026-01-04', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 },
    { empleado_id: testEmpleadoId2, puesto_id: testPuestoId2, fecha: '2026-01-05', hora_entrada: '06:00:00', hora_salida: '18:00:00', horas_normales: 10, horas_extras: 2 }, // FERIADO
  ];

  for (const turno of turnos) {
    await db.execute(
      `CALL ot_sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?, ?, @turno_id, @mensaje)`,
      [
        turno.empleado_id,
        turno.puesto_id,
        turno.fecha,
        turno.hora_entrada,
        turno.hora_salida,
        turno.horas_normales,
        turno.horas_extras,
        null, // observaciones
        1,    // created_by
      ]
    );
  }
}

/**
 * Limpiar datos de prueba
 */
async function cleanupTestData(): Promise<void> {
  // Limpiar turnos
  if (testPuestoId1) {
    await db.query('DELETE FROM ot_turnos WHERE puesto_id IN (?, ?)', [testPuestoId1, testPuestoId2]);
  }

  // Limpiar puestos
  if (testPuestoId1) {
    await db.query('DELETE FROM ot_puestos WHERE id IN (?, ?)', [testPuestoId1, testPuestoId2]);
  }

  // Limpiar ubicaciones
  if (testUbicacionId) {
    await db.query('DELETE FROM ot_ubicaciones WHERE id = ?', [testUbicacionId]);
  }

  // Limpiar clientes
  if (testClienteId) {
    await db.query('DELETE FROM ot_clientes WHERE id = ?', [testClienteId]);
  }

  // Limpiar feriados de prueba
  await db.query('DELETE FROM ot_feriados WHERE fecha = ?', ['2026-01-05']);

  // Limpiar usuarios de prueba
  await db.query('DELETE FROM ot_sys_usuarios WHERE username LIKE ?', ['%_resumen']);

  // Limpiar empleados de prueba en BD RRHH
  if (testEmpleadoId1) {
    await dbRRHH.query('DELETE FROM rh_empleado WHERE id_empleado IN (?, ?)', [testEmpleadoId1, testEmpleadoId2]);
  }
}

// ============================================================================
// SUITE 1: GET /api/reportes/resumen-quincena
// ============================================================================

describe('GET /api/reportes/resumen-quincena', () => {
  // Test 1: Debe retornar resumen válido para rango de 15 días
  test('should return valid summary for 15-day range', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-quincena')
      .query({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15' })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_turnos');
    expect(response.body).toHaveProperty('total_horas_normales');
    expect(response.body).toHaveProperty('total_horas_extras');
    expect(response.body).toHaveProperty('total_guardianes');
    expect(response.body).toHaveProperty('turnos_por_tipo');
    expect(response.body).toHaveProperty('turnos_feriados');
    expect(response.body).toHaveProperty('total_incentivos');
    expect(response.body.fecha_inicio).toBe('2026-01-01');
    expect(response.body.fecha_fin).toBe('2026-01-15');
  });

  // Test 2: Debe retornar estructura correcta con todos los campos
  test('should return correct structure with all fields', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-quincena')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08' })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);

    // Validar tipos de datos
    expect(typeof response.body.total_turnos).toBe('number');
    expect(typeof response.body.total_horas_normales).toBe('number');
    expect(typeof response.body.total_horas_extras).toBe('number');
    expect(typeof response.body.total_guardianes).toBe('number');
    expect(Number(response.body.turnos_feriados)).not.toBeNaN();
    expect(Number(response.body.total_incentivos)).not.toBeNaN();

    // Validar objeto turnos_por_tipo
    expect(response.body.turnos_por_tipo).toHaveProperty('DIURNO');
    expect(response.body.turnos_por_tipo).toHaveProperty('NOCTURNO');
    expect(typeof response.body.turnos_por_tipo.DIURNO).toBe('number');
    expect(typeof response.body.turnos_por_tipo.NOCTURNO).toBe('number');
  });

  // Test 3: Debe calcular correctamente turnos_por_tipo (DIURNO/NOCTURNO)
  test('should calculate correct turnos_por_tipo distribution', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-quincena')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08' })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);

    // Con los datos de prueba: 8 DIURNOS (5 de emp1 + 3 de emp2), 2 NOCTURNOS (emp1)
    expect(response.body.total_turnos).toBe(10);
    expect(response.body.turnos_por_tipo.DIURNO).toBe(8);
    expect(response.body.turnos_por_tipo.NOCTURNO).toBe(2);
  });

  // Test 4: Debe requerir autenticación (401 sin token)
  test('should require authentication (401 without token)', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-quincena')
      .query({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15' });

    expect(response.status).toBe(401);
  });

  // Test 5: Debe permitir acceso a todos los roles (ADMIN, SUPERVISOR, CONSULTA)
  test('should allow access to all authenticated roles', async () => {
    const tokens = [authTokenAdmin, authTokenSupervisor, authTokenConsulta];

    for (const token of tokens) {
      const response = await request(app)
        .get('/api/reportes/resumen-quincena')
        .query({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    }
  });

  // Test 6: Debe rechazar rango de fechas inválido (400)
  test('should reject invalid date range (> 93 days)', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-quincena')
      .query({ fecha_inicio: '2026-01-01', fecha_fin: '2026-05-01' }) // ~120 días
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

// ============================================================================
// SUITE 2: GET /api/reportes/resumen-por-guardian
// ============================================================================

describe('GET /api/reportes/resumen-por-guardian', () => {
  // Test 1: Debe retornar lista paginada de resúmenes por guardián
  test('should return paginated list of guardian summaries', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-guardian')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(10);
  });

  // Test 2: Debe filtrar por empleado_id si se provee
  test('should filter by empleado_id if provided', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-guardian')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', empleado_id: testEmpleadoId1 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    // Validar que todos los resultados tienen el empleado_id correcto
    response.body.data.forEach((guardian: any) => {
      expect(guardian.empleado_id).toBe(testEmpleadoId1);
    });
  });

  // Test 3: Debe incluir datos del empleado (nombre, cédula)
  test('should include employee data (name, cedula)', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-guardian')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', empleado_id: testEmpleadoId1 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    const guardian = response.body.data[0];
    expect(guardian).toHaveProperty('empleado_id');
    expect(guardian).toHaveProperty('nombre_empleado');
    expect(guardian).toHaveProperty('cedula');
    expect(guardian).toHaveProperty('total_turnos');
    expect(guardian).toHaveProperty('total_horas_normales');
    expect(guardian).toHaveProperty('total_horas_extras');
    expect(guardian).toHaveProperty('turnos_diurnos');
    expect(guardian).toHaveProperty('turnos_nocturnos');
    expect(guardian).toHaveProperty('turnos_feriados');
    expect(guardian).toHaveProperty('total_incentivos');

    // Validar datos del empleado 1
    expect(guardian.nombre_empleado).toContain('Juan');
    expect(guardian.cedula).toBe('001-1234567-8');
  });

  // Test 4: Debe respetar paginación (page, pageSize)
  test('should respect pagination (page, pageSize)', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-guardian')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', page: 1, pageSize: 1 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(1);
  });

  // Test 5: Debe ordenar por total_turnos DESC
  test('should order by total_turnos DESC (most active first)', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-guardian')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08' })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);

    // Validar ordenamiento descendente por total_turnos
    if (response.body.data.length >= 2) {
      for (let i = 0; i < response.body.data.length - 1; i++) {
        expect(response.body.data[i].total_turnos).toBeGreaterThanOrEqual(
          response.body.data[i + 1].total_turnos
        );
      }
    }
  });

  // Test 6: Debe requerir autenticación (401)
  test('should require authentication (401)', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-guardian')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08' });

    expect(response.status).toBe(401);
  });
});

// ============================================================================
// SUITE 3: GET /api/reportes/resumen-por-puesto
// ============================================================================

describe('GET /api/reportes/resumen-por-puesto', () => {
  // Test 1: Debe retornar lista paginada de resúmenes por puesto
  test('should return paginated list of post summaries', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-puesto')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(10);
  });

  // Test 2: Debe filtrar por puesto_id si se provee
  test('should filter by puesto_id if provided', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-puesto')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', puesto_id: testPuestoId1 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    // Validar que todos los resultados tienen el puesto_id correcto
    response.body.data.forEach((puesto: any) => {
      expect(puesto.puesto_id).toBe(testPuestoId1);
    });
  });

  // Test 3: Debe filtrar por ubicacion_id si se provee
  test('should filter by ubicacion_id if provided', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-puesto')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', ubicacion_id: testUbicacionId })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    // Validar que todos los puestos pertenecen a la ubicación
    response.body.data.forEach((puesto: any) => {
      expect(puesto.ubicacion_nombre).toBe('Ubicación Test Resumen');
    });
  });

  // Test 4: Debe filtrar por cliente_id si se provee
  test('should filter by cliente_id if provided', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-puesto')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', cliente_id: testClienteId })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    // Validar que todos los puestos pertenecen al cliente
    response.body.data.forEach((puesto: any) => {
      expect(puesto.cliente_nombre).toBe('Cliente Test Resumen');
    });
  });

  // Test 5: Debe incluir datos relacionados (puesto, ubicación, cliente)
  test('should include related data (post, location, client)', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-puesto')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', puesto_id: testPuestoId1 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    const puesto = response.body.data[0];
    expect(puesto).toHaveProperty('puesto_id');
    expect(puesto).toHaveProperty('puesto_codigo');
    expect(puesto).toHaveProperty('puesto_nombre');
    expect(puesto).toHaveProperty('ubicacion_nombre');
    expect(puesto).toHaveProperty('cliente_nombre');
    expect(puesto).toHaveProperty('total_turnos');
    expect(puesto).toHaveProperty('total_horas_normales');
    expect(puesto).toHaveProperty('total_horas_extras');
    expect(puesto).toHaveProperty('guardianes_distintos');
    expect(puesto).toHaveProperty('turnos_diurnos');
    expect(puesto).toHaveProperty('turnos_nocturnos');
    expect(puesto).toHaveProperty('total_incentivos');

    // Validar datos del puesto 1
    expect(puesto.puesto_codigo).toBe('P-RES-001');
    expect(puesto.puesto_nombre).toBe('Puesto Test 1');
  });

  // Test 6: Debe respetar paginación
  test('should respect pagination', async () => {
    const response = await request(app)
      .get('/api/reportes/resumen-por-puesto')
      .query({ fecha_inicio: '2026-01-02', fecha_fin: '2026-01-08', page: 1, pageSize: 1 })
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(1);
  });
});
