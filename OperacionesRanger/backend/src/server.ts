// Backend Server - OperacionesRanger
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

// IMPORTANTE: Importar y validar configuración ANTES de iniciar el servidor
// Si falta alguna variable crítica, el proceso terminará aquí con mensaje de error
import { env, printEnvSummary } from './config/env';

// Importar configuración de bases de datos
import { testConnections, closeConnections } from './config/database';

// Importar configuración de Swagger/OpenAPI
import { swaggerSpec } from './config/swagger';

// Importar rutas
import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import clientesRoutes from './routes/clientes.routes';
import ubicacionesRoutes from './routes/ubicaciones.routes';
import puestosRoutes from './routes/puestos.routes';
import feriadosRoutes from './routes/feriados.routes';
import configTurnosRoutes from './routes/config-turnos.routes';
import incentivosRoutes from './routes/incentivos.routes';
import rrhhRoutes from './routes/rrhh.routes';
import turnosRoutes from './routes/turnos.routes';
import reportesRoutes from './routes/reportes.routes';
import serviciosPuestoRoutes from './routes/servicios-puesto.routes';
import cronogramasRoutes from './routes/cronogramas.routes';
import plantillasServicioRoutes from './routes/plantillas-servicio.routes';
import diarioPuestoRoutes from './routes/diario-puesto.routes';
import reporteHorasRoutes from './routes/reporte-horas.routes';

// Importar error handler middleware (DEBE SER EL ÚLTIMO)
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';

// Crear aplicación Express
const app: Application = express();

// ===================================
// MIDDLEWARES
// ===================================

// CORS - Permitir peticiones desde el frontend
const corsOrigins = env.cors.origin.includes(',')
  ? env.cors.origin.split(',').map((o: string) => o.trim())
  : env.cors.origin;
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// Parser de JSON
app.use(express.json());

// Parser de URL encoded
app.use(express.urlencoded({ extended: true }));

// ===================================
// RUTAS
// ===================================

// Documentación de API con Swagger UI
// IMPORTANTE: Esta ruta debe estar ANTES de las demás rutas para que funcione correctamente
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'OperacionesRanger API - Documentación',
}));

// Ruta de salud (health check)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'OperacionesRanger API - Sistema de Gestión de Turnos',
    timestamp: new Date().toISOString(),
    environment: env.server.nodeEnv,
  });
});

// Ruta principal (API info)
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'OperacionesRanger API',
    version: '1.0.0',
    description: 'Sistema de Gestión de Turnos para Guardianes de Seguridad - Guardianes Ranger',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      clientes: '/api/clientes',
      ubicaciones: '/api/ubicaciones',
      puestos: '/api/puestos',
      feriados: '/api/feriados',
      configuracionTurnos: '/api/configuracion-turnos',
      incentivos: '/api/incentivos',
      rrhh: '/api/rrhh',
      turnos: '/api/turnos',
      reportes: '/api/reportes',
      serviciosPuesto: '/api/servicios-puesto',
      cronogramas: '/api/cronogramas',
      plantillasServicio: '/api/plantillas-servicio',
      diarioPuesto: '/api/diario-puesto',
      reporteHoras: '/api/reportes/horas',
    },
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de usuarios
app.use('/api/usuarios', usuariosRoutes);

// Rutas de clientes
app.use('/api/clientes', clientesRoutes);

// Rutas de ubicaciones
app.use('/api/ubicaciones', ubicacionesRoutes);

// Rutas de puestos
app.use('/api/puestos', puestosRoutes);

// Rutas de feriados
app.use('/api/feriados', feriadosRoutes);

// Rutas de configuración de turnos
app.use('/api/configuracion-turnos', configTurnosRoutes);

// Rutas de incentivos
app.use('/api/incentivos', incentivosRoutes);

// Rutas de RRHH (consulta de guardianes)
app.use('/api/rrhh', rrhhRoutes);

// Rutas de turnos
app.use('/api/turnos', turnosRoutes);

// Rutas de reportes
app.use('/api/reportes', reportesRoutes);

// Rutas de servicios por puesto
app.use('/api/servicios-puesto', serviciosPuestoRoutes);

// Rutas de cronogramas
app.use('/api/cronogramas', cronogramasRoutes);

// Rutas de plantillas de servicio
app.use('/api/plantillas-servicio', plantillasServicioRoutes);

// Rutas de diario de puesto
app.use('/api/diario-puesto', diarioPuestoRoutes);

// Rutas de reporte de horas trabajadas
app.use('/api/reportes/horas', reporteHorasRoutes);

// Ruta 404 - No encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada',
    path: req.path,
  });
});

// ===================================
// ERROR HANDLER MIDDLEWARE
// ===================================

// IMPORTANTE: Este middleware debe ser el ÚLTIMO
// Captura todos los errores no manejados de las rutas y middlewares anteriores
app.use(errorHandlerMiddleware);

// ===================================
// INICIAR SERVIDOR
// ===================================

/**
 * Función para inicializar el servidor y validar conexiones a BD
 */
async function startServer(): Promise<void> {
  try {
    // Primero validar conexiones a bases de datos
    console.info('');
    console.info('═══════════════════════════════════════════════════════════');
    console.info('  OperacionesRanger API - Backend');
    console.info('═══════════════════════════════════════════════════════════');
    console.info('');
    console.info('Inicializando servidor...');
    console.info('');

    // Validar conexiones a BD antes de arrancar servidor
    console.info('📡 Validando conexiones a bases de datos...');
    await testConnections();
    console.info('');

    // Si las conexiones son exitosas, iniciar servidor HTTP
    app.listen(env.server.port, () => {
      console.info('✓ Servidor iniciado exitosamente');
      console.info('');
      console.info(`  URL: http://localhost:${env.server.port}`);
      console.info(`  API Docs: http://localhost:${env.server.port}/api-docs`);
      console.info(`  Health check: http://localhost:${env.server.port}/health`);
      console.info(`  Entorno: ${env.server.nodeEnv}`);
      console.info(`  Timezone: ${env.timezone}`);
      console.info('');
      console.info('═══════════════════════════════════════════════════════════');

      // Imprimir resumen de configuración (útil para debugging)
      if (env.server.nodeEnv === 'development') {
        printEnvSummary();
      }
    });
  } catch (error) {
    console.error('');
    console.error('❌ ERROR: No se pudo iniciar el servidor');
    console.error('');

    if (error instanceof Error) {
      console.error(`Razón: ${error.message}`);
    }

    console.error('');
    console.error('Por favor, verifica la configuración de bases de datos en el archivo .env');
    console.error('');

    // Cerrar conexiones si existen
    await closeConnections();

    // Terminar proceso con código de error
    process.exit(1);
  }
}

// Ejecutar función de inicio solo si NO estamos en modo test
// En modo test, Supertest maneja el servidor directamente con la app Express
if (env.server.nodeEnv !== 'test') {
  startServer();
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason: Error | unknown) => {
  console.error('Unhandled Rejection:', reason);
  closeConnections()
    .catch(() => {
      // Ignorar errores al cerrar
    })
    .finally(() => {
      process.exit(1);
    });
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  closeConnections()
    .catch(() => {
      // Ignorar errores al cerrar
    })
    .finally(() => {
      process.exit(1);
    });
});

// Manejo de señal de terminación (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\n\n📛 Recibida señal de terminación (SIGINT)');
  console.log('Cerrando servidor gracefully...\n');

  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n📛 Recibida señal de terminación (SIGTERM)');
  console.log('Cerrando servidor gracefully...\n');

  await closeConnections();
  process.exit(0);
});

// Exportar app para testing
export default app;
