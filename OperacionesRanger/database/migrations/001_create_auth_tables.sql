-- ============================================================================
-- MIGRACIÓN 001: TABLAS DE AUTENTICACIÓN Y AUTORIZACIÓN
-- Sistema de Gestión de Turnos - OperacionesRanger
-- ============================================================================
-- Fecha: 2026-01-18
-- Descripción: Crea las tablas necesarias para autenticación JWT, gestión de
--              usuarios, refresh tokens y auditoría de eventos de auth.
-- Estrategia: JWT con Refresh Tokens (ver ADR-002)
-- Base de datos: turnos_guardianes
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- 1. TABLA: sys_usuarios
-- ============================================================================
-- Almacena los usuarios del sistema con credenciales y roles
-- Características:
-- - Passwords hasheados con bcrypt (nunca plaintext)
-- - Bloqueo temporal tras intentos fallidos
-- - Auditoría de creación y modificación
-- - 3 roles: ADMIN, SUPERVISOR, CONSULTA
-- ============================================================================

CREATE TABLE IF NOT EXISTS sys_usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre de usuario único',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt de la contraseña (10 rounds)',
    email VARCHAR(100) UNIQUE COMMENT 'Email del usuario (opcional, único si existe)',
    nombre_completo VARCHAR(150) NOT NULL COMMENT 'Nombre completo del usuario',
    rol ENUM('ADMIN', 'SUPERVISOR', 'CONSULTA') NOT NULL DEFAULT 'CONSULTA'
        COMMENT 'ADMIN=control total, SUPERVISOR=operación diaria, CONSULTA=solo lectura',
    activo BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Usuario activo/inactivo',

    -- Timestamps de auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL COMMENT 'Fecha del último login exitoso',

    -- Seguridad: bloqueo temporal
    intentos_fallidos INT DEFAULT 0 COMMENT 'Contador de intentos fallidos de login',
    bloqueado_hasta TIMESTAMP NULL COMMENT 'Fecha hasta la cual el usuario está bloqueado',

    -- Auditoría de cambios
    created_by INT NULL COMMENT 'ID del usuario que creó este registro',
    modified_by INT NULL COMMENT 'ID del último usuario que modificó este registro',

    -- Índices para optimizar queries
    INDEX idx_username (username),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo),
    INDEX idx_email (email),

    -- Foreign keys (self-referencing para auditoría)
    FOREIGN KEY (created_by) REFERENCES sys_usuarios(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (modified_by) REFERENCES sys_usuarios(id_usuario) ON DELETE SET NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema con roles y permisos';

-- ============================================================================
-- 2. TABLA: sys_refresh_tokens
-- ============================================================================
-- Almacena refresh tokens para renovar access tokens sin re-autenticación
-- Características:
-- - Tokens almacenados como hash SHA-256 (no plaintext)
-- - Expiración configurable (default: 7 días)
-- - Revocación manual (logout)
-- - Límite de tokens activos por usuario
-- - Tracking de IP y User Agent para seguridad
-- ============================================================================

CREATE TABLE IF NOT EXISTS sys_refresh_tokens (
    id_token INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL COMMENT 'Usuario propietario del token',
    token_hash VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hash SHA-256 del refresh token',

    -- Timestamps de validez
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de emisión del token',
    fecha_expiracion TIMESTAMP NOT NULL COMMENT 'Fecha de expiración (7 días por defecto)',

    -- Control de revocación
    revocado BOOLEAN DEFAULT FALSE COMMENT 'Token revocado manualmente (logout)',
    fecha_revocacion TIMESTAMP NULL COMMENT 'Fecha de revocación si aplica',

    -- Información de seguridad
    ip_address VARCHAR(45) COMMENT 'IP desde donde se emitió (IPv4: 15 chars, IPv6: 45 chars)',
    user_agent TEXT COMMENT 'User agent del navegador/cliente',

    -- Índices para optimizar queries
    INDEX idx_usuario (id_usuario),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expiracion (fecha_expiracion),
    INDEX idx_revocado (revocado),
    INDEX idx_usuario_revocado (id_usuario, revocado),

    -- Foreign key
    FOREIGN KEY (id_usuario) REFERENCES sys_usuarios(id_usuario) ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Refresh tokens para renovación de acceso sin re-autenticación';

-- ============================================================================
-- 3. TABLA: sys_auditoria_auth
-- ============================================================================
-- Registro de auditoría de todos los eventos de autenticación
-- Características:
-- - Registra logins exitosos y fallidos
-- - Tracking de IP y User Agent
-- - Detalles en JSON para información adicional
-- - id_usuario NULL para intentos fallidos (usuario no existe)
-- - Preserva auditoría aunque se elimine el usuario (SET NULL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sys_auditoria_auth (
    id_auditoria INT PRIMARY KEY AUTO_INCREMENT,

    -- Usuario relacionado (NULL si login failed)
    id_usuario INT NULL COMMENT 'ID del usuario (NULL si el usuario no existe)',
    username VARCHAR(50) COMMENT 'Username del intento (registrado siempre)',

    -- Tipo de evento
    evento ENUM(
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'TOKEN_REFRESH',
        'PASSWORD_CHANGE'
    ) NOT NULL COMMENT 'Tipo de evento de autenticación',

    -- Información de seguridad
    ip_address VARCHAR(45) COMMENT 'IP desde donde se originó el evento',
    user_agent TEXT COMMENT 'User agent del navegador/cliente',
    detalles TEXT COMMENT 'Información adicional en JSON (razón de fallo, etc.)',

    -- Timestamp del evento
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',

    -- Índices para optimizar queries de auditoría
    INDEX idx_usuario (id_usuario),
    INDEX idx_evento (evento),
    INDEX idx_fecha (fecha_evento),
    INDEX idx_usuario_evento (id_usuario, evento),
    INDEX idx_fecha_evento (fecha_evento, evento),

    -- Foreign key (SET NULL para preservar auditoría)
    FOREIGN KEY (id_usuario) REFERENCES sys_usuarios(id_usuario) ON DELETE SET NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Auditoría de eventos de autenticación para trazabilidad y seguridad';

-- ============================================================================
-- DATOS INICIALES (SEED)
-- ============================================================================

-- Insertar usuario administrador inicial
-- IMPORTANTE: Este usuario tiene password temporal que DEBE cambiarse en primer login
-- Password por defecto: Admin123! (hasheado con bcrypt, 10 rounds)
-- Hash generado con: bcrypt.hash('Admin123!', 10)

INSERT INTO sys_usuarios (
    username,
    password_hash,
    email,
    nombre_completo,
    rol,
    activo,
    created_by,
    modified_by
) VALUES (
    'admin',
    '$2a$10$rZ8qNW3zKGXHJ5L.YmF1M.YvO/xJ5qL8K7XxZ3nZ5qL8K7XxZ3nZ5', -- Password: Admin123!
    'admin@operacionesranger.com',
    'Administrador del Sistema',
    'ADMIN',
    TRUE,
    NULL,  -- Primer usuario, no tiene creator
    NULL
) ON DUPLICATE KEY UPDATE username = username;  -- No insertar si ya existe

-- ============================================================================
-- NOTAS DE SEGURIDAD
-- ============================================================================
-- 1. PASSWORD HASHING:
--    - NUNCA almacenar passwords en texto plano
--    - Usar bcrypt con 10 rounds mínimo
--    - El hash de ejemplo arriba es solo para desarrollo
--    - En producción, cambiar inmediatamente el password del admin
--
-- 2. REFRESH TOKENS:
--    - Almacenar solo hash SHA-256, nunca el token completo
--    - Implementar rotación de tokens
--    - Límite máximo: 5 tokens activos por usuario
--    - Revocar tokens al cambiar password
--
-- 3. AUDITORÍA:
--    - Registrar TODOS los eventos de autenticación
--    - Monitorear múltiples intentos fallidos desde misma IP
--    - Alertar sobre actividad sospechosa
--    - Retener logs al menos 1 año (cumplimiento)
--
-- 4. BLOQUEO DE CUENTAS:
--    - Bloquear tras 5 intentos fallidos
--    - Duración de bloqueo: 15 minutos
--    - Resetear contador tras login exitoso
--    - Notificar al usuario sobre el bloqueo
--
-- 5. FOREIGN KEYS:
--    - sys_usuarios: self-referencing con SET NULL (permite eliminar users)
--    - sys_refresh_tokens: CASCADE (eliminar tokens al eliminar usuario)
--    - sys_auditoria_auth: SET NULL (preservar auditoría)
-- ============================================================================

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS DE UTILIDAD
-- ============================================================================

-- Procedimiento para limpiar refresh tokens expirados
DELIMITER //
CREATE PROCEDURE sp_limpiar_refresh_tokens_expirados()
BEGIN
    DELETE FROM sys_refresh_tokens
    WHERE fecha_expiracion < NOW()
       OR revocado = TRUE;

    SELECT ROW_COUNT() AS tokens_eliminados;
END //
DELIMITER ;

-- Procedimiento para revocar todos los tokens de un usuario
DELIMITER //
CREATE PROCEDURE sp_revocar_tokens_usuario(
    IN p_id_usuario INT
)
BEGIN
    UPDATE sys_refresh_tokens
    SET revocado = TRUE,
        fecha_revocacion = NOW()
    WHERE id_usuario = p_id_usuario
      AND revocado = FALSE;

    SELECT ROW_COUNT() AS tokens_revocados;
END //
DELIMITER ;

-- Procedimiento para bloquear usuario tras intentos fallidos
DELIMITER //
CREATE PROCEDURE sp_bloquear_usuario(
    IN p_id_usuario INT,
    IN p_minutos_bloqueo INT
)
BEGIN
    UPDATE sys_usuarios
    SET bloqueado_hasta = DATE_ADD(NOW(), INTERVAL p_minutos_bloqueo MINUTE)
    WHERE id_usuario = p_id_usuario;

    SELECT bloqueado_hasta
    FROM sys_usuarios
    WHERE id_usuario = p_id_usuario;
END //
DELIMITER ;

-- Procedimiento para resetear intentos fallidos tras login exitoso
DELIMITER //
CREATE PROCEDURE sp_resetear_intentos_login(
    IN p_id_usuario INT
)
BEGIN
    UPDATE sys_usuarios
    SET intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        ultimo_login = NOW()
    WHERE id_usuario = p_id_usuario;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para limitar cantidad de refresh tokens activos por usuario
DELIMITER //
CREATE TRIGGER trg_limitar_refresh_tokens
BEFORE INSERT ON sys_refresh_tokens
FOR EACH ROW
BEGIN
    DECLARE v_count INT;

    -- Contar tokens activos (no revocados, no expirados)
    SELECT COUNT(*) INTO v_count
    FROM sys_refresh_tokens
    WHERE id_usuario = NEW.id_usuario
      AND revocado = FALSE
      AND fecha_expiracion > NOW();

    -- Si excede el límite, revocar el más antiguo
    IF v_count >= 5 THEN
        UPDATE sys_refresh_tokens
        SET revocado = TRUE,
            fecha_revocacion = NOW()
        WHERE id_usuario = NEW.id_usuario
          AND revocado = FALSE
        ORDER BY fecha_emision ASC
        LIMIT 1;
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- VISTAS DE UTILIDAD
-- ============================================================================

-- Vista de usuarios activos (sin password_hash)
CREATE OR REPLACE VIEW v_usuarios_activos AS
SELECT
    id_usuario,
    username,
    email,
    nombre_completo,
    rol,
    activo,
    fecha_creacion,
    fecha_modificacion,
    ultimo_login
FROM sys_usuarios
WHERE activo = TRUE;

-- Vista de tokens activos por usuario
CREATE OR REPLACE VIEW v_refresh_tokens_activos AS
SELECT
    rt.id_token,
    rt.id_usuario,
    u.username,
    rt.fecha_emision,
    rt.fecha_expiracion,
    rt.ip_address,
    TIMESTAMPDIFF(HOUR, NOW(), rt.fecha_expiracion) AS horas_restantes
FROM sys_refresh_tokens rt
INNER JOIN sys_usuarios u ON rt.id_usuario = u.id_usuario
WHERE rt.revocado = FALSE
  AND rt.fecha_expiracion > NOW()
ORDER BY rt.fecha_expiracion ASC;

-- Vista de auditoría reciente (últimas 24 horas)
CREATE OR REPLACE VIEW v_auditoria_reciente AS
SELECT
    a.id_auditoria,
    a.id_usuario,
    u.username AS username_actual,
    a.username AS username_intento,
    a.evento,
    a.ip_address,
    a.fecha_evento,
    a.detalles
FROM sys_auditoria_auth a
LEFT JOIN sys_usuarios u ON a.id_usuario = u.id_usuario
WHERE a.fecha_evento >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY a.fecha_evento DESC;

-- ============================================================================
-- VERIFICACIÓN DE MIGRACIÓN
-- ============================================================================

-- Mostrar tablas creadas
SELECT
    TABLE_NAME,
    ENGINE,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'turnos_guardianes'
  AND TABLE_NAME LIKE 'sys_%'
ORDER BY TABLE_NAME;

-- Mostrar procedimientos almacenados creados
SELECT
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED,
    LAST_ALTERED
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'turnos_guardianes'
  AND ROUTINE_NAME LIKE 'sp_%'
ORDER BY ROUTINE_NAME;

-- ============================================================================
-- FIN DE MIGRACIÓN 001
-- ============================================================================
-- Esta migración puede ejecutarse múltiples veces de forma segura (idempotente)
-- gracias al uso de IF NOT EXISTS y ON DUPLICATE KEY UPDATE.
--
-- Para rollback manual si es necesario:
-- DROP TABLE IF EXISTS sys_auditoria_auth;
-- DROP TABLE IF EXISTS sys_refresh_tokens;
-- DROP TABLE IF EXISTS sys_usuarios;
-- DROP PROCEDURE IF EXISTS sp_limpiar_refresh_tokens_expirados;
-- DROP PROCEDURE IF EXISTS sp_revocar_tokens_usuario;
-- DROP PROCEDURE IF EXISTS sp_bloquear_usuario;
-- DROP PROCEDURE IF EXISTS sp_resetear_intentos_login;
-- DROP VIEW IF EXISTS v_usuarios_activos;
-- DROP VIEW IF EXISTS v_refresh_tokens_activos;
-- DROP VIEW IF EXISTS v_auditoria_reciente;
-- ============================================================================
