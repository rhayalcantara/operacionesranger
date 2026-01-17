# Plan de Implementación: Ajustes en Recálculo de Nómina (Versión 2)

## Objetivo General
Modificar el proceso de recálculo de nómina (`recalcular`) para implementar un sistema de **pago de vacaciones por adelantado** y manejar la exclusión de empleados despedidos retroactivamente, de acuerdo con las reglas de negocio especificadas.

---

## Aclaraciones y Reglas de Negocio Clave

1.  **Pago de Vacaciones:** Se realiza en la nómina **anterior** al período de disfrute.
    -   **Nómina de Pago:** El empleado cobra su sueldo normal + el monto de las vacaciones futuras.
    -   **Nómina de Disfrute:** El empleado no cobra, ya que está de vacaciones y su pago fue adelantado.
2.  **Personal de Seguridad (Guardianes):**
    -   Jornada laboral de 10 horas.
    -   Cálculo de salario diario basado en 26 días al mes.
3.  **Cálculo de Salario de Vacaciones:**
    -   **Salario Fijo:** Basado en su remuneración quincenal habitual (con la regla especial para seguridad).
   
---

## Plan de Implementación Detallado

### Fase 1: Backend (`nominaModel.js`)

La función `recalcular(nominaId)` será modificada para contener toda la nueva lógica. Por cada empleado en la nómina, se ejecutarán las siguientes comprobaciones:

#### **Tarea 1.1: Lógica de Exclusión por Despido (Sin cambios)**
1.  Verificar la `fecha_despido` del empleado.
2.  Si la fecha es anterior al inicio del período de la nómina, eliminar al empleado de `no_det_nomina` para esta nómina y continuar con el siguiente.

#### **Tarea 1.2: Lógica de Exclusión por Vacaciones Ya Pagadas**
1.  **Verificar si el empleado está disfrutando de vacaciones en el período actual:**
    -   Consultar en `no_vacaciones` si existe un registro cuyo rango de fechas (`fecha_inicio`, `fecha_fin`) se solape con el período de la nómina actual.
2.  **Verificar si ya se pagaron:**
    -   Si se encuentra un registro de vacaciones, comprobar el estado de un campo `pagada` (se asumirá que existe, si no, se debe añadir).
    -   **Si `pagada` es `1` (o `true`):**
        -   Significa que el empleado está actualmente de vacaciones y ya se le pagó en una nómina anterior.
        -   Actualizar su registro en `no_det_nomina` para esta nómina, estableciendo `sueldo_nomina`, `vacaciones`, y todos los demás campos de ingresos y descuentos a `0`.
        -   El `total_pagar` será `0`.
        -   Continuar con el siguiente empleado.

#### **Tarea 1.3: Lógica de Pago de Vacaciones por Adelantado**
1.  **Buscar vacaciones futuras no pagadas:**
    -   Consultar en `no_vacaciones` si existe un registro para el empleado donde `pagada` sea `0` (o `false`) y cuya `fecha_inicio` corresponda al **siguiente período de nómina**.
2.  **Calcular y Pagar:**
    -   Si se encuentra dicho registro:
        -   Calcular el `monto_vacaciones` aplicando las reglas de negocio (seguridad, fijo, variable) como se definió anteriormente.
        -   Actualizar el registro del empleado en `no_det_nomina` para la nómina **actual**:
            -   El `sueldo_nomina` **no se modifica** (el empleado trabajó en este período).
            -   Se suma el `monto_vacaciones` calculado al campo `vacaciones`.
            -   Se recalculan los totales (`total_ingreso`, `total_descuento`, `total_pagar`) para incluir este pago adicional.
        -   **Marcar como pagada:** Actualizar el registro en la tabla `no_vacaciones` para establecer `pagada = 1`. Esto es CRÍTICO para que la lógica de la Tarea 1.2 funcione en la siguiente nómina.

### Fase 2: Base de Datos (Posible Ajuste)

-   **Tarea 2.1:** Verificar si la tabla `no_vacaciones` tiene un campo `pagada` (o similar, como `status_pago`). Si no existe, se debe añadir. Será de tipo `BOOLEAN` o `TINYINT(1)` con un valor por defecto de `0` (No pagada).

### Fase 3: Pruebas y Validación

1.  **Prueba de Flujo Completo (2 Períodos):**
    -   **Preparación (Nómina A):**
        -   Crear una nómina para la 1ra quincena de Octubre.
        -   Registrar vacaciones para un empleado para la 2da quincena de Octubre (el siguiente período). Asegurarse de que `pagada` = 0.
    -   **Ejecución (Nómina A):**
        -   Recalcular la nómina de la 1ra quincena.
    -   **Verificación (Nómina A):**
        -   El empleado debe tener su `sueldo_nomina` normal.
        -   El campo `vacaciones` debe tener el monto adelantado.
        -   El `total_pagar` debe ser la suma de ambos.
        -   Verificar en la BD que el registro en `no_vacaciones` ahora tenga `pagada = 1`.
    -   **Preparación (Nómina B):**
        -   Crear la nómina para la 2da quincena de Octubre.
    -   **Ejecución (Nómina B):**
        -   Recalcular la nómina de la 2da quincena.
    -   **Verificación (Nómina B):**
        -   El `total_pagar` del empleado debe ser `0.00`, ya que está de vacaciones y ya cobró.

---

## Próximos Pasos
Este plan revisado es mucho más preciso y se alinea con la lógica de negocio que has descrito. Por favor, confírmame si es correcto para proceder.