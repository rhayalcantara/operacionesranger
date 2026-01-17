# Plan de Trabajo: Diseño del Volante de Pago (Frontend)

## 1. Análisis de Requisitos y Datos
*   **Investigar Campos Necesarios:** Analizar los campos requeridos para un volante de pago estándar en República Dominicana (ingresos, deducciones de ley, otros descuentos, etc.).
*   **Identificar Endpoints del API:** Revisar las rutas del backend (`no_nomina.js`, `detNomina.js`) para identificar los endpoints que proveen los datos detallados de la nómina por empleado.
*   **Analizar Modelos de Datos:** Estudiar los modelos de Sequelize (`detNominaModel.js`, `empleadoNominaModel.js`, `descCredNominaModel.js`) para entender la estructura de la información disponible.

## 2. Diseño de la Interfaz de Usuario (UI)
*   **Maquetación Visual:** Diseñar un layout claro y profesional utilizando Angular Material, consistente con el estilo de la aplicación.
*   **Estructura del Volante:**
    *   **Encabezado:** Logo de la empresa, nombre de la empresa, RNC, período de pago, y datos del empleado (nombre, cédula, cargo, departamento).
    *   **Cuerpo:** Se dividirán en dos secciones claras:
        *   **Ingresos:** Salario base, horas extras, comisiones, bonos, etc.
        *   **Deducciones:** AFP, ARS, ISR, préstamos, y otros descuentos.
    *   **Pie de Página:** Resumen con Salario Bruto, Total de Deducciones y Salario Neto.
*   **Funcionalidad de Impresión:** Asegurar que el diseño sea "printer-friendly" para que pueda ser impreso o guardado como PDF fácilmente desde el navegador.

## 3. Desarrollo de Componentes en Angular
*   **Crear `VolantePagoComponent`:** Generar un nuevo componente en Angular que encapsulará toda la lógica y la presentación del volante.
*   **Actualizar `NominaService`:** Añadir un nuevo método en el servicio de nómina existente para hacer la llamada al API y obtener los datos específicos para el volante de un empleado.
*   **Configurar Enrutamiento:** Añadir una nueva ruta en `app-routing.module.ts` para mostrar el componente del volante, probablemente con parámetros para el ID de la nómina y el ID del empleado. (Ej: `/volante-pago/:nominaId/:empleadoId`).

## 4. Implementación y Pruebas
*   **Desarrollo del Template:** Construir el HTML y el CSS del componente, utilizando `mat-card`, `mat-list`, y `mat-grid-list` para estructurar la información.
*   **Integración de Datos:** Conectar el componente con el servicio para popular el volante con datos reales del backend.
*   **Añadir Acceso:** Agregar un botón o enlace en la vista de detalle de la nómina para permitir al usuario abrir el volante de pago de un empleado seleccionado.
*   **Pruebas Funcionales:** Verificar que todos los datos se muestren correctamente, que los cálculos coincidan con los totales de la nómina y que la función de impresión funcione como se espera.
