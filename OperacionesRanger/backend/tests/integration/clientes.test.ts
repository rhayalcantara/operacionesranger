/**
 * Tests de Integración - Endpoints de Clientes
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests con Supertest para endpoints:
 * - GET /api/clientes (listar con paginación y búsqueda)
 * - GET /api/clientes/:id (obtener por ID)
 * - POST /api/clientes (crear)
 * - PUT /api/clientes/:id (actualizar)
 * - DELETE /api/clientes/:id (eliminar/soft delete)
 *
 * Configuración:
 * - Usa base de datos de prueba (configurar en .env.test)
 * - Crea usuarios de prueba con diferentes roles
 * - Limpia datos después de cada test
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { UserRole } from '../../src/models/auth.model';

// ============================================================================
// CONFIGURACIÓN DE TESTS
// ============================================================================

// Usuarios de prueba con diferentes roles
const ADMIN_USER = {
  username: 'test_admin_clientes',
  password: 'AdminPass123!',
  email: 'admin_clientes@test.com',
  nombre_completo: 'Admin Clientes Test',
  rol: UserRole.ADMIN
};

const SUPERVISOR_USER = {
  username: 'test_supervisor_clientes',
  password: 'SupervisorPass123!',
  email: 'supervisor_clientes@test.com',
  nombre_completo: 'Supervisor Clientes Test',
  rol: UserRole.SUPERVISOR
};

const CONSULTA_USER = {
  username: 'test_consulta_clientes',
  password: 'ConsultaPass123!',
  email: 'consulta_clientes@test.com',
  nombre_completo: 'Consulta Clientes Test',
  rol: UserRole.CONSULTA
};

// IDs de usuarios de prueba
let adminUserId: number;
let supervisorUserId: number;
let consultaUserId: number;

// Tokens de autenticación
let adminToken: string;
let supervisorToken: string;
let consultaToken: string;

// IDs de clientes de prueba
const testClienteIds: number[] = [];

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

/**
 * Setup antes de todos los tests
 * Crear usuarios de prueba y obtener tokens
 */
beforeAll(async () => {
  const pool = getTurnosPool();

  // Limpiar usuarios de prueba previos
  await pool.execute(
    'DELETE FROM ot_sys_usuarios WHERE username IN (?, ?, ?)',
    [ADMIN_USER.username, SUPERVISOR_USER.username, CONSULTA_USER.username]
  );

  // Crear usuario ADMIN
  const [adminResult] = await pool.execute<any>(
    `INSERT INTO ot_sys_usuarios
     (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [
      ADMIN_USER.username,
      hashPasswordSync(ADMIN_USER.password),
      ADMIN_USER.email,
      ADMIN_USER.nombre_completo,
      ADMIN_USER.rol
    ]
  );
  adminUserId = adminResult.insertId;

  // Crear usuario SUPERVISOR
  const [supervisorResult] = await pool.execute<any>(
    `INSERT INTO ot_sys_usuarios
     (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [
      SUPERVISOR_USER.username,
      hashPasswordSync(SUPERVISOR_USER.password),
      SUPERVISOR_USER.email,
      SUPERVISOR_USER.nombre_completo,
      SUPERVISOR_USER.rol
    ]
  );
  supervisorUserId = supervisorResult.insertId;

  // Crear usuario CONSULTA
  const [consultaResult] = await pool.execute<any>(
    `INSERT INTO ot_sys_usuarios
     (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [
      CONSULTA_USER.username,
      hashPasswordSync(CONSULTA_USER.password),
      CONSULTA_USER.email,
      CONSULTA_USER.nombre_completo,
      CONSULTA_USER.rol
    ]
  );
  consultaUserId = consultaResult.insertId;

  // Obtener tokens de autenticación
  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: ADMIN_USER.username, password: ADMIN_USER.password });
  adminToken = adminLoginRes.body.accessToken;

  const supervisorLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: SUPERVISOR_USER.username, password: SUPERVISOR_USER.password });
  supervisorToken = supervisorLoginRes.body.accessToken;

  const consultaLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: CONSULTA_USER.username, password: CONSULTA_USER.password });
  consultaToken = consultaLoginRes.body.accessToken;
});

/**
 * Cleanup después de todos los tests
 * Eliminar usuarios y datos relacionados
 */
afterAll(async () => {
  const pool = getTurnosPool();

  // Eliminar clientes de prueba
  if (testClienteIds.length > 0) {
    await pool.execute(
      `DELETE FROM ot_clientes WHERE id IN (${testClienteIds.join(',')})`,
      []
    );
  }

  // Eliminar tokens de usuarios de prueba
  await pool.execute(
    'DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (?, ?, ?)',
    [adminUserId, supervisorUserId, consultaUserId]
  );

  // Eliminar auditoría de usuarios de prueba
  await pool.execute(
    'DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (?, ?, ?)',
    [adminUserId, supervisorUserId, consultaUserId]
  );

  // Eliminar usuarios de prueba
  await pool.execute(
    'DELETE FROM ot_sys_usuarios WHERE id_usuario IN (?, ?, ?)',
    [adminUserId, supervisorUserId, consultaUserId]
  );
});

/**
 * Cleanup después de cada test
 * Limpiar clientes de prueba creados en el test
 */
afterEach(async () => {
  const pool = getTurnosPool();

  // Limpiar clientes de prueba por código
  await pool.execute(
    `DELETE FROM ot_clientes WHERE codigo LIKE 'TEST_%'`,
    []
  );

  // Limpiar array de IDs
  testClienteIds.length = 0;
});

// ============================================================================
// TESTS DE GET /api/clientes (listar)
// ============================================================================

describe('GET /api/clientes', () => {
  test('1. Debe listar clientes sin búsqueda (200)', async () => {
    const response = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('2. Debe listar con paginación personalizada (200)', async () => {
    const response = await request(app)
      .get('/api/clientes?page=1&pageSize=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(5);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  test('3. Debe buscar clientes por término (200)', async () => {
    // Crear cliente de prueba primero
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_SEARCH',
        nombre: 'Cliente Búsqueda Test',
        rnc: '123456789',
        email: 'search@test.com'
      });

    testClienteIds.push(createRes.body.id);

    // Buscar por nombre
    const response = await request(app)
      .get('/api/clientes?search=Búsqueda')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].nombre).toContain('Búsqueda');
  });

  test('4. CONSULTA puede listar clientes (200)', async () => {
    const response = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  test('5. Sin token debe fallar (401)', async () => {
    const response = await request(app).get('/api/clientes');

    expect(response.status).toBe(401);
  });
});

// ============================================================================
// TESTS DE GET /api/clientes/:id (obtener por ID)
// ============================================================================

describe('GET /api/clientes/:id', () => {
  test('6. Debe obtener cliente existente (200)', async () => {
    // Crear cliente de prueba
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_GET_ID',
        nombre: 'Cliente GetById Test',
        rnc: '987654321',
        email: 'getid@test.com'
      });

    const clienteId = createRes.body.id;
    testClienteIds.push(clienteId);

    // Obtener por ID
    const response = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(clienteId);
    expect(response.body.codigo).toBe('TEST_GET_ID');
    expect(response.body.nombre).toBe('Cliente GetById Test');
    expect(response.body).toHaveProperty('ubicaciones_count');
  });

  test('7. Cliente no existente debe retornar 404', async () => {
    const response = await request(app)
      .get('/api/clientes/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  test('8. ID inválido debe fallar (400)', async () => {
    const response = await request(app)
      .get('/api/clientes/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });
});

// ============================================================================
// TESTS DE POST /api/clientes (crear)
// ============================================================================

describe('POST /api/clientes', () => {
  test('9. ADMIN puede crear cliente con todos los campos (201)', async () => {
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_FULL',
        nombre: 'Cliente Completo Test',
        rnc: '111222333',
        telefono: '809-555-1234',
        email: 'full@test.com',
        direccion: 'Calle Test 123, Santo Domingo',
        contacto_nombre: 'Juan Pérez',
        contacto_telefono: '809-555-5678'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.codigo).toBe('TEST_FULL');
    expect(response.body.nombre).toBe('Cliente Completo Test');
    expect(response.body.rnc).toBe('111222333');
    expect(response.body.activo).toBeTruthy();

    testClienteIds.push(response.body.id);
  });

  test('10. SUPERVISOR puede crear cliente (201)', async () => {
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        codigo: 'TEST_SUPER',
        nombre: 'Cliente Supervisor Test',
        email: 'supervisor@test.com'
      });

    expect(response.status).toBe(201);
    expect(response.body.codigo).toBe('TEST_SUPER');

    testClienteIds.push(response.body.id);
  });

  test('11. Crear cliente con campos mínimos (201)', async () => {
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_MIN',
        nombre: 'Cliente Mínimo'
      });

    expect(response.status).toBe(201);
    expect(response.body.codigo).toBe('TEST_MIN');
    expect(response.body.nombre).toBe('Cliente Mínimo');

    testClienteIds.push(response.body.id);
  });

  test('12. Código duplicado debe fallar (409)', async () => {
    // Crear primer cliente
    const firstRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_DUP',
        nombre: 'Cliente Duplicado 1'
      });

    testClienteIds.push(firstRes.body.id);

    // Intentar crear con mismo código
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_DUP',
        nombre: 'Cliente Duplicado 2'
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('Ya existe');
    expect(response.body.message).toContain('código');
  });

  test('13. RNC duplicado debe fallar (409)', async () => {
    // Crear primer cliente
    const firstRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_RNC1',
        nombre: 'Cliente RNC 1',
        rnc: '444555666'
      });

    testClienteIds.push(firstRes.body.id);

    // Intentar crear con mismo RNC
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_RNC2',
        nombre: 'Cliente RNC 2',
        rnc: '444555666'
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('Ya existe');
    expect(response.body.message).toContain('RNC');
  });

  test('14. Email inválido debe fallar (400)', async () => {
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_EMAIL',
        nombre: 'Cliente Email Inválido',
        email: 'invalid-email'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('inválid');
  });

  test('15. CONSULTA no puede crear cliente (403)', async () => {
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        codigo: 'TEST_FORBIDDEN',
        nombre: 'Cliente Forbidden'
      });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// TESTS DE PUT /api/clientes/:id (actualizar)
// ============================================================================

describe('PUT /api/clientes/:id', () => {
  test('16. ADMIN puede actualizar cliente (200)', async () => {
    // Crear cliente
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_UPDATE_ADMIN',
        nombre: 'Cliente Original'
      });

    const clienteId = createRes.body.id;
    testClienteIds.push(clienteId);

    // Actualizar
    const response = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Cliente Actualizado',
        email: 'actualizado@test.com'
      });

    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe('Cliente Actualizado');
    expect(response.body.email).toBe('actualizado@test.com');
  });

  test('17. SUPERVISOR puede actualizar cliente (200)', async () => {
    // Crear cliente
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_UPDATE_SUPER',
        nombre: 'Cliente Original Super'
      });

    const clienteId = createRes.body.id;
    testClienteIds.push(clienteId);

    // Actualizar como SUPERVISOR
    const response = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        telefono: '809-123-4567'
      });

    expect(response.status).toBe(200);
    expect(response.body.telefono).toBe('809-123-4567');
  });

  test('18. Cliente no existente debe fallar (404)', async () => {
    const response = await request(app)
      .put('/api/clientes/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'No existe'
      });

    expect(response.status).toBe(404);
  });

  test('19. CONSULTA no puede actualizar (403)', async () => {
    // Crear cliente
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_UPDATE_FORBIDDEN',
        nombre: 'Cliente Forbidden Update'
      });

    const clienteId = createRes.body.id;
    testClienteIds.push(clienteId);

    // Intentar actualizar como CONSULTA
    const response = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        nombre: 'Intento de actualización'
      });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// TESTS DE DELETE /api/clientes/:id (eliminar)
// ============================================================================

describe('DELETE /api/clientes/:id', () => {
  test('20. ADMIN puede eliminar cliente sin ubicaciones (200)', async () => {
    // Crear cliente
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_DELETE',
        nombre: 'Cliente a Eliminar'
      });

    const clienteId = createRes.body.id;

    // Eliminar (soft delete)
    const response = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('desactivado');

    // Verificar que esté inactivo
    const getRes = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.body.activo).toBeFalsy();
  });

  test('21. SUPERVISOR no puede eliminar (403)', async () => {
    // Crear cliente
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_DELETE_SUPER',
        nombre: 'Cliente Supervisor Delete'
      });

    const clienteId = createRes.body.id;
    testClienteIds.push(clienteId);

    // Intentar eliminar como SUPERVISOR
    const response = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403);
  });

  test('22. CONSULTA no puede eliminar (403)', async () => {
    // Crear cliente
    const createRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'TEST_DELETE_CONSULTA',
        nombre: 'Cliente Consulta Delete'
      });

    const clienteId = createRes.body.id;
    testClienteIds.push(clienteId);

    // Intentar eliminar como CONSULTA
    const response = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// RESUMEN DE TESTS
// ============================================================================

/**
 * Total de tests: 22
 *
 * GET /api/clientes: 5 tests
 * GET /api/clientes/:id: 3 tests
 * POST /api/clientes: 7 tests
 * PUT /api/clientes/:id: 4 tests
 * DELETE /api/clientes/:id: 3 tests
 *
 * Cobertura:
 * - Autenticación y autorización (todos los roles)
 * - Validaciones (código único, RNC único, email, campos requeridos)
 * - Paginación y búsqueda
 * - Soft delete
 * - Casos de error (404, 409, 400, 401, 403)
 */
