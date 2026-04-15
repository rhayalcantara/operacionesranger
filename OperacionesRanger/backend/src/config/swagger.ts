import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

/**
 * Configuración de Swagger/OpenAPI 3.0
 *
 * Esta configuración define los metadatos de la API, servidores, seguridad JWT,
 * y schemas reutilizables para toda la documentación.
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'OperacionesRanger - API de Gestión de Turnos',
    version: '1.0.0',
    description: `
      API REST para el Sistema de Gestión de Turnos de Guardianes de Seguridad - Guardianes Ranger.

      **Funcionalidades principales:**
      - Autenticación JWT con roles (ADMIN, SUPERVISOR, CONSULTA)
      - Gestión de usuarios del sistema
      - Administración de maestros (clientes, ubicaciones, puestos, feriados, configuración de turnos, incentivos)
      - Consulta de empleados/guardianes desde BD RRHH
      - Registro y consulta de turnos diarios
      - Generación de reportes CSV para nómina
      - Reportes de resumen por quincena, guardián, y puesto

      **Autenticación:**
      La mayoría de los endpoints requieren autenticación JWT Bearer.
      Use el endpoint /api/auth/login para obtener un token de acceso.
      Luego, incluya el token en el header Authorization: Bearer <token>

      **Roles de usuario:**
      - ADMIN: Acceso completo a todos los endpoints
      - SUPERVISOR: Gestión de turnos, reportes, y consulta de datos
      - CONSULTA: Solo lectura de datos
    `,
    contact: {
      name: 'Guardianes Ranger - Soporte Técnico',
      email: 'soporte@guardianesranger.com',
    },
    license: {
      name: 'Privado',
      url: 'https://guardianesranger.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.server.port}`,
      description: 'Servidor de Desarrollo',
    },
    {
      url: 'https://api.operacionesranger.com',
      description: 'Servidor de Producción',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Endpoints de autenticación y gestión de sesiones',
    },
    {
      name: 'Usuarios',
      description: 'Gestión de usuarios del sistema (solo ADMIN)',
    },
    {
      name: 'Clientes',
      description: 'Gestión de empresas clientes contratantes',
    },
    {
      name: 'Ubicaciones',
      description: 'Gestión de ubicaciones físicas donde se presta servicio',
    },
    {
      name: 'Puestos',
      description: 'Gestión de puestos/estaciones de seguridad',
    },
    {
      name: 'Feriados',
      description: 'Gestión de feriados nacionales y por decreto',
    },
    {
      name: 'Configuración Turnos',
      description: 'Configuración de horarios diurnos y nocturnos',
    },
    {
      name: 'Incentivos',
      description: 'Gestión de incentivos por puesto y quincena',
    },
    {
      name: 'RRHH',
      description: 'Consulta de empleados/guardianes desde BD RRHH (solo lectura)',
    },
    {
      name: 'Turnos',
      description: 'Registro y consulta de turnos de guardianes',
    },
    {
      name: 'Reportes',
      description: 'Generación de reportes CSV y resúmenes estadísticos',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido del endpoint /api/auth/login',
      },
    },
    schemas: {
      // ========================================
      // SCHEMAS DE AUTENTICACIÓN
      // ========================================
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            example: 'admin',
            description: 'Nombre de usuario',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Admin123!',
            description: 'Contraseña del usuario',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Token JWT de acceso (válido 15 minutos)',
          },
          refreshToken: {
            type: 'string',
            example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
            description: 'Token de refresco (válido 7 días)',
          },
          user: {
            $ref: '#/components/schemas/UserInfo',
          },
        },
      },
      UserInfo: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          username: {
            type: 'string',
            example: 'admin',
          },
          email: {
            type: 'string',
            example: 'admin@operacionesranger.com',
          },
          nombre_completo: {
            type: 'string',
            example: 'Administrador del Sistema',
          },
          rol: {
            type: 'string',
            enum: ['ADMIN', 'SUPERVISOR', 'CONSULTA'],
            example: 'ADMIN',
          },
          activo: {
            type: 'boolean',
            example: true,
          },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
          },
        },
      },
      RefreshTokenResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            format: 'password',
            example: 'OldPass123!',
          },
          newPassword: {
            type: 'string',
            format: 'password',
            example: 'NewPass456!',
            description: 'Mínimo 8 caracteres',
          },
        },
      },

      // ========================================
      // SCHEMAS DE USUARIOS
      // ========================================
      Usuario: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          username: {
            type: 'string',
            example: 'jperez',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'jperez@operacionesranger.com',
          },
          nombre_completo: {
            type: 'string',
            example: 'Juan Pérez',
          },
          rol: {
            type: 'string',
            enum: ['ADMIN', 'SUPERVISOR', 'CONSULTA'],
            example: 'SUPERVISOR',
          },
          activo: {
            type: 'boolean',
            example: true,
          },
          ultimo_acceso: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-19T10:30:00.000Z',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-01T00:00:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-15T14:20:00.000Z',
          },
        },
      },
      CreateUsuarioRequest: {
        type: 'object',
        required: ['username', 'password', 'email', 'nombre_completo', 'rol'],
        properties: {
          username: {
            type: 'string',
            example: 'jperez',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password123!',
            description: 'Mínimo 8 caracteres',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'jperez@operacionesranger.com',
          },
          nombre_completo: {
            type: 'string',
            example: 'Juan Pérez',
          },
          rol: {
            type: 'string',
            enum: ['ADMIN', 'SUPERVISOR', 'CONSULTA'],
            example: 'SUPERVISOR',
          },
        },
      },
      UpdateUsuarioRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'nuevo@operacionesranger.com',
          },
          nombre_completo: {
            type: 'string',
            example: 'Juan Pérez García',
          },
          rol: {
            type: 'string',
            enum: ['ADMIN', 'SUPERVISOR', 'CONSULTA'],
            example: 'ADMIN',
          },
          activo: {
            type: 'boolean',
            example: false,
          },
        },
      },

      // ========================================
      // SCHEMAS DE MAESTROS
      // ========================================
      Cliente: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          codigo: {
            type: 'string',
            example: 'CLI001',
            description: 'Código único del cliente',
          },
          nombre: {
            type: 'string',
            example: 'Banco Popular Dominicano',
          },
          ruc: {
            type: 'string',
            example: '101234567',
            description: 'RUC dominicano (9 dígitos)',
          },
          direccion: {
            type: 'string',
            example: 'Av. Winston Churchill, Torre Popular',
          },
          telefono: {
            type: 'string',
            example: '809-544-5000',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'contacto@bancopopular.com.do',
          },
          contacto_nombre: {
            type: 'string',
            example: 'María González',
          },
          activo: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Ubicacion: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          cliente_id: {
            type: 'integer',
            example: 1,
          },
          codigo: {
            type: 'string',
            example: 'UBI001',
            description: 'Código único de la ubicación',
          },
          nombre: {
            type: 'string',
            example: 'Sucursal Churchill',
          },
          direccion: {
            type: 'string',
            example: 'Av. Winston Churchill #1100',
          },
          provincia: {
            type: 'string',
            example: 'Distrito Nacional',
          },
          municipio: {
            type: 'string',
            example: 'Santo Domingo',
          },
          coordenadas_gps: {
            type: 'string',
            example: '18.4861,-69.9312',
            description: 'Formato: latitud,longitud',
          },
          activo: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Puesto: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          ubicacion_id: {
            type: 'integer',
            example: 1,
          },
          codigo: {
            type: 'string',
            example: 'P001',
            description: 'Código único del puesto dentro de la ubicación',
          },
          nombre: {
            type: 'string',
            example: 'Entrada Principal',
          },
          descripcion: {
            type: 'string',
            example: 'Puesto de vigilancia en entrada principal con control de acceso',
          },
          horario_esperado: {
            type: 'string',
            example: '24/7',
            description: 'Horario de cobertura esperado',
          },
          requiere_armado: {
            type: 'boolean',
            example: true,
            description: 'Si el puesto requiere guardián armado',
          },
          activo: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Feriado: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          fecha: {
            type: 'string',
            format: 'date',
            example: '2026-01-01',
            description: 'Fecha del feriado (YYYY-MM-DD)',
          },
          nombre: {
            type: 'string',
            example: 'Año Nuevo',
          },
          tipo: {
            type: 'string',
            enum: ['NACIONAL', 'DECRETO'],
            example: 'NACIONAL',
            description: 'NACIONAL: Feriado anual recurrente, DECRETO: Feriado especial por decreto',
          },
          recurrente: {
            type: 'boolean',
            example: true,
            description: 'Si el feriado se repite cada año',
          },
          activo: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ConfiguracionTurno: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          tipo: {
            type: 'string',
            enum: ['DIURNO', 'NOCTURNO'],
            example: 'DIURNO',
          },
          hora_inicio: {
            type: 'string',
            format: 'time',
            example: '06:00:00',
            description: 'Hora de inicio del turno (HH:MM:SS)',
          },
          hora_fin: {
            type: 'string',
            format: 'time',
            example: '18:00:00',
            description: 'Hora de fin del turno (HH:MM:SS)',
          },
          descripcion: {
            type: 'string',
            example: 'Turno diurno de 06:00 a 18:00',
          },
          activo: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Incentivo: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          puesto_id: {
            type: 'integer',
            example: 1,
          },
          quincena_inicio: {
            type: 'string',
            format: 'date',
            example: '2026-01-01',
          },
          quincena_fin: {
            type: 'string',
            format: 'date',
            example: '2026-01-15',
          },
          monto: {
            type: 'number',
            format: 'decimal',
            example: 5400.0,
            description: 'Monto total del incentivo para la quincena',
          },
          concepto: {
            type: 'string',
            example: 'Incentivo por puesto crítico',
          },
          valor_hora: {
            type: 'number',
            format: 'decimal',
            example: 15.0,
            description: 'Valor por hora (auto-calculado: monto / 360 horas)',
            readOnly: true,
          },
          activo: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      // ========================================
      // SCHEMAS DE RRHH
      // ========================================
      Guardian: {
        type: 'object',
        properties: {
          id_empleado: {
            type: 'integer',
            example: 1001,
            description: 'ID del empleado en BD RRHH',
          },
          cedula_empleado: {
            type: 'string',
            example: '001-1234567-8',
            description: 'Cédula dominicana formato XXX-XXXXXXX-X',
          },
          nombres: {
            type: 'string',
            example: 'Juan Carlos',
          },
          apellidos: {
            type: 'string',
            example: 'Pérez García',
          },
          nombre_completo: {
            type: 'string',
            example: 'Juan Carlos Pérez García',
            description: 'Nombre completo concatenado',
          },
          status: {
            type: 'integer',
            example: 1,
            description: '1 = Activo, 0 = Inactivo',
          },
          id_puesto: {
            type: 'integer',
            example: 97,
            description: 'ID del puesto (97 = VIGILANTE DE SEGURIDAD)',
          },
        },
      },

      // ========================================
      // SCHEMAS DE TURNOS
      // ========================================
      Turno: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          empleado_id: {
            type: 'integer',
            example: 1001,
            description: 'ID del guardián desde BD RRHH',
          },
          puesto_id: {
            type: 'integer',
            example: 1,
          },
          fecha: {
            type: 'string',
            format: 'date',
            example: '2026-01-15',
          },
          hora_entrada: {
            type: 'string',
            format: 'time',
            example: '06:00:00',
          },
          hora_salida: {
            type: 'string',
            format: 'time',
            example: '18:00:00',
          },
          horas_normales: {
            type: 'number',
            format: 'decimal',
            example: 10.0,
            description: 'Máximo 12 horas',
          },
          horas_extras: {
            type: 'number',
            format: 'decimal',
            example: 2.0,
            description: 'Máximo 4 horas',
          },
          tipo_turno: {
            type: 'string',
            enum: ['DIURNO', 'NOCTURNO'],
            example: 'DIURNO',
            description: 'Auto-calculado según hora_entrada',
            readOnly: true,
          },
          es_feriado: {
            type: 'boolean',
            example: false,
            description: 'Auto-detectado según tabla feriados',
            readOnly: true,
          },
          tipo_feriado: {
            type: 'string',
            enum: ['NACIONAL', 'DECRETO', null],
            example: null,
            description: 'Tipo de feriado si es_feriado = true',
            readOnly: true,
          },
          procesado_nomina: {
            type: 'boolean',
            example: false,
            description: 'Si el turno ya fue procesado en nómina (inmutable si true)',
          },
          nomina_id: {
            type: 'integer',
            example: null,
            description: 'ID de nómina si fue procesado',
          },
          observaciones: {
            type: 'string',
            example: 'Turno especial',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateTurnoRequest: {
        type: 'object',
        required: ['empleado_id', 'puesto_id', 'fecha', 'hora_entrada', 'hora_salida', 'horas_normales', 'horas_extras'],
        properties: {
          empleado_id: {
            type: 'integer',
            example: 1001,
          },
          puesto_id: {
            type: 'integer',
            example: 1,
          },
          fecha: {
            type: 'string',
            format: 'date',
            example: '2026-01-15',
          },
          hora_entrada: {
            type: 'string',
            format: 'time',
            example: '06:00:00',
          },
          hora_salida: {
            type: 'string',
            format: 'time',
            example: '18:00:00',
          },
          horas_normales: {
            type: 'number',
            format: 'decimal',
            example: 10.0,
            description: 'Máximo 12 horas',
          },
          horas_extras: {
            type: 'number',
            format: 'decimal',
            example: 2.0,
            description: 'Máximo 4 horas',
          },
          observaciones: {
            type: 'string',
            example: 'Turno especial',
          },
        },
      },
      ResumenTurnos: {
        type: 'object',
        properties: {
          empleado_id: {
            type: 'integer',
            example: 1001,
          },
          nombre_empleado: {
            type: 'string',
            example: 'Juan Carlos Pérez García',
          },
          total_turnos: {
            type: 'integer',
            example: 15,
          },
          total_horas_normales: {
            type: 'number',
            format: 'decimal',
            example: 150.0,
          },
          total_horas_extras: {
            type: 'number',
            format: 'decimal',
            example: 30.0,
          },
          turnos_diurnos: {
            type: 'integer',
            example: 10,
          },
          turnos_nocturnos: {
            type: 'integer',
            example: 5,
          },
          turnos_feriados: {
            type: 'integer',
            example: 2,
          },
        },
      },

      // ========================================
      // SCHEMAS DE REPORTES
      // ========================================
      GenerarReporteRequest: {
        type: 'object',
        required: ['fecha_inicio', 'fecha_fin'],
        properties: {
          fecha_inicio: {
            type: 'string',
            format: 'date',
            example: '2026-01-01',
          },
          fecha_fin: {
            type: 'string',
            format: 'date',
            example: '2026-01-15',
          },
        },
      },
      MarcarProcesadosRequest: {
        type: 'object',
        required: ['fecha_inicio', 'fecha_fin', 'nomina_id'],
        properties: {
          fecha_inicio: {
            type: 'string',
            format: 'date',
            example: '2026-01-01',
          },
          fecha_fin: {
            type: 'string',
            format: 'date',
            example: '2026-01-15',
          },
          nomina_id: {
            type: 'integer',
            example: 125,
            description: 'ID de la nómina en el sistema de RRHH',
          },
        },
      },
      MarcarProcesadosResponse: {
        type: 'object',
        properties: {
          turnos_procesados: {
            type: 'integer',
            example: 45,
          },
          nomina_id: {
            type: 'integer',
            example: 125,
          },
          fecha_inicio: {
            type: 'string',
            format: 'date',
            example: '2026-01-01',
          },
          fecha_fin: {
            type: 'string',
            format: 'date',
            example: '2026-01-15',
          },
        },
      },
      ResumenQuincena: {
        type: 'object',
        properties: {
          total_turnos: {
            type: 'integer',
            example: 450,
          },
          total_horas_normales: {
            type: 'number',
            format: 'decimal',
            example: 4500.0,
          },
          total_horas_extras: {
            type: 'number',
            format: 'decimal',
            example: 900.0,
          },
          total_guardianes: {
            type: 'integer',
            example: 30,
          },
          turnos_por_tipo: {
            type: 'object',
            properties: {
              DIURNO: {
                type: 'integer',
                example: 300,
              },
              NOCTURNO: {
                type: 'integer',
                example: 150,
              },
            },
          },
          turnos_feriados: {
            type: 'integer',
            example: 25,
          },
          total_incentivos: {
            type: 'number',
            format: 'decimal',
            example: 54000.0,
          },
        },
      },

      // ========================================
      // SCHEMAS COMUNES (Paginación, Errores)
      // ========================================
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
            },
            description: 'Array de elementos (tipo varía según endpoint)',
          },
          total: {
            type: 'integer',
            example: 150,
            description: 'Total de elementos en la base de datos',
          },
          page: {
            type: 'integer',
            example: 1,
            description: 'Página actual',
          },
          pageSize: {
            type: 'integer',
            example: 10,
            description: 'Elementos por página',
          },
          totalPages: {
            type: 'integer',
            example: 15,
            description: 'Total de páginas',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Descripción del error',
          },
          details: {
            type: 'object',
            description: 'Detalles adicionales del error (opcional)',
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Error de validación',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email',
                },
                message: {
                  type: 'string',
                  example: 'Email inválido',
                },
              },
            },
          },
        },
      },
      SuccessMessage: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Operación exitosa',
          },
        },
      },
    },
  },
};

/**
 * Opciones de swagger-jsdoc
 *
 * Define dónde buscar los comentarios JSDoc para la documentación.
 * Los comentarios deben estar en los archivos de rutas (*.routes.ts)
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts', // Para desarrollo con ts-node
    './dist/routes/*.js', // Para producción compilado
  ],
};

/**
 * Generar especificación Swagger
 */
export const swaggerSpec = swaggerJSDoc(swaggerOptions);
