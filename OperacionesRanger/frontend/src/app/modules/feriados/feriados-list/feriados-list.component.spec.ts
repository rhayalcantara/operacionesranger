import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FeriadosListComponent } from './feriados-list.component';
import { environment } from '../../../../environments/environment';

describe('FeriadosListComponent', () => {
  let component: FeriadosListComponent;
  let fixture: ComponentFixture<FeriadosListComponent>;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/feriados`;

  const mockFeriadosResponse = {
    data: [
      { id: 1, fecha: '2026-01-01', nombre: 'Ano Nuevo', tipo: 'NACIONAL', descripcion: 'Dia feriado nacional' }
    ],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeriadosListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeriadosListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function initComponent() {
    fixture.detectChanges(); // triggers ngOnInit -> loadFeriados + loadFeriadosParaCalendario
    // loadFeriados: paginated request
    // loadFeriadosParaCalendario: getAll with pageSize=1000
    // Both hit the same apiUrl, flush both
    const reqs = httpMock.match(r => r.url === apiUrl);
    reqs.forEach(req => req.flush(mockFeriadosResponse));
    fixture.detectChanges();
  }

  it('should create', () => {
    initComponent();
    expect(component).toBeTruthy();
  });

  it('should load feriados on init', () => {
    initComponent();
    expect(component.dataSource.length).toBe(1);
    expect(component.totalFeriados).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should have year and type filters', () => {
    initComponent();
    expect(component.anioSeleccionado).toBe(new Date().getFullYear());
    expect(component.tipoSeleccionado).toBe('TODOS');
    expect(component.aniosDisponibles.length).toBeGreaterThan(0);
  });

  it('should have correct displayed columns', () => {
    initComponent();
    expect(component.displayedColumns).toContain('fecha');
    expect(component.displayedColumns).toContain('nombre');
    expect(component.displayedColumns).toContain('tipo');
    expect(component.displayedColumns).toContain('acciones');
  });

  it('should reload on page change', () => {
    initComponent();
    component.onPageChange({ pageSize: 25, pageIndex: 1, length: 50, previousPageIndex: 0 });
    const reqs = httpMock.match(r => r.url === apiUrl);
    expect(reqs.length).toBeGreaterThan(0);
    reqs.forEach(req => req.flush(mockFeriadosResponse));
  });

  it('should format fecha correctly', () => {
    initComponent();
    const formatted = component.formatFecha('2026-01-01');
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('2026');
  });
});
