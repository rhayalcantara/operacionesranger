import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { HeaderComponent } from './header/header.component';
import { NavmenuComponent } from './navmenu/navmenu.component';

/**
 * LayoutComponent - Componente principal de layout con sidebar responsivo
 *
 * Características:
 * - Sidebar colapsable usando mat-sidenav
 * - Responsive: modo 'side' en desktop, modo 'over' en mobile
 * - Integración con HeaderComponent y NavMenuComponent
 * - Breakpoints: >1024px (desktop), 768-1024px (tablet), <768px (mobile)
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    HeaderComponent,
    NavmenuComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  @ViewChild('drawer') drawer!: MatSidenav;

  private breakpointObserver = inject(BreakpointObserver);

  /**
   * Observable que indica si estamos en handset (mobile/tablet)
   * Usado para determinar el modo del sidenav
   */
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset, Breakpoints.Tablet])
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  /**
   * Observable que indica si estamos en mobile (< 768px)
   * Usado para modo 'over' del sidenav
   */
  isMobile$: Observable<boolean> = this.breakpointObserver
    .observe('(max-width: 767px)')
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  /**
   * Observable que indica si estamos en tablet (768px - 1024px)
   */
  isTablet$: Observable<boolean> = this.breakpointObserver
    .observe('(min-width: 768px) and (max-width: 1024px)')
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  /**
   * Observable que indica si estamos en desktop (> 1024px)
   */
  isDesktop$: Observable<boolean> = this.breakpointObserver
    .observe('(min-width: 1025px)')
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  /**
   * Toggle del sidebar
   * Llamado desde HeaderComponent cuando el usuario hace click en el botón de menú
   */
  toggleSidebar(): void {
    this.drawer.toggle();
  }

  /**
   * Cierra el sidebar en mobile después de navegar
   * Llamado desde NavMenuComponent cuando se selecciona un item de menú
   */
  closeSidebarOnMobile(): void {
    this.isMobile$.subscribe(isMobile => {
      if (isMobile && this.drawer) {
        this.drawer.close();
      }
    });
  }
}
