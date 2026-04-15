import { Component, EventEmitter, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { filter } from 'rxjs/operators';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

import { AuthService } from '../../core/services/auth.service';

/**
 * Interface para definir estructura de items de menú
 */
export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  expanded?: boolean;
  children?: MenuItem[];
}

/**
 * NavMenuComponent - Menú de navegación jerárquico con control por roles
 *
 * Características:
 * - Menú jerárquico con items principales y submenús
 * - Filtrado de items por rol del usuario
 * - Highlight de ruta activa
 * - Submenu expandible/colapsable
 * - Iconos Material Icons
 */
@Component({
  selector: 'app-navmenu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatRippleModule
  ],
  templateUrl: './navmenu.component.html',
  styleUrls: ['./navmenu.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('collapsed <=> expanded', animate('200ms ease-in-out')),
    ]),
  ],
})
export class NavmenuComponent implements OnInit {
  @Output() itemSelected = new EventEmitter<void>();

  /**
   * Ruta activa actual
   */
  currentRoute = '';

  /**
   * Definición completa del menú de navegación
   */
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA']
    },
    {
      label: 'Mantenimientos',
      icon: 'settings',
      expanded: false,
      roles: ['ADMIN', 'SUPERVISOR'],
      children: [
        {
          label: 'Clientes',
          route: '/clientes',
          icon: 'business',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Ubicaciones',
          route: '/ubicaciones',
          icon: 'location_on',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Puestos',
          route: '/puestos',
          icon: 'work',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Feriados',
          route: '/feriados',
          icon: 'event',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Incentivos',
          route: '/incentivos',
          icon: 'attach_money',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Configuración Turnos',
          route: '/configuracion-turnos',
          icon: 'schedule',
          roles: ['ADMIN']
        }
      ]
    },
    {
      label: 'Turnos',
      icon: 'assignment',
      expanded: false,
      roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'],
      children: [
        {
          label: 'Registrar Turno',
          route: '/turnos/nuevo',
          icon: 'add_circle',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Lista de Turnos',
          route: '/turnos',
          icon: 'list',
          roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA']
        },
        {
          label: 'Resumen',
          route: '/turnos/resumen',
          icon: 'assessment',
          roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA']
        }
      ]
    },
    {
      label: 'Operaciones',
      icon: 'engineering',
      expanded: false,
      roles: ['ADMIN', 'SUPERVISOR'],
      children: [
        {
          label: 'Servicios por Puesto',
          route: '/servicios-puesto',
          icon: 'assignment_ind',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Plantillas de Servicio',
          route: '/plantillas-servicio',
          icon: 'content_copy',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Diario de Puesto',
          route: '/diario-puesto',
          icon: 'today',
          roles: ['ADMIN', 'SUPERVISOR']
        }
      ]
    },
    {
      label: 'Reportes',
      icon: 'description',
      expanded: false,
      roles: ['ADMIN', 'SUPERVISOR'],
      children: [
        {
          label: 'Reporte Nomina CSV',
          route: '/reportes/nomina',
          icon: 'description',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Horas Trabajadas',
          route: '/reportes/horas',
          icon: 'schedule',
          roles: ['ADMIN', 'SUPERVISOR']
        },
        {
          label: 'Historial Reportes',
          route: '/reportes/historial',
          icon: 'history',
          roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA']
        }
      ]
    },
    {
      label: 'Usuarios',
      icon: 'people',
      route: '/usuarios',
      roles: ['ADMIN']
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Escuchar cambios de ruta para actualizar highlight
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });

    // Establecer ruta inicial
    this.currentRoute = this.router.url;
  }

  /**
   * Verifica si el usuario tiene permiso para ver un item del menú
   */
  canViewItem(item: MenuItem): boolean {
    return this.authService.hasRole(...item.roles as any);
  }

  /**
   * Filtra los items del menú según el rol del usuario
   */
  private _visibleMenuItems: MenuItem[] = [];
  private _menuItemsComputed = false;

  get visibleMenuItems(): MenuItem[] {
    if (!this._menuItemsComputed) {
      this._visibleMenuItems = this.menuItems.filter(item => this.canViewItem(item)).map(item => {
        if (item.children) {
          return {
            ...item,
            expanded: true, // Start expanded
            children: item.children.filter(child => this.canViewItem(child))
          };
        }
        return item;
      });
      this._menuItemsComputed = true;
    }
    return this._visibleMenuItems;
  }

  /**
   * Toggle de expansión de submenu
   */
  toggleSubmenu(item: MenuItem): void {
    item.expanded = !item.expanded;
    this.cdr.detectChanges();
  }

  /**
   * Navega a una ruta y emite evento de selección
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.itemSelected.emit();
  }

  /**
   * Verifica si una ruta está activa
   */
  isRouteActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  /**
   * Verifica si algún hijo de un item tiene la ruta activa
   */
  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) {
      return false;
    }
    return item.children.some(child => child.route && this.isRouteActive(child.route));
  }
}
