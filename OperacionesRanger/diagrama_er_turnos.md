```mermaid
erDiagram
    CLIENTES ||--o{ UBICACIONES : "tiene"
    UBICACIONES ||--o{ PUESTOS : "contiene"
    PUESTOS ||--o{ INCENTIVOS_PUESTO : "puede tener"
    PUESTOS ||--o{ TURNOS : "se registran en"
    FERIADOS ||--o| TURNOS : "puede aplicar a"
    CONFIGURACION_TURNOS ||..|| TURNOS : "define tipo"
    EMPLEADOS_RRHH ||--o{ TURNOS : "trabaja"

    CLIENTES {
        int id PK
        varchar codigo UK
        varchar nombre
        varchar rnc
        varchar telefono
        varchar email
        text direccion
        varchar contacto_nombre
        varchar contacto_telefono
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    UBICACIONES {
        int id PK
        int cliente_id FK
        varchar codigo
        varchar nombre
        text direccion
        varchar provincia
        varchar municipio
        varchar sector
        decimal latitud
        decimal longitud
        varchar telefono
        varchar contacto_nombre
        varchar contacto_telefono
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    PUESTOS {
        int id PK
        int ubicacion_id FK
        varchar codigo
        varchar nombre
        text descripcion
        int cantidad_guardianes
        boolean requiere_turno_diurno
        boolean requiere_turno_nocturno
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    FERIADOS {
        int id PK
        date fecha UK
        varchar nombre
        enum tipo "NACIONAL|DECRETO"
        text descripcion
        timestamp created_at
    }

    INCENTIVOS_PUESTO {
        int id PK
        int puesto_id FK
        smallint anio
        tinyint quincena
        decimal monto
        decimal valor_hora "GENERATED"
        date fecha_inicio
        date fecha_fin
        text observaciones
        timestamp created_at
        timestamp updated_at
    }

    CONFIGURACION_TURNOS {
        int id PK
        enum tipo_turno "DIURNO|NOCTURNO"
        time hora_inicio
        time hora_fin
        varchar descripcion
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    TURNOS {
        bigint id PK
        int empleado_id FK "Ref RRHH"
        int puesto_id FK
        date fecha
        time hora_entrada
        time hora_salida
        decimal horas_normales
        decimal horas_extras
        enum tipo_turno "DIURNO|NOCTURNO"
        boolean es_feriado
        int feriado_id FK
        int nomina_id "Asignado por Nomina"
        boolean procesado_nomina
        datetime fecha_procesado
        text observaciones
        int created_by
        timestamp created_at
        timestamp updated_at
    }

    EMPLEADOS_RRHH {
        int id PK
        varchar codigo
        varchar nombre
        varchar cedula
        varchar cargo
        text otros_campos "Por investigar"
    }
```

## Flujo del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE OPERACIÓN                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. CONFIGURACIÓN INICIAL
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │   Clientes   │───►│  Ubicaciones │───►│   Puestos    │
   └──────────────┘    └──────────────┘    └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  Incentivos  │
                                          │ (Quincena)   │
                                          └──────────────┘

2. CONFIGURACIÓN DE TURNOS
   ┌───────────────────────────────────────────────────────┐
   │  DIURNO:   06:00 AM ─────────────► 06:00 PM          │
   │  NOCTURNO: 06:00 PM ─────────────► 06:00 AM          │
   └───────────────────────────────────────────────────────┘

3. REGISTRO DIARIO DE TURNOS
   ┌──────────────┐
   │  Guardián    │
   │  (Empleado)  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────────────────────────────┐
   │                    REGISTRO DE TURNO                      │
   ├──────────────────────────────────────────────────────────┤
   │  • Fecha                                                  │
   │  • Hora entrada / salida                                  │
   │  • Puesto asignado                                        │
   │  • Horas: Normales (10) + Extras (2)                     │
   │  • Auto-detecta: Tipo turno (D/N) + Feriado              │
   └──────────────────────────────────────────────────────────┘

4. GENERACIÓN DE REPORTE (Quincenal)
   ┌──────────────────────────────────────────────────────────┐
   │                    REPORTE CSV                            │
   ├──────────────────────────────────────────────────────────┤
   │  fecha | empleado_id | puesto | hrs_norm | hrs_ext |     │
   │  tipo_turno | es_feriado | tipo_feriado | incentivo      │
   └──────────────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │   SISTEMA    │
   │   NÓMINA     │
   └──────────────┘


## Cálculo de Incentivos

┌─────────────────────────────────────────────────────────────────────────────┐
│  EJEMPLO: Incentivo de RD$3,600 para un puesto en una quincena             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Valor por hora = RD$3,600 ÷ 360 horas = RD$10.00/hora                     │
│                   (15 días × 24 horas = 360 horas)                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Guardián A: Trabajó 120 horas → 120 × RD$10 = RD$1,200            │   │
│  │  Guardián B: Trabajó 180 horas → 180 × RD$10 = RD$1,800            │   │
│  │  Guardián C: Trabajó  60 horas →  60 × RD$10 = RD$600              │   │
│  │  ─────────────────────────────────────────────────────             │   │
│  │  TOTAL:      360 horas                        RD$3,600             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Si un solo guardián trabaja las 360 horas, recibe TODO el incentivo       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


## Campos del Reporte CSV para Nómina

| Campo | Tipo | Descripción |
|-------|------|-------------|
| fecha | DATE | Fecha del turno trabajado |
| empleado_id | INT | ID del empleado (referencia a RRHH) |
| puesto_codigo | VARCHAR | Código del puesto |
| horas_normales | DECIMAL | Horas normales trabajadas (máx 10) |
| horas_extras | DECIMAL | Horas extras trabajadas (máx 2) |
| tipo_turno | ENUM | DIURNO o NOCTURNO |
| es_feriado | VARCHAR | SI / NO |
| tipo_feriado | VARCHAR | NACIONAL / DECRETO / N/A |
| incentivo | DECIMAL | Monto de incentivo calculado |
```
