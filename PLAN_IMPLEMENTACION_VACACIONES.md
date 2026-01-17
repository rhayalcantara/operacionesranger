# Plan de Implementación de Vacaciones

## Backend

1.  **Base de Datos:**
    *   Crear una nueva tabla `rh_vacaciones` para almacenar los registros de vacaciones de los empleados. La tabla debe incluir los campos `id`, `empleado_id`, `fecha_inicio`, `fecha_fin`, `monto_pagado` y `fecha_creacion`.
    *   Añadir un campo `status` a la tabla `rh_empleados` para gestionar el estado del empleado (ej: 'Activo', 'En Vacaciones', 'Licencia Médica').

2.  **Modelo:**
    *   Crear un nuevo modelo `vacacionesModel.js` para interactuar con la tabla `rh_vacaciones`.

3.  **Rutas (API):**
    *   Crear un nuevo archivo de rutas `vacaciones.js` para gestionar las operaciones relacionadas con las vacaciones.
    *   Implementar una ruta `POST /api/vacaciones/import` para importar datos de vacaciones desde un archivo (CSV o Excel). Esta ruta se encargará de:
        *   Recibir y procesar el archivo.
        *   Validar los datos del archivo.
        *   Insertar los registros de vacaciones en la tabla `rh_vacaciones`.
        *   Actualizar el estado del empleado a 'En Vacaciones' en la tabla `rh_empleados`.

4.  **Lógica de Negocio:**
    *   Modificar la lógica de generación de nómina para:
        *   Pagar el monto de las vacaciones según lo especificado en el archivo importado.
        *   Excluir a los empleados que estén 'En Vacaciones' o 'Licencia Médica' del cálculo de la nómina regular durante el período correspondiente.
    *   Implementar un mecanismo (posiblemente un cron job o una verificación al iniciar el proceso de nómina) para actualizar automáticamente el estado de los empleados de 'En Vacaciones' a 'Activo' una vez que el período de vacaciones haya finalizado.

## Frontend

1.  **Módulo de Vacaciones:**
    *   Crear un nuevo módulo en Angular llamado `vacaciones`.

2.  **Componentes:**
    *   Crear un componente `vacaciones-import` que contenga un formulario para subir el archivo de importación de vacaciones.
    *   Crear un componente `vacaciones-list` para visualizar el historial de vacaciones de los empleados.

3.  **Servicios:**
    *   Crear un `vacaciones.service.ts` para manejar las peticiones HTTP al backend relacionadas con las vacaciones (ej: `importarVacaciones`).

4.  **Interfaz de Usuario (UI):**
    *   Añadir una nueva opción en el menú de navegación para acceder al módulo de vacaciones.
    *   Modificar la vista de detalles del empleado para mostrar su estado actual ('Activo', 'En Vacaciones', 'Licencia Médica').
