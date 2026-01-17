REPORTE DE SITUACIÓN - Sistema de Cuotas

  🔴 PROBLEMA IDENTIFICADO

  Síntoma: Sistema muestra que se han cobrado 3 cuotas cuando solo existe 1 nómina.

  📊 CAUSA RAÍZ DETECTADA

  El problema está en el backend, específicamente en cómo se calcula el campo cuotas_aplicadas. Este campo se muestra en:
  - src/app/components/cuotas/cuotas.component.html:77 - Lista principal
  - src/app/components/cuotas/cuota-detalle-dialog.component.html:50 - Diálogo de detalle

  🔍 HALLAZGOS TÉCNICOS

  1. Estructura de Datos:
  Cuota (Registro principal)
  ├── cuotas_aplicadas: número     ← ESTE ES EL PROBLEMA
  ├── cantidad_cuotas: número total planificado
  └── CuotaDetalle[] (Detalles individuales)
      ├── estado: 'pendiente' | 'aplicado' | 'omitido' | 'cancelado'
      ├── id_nomina: a qué nómina se aplicó
      └── numero_cuota: 1, 2, 3, etc.

  2. Lógica Incorrecta Probable en Backend:

  El backend probablemente está contando TODAS las cuotas con estado = 'aplicado' sin importar a qué nómina pertenecen:

  -- LÓGICA INCORRECTA ACTUAL (probablemente):
  SELECT COUNT(*) as cuotas_aplicadas
  FROM cuota_detalle
  WHERE id_cuota = ?
  AND estado = 'aplicado'

  Esto significa que si una cuota se marcó como "aplicada" en pruebas anteriores, registros eliminados, o datos históricos, esas siguen contando.

  3. Lo que DEBERÍA hacer:

  Solo contar cuotas que están realmente aplicadas a nóminas existentes y válidas.

  📁 ARCHIVOS CLAVE A REVISAR EN BACKEND

  Endpoints que calculan cuotas_aplicadas:
  1. GET /api/cuotas/activas - Lista de cuotas activas
  2. GET /api/cuotas/{id} - Detalle de cuota específica
  3. El query/stored procedure que calcula este campo

  ✅ VERIFICACIÓN RECOMENDADA

  En la base de datos, ejecutar:

  -- Ver cuántas cuotas "aplicadas" existen para una cuota específica
  SELECT
      cd.id_cuota_detalle,
      cd.numero_cuota,
      cd.estado,
      cd.id_nomina,
      cd.fecha_aplicacion,
      n.descripcion as nomina_descripcion,
      n.estado as nomina_estado
  FROM cuota_detalle cd
  LEFT JOIN nomina n ON cd.id_nomina = n.id_nomina
  WHERE cd.id_cuota = [ID_DE_LA_CUOTA_PROBLEMA]
  ORDER BY cd.numero_cuota;

  Esto revelará:
  - ¿Hay 3 registros con estado = 'aplicado'?
  - ¿Están asociados a nóminas que ya no existen?
  - ¿Hay nóminas cerradas/eliminadas con cuotas aplicadas?

  🎯 SOLUCIÓN SUGERIDA (Para cuando se pueda modificar)

  Opción 1: Filtrar solo nóminas válidas
  SELECT COUNT(*) as cuotas_aplicadas
  FROM cuota_detalle cd
  INNER JOIN nomina n ON cd.id_nomina = n.id_nomina
  WHERE cd.id_cuota = ?
  AND cd.estado = 'aplicado'
  AND n.estado = 1  -- Solo nóminas activas/abiertas

  Opción 2: Incluir datos históricos pero mostrar correctamente
  Mantener el conteo total pero agregar campos adicionales:
  - cuotas_aplicadas_activas - Solo en nóminas abiertas
  - cuotas_aplicadas_historicas - En nóminas cerradas

  📋 PASOS INMEDIATOS RECOMENDADOS

  1. Revisar la base de datos con el query de verificación
  2. Identificar el archivo backend que calcula cuotas_aplicadas
  3. Verificar si hay datos huérfanos (cuotas aplicadas sin nómina válida)
  4. Decidir: ¿Limpiar datos incorrectos o ajustar el query?

⏺ ---
  RESUMEN: El problema está en el backend en el cálculo del campo cuotas_aplicadas. Necesitas revisar la base de datos y el código del servidor que
  calcula este valor. El frontend solo muestra lo que el backend le envía.