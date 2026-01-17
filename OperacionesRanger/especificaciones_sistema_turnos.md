# Sistema de Gestión de Turnos - Guardianes de Seguridad
## Documento de Especificaciones

### COOPASPIRE - República Dominicana
**Versión:** 1.0  
**Fecha:** Enero 2026

---

## 1. Objetivo del Sistema

Gestionar y registrar los turnos de trabajo de los guardianes de seguridad, generando reportes quincenales para el sistema de nómina que incluyan:

- Días y horas trabajadas por empleado
- Clasificación de horas (normales/extras, diurnas/nocturnas)
- Identificación de días feriados
- Cálculo de incentivos por puesto

---

## 2. Actores del Sistema

| Actor | Descripción |
|-------|-------------|
| **Cliente** | Empresa que contrata el servicio de seguridad |
| **Ubicación** | Lugar físico donde se presta el servicio |
| **Puesto** | Punto específico que requiere vigilancia |
| **Guardián** | Empleado que realiza el trabajo de seguridad |
| **Supervisor** | Usuario que registra y gestiona los turnos |

---

## 3. Reglas de Negocio

### 3.1 Jornada Laboral
- **Horas normales:** 10 horas
- **Horas extras:** 2 horas
- **Total máximo:** 12 horas por turno

### 3.2 Clasificación de Turnos
Los turnos se clasifican automáticamente según la hora de entrada:

| Tipo | Rango Horario (Configurable) |
|------|------------------------------|
| DIURNO | 06:00 AM - 06:00 PM |
| NOCTURNO | 06:00 PM - 06:00 AM |

*Nota: Los rangos son configurables desde la tabla `configuracion_turnos`*

### 3.3 Feriados
Se manejan dos tipos:
- **NACIONAL:** Feriados anuales repetitivos (Año Nuevo, Día de la Independencia, etc.)
- **DECRETO:** Feriados especiales por decreto presidencial

### 3.4 Incentivos
- El monto se asigna por **puesto** y **quincena**
- Se calcula dividiendo: `monto / 360 horas` (15 días × 24 horas)
- Cada guardián recibe el incentivo proporcional a las horas trabajadas en ese puesto

---

## 4. Campos Requeridos de la Tabla de Empleados (RRHH)

### 4.1 Campos Mínimos Necesarios

| Campo | Tipo | Uso en el Sistema |
|-------|------|-------------------|
| `id` o `empleado_id` | INT | Identificador único (clave foránea en turnos) |
| `codigo` | VARCHAR | Código del empleado para reportes |
| `nombre_completo` o `nombres + apellidos` | VARCHAR | Identificación en pantalla |
| `cedula` | VARCHAR | Identificación fiscal |
| `activo` | BOOLEAN | Filtrar empleados activos |

### 4.2 Campos Deseables (Si Existen)

| Campo | Tipo | Uso en el Sistema |
|-------|------|-------------------|
| `cargo_id` o `cargo` | INT/VARCHAR | Validar que sea guardián/vigilante |
| `departamento_id` | INT | Filtrar por área de seguridad |
| `fecha_ingreso` | DATE | Validaciones de antigüedad |
| `salario_base` | DECIMAL | Referencia (no se usa para cálculos) |
| `tipo_nomina` | VARCHAR | Identificar si es quincenal/mensual |
| `telefono` | VARCHAR | Contacto del guardián |
| `email` | VARCHAR | Notificaciones |

### 4.3 Preguntas para Investigar en la Tabla de RRHH

1. ¿Cuál es el nombre exacto de la tabla de empleados?
2. ¿Cómo se identifica que un empleado es guardián? (cargo, departamento, categoría)
3. ¿Existe un campo de estado/activo?
4. ¿El sistema de nómina usa el mismo `empleado_id`?
5. ¿Hay alguna vista o tabla específica de guardianes?

---

## 5. Estructura de Tablas

### 5.1 Jerarquía Principal

```
CLIENTE (1)
    └── UBICACIÓN (N)
            └── PUESTO (N)
                    ├── TURNO (N)
                    └── INCENTIVO_PUESTO (N por quincena)
```

### 5.2 Tablas del Sistema

| Tabla | Descripción | Registros Estimados |
|-------|-------------|---------------------|
| `configuracion_turnos` | Rangos horarios D/N | 2 |
| `clientes` | Empresas contratantes | ~50-100 |
| `ubicaciones` | Lugares físicos | ~200-500 |
| `puestos` | Puntos de vigilancia | ~500-1000 |
| `feriados` | Días feriados | ~15 por año |
| `incentivos_puesto` | Montos por quincena | Variable |
| `turnos` | Registro diario | **Alto volumen** |

---

## 6. Reporte para Nómina (Salida CSV)

### 6.1 Estructura del Archivo

```csv
fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo
2026-01-02,1001,P001,10.00,2.00,DIURNO,NO,N/A,120.00
2026-01-02,1002,P001,10.00,0.00,NOCTURNO,NO,N/A,100.00
2026-01-21,1001,P002,8.00,2.00,DIURNO,SI,NACIONAL,0.00
```

### 6.2 Descripción de Campos

| Campo | Descripción |
|-------|-------------|
| `fecha` | Fecha del turno (YYYY-MM-DD) |
| `empleado_id` | ID del empleado en sistema RRHH |
| `puesto_codigo` | Código identificador del puesto |
| `horas_normales` | Horas normales trabajadas |
| `horas_extras` | Horas extras trabajadas |
| `tipo_turno` | DIURNO o NOCTURNO |
| `es_feriado` | SI o NO |
| `tipo_feriado` | NACIONAL, DECRETO o N/A |
| `incentivo` | Monto de incentivo calculado |

---

## 7. Proceso de Generación de Reporte

```
┌─────────────────────────────────────────────────────────────┐
│  1. Seleccionar rango de fechas (quincena)                  │
│     └── Ej: 2026-01-01 al 2026-01-15                       │
├─────────────────────────────────────────────────────────────┤
│  2. Ejecutar procedimiento sp_generar_reporte_nomina        │
│     └── Filtra turnos no procesados en el rango            │
├─────────────────────────────────────────────────────────────┤
│  3. Exportar resultado a CSV                                │
│     └── Formato: nomina_YYYYMMDD_YYYYMMDD.csv              │
├─────────────────────────────────────────────────────────────┤
│  4. Sistema de nómina procesa el CSV                        │
│     └── Asigna nomina_id a los registros procesados        │
├─────────────────────────────────────────────────────────────┤
│  5. Actualizar turnos como procesados                       │
│     └── procesado_nomina = TRUE                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Próximos Pasos

### Fase 1: Preparación
- [ ] Revisar estructura de tabla de empleados en RRHH
- [ ] Confirmar campos disponibles
- [ ] Validar formato esperado por sistema de nómina

### Fase 2: Base de Datos
- [ ] Crear base de datos en MySQL
- [ ] Ejecutar script de creación de tablas
- [ ] Cargar datos iniciales (feriados, configuración)

### Fase 3: Desarrollo
- [ ] Crear módulo de gestión de clientes
- [ ] Crear módulo de gestión de ubicaciones y puestos
- [ ] Crear módulo de registro de turnos (agenda)
- [ ] Crear módulo de incentivos
- [ ] Desarrollar generación de reporte CSV

### Fase 4: Integración
- [ ] Conectar con tabla de empleados de RRHH
- [ ] Pruebas de generación de reporte
- [ ] Validación con sistema de nómina

---

## 9. Tecnologías Sugeridas

| Componente | Tecnología |
|------------|------------|
| Base de Datos | MySQL |
| Backend | Node.js / .NET |
| Frontend | Angular |
| Reportes | CSV (nativo) |

---

## 10. Notas Adicionales

1. **Domingos:** Se consideran días normales EXCEPTO si están marcados en la tabla de feriados
2. **Validaciones:** El sistema no permite más de 16 horas por turno
3. **Auditoría:** Todos los registros incluyen campos de fecha de creación y modificación
4. **Incentivos:** El campo `valor_hora` se calcula automáticamente (columna generada)

---

*Documento preparado como especificación inicial. Sujeto a cambios según requerimientos adicionales.*
