/**
 * Tests de Integración: Servicios por Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar endpoints de asignación semanal
 * de empleados a puestos de seguridad.
 *
 * @group integration
 * @group servicios-puesto
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
let testServicioPuestoId: number;

let adminUserId: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_sp', password: 'AdminSP123!', email: 'admin_sp@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_supervisor_sp', password: 'SuperSP123!', email: 'supervisor_sp@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_consulta_sp', password: 'ConsultaSP123!', email: 'consulta_sp@test.com', rol: 'CONSULTA' },
};

beforeAll(async () => {
  await createTestUsers();
  adminToken = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  supervisorToken = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);
  consultaToken = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId = await createTestPuesto(testUbicacionId, 'P-SP-01');
  testPuesto2Id = await createTestPuesto(testUbicacionId, 'P-SP-02');
  testEmpleadoId = await createTestEmpleado();
  testServicioPuestoId = await createTestServicioPuesto();
});

afterAll(async () => {
  await cleanupTestData();
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

async function createTestUsers(): Promise<void> {
  const usernames = [TEST_USERS.admin.username, TEST_USERS.supervisor.username, TEST_USERS.consulta.username];
  const ph = usernames.map(() => '?').join(',');

  // Limpiar previos usando subquery
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
      [user.username, hash, user.email, `Test ${user.rol} SP`, user.rol]
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
    ['CLI-TSP', 'Cliente Test SP']
  );
  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo) VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-TSP', 'Ubicación Test SP']
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
  const cedula = `TSP-${Date.now()}`;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO rh_empleado (cedula_empleado, nombres, apellidos, fecha_ingreso, id_puesto, status)
     VALUES (?, ?, ?, CURDATE(), 97, 1)`,
    [cedula, 'Empleado', 'Test SP']
  );
  return result.insertId;
}

async function createTestServicioPuesto(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_servicios_puesto (puesto_id, tipo_turno, lunes_empleado_id, activo, created_by)
     VALUES (?, 'DIURNO', ?, true, ?)`,
    [testPuestoId, testEmpleadoId, adminUserId]
  );
  return result.insertId;
}

async function cleanupTestData(): Promise<void> {
  await db.query('DELETE FROM ot_servicios_puesto WHERE puesto_id IN (?, ?)', [testPuestoId, testPuesto2Id]);
  await db.query('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-SP-%']);
  await db.query('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TSP%']);
  await db.query('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TSP%']);
  await db.query('DELETE FROM rh_empleado WHERE cedula_empleado LIKE ?', ['TSP-%']);

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
// GET /api/servicios-puesto - Listar
// ============================================================================

describe('GET /api/servicios-puesto - Listar', () => {
  test('1. Debe listar servicios con paginación (200)', async () => {
    const response = await request(app)
      .get('/api/servicios-puesto')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('2. Debe filtrar por puesto_id (200)', async () => {
    const response = await request(app)
      .get(`/api/servicios-puesto?puesto_id=${testPuestoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    response.body.data.forEach((sp: any) => {
      expect(sp.puesto_id).toBe(testPuestoId);
    });
  });

  test('3. Debe filtrar por tipo_turno (200)', async () => {
    const response = await request(app)
      .get('/api/servicios-puesto?tipo_turno=DIURNO')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    if (response.body.data.length > 0) {
      response.body.data.forEach((sp: any) => {
        expect(sp.tipo_turno).toBe('DIURNO');
      });
    }
  });

  test('4. Debe buscar por search (200)', async () => {
    const response = await request(app)
      .get('/api/servicios-puesto?search=P-SP')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('5. Debe retornar 401 sin token', async () => {
    const response = await request(app).get('/api/servicios-puesto');
    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GET /api/servicios-puesto/:id - Obtener por ID
// ============================================================================

describe('GET /api/servicios-puesto/:id - Obtener por ID', () => {
  test('6. Debe obtener servicio por ID con relaciones (200)', async () => {
    const response = await request(app)
      .get(`/api/servicios-puesto/${testServicioPuestoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testServicioPuestoId);
    expect(response.body).toHaveProperty('puesto_id', testPuestoId);
    expect(response.body).toHaveProperty('tipo_turno', 'DIURNO');
  });

  test('7. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .get('/api/servicios-puesto/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// POST /api/servicios-puesto - Crear
// ============================================================================

describe('POST /api/servicios-puesto - Crear', () => {
  afterEach(async () => {
    await db.query('DELETE FROM ot_servicios_puesto WHERE puesto_id = ? AND tipo_turno = ?', [testPuesto2Id, 'DIURNO']);
    await db.query('DELETE FROM ot_servicios_puesto WHERE puesto_id = ? AND tipo_turno = ?', [testPuesto2Id, 'NOCTURNO']);
  });

  test('8. Debe crear servicio válido (201)', async () => {
    const response = await request(app)
      .post('/api/servicios-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: testPuesto2Id,
        tipo_turno: 'NOCTURNO',
        lunes_empleado_id: testEmpleadoId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.puesto_id).toBe(testPuesto2Id);
    expect(response.body.tipo_turno).toBe('NOCTURNO');
  });

  test('9. Debe retornar 400 para combinación duplicada puesto+turno', async () => {
    // Crear primero
    await request(app)
      .post('/api/servicios-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ puesto_id: testPuesto2Id, tipo_turno: 'DIURNO' });

    // Intentar duplicado
    const response = await request(app)
      .post('/api/servicios-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ puesto_id: testPuesto2Id, tipo_turno: 'DIURNO' });

    expect(response.status).toBe(400);
  });

  test('10. Debe retornar 404 para puesto inexistente', async () => {
    const response = await request(app)
      .post('/api/servicios-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ puesto_id: 999999, tipo_turno: 'DIURNO' });

    expect(response.status).toBe(404);
  });

  test('11. Debe retornar 400 sin campos requeridos', async () => {
    const response = await request(app)
      .post('/api/servicios-puesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test('12. SUPERVISOR puede crear (201)', async () => {
    const response = await request(app)
      .post('/api/servicios-puesto')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ puesto_id: testPuesto2Id, tipo_turno: 'NOCTURNO' });

    expect(response.status).toBe(201);
  });

  test('13. CONSULTA no puede crear (403)', async () => {
    const response = await request(app)
      .post('/api/servicios-puesto')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({ puesto_id: testPuesto2Id, tipo_turno: 'NOCTURNO' });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// PUT /api/servicios-puesto/:id - Actualizar
// ============================================================================

describe('PUT /api/servicios-puesto/:id - Actualizar', () => {
  test('14. Debe actualizar campos opcionales (200)', async () => {
    const response = await request(app)
      .put(`/api/servicios-puesto/${testServicioPuestoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        martes_empleado_id: testEmpleadoId,
        cobrada: true,
      });

    expect(response.status).toBe(200);
  });

  test('15. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .put('/api/servicios-puesto/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cobrada: true });

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// DELETE /api/servicios-puesto/:id - Eliminar (soft delete)
// ============================================================================

describe('DELETE /api/servicios-puesto/:id - Soft delete', () => {
  let tempServicioId: number;

  beforeEach(async () => {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_servicios_puesto (puesto_id, tipo_turno, activo, created_by)
       VALUES (?, 'NOCTURNO', true, ?)`,
      [testPuesto2Id, adminUserId]
    );
    tempServicioId = result.insertId;
  });

  afterEach(async () => {
    await db.query('DELETE FROM ot_servicios_puesto WHERE id = ?', [tempServicioId]);
  });

  test('16. ADMIN puede eliminar (200, soft delete)', async () => {
    const response = await request(app)
      .delete(`/api/servicios-puesto/${tempServicioId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    // Verificar soft delete
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT activo FROM ot_servicios_puesto WHERE id = ?', [tempServicioId]
    );
    expect(rows[0].activo).toBe(0);
  });

  test('17. SUPERVISOR no puede eliminar (403)', async () => {
    const response = await request(app)
      .delete(`/api/servicios-puesto/${tempServicioId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403);
  });

  test('18. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .delete('/api/servicios-puesto/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
