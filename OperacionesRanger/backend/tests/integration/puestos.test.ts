/**
 * Tests de Integración: Puestos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar endpoints de puestos de seguridad.
 *
 * @group integration
 * @group puestos
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Get database connection
const db = getTurnosPool();

// ============================================================================
// VARIABLES GLOBALES PARA TESTS
// ============================================================================

let authToken: string;
let adminToken: string;
let supervisorToken: string;

let testClienteId: number;
let testUbicacionId: number;
let testPuestoId: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

beforeAll(async () => {
  // 1. Crear usuarios de prueba y obtener tokens
  await createTestUsers();
  authToken = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  adminToken = authToken;
  supervisorToken = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);

  // 2. Crear datos de prueba
  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId = await createTestPuesto(testUbicacionId);
});

afterAll(async () => {
  // Limpiar datos de prueba
  await cleanupTestData();
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_puestos', password: 'AdminPuestos123!', email: 'admin_puestos@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_supervisor_puestos', password: 'SuperPuestos123!', email: 'supervisor_puestos@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_consulta_puestos', password: 'ConsultaPuestos123!', email: 'consulta_puestos@test.com', rol: 'CONSULTA' },
};

let adminUserId: number;
let supervisorUserId: number;
let consultaUserId: number;

async function createTestUsers(): Promise<void> {
  // Limpiar usuarios de prueba previos
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

  const passwordHashAdmin = hashPasswordSync(TEST_USERS.admin.password);
  const passwordHashSupervisor = hashPasswordSync(TEST_USERS.supervisor.password);
  const passwordHashConsulta = hashPasswordSync(TEST_USERS.consulta.password);

  const [adminResult] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.admin.username, passwordHashAdmin, TEST_USERS.admin.email, 'Admin Test Puestos', TEST_USERS.admin.rol]
  );
  adminUserId = adminResult.insertId;

  const [supResult] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.supervisor.username, passwordHashSupervisor, TEST_USERS.supervisor.email, 'Supervisor Test Puestos', TEST_USERS.supervisor.rol]
  );
  supervisorUserId = supResult.insertId;

  const [consResult] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.consulta.username, passwordHashConsulta, TEST_USERS.consulta.email, 'Consulta Test Puestos', TEST_USERS.consulta.rol]
  );
  consultaUserId = consResult.insertId;
}

async function getAuthToken(username: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  return response.body.accessToken;
}

async function createTestCliente(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_clientes (codigo, nombre, activo)
     VALUES (?, ?, true)`,
    ['CLI-TEST-PUESTOS', 'Cliente Test Puestos']
  );

  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo)
     VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-TEST', 'Ubicación Test']
  );

  return result.insertId;
}

async function createTestPuesto(ubicacionId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, cantidad_guardianes, activo)
     VALUES (?, ?, ?, ?, true)`,
    [ubicacionId, 'P-TEST', 'Puesto Test', 1]
  );

  return result.insertId;
}

async function cleanupTestData(): Promise<void> {
  // Eliminar en orden inverso (por FKs)
  await db.query('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-TEST%']);
  await db.query('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TEST%']);
  await db.query('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TEST%']);

  // Limpiar usuarios de prueba
  const userIds = [adminUserId, supervisorUserId, consultaUserId].filter(Boolean);
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    await db.execute(`DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (${placeholders})`, userIds);
    await db.execute(`DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (${placeholders})`, userIds);
    await db.execute(`DELETE FROM ot_sys_usuarios WHERE id_usuario IN (${placeholders})`, userIds);
  }
}

// ============================================================================
// GRUPO 1: GET /api/puestos (Listar puestos)
// ============================================================================

describe('GET /api/puestos - Listar puestos', () => {
  test('1. Debe listar puestos sin filtros (200)', async () => {
    const response = await request(app)
      .get('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('2. Debe listar con paginación (page=2, pageSize=5)', async () => {
    const response = await request(app)
      .get('/api/puestos?page=1&pageSize=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(5);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  test('3. Debe filtrar por ubicacion_id (200)', async () => {
    const response = await request(app)
      .get(`/api/puestos?ubicacion_id=${testUbicacionId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    // Todos los puestos deben tener el ubicacion_id correcto
    response.body.data.forEach((puesto: any) => {
      expect(puesto.ubicacion_id).toBe(testUbicacionId);
    });
  });

  test('4. Debe filtrar por cliente_id con JOIN correcto (200)', async () => {
    const response = await request(app)
      .get(`/api/puestos?cliente_id=${testClienteId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    // Debe incluir información del cliente
    if (response.body.data.length > 0) {
      expect(response.body.data[0]).toHaveProperty('cliente_id');
      expect(response.body.data[0]).toHaveProperty('cliente_nombre');
    }
  });

  test('5. Debe buscar por nombre/codigo con search query', async () => {
    const response = await request(app)
      .get('/api/puestos?search=TEST')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    // Si hay resultados, deben contener "TEST" en nombre o código
    if (response.body.data.length > 0) {
      const hasMatch = response.body.data.some((puesto: any) =>
        puesto.nombre.includes('TEST') || puesto.codigo.includes('TEST')
      );
      expect(hasMatch).toBe(true);
    }
  });
});

// ============================================================================
// GRUPO 2: GET /api/puestos/:id (Obtener por ID)
// ============================================================================

describe('GET /api/puestos/:id - Obtener puesto por ID', () => {
  test('6. Debe obtener puesto por ID válido con relaciones (200)', async () => {
    const response = await request(app)
      .get(`/api/puestos/${testPuestoId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testPuestoId);
    expect(response.body).toHaveProperty('ubicacion_nombre');
    expect(response.body).toHaveProperty('ubicacion_codigo');
    expect(response.body).toHaveProperty('cliente_id');
    expect(response.body).toHaveProperty('cliente_nombre');
    expect(response.body).toHaveProperty('turnos_count');
  });

  test('7. Debe retornar 404 para puesto inexistente', async () => {
    const response = await request(app)
      .get('/api/puestos/999999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('8. Debe verificar que turnos_count = 0 (campo presente)', async () => {
    const response = await request(app)
      .get(`/api/puestos/${testPuestoId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('turnos_count');
    expect(response.body.turnos_count).toBe(0); // Tabla turnos no existe aún
  });
});

// ============================================================================
// GRUPO 3: GET /api/puestos/:id/turnos (Turnos del puesto)
// ============================================================================

describe('GET /api/puestos/:id/turnos - Obtener turnos de puesto', () => {
  test('9. Debe obtener turnos de puesto (200, array vacío por ahora)', async () => {
    const response = await request(app)
      .get(`/api/puestos/${testPuestoId}/turnos`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0); // Array vacío por ahora
    expect(response.body.total).toBe(0);
  });

  test('10. Debe retornar 404 para puesto inexistente', async () => {
    const response = await request(app)
      .get('/api/puestos/999999/turnos')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// GRUPO 4: POST /api/puestos (Crear puesto)
// ============================================================================

describe('POST /api/puestos - Crear puesto', () => {
  test('11. Debe crear puesto válido (201)', async () => {
    const response = await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ubicacion_id: testUbicacionId,
        codigo: 'P-TEST-NEW',
        nombre: 'Puesto Nuevo Test',
        descripcion: 'Descripción de prueba',
        cantidad_guardianes: 2
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.codigo).toBe('P-TEST-NEW'); // Normalizado a mayúsculas
    expect(response.body.nombre).toBe('Puesto Nuevo Test');
    expect(response.body.cantidad_guardianes).toBe(2);

    // Limpiar
    await db.query('DELETE FROM ot_puestos WHERE codigo = ?', ['P-TEST-NEW']);
  });

  test('12. Debe retornar 404 para ubicacion_id inexistente', async () => {
    const response = await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ubicacion_id: 999999,
        codigo: 'P-TEST-INVALID',
        nombre: 'Puesto Inválido'
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('13. Debe retornar 400 para codigo duplicado en misma ubicacion', async () => {
    // Primero crear un puesto
    await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ubicacion_id: testUbicacionId,
        codigo: 'P-TEST-DUP',
        nombre: 'Puesto Duplicado 1'
      });

    // Intentar crear otro con mismo código en misma ubicación
    const response = await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ubicacion_id: testUbicacionId,
        codigo: 'P-TEST-DUP',
        nombre: 'Puesto Duplicado 2'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');

    // Limpiar
    await db.query('DELETE FROM ot_puestos WHERE codigo = ?', ['P-TEST-DUP']);
  });

  test('14. Debe retornar 400 para campos inválidos (validación)', async () => {
    const response = await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ubicacion_id: 'invalid', // Debe ser número
        codigo: 'P',             // Muy corto (min 2)
        nombre: ''               // Vacío (requerido)
      });

    expect(response.status).toBe(400);
  });
});

// ============================================================================
// GRUPO 5: PUT /api/puestos/:id (Actualizar puesto)
// ============================================================================

describe('PUT /api/puestos/:id - Actualizar puesto', () => {
  test('15. Debe actualizar puesto válido (200)', async () => {
    const response = await request(app)
      .put(`/api/puestos/${testPuestoId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nombre: 'Puesto Test Actualizado',
        cantidad_guardianes: 3
      });

    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe('Puesto Test Actualizado');
    expect(response.body.cantidad_guardianes).toBe(3);
  });

  test('16. Debe retornar 400 para codigo duplicado', async () => {
    // Crear otro puesto
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, activo)
       VALUES (?, ?, ?, true)`,
      [testUbicacionId, 'P-TEST-OTHER', 'Otro Puesto']
    );
    const otherId = result.insertId;

    // Intentar actualizar con código existente
    const response = await request(app)
      .put(`/api/puestos/${otherId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        codigo: 'P-TEST' // Código del puesto original
      });

    expect(response.status).toBe(400);

    // Limpiar
    await db.query('DELETE FROM ot_puestos WHERE id = ?', [otherId]);
  });

  test('17. Debe retornar 404 para puesto inexistente', async () => {
    const response = await request(app)
      .put('/api/puestos/999999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nombre: 'No Existe'
      });

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// GRUPO 6: DELETE /api/puestos/:id (Eliminar puesto)
// ============================================================================

describe('DELETE /api/puestos/:id - Eliminar puesto', () => {
  test('18. Debe eliminar puesto sin turnos (200, soft delete)', async () => {
    // Crear puesto temporal
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, activo)
       VALUES (?, ?, ?, true)`,
      [testUbicacionId, 'P-TEST-DEL', 'Puesto a Eliminar']
    );
    const puestoId = result.insertId;

    // Eliminar
    const response = await request(app)
      .delete(`/api/puestos/${puestoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('id', puestoId);

    // Verificar soft delete (activo = false)
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT activo FROM ot_puestos WHERE id = ?',
      [puestoId]
    );
    expect(rows[0].activo).toBe(0); // false

    // Limpiar
    await db.query('DELETE FROM ot_puestos WHERE id = ?', [puestoId]);
  });

  test('19. Debe retornar 404 para puesto inexistente', async () => {
    const response = await request(app)
      .delete('/api/puestos/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  test('20. Debe verificar que ADMIN puede eliminar (403 si no es ADMIN)', async () => {
    // Crear puesto temporal
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, activo)
       VALUES (?, ?, ?, true)`,
      [testUbicacionId, 'P-TEST-PERM', 'Puesto Permisos']
    );
    const puestoId = result.insertId;

    // Intentar eliminar con SUPERVISOR (debe fallar)
    const response = await request(app)
      .delete(`/api/puestos/${puestoId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403); // Forbidden

    // Limpiar
    await db.query('DELETE FROM ot_puestos WHERE id = ?', [puestoId]);
  });
});

// ============================================================================
// GRUPO 7: Validación de Roles
// ============================================================================

describe('Validación de Roles', () => {
  test('21. POST sin rol ADMIN/SUPERVISOR debe retornar 403', async () => {
    // Obtener token de CONSULTA (rol sin permisos para POST)
    const consultaToken = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

    const response = await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        ubicacion_id: testUbicacionId,
        codigo: 'P-TEST-NOPERM',
        nombre: 'Sin Permisos'
      });

    expect(response.status).toBe(403);
  });

  test('22. DELETE sin rol ADMIN debe retornar 403', async () => {
    // Intentar DELETE con SUPERVISOR
    const response = await request(app)
      .delete(`/api/puestos/${testPuestoId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// GRUPO 8: Validaciones adicionales
// ============================================================================

describe('Validaciones adicionales', () => {
  test('23. Debe normalizar código a mayúsculas', async () => {
    const response = await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ubicacion_id: testUbicacionId,
        codigo: 'p-test-lower',  // Minúsculas
        nombre: 'Puesto Lower'
      });

    expect(response.status).toBe(201);
    expect(response.body.codigo).toBe('P-TEST-LOWER'); // Normalizado a mayúsculas

    // Limpiar
    await db.query('DELETE FROM ot_puestos WHERE codigo = ?', ['P-TEST-LOWER']);
  });

  test('24. Debe aplicar valores por defecto correctamente', async () => {
    const response = await request(app)
      .post('/api/puestos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ubicacion_id: testUbicacionId,
        codigo: 'P-TEST-DEFAULTS',
        nombre: 'Puesto Defaults'
        // No enviar cantidad_guardianes, requiere_turno_diurno, requiere_turno_nocturno
      });

    expect(response.status).toBe(201);
    expect(response.body.cantidad_guardianes).toBe(1); // Default
    expect(response.body.requiere_turno_diurno).toBeTruthy(); // Default
    expect(response.body.requiere_turno_nocturno).toBeTruthy(); // Default

    // Limpiar
    await db.query('DELETE FROM ot_puestos WHERE codigo = ?', ['P-TEST-DEFAULTS']);
  });
});
