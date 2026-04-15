/**
 * Tests de Integración - Incentivos por Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite completa de tests para el CRUD de incentivos.
 * Verifica endpoints, validaciones, autenticación, autorización y
 * lógica de negocio (especialmente solapamiento de fechas).
 *
 * @module tests/incentivos.test
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { ResultSetHeader } from 'mysql2/promise';

// ============================================================================
// VARIABLES GLOBALES PARA TESTS
// ============================================================================

let adminToken: string;
let supervisorToken: string;
let consultaToken: string;

let clienteId: number;
let ubicacionId: number;
let puestoId: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

/**
 * beforeAll - Configuración inicial
 *
 * 1. Limpiar base de datos de prueba
 * 2. Crear usuarios de prueba (admin, supervisor, consulta)
 * 3. Obtener tokens JWT
 * 4. Crear datos de prueba (cliente, ubicación, puesto)
 */
beforeAll(async () => {
  const pool = getTurnosPool();

  // 1. Limpiar tablas en orden correcto (por FKs)
  await pool.execute('DELETE FROM ot_incentivos_puesto');
  await pool.execute('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-TEST%']);
  await pool.execute('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TEST%']);
  await pool.execute('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TEST%']);

  const usernames = ['test_admin_inc', 'test_sup_inc', 'test_cons_inc'];
  await pool.execute(`DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`, usernames);
  await pool.execute(`DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`, usernames);
  await pool.execute(`DELETE FROM ot_sys_usuarios WHERE username IN (?, ?, ?)`, usernames);

  // 2. Crear usuarios directamente en BD
  const users = [
    { username: 'test_admin_inc', password: 'AdminInc123!', email: 'admin_inc@test.com', rol: 'ADMIN' },
    { username: 'test_sup_inc', password: 'SuperInc123!', email: 'sup_inc@test.com', rol: 'SUPERVISOR' },
    { username: 'test_cons_inc', password: 'ConsInc123!', email: 'cons_inc@test.com', rol: 'CONSULTA' },
  ];

  for (const user of users) {
    await pool.execute(
      `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo) VALUES (?, ?, ?, ?, ?, TRUE)`,
      [user.username, hashPasswordSync(user.password), user.email, `Test ${user.rol} Inc`, user.rol]
    );
  }

  // Login
  const adminRes = await request(app).post('/api/auth/login').send({ username: users[0].username, password: users[0].password });
  adminToken = adminRes.body.accessToken;
  const supRes = await request(app).post('/api/auth/login').send({ username: users[1].username, password: users[1].password });
  supervisorToken = supRes.body.accessToken;
  const consRes = await request(app).post('/api/auth/login').send({ username: users[2].username, password: users[2].password });
  consultaToken = consRes.body.accessToken;

  // 3. Crear datos de prueba directamente en BD
  const [clienteResult] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ot_clientes (codigo, nombre, activo) VALUES (?, ?, true)`,
    ['CLI-TEST-INC', 'Cliente Test Incentivos']
  );
  clienteId = clienteResult.insertId;

  const [ubicacionResult] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo) VALUES (?, ?, ?, true)`,
    [clienteId, 'UB-TEST-INC', 'Ubicación Test Incentivos']
  );
  ubicacionId = ubicacionResult.insertId;

  const [puestoResult] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, activo) VALUES (?, ?, ?, true)`,
    [ubicacionId, 'P-TEST-INC', 'Puesto Test Incentivos']
  );
  puestoId = puestoResult.insertId;
});

/**
 * afterAll - Limpieza final
 *
 * Limpiar datos de prueba y cerrar conexiones
 */
afterAll(async () => {
  const pool = getTurnosPool();
  await pool.execute('DELETE FROM ot_incentivos_puesto');
  await pool.execute('DELETE FROM ot_puestos WHERE codigo LIKE ?', ['P-TEST%']);
  await pool.execute('DELETE FROM ot_ubicaciones WHERE codigo LIKE ?', ['UB-TEST%']);
  await pool.execute('DELETE FROM ot_clientes WHERE codigo LIKE ?', ['CLI-TEST%']);
  const usernames = ['test_admin_inc', 'test_sup_inc', 'test_cons_inc'];
  await pool.execute(`DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`, usernames);
  await pool.execute(`DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`, usernames);
  await pool.execute(`DELETE FROM ot_sys_usuarios WHERE username IN (?, ?, ?)`, usernames);
});

/**
 * beforeEach - Limpiar tabla incentivos antes de cada test
 *
 * Asegura que cada test comienza con tabla limpia
 */
beforeEach(async () => {
  const pool = getTurnosPool();
  await pool.execute('DELETE FROM ot_incentivos_puesto');
});

// ============================================================================
// SUITE: AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================================

describe('Autenticación y Autorización - Incentivos', () => {
  test('GET /api/incentivos sin token debe retornar 401', async () => {
    const res = await request(app).get('/api/incentivos');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/incentivos como CONSULTA debe retornar 403', async () => {
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  test('DELETE /api/incentivos como SUPERVISOR debe retornar 403', async () => {
    // Primero crear un incentivo
    const createRes = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    const incentivoId = createRes.body.id;

    // Intentar eliminar como supervisor
    const res = await request(app)
      .delete(`/api/incentivos/${incentivoId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

// ============================================================================
// SUITE: CREAR INCENTIVO
// ============================================================================

describe('Crear Incentivo - POST /api/incentivos', () => {
  test('Crear incentivo válido debe retornar 201 y calcular valor_hora', async () => {
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15',
        observaciones: 'Incentivo de prueba'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.puesto_id).toBe(puestoId);
    expect(res.body.anio).toBe(2026);
    expect(res.body.quincena).toBe(1);
    expect(parseFloat(res.body.monto)).toBe(36000);
    expect(parseFloat(res.body.valor_hora)).toBe(100); // 36000 / 360 = 100
    expect(res.body.fecha_inicio).toBeTruthy();
    expect(res.body.fecha_fin).toBeTruthy();
    expect(res.body.observaciones).toBe('Incentivo de prueba');
    expect(res.body.puesto_nombre).toBe('Puesto Test Incentivos');
    expect(res.body.ubicacion_nombre).toBe('Ubicación Test Incentivos');
    expect(res.body.cliente_nombre).toBe('Cliente Test Incentivos');
  });

  test('Crear incentivo con puesto_id inexistente debe retornar 404', async () => {
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: 99999, // Puesto que no existe
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Puesto no encontrado');
  });

  test('Crear incentivo con monto <= 0 debe retornar 400', async () => {
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 0, // Monto inválido
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  test('Crear incentivo con solapamiento de fechas debe retornar 400', async () => {
    // Primero crear un incentivo
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    // Intentar crear otro con fechas solapadas
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 40000,
        fecha_inicio: '2026-01-10', // Solapamiento parcial
        fecha_fin: '2026-01-20'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('solapadas');
  });

  test('Crear incentivo con fecha_inicio >= fecha_fin debe retornar 400', async () => {
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-15',
        fecha_fin: '2026-01-01' // fecha_fin antes que fecha_inicio
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });
});

// ============================================================================
// SUITE: LISTAR INCENTIVOS
// ============================================================================

describe('Listar Incentivos - GET /api/incentivos', () => {
  test('Listar todos con paginación debe retornar 200', async () => {
    // Crear algunos incentivos de prueba
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 2,
        monto: 40000,
        fecha_inicio: '2026-01-16',
        fecha_fin: '2026-01-31'
      });

    const res = await request(app)
      .get('/api/incentivos?page=1&pageSize=10')
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pageSize');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body.data.length).toBe(2);
    expect(res.body.total).toBe(2);
  });

  test('Filtrar por puesto_id debe retornar solo incentivos del puesto', async () => {
    // Crear incentivo
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    const res = await request(app)
      .get(`/api/incentivos?puesto_id=${puestoId}`)
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].puesto_id).toBe(puestoId);
  });

  test('Filtrar por año y quincena debe retornar incentivos correctos', async () => {
    // Crear incentivos de diferentes quincenas
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 2,
        monto: 40000,
        fecha_inicio: '2026-01-16',
        fecha_fin: '2026-01-31'
      });

    const res = await request(app)
      .get('/api/incentivos?anio=2026&quincena=1')
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].anio).toBe(2026);
    expect(res.body.data[0].quincena).toBe(1);
  });
});

// ============================================================================
// SUITE: OBTENER POR ID
// ============================================================================

describe('Obtener Incentivo por ID - GET /api/incentivos/:id', () => {
  test('Obtener incentivo existente debe retornar 200 con relaciones', async () => {
    // Crear incentivo
    const createRes = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    const incentivoId = createRes.body.id;

    const res = await request(app)
      .get(`/api/incentivos/${incentivoId}`)
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(incentivoId);
    expect(res.body.puesto_nombre).toBeTruthy();
    expect(res.body.ubicacion_nombre).toBeTruthy();
    expect(res.body.cliente_nombre).toBeTruthy();
    expect(parseFloat(res.body.valor_hora)).toBe(100);
  });

  test('Obtener incentivo inexistente debe retornar 404', async () => {
    const res = await request(app)
      .get('/api/incentivos/99999')
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('no encontrado');
  });
});

// ============================================================================
// SUITE: OBTENER POR QUINCENA
// ============================================================================

describe('Obtener Incentivos por Quincena - GET /api/incentivos/quincena/:fecha', () => {
  test('Obtener incentivos para fecha con incentivos debe retornar 200 con datos', async () => {
    // Crear incentivo
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    const res = await request(app)
      .get('/api/incentivos/quincena/2026-01-10')
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].puesto_id).toBe(puestoId);
    expect(parseFloat(res.body[0].valor_hora)).toBe(100);
  });

  test('Obtener incentivos para fecha sin incentivos debe retornar 200 con array vacío', async () => {
    const res = await request(app)
      .get('/api/incentivos/quincena/2026-12-25')
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});

// ============================================================================
// SUITE: ACTUALIZAR INCENTIVO
// ============================================================================

describe('Actualizar Incentivo - PUT /api/incentivos/:id', () => {
  test('Actualizar monto debe retornar 200 y recalcular valor_hora', async () => {
    // Crear incentivo
    const createRes = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    const incentivoId = createRes.body.id;

    // Actualizar monto
    const res = await request(app)
      .put(`/api/incentivos/${incentivoId}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        monto: 54000 // Nuevo monto
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(incentivoId);
    expect(parseFloat(res.body.monto)).toBe(54000);
    expect(parseFloat(res.body.valor_hora)).toBe(150); // 54000 / 360 = 150
  });

  test('Actualizar fechas creando solapamiento debe retornar 400', async () => {
    // Crear dos incentivos sin solapamiento
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    const incentivo2 = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 2,
        monto: 40000,
        fecha_inicio: '2026-01-16',
        fecha_fin: '2026-01-31'
      });

    // Intentar actualizar incentivo2 para que solape con incentivo1
    const res = await request(app)
      .put(`/api/incentivos/${incentivo2.body.id}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        fecha_inicio: '2026-01-10' // Causaría solapamiento
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('solapamiento');
  });

  test('Actualizar incentivo inexistente debe retornar 404', async () => {
    const res = await request(app)
      .put('/api/incentivos/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        monto: 50000
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('no encontrado');
  });
});

// ============================================================================
// SUITE: ELIMINAR INCENTIVO
// ============================================================================

describe('Eliminar Incentivo - DELETE /api/incentivos/:id', () => {
  test('Eliminar incentivo existente debe retornar 200', async () => {
    // Crear incentivo
    const createRes = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    const incentivoId = createRes.body.id;

    // Eliminar
    const res = await request(app)
      .delete(`/api/incentivos/${incentivoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('eliminado');
    expect(res.body.id).toBe(incentivoId);

    // Verificar que ya no existe
    const getRes = await request(app)
      .get(`/api/incentivos/${incentivoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });

  test('Eliminar incentivo inexistente debe retornar 404', async () => {
    const res = await request(app)
      .delete('/api/incentivos/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('no encontrado');
  });
});

// ============================================================================
// SUITE: VALIDACIÓN DE SOLAPAMIENTO
// ============================================================================

describe('Validación de Solapamiento de Fechas', () => {
  test('Detectar solapamiento total (nuevo periodo dentro de existente)', async () => {
    // Crear incentivo base
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-31'
      });

    // Intentar crear incentivo completamente dentro del primero
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 40000,
        fecha_inicio: '2026-01-10',
        fecha_fin: '2026-01-20'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('solapadas');
  });

  test('Detectar solapamiento parcial (inicio del nuevo periodo dentro de existente)', async () => {
    // Crear incentivo base
    await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    // Intentar crear incentivo con inicio dentro del primero
    const res = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 2,
        monto: 40000,
        fecha_inicio: '2026-01-10',
        fecha_fin: '2026-01-31'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('solapadas');
  });

  test('Permitir incentivos consecutivos sin solapamiento', async () => {
    // Crear primer incentivo
    const res1 = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 1,
        monto: 36000,
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15'
      });

    expect(res1.status).toBe(201);

    // Crear segundo incentivo consecutivo (sin solapamiento)
    const res2 = await request(app)
      .post('/api/incentivos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        puesto_id: puestoId,
        anio: 2026,
        quincena: 2,
        monto: 40000,
        fecha_inicio: '2026-01-16',
        fecha_fin: '2026-01-31'
      });

    expect(res2.status).toBe(201);
  });
});
