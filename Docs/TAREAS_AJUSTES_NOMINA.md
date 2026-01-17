# Lista de Tareas: Implementación de Ajustes en Recálculo de Nómina

Este documento desglosa en tareas accionables el plan de trabajo para ajustar la lógica de recálculo de nómina.

---

### Fase 1: Preparación de la Base de Datos

*   **[x] Tarea 1: Modificar la tabla `no_vacaciones`**
    *   **Acción:** Añadir una nueva columna llamada `pagada` a la tabla `no_vacaciones`.
    *   **Especificaciones:**
        *   Tipo de dato: `TINYINT(1)` o `BOOLEAN`.
        *   Valor por defecto: `0` (o `false`).
        *   No nulo (`NOT NULL`).
    *   **Validación:** Confirmar que la estructura de la tabla `no_vacaciones` ha sido actualizada correctamente usando una herramienta de base de datos.

---

### Fase 2: Implementación de la Lógica en el Backend (`nominaModel.js`)

*   **[x] Tarea 2: Refactorizar la función `recalcular(nominaId)`**
    *   **Acción:** Reestructurar el bucle principal de la función para que, por cada empleado, se apliquen las siguientes subtareas en el orden correcto.

*   **[x] Tarea 2.1: Implementar exclusión de empleados despedidos**
    *   **Acción:** Dentro del bucle de empleados, añadir una condición que verifique si la `fecha_despido` del empleado es anterior a la `fecha_inicio` de la nómina.
    *   **Lógica:** Si la condición se cumple, ejecutar `DELETE` sobre `no_det_nomina` para ese empleado y nómina, y saltar al siguiente empleado.
    *   **Validación:** Realizar una prueba unitaria o de integración para el "Caso 1" descrito en el plan.

*   **[x] Tarea 2.2: Implementar exclusión de empleados en vacaciones (pago ya realizado)**
    *   **Acción:** Añadir una consulta que verifique si el empleado tiene un registro en `no_vacaciones` para el período **actual** y si el campo `pagada` es `1`.
    *   **Lógica:** Si la condición se cumple, actualizar el registro de `no_det_nomina` del empleado, estableciendo todos sus campos de ingresos y totales a `0`.
    *   **Validación:** Probar el escenario de la "Nómina B" del plan, donde un empleado está disfrutando de vacaciones previamente pagadas.

*   **[x] Tarea 2.3: Implementar pago por adelantado de vacaciones futuras**
    *   **Acción:** Añadir una consulta que busque registros en `no_vacaciones` para el **siguiente período** de nómina donde `pagada` sea `0`.
    *   **Lógica:**
        1.  Si se encuentra un registro, calcular el `monto_vacaciones` aplicando las reglas de negocio (seguridad, fijo, variable).
        2.  Sumar este monto al campo `vacaciones` del registro del empleado en `no_det_nomina` de la nómina **actual**.
        3.  Recalcular los totales (`total_ingreso`, `total_pagar`, etc.).
        4.  Ejecutar un `UPDATE` en la tabla `no_vacaciones` para establecer `pagada = 1` en ese registro.
    *   **Validación:** Probar el escenario de la "Nómina A" del plan, donde se adelanta el pago de vacaciones.

---

### Fase 3: Pruebas de Integración y Finalización

*   **[x] Tarea 3: Ejecutar el flujo de prueba completo**
    *   **Acción:** Seguir el escenario de prueba de dos períodos descrito en el plan de implementación para validar que el ciclo completo de pago adelantado y exclusión posterior funciona como se espera.
    *   **Verificación:** Documentar los resultados y confirmar que los valores en la base de datos (`no_det_nomina` y `no_vacaciones`) son los correctos en cada etapa.

*   **[x] Tarea 4: Revisión de Código y Limpieza**
    *   **Acción:** Eliminar cualquier `console.log` o código de depuración utilizado durante el desarrollo.
    *   **Acción:** Revisar que el código nuevo esté bien comentado y siga las convenciones del proyecto.
    *   **Validación:** Confirmar que la funcionalidad de recálculo sigue operando correctamente para nóminas que no tienen estos casos especiales.
