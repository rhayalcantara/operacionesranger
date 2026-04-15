/**
 * Tests Unitarios - Validaciones de Turno
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests para validar schemas Zod de turnos.
 * Valida todas las reglas de negocio definidas en turno.schema.ts
 *
 * VALIDACIONES PROBADAS:
 * - createTurnoSchema: Todos los campos y reglas
 * - updateTurnoSchema: Campos opcionales y reglas
 * - turnoIdSchema: Validación de ID en params
 * - getTurnosQuerySchema: Paginación y filtros
 */

import { describe, it, expect } from '@jest/globals';
import {
  createTurnoSchema,
  updateTurnoSchema,
  turnoIdSchema,
  getTurnosQuerySchema,
} from '../../src/schemas/turno.schema';
import { TipoTurno } from '../../src/models/turno.model';

// ============================================================================
// TESTS: createTurnoSchema
// ============================================================================

describe('createTurnoSchema', () => {
  /**
   * Test 1: Datos válidos completos deben pasar validación
   */
  it('debe aceptar un turno válido completo', () => {
    const validTurno = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
      observaciones: 'Turno normal',
    };

    const result = createTurnoSchema.safeParse(validTurno);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.empleado_id).toBe(1001);
      expect(result.data.puesto_id).toBe(42);
      expect(result.data.horas_normales).toBe(10.0);
      expect(result.data.horas_extras).toBe(2.0);
    }
  });

  /**
   * Test 2: empleado_id inválido debe ser rechazado
   */
  it('debe rechazar empleado_id inválido', () => {
    // String en lugar de número
    const turnoInvalid1 = {
      empleado_id: 'abc',
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid1).success).toBe(false);

    // Número negativo
    const turnoInvalid2 = {
      empleado_id: -5,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid2).success).toBe(false);

    // Cero
    const turnoInvalid3 = {
      empleado_id: 0,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid3).success).toBe(false);
  });

  /**
   * Test 3: puesto_id inválido debe ser rechazado
   */
  it('debe rechazar puesto_id inválido', () => {
    // String en lugar de número
    const turnoInvalid1 = {
      empleado_id: 1001,
      puesto_id: 'xyz',
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid1).success).toBe(false);

    // Número negativo
    const turnoInvalid2 = {
      empleado_id: 1001,
      puesto_id: -10,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid2).success).toBe(false);
  });

  /**
   * Test 4: fecha inválida debe ser rechazada
   */
  it('debe rechazar fecha inválida', () => {
    // Formato incorrecto
    const turnoInvalid1 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '15-01-2026', // Formato DD-MM-YYYY incorrecto
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid1).success).toBe(false);

    // Fecha inválida
    const turnoInvalid2 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-02-30', // 30 de febrero no existe
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid2).success).toBe(false);

    // Fecha muy futura (> 7 días)
    const hoy = new Date();
    const fechaMuyFutura = new Date(hoy);
    fechaMuyFutura.setDate(fechaMuyFutura.getDate() + 15); // 15 días en el futuro
    const fechaStr = fechaMuyFutura.toISOString().split('T')[0];

    const turnoInvalid3 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: fechaStr,
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid3).success).toBe(false);
  });

  /**
   * Test 5: horas_normales inválidas deben ser rechazadas
   */
  it('debe rechazar horas_normales inválidas', () => {
    // Más de 12 horas
    const turnoInvalid1 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 13.0,
      horas_extras: 0.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid1).success).toBe(false);

    // Número negativo
    const turnoInvalid2 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: -2.0,
      horas_extras: 0.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid2).success).toBe(false);

    // String en lugar de número
    const turnoInvalid3 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 'diez',
      horas_extras: 0.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid3).success).toBe(false);
  });

  /**
   * Test 6: horas_extras inválidas deben ser rechazadas
   */
  it('debe rechazar horas_extras inválidas', () => {
    // Más de 4 horas
    const turnoInvalid1 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 5.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid1).success).toBe(false);

    // Número negativo
    const turnoInvalid2 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: -1.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid2).success).toBe(false);
  });

  /**
   * Test 7: horas totales excedidas deben ser rechazadas
   */
  it('debe rechazar cuando horas_normales + horas_extras > 16', () => {
    const turnoInvalid = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 12.0,
      horas_extras: 4.5, // Total: 16.5 > 16
    };

    const result = createTurnoSchema.safeParse(turnoInvalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((e: any) => e.path.includes('horas_totales'));
      expect(error).toBeDefined();
    }
  });

  /**
   * Test 8: hora_entrada/hora_salida inválidas deben ser rechazadas
   */
  it('debe rechazar hora_entrada y hora_salida con formato incorrecto', () => {
    // Formato incorrecto HH:MM (falta :SS)
    const turnoInvalid1 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00', // Formato incorrecto
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid1).success).toBe(false);

    // Hora inválida (25:00:00)
    const turnoInvalid2 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '25:00:00', // Hora inválida
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid2).success).toBe(false);

    // Minutos inválidos (06:60:00)
    const turnoInvalid3 = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:60:00', // Minutos inválidos
      horas_normales: 10.0,
      horas_extras: 2.0,
    };
    expect(createTurnoSchema.safeParse(turnoInvalid3).success).toBe(false);
  });

  /**
   * Test 9: observaciones muy largas deben ser rechazadas
   */
  it('debe rechazar observaciones que excedan 1000 caracteres', () => {
    const observacionesLargas = 'A'.repeat(1001); // 1001 caracteres

    const turnoInvalid = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
      observaciones: observacionesLargas,
    };

    expect(createTurnoSchema.safeParse(turnoInvalid).success).toBe(false);
  });

  /**
   * Test 10: observaciones opcionales deben ser aceptadas
   */
  it('debe aceptar turno sin observaciones (campo opcional)', () => {
    const turnoSinObservaciones = {
      empleado_id: 1001,
      puesto_id: 42,
      fecha: '2026-01-15',
      hora_entrada: '06:00:00',
      hora_salida: '18:00:00',
      horas_normales: 10.0,
      horas_extras: 2.0,
    };

    const result = createTurnoSchema.safeParse(turnoSinObservaciones);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// TESTS: updateTurnoSchema
// ============================================================================

describe('updateTurnoSchema', () => {
  /**
   * Test 11: Actualización parcial válida debe ser aceptada
   */
  it('debe aceptar actualización parcial de campos', () => {
    const updateValido = {
      horas_normales: 11.0,
      horas_extras: 3.0,
    };

    const result = updateTurnoSchema.safeParse(updateValido);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.horas_normales).toBe(11.0);
      expect(result.data.horas_extras).toBe(3.0);
    }
  });

  /**
   * Test 12: Actualización sin campos debe ser rechazada
   */
  it('debe rechazar actualización sin ningún campo', () => {
    const updateVacio = {};

    const result = updateTurnoSchema.safeParse(updateVacio);
    expect(result.success).toBe(false);
  });

  /**
   * Test 13: Actualización con horas totales > 16 debe ser rechazada
   */
  it('debe rechazar actualización si horas_normales + horas_extras > 16', () => {
    const updateInvalido = {
      horas_normales: 12.0,
      horas_extras: 4.5, // Total: 16.5 > 16
    };

    const result = updateTurnoSchema.safeParse(updateInvalido);
    expect(result.success).toBe(false);
  });

  /**
   * Test 14: Actualización solo de observaciones debe ser aceptada
   */
  it('debe aceptar actualización solo de observaciones', () => {
    const updateObservaciones = {
      observaciones: 'Turno con incidente menor',
    };

    const result = updateTurnoSchema.safeParse(updateObservaciones);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// TESTS: turnoIdSchema
// ============================================================================

describe('turnoIdSchema', () => {
  /**
   * Test 15: ID válido debe ser aceptado
   */
  it('debe aceptar ID numérico válido', () => {
    const validId = { id: '123' };

    const result = turnoIdSchema.safeParse(validId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(123); // Debe transformar a número
      expect(typeof result.data.id).toBe('number');
    }
  });

  /**
   * Test 16: ID inválido debe ser rechazado
   */
  it('debe rechazar ID no numérico', () => {
    const invalidId1 = { id: 'abc' };
    expect(turnoIdSchema.safeParse(invalidId1).success).toBe(false);

    const invalidId2 = { id: '-5' };
    expect(turnoIdSchema.safeParse(invalidId2).success).toBe(false);

    const invalidId3 = { id: '0' };
    expect(turnoIdSchema.safeParse(invalidId3).success).toBe(false);
  });
});

// ============================================================================
// TESTS: getTurnosQuerySchema
// ============================================================================

describe('getTurnosQuerySchema', () => {
  /**
   * Test 17: Query params de paginación válidos deben ser aceptados
   */
  it('debe aceptar query params de paginación válidos', () => {
    const validQuery = {
      page: '2',
      pageSize: '20',
    };

    const result = getTurnosQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(20);
    }
  });

  /**
   * Test 18: Filtros de fecha válidos deben ser aceptados
   */
  it('debe aceptar filtros de fecha válidos', () => {
    const validQuery = {
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-01-31',
    };

    const result = getTurnosQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fecha_inicio).toBe('2026-01-01');
      expect(result.data.fecha_fin).toBe('2026-01-31');
    }
  });

  /**
   * Test 19: fecha_inicio > fecha_fin debe ser rechazado
   */
  it('debe rechazar cuando fecha_inicio es posterior a fecha_fin', () => {
    const invalidQuery = {
      fecha_inicio: '2026-01-31',
      fecha_fin: '2026-01-01',
    };

    const result = getTurnosQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  /**
   * Test 20: Filtros de tipo_turno válidos deben ser aceptados
   */
  it('debe aceptar tipo_turno válido (DIURNO o NOCTURNO)', () => {
    const validQuery1 = { tipo_turno: 'DIURNO' };
    const result1 = getTurnosQuerySchema.safeParse(validQuery1);
    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.tipo_turno).toBe(TipoTurno.DIURNO);
    }

    const validQuery2 = { tipo_turno: 'NOCTURNO' };
    const result2 = getTurnosQuerySchema.safeParse(validQuery2);
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.tipo_turno).toBe(TipoTurno.NOCTURNO);
    }
  });

  /**
   * Test 21: tipo_turno inválido debe ser rechazado
   */
  it('debe rechazar tipo_turno inválido', () => {
    const invalidQuery = { tipo_turno: 'MIXTO' };

    const result = getTurnosQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  /**
   * Test 22: Filtros booleanos (es_feriado, procesado_nomina) deben ser aceptados
   */
  it('debe aceptar filtros booleanos válidos', () => {
    const validQuery = {
      es_feriado: 'true',
      procesado_nomina: 'false',
    };

    const result = getTurnosQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.es_feriado).toBe(true);
      expect(result.data.procesado_nomina).toBe(false);
    }
  });

  /**
   * Test 23: Filtros de IDs (empleado_id, puesto_id) válidos deben ser aceptados
   */
  it('debe aceptar filtros de IDs válidos', () => {
    const validQuery = {
      empleado_id: '1001',
      puesto_id: '42',
      ubicacion_id: '10',
      cliente_id: '5',
    };

    const result = getTurnosQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.empleado_id).toBe(1001);
      expect(result.data.puesto_id).toBe(42);
      expect(result.data.ubicacion_id).toBe(10);
      expect(result.data.cliente_id).toBe(5);
    }
  });

  /**
   * Test 24: pageSize fuera de rango debe ser rechazado
   */
  it('debe rechazar pageSize fuera de rango (1-100)', () => {
    const invalidQuery1 = { pageSize: '0' };
    expect(getTurnosQuerySchema.safeParse(invalidQuery1).success).toBe(false);

    const invalidQuery2 = { pageSize: '101' };
    expect(getTurnosQuerySchema.safeParse(invalidQuery2).success).toBe(false);
  });
});
