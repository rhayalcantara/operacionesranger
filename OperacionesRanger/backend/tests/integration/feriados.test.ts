/**
 * Tests de Integración - Endpoints de Feriados
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests con Supertest para endpoints:
 * - GET /api/feriados
 * - GET /api/feriados/:id
 * - GET /api/feriados/verificar/:fecha
 * - POST /api/feriados
 * - PUT /api/feriados/:id
 * - DELETE /api/feriados/:id
 *
 * Configuración:
 * - Usa base de datos de prueba (configurar en .env.test)
 * - Crea usuario ADMIN de prueba en setup
 * - Crea feriados de prueba
 * - Limpia datos después de tests
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { UserRole } from '../../src/models/auth.model';
import { TipoFeriado } from '../../src/models/feriado.model';

// ============================================================================
// CONFIGURACIÓN DE TESTS
// ============================================================================

// Usuario ADMIN de prueba
const ADMIN_USER = {
  username: 'test_admin_feriados',
  password: 'AdminPassword123!',
  email: 'admin_feriados@test.com',
  nombre_completo: 'Admin de Prueba Feriados',
  rol: UserRole.ADMIN,
};

// Usuario SUPERVISOR de prueba (sin permisos para CUD)
const SUPERVISOR_USER = {
  username: 'test_supervisor_feriados',
  password: 'SupervisorPassword123!',
  email: 'supervisor_feriados@test.com',
  nombre_completo: 'Supervisor de Prueba Feriados',
  rol: UserRole.SUPERVISOR,
};

let adminUserId: number;
let supervisorUserId: number;
let adminAccessToken: string;
let supervisorAccessToken: string;
let testFeriadoId: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

/**
 * Setup antes de todos los tests
 * Crear usuarios de prueba y feriado inicial
 */
beforeAll(async () => {
  const pool = getTurnosPool();

  // Limpiar usuarios de prueba previos
  await pool.execute(
    'DELETE FROM ot_sys_usuarios WHERE username IN (?, ?)',
    [ADMIN_USER.username, SUPERVISOR_USER.username]
  );

  // Crear usuario ADMIN
  const passwordHashAdmin = hashPasswordSync(ADMIN_USER.password);
  const [adminResult] = await pool.execute<any>(
    `INSERT INTO ot_sys_usuarios
     (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [
      ADMIN_USER.username,
      passwordHashAdmin,
      ADMIN_USER.email,
      ADMIN_USER.nombre_completo,
      ADMIN_USER.rol,
    ]
  );
  adminUserId = adminResult.insertId;

  // Crear usuario SUPERVISOR
  const passwordHashSupervisor = hashPasswordSync(SUPERVISOR_USER.password);
  const [supervisorResult] = await pool.execute<any>(
    `INSERT INTO ot_sys_usuarios
     (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [
      SUPERVISOR_USER.username,
      passwordHashSupervisor,
      SUPERVISOR_USER.email,
      SUPERVISOR_USER.nombre_completo,
      SUPERVISOR_USER.rol,
    ]
  );
  supervisorUserId = supervisorResult.insertId;

  // Login ADMIN para obtener token
  const adminLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      username: ADMIN_USER.username,
      password: ADMIN_USER.password,
    });

  adminAccessToken = adminLoginResponse.body.accessToken;

  // Login SUPERVISOR para obtener token
  const supervisorLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      username: SUPERVISOR_USER.username,
      password: SUPERVISOR_USER.password,
    });

  supervisorAccessToken = supervisorLoginResponse.body.accessToken;

  // Limpiar feriados de prueba previos
  await pool.execute(
    'DELETE FROM ot_feriados WHERE fecha >= ? AND fecha <= ?',
    ['2099-01-01', '2099-12-31']
  );

  // Crear feriado de prueba inicial
  const [feriadoResult] = await pool.execute<any>(
    'INSERT INTO ot_feriados (fecha, nombre, tipo, descripcion) VALUES (?, ?, ?, ?)',
    ['2099-01-01', 'Feriado de Prueba Inicial', TipoFeriado.NACIONAL, 'Descripción de prueba']
  );
  testFeriadoId = feriadoResult.insertId;
});

/**
 * Cleanup después de todos los tests
 */
afterAll(async () => {
  const pool = getTurnosPool();

  // Eliminar feriados de prueba
  await pool.execute(
    'DELETE FROM ot_feriados WHERE fecha >= ? AND fecha <= ?',
    ['2099-01-01', '2099-12-31']
  );

  // Eliminar refresh tokens
  await pool.execute(
    'DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (?, ?)',
    [adminUserId, supervisorUserId]
  );

  // Eliminar auditoría
  await pool.execute(
    'DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (?, ?)',
    [adminUserId, supervisorUserId]
  );

  // Eliminar usuarios de prueba
  await pool.execute(
    'DELETE FROM ot_sys_usuarios WHERE id_usuario IN (?, ?)',
    [adminUserId, supervisorUserId]
  );
});

// ============================================================================
// TESTS: GET /api/feriados (Listar con paginación y filtros)
// ============================================================================

describe('GET /api/feriados', () => {
  it('Debe retornar lista paginada de feriados (usuario autenticado)', async () => {
    const response = await request(app)
      .get('/api/feriados')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .query({ page: 1, pageSize: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('Debe filtrar por año correctamente', async () => {
    const response = await request(app)
      .get('/api/feriados')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .query({ año: 2099 });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    // Verificar que todos los feriados son del año 2099
    response.body.data.forEach((feriado: any) => {
      expect(feriado.fecha).toMatch(/^2099-/);
    });
  });

  it('Debe filtrar por tipo NACIONAL correctamente', async () => {
    const response = await request(app)
      .get('/api/feriados')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .query({ tipo: TipoFeriado.NACIONAL, año: 2099 });

    expect(response.status).toBe(200);
    response.body.data.forEach((feriado: any) => {
      expect(feriado.tipo).toBe(TipoFeriado.NACIONAL);
    });
  });

  it('Debe rechazar peticiones sin token (401)', async () => {
    const response = await request(app).get('/api/feriados');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

// ============================================================================
// TESTS: GET /api/feriados/:id
// ============================================================================

describe('GET /api/feriados/:id', () => {
  it('Debe retornar un feriado por ID', async () => {
    const response = await request(app)
      .get(`/api/feriados/${testFeriadoId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testFeriadoId);
    expect(response.body).toHaveProperty('fecha');
    expect(response.body).toHaveProperty('nombre');
    expect(response.body).toHaveProperty('tipo');
  });

  it('Debe retornar 404 si feriado no existe', async () => {
    const response = await request(app)
      .get('/api/feriados/999999')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('Debe rechazar ID inválido (400)', async () => {
    const response = await request(app)
      .get('/api/feriados/invalid')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

// ============================================================================
// TESTS: GET /api/feriados/verificar/:fecha
// ============================================================================

describe('GET /api/feriados/verificar/:fecha', () => {
  it('Debe retornar true si fecha es feriado', async () => {
    const response = await request(app)
      .get('/api/feriados/verificar/2099-01-01')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('fecha', '2099-01-01');
    expect(response.body).toHaveProperty('es_feriado', true);
    expect(response.body).toHaveProperty('feriado');
    expect(response.body.feriado).toHaveProperty('id');
    expect(response.body.feriado).toHaveProperty('nombre');
    expect(response.body.feriado).toHaveProperty('tipo');
  });

  it('Debe retornar false si fecha NO es feriado', async () => {
    const response = await request(app)
      .get('/api/feriados/verificar/2099-06-15')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('fecha', '2099-06-15');
    expect(response.body).toHaveProperty('es_feriado', false);
    expect(response.body).toHaveProperty('feriado', null);
  });

  it('Debe rechazar formato de fecha inválido (400)', async () => {
    const response = await request(app)
      .get('/api/feriados/verificar/invalid-date')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

// ============================================================================
// TESTS: POST /api/feriados (Crear)
// ============================================================================

describe('POST /api/feriados', () => {
  it('Debe crear un nuevo feriado (ADMIN)', async () => {
    const nuevoFeriado = {
      fecha: '2099-12-25',
      nombre: 'Navidad de Prueba',
      tipo: TipoFeriado.NACIONAL,
      descripcion: 'Feriado de prueba para tests',
    };

    const response = await request(app)
      .post('/api/feriados')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(nuevoFeriado);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    // MySQL DATE se serializa como ISO string en JSON
    expect(response.body.data.fecha).toContain(nuevoFeriado.fecha);
    expect(response.body.data).toHaveProperty('nombre', nuevoFeriado.nombre);
    expect(response.body.data).toHaveProperty('tipo', nuevoFeriado.tipo);
  });

  it('Debe rechazar fecha duplicada (409 Conflict)', async () => {
    const feriadoDuplicado = {
      fecha: '2099-01-01', // Ya existe
      nombre: 'Duplicado',
      tipo: TipoFeriado.NACIONAL,
    };

    const response = await request(app)
      .post('/api/feriados')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(feriadoDuplicado);

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  it('Debe rechazar datos inválidos (400)', async () => {
    const feriadoInvalido = {
      fecha: 'invalid-date',
      nombre: '',
      tipo: 'INVALIDO',
    };

    const response = await request(app)
      .post('/api/feriados')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(feriadoInvalido);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Debe rechazar creación por usuario SUPERVISOR (403 Forbidden)', async () => {
    const nuevoFeriado = {
      fecha: '2099-11-01',
      nombre: 'Feriado No Autorizado',
      tipo: TipoFeriado.NACIONAL,
    };

    const response = await request(app)
      .post('/api/feriados')
      .set('Authorization', `Bearer ${supervisorAccessToken}`)
      .send(nuevoFeriado);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });
});

// ============================================================================
// TESTS: PUT /api/feriados/:id (Actualizar)
// ============================================================================

describe('PUT /api/feriados/:id', () => {
  it('Debe actualizar un feriado existente (ADMIN)', async () => {
    const actualizacion = {
      nombre: 'Feriado Actualizado',
      descripcion: 'Descripción actualizada',
    };

    const response = await request(app)
      .put(`/api/feriados/${testFeriadoId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(actualizacion);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('nombre', actualizacion.nombre);
    expect(response.body.data).toHaveProperty('descripcion', actualizacion.descripcion);
  });

  it('Debe retornar 404 si feriado no existe', async () => {
    const response = await request(app)
      .put('/api/feriados/999999')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ nombre: 'Actualización Fallida' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('Debe rechazar actualización por usuario SUPERVISOR (403 Forbidden)', async () => {
    const response = await request(app)
      .put(`/api/feriados/${testFeriadoId}`)
      .set('Authorization', `Bearer ${supervisorAccessToken}`)
      .send({ nombre: 'No Autorizado' });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });
});

// ============================================================================
// TESTS: DELETE /api/feriados/:id (Eliminar)
// ============================================================================

describe('DELETE /api/feriados/:id', () => {
  it('Debe eliminar un feriado existente (ADMIN)', async () => {
    // Crear feriado temporal para eliminar
    const pool = getTurnosPool();
    const [result] = await pool.execute<any>(
      'INSERT INTO ot_feriados (fecha, nombre, tipo) VALUES (?, ?, ?)',
      ['2099-03-15', 'Feriado Temporal', TipoFeriado.DECRETO]
    );
    const tempId = result.insertId;

    const response = await request(app)
      .delete(`/api/feriados/${tempId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');

    // Verificar que fue eliminado
    const [rows] = await pool.execute<any>(
      'SELECT * FROM ot_feriados WHERE id = ?',
      [tempId]
    );
    expect(rows.length).toBe(0);
  });

  it('Debe retornar 404 si feriado no existe', async () => {
    const response = await request(app)
      .delete('/api/feriados/999999')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('Debe rechazar eliminación por usuario SUPERVISOR (403 Forbidden)', async () => {
    const response = await request(app)
      .delete(`/api/feriados/${testFeriadoId}`)
      .set('Authorization', `Bearer ${supervisorAccessToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });
});
