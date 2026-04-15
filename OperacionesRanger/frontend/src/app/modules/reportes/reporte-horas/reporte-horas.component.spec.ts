import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../../environments/environment';
import { ReporteHorasComponent } from './reporte-horas.component';

const apiBase = environment.apiBaseUrl;

describe('ReporteHorasComponent', () => {
  let component: ReporteHorasComponent;
  let fixture: ComponentFixture<ReporteHorasComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteHorasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteHorasComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    // ngOnInit calls cargarPuestos which makes one HTTP request
    const puestosReq = httpMock.match((r) => r.url.includes('/puestos'));
    puestosReq.forEach((r) => r.flush({ data: [], total: 0 }));

    expect(component).toBeTruthy();
  });

  it('should initialize formulario with default values', () => {
    fixture.detectChanges();
    httpMock.match(() => true).forEach((r) => r.flush({ data: [], total: 0 }));

    expect(component.formulario).toBeTruthy();
    expect(component.formulario.get('tipo')?.value).toBe('empleado');
    expect(component.formulario.get('fechaInicio')?.value).toBe('');
    expect(component.formulario.get('fechaFin')?.value).toBe('');
    expect(component.formulario.get('puesto_id')?.value).toBeNull();
  });

  it('should have isLoading as false (not a signal)', () => {
    fixture.detectChanges();
    httpMock.match(() => true).forEach((r) => r.flush({ data: [], total: 0 }));

    expect(component.isLoading).toBe(false);
  });

  it('should return false for puedeGenerar when form is invalid', () => {
    fixture.detectChanges();
    httpMock.match(() => true).forEach((r) => r.flush({ data: [], total: 0 }));

    // Form is invalid because fechaInicio and fechaFin are required but empty
    expect(component.puedeGenerar).toBe(false);
  });

  it('should default tipo to empleado', () => {
    fixture.detectChanges();
    httpMock.match(() => true).forEach((r) => r.flush({ data: [], total: 0 }));

    expect(component.tipoActual).toBe('empleado');
  });

  it('should have no report data initially', () => {
    fixture.detectChanges();
    httpMock.match(() => true).forEach((r) => r.flush({ data: [], total: 0 }));

    expect(component.reporteData).toBeNull();
    expect(component.showResults).toBe(false);
  });
});
