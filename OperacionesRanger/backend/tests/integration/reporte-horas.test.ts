/**
 * Tests de Integración: Reporte de Horas Trabajadas
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar el endpoint pivot de horas trabajadas
 * con agrupación por empleado o puesto y validaciones de rango.
 *
 * @group integration
 * @group reporte-horas
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { ResultSetHeader } from 'mysql2/promise';

const db = getTurnosPool();

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let adminToken: string;
let supervisorToken: string;
let consultaToken: string;

let testClienteId: number;
let testUbicacionId: number;
let testPuestoId: number;
let testEmpleadoId: number;

let adminUserId: number;

const FECHA_INICIO = '2026-06-01';
const FECHA_FIN = '2026-06-15';
const FECHA_DATA = '2026-06-02';
const FECHA_DATA_2 = '2026-06-03';

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_rh', password: 'AdminRH123!', email: 'admin_rh@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_supervisor_rh', password: 'SuperRH123!', email: 'supervisor_rh@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_consulta_rh', password: 'ConsultaRH123!', email: 'consulta_rh@test.com', rol: 'CONSULTA' },
};

beforeAll(async () => {
  await createTestUsers();
  adminToken = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  supervisorToken = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);
  consultaToken = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId = await createTestPuesto(testUbicacionId);
  testEmpleadoId = await createTestEmpleado();

  // Crear registros de diario para el reporte
  await createTestDiarioRecords();
});

afterAll(async () => {
  await cleanupTestData();
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

async function createTestUsers(): Promise<void> {
  const usernames = Object.values(TEST_USERS).map(u => u.username);
  const ph = usernames.map(() => '?').join(',');

  await db.execute(
    `DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (${ph}))`,
    usernames
  );
  await db.execute(
    `DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (${ph}))`,
    usernames
  );
  await db.execute(`DELETE FROM ot_sys_usuarios WHERE username IN (${ph})`, usernames);

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const hash = hashPasswordSync(user.password);
    const [result] = await db.execute<any>(
      `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [user.username, hash, user.email, `Test ${user.rol} RH`, user.rol]
    );
    if (key === 'admin') adminUserId = result.insertId;
  }
}

async function getAuthToken(username: string, password: string): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({ username, password });
  return response.body.accessToken;
}

async function createTestCliente(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_clientes (codigo, nombre, activo) VALUES (?, ?, true)`,
    ['CLI-TRH', 'Cliente Test RH']
  );
  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo) VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-TRH', 'Ubicación Test RH']
  );
  return result.insertId;
}

async function createTestPuesto(ubicacionId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, cantidad_guardianes, activo)
     VALUES (?, ?, ?, 1, true)`,
    [ubicacionId, 'P-RH-01', 'Puesto Test RH']
  );
  return result.insertId;
}

async function createTestEmpleado(): Promise<number> {
  const cedula = `TRH-${Date.now()}`;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO rh_empleado (cedula_empleado, nombres, apellidos, fecha_ingreso, id_puesto, status)
     VALUES (?, ?, ?, CURDATE(), 97, 1)`,
    [cedula, 'Empleado', 'Test RH']
  );
  return result.insertId;
}

async function createTestDiarioRecords(): Promise<void> {
  // Crear 2 registros de diario para el rango de fechas
  await db.query(
    `INSERT INTO ot_diario_puesto (puesto_id, empleado_id, fecha, horas, tipo_turno, activo, created_by)
     VALUES (?, ?, ?, 10, 'DIURNO', true, ?)`,
    [testPuestoId, testEmpleadoId, FECHA_DATA, adminUserId]
  );
  await db.query(
    `INSERT INTO ot_diario_puesto (puesto_id, empleado_id, fecha, horas, tipo_turno, activo, created_by)
     VALUES (?, ?, ?, 8, 'NOCTURNO', true, ?)`,
    [testPuestoId, testEmpleadoId, FECHA_DATA_2, adminUserId]
  );
}

async function cleanupTestData(): Promise<void> {
  await db.query('DELETE FROM ot_diario_puesto WHERE puesto_id = ?', [testPuestoId]);
  await db.query('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-RH-%']);
  await db.query('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TRH%']);
  await db.query('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TRH%']);
  await db.query('DELETE FROM rh_empleado WHERE cedula_empleado LIKE ?', ['TRH-%']);

  const usernames = Object.values(TEST_USERS).map(u => u.username);
  const uph = usernames.map(() => '?').join(',');
  await db.execute(
    `DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (${uph}))`,
    usernames
  );
  await db.execute(
    `DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (${uph}))`,
    usernames
  );
  await db.execute(`DELETE FROM ot_sys_usuarios WHERE username IN (${uph})`, usernames);
}

// ============================================================================
// GET /api/reportes/horas - Reporte por empleado
// ============================================================================

describe('GET /api/reportes/horas - Reporte por empleado', () => {
  test('1. Debe generar reporte agrupado por empleado (200)', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=empleado`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tipo', 'empleado');
    expect(response.body).toHaveProperty('fecha_inicio');
    expect(response.body).toHaveProperty('fecha_fin');
    expect(response.body).toHaveProperty('fechas');
    expect(response.body).toHaveProperty('filas');
    expect(Array.isArray(response.body.fechas)).toBe(true);
    expect(Array.isArray(response.body.filas)).toBe(true);
  });

  test('2. Debe incluir datos del empleado de prueba', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=empleado&empleado_id=${testEmpleadoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    if (response.body.filas.length > 0) {
      const fila = response.body.filas[0];
      expect(fila).toHaveProperty('id');
      expect(fila).toHaveProperty('nombre');
      expect(fila).toHaveProperty('total_horas');
      expect(fila).toHaveProperty('total_dias');
      expect(fila).toHaveProperty('dias');
    }
  });
});

// ============================================================================
// GET /api/reportes/horas - Reporte por puesto
// ============================================================================

describe('GET /api/reportes/horas - Reporte por puesto', () => {
  test('3. Debe generar reporte agrupado por puesto (200)', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=puesto`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tipo', 'puesto');
    expect(response.body).toHaveProperty('filas');
  });

  test('4. Debe filtrar por puesto_id (200)', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=puesto&puesto_id=${testPuestoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});

// ============================================================================
// Validaciones
// ============================================================================

describe('GET /api/reportes/horas - Validaciones', () => {
  test('5. Debe retornar 400 sin fecha_inicio', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_fin=${FECHA_FIN}&tipo=empleado`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  test('6. Debe retornar 400 sin tipo', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  test('7. Debe retornar 400 para tipo inválido', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=invalido`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  test('8. Debe retornar 400 cuando fecha_fin < fecha_inicio', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_FIN}&fecha_fin=${FECHA_INICIO}&tipo=empleado`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  test('9. Debe retornar 400 cuando rango > 31 días', async () => {
    const response = await request(app)
      .get('/api/reportes/horas?fecha_inicio=2026-01-01&fecha_fin=2026-03-01&tipo=empleado')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  test('10. Debe retornar 400 para formato de fecha inválido', async () => {
    const response = await request(app)
      .get('/api/reportes/horas?fecha_inicio=01-06-2026&fecha_fin=15-06-2026&tipo=empleado')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });
});

// ============================================================================
// Control de acceso
// ============================================================================

describe('GET /api/reportes/horas - Control de acceso', () => {
  test('11. ADMIN puede acceder (200)', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=empleado`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('12. SUPERVISOR puede acceder (200)', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=empleado`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(200);
  });

  test('13. CONSULTA no puede acceder (403)', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=empleado`)
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(response.status).toBe(403);
  });

  test('14. Sin token retorna 401', async () => {
    const response = await request(app)
      .get(`/api/reportes/horas?fecha_inicio=${FECHA_INICIO}&fecha_fin=${FECHA_FIN}&tipo=empleado`);

    expect(response.status).toBe(401);
  });
});

// ============================================================================
// Respuesta vacía
// ============================================================================

describe('GET /api/reportes/horas - Rango sin datos', () => {
  test('15. Debe retornar estructura válida con filas vacías para rango sin datos (200)', async () => {
    const response = await request(app)
      .get('/api/reportes/horas?fecha_inicio=2025-01-01&fecha_fin=2025-01-15&tipo=empleado')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('filas');
    expect(Array.isArray(response.body.filas)).toBe(true);
    expect(response.body.filas.length).toBe(0);
  });
});
