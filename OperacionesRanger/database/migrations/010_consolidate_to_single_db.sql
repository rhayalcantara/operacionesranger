-- ============================================================================
-- MIGRATION 010: Consolidate turnos_guardianes into db_aae4a2_ranger
-- ============================================================================
-- This script migrates all 18 tables, 5 views, 1 function, 7 stored procedures,
-- and 1 trigger from turnos_guardianes into db_aae4a2_ranger with ot_ prefix.
--
-- Source DB: turnos_guardianes
-- Target DB: db_aae4a2_ranger
-- Date: 2026-04-05
-- ============================================================================

USE db_aae4a2_ranger;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================================
-- STEP 1: CREATE TABLES (in FK dependency order)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 ot_configuracion_turnos (no FKs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_configuracion_turnos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `descripcion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_tipo_turno` (`tipo_turno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Configuracion de rangos horarios para turnos diurnos/nocturnos';

-- ----------------------------------------------------------------------------
-- 1.2 ot_clientes (no FKs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Codigo unico del cliente',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rnc` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RNC o Cedula',
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `contacto_nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del contacto principal',
  `contacto_telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_clientes_codigo` (`codigo`),
  KEY `ot_idx_clientes_codigo` (`codigo`),
  KEY `ot_idx_clientes_nombre` (`nombre`),
  KEY `ot_idx_clientes_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Clientes que contratan el servicio de seguridad';

-- ----------------------------------------------------------------------------
-- 1.3 ot_feriados (no FKs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_feriados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('NACIONAL','DECRETO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NACIONAL'
    COMMENT 'NACIONAL=feriado anual repetitivo, DECRETO=feriado especial por decreto',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_feriados_fecha` (`fecha`),
  KEY `ot_idx_feriados_fecha` (`fecha`),
  KEY `ot_idx_feriados_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Dias feriados nacionales y por decreto presidencial';

-- ----------------------------------------------------------------------------
-- 1.4 ot_sys_usuarios (self-referencing FKs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_sys_usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de usuario unico',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash bcrypt de la contrasena (10 rounds)',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email del usuario (opcional, unico si existe)',
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo del usuario',
  `rol` enum('ADMIN','SUPERVISOR','CONSULTA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONSULTA'
    COMMENT 'ADMIN=control total, SUPERVISOR=operacion diaria, CONSULTA=solo lectura',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Usuario activo/inactivo',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_modificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_login` timestamp NULL DEFAULT NULL COMMENT 'Fecha del ultimo login exitoso',
  `intentos_fallidos` int DEFAULT '0' COMMENT 'Contador de intentos fallidos de login',
  `bloqueado_hasta` timestamp NULL DEFAULT NULL COMMENT 'Fecha hasta la cual el usuario esta bloqueado',
  `created_by` int DEFAULT NULL COMMENT 'ID del usuario que creo este registro',
  `modified_by` int DEFAULT NULL COMMENT 'ID del ultimo usuario que modifico este registro',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `ot_sys_usuarios_username` (`username`),
  UNIQUE KEY `ot_sys_usuarios_email` (`email`),
  KEY `ot_idx_sys_usuarios_username` (`username`),
  KEY `ot_idx_sys_usuarios_rol` (`rol`),
  KEY `ot_idx_sys_usuarios_activo` (`activo`),
  KEY `ot_idx_sys_usuarios_email` (`email`),
  KEY `ot_sys_usuarios_created_by` (`created_by`),
  KEY `ot_sys_usuarios_modified_by` (`modified_by`),
  CONSTRAINT `ot_sys_usuarios_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `ot_sys_usuarios` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `ot_sys_usuarios_ibfk_2` FOREIGN KEY (`modified_by`) REFERENCES `ot_sys_usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema de operaciones con roles y permisos';

-- ----------------------------------------------------------------------------
-- 1.5 ot_ubicaciones (FK -> ot_clientes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_ubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Codigo unico de ubicacion',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `provincia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `municipio` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sector` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitud` decimal(10,8) DEFAULT NULL COMMENT 'Coordenada GPS',
  `longitud` decimal(11,8) DEFAULT NULL COMMENT 'Coordenada GPS',
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_cliente_codigo` (`cliente_id`,`codigo`),
  KEY `ot_idx_ubicaciones_cliente` (`cliente_id`),
  KEY `ot_idx_ubicaciones_activo` (`activo`),
  CONSTRAINT `ot_ubicaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `ot_clientes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ubicaciones fisicas de cada cliente';

-- ----------------------------------------------------------------------------
-- 1.6 ot_puestos (FK -> ot_ubicaciones)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_puestos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ubicacion_id` int NOT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Codigo unico del puesto',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `cantidad_guardianes` int NOT NULL DEFAULT '1' COMMENT 'Cantidad requerida de guardianes',
  `requiere_turno_diurno` tinyint(1) DEFAULT '1',
  `requiere_turno_nocturno` tinyint(1) DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_ubicacion_codigo` (`ubicacion_id`,`codigo`),
  KEY `ot_idx_puestos_ubicacion` (`ubicacion_id`),
  KEY `ot_idx_puestos_activo` (`activo`),
  CONSTRAINT `ot_puestos_ibfk_1` FOREIGN KEY (`ubicacion_id`) REFERENCES `ot_ubicaciones` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Puestos de vigilancia dentro de cada ubicacion';

-- ----------------------------------------------------------------------------
-- 1.7 ot_incentivos_puesto (FK -> ot_puestos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_incentivos_puesto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `puesto_id` int NOT NULL,
  `anio` smallint NOT NULL,
  `quincena` tinyint NOT NULL COMMENT '1-24 (2 quincenas por mes x 12 meses)',
  `monto` decimal(12,2) NOT NULL COMMENT 'Monto total del incentivo para la quincena',
  `valor_hora` decimal(10,4) GENERATED ALWAYS AS ((`monto` / 360)) STORED COMMENT 'Valor por hora = monto / (15 dias x 24 horas)',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_puesto_periodo` (`puesto_id`,`anio`,`quincena`),
  KEY `ot_idx_incentivos_puesto` (`puesto_id`),
  KEY `ot_idx_incentivos_periodo` (`anio`,`quincena`),
  KEY `ot_idx_incentivos_fechas` (`fecha_inicio`,`fecha_fin`),
  CONSTRAINT `ot_incentivos_puesto_ibfk_1` FOREIGN KEY (`puesto_id`) REFERENCES `ot_puestos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Incentivos asignados a puestos por quincena';

-- ----------------------------------------------------------------------------
-- 1.8 ot_turnos (FK -> ot_puestos, ot_feriados; empleado_id -> rh_empleado)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_turnos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `empleado_id` int NOT NULL COMMENT 'ID del empleado en tabla rh_empleado (misma BD)',
  `puesto_id` int NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` time NOT NULL,
  `hora_salida` time NOT NULL,
  `horas_normales` decimal(4,2) NOT NULL DEFAULT '0.00',
  `horas_extras` decimal(4,2) NOT NULL DEFAULT '0.00',
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_feriado` tinyint(1) DEFAULT '0',
  `feriado_id` int DEFAULT NULL COMMENT 'Referencia al feriado si aplica',
  `nomina_id` int DEFAULT NULL COMMENT 'ID de nomina asignado por sistema de nomina',
  `procesado_nomina` tinyint(1) DEFAULT '0',
  `fecha_procesado` datetime DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL COMMENT 'Usuario que registro',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_empleado_puesto_fecha` (`empleado_id`,`puesto_id`,`fecha`),
  KEY `ot_turnos_feriado_id` (`feriado_id`),
  KEY `ot_idx_turnos_empleado` (`empleado_id`),
  KEY `ot_idx_turnos_puesto` (`puesto_id`),
  KEY `ot_idx_turnos_fecha` (`fecha`),
  KEY `ot_idx_turnos_tipo_turno` (`tipo_turno`),
  KEY `ot_idx_turnos_nomina` (`nomina_id`),
  KEY `ot_idx_turnos_procesado` (`procesado_nomina`),
  KEY `ot_idx_turnos_fecha_empleado` (`fecha`,`empleado_id`),
  CONSTRAINT `ot_turnos_ibfk_1` FOREIGN KEY (`puesto_id`) REFERENCES `ot_puestos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ot_turnos_ibfk_2` FOREIGN KEY (`feriado_id`) REFERENCES `ot_feriados` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ot_turnos_ibfk_3` FOREIGN KEY (`empleado_id`) REFERENCES `rh_empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de turnos trabajados por los guardianes';

-- ----------------------------------------------------------------------------
-- 1.9 ot_sys_refresh_tokens (FK -> ot_sys_usuarios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_sys_refresh_tokens` (
  `id_token` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL COMMENT 'Usuario propietario del token',
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 del refresh token',
  `fecha_emision` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de emision del token',
  `fecha_expiracion` timestamp NOT NULL COMMENT 'Fecha de expiracion (7 dias por defecto)',
  `revocado` tinyint(1) DEFAULT '0' COMMENT 'Token revocado manualmente (logout)',
  `fecha_revocacion` timestamp NULL DEFAULT NULL COMMENT 'Fecha de revocacion si aplica',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP desde donde se emitio',
  `user_agent` text COLLATE utf8mb4_unicode_ci COMMENT 'User agent del navegador/cliente',
  PRIMARY KEY (`id_token`),
  UNIQUE KEY `ot_sys_refresh_tokens_hash` (`token_hash`),
  KEY `ot_idx_refresh_usuario` (`id_usuario`),
  KEY `ot_idx_refresh_token_hash` (`token_hash`),
  KEY `ot_idx_refresh_expiracion` (`fecha_expiracion`),
  KEY `ot_idx_refresh_revocado` (`revocado`),
  KEY `ot_idx_refresh_usuario_revocado` (`id_usuario`,`revocado`),
  CONSTRAINT `ot_sys_refresh_tokens_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `ot_sys_usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Refresh tokens para renovacion de acceso sin re-autenticacion';

-- ----------------------------------------------------------------------------
-- 1.10 ot_sys_auditoria_auth (FK -> ot_sys_usuarios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_sys_auditoria_auth` (
  `id_auditoria` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL COMMENT 'ID del usuario (NULL si el usuario no existe)',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Username del intento (registrado siempre)',
  `evento` enum('LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','TOKEN_REFRESH','PASSWORD_CHANGE') COLLATE utf8mb4_unicode_ci NOT NULL
    COMMENT 'Tipo de evento de autenticacion',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP desde donde se origino el evento',
  `user_agent` text COLLATE utf8mb4_unicode_ci COMMENT 'User agent del navegador/cliente',
  `detalles` text COLLATE utf8mb4_unicode_ci COMMENT 'Informacion adicional en JSON (razon de fallo, etc.)',
  `fecha_evento` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',
  PRIMARY KEY (`id_auditoria`),
  KEY `ot_idx_audit_auth_usuario` (`id_usuario`),
  KEY `ot_idx_audit_auth_evento` (`evento`),
  KEY `ot_idx_audit_auth_fecha` (`fecha_evento`),
  KEY `ot_idx_audit_auth_usuario_evento` (`id_usuario`,`evento`),
  KEY `ot_idx_audit_auth_fecha_evento` (`fecha_evento`,`evento`),
  CONSTRAINT `ot_sys_auditoria_auth_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `ot_sys_usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Auditoria de eventos de autenticacion para trazabilidad y seguridad';

-- ----------------------------------------------------------------------------
-- 1.11 ot_sys_auditoria (FK -> ot_sys_usuarios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_sys_auditoria` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Audit record ID',
  `user_id` int NOT NULL COMMENT 'User who performed the action (FK to ot_sys_usuarios)',
  `accion` enum('CREATE','UPDATE','DELETE') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Action type',
  `entidad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entity name (table or resource)',
  `entidad_id` int DEFAULT NULL COMMENT 'ID of the affected record (NULL for bulk operations)',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Client IP address (supports IPv4 and IPv6)',
  `datos_anteriores` json DEFAULT NULL COMMENT 'Data before the change (for UPDATE and DELETE)',
  `datos_nuevos` json DEFAULT NULL COMMENT 'Data after the change (for CREATE and UPDATE)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the action',
  PRIMARY KEY (`id`),
  KEY `ot_idx_auditoria_user_id` (`user_id`),
  KEY `ot_idx_auditoria_entidad` (`entidad`),
  KEY `ot_idx_auditoria_created_at` (`created_at`),
  KEY `ot_idx_auditoria_entidad_id` (`entidad_id`),
  KEY `ot_idx_auditoria_accion` (`accion`),
  KEY `ot_idx_auditoria_user_entidad` (`user_id`,`entidad`),
  KEY `ot_idx_auditoria_entidad_fecha` (`entidad`,`created_at`),
  CONSTRAINT `ot_fk_auditoria_user` FOREIGN KEY (`user_id`) REFERENCES `ot_sys_usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail for CRUD operations';

-- ----------------------------------------------------------------------------
-- 1.12 ot_sys_reportes_generados (FK -> ot_sys_usuarios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_sys_reportes_generados` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID unico del registro de historial de reporte',
  `user_id` int NOT NULL COMMENT 'ID del usuario que genero el reporte (FK a ot_sys_usuarios)',
  `fecha_inicio` date NOT NULL COMMENT 'Fecha de inicio del rango del reporte (YYYY-MM-DD)',
  `fecha_fin` date NOT NULL COMMENT 'Fecha de fin del rango del reporte (YYYY-MM-DD)',
  `cantidad_turnos` int NOT NULL DEFAULT '0' COMMENT 'Cantidad de turnos incluidos en el reporte generado',
  `fecha_generacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp de cuando se genero el reporte',
  `nomina_id` int DEFAULT NULL COMMENT 'ID de la nomina en el sistema externo (NULL hasta que se procese)',
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del archivo CSV generado',
  PRIMARY KEY (`id`),
  KEY `ot_idx_reportes_user` (`user_id`),
  KEY `ot_idx_reportes_fechas` (`fecha_inicio`,`fecha_fin`),
  KEY `ot_idx_reportes_nomina` (`nomina_id`),
  KEY `ot_idx_reportes_generacion` (`fecha_generacion` DESC),
  CONSTRAINT `ot_fk_reportes_generados_user` FOREIGN KEY (`user_id`) REFERENCES `ot_sys_usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Historial de reportes CSV generados para integracion con sistema de nomina';

-- ----------------------------------------------------------------------------
-- 1.13 ot_servicios_puesto (FK -> ot_puestos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_servicios_puesto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `puesto_id` int NOT NULL,
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `domingo_empleado_id` int DEFAULT NULL,
  `lunes_empleado_id` int DEFAULT NULL,
  `martes_empleado_id` int DEFAULT NULL,
  `miercoles_empleado_id` int DEFAULT NULL,
  `jueves_empleado_id` int DEFAULT NULL,
  `viernes_empleado_id` int DEFAULT NULL,
  `sabado_empleado_id` int DEFAULT NULL,
  `cobrada` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Servicio facturado/cobrado',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_puesto_tipo_turno` (`puesto_id`,`tipo_turno`),
  KEY `ot_idx_servicios_puesto_activo` (`activo`),
  KEY `ot_idx_servicios_puesto_cobrada` (`cobrada`),
  CONSTRAINT `ot_fk_servicios_puesto_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `ot_puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Asignacion semanal de guardianes a puestos de vigilancia';

-- ----------------------------------------------------------------------------
-- 1.14 ot_diario_puesto (FK -> ot_puestos, ot_servicios_puesto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_diario_puesto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `puesto_id` int NOT NULL,
  `empleado_id` int NOT NULL COMMENT 'Referencia a rh_empleado.id_empleado',
  `fecha` date NOT NULL,
  `horas` decimal(4,2) NOT NULL DEFAULT '0.00' COMMENT 'Horas trabajadas',
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `servicio_puesto_id` int DEFAULT NULL COMMENT 'NULL si fue entrada manual',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_diario_puesto_empleado_fecha` (`puesto_id`,`empleado_id`,`fecha`),
  KEY `ot_fk_diario_puesto_servicio` (`servicio_puesto_id`),
  KEY `ot_idx_diario_puesto_fecha` (`fecha`),
  KEY `ot_idx_diario_puesto_empleado` (`empleado_id`),
  KEY `ot_idx_diario_puesto_activo` (`activo`),
  KEY `ot_idx_diario_puesto_tipo` (`tipo_turno`),
  CONSTRAINT `ot_fk_diario_puesto_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `ot_puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ot_fk_diario_puesto_servicio` FOREIGN KEY (`servicio_puesto_id`) REFERENCES `ot_servicios_puesto` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ot_chk_horas` CHECK ((`horas` >= 0) AND (`horas` <= 24))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro diario de asistencia de guardianes por puesto';

-- ----------------------------------------------------------------------------
-- 1.15 ot_cronogramas (no FK)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_cronogramas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ot_idx_cronogramas_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cabecera de cronogramas semanales de trabajo';

-- ----------------------------------------------------------------------------
-- 1.16 ot_cronogramas_detalle (FK -> ot_cronogramas, ot_puestos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_cronogramas_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cronograma_id` int NOT NULL,
  `dia_semana` tinyint NOT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=Sabado',
  `puesto_id` int NOT NULL,
  `empleado_id` int NOT NULL COMMENT 'Referencia a rh_empleado.id_empleado',
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_cronograma_empleado_dia` (`cronograma_id`,`empleado_id`,`dia_semana`),
  KEY `ot_fk_cronograma_det_puesto` (`puesto_id`),
  KEY `ot_idx_cronogramas_det_dia` (`dia_semana`),
  KEY `ot_idx_cronogramas_det_empleado` (`empleado_id`),
  CONSTRAINT `ot_fk_cronograma_det_cronograma` FOREIGN KEY (`cronograma_id`) REFERENCES `ot_cronogramas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ot_fk_cronograma_det_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `ot_puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ot_chk_dia_semana` CHECK (`dia_semana` BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Detalle de asignaciones diarias en cronogramas semanales';

-- ----------------------------------------------------------------------------
-- 1.17 ot_plantillas_servicio (no FK)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_plantillas_servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ot_idx_plantillas_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Plantillas reutilizables de servicios por puesto';

-- ----------------------------------------------------------------------------
-- 1.18 ot_plantillas_servicio_detalle (FK -> ot_plantillas_servicio, ot_puestos, ot_servicios_puesto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_plantillas_servicio_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plantilla_id` int NOT NULL,
  `puesto_id` int NOT NULL,
  `servicio_puesto_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ot_uk_plantilla_servicio` (`plantilla_id`,`servicio_puesto_id`),
  KEY `ot_fk_plantilla_det_puesto` (`puesto_id`),
  KEY `ot_fk_plantilla_det_servicio` (`servicio_puesto_id`),
  CONSTRAINT `ot_fk_plantilla_det_plantilla` FOREIGN KEY (`plantilla_id`) REFERENCES `ot_plantillas_servicio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ot_fk_plantilla_det_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `ot_puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ot_fk_plantilla_det_servicio` FOREIGN KEY (`servicio_puesto_id`) REFERENCES `ot_servicios_puesto` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Detalle de servicios incluidos en cada plantilla';


-- ============================================================================
-- STEP 2: COPY DATA FROM turnos_guardianes
-- ============================================================================
-- Order respects FK dependencies. Uses INSERT IGNORE to make re-runnable.

-- 2.1 configuracion_turnos
INSERT IGNORE INTO `ot_configuracion_turnos` (`id`, `tipo_turno`, `hora_inicio`, `hora_fin`, `descripcion`, `activo`, `created_at`, `updated_at`)
SELECT `id`, `tipo_turno`, `hora_inicio`, `hora_fin`, `descripcion`, `activo`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`configuracion_turnos`;

-- 2.2 clientes
INSERT IGNORE INTO `ot_clientes` (`id`, `codigo`, `nombre`, `rnc`, `telefono`, `email`, `direccion`, `contacto_nombre`, `contacto_telefono`, `activo`, `created_at`, `updated_at`)
SELECT `id`, `codigo`, `nombre`, `rnc`, `telefono`, `email`, `direccion`, `contacto_nombre`, `contacto_telefono`, `activo`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`clientes`;

-- 2.3 feriados
INSERT IGNORE INTO `ot_feriados` (`id`, `fecha`, `nombre`, `tipo`, `descripcion`, `created_at`)
SELECT `id`, `fecha`, `nombre`, `tipo`, `descripcion`, `created_at`
FROM `turnos_guardianes`.`feriados`;

-- 2.4 sys_usuarios (self-ref FK: insert without created_by/modified_by first, then update)
INSERT IGNORE INTO `ot_sys_usuarios` (`id_usuario`, `username`, `password_hash`, `email`, `nombre_completo`, `rol`, `activo`, `fecha_creacion`, `fecha_modificacion`, `ultimo_login`, `intentos_fallidos`, `bloqueado_hasta`, `created_by`, `modified_by`)
SELECT `id_usuario`, `username`, `password_hash`, `email`, `nombre_completo`, `rol`, `activo`, `fecha_creacion`, `fecha_modificacion`, `ultimo_login`, `intentos_fallidos`, `bloqueado_hasta`, `created_by`, `modified_by`
FROM `turnos_guardianes`.`sys_usuarios`;

-- 2.5 ubicaciones
INSERT IGNORE INTO `ot_ubicaciones` (`id`, `cliente_id`, `codigo`, `nombre`, `direccion`, `provincia`, `municipio`, `sector`, `latitud`, `longitud`, `telefono`, `contacto_nombre`, `contacto_telefono`, `activo`, `created_at`, `updated_at`)
SELECT `id`, `cliente_id`, `codigo`, `nombre`, `direccion`, `provincia`, `municipio`, `sector`, `latitud`, `longitud`, `telefono`, `contacto_nombre`, `contacto_telefono`, `activo`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`ubicaciones`;

-- 2.6 puestos
INSERT IGNORE INTO `ot_puestos` (`id`, `ubicacion_id`, `codigo`, `nombre`, `descripcion`, `cantidad_guardianes`, `requiere_turno_diurno`, `requiere_turno_nocturno`, `activo`, `created_at`, `updated_at`)
SELECT `id`, `ubicacion_id`, `codigo`, `nombre`, `descripcion`, `cantidad_guardianes`, `requiere_turno_diurno`, `requiere_turno_nocturno`, `activo`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`puestos`;

-- 2.7 incentivos_puesto (has GENERATED column valor_hora, exclude it)
INSERT IGNORE INTO `ot_incentivos_puesto` (`id`, `puesto_id`, `anio`, `quincena`, `monto`, `fecha_inicio`, `fecha_fin`, `observaciones`, `created_at`, `updated_at`)
SELECT `id`, `puesto_id`, `anio`, `quincena`, `monto`, `fecha_inicio`, `fecha_fin`, `observaciones`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`incentivos_puesto`;

-- 2.8 turnos
INSERT IGNORE INTO `ot_turnos` (`id`, `empleado_id`, `puesto_id`, `fecha`, `hora_entrada`, `hora_salida`, `horas_normales`, `horas_extras`, `tipo_turno`, `es_feriado`, `feriado_id`, `nomina_id`, `procesado_nomina`, `fecha_procesado`, `observaciones`, `created_by`, `created_at`, `updated_at`)
SELECT `id`, `empleado_id`, `puesto_id`, `fecha`, `hora_entrada`, `hora_salida`, `horas_normales`, `horas_extras`, `tipo_turno`, `es_feriado`, `feriado_id`, `nomina_id`, `procesado_nomina`, `fecha_procesado`, `observaciones`, `created_by`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`turnos`;

-- 2.9 sys_refresh_tokens
INSERT IGNORE INTO `ot_sys_refresh_tokens` (`id_token`, `id_usuario`, `token_hash`, `fecha_emision`, `fecha_expiracion`, `revocado`, `fecha_revocacion`, `ip_address`, `user_agent`)
SELECT `id_token`, `id_usuario`, `token_hash`, `fecha_emision`, `fecha_expiracion`, `revocado`, `fecha_revocacion`, `ip_address`, `user_agent`
FROM `turnos_guardianes`.`sys_refresh_tokens`;

-- 2.10 sys_auditoria_auth
INSERT IGNORE INTO `ot_sys_auditoria_auth` (`id_auditoria`, `id_usuario`, `username`, `evento`, `ip_address`, `user_agent`, `detalles`, `fecha_evento`)
SELECT `id_auditoria`, `id_usuario`, `username`, `evento`, `ip_address`, `user_agent`, `detalles`, `fecha_evento`
FROM `turnos_guardianes`.`sys_auditoria_auth`;

-- 2.11 sys_auditoria
INSERT IGNORE INTO `ot_sys_auditoria` (`id`, `user_id`, `accion`, `entidad`, `entidad_id`, `ip_address`, `datos_anteriores`, `datos_nuevos`, `created_at`)
SELECT `id`, `user_id`, `accion`, `entidad`, `entidad_id`, `ip_address`, `datos_anteriores`, `datos_nuevos`, `created_at`
FROM `turnos_guardianes`.`sys_auditoria`;

-- 2.12 sys_reportes_generados
INSERT IGNORE INTO `ot_sys_reportes_generados` (`id`, `user_id`, `fecha_inicio`, `fecha_fin`, `cantidad_turnos`, `fecha_generacion`, `nomina_id`, `nombre_archivo`)
SELECT `id`, `user_id`, `fecha_inicio`, `fecha_fin`, `cantidad_turnos`, `fecha_generacion`, `nomina_id`, `nombre_archivo`
FROM `turnos_guardianes`.`sys_reportes_generados`;

-- 2.13 servicios_puesto
INSERT IGNORE INTO `ot_servicios_puesto` (`id`, `puesto_id`, `tipo_turno`, `domingo_empleado_id`, `lunes_empleado_id`, `martes_empleado_id`, `miercoles_empleado_id`, `jueves_empleado_id`, `viernes_empleado_id`, `sabado_empleado_id`, `cobrada`, `activo`, `created_by`, `created_at`, `updated_at`)
SELECT `id`, `puesto_id`, `tipo_turno`, `domingo_empleado_id`, `lunes_empleado_id`, `martes_empleado_id`, `miercoles_empleado_id`, `jueves_empleado_id`, `viernes_empleado_id`, `sabado_empleado_id`, `cobrada`, `activo`, `created_by`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`servicios_puesto`;

-- 2.14 diario_puesto
INSERT IGNORE INTO `ot_diario_puesto` (`id`, `puesto_id`, `empleado_id`, `fecha`, `horas`, `tipo_turno`, `servicio_puesto_id`, `activo`, `created_by`, `created_at`, `updated_at`)
SELECT `id`, `puesto_id`, `empleado_id`, `fecha`, `horas`, `tipo_turno`, `servicio_puesto_id`, `activo`, `created_by`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`diario_puesto`;

-- 2.15 cronogramas
INSERT IGNORE INTO `ot_cronogramas` (`id`, `nombre`, `descripcion`, `activo`, `created_by`, `created_at`, `updated_at`)
SELECT `id`, `nombre`, `descripcion`, `activo`, `created_by`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`cronogramas`;

-- 2.16 cronogramas_detalle
INSERT IGNORE INTO `ot_cronogramas_detalle` (`id`, `cronograma_id`, `dia_semana`, `puesto_id`, `empleado_id`, `tipo_turno`, `created_at`)
SELECT `id`, `cronograma_id`, `dia_semana`, `puesto_id`, `empleado_id`, `tipo_turno`, `created_at`
FROM `turnos_guardianes`.`cronogramas_detalle`;

-- 2.17 plantillas_servicio
INSERT IGNORE INTO `ot_plantillas_servicio` (`id`, `nombre`, `descripcion`, `activo`, `created_by`, `created_at`, `updated_at`)
SELECT `id`, `nombre`, `descripcion`, `activo`, `created_by`, `created_at`, `updated_at`
FROM `turnos_guardianes`.`plantillas_servicio`;

-- 2.18 plantillas_servicio_detalle
INSERT IGNORE INTO `ot_plantillas_servicio_detalle` (`id`, `plantilla_id`, `puesto_id`, `servicio_puesto_id`, `created_at`)
SELECT `id`, `plantilla_id`, `puesto_id`, `servicio_puesto_id`, `created_at`
FROM `turnos_guardianes`.`plantillas_servicio_detalle`;


-- ============================================================================
-- STEP 3: MIGRATE VIEWS (with ot_v_ prefix, updated table references)
-- ============================================================================

-- 3.1 ot_v_auditoria_reciente
DROP VIEW IF EXISTS `ot_v_auditoria_reciente`;
CREATE VIEW `ot_v_auditoria_reciente` AS
SELECT
    `a`.`id_auditoria` AS `id_auditoria`,
    `a`.`id_usuario` AS `id_usuario`,
    `u`.`username` AS `username_actual`,
    `a`.`username` AS `username_intento`,
    `a`.`evento` AS `evento`,
    `a`.`ip_address` AS `ip_address`,
    `a`.`fecha_evento` AS `fecha_evento`,
    `a`.`detalles` AS `detalles`
FROM `ot_sys_auditoria_auth` `a`
LEFT JOIN `ot_sys_usuarios` `u` ON (`a`.`id_usuario` = `u`.`id_usuario`)
WHERE `a`.`fecha_evento` >= (NOW() - INTERVAL 24 HOUR)
ORDER BY `a`.`fecha_evento` DESC;

-- 3.2 ot_v_refresh_tokens_activos
DROP VIEW IF EXISTS `ot_v_refresh_tokens_activos`;
CREATE VIEW `ot_v_refresh_tokens_activos` AS
SELECT
    `rt`.`id_token` AS `id_token`,
    `rt`.`id_usuario` AS `id_usuario`,
    `u`.`username` AS `username`,
    `rt`.`fecha_emision` AS `fecha_emision`,
    `rt`.`fecha_expiracion` AS `fecha_expiracion`,
    `rt`.`ip_address` AS `ip_address`,
    TIMESTAMPDIFF(HOUR, NOW(), `rt`.`fecha_expiracion`) AS `horas_restantes`
FROM `ot_sys_refresh_tokens` `rt`
JOIN `ot_sys_usuarios` `u` ON (`rt`.`id_usuario` = `u`.`id_usuario`)
WHERE `rt`.`revocado` = FALSE
  AND `rt`.`fecha_expiracion` > NOW()
ORDER BY `rt`.`fecha_expiracion`;

-- 3.3 ot_v_reporte_nomina
DROP VIEW IF EXISTS `ot_v_reporte_nomina`;
CREATE VIEW `ot_v_reporte_nomina` AS
SELECT
    `t`.`id` AS `turno_id`,
    `t`.`fecha` AS `fecha`,
    `t`.`empleado_id` AS `empleado_id`,
    `p`.`id` AS `puesto_id`,
    `p`.`codigo` AS `puesto_codigo`,
    `p`.`nombre` AS `puesto_nombre`,
    `u`.`nombre` AS `ubicacion_nombre`,
    `c`.`nombre` AS `cliente_nombre`,
    `t`.`horas_normales` AS `horas_normales`,
    `t`.`horas_extras` AS `horas_extras`,
    (`t`.`horas_normales` + `t`.`horas_extras`) AS `total_horas`,
    `t`.`tipo_turno` AS `tipo_turno`,
    `t`.`es_feriado` AS `es_feriado`,
    CASE WHEN `t`.`es_feriado` THEN `f`.`tipo` ELSE NULL END AS `tipo_feriado`,
    CASE WHEN `t`.`es_feriado` THEN `f`.`nombre` ELSE NULL END AS `nombre_feriado`,
    COALESCE(`i`.`valor_hora`, 0) AS `incentivo_valor_hora`,
    COALESCE(`i`.`valor_hora` * (`t`.`horas_normales` + `t`.`horas_extras`), 0) AS `incentivo_calculado`,
    `t`.`nomina_id` AS `nomina_id`,
    `t`.`procesado_nomina` AS `procesado_nomina`
FROM `ot_turnos` `t`
JOIN `ot_puestos` `p` ON (`t`.`puesto_id` = `p`.`id`)
JOIN `ot_ubicaciones` `u` ON (`p`.`ubicacion_id` = `u`.`id`)
JOIN `ot_clientes` `c` ON (`u`.`cliente_id` = `c`.`id`)
LEFT JOIN `ot_feriados` `f` ON (`t`.`feriado_id` = `f`.`id`)
LEFT JOIN `ot_incentivos_puesto` `i` ON (`p`.`id` = `i`.`puesto_id` AND `t`.`fecha` BETWEEN `i`.`fecha_inicio` AND `i`.`fecha_fin`)
ORDER BY `t`.`fecha`, `t`.`empleado_id`;

-- 3.4 ot_v_resumen_quincena
DROP VIEW IF EXISTS `ot_v_resumen_quincena`;
CREATE VIEW `ot_v_resumen_quincena` AS
SELECT
    `t`.`empleado_id` AS `empleado_id`,
    YEAR(`t`.`fecha`) AS `anio`,
    CASE
        WHEN DAYOFMONTH(`t`.`fecha`) <= 15 THEN (MONTH(`t`.`fecha`) * 2) - 1
        ELSE MONTH(`t`.`fecha`) * 2
    END AS `quincena`,
    MIN(`t`.`fecha`) AS `fecha_inicio`,
    MAX(`t`.`fecha`) AS `fecha_fin`,
    COUNT(DISTINCT `t`.`fecha`) AS `dias_trabajados`,
    SUM(CASE WHEN `t`.`tipo_turno` = 'DIURNO' THEN `t`.`horas_normales` ELSE 0 END) AS `horas_normales_diurnas`,
    SUM(CASE WHEN `t`.`tipo_turno` = 'NOCTURNO' THEN `t`.`horas_normales` ELSE 0 END) AS `horas_normales_nocturnas`,
    SUM(CASE WHEN `t`.`tipo_turno` = 'DIURNO' THEN `t`.`horas_extras` ELSE 0 END) AS `horas_extras_diurnas`,
    SUM(CASE WHEN `t`.`tipo_turno` = 'NOCTURNO' THEN `t`.`horas_extras` ELSE 0 END) AS `horas_extras_nocturnas`,
    SUM(CASE WHEN `t`.`es_feriado` THEN (`t`.`horas_normales` + `t`.`horas_extras`) ELSE 0 END) AS `horas_feriados`,
    SUM(`t`.`horas_normales` + `t`.`horas_extras`) AS `total_horas`,
    SUM(COALESCE(`i`.`valor_hora` * (`t`.`horas_normales` + `t`.`horas_extras`), 0)) AS `total_incentivos`
FROM `ot_turnos` `t`
LEFT JOIN `ot_incentivos_puesto` `i` ON (`t`.`puesto_id` = `i`.`puesto_id` AND `t`.`fecha` BETWEEN `i`.`fecha_inicio` AND `i`.`fecha_fin`)
GROUP BY `t`.`empleado_id`, YEAR(`t`.`fecha`),
    CASE
        WHEN DAYOFMONTH(`t`.`fecha`) <= 15 THEN (MONTH(`t`.`fecha`) * 2) - 1
        ELSE MONTH(`t`.`fecha`) * 2
    END;

-- 3.5 ot_v_usuarios_activos
DROP VIEW IF EXISTS `ot_v_usuarios_activos`;
CREATE VIEW `ot_v_usuarios_activos` AS
SELECT
    `id_usuario`,
    `username`,
    `email`,
    `nombre_completo`,
    `rol`,
    `activo`,
    `fecha_creacion`,
    `fecha_modificacion`,
    `ultimo_login`
FROM `ot_sys_usuarios`
WHERE `activo` = TRUE;


-- ============================================================================
-- STEP 4: MIGRATE STORED PROCEDURES & FUNCTIONS (with ot_sp_/ot_fn_ prefix)
-- ============================================================================

-- 4.1 ot_fn_obtener_quincena
DROP FUNCTION IF EXISTS `ot_fn_obtener_quincena`;
DELIMITER ;;
CREATE FUNCTION `ot_fn_obtener_quincena`(p_fecha DATE) RETURNS int
    DETERMINISTIC
BEGIN
    DECLARE v_mes INT;
    DECLARE v_dia INT;
    DECLARE v_quincena INT;

    SET v_mes = MONTH(p_fecha);
    SET v_dia = DAY(p_fecha);

    IF v_dia <= 15 THEN
        SET v_quincena = (v_mes * 2) - 1;
    ELSE
        SET v_quincena = v_mes * 2;
    END IF;

    RETURN v_quincena;
END ;;
DELIMITER ;

-- 4.2 ot_sp_bloquear_usuario
DROP PROCEDURE IF EXISTS `ot_sp_bloquear_usuario`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_bloquear_usuario`(
    IN p_id_usuario INT,
    IN p_minutos_bloqueo INT
)
BEGIN
    UPDATE `ot_sys_usuarios`
    SET bloqueado_hasta = DATE_ADD(NOW(), INTERVAL p_minutos_bloqueo MINUTE)
    WHERE id_usuario = p_id_usuario;

    SELECT bloqueado_hasta
    FROM `ot_sys_usuarios`
    WHERE id_usuario = p_id_usuario;
END ;;
DELIMITER ;

-- 4.3 ot_sp_determinar_tipo_turno
DROP PROCEDURE IF EXISTS `ot_sp_determinar_tipo_turno`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_determinar_tipo_turno`(
    IN p_hora TIME,
    OUT p_tipo_turno VARCHAR(10)
)
BEGIN
    DECLARE v_hora_inicio_diurno TIME;
    DECLARE v_hora_fin_diurno TIME;

    SELECT hora_inicio, hora_fin
    INTO v_hora_inicio_diurno, v_hora_fin_diurno
    FROM `ot_configuracion_turnos`
    WHERE tipo_turno = 'DIURNO' AND activo = TRUE
    LIMIT 1;

    IF p_hora >= v_hora_inicio_diurno AND p_hora < v_hora_fin_diurno THEN
        SET p_tipo_turno = 'DIURNO';
    ELSE
        SET p_tipo_turno = 'NOCTURNO';
    END IF;
END ;;
DELIMITER ;

-- 4.4 ot_sp_verificar_feriado
DROP PROCEDURE IF EXISTS `ot_sp_verificar_feriado`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_verificar_feriado`(
    IN p_fecha DATE,
    OUT p_es_feriado BOOLEAN,
    OUT p_feriado_id INT,
    OUT p_tipo_feriado VARCHAR(20)
)
BEGIN
    SELECT
        TRUE,
        id,
        tipo
    INTO
        p_es_feriado,
        p_feriado_id,
        p_tipo_feriado
    FROM `ot_feriados`
    WHERE fecha = p_fecha
    LIMIT 1;

    IF p_es_feriado IS NULL THEN
        SET p_es_feriado = FALSE;
        SET p_feriado_id = NULL;
        SET p_tipo_feriado = NULL;
    END IF;
END ;;
DELIMITER ;

-- 4.5 ot_sp_registrar_turno
DROP PROCEDURE IF EXISTS `ot_sp_registrar_turno`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_registrar_turno`(
    IN p_empleado_id INT,
    IN p_puesto_id INT,
    IN p_fecha DATE,
    IN p_hora_entrada TIME,
    IN p_hora_salida TIME,
    IN p_horas_normales DECIMAL(4,2),
    IN p_horas_extras DECIMAL(4,2),
    IN p_observaciones TEXT,
    IN p_created_by INT,
    OUT p_turno_id BIGINT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_tipo_turno VARCHAR(10);
    DECLARE v_es_feriado BOOLEAN;
    DECLARE v_feriado_id INT;
    DECLARE v_tipo_feriado VARCHAR(20);
    DECLARE v_existe INT DEFAULT 0;

    SELECT COUNT(*) INTO v_existe
    FROM `ot_turnos`
    WHERE empleado_id = p_empleado_id
      AND puesto_id = p_puesto_id
      AND fecha = p_fecha;

    IF v_existe > 0 THEN
        SET p_turno_id = NULL;
        SET p_mensaje = 'ERROR: Ya existe un turno registrado para este empleado en este puesto y fecha';
    ELSE
        CALL `ot_sp_determinar_tipo_turno`(p_hora_entrada, v_tipo_turno);
        CALL `ot_sp_verificar_feriado`(p_fecha, v_es_feriado, v_feriado_id, v_tipo_feriado);

        INSERT INTO `ot_turnos` (
            empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
            horas_normales, horas_extras, tipo_turno, es_feriado,
            feriado_id, observaciones, created_by
        ) VALUES (
            p_empleado_id, p_puesto_id, p_fecha, p_hora_entrada, p_hora_salida,
            p_horas_normales, p_horas_extras, v_tipo_turno, v_es_feriado,
            v_feriado_id, p_observaciones, p_created_by
        );

        SET p_turno_id = LAST_INSERT_ID();
        SET p_mensaje = CONCAT('Turno registrado exitosamente. ID: ', p_turno_id);
    END IF;
END ;;
DELIMITER ;

-- 4.6 ot_sp_generar_reporte_nomina
DROP PROCEDURE IF EXISTS `ot_sp_generar_reporte_nomina`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_generar_reporte_nomina`(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    SELECT
        t.fecha,
        t.empleado_id,
        p.codigo AS puesto_codigo,
        t.horas_normales,
        t.horas_extras,
        t.tipo_turno,
        CASE WHEN t.es_feriado THEN 'SI' ELSE 'NO' END AS es_feriado,
        CASE
            WHEN t.es_feriado THEN f.tipo
            ELSE 'N/A'
        END AS tipo_feriado,
        COALESCE(ROUND(i.valor_hora * (t.horas_normales + t.horas_extras), 2), 0) AS incentivo
    FROM `ot_turnos` t
    INNER JOIN `ot_puestos` p ON t.puesto_id = p.id
    LEFT JOIN `ot_feriados` f ON t.feriado_id = f.id
    LEFT JOIN `ot_incentivos_puesto` i ON p.id = i.puesto_id
        AND t.fecha BETWEEN i.fecha_inicio AND i.fecha_fin
    WHERE t.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
      AND t.procesado_nomina = FALSE
    ORDER BY t.empleado_id, t.fecha;
END ;;
DELIMITER ;

-- 4.7 ot_sp_limpiar_refresh_tokens_expirados
DROP PROCEDURE IF EXISTS `ot_sp_limpiar_refresh_tokens_expirados`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_limpiar_refresh_tokens_expirados`()
BEGIN
    DELETE FROM `ot_sys_refresh_tokens`
    WHERE fecha_expiracion < NOW()
       OR revocado = TRUE;

    SELECT ROW_COUNT() AS tokens_eliminados;
END ;;
DELIMITER ;

-- 4.8 ot_sp_resetear_intentos_login
DROP PROCEDURE IF EXISTS `ot_sp_resetear_intentos_login`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_resetear_intentos_login`(
    IN p_id_usuario INT
)
BEGIN
    UPDATE `ot_sys_usuarios`
    SET intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        ultimo_login = NOW()
    WHERE id_usuario = p_id_usuario;
END ;;
DELIMITER ;

-- 4.9 ot_sp_revocar_tokens_usuario
DROP PROCEDURE IF EXISTS `ot_sp_revocar_tokens_usuario`;
DELIMITER ;;
CREATE PROCEDURE `ot_sp_revocar_tokens_usuario`(
    IN p_id_usuario INT
)
BEGIN
    UPDATE `ot_sys_refresh_tokens`
    SET revocado = TRUE,
        fecha_revocacion = NOW()
    WHERE id_usuario = p_id_usuario
      AND revocado = FALSE;

    SELECT ROW_COUNT() AS tokens_revocados;
END ;;
DELIMITER ;


-- ============================================================================
-- STEP 5: MIGRATE TRIGGERS (with ot_trg_ prefix)
-- ============================================================================

-- 5.1 ot_trg_turnos_before_insert
DROP TRIGGER IF EXISTS `ot_trg_turnos_before_insert`;
DELIMITER ;;
CREATE TRIGGER `ot_trg_turnos_before_insert` BEFORE INSERT ON `ot_turnos` FOR EACH ROW
BEGIN
    IF NEW.horas_normales > 12 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Las horas normales no pueden exceder 12';
    END IF;

    IF NEW.horas_extras > 4 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Las horas extras no pueden exceder 4';
    END IF;

    IF (NEW.horas_normales + NEW.horas_extras) > 16 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El total de horas no puede exceder 16';
    END IF;
END ;;
DELIMITER ;


-- ============================================================================
-- STEP 6: VERIFICATION - Compare row counts between source and target
-- ============================================================================

SELECT 'VERIFICATION: Row count comparison between turnos_guardianes and ot_ tables' AS ``;

SELECT 'configuracion_turnos' AS tabla,
    (SELECT COUNT(*) FROM `turnos_guardianes`.`configuracion_turnos`) AS origen,
    (SELECT COUNT(*) FROM `ot_configuracion_turnos`) AS destino,
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`configuracion_turnos`) = (SELECT COUNT(*) FROM `ot_configuracion_turnos`) THEN 'OK' ELSE 'MISMATCH' END AS estado
UNION ALL
SELECT 'clientes',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`clientes`),
    (SELECT COUNT(*) FROM `ot_clientes`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`clientes`) = (SELECT COUNT(*) FROM `ot_clientes`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'feriados',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`feriados`),
    (SELECT COUNT(*) FROM `ot_feriados`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`feriados`) = (SELECT COUNT(*) FROM `ot_feriados`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'sys_usuarios',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_usuarios`),
    (SELECT COUNT(*) FROM `ot_sys_usuarios`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_usuarios`) = (SELECT COUNT(*) FROM `ot_sys_usuarios`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'ubicaciones',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`ubicaciones`),
    (SELECT COUNT(*) FROM `ot_ubicaciones`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`ubicaciones`) = (SELECT COUNT(*) FROM `ot_ubicaciones`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'puestos',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`puestos`),
    (SELECT COUNT(*) FROM `ot_puestos`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`puestos`) = (SELECT COUNT(*) FROM `ot_puestos`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'incentivos_puesto',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`incentivos_puesto`),
    (SELECT COUNT(*) FROM `ot_incentivos_puesto`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`incentivos_puesto`) = (SELECT COUNT(*) FROM `ot_incentivos_puesto`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'turnos',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`turnos`),
    (SELECT COUNT(*) FROM `ot_turnos`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`turnos`) = (SELECT COUNT(*) FROM `ot_turnos`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'sys_refresh_tokens',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_refresh_tokens`),
    (SELECT COUNT(*) FROM `ot_sys_refresh_tokens`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_refresh_tokens`) = (SELECT COUNT(*) FROM `ot_sys_refresh_tokens`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'sys_auditoria_auth',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_auditoria_auth`),
    (SELECT COUNT(*) FROM `ot_sys_auditoria_auth`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_auditoria_auth`) = (SELECT COUNT(*) FROM `ot_sys_auditoria_auth`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'sys_auditoria',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_auditoria`),
    (SELECT COUNT(*) FROM `ot_sys_auditoria`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_auditoria`) = (SELECT COUNT(*) FROM `ot_sys_auditoria`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'sys_reportes_generados',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_reportes_generados`),
    (SELECT COUNT(*) FROM `ot_sys_reportes_generados`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`sys_reportes_generados`) = (SELECT COUNT(*) FROM `ot_sys_reportes_generados`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'servicios_puesto',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`servicios_puesto`),
    (SELECT COUNT(*) FROM `ot_servicios_puesto`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`servicios_puesto`) = (SELECT COUNT(*) FROM `ot_servicios_puesto`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'diario_puesto',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`diario_puesto`),
    (SELECT COUNT(*) FROM `ot_diario_puesto`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`diario_puesto`) = (SELECT COUNT(*) FROM `ot_diario_puesto`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'cronogramas',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`cronogramas`),
    (SELECT COUNT(*) FROM `ot_cronogramas`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`cronogramas`) = (SELECT COUNT(*) FROM `ot_cronogramas`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'cronogramas_detalle',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`cronogramas_detalle`),
    (SELECT COUNT(*) FROM `ot_cronogramas_detalle`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`cronogramas_detalle`) = (SELECT COUNT(*) FROM `ot_cronogramas_detalle`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'plantillas_servicio',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`plantillas_servicio`),
    (SELECT COUNT(*) FROM `ot_plantillas_servicio`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`plantillas_servicio`) = (SELECT COUNT(*) FROM `ot_plantillas_servicio`) THEN 'OK' ELSE 'MISMATCH' END
UNION ALL
SELECT 'plantillas_servicio_detalle',
    (SELECT COUNT(*) FROM `turnos_guardianes`.`plantillas_servicio_detalle`),
    (SELECT COUNT(*) FROM `ot_plantillas_servicio_detalle`),
    CASE WHEN (SELECT COUNT(*) FROM `turnos_guardianes`.`plantillas_servicio_detalle`) = (SELECT COUNT(*) FROM `ot_plantillas_servicio_detalle`) THEN 'OK' ELSE 'MISMATCH' END;


-- Restore settings
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;
SET SQL_MODE = @OLD_SQL_MODE;

SELECT 'Migration 010 completed successfully.' AS resultado;
