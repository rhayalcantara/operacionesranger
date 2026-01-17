# Plan de Implementación: Cálculo de Impuesto Sobre la Renta (ISR)

Este documento detalla el plan para integrar el cálculo automático del ISR en el proceso de generación de nómina del sistema Ranger Nomina.

## Fase 1: Base de Datos

1.  **Crear Nueva Tabla:** Añadir una tabla en la base de datos llamada `escalas_isr` para almacenar los tramos de la escala impositiva. Esto permite actualizar los valores anualmente (ajuste por inflación) sin necesidad de modificar el código fuente.
    *   **Nombre de la Tabla:** `escalas_isr`
    *   **Columnas Propuestas:**
        *   `id` (INT, Primary Key, Auto-increment)
        *   `anio` (INT, not null)
        *   `monto_minimo` (DECIMAL, not null)
        *   `monto_maximo` (DECIMAL, nullable, para el último tramo)
        *   `tasa_excedente` (DECIMAL, not null, ej: 0.15 para 15%)
        *   `monto_fijo` (DECIMAL, not null)

2.  **Poblar Datos Iniciales:** Insertar los valores de la escala salarial del año 2025 en la nueva tabla.

## Fase 2: Lógica del Backend (`backend-ranger-nomina`)

1.  **Crear Modelo de Datos:** Generar un nuevo modelo de Sequelize (`EscalaISR.js`) que se corresponda con la estructura de la tabla `escalas_isr`.

2.  **Desarrollar Servicio de Cálculo de ISR:**
    *   Crear un nuevo archivo: `src/services/isrService.js`.
    *   Este servicio contendrá la función principal: `calcularISR(salarioBruto, periodoDePago)`.
    *   **Lógica de la función:**
        a.  Determinar la cantidad de periodos en el año (ej: 'Mensual' -> 12, 'Quincenal' -> 24).
        b.  Calcular el salario anual proyectado: `salarioAnual = salarioBruto * cantidad de periodos`.
        c.  Consultar la tabla `escalas_isr` a través del modelo de Sequelize para obtener la escala del año en curso.
        d.  Encontrar el tramo correspondiente al `salarioAnual`.
        e.  Aplicar la fórmula: `isrAnual = ((salarioAnual - monto_minimo_tramo) * tasa_excedente) + monto_fijo`.
        f.  Calcular el ISR del periodo: `isrPeriodo = isrAnual / cantidad de periodos`.
        g.  Retornar `isrPeriodo`.

3.  **Integrar con el Proceso de Nómina:**
    *   Localizar el servicio principal de cálculo de nómina (ej: `NominaService.js` o similar).
    *   Dentro del proceso de cálculo de deducciones, importar y llamar a `isrService.calcularISR`.
    *   Añadir el valor devuelto al total de deducciones del empleado y guardarlo en un campo específico en el registro de la nómina.

## Fase 3: Interfaz del Frontend (`rangernomina-frontend`)

1.  **Actualizar Vistas de Nómina:**
    *   Modificar el componente que muestra el detalle de la nómina o el volante de pago del empleado.
    *   Añadir una nueva fila o campo en la sección de "Deducciones" con la etiqueta "Retención ISR" para mostrar el monto calculado.

2.  **Ajustar Modelos de Datos (si es necesario):**
    *   Asegurarse de que el objeto que contiene los datos de la nómina en el frontend incluya la nueva propiedad `retencionISR`.

## Fase 4: Pruebas y Verificación

1.  **Pruebas Unitarias (Backend):**
    *   Crear un archivo de prueba para `isrService.js`.
    *   Escribir casos de prueba para salarios que caigan en cada uno de los 4 tramos de la escala, validando que el ISR calculado sea el correcto.
    *   Probar con diferentes periodos de pago (mensual, quincenal).

2.  **Pruebas de Integración (End-to-End):**
    *   Crear un empleado de prueba con un salario específico.
    *   Ejecutar el proceso de cálculo de nómina completo.
    *   Verificar en la base de datos que el registro de la nómina contenga el valor correcto de ISR.
    *   Verificar en la interfaz de usuario que el monto de ISR se muestre correctamente y que el salario neto sea el esperado.
