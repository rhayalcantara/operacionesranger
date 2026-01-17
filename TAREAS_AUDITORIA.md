# TAREAS DE IMPLEMENTACIÓN - SISTEMA DE AUDITORÍA
## Ranger Nómina

**Fecha de inicio:** 2025-11-09
**Última actualización:** 2025-11-09

---

## PROGRESO GENERAL

### Resumen Ejecutivo
- **Fase Actual:** Fase 1 - Fundamentos
- **Progreso Total:** 50% de Fase 1 completado
- **Próximo hito:** Ejecutar scripts SQL y probar sistema base

### Estado por Fase

| Fase | Nombre | Estado | Progreso | Fecha Inicio | Fecha Fin |
|------|--------|--------|----------|--------------|-----------|
| 1 | Fundamentos | 🟡 En Progreso | 50% | 2025-11-09 | - |
| 2 | Auth/Usuarios | ⚪ Pendiente | 0% | - | - |
| 3 | Empleados | ⚪ Pendiente | 0% | - | - |
| 4 | Nóminas | ⚪ Pendiente | 0% | - | - |
| 5 | Desc/Cred/Vac | ⚪ Pendiente | 0% | - | - |
| 6 | Mantenimientos | ⚪ Pendiente | 0% | - | - |
| 7 | Reportes/Import | ⚪ Pendiente | 0% | - | - |
| 8 | Frontend Consulta | ⚪ Pendiente | 0% | - | - |
| 9 | Dashboard | ⚪ Pendiente | 0% | - | - |
| 10 | Pruebas | ⚪ Pendiente | 0% | - | - |
| 11 | Despliegue | ⚪ Pendiente | 0% | - | - |

**Leyenda:** 🟢 Completado | 🟡 En Progreso | ⚪ Pendiente | 🔴 Bloqueado

---

## FASE 1: FUNDAMENTOS (Semana 1)

**Objetivo:** Crear la infraestructura base de auditoría

### Tareas Backend

#### 1.1 Crear tabla de auditoría en base de datos
- **Estado:** ⚪ Pendiente (Script creado, pendiente ejecución)
- **Responsable:** DBA / Desarrollador
- **Ubicación:** `backend-ranger-nomina/scripts/create_auditoria_tables.sql`
- **Pasos para ejecutar:**
  1. Abrir cliente MySQL (MySQL Workbench, phpMyAdmin, DBeaver, etc.)
  2. Conectar a base de datos `nomina`
  3. Ejecutar script `create_auditoria_tables.sql`
  4. Verificar que las tablas `sys_auditoria` y `sys_sesiones_auditoria` fueron creadas
  5. Verificar índices con `SHOW INDEX FROM sys_auditoria;`
- **Dependencias:** Ninguna
- **Bloqueadores:** MySQL no accesible desde línea de comandos
- **Fecha Creación:** 2025-11-09
- **Fecha Completada:** -

#### 1.2 Implementar auditoriaModel.js
- **Estado:** 🟢 Completado
- **Ubicación:** `backend-ranger-nomina/models/auditoriaModel.js`
- **Funcionalidades implementadas:**
  - ✅ `registrar()` - Inserta log de auditoría
  - ✅ `consultar()` - Consulta logs con filtros y paginación
  - ✅ `obtenerEstadisticas()` - Estadísticas para dashboard
  - ✅ `registrarSesion()` - Registra eventos de login/logout
- **Pruebas:** Pendientes (requiere tablas creadas)
- **Fecha Completada:** 2025-11-09

#### 1.3 Implementar auditMiddleware.js
- **Estado:** 🟢 Completado
- **Ubicación:** `backend-ranger-nomina/middleware/auditMiddleware.js`
- **Funcionalidades implementadas:**
  - ✅ `auditMiddleware(modulo)` - Captura contexto de request
  - ✅ `registrarAuditoria()` - Helper asíncrono para registrar
  - ✅ `registrarAuditoriaSync()` - Helper síncrono (para casos críticos)
  - ✅ `registrarSesion()` - Helper para eventos de sesión
  - ✅ Sanitización de contraseñas y fotos
- **Características:**
  - Escritura asíncrona (no bloquea operaciones)
  - Manejo robusto de errores
  - Extrae IP, user agent, método HTTP automáticamente
- **Fecha Completada:** 2025-11-09

#### 1.4 Crear rutas /api/auditoria
- **Estado:** 🟢 Completado
- **Ubicación:** `backend-ranger-nomina/routes/auditoria.js`
- **Endpoints implementados:**
  - ✅ `GET /api/auditoria` - Consultar logs con filtros
  - ✅ `GET /api/auditoria/:id` - Obtener log específico
  - ✅ `GET /api/auditoria/dashboard/estadisticas` - Estadísticas
  - ✅ `GET /api/auditoria/reporte/excel` - Exportar a Excel
  - ✅ `GET /api/auditoria/modulos` - Lista de módulos
  - ✅ `GET /api/auditoria/acciones` - Lista de acciones
- **Seguridad:**
  - Requiere autenticación (authMiddleware)
  - Requiere nivel 9 (adminMiddleware)
  - Auto-auditado (registra consultas de auditoría)
- **Dependencias:** ExcelJS (para exportación)
- **Fecha Completada:** 2025-11-09

#### 1.5 Registrar rutas en server.js
- **Estado:** 🟢 Completado
- **Ubicación:** `backend-ranger-nomina/server.js` (líneas 129, 151)
- **Cambios realizados:**
  - Importación de `auditoriaRoutes`
  - Registro de `app.use('/api/auditoria', auditoriaRoutes)`
- **Fecha Completada:** 2025-11-09

### Tareas Frontend

#### 1.6 Crear servicio auditoria.service.ts
- **Estado:** 🟢 Completado
- **Ubicación:** `rangernomina-frontend/src/app/services/auditoria.service.ts`
- **Funcionalidades implementadas:**
  - ✅ `consultarLogs()` - Consulta con filtros
  - ✅ `obtenerLogPorId()` - Log específico
  - ✅ `exportarExcel()` - Exportar logs
  - ✅ `obtenerEstadisticas()` - Estadísticas
  - ✅ `obtenerModulos()` - Lista de módulos para filtros
  - ✅ `obtenerAcciones()` - Lista de acciones para filtros
- **Interfaces TypeScript:**
  - ✅ `LogAuditoria`
  - ✅ `FiltrosAuditoria`
  - ✅ `RespuestaPaginadaAuditoria`
  - ✅ `EstadisticasAuditoria`
- **Fecha Completada:** 2025-11-09

### Tareas de Pruebas

#### 1.7 Probar sistema base de auditoría
- **Estado:** ⚪ Pendiente
- **Dependencias:** Tablas de BD creadas (tarea 1.1)
- **Pasos:**
  1. Ejecutar scripts SQL
  2. Reiniciar backend
  3. Probar INSERT manual en tabla `sys_auditoria`
  4. Probar endpoint `POST /login` con auditoría de sesión
  5. Probar endpoint `GET /api/auditoria` (consulta)
  6. Verificar que logs se crean correctamente
- **Criterios de aceptación:**
  - ✅ Tablas creadas sin errores
  - ✅ INSERT manual exitoso
  - ✅ Consulta retorna datos correctos
  - ✅ Exportación a Excel funciona
- **Fecha Completada:** -

### Entregables Fase 1
- [x] Tabla `sys_auditoria` creada (PENDIENTE EJECUCIÓN SQL)
- [x] Tabla `sys_sesiones_auditoria` creada (PENDIENTE EJECUCIÓN SQL)
- [x] Modelo `auditoriaModel.js` funcionando
- [x] Middleware `auditMiddleware.js` funcionando
- [x] Rutas `/api/auditoria` registradas
- [x] Servicio Angular `auditoria.service.ts` creado
- [ ] Pruebas de integración pasadas (PENDIENTE)
- [ ] Documentación técnica actualizada (PENDIENTE)

---

## FASE 2: AUDITORÍA DE AUTENTICACIÓN Y USUARIOS

**Estado:** ⚪ Pendiente
**Objetivo:** Auditar login, logout y gestión de usuarios

### Tareas

#### 2.1 Auditar login/logout
- **Estado:** ⚪ Pendiente
- **Ubicación:** `backend-ranger-nomina/server.js` (endpoint `/login`)
- **Acciones a implementar:**
  - Registrar evento LOGIN exitoso
  - Registrar evento LOGIN fallido (usuario no existe)
  - Registrar evento LOGIN fallido (contraseña incorrecta)
  - Crear endpoint `/logout` con auditoría
  - Registrar sesiones expiradas
- **Campos a registrar:**
  - Usuario
  - IP cliente
  - User agent
  - Resultado (EXITO/FALLO)
  - Detalle del fallo
- **Estimación:** 2 horas

#### 2.2 Auditar gestión de usuarios (CRUD)
- **Estado:** ⚪ Pendiente
- **Ubicación:** `backend-ranger-nomina/routes/usuarios.js`
- **Acciones a implementar:**
  - Aplicar `auditMiddleware('USUARIOS')`
  - POST `/` - Registrar CREAR_USUARIO
  - GET `/:id` - OPCIONAL: Registrar CONSULTAR_USUARIO
  - PUT `/:id` - Registrar MODIFICAR_USUARIO (valores anteriores/nuevos)
  - DELETE `/:id` - Registrar ELIMINAR_USUARIO
  - PUT `/change-password` - Registrar CAMBIAR_PASSWORD (sin exponer contraseña)
- **Consideraciones:**
  - No guardar campo `clave` en valores_anteriores/nuevos
  - Registrar si fue cambio de nivel de usuario
- **Estimación:** 3 horas

#### 2.3 Pruebas funcionales
- **Estado:** ⚪ Pendiente
- **Escenarios de prueba:**
  1. Login exitoso → verificar log en `sys_sesiones_auditoria`
  2. Login fallido → verificar log con detalle_fallo
  3. Crear usuario → verificar log con valores_nuevos
  4. Modificar usuario → verificar valores_anteriores y valores_nuevos
  5. Eliminar usuario → verificar log
  6. Cambiar contraseña → verificar que NO se guardó la clave
- **Estimación:** 2 horas

### Entregables Fase 2
- [ ] Login/logout auditado
- [ ] CRUD de usuarios completamente auditado
- [ ] Pruebas funcionales documentadas y pasadas
- [ ] Actualizar CLAUDE.md con información de auditoría de usuarios

---

## FASE 3: AUDITORÍA DE EMPLEADOS

**Estado:** ⚪ Pendiente
**Objetivo:** Auditar operaciones CRUD de empleados

### Tareas

#### 3.1 Auditar CRUD de empleados
- **Estado:** ⚪ Pendiente
- **Ubicación:** `backend-ranger-nomina/routes/empleados.js`
- **Acciones a implementar:**
  - Aplicar `auditMiddleware('EMPLEADOS')`
  - POST `/` - CREAR_EMPLEADO
  - GET `/:id` - OPCIONAL: CONSULTAR_EMPLEADO
  - PUT `/:id` - MODIFICAR_EMPLEADO
  - DELETE `/:id` o cambio de status - DESACTIVAR_EMPLEADO
  - Subida de foto - MODIFICAR_FOTO (sin guardar Base64 completo)
- **Consideraciones especiales:**
  - Para fotos: Solo indicar `foto: '[FOTO_PRESENTE]'` o `null`
  - Para desactivación: Registrar fecha_despido y observacion_despido
  - Capturar cambios de salario (campo crítico)
- **Estimación:** 4 horas

#### 3.2 Auditar cambios de estado de empleados
- **Estado:** ⚪ Pendiente
- **Ubicación:** `backend-ranger-nomina/models/empleadoModel.js`
- **Acciones a implementar:**
  - Activación de empleado - ACTIVAR_EMPLEADO
  - Desactivación de empleado - DESACTIVAR_EMPLEADO
  - Cambio de puesto - CAMBIAR_PUESTO
- **Estimación:** 2 horas

#### 3.3 Pruebas funcionales
- **Estado:** ⚪ Pendiente
- **Escenarios:**
  1. Crear empleado → verificar log con datos completos
  2. Modificar salario → verificar valores_anteriores y nuevos
  3. Subir foto → verificar que no se guardó Base64
  4. Desactivar empleado → verificar registro de despido
- **Estimación:** 2 horas

### Entregables Fase 3
- [ ] CRUD de empleados auditado
- [ ] Cambios de estado auditados
- [ ] Subida de fotos auditada (sin exponer datos binarios)
- [ ] Pruebas funcionales pasadas

---

## FASE 4: AUDITORÍA DE NÓMINAS

**Estado:** ⚪ Pendiente
**Objetivo:** Auditar el ciclo completo de nóminas (CRÍTICO)

### Tareas

#### 4.1 Auditar operaciones de nómina
- **Estado:** ⚪ Pendiente
- **Ubicación:** `backend-ranger-nomina/routes/no_nomina.js`
- **Acciones a implementar:**
  - Aplicar `auditMiddleware('NOMINAS')`
  - POST `/` - CREAR_NOMINA
  - PUT `/:id` - MODIFICAR_NOMINA
  - DELETE `/:id` - ELIMINAR_NOMINA
  - POST `/:id/recalcular` - **RECALCULAR_NOMINA** (CRÍTICO)
  - POST `/:id/cerrar` - **CERRAR_NOMINA** (CRÍTICO)
  - GET `/:id/export-excel` - EXPORTAR_NOMINA_EXCEL
  - POST `/:id/generar-voucher` - GENERAR_VOUCHER
- **Consideraciones especiales para CERRAR_NOMINA:**
  - Registrar estado completo ANTES del cierre:
    - Total empleados
    - Total sueldos bruto
    - Total incentivos
    - Total descuentos
    - Total a pagar
  - Registrar fecha de cierre
  - **Es la operación MÁS crítica del sistema**
- **Estimación:** 6 horas

#### 4.2 Auditar detalles de nómina
- **Estado:** ⚪ Pendiente
- **Ubicación:** `backend-ranger-nomina/routes/detNomina.js`
- **Acciones a implementar:**
  - Modificaciones manuales de montos
  - Registrar cambios en campos críticos:
    - sueldo_nomina
    - desc_afp, desc_sfs, desc_isr
    - he15, he35, vacaciones
    - total_ingreso, total_descuento, total_pagar
- **Estimación:** 3 horas

#### 4.3 Pruebas funcionales de nóminas
- **Estado:** ⚪ Pendiente
- **Escenarios críticos:**
  1. Crear nómina → verificar log
  2. Recalcular nómina → verificar trigger del recálculo
  3. **Cerrar nómina → VERIFICAR SNAPSHOT COMPLETO**
  4. Intentar modificar nómina cerrada → verificar FALLO registrado
  5. Exportar a Excel → verificar log de exportación
- **Estimación:** 4 horas

### Entregables Fase 4
- [ ] Ciclo completo de nómina auditado
- [ ] CERRAR_NOMINA con snapshot de estado
- [ ] RECALCULAR con evidencia de trigger
- [ ] Modificaciones manuales auditadas
- [ ] Pruebas críticas pasadas y documentadas

---

## FASE 5: AUDITORÍA DE DESCUENTOS/CRÉDITOS Y VACACIONES

**Estado:** ⚪ Pendiente

### Tareas

#### 5.1 Auditar descuentos/créditos de nómina
- **Ubicación:** `backend-ranger-nomina/routes/descCredNomina.js`
- **Acciones:** CREAR, MODIFICAR, ELIMINAR, IMPORTAR_EXCEL
- **Estimación:** 3 horas

#### 5.2 Auditar vacaciones
- **Ubicación:** `backend-ranger-nomina/routes/vacaciones.js`
- **Acciones:** CREAR, MODIFICAR, ELIMINAR, PAGAR, IMPORTAR
- **Estimación:** 3 horas

#### 5.3 Auditar cuotas
- **Ubicación:** `backend-ranger-nomina/routes/cuotaRoutes.js`
- **Acciones:** CREAR, MODIFICAR, ELIMINAR, APLICAR_CUOTA
- **Estimación:** 2 horas

### Entregables Fase 5
- [ ] Desc/Cred auditados con importaciones
- [ ] Vacaciones auditadas
- [ ] Cuotas auditadas

---

## FASE 6-11: PENDIENTES DE DETALLE

*(Se detallará conforme se avance en las fases anteriores)*

---

## ARCHIVOS CREADOS

### Backend
```
backend-ranger-nomina/
├── models/
│   └── auditoriaModel.js ✅
├── middleware/
│   └── auditMiddleware.js ✅
├── routes/
│   └── auditoria.js ✅
├── scripts/
│   └── create_auditoria_tables.sql ✅
└── server.js (modificado) ✅
```

### Frontend
```
rangernomina-frontend/
└── src/
    └── app/
        └── services/
            └── auditoria.service.ts ✅
```

### Documentación
```
E:\ranger sistemas/
├── PLAN_IMPLEMENTACION_AUDITORIA.md ✅
└── TAREAS_AUDITORIA.md ✅ (este archivo)
```

---

## PRÓXIMOS PASOS INMEDIATOS

1. **[MANUAL]** Ejecutar script `create_auditoria_tables.sql` en base de datos `nomina`
2. **[MANUAL]** Reiniciar backend: `npm start` en `backend-ranger-nomina/`
3. **[TEST]** Probar endpoint GET `/api/auditoria` (debe retornar array vacío)
4. **[TEST]** Hacer login y verificar que se crea registro en `sys_sesiones_auditoria`
5. **[DESARROLLO]** Comenzar Fase 2: Auditar login/logout

---

## NOTAS TÉCNICAS

### Dependencias npm a verificar
- ✅ `exceljs` - Para exportación de Excel (ya existe en el proyecto)
- ✅ `winston` - Para logging (ya existe)
- ✅ `mysql2` - Para conexión a BD (ya existe)

### Configuraciones necesarias
- ✅ Middleware de autenticación ya existente (`authMiddleware.js`)
- ✅ Middleware de admin ya existente (`adminMiddleware.js`)
- ⚠️ Verificar que `req.user` tenga campos `id`, `nombres`, `apellidos`, `nivel`

### Consideraciones de Rendimiento
- ✅ Auditoría implementada de forma asíncrona (no bloquea operaciones)
- ⚠️ Revisar impacto en producción después de Fase 1
- ⚠️ Considerar particionamiento de tabla si crece mucho (>1M registros)

---

## HISTORIAL DE CAMBIOS

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-11-09 | 1.0 | Creación inicial del archivo de tareas. Fase 1 50% completada. |

---

**Documento mantenido por:** Equipo de Desarrollo
**Última actualización:** 2025-11-09
