# Tareas para Implementación: Cierre de Nómina

## Backend

- [ ] **Base de Datos:** Definir el modelo Sequelize para `rh_empleado_nomina` y sincronizarlo con la base de datos.
- [ ] **Ruta API:** Crear la nueva ruta `POST /api/nominas/:id/cerrar` en el archivo de rutas de nómina.
- [ ] **Controlador:** Implementar el método en el controlador para manejar la lógica del cierre de nómina.
- [ ] **Lógica de Cierre (Servicio):
    - [ ] Envolver la operación en una transacción de Sequelize.
    - [ ] Actualizar el estado de la nómina a 'Cerrada'.
    - [ ] Implementar la copia de empleados de `rh_empleado` a `rh_empleado_nomina`.
- [ ] **Inmutabilidad (Middleware/Hooks):
    - [ ] Crear o actualizar un middleware para verificar el estado de la nómina antes de cualquier operación de escritura (POST, PUT, DELETE).
    - [ ] Aplicar este middleware a todas las rutas relacionadas con la modificación de detalles de nómina.
- [ ] **Consulta de Nómina:** Modificar el servicio `GET /api/nominas/:id` para que cargue empleados desde `rh_empleado_nomina` si la nómina está cerrada.

## Frontend

- [ ] **Componente Nómina Detalle:**
    - [ ] Añadir el botón "Cerrar Nómina" en el template HTML.
    - [ ] Usar `*ngIf` para mostrar el botón solo si `nomina.estado === 'Abierta'`.
- [ ] **Servicio de Nómina:**
    - [ ] Crear un nuevo método `cerrarNomina(id: number)` que haga la petición `POST` al backend.
- [ ] **Lógica del Componente:**
    - [ ] Implementar el método que se llama al hacer clic en el botón.
    - [ ] Integrar un servicio de diálogo (ej. Angular Material MatDialog) para mostrar la confirmación.
    - [ ] Llamar al `nominaService.cerrarNomina()` si el usuario confirma.
    - [ ] Manejar la respuesta (éxito/error) y refrescar los datos de la nómina.
- [ ] **Estado de Solo Lectura:**
    - [ ] Añadir lógica (`[disabled]` o `*ngIf`) a todos los campos de formulario y botones de edición para deshabilitarlos si `nomina.estado === 'Cerrada'`.
