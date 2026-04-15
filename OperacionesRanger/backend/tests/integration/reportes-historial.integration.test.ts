/**
 * Tests de Integración: Historial de Reportes
 * T2.25 - Implementar historial de reportes generados
 *
 * Tests para endpoints:
 * - GET /api/reportes/historial
 * - GET /api/reportes/:id/descargar
 *
 * NOTA: Estos tests están definidos pero pueden estar bloqueados por errores
 * pre-existentes en otros archivos del proyecto (ubicaciones.service.ts,
 * puestos.routes.ts, feriados.controller.ts).
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_hist', password: 'AdminHist123!', email: 'admin_hist@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_sup_hist', password: 'SuperHist123!', email: 'sup_hist@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_cons_hist', password: 'ConsHist123!', email: 'cons_hist@test.com', rol: 'CONSULTA' },
};

let adminToken: string;
let supervisorToken: string;
let consultaToken: string;
let adminUserId: number;
let testUserIds: number[] = [];

beforeAll(async () => {
  const pool = getTurnosPool();
  const usernames = [TEST_USERS.admin.username, TEST_USERS.supervisor.username, TEST_USERS.consulta.username];

  await pool.execute(`DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`, usernames);
  await pool.execute(`DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`, usernames);
  await pool.execute(`DELETE FROM ot_sys_usuarios WHERE username IN (?, ?, ?)`, usernames);

  for (const user of [TEST_USERS.admin, TEST_USERS.supervisor, TEST_USERS.consulta]) {
    const [r] = await pool.execute<any>(
      `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo) VALUES (?, ?, ?, ?, ?, TRUE)`,
      [user.username, hashPasswordSync(user.password), user.email, `Test ${user.rol}`, user.rol]
    );
    testUserIds.push(r.insertId);
  }

  const adminResponse = await request(app).post('/api/auth/login').send({
    username: TEST_USERS.admin.username,
    password: TEST_USERS.admin.password,
  });
  adminToken = adminResponse.body.accessToken;
  adminUserId = adminResponse.body.user?.id_usuario || testUserIds[0];

  const supervisorResponse = await request(app).post('/api/auth/login').send({
    username: TEST_USERS.supervisor.username,
    password: TEST_USERS.supervisor.password,
  });
  supervisorToken = supervisorResponse.body.accessToken;

  const consultaResponse = await request(app).post('/api/auth/login').send({
    username: TEST_USERS.consulta.username,
    password: TEST_USERS.consulta.password,
  });
  consultaToken = consultaResponse.body.accessToken;
});

afterAll(async () => {
  const pool = getTurnosPool();
  await pool.execute('DELETE FROM ot_sys_reportes_generados WHERE user_id = ?', [adminUserId]);
  if (testUserIds.length > 0) {
    const ph = testUserIds.map(() => '?').join(',');
    await pool.execute(`DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (${ph})`, testUserIds);
    await pool.execute(`DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (${ph})`, testUserIds);
    await pool.execute(`DELETE FROM ot_sys_usuarios WHERE id_usuario IN (${ph})`, testUserIds);
  }
});

// ============================================================================
// GRUPO 1: GET /api/reportes/historial (5 tests)
// ============================================================================

describe('GET /api/reportes/historial', () => {
  it('Debe obtener historial vacío si no hay reportes', async () => {
    const response = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('Debe obtener historial con reportes generados', async () => {
    // Generar un reporte primero
    await request(app)
      .post('/api/reportes/nomina')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15',
      });

    // Obtener historial
    const response = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.total).toBeGreaterThan(0);

    // Verificar estructura del primer registro
    const reporte = response.body.data[0];
    expect(reporte).toHaveProperty('id');
    expect(reporte).toHaveProperty('usuario');
    expect(reporte.usuario).toHaveProperty('id');
    expect(reporte.usuario).toHaveProperty('username');
    expect(reporte.usuario).toHaveProperty('nombre_completo');
    expect(reporte).toHaveProperty('fecha_inicio');
    expect(reporte).toHaveProperty('fecha_fin');
    expect(reporte).toHaveProperty('cantidad_turnos');
    expect(reporte).toHaveProperty('fecha_generacion');
    expect(reporte).toHaveProperty('nombre_archivo');
  });

  it('Debe respetar paginación', async () => {
    const response = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pageSize).toBe(2);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
  });

  it('Debe ordenar por fecha_generacion DESC (más recientes primero)', async () => {
    const response = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    if (response.body.data.length >= 2) {
      const fecha1 = new Date(response.body.data[0].fecha_generacion);
      const fecha2 = new Date(response.body.data[1].fecha_generacion);
      expect(fecha1.getTime()).toBeGreaterThanOrEqual(fecha2.getTime());
    }
  });

  it('Debe rechazar sin autenticación', async () => {
    const response = await request(app).get('/api/reportes/historial?page=1&pageSize=10');

    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GRUPO 2: GET /api/reportes/:id/descargar (4 tests)
// ============================================================================

describe('GET /api/reportes/:id/descargar', () => {
  let reporteId: number;

  beforeAll(async () => {
    // Generar un reporte y obtener su ID
    await request(app)
      .post('/api/reportes/nomina')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-15',
      });

    // Obtener el ID del último reporte
    const historial = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);

    reporteId = historial.body.data[0].id;
  });

  it('Debe descargar reporte existente (200, CSV generado)', async () => {
    const response = await request(app)
      .get(`/api/reportes/${reporteId}/descargar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-disposition']).toContain('.csv');
    expect(response.text).toContain('fecha,empleado_id,puesto_codigo');
  });

  it('Debe retornar 404 para reporte inexistente', async () => {
    const response = await request(app)
      .get('/api/reportes/999999/descargar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Reporte no encontrado');
  });

  it('Debe verificar que el CSV regenerado tenga formato correcto', async () => {
    const response = await request(app)
      .get(`/api/reportes/${reporteId}/descargar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const csv = response.text;
    const lines = csv.split('\n');

    // Verificar que tiene header
    expect(lines[0]).toContain('fecha,empleado_id,puesto_codigo');

    // Verificar BOM UTF-8 (\uFEFF)
    expect(csv.charCodeAt(0)).toBe(65279);
  });

  it('Debe rechazar sin autenticación', async () => {
    const response = await request(app).get(`/api/reportes/${reporteId}/descargar`);

    expect(response.status).toBe(401);
  });
});

// ============================================================================
// GRUPO 3: Permisos (3 tests)
// ============================================================================

describe('Permisos de historial', () => {
  it('ADMIN puede ver historial', async () => {
    const response = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it('SUPERVISOR puede ver historial', async () => {
    const response = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=10')
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(200);
  });

  it('CONSULTA puede ver historial', async () => {
    const response = await request(app)
      .get('/api/reportes/historial?page=1&pageSize=10')
      .set('Authorization', `Bearer ${consultaToken}`);

    expect(response.status).toBe(200);
  });
});

// ============================================================================
// RESUMEN DE TESTS
// ============================================================================
// Total: 12 tests
// - Grupo 1 (GET /historial): 5 tests
// - Grupo 2 (GET /:id/descargar): 4 tests
// - Grupo 3 (Permisos): 3 tests
// ============================================================================
