/**
 * Tests de Integración - Ubicaciones API
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Prueba todos los endpoints de ubicaciones con validaciones de:
 * - Autenticación y autorización
 * - Validación de inputs
 * - Lógica de negocio (cliente activo, código único, puestos activos, etc.)
 * - Coordenadas GPS
 *
 * @module tests/integration/ubicaciones.test
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { generateAccessToken } from '../../src/services/jwt.service';
import { UserRole } from '../../src/models/auth.model';
import { ResultSetHeader } from 'mysql2/promise';

// ============================================================================
// SETUP Y HELPERS
// ============================================================================

let adminToken: string;
let supervisorToken: string;
let consultaToken: string;
let testClienteId: number;

beforeAll(async () => {
  // Generar tokens para diferentes roles
  adminToken = generateAccessToken({
    sub: 1,
    username: 'admin-test',
    rol: UserRole.ADMIN
  });

  supervisorToken = generateAccessToken({
    sub: 2,
    username: 'supervisor-test',
    rol: UserRole.SUPERVISOR
  });

  consultaToken = generateAccessToken({
    sub: 3,
    username: 'consulta-test',
    rol: UserRole.CONSULTA
  });

  // Crear cliente de prueba
  const pool = getTurnosPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ot_clientes (codigo, nombre, activo) VALUES (?, ?, TRUE)`,
    ['CLI-TEST-UBI', 'Cliente Test Ubicaciones']
  );
  testClienteId = result.insertId;
});

afterAll(async () => {
  // Limpiar datos de prueba
  const pool = getTurnosPool();

  // Eliminar ubicaciones de prueba
  await pool.execute(`DELETE FROM ot_ubicaciones WHERE cliente_id = ?`, [testClienteId]);

  // Eliminar cliente de prueba
  await pool.execute(`DELETE FROM ot_clientes WHERE id = ?`, [testClienteId]);
});

// Helper: Crear ubicación de prueba
async function createTestUbicacion(data: any = {}) {
  const pool = getTurnosPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (
      cliente_id, codigo, nombre, direccion, provincia, municipio, sector,
      latitud, longitud, telefono, contacto_nombre, contacto_telefono, activo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.cliente_id || testClienteId,
      data.codigo || 'UB-TEST-01',
      data.nombre || 'Ubicación Test',
      data.direccion || null,
      data.provincia || null,
      data.municipio || null,
      data.sector || null,
      data.latitud || null,
      data.longitud || null,
      data.telefono || null,
      data.contacto_nombre || null,
      data.contacto_telefono || null,
      data.activo !== undefined ? data.activo : true
    ]
  );
  return result.insertId;
}

// Helper: Eliminar ubicación de prueba
async function deleteTestUbicacion(id: number) {
  const pool = getTurnosPool();
  await pool.execute(`DELETE FROM ot_ubicaciones WHERE id = ?`, [id]);
}

// ============================================================================
// TESTS: POST /api/ubicaciones
// ============================================================================

describe('POST /api/ubicaciones', () => {
  test('Debe crear ubicación con todos los campos', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'SEDE-PRINCIPAL',
        nombre: 'Sede Principal',
        direccion: 'Av. Winston Churchill #123',
        provincia: 'Santo Domingo',
        municipio: 'Santo Domingo Este',
        sector: 'Los Cacicazgos',
        coordenadas_gps: '18.486058,-69.931212',
        telefono: '8095551234',
        contacto_nombre: 'Juan Pérez',
        contacto_telefono: '8095554321'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.codigo).toBe('SEDE-PRINCIPAL');
    expect(response.body.nombre).toBe('Sede Principal');
    expect(response.body.cliente_id).toBe(testClienteId);
    expect(parseFloat(response.body.latitud)).toBeCloseTo(18.486058, 5);
    expect(parseFloat(response.body.longitud)).toBeCloseTo(-69.931212, 5);
    expect(response.body.activo).toBeTruthy();

    // Limpiar
    await deleteTestUbicacion(response.body.id);
  });

  test('Debe crear ubicación solo con campos requeridos', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-MIN',
        nombre: 'Ubicación Mínima'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.codigo).toBe('UB-MIN');
    expect(response.body.nombre).toBe('Ubicación Mínima');
    expect(response.body.direccion).toBeNull();
    expect(response.body.latitud).toBeNull();
    expect(response.body.longitud).toBeNull();

    // Limpiar
    await deleteTestUbicacion(response.body.id);
  });

  test('Debe crear ubicación con coordenadas GPS válidas', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-GPS',
        nombre: 'Ubicación con GPS',
        coordenadas_gps: '18.5,-69.9'
      });

    expect(response.status).toBe(201);
    expect(parseFloat(response.body.latitud)).toBeCloseTo(18.5, 5);
    expect(parseFloat(response.body.longitud)).toBeCloseTo(-69.9, 5);

    // Limpiar
    await deleteTestUbicacion(response.body.id);
  });

  test('Debe rechazar si cliente_id no existe', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: 999999,
        codigo: 'UB-FAIL',
        nombre: 'Ubicación con cliente inexistente'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validación fallida');
    expect(response.body.message).toContain('no existe o está inactivo');
  });

  test('Debe rechazar si cliente está inactivo', async () => {
    // Crear cliente inactivo
    const pool = getTurnosPool();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ot_clientes (codigo, nombre, activo) VALUES (?, ?, FALSE)`,
      ['CLI-INACTIVO', 'Cliente Inactivo']
    );
    const clienteInactivoId = result.insertId;

    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: clienteInactivoId,
        codigo: 'UB-FAIL2',
        nombre: 'Ubicación con cliente inactivo'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('no existe o está inactivo');

    // Limpiar
    await pool.execute(`DELETE FROM ot_clientes WHERE id = ?`, [clienteInactivoId]);
  });

  test('Debe rechazar si código duplicado en mismo cliente', async () => {
    // Crear primera ubicación
    await createTestUbicacion({ codigo: 'UB-DUP' });

    // Intentar crear segunda con mismo código
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-DUP',
        nombre: 'Ubicación Duplicada'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Código duplicado');
    expect(response.body.message).toContain('ya existe para este cliente');

    // Limpiar
    await getTurnosPool().execute(
      `DELETE FROM ot_ubicaciones WHERE cliente_id = ? AND codigo = ?`,
      [testClienteId, 'UB-DUP']
    );
  });

  test('Debe permitir mismo código en diferentes clientes', async () => {
    // Crear segundo cliente
    const pool = getTurnosPool();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ot_clientes (codigo, nombre, activo) VALUES (?, ?, TRUE)`,
      ['CLI-TEST-2', 'Cliente Test 2']
    );
    const cliente2Id = result.insertId;

    // Crear ubicación en cliente 1
    await createTestUbicacion({ codigo: 'UB-SHARED', cliente_id: testClienteId });

    // Crear ubicación en cliente 2 con mismo código (debe permitir)
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: cliente2Id,
        codigo: 'UB-SHARED',
        nombre: 'Ubicación en Cliente 2'
      });

    expect(response.status).toBe(201);
    expect(response.body.codigo).toBe('UB-SHARED');

    // Limpiar
    await pool.execute(`DELETE FROM ot_ubicaciones WHERE codigo = ?`, ['UB-SHARED']);
    await pool.execute(`DELETE FROM ot_clientes WHERE id = ?`, [cliente2Id]);
  });

  test('Debe rechazar coordenadas GPS inválidas - formato incorrecto', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-GPS-BAD',
        nombre: 'Ubicación GPS inválido',
        coordenadas_gps: 'invalid-format'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Datos de entrada inválidos');
  });

  test('Debe rechazar coordenadas GPS inválidas - fuera de rango', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-GPS-BAD2',
        nombre: 'Ubicación GPS fuera de rango',
        coordenadas_gps: '91,-200' // Fuera de rango
      });

    expect(response.status).toBe(400);
    expect(response.body.details).toBeDefined();
  });

  test('Debe rechazar sin autenticación', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-NOAUTH',
        nombre: 'Sin autenticación'
      });

    expect(response.status).toBe(401);
  });

  test('Debe rechazar para rol CONSULTA', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-CONSULTA',
        nombre: 'Con rol consulta'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Acceso denegado');
  });

  test('Debe permitir para rol SUPERVISOR', async () => {
    const response = await request(app)
      .post('/api/ubicaciones')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        cliente_id: testClienteId,
        codigo: 'UB-SUPER',
        nombre: 'Con rol supervisor'
      });

    expect(response.status).toBe(201);

    // Limpiar
    await deleteTestUbicacion(response.body.id);
  });
});

// ============================================================================
// TESTS: GET /api/ubicaciones
// ============================================================================

describe('GET /api/ubicaciones', () => {
  beforeEach(async () => {
    // Crear varias ubicaciones de prueba
    await createTestUbicacion({ codigo: 'UB-01', nombre: 'Ubicación Alfa' });
    await createTestUbicacion({ codigo: 'UB-02', nombre: 'Ubicación Beta' });
    await createTestUbicacion({ codigo: 'UB-03', nombre: 'Ubicación Gamma', provincia: 'Santiago' });
  });

  afterEach(async () => {
    // Limpiar
    await getTurnosPool().execute(`DELETE FROM ot_ubicaciones WHERE cliente_id = ?`, [
      testClienteId
    ]);
  });

  test('Debe listar todas las ubicaciones con paginación', async () => {
    const response = await request(app)
      .get('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, pageSize: 20 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 20);
    expect(response.body).toHaveProperty('totalPages');
    expect(response.body.data.length).toBeGreaterThanOrEqual(3);
  });

  test('Debe filtrar por búsqueda (nombre)', async () => {
    const response = await request(app)
      .get('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'Alfa' });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0].nombre).toContain('Alfa');
  });

  test('Debe filtrar por búsqueda (provincia)', async () => {
    const response = await request(app)
      .get('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'Santiago' });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0].provincia).toBe('Santiago');
  });

  test('Debe filtrar por cliente_id', async () => {
    const response = await request(app)
      .get('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ cliente_id: testClienteId });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    response.body.data.forEach((ubicacion: any) => {
      expect(ubicacion.cliente_id).toBe(testClienteId);
    });
  });

  test('Debe funcionar para todos los roles autenticados', async () => {
    // ADMIN
    let response = await request(app)
      .get('/api/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);

    // SUPERVISOR
    response = await request(app)
      .get('/api/ubicaciones')
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(response.status).toBe(200);

    // CONSULTA
    response = await request(app)
      .get('/api/ubicaciones')
      .set('Authorization', `Bearer ${consultaToken}`);
    expect(response.status).toBe(200);
  });
});

// ============================================================================
// TESTS: GET /api/ubicaciones/:id
// ============================================================================

describe('GET /api/ubicaciones/:id', () => {
  let testUbicacionId: number;

  beforeEach(async () => {
    testUbicacionId = await createTestUbicacion({
      codigo: 'UB-DETAIL',
      nombre: 'Ubicación Detalle'
    });
  });

  afterEach(async () => {
    await deleteTestUbicacion(testUbicacionId);
  });

  test('Debe obtener ubicación con datos de cliente y count de puestos', async () => {
    const response = await request(app)
      .get(`/api/ubicaciones/${testUbicacionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testUbicacionId);
    expect(response.body).toHaveProperty('cliente_nombre');
    expect(response.body).toHaveProperty('puestos_count');
    expect(response.body.puestos_count).toBeGreaterThanOrEqual(0);
  });

  test('Debe retornar 404 si no existe', async () => {
    const response = await request(app)
      .get('/api/ubicaciones/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No encontrado');
  });
});

// ============================================================================
// TESTS: PUT /api/ubicaciones/:id
// ============================================================================

describe('PUT /api/ubicaciones/:id', () => {
  let testUbicacionId: number;

  beforeEach(async () => {
    testUbicacionId = await createTestUbicacion({
      codigo: 'UB-UPDATE',
      nombre: 'Ubicación Original'
    });
  });

  afterEach(async () => {
    await deleteTestUbicacion(testUbicacionId);
  });

  test('Debe actualizar campos editables', async () => {
    const response = await request(app)
      .put(`/api/ubicaciones/${testUbicacionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Ubicación Actualizada',
        direccion: 'Nueva dirección',
        provincia: 'La Vega'
      });

    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe('Ubicación Actualizada');
    expect(response.body.direccion).toBe('Nueva dirección');
    expect(response.body.provincia).toBe('La Vega');
  });

  test('Debe actualizar coordenadas GPS', async () => {
    const response = await request(app)
      .put(`/api/ubicaciones/${testUbicacionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        coordenadas_gps: '19.0,-70.0'
      });

    expect(response.status).toBe(200);
    expect(parseFloat(response.body.latitud)).toBeCloseTo(19.0, 5);
    expect(parseFloat(response.body.longitud)).toBeCloseTo(-70.0, 5);
  });

  test('Debe rechazar código duplicado al cambiar', async () => {
    // Crear segunda ubicación
    await createTestUbicacion({ codigo: 'UB-EXISTING' });

    // Intentar cambiar código a uno existente
    const response = await request(app)
      .put(`/api/ubicaciones/${testUbicacionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'UB-EXISTING'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Código duplicado');

    // Limpiar
    await getTurnosPool().execute(
      `DELETE FROM ot_ubicaciones WHERE cliente_id = ? AND codigo = ?`,
      [testClienteId, 'UB-EXISTING']
    );
  });

  test('Debe rechazar para rol CONSULTA', async () => {
    const response = await request(app)
      .put(`/api/ubicaciones/${testUbicacionId}`)
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        nombre: 'Intento consulta'
      });

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// TESTS: DELETE /api/ubicaciones/:id
// ============================================================================

describe('DELETE /api/ubicaciones/:id', () => {
  test('Debe hacer soft delete si no tiene puestos activos', async () => {
    const ubicacionId = await createTestUbicacion({ codigo: 'UB-DELETE' });

    const response = await request(app)
      .delete(`/api/ubicaciones/${ubicacionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('desactivada exitosamente');

    // Verificar que está inactivo
    const pool = getTurnosPool();
    const [rows] = await pool.execute<any[]>(
      `SELECT activo FROM ot_ubicaciones WHERE id = ?`,
      [ubicacionId]
    );
    expect(rows[0].activo).toBeFalsy();

    // Limpiar
    await deleteTestUbicacion(ubicacionId);
  });

  test('Debe rechazar si tiene puestos activos', async () => {
    const ubicacionId = await createTestUbicacion({ codigo: 'UB-WITH-PUESTOS' });

    // Crear puesto activo en la ubicación
    const pool = getTurnosPool();
    await pool.execute(
      `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, activo) VALUES (?, ?, ?, TRUE)`,
      [ubicacionId, 'P-TEST', 'Puesto Test']
    );

    const response = await request(app)
      .delete(`/api/ubicaciones/${ubicacionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validación fallida');
    expect(response.body.message).toContain('puesto');

    // Limpiar
    await pool.execute(`DELETE FROM ot_puestos WHERE ubicacion_id = ?`, [ubicacionId]);
    await deleteTestUbicacion(ubicacionId);
  });

  test('Debe rechazar para roles no-ADMIN', async () => {
    const ubicacionId = await createTestUbicacion({ codigo: 'UB-DELETE-PERM' });

    // SUPERVISOR (no debe poder)
    let response = await request(app)
      .delete(`/api/ubicaciones/${ubicacionId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(response.status).toBe(403);

    // CONSULTA (no debe poder)
    response = await request(app)
      .delete(`/api/ubicaciones/${ubicacionId}`)
      .set('Authorization', `Bearer ${consultaToken}`);
    expect(response.status).toBe(403);

    // Limpiar
    await deleteTestUbicacion(ubicacionId);
  });
});
