import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ClientesComponent } from './clientes.component';
import { environment } from '../../../environments/environment';

describe('ClientesComponent', () => {
  let component: ClientesComponent;
  let fixture: ComponentFixture<ClientesComponent>;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/clientes`;

  const mockResponse = {
    data: [
      { id: 1, codigo: 'CLI-001', nombre: 'Test Client', ruc: '123456789', activo: true }
    ],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function initComponent() {
    fixture.detectChanges(); // triggers ngOnInit -> cargarClientes
    const req = httpMock.expectOne(r => r.url === apiUrl);
    req.flush(mockResponse);
    fixture.detectChanges();
  }

  it('should create', () => {
    initComponent();
    expect(component).toBeTruthy();
  });

  it('should load clientes on init', () => {
    initComponent();
    expect(component.dataSource.length).toBe(1);
    expect(component.totalClientes).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should have search and filter controls', () => {
    initComponent();
    expect(component.searchControl).toBeTruthy();
    expect(component.soloActivosControl.value).toBe(true);
  });

  it('should update pageSize on page change', () => {
    initComponent();
    component.onPageChange({ pageSize: 25, pageIndex: 2, length: 100, previousPageIndex: 1 });
    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.params.get('pageSize')).toBe('25');
    expect(req.request.params.get('page')).toBe('3');
    req.flush(mockResponse);
  });

  it('should send activo=true param when soloActivosControl is true', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.params.get('activo')).toBe('true');
    req.flush(mockResponse);
  });

  it('should have correct displayed columns', () => {
    initComponent();
    expect(component.displayedColumns).toContain('codigo');
    expect(component.displayedColumns).toContain('nombre');
    expect(component.displayedColumns).toContain('acciones');
  });
});
