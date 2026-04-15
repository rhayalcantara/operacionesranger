/**
 * Tests de Integración: Cronogramas
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar endpoints de cronogramas semanales
 * incluyendo la validación de día libre por empleado.
 *
 * @group integration
 * @group cronogramas
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
// testPuesto2Id reserved for future multi-puesto tests
let testEmpleadoId: number;
let testCronogramaId: number;

let adminUserId: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_crn', password: 'AdminCRN123!', email: 'admin_crn@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_supervisor_crn', password: 'SuperCRN123!', email: 'supervisor_crn@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_consulta_crn', password: 'ConsultaCRN123!', email: 'consulta_crn@test.com', rol: 'CONSULTA' },
};

beforeAll(async () => {
  await createTestUsers();
  adminToken = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  supervisorToken = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);
  consultaToken = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId = await createTestPuesto(testUbicacionId, 'P-CRN-01');
  await createTestPuesto(testUbicacionId, 'P-CRN-02');
  testEmpleadoId = await createTestEmpleado();

  testCronogramaId = await createTestCronograma();
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
      [user.username, hash, user.email, `Test ${user.rol} CRN`, user.rol]
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
    ['CLI-TCRN', 'Cliente Test CRN']
  );
  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo) VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-TCRN', 'Ubicación Test CRN']
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

async function createTestEmpleado(): Promise<number> {
  const cedula = `TCRN-${Date.now()}`;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO rh_empleado (cedula_empleado, nombres, apellidos, fecha_ingreso, id_puesto, status)
     VALUES (?, ?, ?, CURDATE(), 97, 1)`,
    [cedula, 'Empleado', 'Test CRN']
  );
  return result.insertId;
}

async function createTestCronograma(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_cronogramas (nombre, descripcion, activo, created_by)
     VALUES (?, ?, true, ?)`,
    ['Cronograma Test CRN', 'Cronograma para testing', adminUserId]
  );
  const id = result.insertId;

  // Asignar empleado 6 días (Lunes a Sábado), dejando Domingo libre
  for (let dia = 1; dia <= 6; dia++) {
    await db.query(
      `INSERT INTO ot_cronogramas_detalle (cronograma_id, dia_semana, puesto_id, empleado_id, tipo_turno)
       VALUES (?, ?, ?, ?, 'DIURNO')`,
      [id, dia, testPuestoId, testEmpleadoId]
    );
  }

  return id;
}

async function cleanupTestData(): Promise<void> {
  await db.query('DELETE FROM ot_cronogramas_detalle WHERE cronograma_id IN (SELECT id FROM ot_cronogramas WHERE nombre LIKE ?)', ['%CRN%']);
  await db.query('DELETE FROM ot_cronogramas WHERE nombre LIKE ?', ['%CRN%']);
  await db.query('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-CRN-%']);
  await db.query('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TCRN%']);
  await db.query('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TCRN%']);
  await db.query('DELETE FROM rh_empleado WHERE cedula_empleado LIKE ?', ['TCRN-%']);

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
// GET /api/cronogramas - Listar
// ============================================================================

describe('GET /api/cronogramas - Listar', () => {
  test('1. Debe listar cronogramas con paginación (200)', async () => {
    const response = await request(app)
      .get('/api/cronogramas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('2. Debe buscar por nombre (200)', async () => {
    const response = await request(app)
      .get('/api/cronogramas?search=CRN')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('3. Debe filtrar por activo (200)', async () => {
    const response = await request(app)
      .get('/api/cronogramas?activo=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('4. Debe retornar 401 sin token', async () => {
    const response = await request(app).get('/api/cronogramas');
    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GET /api/cronogramas/:id - Obtener con detalles
// ============================================================================

describe('GET /api/cronogramas/:id - Obtener con detalles', () => {
  test('5. Debe obtener cronograma con detalles (200)', async () => {
    const response = await request(app)
      .get(`/api/cronogramas/${testCronogramaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testCronogramaId);
    expect(response.body).toHaveProperty('nombre');
    expect(response.body).toHaveProperty('detalles');
    expect(Array.isArray(response.body.detalles)).toBe(true);
    expect(response.body.detalles.length).toBe(6); // 6 días asignados
  });

  test('6. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .get('/api/cronogramas/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// POST /api/cronogramas - Crear
// ============================================================================

describe('POST /api/cronogramas - Crear', () => {
  const createdIds: number[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      await db.query('DELETE FROM ot_cronogramas_detalle WHERE cronograma_id = ?', [id]);
      await db.query('DELETE FROM ot_cronogramas WHERE id = ?', [id]);
    }
  });

  test('7. Debe crear cronograma con detalles válidos (201)', async () => {
    // Empleado asignado 5 días (tiene 2 días libres → válido)
    const detalles = [];
    for (let dia = 1; dia <= 5; dia++) {
      detalles.push({
        dia_semana: dia,
        puesto_id: testPuestoId,
        empleado_id: testEmpleadoId,
        tipo_turno: 'DIURNO',
      });
    }

    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Cronograma Nuevo CRN',
        descripcion: 'Test creación',
        detalles,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    createdIds.push(response.body.id);
  });

  test('8. Debe crear cronograma con máximo 6 días por empleado (201)', async () => {
    // 6 días es el máximo (1 día libre)
    const detalles = [];
    for (let dia = 0; dia <= 5; dia++) {
      detalles.push({
        dia_semana: dia,
        puesto_id: testPuestoId,
        empleado_id: testEmpleadoId,
        tipo_turno: 'NOCTURNO',
      });
    }

    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Cronograma 6 Días CRN',
        detalles,
      });

    expect(response.status).toBe(201);
    createdIds.push(response.body.id);
  });

  test('9. Debe rechazar cronograma con 7 días (sin día libre) (400)', async () => {
    // 7 días - empleado sin día libre
    const detalles = [];
    for (let dia = 0; dia <= 6; dia++) {
      detalles.push({
        dia_semana: dia,
        puesto_id: testPuestoId,
        empleado_id: testEmpleadoId,
        tipo_turno: 'DIURNO',
      });
    }

    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Cronograma Sin Libre CRN',
        detalles,
      });

    expect(response.status).toBe(400);
  });

  test('10. Debe retornar 400 sin nombre', async () => {
    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        detalles: [{ dia_semana: 1, puesto_id: testPuestoId, empleado_id: testEmpleadoId, tipo_turno: 'DIURNO' }],
      });

    expect(response.status).toBe(400);
  });

  test('11. Debe retornar 400 sin detalles', async () => {
    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Cronograma Vacío CRN', detalles: [] });

    expect(response.status).toBe(400);
  });

  test('12. Debe retornar 400 para dia_semana inválido', async () => {
    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Cronograma Dia Inválido CRN',
        detalles: [{ dia_semana: 7, puesto_id: testPuestoId, empleado_id: testEmpleadoId, tipo_turno: 'DIURNO' }],
      });

    expect(response.status).toBe(400);
  });

  test('13. SUPERVISOR puede crear (201)', async () => {
    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        nombre: 'Cronograma Supervisor CRN',
        detalles: [
          { dia_semana: 1, puesto_id: testPuestoId, empleado_id: testEmpleadoId, tipo_turno: 'DIURNO' },
        ],
      });

    expect(response.status).toBe(201);
    createdIds.push(response.body.id);
  });

  test('14. CONSULTA no puede crear (403)', async () => {
    const response = await request(app)
      .post('/api/cronogramas')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        nombre: 'Cronograma Consulta CRN',
        detalles: [
          { dia_semana: 1, puesto_id: testPuestoId, empleado_id: testEmpleadoId, tipo_turno: 'DIURNO' },
        ],
      });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// PUT /api/cronogramas/:id - Actualizar
// ============================================================================

describe('PUT /api/cronogramas/:id - Actualizar', () => {
  test('15. Debe actualizar nombre (200)', async () => {
    const response = await request(app)
      .put(`/api/cronogramas/${testCronogramaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Cronograma Actualizado CRN' });

    expect(response.status).toBe(200);
  });

  test('16. Debe actualizar detalles con reemplazo (200)', async () => {
    const response = await request(app)
      .put(`/api/cronogramas/${testCronogramaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        detalles: [
          { dia_semana: 1, puesto_id: testPuestoId, empleado_id: testEmpleadoId, tipo_turno: 'DIURNO' },
          { dia_semana: 2, puesto_id: testPuestoId, empleado_id: testEmpleadoId, tipo_turno: 'DIURNO' },
          { dia_semana: 3, puesto_id: testPuestoId, empleado_id: testEmpleadoId, tipo_turno: 'DIURNO' },
        ],
      });

    expect(response.status).toBe(200);

    // Verificar detalles actualizados
    const getResp = await request(app)
      .get(`/api/cronogramas/${testCronogramaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getResp.body.detalles.length).toBe(3);
  });

  test('17. Debe rechazar actualización sin día libre (400)', async () => {
    const detalles = [];
    for (let dia = 0; dia <= 6; dia++) {
      detalles.push({
        dia_semana: dia,
        puesto_id: testPuestoId,
        empleado_id: testEmpleadoId,
        tipo_turno: 'DIURNO',
      });
    }

    const response = await request(app)
      .put(`/api/cronogramas/${testCronogramaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ detalles });

    expect(response.status).toBe(400);
  });

  test('18. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .put('/api/cronogramas/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'No Existe CRN' });

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// DELETE /api/cronogramas/:id - Soft delete
// ============================================================================

describe('DELETE /api/cronogramas/:id - Soft delete', () => {
  let tempCronogramaId: number;

  beforeEach(async () => {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_cronogramas (nombre, activo, created_by) VALUES (?, true, ?)`,
      ['Cronograma Temp CRN', adminUserId]
    );
    tempCronogramaId = result.insertId;
    await db.query(
      `INSERT INTO ot_cronogramas_detalle (cronograma_id, dia_semana, puesto_id, empleado_id, tipo_turno)
       VALUES (?, 1, ?, ?, 'DIURNO')`,
      [tempCronogramaId, testPuestoId, testEmpleadoId]
    );
  });

  afterEach(async () => {
    await db.query('DELETE FROM ot_cronogramas_detalle WHERE cronograma_id = ?', [tempCronogramaId]);
    await db.query('DELETE FROM ot_cronogramas WHERE id = ?', [tempCronogramaId]);
  });

  test('19. ADMIN puede eliminar (200, soft delete)', async () => {
    const response = await request(app)
      .delete(`/api/cronogramas/${tempCronogramaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT activo FROM ot_cronogramas WHERE id = ?', [tempCronogramaId]
    );
    expect(rows[0].activo).toBe(0);
  });

  test('20. SUPERVISOR no puede eliminar (403)', async () => {
    const response = await request(app)
      .delete(`/api/cronogramas/${tempCronogramaId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403);
  });

  test('21. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .delete('/api/cronogramas/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
