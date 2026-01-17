# Plan de Modificación para Nómina de Operaciones (Enfoque en Importación)

## Objetivo
Adaptar el cálculo de la nómina de operaciones para que el sueldo bruto se base en las horas trabajadas, procesadas a través de la importación de un archivo Excel (`Control_de_Horas.xlsx`).

- **Salario Base:** Se calcula sobre las horas regulares trabajadas (hasta 130 horas).
- **Horas Extra Diurnas:** Las horas extra que no sean nocturnas se pagarán con un **35% de recargo** sobre el valor de la hora normal.
- **Horas Extra Nocturnas:** Las horas extra nocturnas se pagarán con un **15% de recargo** sobre el valor de la hora normal.

## Flujo de Trabajo Propuesto
1.  El usuario navega a una nueva vista en el frontend para "Importar Horas de Nómina".
2.  El usuario selecciona la nómina activa y sube el archivo `Control_de_Horas.xlsx`.
3.  El backend recibe el archivo, lo procesa, y calcula el sueldo bruto para cada empleado basándose en las reglas definidas.
4.  Los datos calculados se guardan en la tabla `no_det_nomina`.
5.  El frontend muestra un resumen de la importación (ej. "20 empleados procesados correctamente, 2 errores").

## Componentes Afectados

### Backend (`backend-ranger-nomina`)

1.  **Base de Datos:**
    *   **Tabla `no_det_nomina`:**
        *   **Cambio:** Agregar columnas para auditoría y claridad en los cálculos.
        *   **Campos sugeridos:** `horas_regulares`, `horas_extra_diurnas`, `horas_extra_nocturnas`, `monto_horas_extra_diurnas`, `monto_horas_extra_nocturnas`.

2.  **Nueva Ruta de Importación (Ej: `routes/import_horas.js`):**
    *   **Cambio:** Crear un nuevo endpoint (ej. `POST /api/nomina/:id/import-horas`) que maneje la subida de archivos.
    *   **Dependencia:** Necesitará una librería para leer archivos Excel, como `xlsx`. Se debe agregar a `package.json`.

3.  **Nuevo Lógica de Importación (Ej: `services/importService.js`):**
    *   **Cambio:** Crear un nuevo servicio que contenga la lógica de negocio.
    *   **Funcionalidad:**
        1.  **Leer Excel:** Parsear el archivo `Control_de_Horas.xlsx` para extraer `id_empleado`, `horas_regulares`, `horas_extra_diurnas`, `horas_extra_nocturnas`.
        2.  **Obtener Salario:** Por cada empleado en el archivo, consultar la base de datos para obtener su `salario_act`.
        3.  **Calcular Sueldo Bruto:**
            *   Calcular el **salario por hora** del empleado.
            *   Calcular el **monto de horas regulares**.
            *   Calcular el **monto de horas extra diurnas** (`horas_extra_diurnas * (salario_por_hora * 1.35)`).
            *   Calcular el **monto de horas extra nocturnas** (`horas_extra_nocturnas * (salario_por_hora * 1.15)`).
            *   El **Sueldo Bruto Final** = (Monto Horas Regulares) + (Monto Horas Extra Diurnas) + (Monto Horas Extra Nocturnas).
        4.  **Guardar en DB:** Actualizar o insertar el registro correspondiente en `no_det_nomina` con el sueldo bruto y los campos de desglose.

### Frontend (`rangernomina-frontend`)

1.  **Nuevo Componente de Importación (Ej: `src/app/importaciones/import-horas.component.ts`):**
    *   **Cambio:** Crear una nueva página/componente dedicado a la importación.
    *   **Funcionalidad:**
        *   Un `select` para elegir la nómina a la que se aplicará la importación.
        *   Un control de carga de archivos (`<input type="file">`) para que el usuario seleccione el `.xlsx`.
        *   Un botón "Procesar" que llame al nuevo servicio.
        *   Área para mostrar notificaciones de éxito o error.

2.  **Nuevo Servicio de Frontend (Ej: `src/app/importaciones/import.service.ts`):**
    *   **Cambio:** Crear un servicio que se comunique con el nuevo endpoint del backend, enviando el archivo y el ID de la nómina.

3.  **Rutas del Frontend (`src/app/app.routes.ts`):**
    *   **Cambio:** Agregar la nueva ruta para que el componente de importación sea accesible (ej. `/importar-horas`).

4.  **Menú de Navegación (`src/app/navmenu/...`):**
    *   **Cambio:** Agregar un enlace en el menú lateral para acceder a la nueva página de importación.

## Pasos Siguientes
1.  **Confirmación del Plan:** Revisar y aprobar este nuevo enfoque.
2.  **Desarrollo Backend:** Implementar los cambios en la DB, crear la nueva ruta y el servicio de importación.
3.  **Desarrollo Frontend:** Crear el nuevo componente, servicio y añadir las rutas y enlaces.
4.  **Pruebas:** Realizar pruebas completas del flujo de importación.
