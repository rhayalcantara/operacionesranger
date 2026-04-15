/**
 * Tests de Integración: Plantillas de Servicio
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar endpoints de plantillas de servicio
 * con operaciones master-detail transaccionales.
 *
 * @group integration
 * @group plantillas-servicio
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
let testServicioPuestoId: number;
let testServicioPuesto2Id: number;
let testPlantillaId: number;

let adminUserId: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_plt', password: 'AdminPLT123!', email: 'admin_plt@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_supervisor_plt', password: 'SuperPLT123!', email: 'supervisor_plt@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_consulta_plt', password: 'ConsultaPLT123!', email: 'consulta_plt@test.com', rol: 'CONSULTA' },
};

beforeAll(async () => {
  await createTestUsers();
  adminToken = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  supervisorToken = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);
  consultaToken = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

  // Crear estructura: cliente -> ubicación -> puestos -> servicios_puesto
  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId = await createTestPuesto(testUbicacionId, 'P-PLT-01');
  testPuesto2Id = await createTestPuesto(testUbicacionId, 'P-PLT-02');
  testServicioPuestoId = await createTestServicioPuesto(testPuestoId, 'DIURNO');
  testServicioPuesto2Id = await createTestServicioPuesto(testPuesto2Id, 'NOCTURNO');

  // Crear plantilla de prueba
  testPlantillaId = await createTestPlantilla();
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
      [user.username, hash, user.email, `Test ${user.rol} PLT`, user.rol]
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
    ['CLI-TPLT', 'Cliente Test PLT']
  );
  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo) VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-TPLT', 'Ubicación Test PLT']
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

async function createTestServicioPuesto(puestoId: number, tipoTurno: string): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_servicios_puesto (puesto_id, tipo_turno, activo, created_by)
     VALUES (?, ?, true, ?)`,
    [puestoId, tipoTurno, adminUserId]
  );
  return result.insertId;
}

async function createTestPlantilla(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_plantillas_servicio (nombre, descripcion, activo, created_by)
     VALUES (?, ?, true, ?)`,
    ['Plantilla Test PLT', 'Plantilla para testing', adminUserId]
  );
  const plantillaId = result.insertId;

  // Insertar detalle
  await db.query(
    `INSERT INTO ot_plantillas_servicio_detalle (plantilla_id, puesto_id, servicio_puesto_id)
     VALUES (?, ?, ?)`,
    [plantillaId, testPuestoId, testServicioPuestoId]
  );

  return plantillaId;
}

async function cleanupTestData(): Promise<void> {
  // Orden inverso por FKs
  await db.query('DELETE FROM ot_plantillas_servicio_detalle WHERE plantilla_id IN (SELECT id FROM ot_plantillas_servicio WHERE nombre LIKE ?)', ['%PLT%']);
  await db.query('DELETE FROM ot_plantillas_servicio WHERE nombre LIKE ?', ['%PLT%']);
  await db.query('DELETE FROM ot_servicios_puesto WHERE puesto_id IN (?, ?)', [testPuestoId, testPuesto2Id]);
  await db.query('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-PLT-%']);
  await db.query('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TPLT%']);
  await db.query('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TPLT%']);

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
// GET /api/plantillas-servicio - Listar
// ============================================================================

describe('GET /api/plantillas-servicio - Listar', () => {
  test('1. Debe listar plantillas con paginación (200)', async () => {
    const response = await request(app)
      .get('/api/plantillas-servicio')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('2. Debe buscar por nombre (200)', async () => {
    const response = await request(app)
      .get('/api/plantillas-servicio?search=PLT')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('3. Debe filtrar por activo=true (200)', async () => {
    const response = await request(app)
      .get('/api/plantillas-servicio?activo=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('4. Debe retornar 401 sin token', async () => {
    const response = await request(app).get('/api/plantillas-servicio');
    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GET /api/plantillas-servicio/:id - Obtener con detalles
// ============================================================================

describe('GET /api/plantillas-servicio/:id - Obtener con detalles', () => {
  test('5. Debe obtener plantilla con detalles (200)', async () => {
    const response = await request(app)
      .get(`/api/plantillas-servicio/${testPlantillaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testPlantillaId);
    expect(response.body).toHaveProperty('nombre');
    expect(response.body).toHaveProperty('detalles');
    expect(Array.isArray(response.body.detalles)).toBe(true);
    expect(response.body.detalles.length).toBeGreaterThan(0);
  });

  test('6. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .get('/api/plantillas-servicio/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// POST /api/plantillas-servicio - Crear con detalles
// ============================================================================

describe('POST /api/plantillas-servicio - Crear', () => {
  const createdIds: number[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      await db.query('DELETE FROM ot_plantillas_servicio_detalle WHERE plantilla_id = ?', [id]);
      await db.query('DELETE FROM ot_plantillas_servicio WHERE id = ?', [id]);
    }
  });

  test('7. Debe crear plantilla con detalles (201)', async () => {
    const response = await request(app)
      .post('/api/plantillas-servicio')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Plantilla Nueva PLT',
        descripcion: 'Descripción test',
        detalles: [
          { puesto_id: testPuestoId, servicio_puesto_id: testServicioPuestoId },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    createdIds.push(response.body.id);
  });

  test('8. Debe retornar 400 sin nombre', async () => {
    const response = await request(app)
      .post('/api/plantillas-servicio')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        detalles: [{ puesto_id: testPuestoId, servicio_puesto_id: testServicioPuestoId }],
      });

    expect(response.status).toBe(400);
  });

  test('9. Debe retornar 400 sin detalles', async () => {
    const response = await request(app)
      .post('/api/plantillas-servicio')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Plantilla Sin Detalles PLT',
        detalles: [],
      });

    expect(response.status).toBe(400);
  });

  test('10. SUPERVISOR puede crear (201)', async () => {
    const response = await request(app)
      .post('/api/plantillas-servicio')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        nombre: 'Plantilla Supervisor PLT',
        detalles: [
          { puesto_id: testPuesto2Id, servicio_puesto_id: testServicioPuesto2Id },
        ],
      });

    expect(response.status).toBe(201);
    createdIds.push(response.body.id);
  });

  test('11. CONSULTA no puede crear (403)', async () => {
    const response = await request(app)
      .post('/api/plantillas-servicio')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        nombre: 'Plantilla Consulta PLT',
        detalles: [{ puesto_id: testPuestoId, servicio_puesto_id: testServicioPuestoId }],
      });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// PUT /api/plantillas-servicio/:id - Actualizar
// ============================================================================

describe('PUT /api/plantillas-servicio/:id - Actualizar', () => {
  test('12. Debe actualizar nombre (200)', async () => {
    const response = await request(app)
      .put(`/api/plantillas-servicio/${testPlantillaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Plantilla Actualizada PLT' });

    expect(response.status).toBe(200);
  });

  test('13. Debe actualizar detalles con reemplazo (200)', async () => {
    const response = await request(app)
      .put(`/api/plantillas-servicio/${testPlantillaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        detalles: [
          { puesto_id: testPuestoId, servicio_puesto_id: testServicioPuestoId },
          { puesto_id: testPuesto2Id, servicio_puesto_id: testServicioPuesto2Id },
        ],
      });

    expect(response.status).toBe(200);

    // Verificar detalles reemplazados
    const getResp = await request(app)
      .get(`/api/plantillas-servicio/${testPlantillaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getResp.body.detalles.length).toBe(2);
  });

  test('14. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .put('/api/plantillas-servicio/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'No Existe PLT' });

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// DELETE /api/plantillas-servicio/:id - Soft delete
// ============================================================================

describe('DELETE /api/plantillas-servicio/:id - Soft delete', () => {
  let tempPlantillaId: number;

  beforeEach(async () => {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_plantillas_servicio (nombre, activo, created_by) VALUES (?, true, ?)`,
      ['Plantilla Temp PLT', adminUserId]
    );
    tempPlantillaId = result.insertId;
    await db.query(
      `INSERT INTO ot_plantillas_servicio_detalle (plantilla_id, puesto_id, servicio_puesto_id)
       VALUES (?, ?, ?)`,
      [tempPlantillaId, testPuestoId, testServicioPuestoId]
    );
  });

  afterEach(async () => {
    await db.query('DELETE FROM ot_plantillas_servicio_detalle WHERE plantilla_id = ?', [tempPlantillaId]);
    await db.query('DELETE FROM ot_plantillas_servicio WHERE id = ?', [tempPlantillaId]);
  });

  test('15. ADMIN puede eliminar (200, soft delete)', async () => {
    const response = await request(app)
      .delete(`/api/plantillas-servicio/${tempPlantillaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT activo FROM ot_plantillas_servicio WHERE id = ?', [tempPlantillaId]
    );
    expect(rows[0].activo).toBe(0);
  });

  test('16. SUPERVISOR no puede eliminar (403)', async () => {
    const response = await request(app)
      .delete(`/api/plantillas-servicio/${tempPlantillaId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403);
  });

  test('17. Debe retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .delete('/api/plantillas-servicio/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
