# Tareas: Unificación de Tabla de Usuarios

**Objetivo**: Una sola tabla de usuarios (`ot_sys_usuarios`) para Nómina y Operaciones
**Fecha de creación**: 2026-04-05
**Estado general**: En progreso
**Prerequisito**: Consolidación de DB completada (commit 5521bd2)

---

## Contexto

Actualmente existen dos tablas de usuarios en db_aae4a2_ranger:
- `sys_usuarios` (Nómina): idusuario(varchar), clave(texto plano), nivel(int)
- `ot_sys_usuarios` (Operaciones): id_usuario(int), password_hash(bcrypt), rol(enum)

Se unificará en `ot_sys_usuarios` agregando campo `nivel` para compatibilidad con Nómina.

## Mapeo de roles

| nivel (Nómina) | rol (Operaciones) | Acceso |
|---|---|---|
| 9 | ADMIN | Control total |
| 5 | SUPERVISOR | Operaciones diarias |
| 1 | CONSULTA | Solo lectura |

---

## Tareas

### T-USR-01 - Agregar campo `nivel` a ot_sys_usuarios
- **Estado**: [ok] Completada
- **Descripcion**: ALTER TABLE ot_sys_usuarios ADD COLUMN nivel INT DEFAULT 1
  Mapear valores existentes: ADMIN→9, SUPERVISOR→5, CONSULTA→1

### T-USR-02 - Migrar usuarios de sys_usuarios a ot_sys_usuarios
- **Estado**: [ok] Completada
- **Descripcion**: Insertar los 3 usuarios de Nómina (admin, Acordero, user1) en ot_sys_usuarios
  con passwords hasheados en bcrypt. Mapear nivel a rol.

### T-USR-03 - Adaptar login de Nómina (backend-ranger-nomina/server.js)
- **Estado**: [ok] Completada
- **Descripcion**: Cambiar endpoint /login para:
  - Consultar ot_sys_usuarios en vez de sys_usuarios
  - Verificar password con bcrypt en vez de comparacion directa
  - Incluir nivel en el JWT payload
  - Mapear campos: idusuario→username, clave→password_hash

### T-USR-04 - Adaptar middleware de Nómina (adminMiddleware.js)
- **Estado**: [ok] Completada - Sin cambios necesarios
- **Descripcion**: req.user.nivel sigue funcionando porque el JWT incluye nivel.
  authMiddleware asigna decoded → req.user, nivel está en el payload.

### T-USR-05 - Adaptar rutas de usuarios de Nómina (routes/usuarios.js)
- **Estado**: [ok] Completada - via modelo Sequelize
- **Descripcion**: El modelo usuarioModel.js apunta a ot_sys_usuarios.
  Virtual getters (idusuario, clave, nombres, apellidos) mantienen compatibilidad.

### T-USR-06 - Adaptar auditoría de Nómina (auditMiddleware.js)
- **Estado**: [ok] Completada - Sin cambios necesarios
- **Descripcion**: nivel_usuario lee de req.user.nivel del JWT. JWT incluye nivel.

### T-USR-07 - Adaptar frontend Nómina (user.service, auth, guards)
- **Estado**: [ok] Completada - Sin cambios en frontend
- **Descripcion**: JWT payload incluye idusuario (alias de username) y nivel.
  Frontend sigue usando user.idusuario y user.nivel sin modificaciones.

### T-USR-08 - Tests y verificación
- **Estado**: [ok] Completada
- **Descripcion**: 
  - Login en Nómina con credenciales bcrypt
  - Login en Operaciones sin cambios
  - Verificar que nivel 9 = admin en ambos módulos
  - Verificar auditoría graba nivel_usuario correcto
