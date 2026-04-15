# Database Scripts - Sistema de Gestión de Turnos

Este directorio contiene scripts SQL para la gestión de datos iniciales y validaciones del sistema.

## Estructura de Archivos

```
database/
├── README.md                           # Este archivo
├── seed_feriados_2026.sql              # Carga inicial de feriados 2026
├── validar_feriados_2026.sql           # Validación de feriados 2026
├── validar_configuracion_turnos.sql    # Validación de configuración de turnos
├── probar_sp_verificar_feriado.sql     # Pruebas del procedimiento sp_verificar_feriado
└── EJECUTAR_VALIDACIONES.sql           # Script maestro que ejecuta todas las validaciones
```

## Scripts Disponibles

### 1. seed_feriados_2026.sql

**Propósito**: Cargar los 12 feriados nacionales de República Dominicana para el año 2026.

**Fuente oficial**: Ministerio de Trabajo de la República Dominicana
- https://mt.gob.do/ministerio-de-trabajo-informa-dias-feriados-correspondientes-al-ano-2026/
- https://presidencia.gob.do/noticias/ministerio-de-trabajo-informa-dias-feriados-correspondientes-al-ano-2026

**Características**:
- Usa `INSERT IGNORE` para evitar duplicados
- Incluye descripciones detalladas de cada feriado
- Documenta la Ley 139-97 (regula traslado de días festivos)
- Incluye validación automática post-insert

**Feriados incluidos**:
1. 01 Enero - Año Nuevo
2. 06 Enero - Día de los Santos Reyes
3. 21 Enero - Día de Nuestra Señora de la Altagracia
4. 26 Enero - Día del Padre de la Patria (Juan Pablo Duarte)
5. 27 Febrero - Día de la Independencia Nacional
6. 03 Abril - Viernes Santo (fecha móvil)
7. 01 Mayo - Día del Trabajo
8. 04 Junio - Corpus Christi (fecha móvil)
9. 16 Agosto - Día de la Restauración
10. 24 Septiembre - Día de Nuestra Señora de las Mercedes
11. 06 Noviembre - Día de la Constitución
12. 25 Diciembre - Día de Navidad

**Ejecución**:
```bash
# Opción 1: Usando mysql command line
mysql -u root -p turnos_guardianes < database/seed_feriados_2026.sql

# Opción 2: Desde MySQL Workbench
# Abrir el archivo y ejecutar con Ctrl+Shift+Enter
```

### 2. validar_feriados_2026.sql

**Propósito**: Verificar que los feriados de 2026 están correctamente cargados.

**Validaciones que realiza**:
- Cuenta total de feriados (debe ser 12)
- Lista todos los feriados ordenados por fecha
- Valida fechas móviles críticas (Viernes Santo y Corpus Christi)
- Verifica que no haya duplicados

**Ejecución**:
```bash
mysql -u root -p turnos_guardianes < database/validar_feriados_2026.sql
```

### 3. validar_configuracion_turnos.sql

**Propósito**: Verificar que la configuración de turnos DIURNO/NOCTURNO está correcta.

**Validaciones que realiza**:
- Verifica que existan 2 configuraciones (DIURNO y NOCTURNO)
- Lista detalles de cada configuración
- Valida rangos horarios:
  - DIURNO: 06:00:00 - 18:00:00
  - NOCTURNO: 18:00:00 - 06:00:00
- Verifica que no haya duplicados

**Ejecución**:
```bash
mysql -u root -p turnos_guardianes < database/validar_configuracion_turnos.sql
```

### 4. probar_sp_verificar_feriado.sql

**Propósito**: Probar el procedimiento almacenado `sp_verificar_feriado` con diferentes casos de prueba.

**Casos de prueba**:
1. Año Nuevo 2026 (debe retornar feriado)
2. Día normal (no debe retornar feriado)
3. Viernes Santo 2026 (debe retornar feriado)
4. Corpus Christi 2026 (debe retornar feriado)
5. Día de la Independencia (debe retornar feriado)
6. Navidad 2026 (debe retornar feriado)
7. Domingo normal (NO es feriado automático)
8. Fecha fuera de rango (año sin datos)

**Ejecución**:
```bash
mysql -u root -p turnos_guardianes < database/probar_sp_verificar_feriado.sql
```

### 5. EJECUTAR_VALIDACIONES.sql (Recomendado)

**Propósito**: Script maestro que ejecuta todas las validaciones en orden.

**Pasos que ejecuta**:
1. Validar feriados 2026
2. Validar configuración de turnos
3. Probar procedimiento sp_verificar_feriado

**Ejecución**:
```bash
# Este es el script recomendado para ejecutar después de crear la base de datos
mysql -u root -p turnos_guardianes < database/EJECUTAR_VALIDACIONES.sql
```

## Guía de Uso Rápida

### Configuración Inicial (Primera vez)

1. **Crear la base de datos** (si no existe):
```bash
mysql -u root -p < sistema_turnos_guardianes.sql
```

2. **Validar que todo está correcto**:
```bash
mysql -u root -p turnos_guardianes < database/EJECUTAR_VALIDACIONES.sql
```

3. **Si faltan feriados**, ejecutar seed:
```bash
mysql -u root -p turnos_guardianes < database/seed_feriados_2026.sql
```

### Validación Regular

Para verificar el estado de los datos en cualquier momento:

```bash
mysql -u root -p turnos_guardianes < database/EJECUTAR_VALIDACIONES.sql
```

## Notas Importantes

### Fechas Móviles

Los feriados móviles (Viernes Santo y Corpus Christi) cambian cada año según el calendario litúrgico:

- **Viernes Santo**: 2 días antes del Domingo de Pascua
- **Corpus Christi**: 60 días después del Domingo de Resurrección

Para 2026:
- Pascua (Domingo de Resurrección): 5 de abril
- Viernes Santo: 3 de abril
- Corpus Christi: 4 de junio

### Domingos

**IMPORTANTE**: Los domingos NO son feriados automáticos en este sistema. Solo se consideran feriados si están explícitamente marcados en la tabla `feriados`. Esto es por diseño, ya que los guardianes de seguridad trabajan todos los días de la semana.

### Ley 139-97

La República Dominicana tiene una ley (139-97) que permite trasladar ciertos feriados al lunes más cercano para crear "puentes". Los feriados que NO se trasladan son:

- Año Nuevo (01-01)
- Día de la Altagracia (21-01)
- Día de Duarte (26-01)
- Independencia (27-02)
- Viernes Santo (fecha móvil)
- Corpus Christi (fecha móvil)
- Restauración (16-08)
- Las Mercedes (24-09)
- Navidad (25-12)

## Para Años Futuros

Para cargar feriados de años futuros (2027, 2028, etc.):

1. Copiar `seed_feriados_2026.sql` como plantilla
2. Renombrar a `seed_feriados_YYYY.sql`
3. Consultar calendario oficial del Ministerio de Trabajo:
   - https://mt.gob.do
4. Actualizar fechas móviles usando calculadoras de Pascua:
   - https://www.timeanddate.com/calendar/determining-easter-date.html
5. Reemplazar el año en todos los INSERT VALUES
6. Ejecutar el script

## Referencias

- Ministerio de Trabajo RD: https://mt.gob.do
- Presidencia RD: https://presidencia.gob.do
- Public Holidays RD: https://publicholidays.do/
- Time and Date: https://www.timeanddate.com/holidays/dominican-republic/

---

**Última actualización**: 2026-01-17
**Mantenido por**: Rhay / Claude Subagent
**Relacionado con**: Tarea T004 - Cargar datos iniciales
