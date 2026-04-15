import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { UsuariosListComponent } from './usuarios-list.component';
import { environment } from '../../../../environments/environment';

describe('UsuariosListComponent', () => {
  let component: UsuariosListComponent;
  let fixture: ComponentFixture<UsuariosListComponent>;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/usuarios`;

  const mockUsuariosResponse = {
    data: [
      {
        id: 1,
        username: 'admin',
        nombre_completo: 'Admin User',
        email: 'admin@test.com',
        rol: 'ADMIN',
        activo: true,
        ultimo_acceso: '2026-04-01T10:00:00Z'
      }
    ],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };

  beforeEach(async () => {
    // Mock localStorage for AuthService.getCurrentUser()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'current_user') {
        return JSON.stringify({ id_usuario: 99, username: 'testuser', rol: 'ADMIN' });
      }
      if (key === 'access_token') {
        return 'mock-token';
      }
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [UsuariosListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function initComponent() {
    fixture.detectChanges(); // triggers ngOnInit -> loadUsuarios
    const req = httpMock.expectOne(r => r.url === apiUrl);
    req.flush(mockUsuariosResponse);
    fixture.detectChanges();
  }

  it('should create', () => {
    initComponent();
    expect(component).toBeTruthy();
  });

  it('should load usuarios on init', () => {
    initComponent();
    expect(component.dataSource.length).toBe(1);
    expect(component.totalUsuarios).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should have correct displayed columns', () => {
    initComponent();
    expect(component.displayedColumns).toContain('username');
    expect(component.displayedColumns).toContain('nombre_completo');
    expect(component.displayedColumns).toContain('rol');
    expect(component.displayedColumns).toContain('acciones');
  });

  it('should reload on page change', () => {
    initComponent();
    component.onPageChange({ pageSize: 25, pageIndex: 1, length: 50, previousPageIndex: 0 });
    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.params.get('pageSize')).toBe('25');
    expect(req.request.params.get('page')).toBe('2');
    req.flush(mockUsuariosResponse);
  });

  it('should format ultimo acceso as "Nunca" when null', () => {
    initComponent();
    expect(component.formatUltimoAcceso(null)).toBe('Nunca');
  });

  it('should get correct rol CSS class', () => {
    initComponent();
    expect(component.getRolClass('ADMIN')).toBe('rol-admin');
    expect(component.getRolClass('SUPERVISOR')).toBe('rol-supervisor');
    expect(component.getRolClass('CONSULTA')).toBe('rol-consulta');
  });
});
