// Polyfill URL for jsdom (MatDatepicker uses it internally)
if (typeof globalThis.URL === 'undefined') {
  (globalThis as any).URL = class URL {
    constructor(public href: string) {}
    toString() { return this.href; }
  };
}

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../environments/environment';
import { DiarioPuestoComponent } from './diario-puesto.component';

const apiBase = environment.apiBaseUrl;

describe('DiarioPuestoComponent', () => {
  let component: DiarioPuestoComponent;
  let fixture: ComponentFixture<DiarioPuestoComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiarioPuestoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DiarioPuestoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    // ngOnInit only subscribes to fechaControl changes, no HTTP call fires
    expect(component).toBeTruthy();
  });

  it('should not make HTTP calls on init (waits for fecha selection)', () => {
    fixture.detectChanges();
    // No requests expected since fechaControl is null
    httpMock.expectNone(() => true);
    expect(component.dataSource).toEqual([]);
    expect(component.totalRegistros).toBe(0);
  });

  it('should have correct displayedColumns', () => {
    expect(component.displayedColumns).toEqual([
      'puesto',
      'empleado',
      'horas',
      'tipo_turno',
      'origen',
      'acciones'
    ]);
  });

  it('should start with isLoading as false', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should have fechaControl initialized to null', () => {
    expect(component.fechaControl.value).toBeNull();
    expect(component.fechaSeleccionada).toBe(false);
  });

  it('should load registros when fecha is set', () => {
    fixture.detectChanges(); // subscribe to fechaControl changes

    const testDate = new Date(2026, 3, 6); // April 6, 2026
    component.fechaControl.setValue(testDate);

    const req = httpMock.expectOne(
      (r) => r.url.includes('/diario-puesto') && r.params.get('fecha') === '2026-04-06'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        { id: 1, puesto_nombre: 'Puesto A', empleado_nombre: 'Juan Perez', horas: 8, tipo_turno: 'DIURNO', origen: 'MANUAL' }
      ],
      total: 1
    });

    fixture.detectChanges();

    expect(component.dataSource.length).toBe(1);
    expect(component.totalRegistros).toBe(1);
  });
});
