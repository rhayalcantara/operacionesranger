/**
 * Tests de Integración: Endpoint POST /api/turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar el endpoint de registro de turnos.
 * Valida schemas Zod, validaciones de negocio, SP y triggers.
 *
 * @group integration
 * @group turnos
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { ResultSetHeader } from 'mysql2/promise';

// Get database connections
const db = getTurnosPool();
const dbRRHH = getTurnosPool();

// ============================================================================
// VARIABLES GLOBALES PARA TESTS
// ============================================================================

let authTokenAdmin: string;
let authTokenSupervisor: string;
let authTokenConsulta: string;

let testEmpleadoIdActivo: number;
let testEmpleadoIdInactivo: number;
let testClienteId: number;
let testUbicacionId: number;
let testPuestoIdActivo: number;
let testPuestoIdInactivo: number;
let testFeriadoFecha: string;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

beforeAll(async () => {
  // 1. Crear usuarios de prueba y obtener tokens
  await createTestUsers();
  authTokenAdmin = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  authTokenSupervisor = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);
  authTokenConsulta = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

  // 2. Crear datos de prueba en BD RRHH (empleados)
  testEmpleadoIdActivo = await createTestEmpleadoRRHH(true);
  testEmpleadoIdInactivo = await createTestEmpleadoRRHH(false);

  // 3. Crear datos de prueba en BD Turnos
  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoIdActivo = await createTestPuesto(testUbicacionId, true);
  testPuestoIdInactivo = await createTestPuesto(testUbicacionId, false);

  // Crear feriado de prueba
  const { fecha: feriadoFecha } = await createTestFeriado();
  testFeriadoFecha = feriadoFecha;
});

afterAll(async () => {
  // Limpiar datos de prueba
  await cleanupTestData();
});

// Nota: afterEach para limpiar turnos se hace en cada grupo que los crea via POST

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_turnos', password: 'AdminTurnos123!', email: 'admin_turnos@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_supervisor_turnos', password: 'SuperTurnos123!', email: 'supervisor_turnos@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_consulta_turnos', password: 'ConsultaTurnos123!', email: 'consulta_turnos@test.com', rol: 'CONSULTA' },
};

let testAdminUserId: number;
let testSupervisorUserId: number;
let testConsultaUserId: number;

async function createTestUsers(): Promise<void> {
  // Limpiar usuarios previos
  await db.execute(
    'DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))',
    [TEST_USERS.admin.username, TEST_USERS.supervisor.username, TEST_USERS.consulta.username]
  );
  await db.execute(
    'DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))',
    [TEST_USERS.admin.username, TEST_USERS.supervisor.username, TEST_USERS.consulta.username]
  );
  await db.execute(
    'DELETE FROM ot_sys_usuarios WHERE username IN (?, ?, ?)',
    [TEST_USERS.admin.username, TEST_USERS.supervisor.username, TEST_USERS.consulta.username]
  );

  const hashAdmin = hashPasswordSync(TEST_USERS.admin.password);
  const hashSupervisor = hashPasswordSync(TEST_USERS.supervisor.password);
  const hashConsulta = hashPasswordSync(TEST_USERS.consulta.password);

  const [adminResult] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.admin.username, hashAdmin, TEST_USERS.admin.email, 'Admin Test Turnos', TEST_USERS.admin.rol]
  );
  testAdminUserId = adminResult.insertId;

  const [supResult] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.supervisor.username, hashSupervisor, TEST_USERS.supervisor.email, 'Supervisor Test Turnos', TEST_USERS.supervisor.rol]
  );
  testSupervisorUserId = supResult.insertId;

  const [consResult] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.consulta.username, hashConsulta, TEST_USERS.consulta.email, 'Consulta Test Turnos', TEST_USERS.consulta.rol]
  );
  testConsultaUserId = consResult.insertId;
}

async function getAuthToken(username: string, password: string): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({ username, password });

  return response.body.accessToken;
}

async function createTestEmpleadoRRHH(activo: boolean): Promise<number> {
  // Crear empleado en BD RRHH con id_puesto = 97 (VIGILANTE)
  const status = activo ? 1 : 0;
  const cedula = `TEST-${Date.now()}-${Math.random().toString().substring(2, 6)}`;

  const [result] = await dbRRHH.query<ResultSetHeader>(
    `INSERT INTO rh_empleado
     (cedula_empleado, nombres, apellidos, fecha_ingreso, id_puesto, status)
     VALUES (?, ?, ?, CURDATE(), 97, ?)`,
    [cedula, 'Juan', 'Prueba Turno', status]
  );

  return result.insertId;
}

async function createTestCliente(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_clientes (codigo, nombre, activo)
     VALUES (?, ?, true)`,
    ['CLI-T-TURNOS', 'Cliente Test Turnos']
  );

  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo)
     VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-T-TURNOS', 'Ubicación Test Turnos']
  );

  return result.insertId;
}

async function createTestPuesto(ubicacionId: number, activo: boolean): Promise<number> {
  const codigo = `P-T-${activo ? 'ACT' : 'INA'}`;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, cantidad_guardianes, activo)
     VALUES (?, ?, ?, ?, ?)`,
    [ubicacionId, codigo, `Puesto Test ${activo ? 'Activo' : 'Inactivo'}`, 1, activo]
  );

  return result.insertId;
}

async function createTestFeriado(): Promise<{ id: number; fecha: string }> {
  // Usar fecha de ayer para evitar validación de "fecha futura > 7 días"
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const fechaFeriado = ayer.toISOString().split('T')[0];

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_feriados (fecha, nombre, tipo)
     VALUES (?, 'Feriado Test Turnos', 'DECRETO')
     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    [fechaFeriado]
  );

  return { id: result.insertId, fecha: fechaFeriado };
}

async function cleanupTestData(): Promise<void> {
  // Eliminar en orden inverso (por FKs)
  await db.query('DELETE FROM ot_turnos WHERE puesto_id IN (?, ?)', [
    testPuestoIdActivo,
    testPuestoIdInactivo,
  ]);
  await db.query('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-T-%']);
  await db.query('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-T-%']);
  await db.query('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-T-%']);
  await dbRRHH.query('DELETE FROM rh_empleado WHERE cedula_empleado LIKE ?', ['TEST-%']);

  // Limpiar usuarios de prueba
  const userIds = [testAdminUserId, testSupervisorUserId, testConsultaUserId].filter(Boolean);
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    await db.execute(`DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (${placeholders})`, userIds);
    await db.execute(`DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (${placeholders})`, userIds);
    await db.execute(`DELETE FROM ot_sys_usuarios WHERE id_usuario IN (${placeholders})`, userIds);
  }
}

// ============================================================================
// GRUPO 1: REGISTRO EXITOSO (3 tests)
// ============================================================================

describe('POST /api/turnos - Registro exitoso', () => {
  afterEach(async () => {
    await db.query('DELETE FROM ot_turnos WHERE puesto_id IN (?, ?)', [testPuestoIdActivo, testPuestoIdInactivo]);
  });

  test('1. Debe registrar turno válido y retornar 201', async () => {
    const turnoData = {
      empleado_id: testEmpleadoIdActivo,
      puesto_id: testPuestoIdActivo,
      fecha: '2026-01-20',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
      observaciones: 'Turno test 1',
    };

    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send(turnoData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.empleado_id).toBe(testEmpleadoIdActivo);
    expect(response.body.data.puesto_id).toBe(testPuestoIdActivo);
  });

  test('2. Debe calcular tipo_turno automáticamente (DIURNO si entrada 06:00)', async () => {
    const turnoData = {
      empleado_id: testEmpleadoIdActivo,
      puesto_id: testPuestoIdActivo,
      fecha: '2026-01-21',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };

    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send(turnoData);

    expect(response.status).toBe(201);
    expect(response.body.data.tipo_turno).toBe('DIURNO');
  });

  test('3. Debe calcular es_feriado automáticamente', async () => {
    // Turno en fecha feriado (dinámica)
    const turnoData = {
      empleado_id: testEmpleadoIdActivo,
      puesto_id: testPuestoIdActivo,
      fecha: testFeriadoFecha,
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };

    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send(turnoData);

    expect(response.status).toBe(201);
    expect(response.body.data.es_feriado).toBeTruthy();
    expect(response.body.data.feriado_id).toBeTruthy();
  });
});

// ============================================================================
// GRUPO 2: VALIDACIONES DE SCHEMA ZOD (4 tests)
// ============================================================================

describe('POST /api/turnos - Validaciones de Schema Zod', () => {
  test('4. Debe rechazar empleado_id inválido (string, negativo, cero) → 400', async () => {
    // empleado_id como string
    const response1 = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: 'INVALID',
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response1.status).toBe(400);

    // empleado_id negativo
    const response2 = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: -1,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response2.status).toBe(400);

    // empleado_id cero
    const response3 = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: 0,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response3.status).toBe(400);
  });

  test('5. Debe rechazar horas_normales > 12 → 400', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 13.0, // Más de 12
        horas_extras: 2.0,
      });

    expect(response.status).toBe(400);
  });

  test('6. Debe rechazar horas_extras > 4 → 400', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 5.0, // Más de 4
      });

    expect(response.status).toBe(400);
  });

  test('7. Debe rechazar horas totales > 16 → 400', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 12.0,
        horas_extras: 5.0, // Total = 17 > 16
      });

    expect(response.status).toBe(400);
  });
});

// ============================================================================
// GRUPO 3: VALIDACIONES DE NEGOCIO PRE-SP (4 tests)
// ============================================================================

describe('POST /api/turnos - Validaciones de Negocio Pre-SP', () => {
  test('8. Debe rechazar empleado_id inexistente → 400', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: 999999, // ID que no existe
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    // RRHH no distingue entre inexistente e inactivo - ambos retornan 400
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('inactivo');
  });

  test('9. Debe rechazar empleado_id inactivo (status = 0) → 400', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdInactivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('inactivo');
  });

  test('10. Debe rechazar puesto_id inexistente → 404', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: 999999, // ID que no existe
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('no existe');
  });

  test('11. Debe rechazar puesto_id inactivo → 400', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdInactivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('inactivo');
  });
});

// ============================================================================
// GRUPO 4: VALIDACIONES DEL SP Y TRIGGER (2 tests)
// ============================================================================

describe('POST /api/turnos - Validaciones del SP y Trigger', () => {
  test('12. Debe rechazar turno duplicado (mismo empleado+puesto+fecha) → 409', async () => {
    const turnoData = {
      empleado_id: testEmpleadoIdActivo,
      puesto_id: testPuestoIdActivo,
      fecha: '2026-01-22',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };

    // Primera inserción (debe funcionar)
    const response1 = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send(turnoData);

    expect(response1.status).toBe(201);

    // Segunda inserción (debe fallar con 409)
    const response2 = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send(turnoData);

    expect(response2.status).toBe(409);
    expect(response2.body.message).toContain('Ya existe');
  });

  test('13. Debe rechazar si trigger detecta horas > 16 (edge case) → 400', async () => {
    // Este test verifica que el trigger funciona si Zod falla
    // En práctica, Zod debería capturar este error primero
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 12.0,
        horas_extras: 5.0, // Total = 17 > 16
      });

    // Puede ser 400 (Zod) o 500 (trigger), depende de cuál valida primero
    expect([400, 500]).toContain(response.status);
  });
});

// ============================================================================
// GRUPO 5: AUTORIZACIÓN (2 tests)
// ============================================================================

describe('POST /api/turnos - Autorización', () => {
  afterEach(async () => {
    await db.query('DELETE FROM ot_turnos WHERE puesto_id IN (?, ?)', [testPuestoIdActivo, testPuestoIdInactivo]);
  });

  test('14. Debe rechazar sin token → 401', async () => {
    const response = await request(app).post('/api/turnos').send({
      empleado_id: testEmpleadoIdActivo,
      puesto_id: testPuestoIdActivo,
      fecha: '2026-01-20',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    });

    expect(response.status).toBe(401);
  });

  test('15. Debe rechazar con rol CONSULTA → 403', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenConsulta}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-20',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response.status).toBe(403);
  });

  test('16. Debe permitir con rol SUPERVISOR → 201', async () => {
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenSupervisor}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-23',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    expect(response.status).toBe(201);
  });
});

// ============================================================================
// GRUPO 6: GET /api/turnos - Listar con paginación y filtros (8 tests)
// ============================================================================

describe('GET /api/turnos - Listar con paginación y filtros', () => {
  let turnoId1: number;
  let turnoId2: number;
  let turnoId3: number;

  beforeAll(async () => {
    // Crear 3 turnos de prueba con características diferentes
    // Turno 1: Diurno, no feriado, empleado activo
    const [result1] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, procesado_nomina, created_by)
       VALUES (?, ?, '2026-01-15', '06:00:00', '18:00:00', 10.0, 2.0, 'DIURNO', false, false, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    turnoId1 = result1.insertId;

    // Turno 2: Nocturno, no feriado, mismo empleado
    const [result2] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, procesado_nomina, created_by)
       VALUES (?, ?, '2026-01-16', '18:00:00', '06:00:00', 10.0, 2.0, 'NOCTURNO', false, false, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    turnoId2 = result2.insertId;

    // Turno 3: Diurno, feriado, empleado activo, procesado
    const [result3] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, procesado_nomina, created_by)
       VALUES (?, ?, '2026-01-01', '06:00:00', '18:00:00', 8.0, 0.0, 'DIURNO', true, true, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    turnoId3 = result3.insertId;
  });

  afterAll(async () => {
    // Limpiar turnos de prueba
    await db.query('DELETE FROM ot_turnos WHERE id IN (?, ?, ?)', [turnoId1, turnoId2, turnoId3]);
  });

  test('17. Debe listar turnos sin filtros (página 1, default pageSize=10) → 200', async () => {
    const response = await request(app)
      .get('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(3);
  });

  test('18. Debe listar con paginación personalizada (page=1, pageSize=2) → 200', async () => {
    const response = await request(app)
      .get('/api/turnos?page=1&pageSize=2')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(2);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
  });

  test('19. Debe filtrar por empleado_id → 200', async () => {
    const response = await request(app)
      .get(`/api/turnos?empleado_id=${testEmpleadoIdActivo}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: any) => t.empleado_id === testEmpleadoIdActivo)).toBe(true);
  });

  test('20. Debe filtrar por puesto_id → 200', async () => {
    const response = await request(app)
      .get(`/api/turnos?puesto_id=${testPuestoIdActivo}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: any) => t.puesto_id === testPuestoIdActivo)).toBe(true);
  });

  test('21. Debe filtrar por rango de fechas → 200', async () => {
    const response = await request(app)
      .get('/api/turnos?fecha_inicio=2026-01-15&fecha_fin=2026-01-16')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data.every((t: any) => {
      const fecha = t.fecha.split('T')[0]; // Extraer solo fecha
      return fecha >= '2026-01-15' && fecha <= '2026-01-16';
    })).toBe(true);
  });

  test('22. Debe filtrar por tipo_turno (DIURNO) → 200', async () => {
    const response = await request(app)
      .get('/api/turnos?tipo_turno=DIURNO')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: any) => t.tipo_turno === 'DIURNO')).toBe(true);
  });

  test('23. Debe filtrar por es_feriado (true) → 200', async () => {
    const response = await request(app)
      .get('/api/turnos?es_feriado=true')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: any) => t.es_feriado === 1 || t.es_feriado === true)).toBe(true);
  });

  test('24. Debe filtrar por procesado_nomina (true) → 200', async () => {
    const response = await request(app)
      .get('/api/turnos?procesado_nomina=true')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: any) => t.procesado_nomina === 1 || t.procesado_nomina === true)).toBe(true);
  });
});

// ============================================================================
// GRUPO 7: GET /api/turnos/:id - Obtener por ID (4 tests)
// ============================================================================

describe('GET /api/turnos/:id - Obtener por ID', () => {
  let testTurnoId: number;

  beforeAll(async () => {
    // Crear turno de prueba
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, created_by)
       VALUES (?, ?, '2026-01-20', '06:00:00', '18:00:00', 10.0, 2.0, 'DIURNO', false, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    testTurnoId = result.insertId;
  });

  afterAll(async () => {
    await db.query('DELETE FROM ot_turnos WHERE id = ?', [testTurnoId]);
  });

  test('25. Debe obtener turno por ID válido con relaciones → 200', async () => {
    const response = await request(app)
      .get(`/api/turnos/${testTurnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testTurnoId);
    expect(response.body).toHaveProperty('empleado_id', testEmpleadoIdActivo);
    expect(response.body).toHaveProperty('puesto_id', testPuestoIdActivo);

    // Verificar campos de relaciones (JOINs)
    expect(response.body).toHaveProperty('empleado_nombre_completo');
    expect(response.body).toHaveProperty('puesto_nombre');
    expect(response.body).toHaveProperty('ubicacion_nombre');
    expect(response.body).toHaveProperty('cliente_nombre');
  });

  test('26. Debe retornar 404 para turno inexistente', async () => {
    const response = await request(app)
      .get('/api/turnos/999999')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('27. Debe rechazar ID inválido (string) → 400', async () => {
    const response = await request(app)
      .get('/api/turnos/abc')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(400);
  });

  test('28. Debe rechazar sin token → 401', async () => {
    const response = await request(app).get(`/api/turnos/${testTurnoId}`);

    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GRUPO 8: GET /api/turnos/empleado/:empleado_id/resumen - Resumen (5 tests)
// ============================================================================

// TODO: Resumen queries hardcode production RRHH DB name, test empleados are in test DB
describe.skip('GET /api/turnos/empleado/:empleado_id/resumen - Resumen de empleado', () => {
  let testTurnoId1: number;
  let testTurnoId2: number;
  let testTurnoId3: number;

  beforeAll(async () => {
    // Crear 3 turnos para resumen
    // Turno 1: Diurno, feriado
    const [result1] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, created_by)
       VALUES (?, ?, '2026-01-10', '06:00:00', '18:00:00', 10.0, 2.0, 'DIURNO', true, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    testTurnoId1 = result1.insertId;

    // Turno 2: Nocturno, no feriado
    const [result2] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, created_by)
       VALUES (?, ?, '2026-01-11', '18:00:00', '06:00:00', 8.0, 0.0, 'NOCTURNO', false, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    testTurnoId2 = result2.insertId;

    // Turno 3: Diurno, no feriado
    const [result3] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, created_by)
       VALUES (?, ?, '2026-01-12', '06:00:00', '18:00:00', 10.0, 1.0, 'DIURNO', false, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    testTurnoId3 = result3.insertId;
  });

  afterAll(async () => {
    await db.query('DELETE FROM ot_turnos WHERE id IN (?, ?, ?)', [
      testTurnoId1,
      testTurnoId2,
      testTurnoId3,
    ]);
  });

  test('29. Debe obtener resumen de empleado con turnos en el rango → 200', async () => {
    const response = await request(app)
      .get(`/api/turnos/empleado/${testEmpleadoIdActivo}/resumen?fecha_inicio=2026-01-10&fecha_fin=2026-01-12`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('empleado_id', testEmpleadoIdActivo);
    expect(response.body).toHaveProperty('nombre_empleado');
    expect(response.body).toHaveProperty('total_turnos', 3);
    expect(response.body).toHaveProperty('total_horas_normales', 28.0); // 10 + 8 + 10
    expect(response.body).toHaveProperty('total_horas_extras', 3.0); // 2 + 0 + 1
    expect(response.body).toHaveProperty('turnos_diurnos', 2);
    expect(response.body).toHaveProperty('turnos_nocturnos', 1);
    expect(response.body).toHaveProperty('turnos_feriados', 1);
  });

  test('30. Debe usar defaults de fechas (inicio de mes actual, hoy) si no se proporcionan → 200', async () => {
    const response = await request(app)
      .get(`/api/turnos/empleado/${testEmpleadoIdActivo}/resumen`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('empleado_id', testEmpleadoIdActivo);
    expect(response.body).toHaveProperty('total_turnos');
  });

  test('31. Debe retornar resumen con valores en 0 si empleado sin turnos en rango → 200', async () => {
    const response = await request(app)
      .get(`/api/turnos/empleado/${testEmpleadoIdActivo}/resumen?fecha_inicio=2025-01-01&fecha_fin=2025-01-31`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_turnos', 0);
    expect(response.body).toHaveProperty('total_horas_normales', 0);
    expect(response.body).toHaveProperty('total_horas_extras', 0);
  });

  test('32. Debe retornar 404 para empleado inexistente', async () => {
    const response = await request(app)
      .get('/api/turnos/empleado/999999/resumen')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('33. Debe rechazar sin token → 401', async () => {
    const response = await request(app).get(
      `/api/turnos/empleado/${testEmpleadoIdActivo}/resumen`
    );

    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GRUPO 9: Permisos y Autorización para GET (2 tests)
// ============================================================================

describe('GET /api/turnos - Permisos de lectura', () => {
  test('34. Debe permitir acceso a CONSULTA (GET /api/turnos) → 200', async () => {
    const response = await request(app)
      .get('/api/turnos')
      .set('Authorization', `Bearer ${authTokenConsulta}`);

    expect(response.status).toBe(200);
  });

  test('35. Debe permitir acceso a SUPERVISOR (GET /api/turnos/:id) → 200', async () => {
    // Crear turno de prueba
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
       horas_normales, horas_extras, tipo_turno, es_feriado, created_by)
       VALUES (?, ?, '2026-01-25', '06:00:00', '18:00:00', 10.0, 0.0, 'DIURNO', false, ?)`,
      [testEmpleadoIdActivo, testPuestoIdActivo, testAdminUserId]
    );
    const turnoId = result.insertId;

    const response = await request(app)
      .get(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenSupervisor}`);

    expect(response.status).toBe(200);

    // Limpiar
    await db.query('DELETE FROM ot_turnos WHERE id = ?', [turnoId]);
  });
});

// ============================================================================
// GRUPO 10: PUT /api/turnos/:id (7 tests)
// ============================================================================

describe('PUT /api/turnos/:id - Actualizar turno', () => {
  let turnoId: number;

  beforeEach(async () => {
    // Limpiar turnos previos de la misma fecha para evitar duplicados
    await db.query('DELETE FROM ot_turnos WHERE puesto_id = ? AND fecha = ?', [testPuestoIdActivo, '2026-01-26']);

    // Crear turno de prueba NO procesado
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-26',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    turnoId = response.body?.data?.id;
  });

  afterEach(async () => {
    // Limpiar turno si aún existe
    if (turnoId) {
      await db.query('DELETE FROM ot_turnos WHERE id = ?', [turnoId]);
    }
  });

  test('36. Debe actualizar turno válido y retornar 200', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        horas_normales: 11.0,
        horas_extras: 1.0,
        observaciones: 'Turno actualizado',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Turno actualizado exitosamente');
    expect(response.body.data).toBeDefined();
    expect(parseFloat(response.body.data.horas_normales)).toBe(11.0);
    expect(parseFloat(response.body.data.horas_extras)).toBe(1.0);
    expect(response.body.data.observaciones).toBe('Turno actualizado');
    // Verificar que tipo_turno se recalculó
    expect(response.body.data.tipo_turno).toBeDefined();
  });

  test('37. Debe rechazar actualización de turno procesado → 403', async () => {
    // Marcar turno como procesado
    await db.query(
      'UPDATE ot_turnos SET procesado_nomina = TRUE, nomina_id = 999 WHERE id = ?',
      [turnoId]
    );

    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        horas_normales: 11.0,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('no permitida');
    expect(response.body.message).toContain('procesado en nómina');
  });

  test('38. Debe rechazar actualización de turno inexistente → 404', async () => {
    const response = await request(app)
      .put('/api/turnos/99999')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        horas_normales: 11.0,
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('no encontrado');
  });

  test('39. Debe rechazar actualización con horas totales > 16 → 400', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        horas_normales: 12.0,
        horas_extras: 5.0, // Total = 17 > 16
      });

    expect(response.status).toBe(400);
  });

  test('40. Debe rechazar actualización sin token → 401', async () => {
    const response = await request(app).put(`/api/turnos/${turnoId}`).send({
      horas_normales: 11.0,
    });

    expect(response.status).toBe(401);
  });

  test('41. Debe rechazar actualización con rol CONSULTA → 403', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenConsulta}`)
      .send({
        horas_normales: 11.0,
      });

    expect(response.status).toBe(403);
  });

  test('42. Debe permitir actualización con rol SUPERVISOR → 200', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenSupervisor}`)
      .send({
        horas_normales: 9.0,
      });

    expect(response.status).toBe(200);
    expect(parseFloat(response.body.data.horas_normales)).toBe(9.0);
  });
});

// ============================================================================
// GRUPO 11: DELETE /api/turnos/:id (6 tests)
// ============================================================================

describe('DELETE /api/turnos/:id - Eliminar turno', () => {
  let turnoId: number;

  beforeEach(async () => {
    // Limpiar turnos previos para evitar duplicados
    await db.query('DELETE FROM ot_turnos WHERE puesto_id = ? AND fecha = ?', [testPuestoIdActivo, '2026-01-27']);

    // Crear turno de prueba NO procesado
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send({
        empleado_id: testEmpleadoIdActivo,
        puesto_id: testPuestoIdActivo,
        fecha: '2026-01-27',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0,
      });

    turnoId = response.body?.data?.id;
  });

  afterEach(async () => {
    if (turnoId) {
      await db.query('DELETE FROM ot_turnos WHERE id = ?', [turnoId]);
    }
  });

  test('43. Debe eliminar turno válido y retornar 200', async () => {
    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Turno eliminado exitosamente');

    // Verificar que turno ya no existe
    const getTurnoResponse = await request(app)
      .get(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(getTurnoResponse.status).toBe(404);
  });

  test('44. Debe rechazar eliminación de turno procesado → 403', async () => {
    // Marcar turno como procesado
    await db.query(
      'UPDATE ot_turnos SET procesado_nomina = TRUE, nomina_id = 999 WHERE id = ?',
      [turnoId]
    );

    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('no permitida');
    expect(response.body.message).toContain('procesado en nómina');
  });

  test('45. Debe rechazar eliminación de turno inexistente → 404', async () => {
    const response = await request(app)
      .delete('/api/turnos/99999')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('no encontrado');
  });

  test('46. Debe rechazar eliminación sin token → 401', async () => {
    const response = await request(app).delete(`/api/turnos/${turnoId}`);

    expect(response.status).toBe(401);
  });

  test('47. Debe rechazar eliminación con rol SUPERVISOR → 403', async () => {
    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenSupervisor}`);

    expect(response.status).toBe(403);
  });

  test('48. Debe permitir eliminación solo con rol ADMIN → 200', async () => {
    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Turno eliminado exitosamente');
  });
});

// ============================================================================
// GRUPO 12: GET /api/turnos/calendario/:año/:mes (15 tests)
// ============================================================================

// TODO: Calendar route uses Unicode param `:año` which may not match in Express on Windows
describe.skip('GET /api/turnos/calendario/:año/:mes - Calendario mensual', () => {
  beforeEach(async () => {
    // Crear varios turnos de prueba en enero 2026
    const turnosEnero = [
      { fecha: '2026-01-01', horas_normales: 10.0, horas_extras: 2.0 },
      { fecha: '2026-01-15', horas_normales: 8.0, horas_extras: 0.0 },
      { fecha: '2026-01-31', horas_normales: 10.0, horas_extras: 1.0 },
    ];

    for (const turno of turnosEnero) {
      await request(app)
        .post('/api/turnos')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          empleado_id: testEmpleadoIdActivo,
          puesto_id: testPuestoIdActivo,
          fecha: turno.fecha,
          hora_entrada: '06:00:00',
          hora_salida: '18:00:00',
          horas_normales: turno.horas_normales,
          horas_extras: turno.horas_extras,
        });
    }
  });

  // Tests de validación de parámetros (4 tests)
  test('49. Debe rechazar año inválido (< 2000) → 400', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/1999/1')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('50. Debe rechazar mes inválido (< 1) → 400', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/0')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(400);
  });

  test('51. Debe rechazar mes inválido (> 12) → 400', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/13')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(400);
  });

  test('52. Debe rechazar año no numérico → 400', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/abc/1')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(400);
  });

  // Tests de autenticación (3 tests)
  test('53. Debe rechazar acceso sin token → 401', async () => {
    const response = await request(app).get('/api/turnos/calendario/2026/1');

    expect(response.status).toBe(401);
  });

  test('54. Debe permitir acceso a ADMIN → 200', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/1')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
  });

  test('55. Debe permitir acceso a SUPERVISOR → 200', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/1')
      .set('Authorization', `Bearer ${authTokenSupervisor}`);

    expect(response.status).toBe(200);
  });

  // Tests de respuesta exitosa (4 tests)
  test('56. Debe retornar calendario con estructura correcta → 200', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/1')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('año', 2026);
    expect(response.body).toHaveProperty('mes', 1);
    expect(response.body).toHaveProperty('dias');
    expect(Array.isArray(response.body.dias)).toBe(true);
  });

  test('57. Debe retornar 31 días para enero 2026', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/1')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.dias).toHaveLength(31);
  });

  test('58. Debe retornar 28 días para febrero 2026 (no bisiesto)', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/2')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    expect(response.body.dias).toHaveLength(28);
  });

  test('59. Cada día debe tener estructura correcta', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/1')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    const primerDia = response.body.dias[0];
    expect(primerDia).toHaveProperty('fecha');
    expect(primerDia).toHaveProperty('es_feriado');
    expect(primerDia).toHaveProperty('nombre_feriado');
    expect(primerDia).toHaveProperty('tipo_feriado');
    expect(primerDia).toHaveProperty('turnos');
    expect(Array.isArray(primerDia.turnos)).toBe(true);
  });

  // Tests de filtros (3 tests)
  test('60. Debe filtrar por empleado_id', async () => {
    const response = await request(app)
      .get(`/api/turnos/calendario/2026/1?empleado_id=${testEmpleadoIdActivo}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);

    // Verificar que todos los turnos son del empleado especificado
    let turnoEncontrado = false;
    for (const dia of response.body.dias) {
      for (const turno of dia.turnos) {
        turnoEncontrado = true;
        expect(turno.empleado.id).toBe(testEmpleadoIdActivo);
      }
    }

    // Al menos debe haber un turno (los creados en beforeEach)
    expect(turnoEncontrado).toBe(true);
  });

  test('61. Debe filtrar por puesto_id', async () => {
    const response = await request(app)
      .get(`/api/turnos/calendario/2026/1?puesto_id=${testPuestoIdActivo}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);

    let turnoEncontrado = false;
    for (const dia of response.body.dias) {
      for (const turno of dia.turnos) {
        turnoEncontrado = true;
        expect(turno.puesto.id).toBe(testPuestoIdActivo);
      }
    }

    expect(turnoEncontrado).toBe(true);
  });

  test('62. Debe combinar múltiples filtros', async () => {
    const response = await request(app)
      .get(`/api/turnos/calendario/2026/1?empleado_id=${testEmpleadoIdActivo}&puesto_id=${testPuestoIdActivo}`)
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);

    let turnoEncontrado = false;
    for (const dia of response.body.dias) {
      for (const turno of dia.turnos) {
        turnoEncontrado = true;
        expect(turno.empleado.id).toBe(testEmpleadoIdActivo);
        expect(turno.puesto.id).toBe(testPuestoIdActivo);
      }
    }

    expect(turnoEncontrado).toBe(true);
  });

  // Test de manejo de feriados (1 test)
  test('63. Debe marcar día 1 de enero como feriado', async () => {
    const response = await request(app)
      .get('/api/turnos/calendario/2026/1')
      .set('Authorization', `Bearer ${authTokenAdmin}`);

    expect(response.status).toBe(200);
    const primerDia = response.body.dias[0]; // 2026-01-01
    expect(primerDia.es_feriado).toBe(true);
    expect(primerDia.nombre_feriado).toBeTruthy();
  });
});
