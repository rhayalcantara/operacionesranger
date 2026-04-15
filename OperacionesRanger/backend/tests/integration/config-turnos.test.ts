/**
 * Tests de Integración - Endpoints de Configuración de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests con Supertest para endpoints:
 * - GET /api/configuracion-turnos
 * - GET /api/configuracion-turnos/:id
 * - PUT /api/configuracion-turnos/:id
 *
 * NO incluye tests de POST y DELETE (no permitidos)
 *
 * Configuración:
 * - Usa base de datos de prueba (configurar en .env.test)
 * - Crea usuario ADMIN y SUPERVISOR de prueba en setup
 * - Resetea configuraciones a valores por defecto después de tests
 */

import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { UserRole } from '../../src/models/auth.model';
import { resetToDefaults } from '../../src/services/config-turnos.service';

// ============================================================================
// CONFIGURACIÓN DE TESTS
// ============================================================================

// Usuario ADMIN de prueba
const ADMIN_USER = {
  username: 'test_admin_configturnos',
  password: 'AdminPassword123!',
  email: 'admin_configturnos@test.com',
  nombre_completo: 'Admin de Prueba Config Turnos',
  rol: UserRole.ADMIN,
};

// Usuario SUPERVISOR de prueba (sin permisos para UPDATE)
const SUPERVISOR_USER = {
  username: 'test_supervisor_configturnos',
  password: 'SupervisorPassword123!',
  email: 'supervisor_configturnos@test.com',
  nombre_completo: 'Supervisor de Prueba Config Turnos',
  rol: UserRole.SUPERVISOR,
};

let adminUserId: number;
let supervisorUserId: number;
let adminAccessToken: string;
let supervisorAccessToken: string;

// ============================================================================
// SETUP Y TEARDOWN
// ============================================================================

/**
 * Setup antes de todos los tests
 * Crear usuarios de prueba
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

  // Resetear configuraciones a valores por defecto
  await resetToDefaults();
});

/**
 * Cleanup después de todos los tests
 * Resetear configuraciones y eliminar usuarios de prueba
 */
afterAll(async () => {
  const pool = getTurnosPool();

  // Resetear configuraciones a valores por defecto
  await resetToDefaults();

  // Eliminar refresh tokens de usuarios de prueba
  await pool.execute(
    'DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (?, ?)',
    [adminUserId, supervisorUserId]
  );

  // Eliminar usuarios de prueba
  await pool.execute(
    'DELETE FROM ot_sys_usuarios WHERE id_usuario IN (?, ?)',
    [adminUserId, supervisorUserId]
  );
});

/**
 * Resetear configuraciones después de cada test
 */
afterEach(async () => {
  await resetToDefaults();
});

// ============================================================================
// TESTS - GET /api/configuracion-turnos
// ============================================================================

describe('GET /api/configuracion-turnos', () => {
  it('Debe retornar 401 si no está autenticado', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('No autorizado');
  });

  it('Debe retornar todas las configuraciones (2) para ADMIN autenticado', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body.total).toBe(2);
    expect(response.body.data).toHaveLength(2);

    // Verificar que existan DIURNO y NOCTURNO
    const tipos = response.body.data.map((c: any) => c.tipo_turno);
    expect(tipos).toContain('DIURNO');
    expect(tipos).toContain('NOCTURNO');
  });

  it('Debe retornar todas las configuraciones para SUPERVISOR autenticado', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos')
      .set('Authorization', `Bearer ${supervisorAccessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body.total).toBe(2);
  });

  it('Cada configuración debe tener los campos correctos', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    const config = response.body.data[0];

    expect(config).toHaveProperty('id');
    expect(config).toHaveProperty('tipo_turno');
    expect(config).toHaveProperty('hora_inicio');
    expect(config).toHaveProperty('hora_fin');
    expect(config).toHaveProperty('descripcion');
    expect(config).toHaveProperty('activo');
    expect(config).toHaveProperty('created_at');
    expect(config).toHaveProperty('updated_at');
  });
});

// ============================================================================
// TESTS - GET /api/configuracion-turnos/:id
// ============================================================================

describe('GET /api/configuracion-turnos/:id', () => {
  it('Debe retornar 401 si no está autenticado', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos/1')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('Debe retornar configuración DIURNO por ID (1)', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('tipo_turno', 'DIURNO');
    expect(response.body).toHaveProperty('hora_inicio');
    expect(response.body).toHaveProperty('hora_fin');
  });

  it('Debe retornar configuración NOCTURNO por ID (2)', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos/2')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', 2);
    expect(response.body).toHaveProperty('tipo_turno', 'NOCTURNO');
  });

  it('Debe retornar 400 con ID inválido (0)', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos/0')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Datos de entrada inválidos');
  });

  it('Debe retornar 400 con ID inválido (3)', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos/3')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Datos de entrada inválidos');
  });

  it('Debe retornar 400 con ID no numérico', async () => {
    const response = await request(app)
      .get('/api/configuracion-turnos/abc')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Datos de entrada inválidos');
  });
});

// ============================================================================
// TESTS - PUT /api/configuracion-turnos/:id
// ============================================================================

describe('PUT /api/configuracion-turnos/:id', () => {
  it('Debe retornar 401 si no está autenticado', async () => {
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .send({ descripcion: 'Nueva descripción' })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('Debe retornar 403 si usuario es SUPERVISOR (sin permisos)', async () => {
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${supervisorAccessToken}`)
      .send({ descripcion: 'Nueva descripción' })
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Acceso denegado');
  });

  it('Debe actualizar descripción de configuración DIURNO (ADMIN)', async () => {
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ descripcion: 'Turno diurno actualizado por test' })
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Configuración actualizada exitosamente');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('descripcion', 'Turno diurno actualizado por test');
  });

  it('Debe actualizar campo activo de configuración', async () => {
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ activo: false })
      .expect(200);

    expect(response.body.data).toHaveProperty('activo', false);
  });

  it('Debe actualizar horarios complementarios correctamente', async () => {
    // Re-activar config 1 si fue desactivado por test anterior
    await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ activo: true });

    // Actualizar DIURNO manteniendo complementariedad con NOCTURNO (18:00-06:00)
    // DIURNO debe terminar donde NOCTURNO empieza (18:00) y empezar donde NOCTURNO termina (06:00)
    const response1 = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hora_inicio: '06:00:00',
        hora_fin: '18:00:00',
      })
      .expect(200);

    expect(response1.body.data).toHaveProperty('hora_inicio', '06:00:00');
    expect(response1.body.data).toHaveProperty('hora_fin', '18:00:00');

    // Actualizar NOCTURNO manteniendo complementariedad con DIURNO (06:00-18:00)
    const response2 = await request(app)
      .put('/api/configuracion-turnos/2')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hora_inicio: '18:00:00',
        hora_fin: '06:00:00',
      })
      .expect(200);

    expect(response2.body.data).toHaveProperty('hora_inicio', '18:00:00');
    expect(response2.body.data).toHaveProperty('hora_fin', '06:00:00');
  });

  it('Debe retornar 400 si horarios no son complementarios', async () => {
    // Intentar actualizar DIURNO con horarios incompatibles
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hora_inicio: '06:00:00',
        hora_fin: '20:00:00', // No complementa con NOCTURNO (18:00-06:00)
      })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validación fallida');
    expect(response.body.message).toContain('debe terminar');
  });

  it('Debe retornar 400 con formato de hora inválido', async () => {
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hora_inicio: '25:00:00', // Hora inválida
        hora_fin: '18:00:00',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Datos de entrada inválidos');
  });

  it('Debe retornar 400 si solo se proporciona hora_inicio sin hora_fin', async () => {
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hora_inicio: '07:00:00',
        // falta hora_fin
      })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Datos de entrada inválidos');
    expect(response.body.details[0].message).toContain('tanto hora_inicio como hora_fin');
  });

  it('Debe aceptar formato HH:MM (sin segundos)', async () => {
    // Usar horarios que complementen con NOCTURNO (18:00-06:00)
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hora_inicio: '06:00', // Sin :00 al final
        hora_fin: '18:00',
      })
      .expect(200);

    // Debe normalizar a HH:MM:SS
    expect(response.body.data).toHaveProperty('hora_inicio', '06:00:00');
    expect(response.body.data).toHaveProperty('hora_fin', '18:00:00');
  });

  it('Debe retornar 400 si no se proporciona ningún campo', async () => {
    const response = await request(app)
      .put('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({}) // Body vacío
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Datos de entrada inválidos');
  });
});

// ============================================================================
// TESTS - Métodos NO PERMITIDOS
// ============================================================================

describe('POST /api/configuracion-turnos (NO PERMITIDO)', () => {
  it('Debe retornar 405 Method Not Allowed', async () => {
    const response = await request(app)
      .post('/api/configuracion-turnos')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        tipo_turno: 'OTRO',
        hora_inicio: '00:00:00',
        hora_fin: '12:00:00',
      })
      .expect(405);

    expect(response.body).toHaveProperty('error', 'Método no permitido');
    expect(response.body.message).toContain('No se pueden crear nuevas configuraciones');
  });
});

describe('DELETE /api/configuracion-turnos/:id (NO PERMITIDO)', () => {
  it('Debe retornar 405 Method Not Allowed', async () => {
    const response = await request(app)
      .delete('/api/configuracion-turnos/1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(405);

    expect(response.body).toHaveProperty('error', 'Método no permitido');
    expect(response.body.message).toContain('No se pueden eliminar configuraciones');
  });
});
