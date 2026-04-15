# Plan: T2.18 - Modelo y validaciones de Turnos

**Fecha**: 2026-01-18
**Tarea padre**: T2.18
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas

## Objetivo

Crear el modelo TypeScript completo para la entidad Turno con todas sus interfaces, DTOs, validaciones con Zod y tests unitarios. Este modelo será la base para los endpoints de turnos que se implementarán en T2.19.

## Contexto

- La tabla `turnos` es el corazón del sistema de gestión de turnos
- Tiene campos auto-calculados: `tipo_turno` (DIURNO/NOCTURNO) y `es_feriado`
- Requiere validaciones de negocio estrictas:
  - Límites de horas: normales <= 12, extras <= 4, total <= 16
  - No duplicados por empleado+puesto+fecha
  - Validación de empleado activo en BD RRHH
  - Validación de puesto activo
- Usa Zod para schemas de validación (ya implementado en el proyecto)
- Patrón existente en modelos: puesto.model.ts, feriado.model.ts
- Tests existentes como referencia: feriados.test.ts

## Subtareas

### 1. Crear interfaces y tipos del modelo (turno.model.ts)

**Descripción**: Definir todas las interfaces TypeScript para la entidad Turno
**Archivos a crear**: `backend/src/models/turno.model.ts`
**Resultado esperado**: Archivo con interfaces completas y bien documentadas

Elementos a incluir:
- Interface principal `Turno` (todos los campos de la tabla)
- Enum `TipoTurno` (DIURNO, NOCTURNO)
- DTOs: `CreateTurnoDTO`, `UpdateTurnoDTO`
- Interface `PaginatedTurnosDTO`
- Interface `TurnoConRelaciones` (con info de empleado, puesto, ubicación)
- Utility types: `NuevoTurnoDB`, `TurnoActualizable`
- Constantes de validación: `TURNO_VALIDATION`
- Type guards: `isTurno()`, `isTipoTurno()`
- Helper functions: `dtoToNuevoTurnoDB()`, `dtoToTurnoActualizable()`

### 2. Crear schemas de validación Zod (turno.schema.ts)

**Descripción**: Definir schemas Zod para validar requests de la API
**Archivos a crear**: `backend/src/schemas/turno.schema.ts`
**Resultado esperado**: Schemas completos con todas las reglas de negocio

Schemas a crear:
- `createTurnoSchema`: Validación para POST /api/turnos
  - empleado_id: número positivo requerido
  - puesto_id: número positivo requerido
  - fecha: formato YYYY-MM-DD, no futura > 7 días
  - hora_entrada, hora_salida: formato HH:MM:SS
  - horas_normales: decimal 0-12
  - horas_extras: decimal 0-4
  - observaciones: opcional, max 1000 caracteres
  - Validación custom: horas_normales + horas_extras <= 16
- `updateTurnoSchema`: Similar pero todos opcionales
- `turnoIdSchema`: Validación de params.id
- `getTurnosQuerySchema`: Paginación + filtros (fecha_inicio, fecha_fin, empleado_id, puesto_id, tipo_turno, procesado_nomina)
- Types inferidos de schemas

### 3. Crear archivo de tipos compartidos (turno.types.ts)

**Descripción**: Crear archivo de tipos/interfaces en directorio types/
**Archivos a crear**: `backend/src/types/turno.types.ts`
**Resultado esperado**: Exportación centralizada de tipos

Contenido:
- Re-exportar interfaces principales de turno.model.ts
- Re-exportar tipos inferidos de turno.schema.ts
- Tipos específicos para respuestas de API

### 4. Actualizar index de modelos

**Descripción**: Agregar exportaciones del nuevo modelo
**Archivos a modificar**: `backend/src/models/index.ts`
**Resultado esperado**: Modelo exportado centralmente

### 5. Crear tests unitarios de validaciones

**Descripción**: Tests para validar schemas de Zod
**Archivos a crear**: `backend/tests/unit/turno.validation.test.ts`
**Resultado esperado**: Mínimo 10 tests pasando

Tests a implementar:
1. **Test de createTurnoSchema válido**: Datos correctos pasan validación
2. **Test empleado_id inválido**: Debe rechazar strings, negativos, cero
3. **Test puesto_id inválido**: Debe rechazar strings, negativos, cero
4. **Test fecha inválida**: Rechazar formato incorrecto, fecha futura > 7 días
5. **Test horas_normales inválidas**: Rechazar > 12, negativas, strings
6. **Test horas_extras inválidas**: Rechazar > 4, negativas, strings
7. **Test horas totales excedidas**: Rechazar cuando normales + extras > 16
8. **Test hora_entrada/salida inválidas**: Rechazar formatos incorrectos
9. **Test updateTurnoSchema**: Validar actualización parcial
10. **Test observaciones muy largas**: Rechazar > 1000 caracteres
11. **Test getTurnosQuerySchema**: Validar paginación y filtros
12. **Test turnoIdSchema**: Validar ID en params

### 6. Ejecutar tests y verificar cobertura

**Descripción**: Ejecutar suite de tests y asegurar que todos pasen
**Comando**: `npm test -- turno.validation.test.ts`
**Resultado esperado**: Todos los tests en verde

## Criterios de Aceptación (checklist)

- [ ] Modelo TypeScript creado con todas las interfaces
- [ ] Enum TipoTurno definido (DIURNO, NOCTURNO)
- [ ] DTOs completos (Create, Update, Paginated, ConRelaciones)
- [ ] Constantes de validación definidas (TURNO_VALIDATION)
- [ ] Type guards implementados (isTurno, isTipoTurno)
- [ ] Helper functions implementadas (dtoToNuevoTurnoDB, etc.)
- [ ] Schema Zod completo para createTurno con todas las validaciones
- [ ] Schema Zod completo para updateTurno
- [ ] Schemas para params y query params
- [ ] Validación custom: horas_normales + horas_extras <= 16
- [ ] Validación de fecha: no futura > 7 días
- [ ] Validación de límites: horas_normales <= 12, horas_extras <= 4
- [ ] Archivo turno.types.ts creado
- [ ] Modelos exportados en index.ts
- [ ] Tests unitarios creados (mínimo 10 tests)
- [ ] Todos los tests pasan exitosamente
- [ ] Documentación JSDoc completa en todos los archivos
- [ ] Tipos correctamente tipados sin 'any'

## Archivos a Generar

- `backend/src/models/turno.model.ts` - Modelo principal con interfaces y helpers
- `backend/src/schemas/turno.schema.ts` - Schemas Zod de validación
- `backend/src/types/turno.types.ts` - Tipos compartidos
- `backend/tests/unit/turno.validation.test.ts` - Tests de validaciones

## Archivos a Modificar

- `backend/src/models/index.ts` - Agregar exportaciones de turno

## Riesgos y Consideraciones

**Riesgo 1**: Validaciones de negocio muy complejas pueden hacer el schema difícil de mantener
- **Mitigación**: Documentar cada validación con comentarios claros

**Riesgo 2**: Validación de empleado_id requiere consulta a BD RRHH (no hacer en schema Zod)
- **Mitigación**: Esta validación se hará en el controller/service, no en el schema

**Riesgo 3**: Campo tipo_turno es auto-calculado, no debe ser editable por usuario
- **Mitigación**: No incluir tipo_turno en CreateTurnoDTO, será calculado por stored procedure

**Riesgo 4**: Campo es_feriado es auto-calculado, no debe ser editable
- **Mitigación**: No incluir es_feriado en CreateTurnoDTO ni UpdateTurnoDTO

**Consideración**: Los campos tipo_turno y es_feriado son calculados automáticamente por el stored procedure `sp_registrar_turno`, por lo que NO deben estar en los DTOs de entrada.

## Notas Adicionales

- El modelo debe seguir exactamente el patrón de `puesto.model.ts` y `feriado.model.ts`
- Los tests deben usar el mismo patrón de `feriados.test.ts` (aunque este es integration test)
- Esta tarea NO implementa endpoints, solo el modelo y validaciones
- Los endpoints se implementarán en T2.19 usando este modelo
- La validación de duplicados (empleado+puesto+fecha) se hace en BD, no en schema
- La validación de empleado activo se hace en controller, no en schema
- La validación de puesto activo se hace en controller, no en schema
