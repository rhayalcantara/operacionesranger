# Plan de Testing - Módulo Novedades de Salud

**Fecha:** 2026-03-19
**Estado:** COMPLETADO
**Módulo:** Novedades de Salud (RRHH)
**Total tests:** 110 (104 automatizados + 6 E2E via Chrome DevTools)

---

## 1. Alcance

Cubrir testing completo del módulo Novedades de Salud:
- **Frontend:** Componente lista (`novedades-salud`), formulario dialog (`novedad-salud-form`), servicio (`novedad-salud.service.ts`)
- **Backend:** Rutas (`novedadSalud.js`), modelo (`novedadSaludModel.js`), upload de archivos (Multer)
- **Integración:** Impacto en recálculo de nómina (`nominaModel.recalcular`)

---

## 2. Componentes a Testear

| # | Componente | Ubicación | Tipo Test |
|---|-----------|-----------|-----------|
| 1 | NovedadesSaludComponent | `components/novedades-salud/novedades-salud.ts` | Unit + E2E |
| 2 | NovedadSaludFormComponent | `components/nomina/novedad-salud-form/novedad-salud-form.ts` | Unit |
| 3 | NovedadSaludService | `services/novedad-salud.service.ts` | Unit |
| 4 | Backend Route | `routes/novedadSalud.js` | Integration (API) |
| 5 | Backend Model | `models/novedadSaludModel.js` | Unit |
| 6 | Integración Nómina | `models/nominaModel.js` (~línea 798) | Integration |

---

## 3. Tareas de Testing

### FASE A: Tests Unitarios Frontend

#### T-NS-01: Tests del Servicio `novedad-salud.service.ts`
**Prioridad:** Alta
**Archivo:** `services/novedad-salud.service.spec.ts`
**Estado:** COMPLETADO (8 tests)

- [x] **T-NS-01.1** — `getAll()` retorna array de novedades (mock HttpClient GET)
- [x] **T-NS-01.2** — `getByEmpleado(id)` llama endpoint correcto `/empleado/{id}`
- [x] **T-NS-01.3** — `getById(id)` llama endpoint correcto `/{id}`
- [x] **T-NS-01.4** — `create(formData)` envía POST con FormData (no JSON)
- [x] **T-NS-01.5** — `update(id, formData)` envía PUT con FormData
- [x] **T-NS-01.6** — `delete(id)` envía DELETE al endpoint correcto
- [x] **T-NS-01.7** — `getArchivoUrl(id)` retorna URL correcta para descarga

#### T-NS-02: Tests del Componente Lista `novedades-salud.ts`
**Prioridad:** Alta
**Archivo:** `components/novedades-salud/novedades-salud.spec.ts`
**Estado:** COMPLETADO (15 tests)

- [x] **T-NS-02.1** — Componente se crea correctamente
- [x] **T-NS-02.2** — `ngOnInit` carga novedades y empleados al iniciar
- [x] **T-NS-02.3** — Tabla muestra columnas correctas (Empleado, Fecha Inicio, Días Licencia, Tipo Novedad, Observación, Archivo, Acciones)
- [x] **T-NS-02.4** — Botón "Agregar Novedad" abre dialog en modo creación (sin empleado preseleccionado)
- [x] **T-NS-02.5** — Botón editar abre dialog con datos de la novedad precargados
- [x] **T-NS-02.6** — Botón eliminar muestra confirmación antes de borrar
- [x] **T-NS-02.7** — Eliminación exitosa recarga la lista
- [x] **T-NS-02.8** — Eliminación cancelada NO borra la novedad
- [x] **T-NS-02.9** — Icono de archivo solo visible cuando novedad tiene archivo adjunto
- [x] **T-NS-02.10** — `descargarArchivo` abre URL en nueva ventana
- [x] **T-NS-02.11** — Mensaje estado vacío visible cuando no hay novedades (icono hospital)
- [x] **T-NS-02.12** — Observación se trunca a 50 caracteres en la tabla
- [x] **T-NS-02.13** — Lista se recarga después de cerrar dialog con resultado exitoso

#### T-NS-03: Tests del Dialog `novedad-salud-form.ts`
**Prioridad:** a
aaaaahello
**Archivo:** `components/nomina/novedad-salud-form/novedad-salud-form.spec.ts`
**Estado:** COMPLETADO (15 tests)

- [x] **T-NS-03.1** — Componente se crea correctamente
- [x] **T-NS-03.2** — **Modo creación:** Muestra selector de empleados
- [x] **T-NS-03.3** — **Modo edición:** Muestra nombre empleado como solo lectura (sin selector)
- [x] **T-NS-03.4** — Formulario reactivo con validaciones requeridas: `id_empleado`, `fecha_inicio`, `dias_licencia`, `tipo_novedad`
- [x] **T-NS-03.5** — `dias_licencia` validación mínimo = 1
- [x] **T-NS-03.6** — `observacion` validación máximo 255 caracteres
- [x] **T-NS-03.7** — Selector de tipo novedad contiene: Licencia Médica, Enfermedad Común, Accidente Laboral
- [x] **T-NS-03.8** — `onArchivoChange` acepta archivos PDF, JPG, PNG, DOC, DOCX
- [x] **T-NS-03.9** — `buildFormData()` construye FormData correctamente con todos los campos
- [x] **T-NS-03.10** — `guardar()` en modo creación llama `service.create()`
- [x] **T-NS-03.11** — `guardar()` en modo edición llama `service.update(id, data)`
- [x] **T-NS-03.12** — `guardar()` no procede si formulario es inválido
- [x] **T-NS-03.13** — `cancelar()` cierra dialog sin enviar datos
- [x] **T-NS-03.14** — Botón eliminar visible solo en modo edición
- [x] **T-NS-03.15** — `eliminar()` llama `service.delete(id)` y cierra dialog

---

### FASE B: Tests Backend (API + Modelo)

#### T-NS-04: Tests del Modelo `novedadSaludModel.js`
**Prioridad:** Alta
**Archivo:** `backend-ranger-nomina/tests/novedadSaludModel.test.js`
**Estado:** COMPLETADO (26 tests)

- [x] **T-NS-04.1** — `create()` inserta novedad con datos válidos
- [x] **T-NS-04.2** — `create()` falla sin `id_empleado` (campo requerido)
- [x] **T-NS-04.3** — `create()` falla sin `fecha_inicio` (campo requerido)
- [x] **T-NS-04.4** — `create()` falla sin `dias_licencia` (campo requerido)
- [x] **T-NS-04.5** — `create()` rechaza `dias_licencia < 1`
- [x] **T-NS-04.6** — `create()` falla con duplicado (mismo empleado + misma fecha) — constraint UNIQUE `uk_novedad_empleado_fecha`
- [x] **T-NS-04.7** — `getAll()` retorna lista con nombre_empleado (JOIN)
- [x] **T-NS-04.8** — `getById(id)` retorna novedad con nombre_empleado
- [x] **T-NS-04.9** — `getById(id)` retorna null/error para ID inexistente
- [x] **T-NS-04.10** — `getByEmpleado(id)` retorna solo novedades del empleado indicado
- [x] **T-NS-04.11** — `getByRangoFechas()` retorna novedades que se superponen con el rango
- [x] **T-NS-04.12** — `getByRangoFechas()` NO retorna novedades fuera del rango
- [x] **T-NS-04.13** — `update()` modifica campos correctamente
- [x] **T-NS-04.14** — `update()` rechaza `dias_licencia < 1`
- [x] **T-NS-04.15** — `delete()` elimina novedad existente
- [x] **T-NS-04.16** — Orden: `getAll()` ordenado por `fecha_creacion DESC`
- [x] **T-NS-04.17** — Orden: `getByEmpleado()` ordenado por `fecha_inicio DESC`

#### T-NS-05: Tests de Rutas API `novedadSalud.js`
**Prioridad:** Alta
**Archivo:** `backend-ranger-nomina/tests/novedadSaludRoutes.test.js`
**Estado:** COMPLETADO (29 tests)

- [x] **T-NS-05.1** — `GET /api/novedades-salud` — retorna 200 con lista
- [x] **T-NS-05.2** — `GET /api/novedades-salud/:id` — retorna 200 con novedad
- [x] **T-NS-05.3** — `GET /api/novedades-salud/:id` — retorna 404 para ID inexistente
- [x] **T-NS-05.4** — `GET /api/novedades-salud/empleado/:id` — retorna novedades del empleado
- [x] **T-NS-05.5** — `POST /api/novedades-salud` — crea novedad con datos válidos (201)
- [x] **T-NS-05.6** — `POST /api/novedades-salud` — rechaza sin campos requeridos (400)
- [x] **T-NS-05.7** — `POST /api/novedades-salud` — acepta archivo adjunto (multipart/form-data)
- [x] **T-NS-05.8** — `POST /api/novedades-salud` — rechaza archivos no permitidos (solo PDF, JPG, PNG, DOC, DOCX)
- [x] **T-NS-05.9** — `POST /api/novedades-salud` — rechaza archivos > 5MB
- [x] **T-NS-05.10** — `PUT /api/novedades-salud/:id` — actualiza novedad existente (200)
- [x] **T-NS-05.11** — `PUT /api/novedades-salud/:id` — permite reemplazar archivo
- [x] **T-NS-05.12** — `DELETE /api/novedades-salud/:id` — elimina novedad (200)
- [x] **T-NS-05.13** — `GET /api/novedades-salud/:id/archivo` — descarga archivo con headers correctos
- [x] **T-NS-05.14** — Todos los endpoints requieren JWT (retornan 401 sin token)
- [x] **T-NS-05.15** — `POST` con duplicado (mismo empleado + fecha) retorna error apropiado

---

### FASE C: Tests de Integración con Nómina

#### T-NS-06: Integración Novedad-Nómina
**Prioridad:** Media
**Archivo:** `backend-ranger-nomina/tests/novedadSalud.integration.test.js`
**Estado:** COMPLETADO (11 tests)

- [x] **T-NS-06.1** — Recálculo de nómina encuentra novedades activas dentro del periodo
- [x] **T-NS-06.2** — Recálculo ignora novedades con estado != 'activo'
- [x] **T-NS-06.3** — Recálculo ignora novedades fuera del periodo de nómina
- [x] **T-NS-06.4** — Novedad que se superpone parcialmente con periodo es encontrada
- [x] **T-NS-06.5** — Empleado con novedad tiene días trabajados reducidos por `dias_licencia`
- [x] **T-NS-06.6** — Empleado con novedad que cubre todo el periodo tiene salario ajustado a 0

---

### FASE D: Tests E2E / Manuales

#### T-NS-07: Flujo Completo E2E
**Prioridad:** Media
**Herramienta:** Chrome DevTools MCP
**Estado:** COMPLETADO (6 PASS, 2 SKIP cubiertos por tests automatizados)

- [x] **T-NS-07.1** — Navegar a RRHH > Novedades de Salud muestra la página
- [x] **T-NS-07.2** — Crear novedad completa con archivo adjunto → aparece en la tabla
- [x] **T-NS-07.3** — Editar novedad existente → cambios reflejados en la tabla
- [x] **T-NS-07.4** — Eliminar novedad → desaparece de la tabla
- [ ] **T-NS-07.5** — ~~Descargar archivo adjunto → archivo se descarga correctamente~~ SKIP (cubierto por T-NS-05.13)
- [x] **T-NS-07.6** — Crear novedad sin archivo → funciona sin error
- [x] **T-NS-07.7** — Intentar duplicado (mismo empleado + fecha) → muestra error
- [ ] **T-NS-07.8** — ~~Crear novedad → recalcular nómina del periodo → salario ajustado~~ SKIP (cubierto por T-NS-06)

---

## 4. Ejecución Real

### Estrategia de paralelización con subagentes

| Ronda | Agentes en paralelo | Tareas |
|-------|---------------------|--------|
| **Ronda 1** | Agente A + Agente B | T-NS-01 (Service) + T-NS-04 (Modelo) |
| **Ronda 2** | Agente C + Agente D | T-NS-05 (Rutas API) + T-NS-03 (Dialog) |
| **Ronda 3** | Agente E + Agente F | T-NS-02 (Lista) + T-NS-06 (Integración) |
| **Ronda 4** | Chrome DevTools MCP | T-NS-07 (E2E) |

### Resultados de ejecución

| Suite | Tests | Estado |
|-------|-------|--------|
| Backend - novedadSaludModel.test.js | 26 | PASS |
| Backend - novedadSaludRoutes.test.js | 29 | PASS |
| Backend - novedadSalud.integration.test.js | 11 | PASS |
| Frontend - novedad-salud.service.spec.ts | 8 | PASS |
| Frontend - novedades-salud.spec.ts | 15 | PASS |
| Frontend - novedad-salud-form.spec.ts | 15 | PASS |
| E2E - Chrome DevTools | 6 | PASS |
| **TOTAL** | **110** | **ALL PASS** |

### Archivos de test creados

| Archivo | Tipo |
|---------|------|
| `rangernomina-frontend/src/app/services/novedad-salud.service.spec.ts` | Unit |
| `rangernomina-frontend/src/app/components/novedades-salud/novedades-salud.spec.ts` | Unit |
| `rangernomina-frontend/src/app/components/nomina/novedad-salud-form/novedad-salud-form.spec.ts` | Unit |
| `backend-ranger-nomina/tests/novedadSaludModel.test.js` | Unit |
| `backend-ranger-nomina/tests/novedadSaludRoutes.test.js` | Integration |
| `backend-ranger-nomina/tests/novedadSalud.integration.test.js` | Integration |

### Fix colateral

- `regalia.component.spec.ts` — Corregidos imports rotos de `NotificationService` y `UserService` (ubicación incorrecta `../services/` vs `../`), agregado import de `Router`, y campo `monto_ajustado` faltante en mock.
- `novedades-salud.spec.ts` — Resuelto conflicto de `MatDialogModule` en componente standalone que sobreescribía el spy de `MatDialog`, usando `TestBed.overrideComponent()`.

---

## 5. Dependencias y Consideraciones

### Para tests frontend:
- Mockear `NovedadSaludService` con `HttpClientTestingModule`
- Mockear `MatDialog` para tests del componente lista — **NOTA:** Componentes standalone que importan `MatDialogModule` requieren `overrideComponent` para remover el módulo y permitir el spy
- Mockear `MAT_DIALOG_DATA` y `MatDialogRef` para tests del dialog
- Mockear `EmployeeService.getActiveEmployees()` para el selector
- Mockear `NotificationService` para verificar mensajes de feedback

### Para tests backend:
- Todos los tests mockean `db.query()` con Jest — NO usan base de datos real
- Tests de upload usan `Buffer` para simular archivos — NO requieren fixtures en disco
- JWT generado con `jsonwebtoken` usando `JWT_SECRET` del `.env`
- Tests de integración usan `buildSmartConnection()` que responde a queries según patrones SQL

### Datos de prueba necesarios:
- Al menos 2 empleados activos en `rh_empleado` (para E2E)
- Una nómina abierta para tests de integración (T-NS-06) — mockeado
- Archivos de prueba: simulados con `Buffer` (backend) y archivo real `test_e2e.pdf` (E2E)

---

## 6. Criterios de Aceptación

- [x] **Cobertura mínima:** 80% en service, model y routes
- [x] **Todos los tests de validación** cubren casos positivos y negativos
- [x] **Constraint UNIQUE** testeado explícitamente (T-NS-04.6, T-NS-05.15, T-NS-07.7)
- [x] **Upload de archivos** verifica tipo, tamaño y almacenamiento (T-NS-05.7-05.9)
- [x] **Integración nómina** verifica que novedades afectan correctamente el recálculo (T-NS-06)
- [x] **No regresiones** en funcionalidad existente de nómina
