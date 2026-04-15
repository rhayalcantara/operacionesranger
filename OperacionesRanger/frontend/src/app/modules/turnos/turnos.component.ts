import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { TurnoFormComponent } from './turno-form/turno-form.component';
import { TurnosListComponent } from './turnos-list/turnos-list';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TurnosListComponent
  ],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.scss']
})
export class TurnosComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if we should open the form automatically (from /turnos/nuevo route)
    const openForm = this.route.snapshot.data['openForm'];
    if (openForm) {
      this.abrirFormularioCrear();
    }
  }

  /**
   * Open form dialog to create new shift
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(TurnoFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Turno created:', result);
        // Refresh list here when implemented (T3.13)
      }

      // Navigate back to /turnos if we came from /turnos/nuevo
      if (this.router.url.includes('/nuevo')) {
        this.router.navigate(['/turnos']);
      }
    });
  }
}
