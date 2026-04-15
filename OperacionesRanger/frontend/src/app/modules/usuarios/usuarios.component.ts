import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';

/**
 * Componente principal del módulo de Usuarios
 * Renderiza la lista de usuarios
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, UsuariosListComponent],
  template: `<app-usuarios-list></app-usuarios-list>`,
  styles: []
})
export class UsuariosComponent {}
