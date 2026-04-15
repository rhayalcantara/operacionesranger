/**
 * Tests de Integración: Diario de Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar endpoints de registro diario de asistencia
 * incluyendo el endpoint especial de poblar desde plantilla.
 *
 * @group integration
 * @group diario-puesto
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

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
let testPuesto2Id: number;
let testEmpleadoId: number;
let testEmpleado2Id: number;
let testServicioPuestoId: number;
let testPlantillaId: number;
let testDiarioId: number;

let adminUserId: number;

const TEST_DATE = '2026-06-15'; // Lunes
const TEST_DATE_2 = '2026-06-16'; // Martes

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_dp', password: 'AdminDP123!', email: 'admin_dp@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_supervisor_dp', password: 'SuperDP123!', email: 'supervisor_dp@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_consulta_dp', password: 'ConsultaDP123!', email: 'consulta_dp@test.com', rol: 'CONSULTA' },
};

beforeAll(async () => {
  await createTestUsers();
  adminToken = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  supervisorToken = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);
  consultaToken = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

  // Estructura de datos
  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId = await createTestPuesto(testUbicacionId, 'P-DP-01');
  testPuesto2Id = await createTestPuesto(testUbicacionId, 'P-DP-02');
  testEmpleadoId = await createTestEmpleado('DP1');
  testEmpleado2Id = await createTestEmpleado('DP2');

  // Servicio puesto con empleado asignado al lunes
  testServicioPuestoId = await createTestServicioPuesto();

  // Plantilla con detalle
  testPlantillaId = await createTestPlantilla();

  // Registro diario existente
  testDiarioId = await createTestDiario();
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
      [user.username, hash, user.email, `Test ${user.rol} DP`, user.rol]
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
    ['CLI-TDP', 'Cliente Test DP']
  );
  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo) VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-TDP', 'Ubicación Test DP']
  );
  return result.insertId;
}

async function createTestPuesto(ubicacionId: number, codigo: string): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, cantidad_guardianes, activo)
     VALUES (?, ?, ?, 1, true)`,
    [ubicacionId, codigo, `Puesto ${codigo}`]
  );
  return result.insertId;
}

async function createTestEmpleado(suffix: string): Promise<number> {
  const cedula = `TDP-${suffix}-${Date.now()}`;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO rh_empleado (cedula_empleado, nombres, apellidos, fecha_ingreso, id_puesto, status)
     VALUES (?, ?, ?, CURDATE(), 97, 1)`,
    [cedula, `Empleado${suffix}`, 'Test DP']
  );
  return result.insertId;
}

async function createTestServicioPuesto(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_servicios_puesto (puesto_id, tipo_turno, lunes_empleado_id, martes_empleado_id, activo, created_by)
     VALUES (?, 'DIURNO', ?, ?, true, ?)`,
    [testPuestoId, testEmpleadoId, testEmpleado2Id, adminUserId]
  );
  return result.insertId;
}

async function createTestPlantilla(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_plantillas_servicio (nombre, activo, created_by) VALUES (?, true, ?)`,
    ['Plantilla Test DP', adminUserId]
  );
  const id = result.insertId;
  await db.query(
    `INSERT INTO ot_plantillas_servicio_detalle (plantilla_id, puesto_id, servicio_puesto_id)
     VALUES (?, ?, ?)`,
    [id, testPuestoId, testServicioPuestoId]
  );
  return id;
}

async function createTestDiario(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_diario_puesto (puesto_id, empleado_id, fecha, horas, tipo_turno, servicio_puesto_id, activo, created_by)
     VALUES (?, ?, ?, 8, 'DIURNO', ?, true, ?)`,
    [testPuestoId, testEmpleadoId, TEST_DATE, testServicioPuestoId, adminUserId]
  );
  return result.insertId;
}

async function cleanupTestData(): Promise<void> {
  await db.query('DELETE FROM ot_diario_puesto WHERE puesto_id IN (?, ?)', [testPuestoId, testPuesto2Id]);
  await db.query('DELETE FROM ot_plantillas_servicio_detalle WHERE plantilla_id IN (SELECT id FROM ot_plantillas_servicio WHERE nombre LIKE ?)', ['%DP%']);
  await db.query('DELETE FROM ot_plantillas_servicio WHERE nombre LIKE ?', ['%DP%']);
  await db.query('DELETE FROM ot_servicios_puesto WHERE puesto_id IN (?, ?)', [testPuestoId, testPuesto2Id]);
  await db.query('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-DP-%']);
  await db.query('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TDP%']);
  await db.query('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TDP%']);
  await db.query('DELETE FROM rh_empleado WHERE cedula_empleado LIKE ?', ['TDP-%']);

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
// GET /api/diario-puesto - Listar
// ============================================================================

describe('GET /api/diario-puesto - Listar', () => {
  test('1. Debe listar registros con paginación (200)', async () => {
    const response = await request(app)
      .get('/api/diario-puesto')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('2. Debe filtrar por fecha (200)', async () => {
    const response = await request(app)
      .get(`/api/diario-puesto?fecha=${TEST_DATE}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    if (response.body.data.length > 0) {
      response.body.data.forEach((d: any) => {
        expect(d.fecha).toContain(TEST_DATE);
      });
    }
  });

  test('3. Debe filtrar por puesto_id (200)', async () => {
    const response = await request(app)
      .get(`/api/diario-puesto?puesto_id=${testPuestoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    response.body.data.forEach((d: any) => {
      expect(d.puesto_id).toBe(testPuestoId);
    });
  });

  test('4. Debe filtrar por empleado_id (200)', async () => {
    const response = await request(app)
      .get(`/api/diario-puesto?empleado_id=${testEmpleadoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('5. Debe filtrar por tipo_turno (200)', async () => {
    const response = await request(app)
      .get('/api/diario-puesto?tipo_turno=DIURNO')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('6. Debe retornar 401 sin token', async () => {
    const response = await request(app).get('/api/diario-puesto');
    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GET /api/diario-puesto/:id - Obtener por ID
// ============================================================================

describe('GET /api/diario-puesto/:id - Obtener por ID', () => {
  test('7. Debe obtener registro con relaciones (200)', async () => {
    const response = await request(app)
      .get(`/api/diario-puesto/${testDiarioId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testDiarioId);
    expect(response.body).toHaveProperty('puesto_id', testPuestoId);
    expect(response.body).toHaveProperty('empleado_id', testEmpleadoId);
  });

  test('8. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .get('/api/diario-puesto/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// POST /api/diario-puesto - Crear
// ============================================================================

describe('POST /api/diario-puesto - Crear', () => {
  afterEach(async () => {
    // Limpiar registros creados en tests (no el testDiarioId)
    await db.query(
      'DELETE FROM ot_diario_puesto WHERE puesto_id = ? AND fecha = ?',
      [testPuesto2Id, TEST_DATE]
    );
    await db.query(
      'DELETE FROM ot_diario_puesto WHERE puesto_id = ? AND empleado_id = ? AND fecha = ?',
      [testPuestoId, testEmpleado2Id, TEST_DATE_2]
    );
  });

  test('9. Debe crear registro válido (201)', async () => {
    const response = await request(app)
      .post('/api/diario-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: testPuesto2Id,
        empleado_id: testEmpleadoId,
        fecha: TEST_DATE,
        horas: 10,
        tipo_turno: 'DIURNO',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('10. Debe retornar 400 sin campos requeridos', async () => {
    const response = await request(app)
      .post('/api/diario-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test('11. Debe retornar 400 para horas > 24', async () => {
    const response = await request(app)
      .post('/api/diario-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: testPuesto2Id,
        empleado_id: testEmpleadoId,
        fecha: TEST_DATE,
        horas: 25,
        tipo_turno: 'DIURNO',
      });

    expect(response.status).toBe(400);
  });

  test('12. CONSULTA no puede crear (403)', async () => {
    const response = await request(app)
      .post('/api/diario-puesto')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        puesto_id: testPuesto2Id,
        empleado_id: testEmpleadoId,
        fecha: TEST_DATE,
        horas: 8,
        tipo_turno: 'DIURNO',
      });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// POST /api/diario-puesto/poblar-plantilla - Poblar desde plantilla
// ============================================================================

describe('POST /api/diario-puesto/poblar-plantilla - Poblar desde plantilla', () => {
  afterEach(async () => {
    // Limpiar registros creados por poblar-plantilla
    await db.query(
      'DELETE FROM ot_diario_puesto WHERE puesto_id = ? AND fecha = ?',
      [testPuestoId, TEST_DATE_2]
    );
  });

  test('13. Debe poblar desde plantilla válida (200)', async () => {
    // TEST_DATE_2 es martes (día 2), testServicioPuestoId tiene martes_empleado_id = testEmpleado2Id
    const response = await request(app)
      .post('/api/diario-puesto/poblar-plantilla')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plantilla_id: testPlantillaId,
        fecha: TEST_DATE_2,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('insertados');
    expect(response.body).toHaveProperty('omitidos');
    expect(response.body).toHaveProperty('detalles');
    expect(Array.isArray(response.body.detalles)).toBe(true);
  });

  test('14. Debe retornar 404 para plantilla inexistente', async () => {
    const response = await request(app)
      .post('/api/diario-puesto/poblar-plantilla')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ plantilla_id: 999999, fecha: TEST_DATE });

    expect(response.status).toBe(404);
  });

  test('15. Debe retornar 400 sin campos requeridos', async () => {
    const response = await request(app)
      .post('/api/diario-puesto/poblar-plantilla')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test('16. CONSULTA no puede poblar (403)', async () => {
    const response = await request(app)
      .post('/api/diario-puesto/poblar-plantilla')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({ plantilla_id: testPlantillaId, fecha: TEST_DATE });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// PUT /api/diario-puesto/:id - Actualizar
// ============================================================================

describe('PUT /api/diario-puesto/:id - Actualizar', () => {
  test('17. Debe actualizar horas (200)', async () => {
    const response = await request(app)
      .put(`/api/diario-puesto/${testDiarioId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ horas: 12 });

    expect(response.status).toBe(200);
  });

  test('18. Debe actualizar tipo_turno (200)', async () => {
    const response = await request(app)
      .put(`/api/diario-puesto/${testDiarioId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo_turno: 'NOCTURNO' });

    expect(response.status).toBe(200);
  });

  test('19. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .put('/api/diario-puesto/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ horas: 10 });

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// DELETE /api/diario-puesto/:id - Soft delete
// ============================================================================

describe('DELETE /api/diario-puesto/:id - Soft delete', () => {
  let tempDiarioId: number;

  beforeEach(async () => {
    const fecha = '2026-07-01';
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_diario_puesto (puesto_id, empleado_id, fecha, horas, tipo_turno, activo, created_by)
       VALUES (?, ?, ?, 8, 'DIURNO', true, ?)`,
      [testPuesto2Id, testEmpleadoId, fecha, adminUserId]
    );
    tempDiarioId = result.insertId;
  });

  afterEach(async () => {
    await db.query('DELETE FROM ot_diario_puesto WHERE id = ?', [tempDiarioId]);
  });

  test('20. ADMIN puede eliminar (200, soft delete)', async () => {
    const response = await request(app)
      .delete(`/api/diario-puesto/${tempDiarioId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT activo FROM ot_diario_puesto WHERE id = ?', [tempDiarioId]
    );
    expect(rows[0].activo).toBe(0);
  });

  test('21. SUPERVISOR no puede eliminar (403)', async () => {
    const response = await request(app)
      .delete(`/api/diario-puesto/${tempDiarioId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403);
  });

  test('22. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .delete('/api/diario-puesto/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
