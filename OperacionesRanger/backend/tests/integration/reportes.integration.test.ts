/**
 * Tests de Integración: Endpoint POST /api/reportes/nomina
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Suite de tests para validar la generación de reportes CSV para nómina.
 * Valida schemas Zod, validaciones de rango de fechas, formato CSV,
 * encoding UTF-8 BOM, y permisos de acceso.
 *
 * @group integration
 * @group reportes
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Get database connections
const db = getTurnosPool();
const dbRRHH = getTurnosPool();

// ============================================================================
// VARIABLES GLOBALES PARA TESTS
// ============================================================================

let authTokenAdmin: string;
let authTokenSupervisor: string;
let authTokenConsulta: string;

let testEmpleadoId: number;
let testClienteId: number;
let testUbicacionId: number;
let testPuestoId: number;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

beforeAll(async () => {
  // 1. Crear usuarios de prueba y obtener tokens
  await createTestUsers();
  authTokenAdmin = await getAuthToken(TEST_USERS.admin.username, TEST_USERS.admin.password);
  authTokenSupervisor = await getAuthToken(TEST_USERS.supervisor.username, TEST_USERS.supervisor.password);
  authTokenConsulta = await getAuthToken(TEST_USERS.consulta.username, TEST_USERS.consulta.password);

  // 2. Crear datos de prueba en BD RRHH
  testEmpleadoId = await createTestEmpleadoRRHH();

  // 3. Crear datos de prueba en BD Turnos
  testClienteId = await createTestCliente();
  testUbicacionId = await createTestUbicacion(testClienteId);
  testPuestoId = await createTestPuesto(testUbicacionId);

  // 4. Crear feriado de prueba
  await createTestFeriado();
});

afterAll(async () => {
  // Limpiar datos de prueba
  await cleanupTestData();
});

afterEach(async () => {
  // Limpiar turnos después de cada test
  await db.query('DELETE FROM ot_turnos WHERE puesto_id = ?', [testPuestoId]);
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const TEST_USERS = {
  admin: { username: 'test_admin_reportes', password: 'AdminReportes123!', email: 'admin_reportes@test.com', rol: 'ADMIN' },
  supervisor: { username: 'test_sup_reportes', password: 'SuperReportes123!', email: 'sup_reportes@test.com', rol: 'SUPERVISOR' },
  consulta: { username: 'test_cons_reportes', password: 'ConsReportes123!', email: 'cons_reportes@test.com', rol: 'CONSULTA' },
};

let testAdminUserId: number;
let testSupervisorUserId: number;
let testConsultaUserId: number;

async function createTestUsers(): Promise<void> {
  const usernames = [TEST_USERS.admin.username, TEST_USERS.supervisor.username, TEST_USERS.consulta.username];
  await db.execute(
    `DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`,
    usernames
  );
  await db.execute(
    `DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (SELECT id_usuario FROM ot_sys_usuarios WHERE username IN (?, ?, ?))`,
    usernames
  );
  await db.execute(`DELETE FROM ot_sys_usuarios WHERE username IN (?, ?, ?)`, usernames);

  const [r1] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo) VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.admin.username, hashPasswordSync(TEST_USERS.admin.password), TEST_USERS.admin.email, 'Admin Reportes', TEST_USERS.admin.rol]
  );
  testAdminUserId = r1.insertId;

  const [r2] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo) VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.supervisor.username, hashPasswordSync(TEST_USERS.supervisor.password), TEST_USERS.supervisor.email, 'Supervisor Reportes', TEST_USERS.supervisor.rol]
  );
  testSupervisorUserId = r2.insertId;

  const [r3] = await db.execute<any>(
    `INSERT INTO ot_sys_usuarios (username, password_hash, email, nombre_completo, rol, activo) VALUES (?, ?, ?, ?, ?, TRUE)`,
    [TEST_USERS.consulta.username, hashPasswordSync(TEST_USERS.consulta.password), TEST_USERS.consulta.email, 'Consulta Reportes', TEST_USERS.consulta.rol]
  );
  testConsultaUserId = r3.insertId;
}

async function getAuthToken(username: string, password: string): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({ username, password });
  return response.body.accessToken;
}

async function createTestEmpleadoRRHH(): Promise<number> {
  const cedula = `TEST-REPORTE-${Date.now()}-${Math.random().toString().substring(2, 6)}`;

  const [result] = await dbRRHH.query<ResultSetHeader>(
    `INSERT INTO rh_empleado
     (cedula_empleado, nombres, apellidos, fecha_ingreso, id_puesto, status)
     VALUES (?, ?, ?, CURDATE(), 97, 1)`,
    [cedula, 'Juan', 'Reporte Test']
  );

  return result.insertId;
}

async function createTestCliente(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_clientes (codigo, nombre, activo)
     VALUES (?, ?, true)`,
    ['CLI-RPT', 'Cliente Test Reporte']
  );

  return result.insertId;
}

async function createTestUbicacion(clienteId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_ubicaciones (cliente_id, codigo, nombre, activo)
     VALUES (?, ?, ?, true)`,
    [clienteId, 'UBI-RPT', 'Ubicación Test Reporte']
  );

  return result.insertId;
}

async function createTestPuesto(ubicacionId: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_puestos (ubicacion_id, codigo, nombre, activo)
     VALUES (?, ?, ?, true)`,
    [ubicacionId, 'P-RPT', 'Puesto Test Reporte']
  );

  return result.insertId;
}

async function createTestFeriado(): Promise<number> {
  // Crear feriado para una fecha específica de prueba
  const fecha = '2026-01-21'; // Día de la Virgen de la Altagracia

  // Verificar si ya existe
  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM ot_feriados WHERE fecha = ?',
    [fecha]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_feriados (fecha, nombre, tipo)
     VALUES (?, ?, 'NACIONAL')`,
    [fecha, 'Virgen de la Altagracia']
  );

  return result.insertId;
}

async function createTestTurno(
  fecha: string,
  horasNormales: number = 10,
  horasExtras: number = 2,
  procesado: boolean = false
): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_turnos
     (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras,
      tipo_turno, es_feriado, procesado_nomina, created_by)
     VALUES (?, ?, ?, '06:00:00', '18:00:00', ?, ?, 'DIURNO', false, ?, ?)`,
    [testEmpleadoId, testPuestoId, fecha, horasNormales, horasExtras, procesado, testAdminUserId]
  );

  return result.insertId;
}

async function cleanupTestData(): Promise<void> {
  // Limpiar en orden inverso a la creación (respetar FKs)
  await db.query('DELETE FROM ot_turnos WHERE puesto_id = ?', [testPuestoId]);
  await db.query('DELETE FROM ot_puestos WHERE id = ?', [testPuestoId]);
  await db.query('DELETE FROM ot_ubicaciones WHERE id = ?', [testUbicacionId]);
  await db.query('DELETE FROM ot_clientes WHERE id = ?', [testClienteId]);
  await dbRRHH.query('DELETE FROM rh_empleado WHERE id_empleado = ?', [testEmpleadoId]);

  const userIds = [testAdminUserId, testSupervisorUserId, testConsultaUserId].filter(Boolean);
  if (userIds.length > 0) {
    const ph = userIds.map(() => '?').join(',');
    await db.execute(`DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (${ph})`, userIds);
    await db.execute(`DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (${ph})`, userIds);
    await db.execute(`DELETE FROM ot_sys_usuarios WHERE id_usuario IN (${ph})`, userIds);
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('POST /api/reportes/nomina', () => {
  // ==========================================================================
  // GRUPO 1: GENERACIÓN EXITOSA (3 tests)
  // ==========================================================================

  describe('Generación exitosa', () => {
    it('Test 1: Debe generar reporte CSV con datos (2+ turnos)', async () => {
      // Crear 2 turnos NO procesados
      await createTestTurno('2026-01-02', 10, 2, false);
      await createTestTurno('2026-01-03', 10, 0, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('nomina_20260101_20260115.csv');

      // Verificar contenido CSV
      const csv = response.text;
      expect(csv.startsWith('\uFEFF')).toBe(true); // BOM UTF-8
      expect(csv).toContain('fecha,empleado_id,puesto_codigo');
      expect(csv).toContain('2026-01-02');
      expect(csv).toContain('2026-01-03');

      // Verificar que tiene al menos 3 líneas (headers + 2 turnos)
      const lines = csv.split('\n').filter((l) => l.trim() !== '');
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });

    it('Test 2: Debe generar reporte vacío (sin turnos en rango) - solo headers', async () => {
      // NO crear turnos, o crearlos fuera del rango
      await createTestTurno('2025-12-15', 10, 0, false); // Fuera del rango

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');

      const csv = response.text;
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('fecha,empleado_id,puesto_codigo');

      // Solo debe tener 2 líneas: BOM + headers
      const lines = csv.split('\n').filter((l) => l.trim() !== '');
      expect(lines.length).toBe(1); // Solo headers
    });

    it('Test 3: Debe verificar formato CSV correcto (headers, columnas, decimales)', async () => {
      await createTestTurno('2026-01-02', 10.5, 2.25, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);

      const csv = response.text;
      const lines = csv.split('\n');

      // Verificar headers
      const headerLine = lines[0].replace('\uFEFF', ''); // Remover BOM
      expect(headerLine).toBe(
        'fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo'
      );

      // Verificar que hay al menos una fila de datos
      expect(lines.length).toBeGreaterThan(1);

      // Verificar formato de decimales (deben tener 2 decimales)
      const dataLine = lines[1];
      const columns = dataLine.split(',');
      expect(columns[3]).toMatch(/^\d+\.\d{2}$/); // horas_normales: XX.XX
      expect(columns[4]).toMatch(/^\d+\.\d{2}$/); // horas_extras: XX.XX
      expect(columns[8]).toMatch(/^\d+\.\d{2}$/); // incentivo: XX.XX
    });
  });

  // ==========================================================================
  // GRUPO 2: VALIDACIÓN DE FECHAS (3 tests)
  // ==========================================================================

  describe('Validación de fechas', () => {
    it('Test 4: Debe rechazar si fecha_inicio > fecha_fin (400)', async () => {
      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-31',
          fecha_fin: '2026-01-01', // Fecha fin ANTES que inicio
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('no puede ser mayor');
    });

    it('Test 5: Debe rechazar si rango > 31 días (400)', async () => {
      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-03-01', // 59 días
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('excede el máximo permitido de 31 días');
    });

    it('Test 6: Debe rechazar si formato de fecha inválido (400)', async () => {
      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '01/01/2026', // Formato incorrecto
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  // ==========================================================================
  // GRUPO 3: ENCODING Y FORMATO (2 tests)
  // ==========================================================================

  describe('Encoding y formato', () => {
    it('Test 7: Debe verificar UTF-8 con BOM (\\uFEFF al inicio)', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);

      const csv = response.text;

      // Verificar que empieza con BOM UTF-8
      expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM character code
      expect(csv.startsWith('\uFEFF')).toBe(true);
    });

    it('Test 8: Debe verificar decimales con exactamente 2 posiciones', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);

      const csv = response.text;
      const lines = csv.split('\n');
      const dataLine = lines[1]; // Primera línea de datos
      const columns = dataLine.split(',');

      // horas_normales, horas_extras, incentivo deben tener exactamente 2 decimales
      expect(columns[3]).toMatch(/^\d+\.\d{2}$/);
      expect(columns[4]).toMatch(/^\d+\.\d{2}$/);
      expect(columns[8]).toMatch(/^\d+\.\d{2}$/);

      // Verificar que 10.00 no se convierte a 10
      expect(columns[3]).toBe('10.00');
      expect(columns[4]).toBe('2.00');
    });
  });

  // ==========================================================================
  // GRUPO 4: PERMISOS (4 tests)
  // ==========================================================================

  describe('Permisos de acceso', () => {
    it('Test 9: ADMIN puede generar reporte (200)', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('Test 10: SUPERVISOR puede generar reporte (200)', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenSupervisor}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('Test 11: CONSULTA no puede generar reporte (403)', async () => {
      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenConsulta}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('Test 12: Sin autenticación debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/reportes/nomina')
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // GRUPO 5: HEADERS HTTP (2 tests - opcionales, total 14)
  // ==========================================================================

  describe('Headers HTTP', () => {
    it('Test 13: Content-Type debe ser text/csv; charset=utf-8', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    });

    it('Test 14: Content-Disposition debe tener filename correcto', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/nomina')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="nomina_20260101_20260115.csv"'
      );
    });
  });
});

// ============================================================================
// TESTS: POST /api/reportes/marcar-procesados
// ============================================================================

describe('POST /api/reportes/marcar-procesados', () => {
  // ==========================================================================
  // GRUPO 1: OPERACIÓN EXITOSA (3 tests)
  // ==========================================================================

  describe('Operación exitosa', () => {
    it('Test 1: Debe marcar turnos como procesados (3 turnos, 200 OK)', async () => {
      // Crear 3 turnos NO procesados en rango
      const turno1 = await createTestTurno('2026-01-02', 10, 2, false);
      const turno2 = await createTestTurno('2026-01-03', 10, 0, false);
      const turno3 = await createTestTurno('2026-01-05', 8, 2, false);

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125,
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBe(3);
      expect(response.body.nomina_id).toBe(125);
      expect(response.body.fecha_inicio).toBe('2026-01-01');
      expect(response.body.fecha_fin).toBe('2026-01-15');

      // Verificar en BD que los turnos están procesados
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, procesado_nomina, nomina_id FROM ot_turnos WHERE id IN (?, ?, ?)',
        [turno1, turno2, turno3]
      );

      expect(rows.length).toBe(3);
      rows.forEach((row) => {
        expect(row.procesado_nomina).toBe(1); // MySQL boolean = TINYINT(1)
        expect(row.nomina_id).toBe(125);
      });
    });

    it('Test 2: No debe actualizar turnos YA procesados', async () => {
      // Crear 2 turnos NO procesados
      await createTestTurno('2026-01-02', 10, 2, false);
      await createTestTurno('2026-01-03', 10, 0, false);

      // Crear 1 turno YA procesado con nomina_id = 100
      await db.query(
        `INSERT INTO ot_turnos
         (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras,
          tipo_turno, es_feriado, procesado_nomina, nomina_id, created_by)
         VALUES (?, ?, '2026-01-04', '06:00:00', '18:00:00', 10, 2, 'DIURNO', false, true, 100, 1)`,
        [testEmpleadoId, testPuestoId]
      );

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125,
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBe(2); // Solo 2, no 3

      // Verificar que el turno ya procesado sigue con nomina_id = 100
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT procesado_nomina, nomina_id FROM ot_turnos
         WHERE fecha = '2026-01-04' AND puesto_id = ?`,
        [testPuestoId]
      );

      expect(rows.length).toBe(1);
      expect(rows[0].procesado_nomina).toBe(1);
      expect(rows[0].nomina_id).toBe(100); // NO debe cambiar a 125
    });

    it('Test 3: Debe retornar 0 si no hay turnos en rango', async () => {
      // Crear turno fuera del rango
      await createTestTurno('2025-12-15', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125,
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBe(0);
      expect(response.body.nomina_id).toBe(125);
    });
  });

  // ==========================================================================
  // GRUPO 2: VALIDACIÓN DE BODY (3 tests)
  // ==========================================================================

  describe('Validación de body', () => {
    it('Test 4: Debe rechazar si nomina_id no es número (400)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 'ABC', // String inválido
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('Test 5: Debe rechazar si nomina_id es negativo o cero (400)', async () => {
      const responseNegativo = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: -5,
        });

      expect(responseNegativo.status).toBe(400);
      expect(responseNegativo.body.error).toBeDefined();

      const responseCero = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 0,
        });

      expect(responseCero.status).toBe(400);
      expect(responseCero.body.error).toBeDefined();
    });

    it('Test 6: Debe rechazar si fecha_inicio > fecha_fin (400)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-31',
          fecha_fin: '2026-01-01', // Fecha fin ANTES que inicio
          nomina_id: 125,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  // ==========================================================================
  // GRUPO 3: PERMISOS (4 tests)
  // ==========================================================================

  describe('Permisos de acceso', () => {
    it('Test 7: ADMIN puede marcar como procesados (200)', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125,
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBeGreaterThanOrEqual(0);
      expect(response.body.nomina_id).toBe(125);
    });

    it('Test 8: SUPERVISOR NO puede marcar como procesados (403)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenSupervisor}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('Test 9: CONSULTA NO puede marcar como procesados (403)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenConsulta}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('Test 10: Sin autenticación debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125,
        });

      expect(response.status).toBe(401);
    });
  });
});
