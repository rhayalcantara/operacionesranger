-- ============================================================================
-- SISTEMA DE GESTIÓN DE TURNOS - GUARDIANES DE SEGURIDAD
-- COOPASPIRE - República Dominicana
-- ============================================================================
-- Autor: Rhay / Claude
-- Fecha: Enero 2026
-- Base de datos: MySQL
-- ============================================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS turnos_guardianes 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE turnos_guardianes;

-- ============================================================================
-- 1. CONFIGURACIÓN DEL SISTEMA
-- ============================================================================
-- Define los rangos horarios para clasificar turnos como diurnos o nocturnos

CREATE TABLE configuracion_turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_turno ENUM('DIURNO', 'NOCTURNO') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tipo_turno (tipo_turno)
) ENGINE=InnoDB COMMENT='Configuración de rangos horarios para turnos diurnos/nocturnos';

-- Datos iniciales de configuración (ejemplo: 6am-6pm diurno, 6pm-6am nocturno)
INSERT INTO configuracion_turnos (tipo_turno, hora_inicio, hora_fin, descripcion) VALUES
('DIURNO', '06:00:00', '18:00:00', 'Turno diurno: 6:00 AM a 6:00 PM'),
('NOCTURNO', '18:00:00', '06:00:00', 'Turno nocturno: 6:00 PM a 6:00 AM');

-- ============================================================================
-- 2. CLIENTES
-- ============================================================================
-- Empresas o personas que contratan el servicio de seguridad

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código único del cliente',
    nombre VARCHAR(150) NOT NULL,
    rnc VARCHAR(15) COMMENT 'RNC o Cédula',
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    contacto_nombre VARCHAR(100) COMMENT 'Nombre del contacto principal',
    contacto_telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_nombre (nombre),
    INDEX idx_activo (activo)
) ENGINE=InnoDB COMMENT='Clientes que contratan el servicio de seguridad';

-- ============================================================================
-- 3. UBICACIONES
-- ============================================================================
-- Lugares físicos donde el cliente requiere servicio de seguridad

CREATE TABLE ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    codigo VARCHAR(20) NOT NULL COMMENT 'Código único de ubicación',
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    provincia VARCHAR(50),
    municipio VARCHAR(50),
    sector VARCHAR(100),
    latitud DECIMAL(10, 8) COMMENT 'Coordenada GPS',
    longitud DECIMAL(11, 8) COMMENT 'Coordenada GPS',
    telefono VARCHAR(20),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_cliente_codigo (cliente_id, codigo),
    INDEX idx_cliente (cliente_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB COMMENT='Ubicaciones físicas de cada cliente';

-- ============================================================================
-- 4. PUESTOS
-- ============================================================================
-- Puntos específicos dentro de una ubicación que requieren guardianes

CREATE TABLE puestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ubicacion_id INT NOT NULL,
    codigo VARCHAR(20) NOT NULL COMMENT 'Código único del puesto',
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    cantidad_guardianes INT NOT NULL DEFAULT 1 COMMENT 'Cantidad requerida de guardianes',
    requiere_turno_diurno BOOLEAN DEFAULT TRUE,
    requiere_turno_nocturno BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_ubicacion_codigo (ubicacion_id, codigo),
    INDEX idx_ubicacion (ubicacion_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB COMMENT='Puestos de vigilancia dentro de cada ubicación';

-- ============================================================================
-- 5. FERIADOS
-- ============================================================================
-- Días feriados nacionales y por decreto

CREATE TABLE feriados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('NACIONAL', 'DECRETO') NOT NULL DEFAULT 'NACIONAL' 
        COMMENT 'NACIONAL=feriado anual repetitivo, DECRETO=feriado especial por decreto',
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_fecha (fecha),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB COMMENT='Días feriados nacionales y por decreto presidencial';

-- Feriados nacionales de República Dominicana (plantilla base)
INSERT INTO feriados (fecha, nombre, tipo) VALUES
-- Año 2025 (ajustar cada año)
('2025-01-01', 'Año Nuevo', 'NACIONAL'),
('2025-01-06', 'Día de los Santos Reyes', 'NACIONAL'),
('2025-01-21', 'Día de la Virgen de la Altagracia', 'NACIONAL'),
('2025-01-26', 'Día de Duarte', 'NACIONAL'),
('2025-02-27', 'Día de la Independencia Nacional', 'NACIONAL'),
('2025-04-18', 'Viernes Santo', 'NACIONAL'),
('2025-05-01', 'Día del Trabajo', 'NACIONAL'),
('2025-06-19', 'Corpus Christi', 'NACIONAL'),
('2025-08-16', 'Día de la Restauración', 'NACIONAL'),
('2025-09-24', 'Día de las Mercedes', 'NACIONAL'),
('2025-11-06', 'Día de la Constitución', 'NACIONAL'),
('2025-12-25', 'Día de Navidad', 'NACIONAL'),
-- Año 2026
('2026-01-01', 'Año Nuevo', 'NACIONAL'),
('2026-01-06', 'Día de los Santos Reyes', 'NACIONAL'),
('2026-01-21', 'Día de la Virgen de la Altagracia', 'NACIONAL'),
('2026-01-26', 'Día de Duarte', 'NACIONAL'),
('2026-02-27', 'Día de la Independencia Nacional', 'NACIONAL'),
('2026-04-03', 'Viernes Santo', 'NACIONAL'),
('2026-05-01', 'Día del Trabajo', 'NACIONAL'),
('2026-06-04', 'Corpus Christi', 'NACIONAL'),
('2026-08-16', 'Día de la Restauración', 'NACIONAL'),
('2026-09-24', 'Día de las Mercedes', 'NACIONAL'),
('2026-11-06', 'Día de la Constitución', 'NACIONAL'),
('2026-12-25', 'Día de Navidad', 'NACIONAL');

-- ============================================================================
-- 6. INCENTIVOS POR PUESTO
-- ============================================================================
-- Monto de incentivo asignado a un puesto por quincena
-- El monto se divide: monto / (15 días * 24 horas) = valor por hora

CREATE TABLE incentivos_puesto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puesto_id INT NOT NULL,
    anio SMALLINT NOT NULL,
    quincena TINYINT NOT NULL COMMENT '1-24 (2 quincenas por mes × 12 meses)',
    monto DECIMAL(12, 2) NOT NULL COMMENT 'Monto total del incentivo para la quincena',
    valor_hora DECIMAL(10, 4) GENERATED ALWAYS AS (monto / 360) STORED 
        COMMENT 'Valor por hora = monto / (15 días × 24 horas)',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (puesto_id) REFERENCES puestos(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_puesto_periodo (puesto_id, anio, quincena),
    INDEX idx_puesto (puesto_id),
    INDEX idx_periodo (anio, quincena),
    INDEX idx_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB COMMENT='Incentivos asignados a puestos por quincena';

-- ============================================================================
-- 7. REGISTRO DE TURNOS (TABLA PRINCIPAL)
-- ============================================================================
-- Registro diario de cada turno trabajado por un guardián

CREATE TABLE turnos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL COMMENT 'ID del empleado en tabla de RRHH',
    puesto_id INT NOT NULL,
    fecha DATE NOT NULL,
    
    -- Horario del turno
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    
    -- Clasificación de horas (calculadas o ingresadas)
    horas_normales DECIMAL(4, 2) NOT NULL DEFAULT 0,
    horas_extras DECIMAL(4, 2) NOT NULL DEFAULT 0,
    
    -- Tipo de turno (se determina según configuración)
    tipo_turno ENUM('DIURNO', 'NOCTURNO') NOT NULL,
    
    -- Indicador de feriado
    es_feriado BOOLEAN DEFAULT FALSE,
    feriado_id INT NULL COMMENT 'Referencia al feriado si aplica',
    
    -- Para el proceso de nómina
    nomina_id INT NULL COMMENT 'ID de nómina asignado por sistema de nómina',
    procesado_nomina BOOLEAN DEFAULT FALSE,
    fecha_procesado DATETIME NULL,
    
    -- Auditoría
    observaciones TEXT,
    created_by INT COMMENT 'Usuario que registró',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (puesto_id) REFERENCES puestos(id) ON DELETE RESTRICT,
    FOREIGN KEY (feriado_id) REFERENCES feriados(id) ON DELETE SET NULL,
    
    -- Evitar duplicados: un empleado no puede tener dos turnos el mismo día en el mismo puesto
    UNIQUE KEY uk_empleado_puesto_fecha (empleado_id, puesto_id, fecha),
    
    INDEX idx_empleado (empleado_id),
    INDEX idx_puesto (puesto_id),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo_turno (tipo_turno),
    INDEX idx_nomina (nomina_id),
    INDEX idx_procesado (procesado_nomina),
    INDEX idx_fecha_empleado (fecha, empleado_id)
) ENGINE=InnoDB COMMENT='Registro de turnos trabajados por los guardianes';

-- ============================================================================
-- 8. VISTA: REPORTE PARA NÓMINA
-- ============================================================================
-- Esta vista genera el formato requerido para exportar a CSV

CREATE OR REPLACE VIEW v_reporte_nomina AS
SELECT 
    t.id AS turno_id,
    t.fecha,
    t.empleado_id,
    
    -- Información del puesto
    p.id AS puesto_id,
    p.codigo AS puesto_codigo,
    p.nombre AS puesto_nombre,
    u.nombre AS ubicacion_nombre,
    c.nombre AS cliente_nombre,
    
    -- Horas trabajadas
    t.horas_normales,
    t.horas_extras,
    (t.horas_normales + t.horas_extras) AS total_horas,
    
    -- Clasificación del turno
    t.tipo_turno,
    t.es_feriado,
    CASE 
        WHEN t.es_feriado THEN f.tipo 
        ELSE NULL 
    END AS tipo_feriado,
    CASE 
        WHEN t.es_feriado THEN f.nombre 
        ELSE NULL 
    END AS nombre_feriado,
    
    -- Incentivo (si aplica)
    COALESCE(i.valor_hora, 0) AS incentivo_valor_hora,
    COALESCE(i.valor_hora * (t.horas_normales + t.horas_extras), 0) AS incentivo_calculado,
    
    -- Control de nómina
    t.nomina_id,
    t.procesado_nomina
    
FROM turnos t
INNER JOIN puestos p ON t.puesto_id = p.id
INNER JOIN ubicaciones u ON p.ubicacion_id = u.id
INNER JOIN clientes c ON u.cliente_id = c.id
LEFT JOIN feriados f ON t.feriado_id = f.id
LEFT JOIN incentivos_puesto i ON p.id = i.puesto_id 
    AND t.fecha BETWEEN i.fecha_inicio AND i.fecha_fin
ORDER BY t.fecha, t.empleado_id;

-- ============================================================================
-- 9. VISTA: RESUMEN POR EMPLEADO Y QUINCENA
-- ============================================================================

CREATE OR REPLACE VIEW v_resumen_quincena AS
SELECT 
    t.empleado_id,
    YEAR(t.fecha) AS anio,
    CASE 
        WHEN DAY(t.fecha) <= 15 THEN (MONTH(t.fecha) * 2) - 1
        ELSE MONTH(t.fecha) * 2
    END AS quincena,
    MIN(t.fecha) AS fecha_inicio,
    MAX(t.fecha) AS fecha_fin,
    
    -- Conteo de días
    COUNT(DISTINCT t.fecha) AS dias_trabajados,
    
    -- Total de horas por tipo
    SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN t.horas_normales ELSE 0 END) AS horas_normales_diurnas,
    SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN t.horas_normales ELSE 0 END) AS horas_normales_nocturnas,
    SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN t.horas_extras ELSE 0 END) AS horas_extras_diurnas,
    SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN t.horas_extras ELSE 0 END) AS horas_extras_nocturnas,
    
    -- Horas en feriados
    SUM(CASE WHEN t.es_feriado THEN (t.horas_normales + t.horas_extras) ELSE 0 END) AS horas_feriados,
    
    -- Total general
    SUM(t.horas_normales + t.horas_extras) AS total_horas,
    
    -- Incentivos
    SUM(COALESCE(i.valor_hora * (t.horas_normales + t.horas_extras), 0)) AS total_incentivos
    
FROM turnos t
LEFT JOIN incentivos_puesto i ON t.puesto_id = i.puesto_id 
    AND t.fecha BETWEEN i.fecha_inicio AND i.fecha_fin
GROUP BY 
    t.empleado_id,
    YEAR(t.fecha),
    CASE 
        WHEN DAY(t.fecha) <= 15 THEN (MONTH(t.fecha) * 2) - 1
        ELSE MONTH(t.fecha) * 2
    END;

-- ============================================================================
-- 10. PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

-- Procedimiento para determinar si una fecha es feriado
DELIMITER //
CREATE PROCEDURE sp_verificar_feriado(
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
END //
DELIMITER ;

-- Procedimiento para determinar tipo de turno según hora
DELIMITER //
CREATE PROCEDURE sp_determinar_tipo_turno(
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
END //
DELIMITER ;

-- Procedimiento para registrar un turno con validaciones
DELIMITER //
CREATE PROCEDURE sp_registrar_turno(
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
    
    -- Verificar si ya existe un turno para este empleado/puesto/fecha
    SELECT COUNT(*) INTO v_existe
    FROM turnos
    WHERE empleado_id = p_empleado_id 
      AND puesto_id = p_puesto_id 
      AND fecha = p_fecha;
    
    IF v_existe > 0 THEN
        SET p_turno_id = NULL;
        SET p_mensaje = 'ERROR: Ya existe un turno registrado para este empleado en este puesto y fecha';
    ELSE
        -- Determinar tipo de turno
        CALL sp_determinar_tipo_turno(p_hora_entrada, v_tipo_turno);
        
        -- Verificar si es feriado
        CALL sp_verificar_feriado(p_fecha, v_es_feriado, v_feriado_id, v_tipo_feriado);
        
        -- Insertar el turno
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
END //
DELIMITER ;

-- Procedimiento para generar reporte CSV para nómina
DELIMITER //
CREATE PROCEDURE sp_generar_reporte_nomina(
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
END //
DELIMITER ;

-- ============================================================================
-- 11. TRIGGERS
-- ============================================================================

-- Trigger para validar horas antes de insertar
DELIMITER //
CREATE TRIGGER trg_turnos_before_insert
BEFORE INSERT ON turnos
FOR EACH ROW
BEGIN
    -- Validar que las horas no excedan límites razonables
    IF NEW.horas_normales > 12 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Las horas normales no pueden exceder 12';
    END IF;
    
    IF NEW.horas_extras > 4 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Las horas extras no pueden exceder 4';
    END IF;
    
    -- Validar que el total no exceda 16 horas
    IF (NEW.horas_normales + NEW.horas_extras) > 16 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El total de horas no puede exceder 16';
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- 12. FUNCIÓN PARA CALCULAR QUINCENA
-- ============================================================================

DELIMITER //
CREATE FUNCTION fn_obtener_quincena(p_fecha DATE)
RETURNS INT
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
END //
DELIMITER ;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
