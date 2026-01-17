-- Verificar cuotas_detalle pendientes del empleado 6280 para la nómina 13
-- Nómina 13: fecha_inicio='2025-11-01', fecha_fin='2025-11-15', quincena=1
SELECT
  cd.id_cuota_detalle,
  cd.id_cuota,
  cd.numero_cuota,
  cd.monto,
  cd.fecha_esperada_aplicacion,
  cd.estado,
  cd.omitir_en_nomina,
  c.id_empleado,
  c.id_desc_cred,
  c.descripcion as cuota_descripcion,
  c.cantidad_cuotas,
  tdc.descripcion as tipo_descripcion,
  tdc.quincena_aplicacion
FROM no_cuotas_detalle cd
JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
JOIN no_desc_cred tdc ON c.id_desc_cred = tdc.id_desc_cred
WHERE c.id_empleado = 6280
  AND c.estado = 'activo'
  AND cd.estado = 'pendiente'
  AND cd.omitir_en_nomina = 0
  AND cd.fecha_esperada_aplicacion BETWEEN '2025-11-01' AND '2025-11-15'
  AND (tdc.quincena_aplicacion = 0 OR tdc.quincena_aplicacion = 1)
ORDER BY cd.fecha_esperada_aplicacion ASC, cd.numero_cuota ASC;
