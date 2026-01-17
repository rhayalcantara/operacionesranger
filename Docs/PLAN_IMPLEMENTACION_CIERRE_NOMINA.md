# Plan de Implementación: Proceso de Cierre de Nómina

## Objetivo
Implementar la funcionalidad para "cerrar" una nómina, lo que implica cambiar su estado, crear un registro histórico de los empleados en ese momento y hacer que la nómina sea inmutable para futuras modificaciones.

---

## Backend

### 1. Base de Datos
- **Verificar/Crear Tabla `rh_empleado_nomina`:**
    - Se debe asegurar que la tabla `rh_empleado_nomina` exista.
    - Su estructura debe ser una copia de `rh_empleado`, con la adición de una columna `nomina_id` para vincular el registro del empleado con el cierre de nómina específico.
    - Esta tabla servirá como una "foto" (snapshot) del estado del empleado al momento del cierre.

### 2. API Endpoint para Cierre
- **Crear una nueva ruta:** `POST /api/nominas/:id/cerrar`
- Esta ruta recibirá el `id` de la nómina a cerrar.
- La lógica se manejará en un nuevo método del controlador de nóminas.

### 3. Lógica de Negocio (Controlador/Servicio)
- **Transacción Atómica:** Todo el proceso debe estar envuelto en una transacción de base de datos para garantizar la integridad. Si un paso falla, todos los cambios se revierten.
- **Pasos de la transacción:**
    1.  **Actualizar Estado:** Cambiar el estado de la nómina en la tabla `no_nomina` de 'Abierta' a 'Cerrada'.
    2.  **Copiar Empleados:**
        - Obtener todos los empleados asociados a la nómina que se está cerrando.
        - Para cada empleado, insertar un nuevo registro en la tabla `rh_empleado_nomina` con todos sus datos actuales.
    3.  **Confirmar Transacción:** Si todos los pasos son exitosos, confirmar (commit) la transacción.

### 4. Inmutabilidad de Nóminas Cerradas
- **Middleware o Verificaciones:**
    - Modificar todas las rutas existentes que permitan alterar una nómina (ej. `PUT`, `POST`, `DELETE` en `detNomina`, `descCredNomina`, etc.).
    - Antes de ejecutar cualquier lógica de modificación, se debe verificar el estado de la nómina asociada.
    - Si el estado es 'Cerrada', la API debe devolver un error (ej. `403 Forbidden`) con un mensaje claro: "La nómina está cerrada y no puede ser modificada."

### 5. Consulta de Nóminas
- **Modificar Endpoint `GET /api/nominas/:id`:**
    - La lógica para obtener los detalles de una nómina (incluyendo sus empleados) debe ser actualizada.
    - **Si la nómina está 'Abierta'**: La consulta debe unir las tablas `no_nomina` con `rh_empleado` (comportamiento actual).
    - **Si la nómina está 'Cerrada'**: La consulta debe unir las tablas `no_nomina` con `rh_empleado_nomina` para obtener los datos históricos de los empleados.

---

## Frontend

### 1. Interfaz de Usuario (UI)
- **Añadir Botón "Cerrar Nómina":**
    - En la vista de detalle de una nómina, agregar un botón "Cerrar Nómina".
    - Este botón solo debe estar visible y habilitado si la nómina tiene el estado 'Abierta'.

### 2. Interacción del Usuario
- **Confirmación:** Al hacer clic en "Cerrar Nómina", se debe mostrar un diálogo de confirmación modal.
    - **Mensaje:** "¿Está seguro de que desea cerrar la nómina? Este proceso es irreversible y no podrá realizar más cambios."
- **Llamada al Servicio:** Si el usuario confirma, el frontend debe llamar al nuevo endpoint del backend: `POST /api/nominas/:id/cerrar`.

### 3. Gestión del Estado en el Frontend
- **Actualización de la Vista:**
    - Tras una respuesta exitosa del backend, la vista de la nómina debe actualizarse automáticamente.
    - El estado de la nómina debe mostrarse como 'Cerrada'.
- **Deshabilitar Controles:**
    - Todos los controles de edición (botones para añadir/quitar empleados, editar valores, etc.) deben deshabilitarse o ocultarse.
    - La vista de una nómina cerrada debe ser de **solo lectura**.

---
