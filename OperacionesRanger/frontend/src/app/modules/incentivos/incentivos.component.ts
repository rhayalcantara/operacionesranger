import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncentivosListComponent } from './incentivos-list/incentivos-list.component';

@Component({
  selector: 'app-incentivos',
  standalone: true,
  imports: [CommonModule, IncentivosListComponent],
  template: `<app-incentivos-list></app-incentivos-list>`,
  styles: []
})
export class IncentivosComponent {}
