import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../environments/environment';
import { ServiciosPuestoComponent } from './servicios-puesto.component';

const apiBase = environment.apiBaseUrl;

describe('ServiciosPuestoComponent', () => {
  let component: ServiciosPuestoComponent;
  let fixture: ComponentFixture<ServiciosPuestoComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosPuestoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServiciosPuestoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    // Flush any pending requests from construction without detectChanges
    httpMock.match(() => true);
  });

  it('should load clientes and servicios on init', () => {
    fixture.detectChanges(); // triggers ngOnInit

    const clientesReq = httpMock.expectOne(
      (req) => req.url.includes('/clientes') && req.params.get('activo') === 'true'
    );
    expect(clientesReq.request.method).toBe('GET');
    clientesReq.flush({ data: [{ id: 1, nombre: 'Cliente A' }], total: 1 });

    const serviciosReq = httpMock.expectOne(
      (req) => req.url.includes('/servicios-puesto') && req.params.get('page') === '1'
    );
    expect(serviciosReq.request.method).toBe('GET');
    serviciosReq.flush({
      data: [
        { id: 1, puesto_nombre: 'Puesto 1', tipo_turno: 'DIURNO', domingo: 0, lunes: 1, martes: 1, miercoles: 1, jueves: 1, viernes: 1, sabado: 0, cobrada: 100 }
      ],
      total: 1
    });

    fixture.detectChanges();

    expect(component.clientesDisponibles.length).toBe(1);
    expect(component.dataSource.length).toBe(1);
    expect(component.totalServicios).toBe(1);
  });

  it('should have correct displayedColumns', () => {
    httpMock.match(() => true);

    expect(component.displayedColumns).toEqual([
      'puesto',
      'tipo_turno',
      'domingo',
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
      'cobrada',
      'acciones'
    ]);
  });

  it('should start with isLoading as false', () => {
    httpMock.match(() => true);
    expect(component.isLoading()).toBe(false);
  });

  it('should have default pagination values', () => {
    httpMock.match(() => true);
    expect(component.pageSize).toBe(10);
    expect(component.pageIndex).toBe(0);
    expect(component.totalServicios).toBe(0);
  });

  it('should have empty cascading filter arrays initially', () => {
    httpMock.match(() => true);
    expect(component.ubicacionesDisponibles).toEqual([]);
    expect(component.puestosDisponibles).toEqual([]);
  });
});
