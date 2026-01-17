### Resumen de la Sesión - 19 de Septiembre de 2025

En esta sesión, hemos realizado una refactorización completa de la funcionalidad de importación de horas trabajadas:

1.  **Análisis del Archivo:** Investigamos la estructura del archivo Excel del cliente (`Docs/Control_de_Horas.xlsx`), descubriendo que los encabezados y los datos no comenzaban en la primera fila. Se crearon scripts temporales para inspeccionar la estructura real.

2.  **Adaptación del Backend:** Se modificó el servicio de importación (`importService.js`) para leer correctamente el formato del archivo, mapeando las columnas `CODIGO`, `HORAS DÍA`, `HORAS 35%` y `HORAS NOCHE`.

3.  **Cálculo Diferencial:** Se implementó una lógica para calcular el salario por hora de forma distinta para los vigilantes (`id_puesto = 97`) y el resto de los empleados, basándose en la información de la tabla `rh_puestos`.

4.  **Depuración y Diagnóstico:** Agregamos y luego eliminamos registros de consola para diagnosticar por qué no se procesaban los empleados. Se identificó que el problema inicial era la lectura incorrecta de los encabezados y, posteriormente, que algunos códigos de empleados del archivo Excel no existían en la base de datos.

5.  **Refactorización de Arquitectura:** Se modificó el flujo de datos para mejorar la separación de responsabilidades. La importación ahora no calcula montos ni afecta directamente a la tabla `no_det_nomina`. En su lugar, inserta las horas como registros individuales en `no_desc_cred_nomina`.

6.  **Creación de Modelo:** Se creó el nuevo archivo `models/descCredNominaModel.js` para gestionar las operaciones de inserción y eliminación en la tabla `no_desc_cred_nomina`, asegurando que el proceso de importación sea idempotente.

7.  **Commits y Push:** Finalmente, se prepararon y subieron los commits correspondientes a los repositorios del backend y frontend con mensajes descriptivos de los cambios realizados.
