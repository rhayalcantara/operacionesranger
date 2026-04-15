import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../environments/environment';
import { PlantillasServicioComponent } from './plantillas-servicio.component';

const apiBase = environment.apiBaseUrl;

describe('PlantillasServicioComponent', () => {
  let component: PlantillasServicioComponent;
  let fixture: ComponentFixture<PlantillasServicioComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantillasServicioComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlantillasServicioComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    httpMock.match(() => true);
  });

  it('should load plantillas on init', () => {
    fixture.detectChanges(); // triggers ngOnInit

    const req = httpMock.expectOne(
      (r) => r.url.includes('/plantillas-servicio') && r.params.get('page') === '1' && r.params.get('pageSize') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        { id: 1, nombre: 'Plantilla A', descripcion: 'Desc A', cantidad_detalles: 5, activo: true }
      ],
      total: 1
    });

    fixture.detectChanges();

    expect(component.dataSource.length).toBe(1);
    expect(component.totalPlantillas).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should have correct displayedColumns', () => {
    httpMock.match(() => true);

    expect(component.displayedColumns).toEqual([
      'nombre',
      'descripcion',
      'cantidad_detalles',
      'activo',
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
    expect(component.totalPlantillas).toBe(0);
  });

  it('should have an empty search control initially', () => {
    httpMock.match(() => true);
    expect(component.searchControl.value).toBe('');
  });
});
