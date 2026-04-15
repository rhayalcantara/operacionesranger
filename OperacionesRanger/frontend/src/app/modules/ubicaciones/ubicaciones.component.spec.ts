import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { UbicacionesComponent } from './ubicaciones.component';
import { environment } from '../../../environments/environment';

describe('UbicacionesComponent', () => {
  let component: UbicacionesComponent;
  let fixture: ComponentFixture<UbicacionesComponent>;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/ubicaciones`;
  const clientesApiUrl = `${environment.apiBaseUrl}/clientes`;

  const mockUbicacionesResponse = {
    data: [
      {
        id: 1,
        codigo: 'UBI-001',
        nombre: 'Ubicacion Test',
        provincia: 'Santo Domingo',
        municipio: 'DN',
        direccion: 'Calle 1',
        activo: true,
        cliente: { id: 1, nombre: 'Cliente Test' }
      }
    ],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };

  const mockClientesResponse = {
    data: [{ id: 1, nombre: 'Cliente Test', activo: true }],
    total: 1,
    page: 1,
    pageSize: 1000,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UbicacionesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UbicacionesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function initComponent() {
    fixture.detectChanges(); // triggers ngOnInit -> cargarClientesParaFiltro + cargarUbicaciones
    // Flush both initial requests: clientes filter + ubicaciones
    const clientesReq = httpMock.expectOne(r => r.url === clientesApiUrl);
    clientesReq.flush(mockClientesResponse);
    const ubicacionesReq = httpMock.expectOne(r => r.url === apiUrl);
    ubicacionesReq.flush(mockUbicacionesResponse);
    fixture.detectChanges();
  }

  it('should create', () => {
    initComponent();
    expect(component).toBeTruthy();
  });

  it('should load ubicaciones on init', () => {
    initComponent();
    expect(component.dataSource.length).toBe(1);
    expect(component.totalUbicaciones).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should load clientes for filter dropdown', () => {
    initComponent();
    expect(component.clientesDisponibles.length).toBe(1);
    expect(component.clientesDisponibles[0].nombre).toBe('Cliente Test');
  });

  it('should have search and cliente filter controls', () => {
    initComponent();
    expect(component.searchControl).toBeTruthy();
    expect(component.clienteFilterControl).toBeTruthy();
    expect(component.clienteFilterControl.value).toBeNull();
  });

  it('should update pagination on page change', () => {
    initComponent();
    component.onPageChange({ pageSize: 25, pageIndex: 1, length: 50, previousPageIndex: 0 });
    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.params.get('pageSize')).toBe('25');
    expect(req.request.params.get('page')).toBe('2');
    req.flush(mockUbicacionesResponse);
  });

  it('should have correct displayed columns', () => {
    initComponent();
    expect(component.displayedColumns).toContain('nombre');
    expect(component.displayedColumns).toContain('cliente');
    expect(component.displayedColumns).toContain('acciones');
  });
});
