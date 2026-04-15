import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../environments/environment';
import { CronogramasComponent } from './cronogramas.component';

const apiBase = environment.apiBaseUrl;

describe('CronogramasComponent', () => {
  let component: CronogramasComponent;
  let fixture: ComponentFixture<CronogramasComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CronogramasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CronogramasComponent);
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

  it('should load cronogramas on init', () => {
    fixture.detectChanges(); // triggers ngOnInit

    const req = httpMock.expectOne(
      (r) => r.url.includes('/cronogramas') && r.params.get('page') === '1' && r.params.get('pageSize') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        { id: 1, nombre: 'Cronograma Enero', descripcion: 'Turnos de enero', detalles_count: 15, activo: true }
      ],
      total: 1
    });

    fixture.detectChanges();

    expect(component.dataSource.length).toBe(1);
    expect(component.totalCronogramas).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should have correct displayedColumns', () => {
    httpMock.match(() => true);

    expect(component.displayedColumns).toEqual([
      'nombre',
      'descripcion',
      'detalles_count',
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
    expect(component.totalCronogramas).toBe(0);
  });

  it('should have an empty search control initially', () => {
    httpMock.match(() => true);
    expect(component.searchControl.value).toBe('');
  });
});
