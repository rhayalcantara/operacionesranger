import { Component } from '@angular/core';
import { FeriadosListComponent } from './feriados-list/feriados-list.component';

/**
 * Componente principal del módulo de Feriados
 * Renderiza el componente de lista de feriados
 */
@Component({
  selector: 'app-feriados',
  standalone: true,
  imports: [FeriadosListComponent],
  template: `<app-feriados-list></app-feriados-list>`,
  styles: []
})
export class FeriadosComponent {}
