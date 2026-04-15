-- MySQL dump 10.13  Distrib 8.0.37, for Win64 (x86_64)
--
-- Host: localhost    Database: turnos_guardianes
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `clientes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo ├║nico del cliente',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rnc` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RNC o C├®dula',
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `contacto_nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del contacto principal',
  `contacto_telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_codigo` (`codigo`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Clientes que contratan el servicio de seguridad';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracion_turnos`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_turnos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `descripcion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tipo_turno` (`tipo_turno`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuraci├│n de rangos horarios para turnos diurnos/nocturnos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cronogramas`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cronogramas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cronogramas_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cabecera de cronogramas semanales de trabajo';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cronogramas_detalle`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cronogramas_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cronograma_id` int NOT NULL,
  `dia_semana` tinyint NOT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=S├íbado',
  `puesto_id` int NOT NULL,
  `empleado_id` int NOT NULL COMMENT 'Referencia a rh_empleado.id_empleado',
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cronograma_empleado_dia` (`cronograma_id`,`empleado_id`,`dia_semana`),
  KEY `fk_cronograma_det_puesto` (`puesto_id`),
  KEY `idx_cronogramas_det_dia` (`dia_semana`),
  KEY `idx_cronogramas_det_empleado` (`empleado_id`),
  CONSTRAINT `fk_cronograma_det_cronograma` FOREIGN KEY (`cronograma_id`) REFERENCES `cronogramas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cronograma_det_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_dia_semana` CHECK ((`dia_semana` between 0 and 6))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalle de asignaciones diarias en cronogramas semanales';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diario_puesto`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diario_puesto` (
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
  UNIQUE KEY `uk_diario_puesto_empleado_fecha` (`puesto_id`,`empleado_id`,`fecha`),
  KEY `fk_diario_puesto_servicio` (`servicio_puesto_id`),
  KEY `idx_diario_puesto_fecha` (`fecha`),
  KEY `idx_diario_puesto_empleado` (`empleado_id`),
  KEY `idx_diario_puesto_activo` (`activo`),
  KEY `idx_diario_puesto_tipo` (`tipo_turno`),
  CONSTRAINT `fk_diario_puesto_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_diario_puesto_servicio` FOREIGN KEY (`servicio_puesto_id`) REFERENCES `servicios_puesto` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_horas` CHECK (((`horas` >= 0) and (`horas` <= 24)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro diario de asistencia de guardianes por puesto';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feriados`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feriados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('NACIONAL','DECRETO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NACIONAL' COMMENT 'NACIONAL=feriado anual repetitivo, DECRETO=feriado especial por decreto',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fecha` (`fecha`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_tipo` (`tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='D├¡as feriados nacionales y por decreto presidencial';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `incentivos_puesto`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incentivos_puesto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `puesto_id` int NOT NULL,
  `anio` smallint NOT NULL,
  `quincena` tinyint NOT NULL COMMENT '1-24 (2 quincenas por mes ├ù 12 meses)',
  `monto` decimal(12,2) NOT NULL COMMENT 'Monto total del incentivo para la quincena',
  `valor_hora` decimal(10,4) GENERATED ALWAYS AS ((`monto` / 360)) STORED COMMENT 'Valor por hora = monto / (15 d├¡as ├ù 24 horas)',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_puesto_periodo` (`puesto_id`,`anio`,`quincena`),
  KEY `idx_puesto` (`puesto_id`),
  KEY `idx_periodo` (`anio`,`quincena`),
  KEY `idx_fechas` (`fecha_inicio`,`fecha_fin`),
  CONSTRAINT `incentivos_puesto_ibfk_1` FOREIGN KEY (`puesto_id`) REFERENCES `puestos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Incentivos asignados a puestos por quincena';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plantillas_servicio`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas_servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plantillas_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Plantillas reutilizables de servicios por puesto';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plantillas_servicio_detalle`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas_servicio_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plantilla_id` int NOT NULL,
  `puesto_id` int NOT NULL,
  `servicio_puesto_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plantilla_servicio` (`plantilla_id`,`servicio_puesto_id`),
  KEY `fk_plantilla_det_puesto` (`puesto_id`),
  KEY `fk_plantilla_det_servicio` (`servicio_puesto_id`),
  CONSTRAINT `fk_plantilla_det_plantilla` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas_servicio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_plantilla_det_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_plantilla_det_servicio` FOREIGN KEY (`servicio_puesto_id`) REFERENCES `servicios_puesto` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalle de servicios incluidos en cada plantilla';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `puestos`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `puestos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ubicacion_id` int NOT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo ├║nico del puesto',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `cantidad_guardianes` int NOT NULL DEFAULT '1' COMMENT 'Cantidad requerida de guardianes',
  `requiere_turno_diurno` tinyint(1) DEFAULT '1',
  `requiere_turno_nocturno` tinyint(1) DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ubicacion_codigo` (`ubicacion_id`,`codigo`),
  KEY `idx_ubicacion` (`ubicacion_id`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `puestos_ibfk_1` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Puestos de vigilancia dentro de cada ubicaci├│n';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicios_puesto`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios_puesto` (
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
  UNIQUE KEY `uk_puesto_tipo_turno` (`puesto_id`,`tipo_turno`),
  KEY `idx_servicios_puesto_activo` (`activo`),
  KEY `idx_servicios_puesto_cobrada` (`cobrada`),
  CONSTRAINT `fk_servicios_puesto_puesto` FOREIGN KEY (`puesto_id`) REFERENCES `puestos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asignaci├│n semanal de guardianes a puestos de vigilancia';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_auditoria`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_auditoria` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Audit record ID',
  `user_id` int NOT NULL COMMENT 'User who performed the action (FK to sys_usuarios)',
  `accion` enum('CREATE','UPDATE','DELETE') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Action type',
  `entidad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entity name (table or resource)',
  `entidad_id` int DEFAULT NULL COMMENT 'ID of the affected record (NULL for bulk operations)',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Client IP address (supports IPv4 and IPv6)',
  `datos_anteriores` json DEFAULT NULL COMMENT 'Data before the change (for UPDATE and DELETE)',
  `datos_nuevos` json DEFAULT NULL COMMENT 'Data after the change (for CREATE and UPDATE)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the action',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_entidad` (`entidad`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_entidad_id` (`entidad_id`),
  KEY `idx_accion` (`accion`),
  KEY `idx_user_entidad` (`user_id`,`entidad`),
  KEY `idx_entidad_fecha` (`entidad`,`created_at`),
  CONSTRAINT `fk_auditoria_user` FOREIGN KEY (`user_id`) REFERENCES `sys_usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail for CRUD operations';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_auditoria_auth`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_auditoria_auth` (
  `id_auditoria` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL COMMENT 'ID del usuario (NULL si el usuario no existe)',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Username del intento (registrado siempre)',
  `evento` enum('LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','TOKEN_REFRESH','PASSWORD_CHANGE') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de evento de autenticaci├│n',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP desde donde se origin├│ el evento',
  `user_agent` text COLLATE utf8mb4_unicode_ci COMMENT 'User agent del navegador/cliente',
  `detalles` text COLLATE utf8mb4_unicode_ci COMMENT 'Informaci├│n adicional en JSON (raz├│n de fallo, etc.)',
  `fecha_evento` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_evento` (`evento`),
  KEY `idx_fecha` (`fecha_evento`),
  KEY `idx_usuario_evento` (`id_usuario`,`evento`),
  KEY `idx_fecha_evento` (`fecha_evento`,`evento`),
  CONSTRAINT `sys_auditoria_auth_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `sys_usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditor├¡a de eventos de autenticaci├│n para trazabilidad y seguridad';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_refresh_tokens`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_refresh_tokens` (
  `id_token` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL COMMENT 'Usuario propietario del token',
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 del refresh token',
  `fecha_emision` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de emisi├│n del token',
  `fecha_expiracion` timestamp NOT NULL COMMENT 'Fecha de expiraci├│n (7 d├¡as por defecto)',
  `revocado` tinyint(1) DEFAULT '0' COMMENT 'Token revocado manualmente (logout)',
  `fecha_revocacion` timestamp NULL DEFAULT NULL COMMENT 'Fecha de revocaci├│n si aplica',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP desde donde se emiti├│ (IPv4: 15 chars, IPv6: 45 chars)',
  `user_agent` text COLLATE utf8mb4_unicode_ci COMMENT 'User agent del navegador/cliente',
  PRIMARY KEY (`id_token`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_expiracion` (`fecha_expiracion`),
  KEY `idx_revocado` (`revocado`),
  KEY `idx_usuario_revocado` (`id_usuario`,`revocado`),
  CONSTRAINT `sys_refresh_tokens_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `sys_usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Refresh tokens para renovaci├│n de acceso sin re-autenticaci├│n';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_reportes_generados`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_reportes_generados` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID ├║nico del registro de historial de reporte',
  `user_id` int NOT NULL COMMENT 'ID del usuario que gener├│ el reporte (FK a sys_usuarios)',
  `fecha_inicio` date NOT NULL COMMENT 'Fecha de inicio del rango del reporte (YYYY-MM-DD)',
  `fecha_fin` date NOT NULL COMMENT 'Fecha de fin del rango del reporte (YYYY-MM-DD)',
  `cantidad_turnos` int NOT NULL DEFAULT '0' COMMENT 'Cantidad de turnos incluidos en el reporte generado',
  `fecha_generacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp de cuando se gener├│ el reporte',
  `nomina_id` int DEFAULT NULL COMMENT 'ID de la n├│mina en el sistema externo (NULL hasta que se procese)',
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del archivo CSV generado (formato: nomina_YYYYMMDD_YYYYMMDD.csv)',
  PRIMARY KEY (`id`),
  KEY `idx_reportes_user` (`user_id`),
  KEY `idx_reportes_fechas` (`fecha_inicio`,`fecha_fin`),
  KEY `idx_reportes_nomina` (`nomina_id`),
  KEY `idx_reportes_generacion` (`fecha_generacion` DESC),
  CONSTRAINT `fk_reportes_generados_user` FOREIGN KEY (`user_id`) REFERENCES `sys_usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de reportes CSV generados para integraci├│n con sistema de n├│mina';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_usuarios`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de usuario ├║nico',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash bcrypt de la contrase├▒a (10 rounds)',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email del usuario (opcional, ├║nico si existe)',
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo del usuario',
  `rol` enum('ADMIN','SUPERVISOR','CONSULTA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONSULTA' COMMENT 'ADMIN=control total, SUPERVISOR=operaci├│n diaria, CONSULTA=solo lectura',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Usuario activo/inactivo',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_modificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_login` timestamp NULL DEFAULT NULL COMMENT 'Fecha del ├║ltimo login exitoso',
  `intentos_fallidos` int DEFAULT '0' COMMENT 'Contador de intentos fallidos de login',
  `bloqueado_hasta` timestamp NULL DEFAULT NULL COMMENT 'Fecha hasta la cual el usuario est├í bloqueado',
  `created_by` int DEFAULT NULL COMMENT 'ID del usuario que cre├│ este registro',
  `modified_by` int DEFAULT NULL COMMENT 'ID del ├║ltimo usuario que modific├│ este registro',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_rol` (`rol`),
  KEY `idx_activo` (`activo`),
  KEY `idx_email` (`email`),
  KEY `created_by` (`created_by`),
  KEY `modified_by` (`modified_by`),
  CONSTRAINT `sys_usuarios_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `sys_usuarios` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `sys_usuarios_ibfk_2` FOREIGN KEY (`modified_by`) REFERENCES `sys_usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios del sistema con roles y permisos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `empleado_id` int NOT NULL COMMENT 'ID del empleado en tabla de RRHH',
  `puesto_id` int NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` time NOT NULL,
  `hora_salida` time NOT NULL,
  `horas_normales` decimal(4,2) NOT NULL DEFAULT '0.00',
  `horas_extras` decimal(4,2) NOT NULL DEFAULT '0.00',
  `tipo_turno` enum('DIURNO','NOCTURNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_feriado` tinyint(1) DEFAULT '0',
  `feriado_id` int DEFAULT NULL COMMENT 'Referencia al feriado si aplica',
  `nomina_id` int DEFAULT NULL COMMENT 'ID de n├│mina asignado por sistema de n├│mina',
  `procesado_nomina` tinyint(1) DEFAULT '0',
  `fecha_procesado` datetime DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL COMMENT 'Usuario que registr├│',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_empleado_puesto_fecha` (`empleado_id`,`puesto_id`,`fecha`),
  KEY `feriado_id` (`feriado_id`),
  KEY `idx_empleado` (`empleado_id`),
  KEY `idx_puesto` (`puesto_id`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_tipo_turno` (`tipo_turno`),
  KEY `idx_nomina` (`nomina_id`),
  KEY `idx_procesado` (`procesado_nomina`),
  KEY `idx_fecha_empleado` (`fecha`,`empleado_id`),
  CONSTRAINT `turnos_ibfk_1` FOREIGN KEY (`puesto_id`) REFERENCES `puestos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `turnos_ibfk_2` FOREIGN KEY (`feriado_id`) REFERENCES `feriados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de turnos trabajados por los guardianes';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_turnos_before_insert` BEFORE INSERT ON `turnos` FOR EACH ROW BEGIN
    
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `ubicaciones`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo ├║nico de ubicaci├│n',
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
  UNIQUE KEY `uk_cliente_codigo` (`cliente_id`,`codigo`),
  KEY `idx_cliente` (`cliente_id`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `ubicaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ubicaciones f├¡sicas de cada cliente';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_auditoria_reciente`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_auditoria_reciente` AS SELECT 
 1 AS `id_auditoria`,
 1 AS `id_usuario`,
 1 AS `username_actual`,
 1 AS `username_intento`,
 1 AS `evento`,
 1 AS `ip_address`,
 1 AS `fecha_evento`,
 1 AS `detalles`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_refresh_tokens_activos`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_refresh_tokens_activos` AS SELECT 
 1 AS `id_token`,
 1 AS `id_usuario`,
 1 AS `username`,
 1 AS `fecha_emision`,
 1 AS `fecha_expiracion`,
 1 AS `ip_address`,
 1 AS `horas_restantes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_reporte_nomina`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_reporte_nomina` AS SELECT 
 1 AS `turno_id`,
 1 AS `fecha`,
 1 AS `empleado_id`,
 1 AS `puesto_id`,
 1 AS `puesto_codigo`,
 1 AS `puesto_nombre`,
 1 AS `ubicacion_nombre`,
 1 AS `cliente_nombre`,
 1 AS `horas_normales`,
 1 AS `horas_extras`,
 1 AS `total_horas`,
 1 AS `tipo_turno`,
 1 AS `es_feriado`,
 1 AS `tipo_feriado`,
 1 AS `nombre_feriado`,
 1 AS `incentivo_valor_hora`,
 1 AS `incentivo_calculado`,
 1 AS `nomina_id`,
 1 AS `procesado_nomina`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_resumen_quincena`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_resumen_quincena` AS SELECT 
 1 AS `empleado_id`,
 1 AS `anio`,
 1 AS `quincena`,
 1 AS `fecha_inicio`,
 1 AS `fecha_fin`,
 1 AS `dias_trabajados`,
 1 AS `horas_normales_diurnas`,
 1 AS `horas_normales_nocturnas`,
 1 AS `horas_extras_diurnas`,
 1 AS `horas_extras_nocturnas`,
 1 AS `horas_feriados`,
 1 AS `total_horas`,
 1 AS `total_incentivos`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_usuarios_activos`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_usuarios_activos` AS SELECT 
 1 AS `id_usuario`,
 1 AS `username`,
 1 AS `email`,
 1 AS `nombre_completo`,
 1 AS `rol`,
 1 AS `activo`,
 1 AS `fecha_creacion`,
 1 AS `fecha_modificacion`,
 1 AS `ultimo_login`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'turnos_guardianes'
--
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_obtener_quincena`(p_fecha DATE) RETURNS int
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_bloquear_usuario`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_determinar_tipo_turno`(
    IN p_hora TIME,
    OUT p_tipo_turno VARCHAR(10)
)
BEGIN
    DECLARE v_hora_inicio_diurno TIME;
    DECLARE v_hora_fin_diurno TIME;
    
    SELECT hora_inicio, hora_fin 
    INTO v_hora_inicio_diurno, v_hora_fin_diurno
    FROM configuracion_turnos 
    WHERE tipo_turno = 'DIURNO' AND activo = TRUE
    LIMIT 1;
    
    IF p_hora >= v_hora_inicio_diurno AND p_hora < v_hora_fin_diurno THEN
        SET p_tipo_turno = 'DIURNO';
    ELSE
        SET p_tipo_turno = 'NOCTURNO';
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_generar_reporte_nomina`(
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
    FROM turnos t
    INNER JOIN puestos p ON t.puesto_id = p.id
    LEFT JOIN feriados f ON t.feriado_id = f.id
    LEFT JOIN incentivos_puesto i ON p.id = i.puesto_id 
        AND t.fecha BETWEEN i.fecha_inicio AND i.fecha_fin
    WHERE t.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
      AND t.procesado_nomina = FALSE
    ORDER BY t.empleado_id, t.fecha;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_limpiar_refresh_tokens_expirados`()
BEGIN
    DELETE FROM sys_refresh_tokens
    WHERE fecha_expiracion < NOW()
       OR revocado = TRUE;

    SELECT ROW_COUNT() AS tokens_eliminados;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_turno`(
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
    FROM turnos
    WHERE empleado_id = p_empleado_id 
      AND puesto_id = p_puesto_id 
      AND fecha = p_fecha;
    
    IF v_existe > 0 THEN
        SET p_turno_id = NULL;
        SET p_mensaje = 'ERROR: Ya existe un turno registrado para este empleado en este puesto y fecha';
    ELSE
        
        CALL sp_determinar_tipo_turno(p_hora_entrada, v_tipo_turno);
        
        
        CALL sp_verificar_feriado(p_fecha, v_es_feriado, v_feriado_id, v_tipo_feriado);
        
        
        INSERT INTO turnos (
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_resetear_intentos_login`(
    IN p_id_usuario INT
)
BEGIN
    UPDATE sys_usuarios
    SET intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        ultimo_login = NOW()
    WHERE id_usuario = p_id_usuario;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_revocar_tokens_usuario`(
    IN p_id_usuario INT
)
BEGIN
    UPDATE sys_refresh_tokens
    SET revocado = TRUE,
        fecha_revocacion = NOW()
    WHERE id_usuario = p_id_usuario
      AND revocado = FALSE;

    SELECT ROW_COUNT() AS tokens_revocados;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_verificar_feriado`(
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
    FROM feriados
    WHERE fecha = p_fecha
    LIMIT 1;
    
    IF p_es_feriado IS NULL THEN
        SET p_es_feriado = FALSE;
        SET p_feriado_id = NULL;
        SET p_tipo_feriado = NULL;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `v_auditoria_reciente`
--

/*!50001 DROP VIEW IF EXISTS `v_auditoria_reciente`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_auditoria_reciente` AS select `a`.`id_auditoria` AS `id_auditoria`,`a`.`id_usuario` AS `id_usuario`,`u`.`username` AS `username_actual`,`a`.`username` AS `username_intento`,`a`.`evento` AS `evento`,`a`.`ip_address` AS `ip_address`,`a`.`fecha_evento` AS `fecha_evento`,`a`.`detalles` AS `detalles` from (`sys_auditoria_auth` `a` left join `sys_usuarios` `u` on((`a`.`id_usuario` = `u`.`id_usuario`))) where (`a`.`fecha_evento` >= (now() - interval 24 hour)) order by `a`.`fecha_evento` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_refresh_tokens_activos`
--

/*!50001 DROP VIEW IF EXISTS `v_refresh_tokens_activos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_refresh_tokens_activos` AS select `rt`.`id_token` AS `id_token`,`rt`.`id_usuario` AS `id_usuario`,`u`.`username` AS `username`,`rt`.`fecha_emision` AS `fecha_emision`,`rt`.`fecha_expiracion` AS `fecha_expiracion`,`rt`.`ip_address` AS `ip_address`,timestampdiff(HOUR,now(),`rt`.`fecha_expiracion`) AS `horas_restantes` from (`sys_refresh_tokens` `rt` join `sys_usuarios` `u` on((`rt`.`id_usuario` = `u`.`id_usuario`))) where ((`rt`.`revocado` = false) and (`rt`.`fecha_expiracion` > now())) order by `rt`.`fecha_expiracion` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_reporte_nomina`
--

/*!50001 DROP VIEW IF EXISTS `v_reporte_nomina`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_reporte_nomina` AS select `t`.`id` AS `turno_id`,`t`.`fecha` AS `fecha`,`t`.`empleado_id` AS `empleado_id`,`p`.`id` AS `puesto_id`,`p`.`codigo` AS `puesto_codigo`,`p`.`nombre` AS `puesto_nombre`,`u`.`nombre` AS `ubicacion_nombre`,`c`.`nombre` AS `cliente_nombre`,`t`.`horas_normales` AS `horas_normales`,`t`.`horas_extras` AS `horas_extras`,(`t`.`horas_normales` + `t`.`horas_extras`) AS `total_horas`,`t`.`tipo_turno` AS `tipo_turno`,`t`.`es_feriado` AS `es_feriado`,(case when `t`.`es_feriado` then `f`.`tipo` else NULL end) AS `tipo_feriado`,(case when `t`.`es_feriado` then `f`.`nombre` else NULL end) AS `nombre_feriado`,coalesce(`i`.`valor_hora`,0) AS `incentivo_valor_hora`,coalesce((`i`.`valor_hora` * (`t`.`horas_normales` + `t`.`horas_extras`)),0) AS `incentivo_calculado`,`t`.`nomina_id` AS `nomina_id`,`t`.`procesado_nomina` AS `procesado_nomina` from (((((`turnos` `t` join `puestos` `p` on((`t`.`puesto_id` = `p`.`id`))) join `ubicaciones` `u` on((`p`.`ubicacion_id` = `u`.`id`))) join `clientes` `c` on((`u`.`cliente_id` = `c`.`id`))) left join `feriados` `f` on((`t`.`feriado_id` = `f`.`id`))) left join `incentivos_puesto` `i` on(((`p`.`id` = `i`.`puesto_id`) and (`t`.`fecha` between `i`.`fecha_inicio` and `i`.`fecha_fin`)))) order by `t`.`fecha`,`t`.`empleado_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_resumen_quincena`
--

/*!50001 DROP VIEW IF EXISTS `v_resumen_quincena`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_resumen_quincena` AS select `t`.`empleado_id` AS `empleado_id`,year(`t`.`fecha`) AS `anio`,(case when (dayofmonth(`t`.`fecha`) <= 15) then ((month(`t`.`fecha`) * 2) - 1) else (month(`t`.`fecha`) * 2) end) AS `quincena`,min(`t`.`fecha`) AS `fecha_inicio`,max(`t`.`fecha`) AS `fecha_fin`,count(distinct `t`.`fecha`) AS `dias_trabajados`,sum((case when (`t`.`tipo_turno` = 'DIURNO') then `t`.`horas_normales` else 0 end)) AS `horas_normales_diurnas`,sum((case when (`t`.`tipo_turno` = 'NOCTURNO') then `t`.`horas_normales` else 0 end)) AS `horas_normales_nocturnas`,sum((case when (`t`.`tipo_turno` = 'DIURNO') then `t`.`horas_extras` else 0 end)) AS `horas_extras_diurnas`,sum((case when (`t`.`tipo_turno` = 'NOCTURNO') then `t`.`horas_extras` else 0 end)) AS `horas_extras_nocturnas`,sum((case when `t`.`es_feriado` then (`t`.`horas_normales` + `t`.`horas_extras`) else 0 end)) AS `horas_feriados`,sum((`t`.`horas_normales` + `t`.`horas_extras`)) AS `total_horas`,sum(coalesce((`i`.`valor_hora` * (`t`.`horas_normales` + `t`.`horas_extras`)),0)) AS `total_incentivos` from (`turnos` `t` left join `incentivos_puesto` `i` on(((`t`.`puesto_id` = `i`.`puesto_id`) and (`t`.`fecha` between `i`.`fecha_inicio` and `i`.`fecha_fin`)))) group by `t`.`empleado_id`,year(`t`.`fecha`),(case when (dayofmonth(`t`.`fecha`) <= 15) then ((month(`t`.`fecha`) * 2) - 1) else (month(`t`.`fecha`) * 2) end) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_usuarios_activos`
--

/*!50001 DROP VIEW IF EXISTS `v_usuarios_activos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_usuarios_activos` AS select `sys_usuarios`.`id_usuario` AS `id_usuario`,`sys_usuarios`.`username` AS `username`,`sys_usuarios`.`email` AS `email`,`sys_usuarios`.`nombre_completo` AS `nombre_completo`,`sys_usuarios`.`rol` AS `rol`,`sys_usuarios`.`activo` AS `activo`,`sys_usuarios`.`fecha_creacion` AS `fecha_creacion`,`sys_usuarios`.`fecha_modificacion` AS `fecha_modificacion`,`sys_usuarios`.`ultimo_login` AS `ultimo_login` from `sys_usuarios` where (`sys_usuarios`.`activo` = true) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-05 11:30:56
