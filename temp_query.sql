-- Verificar cuotas del empleado 6280
USE db_aae4a2_ranger;

-- Ver todas las cuotas del empleado
SELECT
  c.id_cuota,
  c.descripcion,
  c.monto_total,
  c.cantidad_cuotas,
  c.cuotas_aplicadas,
  c.monto_por_cuota,
  c.fecha_inicio,
  c.estado,
  dc.descripcion as tipo_desc_cred,
  dc.quincena_aplicacion
FROM no_cuotas c
JOIN no_desc_cred dc ON c.id_desc_cred = dc.id_desc_cred
WHERE c.id_empleado = 6280
ORDER BY c.id_cuota;

-- Ver detalle de cuotas pendientes
SELECT
  cd.id_cuota_detalle,
  cd.id_cuota,
  cd.numero_cuota,
  cd.monto,
  cd.fecha_esperada_aplicacion,
  cd.estado,
  cd.omitir_en_nomina,
  c.descripcion as cuota_descripcion,
  dc.descripcion as tipo_desc_cred
FROM no_cuotas_detalle cd
JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
JOIN no_desc_cred dc ON c.id_desc_cred = dc.id_desc_cred
WHERE c.id_empleado = 6280
  AND cd.estado = 'pendiente'
ORDER BY cd.fecha_esperada_aplicacion;

-- Ver nóminas abiertas que incluyen este empleado
SELECT
  n.id_nominas,
  n.titulo_nomina,
  n.fecha_inicio,
  n.fecha_fin,
  n.quincena,
  n.status
FROM no_nominas n
JOIN no_det_nomina dn ON n.id_nominas = dn.id_nomina
WHERE dn.id_empleado = 6280
  AND n.status = 'abierto'
ORDER BY n.fecha_inicio DESC;
