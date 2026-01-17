# Tareas para la Implementación de Vacaciones

## Backend

- [x] **Base de Datos:**
    - [x] Crear el script de migración SQL para la tabla `rh_vacaciones`.
    - [x] Ejecutar la migración para crear la tabla en la base de datos.
    - [x] Añadir el campo `status` a la tabla `rh_empleados` con un valor por defecto de 'Activo'.

- [x] **Modelo:**
    - [x] Crear el archivo `backend-ranger-nomina/models/vacacionesModel.js`.
    - [x] Definir el modelo de Sequelize para `rh_vacaciones`.

- [x] **Rutas:**
    - [x] Crear el archivo `backend-ranger-nomina/routes/vacaciones.js`.
    - [x] Implementar la ruta `POST /api/vacaciones/import` en `vacaciones.js`.
    - [x] Añadir la lógica para procesar archivos CSV o Excel (usando una librería como `multer` y `xlsx`).

- [x] **Lógica de Negocio:**
    - [x] Modificar la función de cálculo de nómina para excluir empleados con status 'En Vacaciones' o 'Licencia Médrica'.
    - [x] Implementar la lógica para pagar el monto de las vacaciones.
    - [x] Crear un script o función para revertir el estado del empleado a 'Activo' después del período de vacaciones.

## Frontend

- [x] **Módulo:**
    - [x] Generar el nuevo módulo `vacaciones` en Angular.

- [x] **Componentes:**
    - [x] Generar el componente `vacaciones-import`.
    - [x] Diseñar e implementar el formulario de subida de archivos en `vacaciones-import.component.html`.
    - [x] Generar el componente `vacaciones-list`.
    - [x] Implementar la tabla o lista para mostrar el historial de vacaciones en `vacaciones-list.component.html`.

- [x] **Servicios:**
    - [x] Generar el servicio `vacaciones.service.ts`.
    - [x] Implementar el método `importarVacaciones(archivo)` que envíe el archivo al backend.
    - [x] Implementar un método para obtener el historial de vacaciones.

- [x] **UI/UX:**
    - [x] Agregar el enlace al módulo de vacaciones en el menú principal (`navmenu.component.html`).
    - [x] Actualizar el componente de empleado para mostrar el campo `status`.
