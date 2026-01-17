# Plan de Implementación: Módulo de Gestión de Vacaciones

## 1. Objetivo

Crear un sistema dentro del módulo de RRHH para programar, gestionar y rastrear las vacaciones de los empleados, asegurando que esta información se integre correctamente en el cálculo de la nómina correspondiente. El objetivo es automatizar el proceso de pago de vacaciones y evitar el cálculo manual.

## 2. Componentes Clave

### A. Base de Datos

Crearemos una nueva tabla llamada `rh_vacaciones` para almacenar toda la información relacionada con las vacaciones.

**Estructura de la tabla `rh_vacaciones`:**

| Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| `id_vacacion` | INT (PK, AI) | Identificador único del registro de vacación. |
| `id_empleado` | INT (FK) | Referencia al empleado (`rh_empleado`). |
| `fecha_inicio` | DATE | Fecha en que inician las vacaciones. |
| `fecha_fin` | DATE | Fecha en que terminan las vacaciones. |
| `dias_disfrutados`| INT | Número total de días de vacaciones tomados. |
| `monto_pagado` | DECIMAL(10,2) | Monto total a pagar por concepto de vacaciones. |
| `id_nomina` | INT (FK, nullable) | Referencia a la nómina (`no_nomina`) en la que se pagó. |
| `estado` | VARCHAR(20) | Estado del registro (Ej: 'Programada', 'Pagada', 'Cancelada'). |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro. |

### B. Backend (Node.js/Express)

1.  **Nuevo Modelo:** Crear el modelo `vacacionesModel.js` en `models/` para interactuar con la tabla `rh_vacaciones` usando Sequelize.
2.  **Nuevas Rutas (API Endpoints):** Crear un nuevo archivo de rutas `routes/vacaciones.js` para gestionar las operaciones CRUD.
    *   `POST /api/vacaciones`: Programar nuevas vacaciones para un empleado.
    *   `GET /api/vacaciones`: Obtener un listado de todas las vacaciones programadas/pagadas.
    *   `GET /api/vacaciones/empleado/:id`: Obtener el historial de vacaciones de un empleado específico.
    *   `PUT /api/vacaciones/:id`: Modificar una programación de vacaciones (si aún no ha sido pagada).
    *   `DELETE /api/vacaciones/:id`: Cancelar una programación de vacaciones.
3.  **Integración con el Módulo de Nómina:**
    *   Modificar la lógica de cálculo de la nómina (`routes/no_nomina.js` o un servicio dedicado).
    *   Al momento de calcular la nómina de un empleado, el sistema deberá verificar si existen vacaciones programadas para ese período.
    *   Si un empleado tiene vacaciones, el sistema debe:
        *   Incluir el `monto_pagado` de las vacaciones como un ingreso.
        *   Ajustar el salario base para que no se pague doble por los días de vacaciones.
        *   Marcar el registro de vacaciones como 'Pagada' y asociar el `id_nomina`.

### C. Frontend (Angular)

1.  **Nuevo Módulo y Componentes:** Crear un nuevo módulo para RRHH si no existe, o agregar los componentes necesarios.
    *   **`vacaciones-list.component.ts`**: Componente que mostrará una tabla con todas las vacaciones programadas, permitiendo filtrar por empleado, fechas, etc.
    *   **`vacaciones-form.component.ts`**: Un formulario (posiblemente en un modal) para programar las vacaciones de un empleado. Se seleccionará el empleado, las fechas de inicio y fin. El sistema calculará automáticamente los días y el monto a pagar según el salario del empleado.
2.  **Nuevo Servicio:**
    *   **`vacaciones.service.ts`**: Servicio que se comunicará con los nuevos endpoints del backend para realizar las operaciones CRUD.
3.  **Integración:**
    *   Agregar una nueva opción en el menú de navegación para acceder a la "Gestión de Vacaciones".
    *   Opcionalmente, en el perfil de cada empleado, agregar una pestaña o sección para ver su historial de vacaciones.

## 3. Flujo de Usuario

1.  Un usuario de RRHH accede a la nueva sección "Gestión de Vacaciones".
2.  Ve una lista de las vacaciones ya programadas.
3.  Hace clic en "Programar Vacaciones".
4.  Aparece un formulario donde selecciona un empleado de una lista.
5.  Elige la fecha de inicio y la fecha de fin.
6.  El sistema calcula y muestra los días totales y el monto a pagar (basado en el salario registrado del empleado).
7.  El usuario confirma y el registro se guarda con el estado 'Programada'.
8.  Cuando se procesa una nómina, el sistema detecta estas vacaciones, las incluye en el pago, y actualiza su estado a 'Pagada'.

## 4. Plan de Implementación por Fases

**Fase 1: Backend**
1.  Crear el script de migración para la nueva tabla `rh_vacaciones`.
2.  Crear el modelo de Sequelize `vacacionesModel.js`.
3.  Desarrollar las rutas y controladores para el CRUD básico de vacaciones.
4.  Implementar la lógica de cálculo del `monto_pagado` al momento de crear el registro.

**Fase 2: Frontend**
1.  Crear el servicio `vacaciones.service.ts`.
2.  Desarrollar el componente `vacaciones-list.component.ts` para mostrar los datos.
3.  Desarrollar el componente `vacaciones-form.component.ts` para crear y editar los registros.
4.  Añadir la navegación en la UI.

**Fase 3: Integración y Pruebas**
1.  Modificar el proceso de cálculo de nómina en el backend para que reconozca y procese las vacaciones.
2.  Realizar pruebas exhaustivas del flujo completo: programar vacaciones, correr una nómina y verificar que el volante de pago del empleado refleje correctamente el pago de vacaciones y el ajuste de su salario.
3.  Validar que el estado de la vacación se actualice correctamente a 'Pagada'.
