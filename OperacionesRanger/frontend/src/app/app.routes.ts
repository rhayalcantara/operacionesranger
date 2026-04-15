import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component')
      .then(m => m.UnauthorizedComponent)
  },

  // Protected routes (with authentication)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./modules/clientes/clientes.component')
          .then(m => m.ClientesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'ubicaciones',
        loadComponent: () => import('./modules/ubicaciones/ubicaciones.component')
          .then(m => m.UbicacionesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'puestos',
        loadComponent: () => import('./modules/puestos/puestos.component')
          .then(m => m.PuestosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'feriados',
        loadComponent: () => import('./modules/feriados/feriados.component')
          .then(m => m.FeriadosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'turnos/nuevo',
        loadComponent: () => import('./modules/turnos/turnos.component')
          .then(m => m.TurnosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'], openForm: true }
      },
      {
        path: 'turnos/resumen',
        loadComponent: () => import('./modules/turnos/resumen-guardian/resumen-guardian.component')
          .then(m => m.ResumenGuardianComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'] }
      },
      {
        path: 'turnos',
        loadComponent: () => import('./modules/turnos/turnos.component')
          .then(m => m.TurnosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'] }
      },
      {
        path: 'incentivos',
        loadComponent: () => import('./modules/incentivos/incentivos.component')
          .then(m => m.IncentivosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'servicios-puesto',
        loadComponent: () => import('./modules/servicios-puesto/servicios-puesto.component')
          .then(m => m.ServiciosPuestoComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'plantillas-servicio',
        loadComponent: () => import('./modules/plantillas-servicio/plantillas-servicio.component')
          .then(m => m.PlantillasServicioComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'diario-puesto',
        loadComponent: () => import('./modules/diario-puesto/diario-puesto.component')
          .then(m => m.DiarioPuestoComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'cronogramas',
        loadComponent: () => import('./modules/cronogramas/cronogramas.component')
          .then(m => m.CronogramasComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'configuracion-turnos',
        loadComponent: () => import('./modules/configuracion-turnos/configuracion-turnos.component')
          .then(m => m.ConfiguracionTurnosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./modules/reportes/reportes.component')
          .then(m => m.ReportesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'reportes/nomina',
        loadComponent: () => import('./modules/reportes/reporte-nomina/reporte-nomina.component')
          .then(m => m.ReporteNominaComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'reportes/horas',
        loadComponent: () => import('./modules/reportes/reporte-horas/reporte-horas.component')
          .then(m => m.ReporteHorasComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'reportes/historial',
        loadComponent: () => import('./modules/reportes/historial-reportes/historial-reportes.component')
          .then(m => m.HistorialReportesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'] }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./modules/usuarios/usuarios.component')
          .then(m => m.UsuariosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'cambiar-password',
        loadComponent: () => import('./modules/auth/cambio-password/cambio-password.component')
          .then(m => m.CambioPasswordComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Wildcard redirect
  {
    path: '**',
    redirectTo: ''
  }
];
