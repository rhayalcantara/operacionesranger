"""
Genera archivos de audio narrados en español para cada video tutorial.
Usa Microsoft Edge TTS con voz dominicana.
"""
import asyncio
import edge_tts
import os

VOICE = "es-DO-EmilioNeural"
OUTPUT_DIR = "public/audio"

# Narraciones completas para cada video tutorial
# Cada entrada: (nombre_archivo, texto_narración)
NARRATIONS = [
    ("01-Login", """
Bienvenido al sistema Ranger Nómina.
En este tutorial aprenderá cómo iniciar sesión en el sistema.
Al abrir la aplicación, verá la pantalla de inicio de sesión.
Ingrese su nombre de usuario en el campo Usuario.
Luego ingrese su contraseña en el campo Contraseña.
Haga clic en el botón Login para acceder al sistema.
Si las credenciales son incorrectas, el sistema le mostrará un mensaje de error.
Verifique que su usuario y contraseña estén correctos e intente nuevamente.
Una vez autenticado, será redirigido al Panel Principal del sistema.
"""),

    ("02-Dashboard", """
Este es el Panel Principal o Dashboard del sistema Ranger Nómina.
Aquí puede ver un resumen de la información más importante del sistema.
El dashboard muestra el total de empleados activos registrados.
También puede ver las nóminas procesadas y métricas clave.
Desde aquí puede navegar a cualquier sección del sistema usando el menú lateral o la barra superior.
El panel se actualiza automáticamente con los datos más recientes.
"""),

    ("03-Navegacion", """
Veamos la estructura del menú de navegación del sistema.
En la barra lateral izquierda encontrará todas las secciones organizadas por categoría.
La sección Payroll contiene todo lo relacionado con nóminas.
Aquí encontrará: Nóminas, Ingresos y Descuentos Manuales, Auditoría de Ingresos y Descuentos, Cuotas, Historial de Vacaciones y Regalía Pascual.
La sección RRHH incluye Gestión de Vacaciones y Novedades de Salud.
En Importaciones puede cargar archivos Excel con horas extra y vacaciones.
La sección Reportes ofrece diferentes informes: Empleados por Tipo de Nómina, Descuentos y Créditos por Nómina, Ingresos y Descuentos Agrupados, y Estado de Cuenta del Empleado.
La sección Mantenimientos permite administrar: Empleados, Departamentos, ARS, AFP, Cargos, Tipos de Nómina, Sub-Nóminas, Descuentos y Créditos, ISR, Empresa, Usuarios y Auditoría.
Las opciones de Empresa, Usuarios y Auditoría solo están disponibles para administradores con nivel 9.
"""),

    ("04-EmpleadosLista", """
En esta pantalla puede ver la lista completa de empleados registrados en el sistema.
La tabla muestra los datos principales de cada empleado: código, nombre, apellidos, departamento, puesto y estado.
Puede buscar empleados usando la barra de búsqueda en la parte superior.
Escriba el nombre, código o cualquier dato del empleado para filtrar la lista.
La tabla tiene paginación en la parte inferior para navegar entre páginas cuando hay muchos registros.
Para editar un empleado, haga clic en el botón de edición en la columna de acciones.
Para crear un nuevo empleado, haga clic en el botón Nuevo Empleado.
"""),

    ("05-EmpleadosCrear", """
Para crear un nuevo empleado, complete todos los campos del formulario.
Ingrese el nombre y apellidos del empleado.
Escriba el número de cédula, que es un campo obligatorio y debe ser único.
Seleccione el departamento al que pertenece el empleado.
Seleccione el cargo o puesto que ocupará.
Elija el tipo de nómina: puede ser Administrativa, Quincenal o Semanal.
Ingrese el salario mensual del empleado.
Seleccione el banco donde recibirá su pago.
Ingrese el número de cuenta bancaria.
Puede agregar una foto del empleado haciendo clic en el área de imagen.
Todos los campos marcados con asterisco son obligatorios.
El sistema validará los datos antes de guardar.
Si todo está correcto, haga clic en el botón Guardar para registrar al empleado.
"""),

    ("06-EmpleadosEditar", """
Para editar un empleado existente, selecciónelo desde la lista de empleados.
Haga clic en el ícono de edición en la columna de acciones.
Se abrirá el formulario con los datos actuales del empleado.
Puede modificar cualquier campo: nombre, departamento, puesto, salario, banco y cuenta.
Para desactivar un empleado, cambie su estado de Activo a Inactivo.
Los empleados inactivos no aparecerán en las nóminas futuras.
Recuerde hacer clic en Guardar para confirmar los cambios realizados.
"""),

    ("07-NominaCrear", """
Crear una nueva nómina es el primer paso del proceso de pago.
Desde la lista de nóminas, haga clic en el botón Nueva Nómina.
En el formulario, seleccione el tipo de nómina: Administrativa, Quincenal o Semanal.
Seleccione el número de quincena correspondiente.
Ingrese la fecha de inicio y fecha de fin del período de pago.
Escriba un título descriptivo para identificar esta nómina.
El sistema cargará automáticamente los empleados activos del tipo de nómina seleccionado.
La nómina se crea en estado abierto, lo que permite agregar ingresos, descuentos manuales y recalcular antes de cerrarla.
Haga clic en Guardar para crear la nómina.
"""),

    ("08-NominaDetalle", """
El detalle de nómina muestra toda la información del proceso de pago.
En la parte superior puede ver el resumen: total de sueldos brutos, incentivos, descuentos y neto a pagar.
La tabla principal muestra cada empleado incluido en la nómina.
Para cada empleado puede ver: sueldo bruto, descuentos de AFP, descuentos de ARS, ISR, otros descuentos, ingresos adicionales y el neto a pagar.
Desde aquí puede acceder a las acciones principales: recalcular la nómina, agregar ingresos o descuentos, y ver o imprimir los volantes de pago.
También puede cerrar la nómina cuando esté lista para el pago.
"""),

    ("09-IngresosDescuentos", """
En esta pantalla puede agregar ingresos y descuentos manuales a una nómina.
Primero, seleccione la nómina a la que desea agregar los movimientos.
Luego seleccione el empleado afectado.
Elija el tipo de concepto: puede ser un ingreso como bonificación o comisión, o un descuento como préstamo o avance.
Ingrese el monto correspondiente.
Los ingresos se suman al salario bruto del empleado.
Los descuentos se restan del salario.
Puede agregar múltiples conceptos por empleado.
Recuerde recalcular la nómina después de agregar los movimientos para que los montos se actualicen correctamente.
"""),

    ("10-NominaRecalcular", """
La función de recalcular es fundamental para obtener los montos correctos de la nómina.
Al recalcular, el sistema calcula automáticamente todos los descuentos de ley.
El AFP se calcula al 2.87 por ciento del salario, con un tope máximo de 9,932 pesos con 40 centavos.
El ARS se calcula al 3.04 por ciento, con el mismo tope salarial.
Para el ISR, primero se deduce la TSS, que es la suma de AFP más ARS.
Luego se aplican los tramos impositivos progresivos según la tabla del ISR.
También se calculan las horas extra: al 35 por ciento para horas nocturnas y al 15 por ciento para horas diurnas.
Las vacaciones se calculan basadas en el salario promedio de los últimos 3 meses, contando solo días laborables de lunes a viernes.
El resultado final es el neto a pagar de cada empleado.
"""),

    ("11-NominaCerrar", """
Cerrar una nómina es un paso muy importante e irreversible.
Antes de cerrar, asegúrese de haber verificado todos los montos y conceptos.
Al cerrar la nómina, el sistema crea una copia histórica de los datos de cada empleado en ese momento.
Esto incluye su salario, departamento, puesto y todos los montos calculados.
Una vez cerrada, la nómina no puede modificarse de ninguna manera.
No se pueden agregar ni eliminar ingresos o descuentos.
No se puede recalcular ni cambiar empleados.
Esta inmutabilidad garantiza la integridad de los datos para fines de auditoría y cumplimiento legal.
Solo proceda a cerrar cuando esté completamente seguro de que todos los datos son correctos.
"""),

    ("12-VolantePago", """
El volante de pago es el comprobante que recibe cada empleado.
Desde el detalle de la nómina, haga clic en el ícono de imprimir junto al empleado.
El sistema genera un documento PDF con el desglose completo del pago.
El volante incluye: los datos de la empresa, nombre y código del empleado, período de pago, todos los ingresos desglosados, los descuentos de ley como AFP, ARS e ISR, los descuentos manuales, y el monto neto a pagar.
Puede descargar el PDF o imprimirlo directamente.
"""),

    ("13-ImpresionMasiva", """
La impresión masiva permite generar todos los volantes de pago de una sola vez.
Desde el detalle de la nómina, haga clic en el botón de Impresión Masiva.
El sistema genera un PDF único con todos los volantes de pago, uno por página.
Esto facilita la impresión y distribución de los comprobantes a todos los empleados.
Es especialmente útil cuando la nómina incluye muchos empleados.
"""),

    ("14-ImportarHorasExtra", """
Puede importar horas extra desde un archivo Excel.
Primero, seleccione la nómina a la que se asignarán las horas.
Luego seleccione el tipo de importación: Horas Extra.
El archivo Excel debe tener las columnas correctas: código del empleado, horas al 35 por ciento y horas al 15 por ciento.
Haga clic en Seleccionar Archivo y elija su archivo Excel.
El sistema validará la estructura del archivo antes de procesarlo.
Si hay errores, le indicará qué filas tienen problemas.
Las horas importadas se registran como ingresos adicionales en la nómina.
Recuerde recalcular la nómina después de la importación para que los montos se actualicen.
"""),

    ("15-ImportarVacaciones", """
También puede importar datos de vacaciones desde Excel.
El proceso es similar a la importación de horas extra.
Seleccione la nómina correspondiente y el tipo de importación: Vacaciones.
El archivo Excel debe contener: código del empleado y los días de vacaciones.
El sistema calcula automáticamente el pago de vacaciones basado en el salario promedio de los últimos 3 meses.
Solo se cuentan días laborables, de lunes a viernes, excluyendo fines de semana.
Verifique que los datos del archivo sean correctos antes de importar.
"""),

    ("16-GestionVacaciones", """
La gestión de vacaciones permite administrar las vacaciones de los empleados.
Aquí puede ver qué empleados son elegibles para tomar vacaciones.
Para crear un registro de vacaciones, seleccione el empleado.
Ingrese la fecha de inicio y fecha de fin del período de vacaciones.
El sistema calcula automáticamente los días hábiles y el monto a pagar.
El cálculo se basa en el salario promedio de los últimos 3 meses.
Solo se cuentan los días de lunes a viernes como días laborables.
Puede aprobar o rechazar solicitudes de vacaciones según las políticas de la empresa.
"""),

    ("17-HistorialVacaciones", """
El historial de vacaciones muestra todos los registros de vacaciones anteriores.
Puede filtrar por empleado para ver su historial completo.
La tabla muestra: fechas del período, días disfrutados, monto pagado y estado.
Esta información es útil para verificar los días disponibles de cada empleado.
También sirve como referencia para auditorías y consultas de recursos humanos.
"""),

    ("18-NovedadesSalud", """
Las novedades de salud permiten registrar eventos médicos de los empleados.
Aquí puede documentar licencias médicas, incapacidades y otros eventos de salud.
Para crear una novedad, seleccione el empleado afectado.
Ingrese el tipo de novedad, las fechas de inicio y fin, y una descripción.
Estos registros son independientes de la nómina.
Son parte de la gestión de recursos humanos para llevar un control del historial médico laboral.
"""),

    ("19-Cuotas", """
La gestión de cuotas permite crear planes de pago en cuotas para descuentos o créditos.
Seleccione el empleado y el tipo de concepto.
Ingrese el monto total y el número de cuotas.
El sistema divide automáticamente el monto en cuotas iguales.
Cada cuota se aplica automáticamente en cada período de nómina.
Puede ver el estado de cada cuota: pendiente, aplicada o cancelada.
También puede cancelar un plan de cuotas si ya no aplica.
Esta función es ideal para préstamos, avances de salario o descuentos fraccionados.
"""),

    ("20-Regalia", """
La Regalía Pascual es el aguinaldo navideño obligatorio en República Dominicana.
Esta función calcula automáticamente el monto a pagar a cada empleado.
El cálculo se basa en el historial salarial del empleado durante el año.
Solo los administradores con nivel 9 tienen acceso a esta función.
El sistema muestra el desglose: salario promedio, meses trabajados y monto final.
La regalía se calcula como un doceavo del salario ordinario devengado durante el año.
Verifique los montos antes de procesar el pago.
"""),

    ("21-AFP", """
En el mantenimiento de AFP puede administrar los fondos de pensiones.
La AFP es la Administradora de Fondos de Pensiones.
Aquí se configura el porcentaje de descuento, que actualmente es 2.87 por ciento.
También se define el tope salarial, que es el salario máximo sobre el cual se calcula el descuento.
Puede crear nuevos registros de AFP, editar los existentes o eliminarlos.
Los cambios aquí afectan directamente el cálculo de las nóminas futuras.
"""),

    ("22-ARS", """
El mantenimiento de ARS funciona de manera similar al de AFP.
La ARS es la Administradora de Riesgos de Salud, el seguro médico obligatorio.
El porcentaje de descuento del empleado es 3.04 por ciento.
El tope salarial define el máximo sobre el cual se aplica el descuento.
Puede administrar las diferentes ARS disponibles para los empleados.
Los cambios en esta configuración se reflejan al recalcular las nóminas.
"""),

    ("23-Departamentos", """
Aquí puede administrar los departamentos de la empresa.
La lista muestra todos los departamentos registrados.
Para crear un nuevo departamento, haga clic en el botón Nuevo.
Ingrese el nombre del departamento y haga clic en Guardar.
Para editar, haga clic en el ícono de edición junto al departamento.
También puede eliminar departamentos que ya no se utilicen.
Los departamentos se asignan a los empleados para organizar la estructura de la empresa.
"""),

    ("24-Puestos", """
El mantenimiento de cargos permite administrar los puestos de trabajo.
La tabla muestra todos los cargos registrados en el sistema.
Para crear un nuevo cargo, haga clic en Nuevo y escriba el nombre del puesto.
Puede editar o eliminar cargos existentes usando los botones de acción.
Los cargos se asignan a los empleados y ayudan a clasificar las posiciones dentro de la empresa.
"""),

    ("25-Bancos", """
En esta sección puede administrar los bancos disponibles en el sistema.
Los bancos se utilizan para registrar las cuentas donde los empleados reciben su pago.
Para agregar un nuevo banco, haga clic en Nuevo e ingrese el nombre.
Puede editar o eliminar bancos usando los botones de acción.
Cada empleado tiene asignado un banco y número de cuenta para el pago de nómina.
"""),

    ("26-TiposNomina", """
Los tipos de nómina definen los diferentes períodos de pago.
Puede configurar nóminas de tipo Mensual, Quincenal o Semanal.
Cada tipo tiene su propio período de pago y frecuencia.
Los empleados se asignan a un tipo de nómina según su contrato.
Esto determina con qué frecuencia reciben su pago.
Puede crear nuevos tipos o modificar los existentes según las necesidades de la empresa.
"""),

    ("27-Subnominas", """
Las sub-nóminas son clasificaciones dentro de un tipo de nómina.
Permiten agrupar empleados dentro del mismo tipo de nómina.
Por ejemplo, dentro de la nómina administrativa puede tener sub-grupos.
Para crear una sub-nómina, seleccione el tipo de nómina padre e ingrese el nombre.
Esta organización facilita la gestión cuando hay muchos empleados en un mismo tipo de nómina.
"""),

    ("28-ISR", """
La tabla de ISR contiene los tramos impositivos del Impuesto Sobre la Renta.
Es fundamental para el cálculo correcto de la nómina en República Dominicana.
Los tramos son progresivos: a mayor ingreso, mayor porcentaje de impuesto.
Importante: antes de aplicar los tramos, el sistema deduce la TSS, que es la suma de AFP más ARS.
Solo el ingreso neto después de TSS se somete al cálculo del ISR.
Puede modificar los tramos según las actualizaciones de la DGII.
Cualquier cambio aquí afecta el cálculo del ISR en todas las nóminas futuras.
Verifique siempre con la tabla oficial de la Dirección General de Impuestos Internos.
"""),

    ("29-DescCredCatalogo", """
El catálogo de descuentos y créditos contiene todos los tipos de conceptos disponibles.
Cada concepto tiene un código único, un nombre descriptivo, y una clasificación como ingreso o descuento.
Los ingresos incluyen conceptos como: bonificaciones, comisiones, horas extra e incentivos.
Los descuentos incluyen: préstamos, avances, penalidades y otros descuentos.
Para crear un nuevo concepto, haga clic en Nuevo e ingrese los datos.
Estos conceptos se utilizan al agregar ingresos o descuentos manuales a las nóminas.
Mantenga el catálogo organizado para facilitar la gestión de la nómina.
"""),

    ("30-Empresa", """
La configuración de empresa contiene los datos de la compañía.
Solo los administradores con nivel 9 pueden acceder a esta sección.
Aquí se registra: el nombre de la empresa, el RNC o número de registro fiscal.
También la dirección, teléfono, correo electrónico y el representante legal.
Puede cargar el logo de la empresa, que aparecerá en los volantes de pago y reportes.
Solo existe un registro de empresa en el sistema, ya que es una configuración única.
Los datos aquí configurados se reflejan en todos los documentos generados por el sistema.
"""),

    ("31-Usuarios", """
La gestión de usuarios permite crear y administrar las cuentas de acceso al sistema.
Solo los administradores con nivel 9 pueden acceder a esta función.
Para crear un nuevo usuario, haga clic en Nuevo Usuario.
Ingrese el nombre de usuario, contraseña, nombre y apellidos.
Asigne el nivel de acceso: el nivel 9 es administrador con acceso completo.
Los niveles inferiores tienen acceso limitado a ciertas secciones del menú.
Puede editar usuarios existentes para cambiar sus datos o nivel de acceso.
Las contraseñas se almacenan encriptadas por seguridad.
Nunca comparta las credenciales de acceso con personas no autorizadas.
"""),

    ("32-CambiarClave", """
Cualquier usuario puede cambiar su propia contraseña.
Ingrese su contraseña actual en el primer campo.
Luego escriba la nueva contraseña.
Confirme la nueva contraseña en el último campo.
Haga clic en Cambiar para actualizar la contraseña.
Se recomienda cambiar la contraseña periódicamente por seguridad.
"""),

    ("33-Auditoria", """
La auditoría del sistema registra todas las operaciones realizadas.
Solo los administradores con nivel 9 pueden acceder a esta sección.
Aquí puede ver quién hizo qué y cuándo: cada acción queda registrada.
Puede filtrar por fecha, módulo y tipo de acción.
Se registran operaciones como: creación, edición y eliminación de registros.
También se registran las operaciones de nómina: creación, recálculo y cierre.
Esta información es fundamental para la transparencia y el control interno.
Use la auditoría para investigar cambios inesperados o verificar procesos.
"""),

    ("34-ReporteEmpleadosTipo", """
Este reporte muestra los empleados agrupados por tipo de nómina.
Seleccione el tipo de nómina para filtrar: Administrativa, Quincenal o Semanal.
La tabla muestra los datos de cada empleado: código, nombre, departamento, puesto y salario.
Puede exportar el reporte a Excel para análisis adicional.
Este reporte es útil para verificar la distribución de empleados entre los diferentes tipos de nómina.
"""),

    ("35-ReporteDescCred", """
Este reporte muestra los descuentos y créditos aplicados en una nómina específica.
Seleccione la nómina que desea consultar.
El reporte agrupa los conceptos por tipo: ingresos y descuentos.
Para cada concepto puede ver el total y el detalle por empleado.
Puede exportar a Excel para verificar los datos con el departamento de contabilidad.
Es útil para conciliar los movimientos manuales agregados a cada nómina.
"""),

    ("36-ReporteIngresosDesc", """
El reporte de ingresos y descuentos agrupado ofrece una vista consolidada.
Muestra todos los conceptos aplicados en las nóminas, agrupados por tipo.
Puede ver los totales de cada concepto de ingreso y descuento.
Este reporte es ideal para el área de contabilidad y para reconciliaciones.
Puede filtrar por período y exportar los datos a Excel.
Use este reporte para obtener una visión general de los pagos y deducciones de la empresa.
"""),

    ("37-EstadoCuenta", """
El estado de cuenta muestra el historial de pagos completo de un empleado.
Busque y seleccione el empleado que desea consultar.
El reporte muestra cada nómina en la que ha participado el empleado.
Para cada nómina puede ver: el período, sueldo bruto, descuentos, ingresos adicionales y neto pagado.
Puede filtrar por rango de fechas para ver períodos específicos.
Exporte a Excel para entregar al empleado o al departamento de recursos humanos.
Este reporte es especialmente útil cuando un empleado solicita información sobre sus pagos.
"""),
]

async def generate_audio(name: str, text: str):
    """Genera archivo de audio usando Edge TTS."""
    output_path = os.path.join(OUTPUT_DIR, f"{name}.mp3")

    # Limpiar texto
    clean_text = " ".join(text.strip().split())

    communicate = edge_tts.Communicate(clean_text, VOICE, rate="+5%")
    await communicate.save(output_path)

    size = os.path.getsize(output_path)
    print(f"  {name}.mp3 - {size // 1024} KB")
    return output_path

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Generando {len(NARRATIONS)} archivos de audio con voz {VOICE}...")
    print("=" * 60)

    for name, text in NARRATIONS:
        await generate_audio(name, text)

    print("=" * 60)
    print(f"¡Completado! {len(NARRATIONS)} archivos de audio generados en {OUTPUT_DIR}/")

if __name__ == "__main__":
    asyncio.run(main())
