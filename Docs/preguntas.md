  Alcance que propongo:                                                              
                                                                 
  1. Tabla no_captura_estado — sesiones de captura con:                              
    - id_captura, id_tipo_nomina, fecha_desde, fecha_hasta, quincena                 
    - estado: 'abierta' → 'cerrada' → 'aplicada'                                     
    - usuario_creacion, usuario_cierre, timestamps                            ** aprobado      
  2. Items pre-capturados — dos opciones:                                            
    - A — extender no_desc_cred_nomina permitiendo id_nomina NULL + agregar
  id_captura FK ** aprobado
    - B — nueva tabla no_desc_cred_captura paralela
    

  Recomiendo A (menos duplicación, misma lógica de aplicación).
  3. Pantalla de captura — Agustina selecciona tipo_nomina + periodo, abre captura,
  carga ingresos/descuentos/horas extra por empleado, marca "cerrada". 
  ** aprobado
  4. Notificación al cierre — ¿dónde notificar? Opciones:
    - Badge en dashboard del admin al abrir la app ** aprobado
    - Entrada en no_auditoria (simple, ya existe) ** aprobado
    - Email (requiere config SMTP)

  Recomiendo badge dashboard + auditoría (sin config extra).
  5. Aplicación automática — al crear nómina, si existe captura cerrada con matching
  id_tipo_nomina + rango de fechas, los items se copian a no_desc_cred_nomina y la
  captura pasa a aplicada.

  Preguntas clave antes de empezar:
  - ¿Opción A o B para items? (recomiendo A ** aprobado)
  - ¿Notificación vía dashboard + auditoría ** aprobado, o quieres otro canal?
  - ¿Una captura por tipo_nomina+periodo (única ** aprobado) o múltiples?
  - ¿Puede Agustina reabrir una captura cerrada? si ¿Y una ya aplicada? no

  ¿Confirmas estas decisiones o ajustas algo antes de que empiece?