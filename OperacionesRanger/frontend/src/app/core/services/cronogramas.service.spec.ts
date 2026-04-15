import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  CronogramasService,
  Cronograma,
  CronogramaConDetalle,
  CronogramasResponse,
} from './cronogramas.service';
import { environment } from '../../../environments/environment';

describe('CronogramasService', () => {
  let service: CronogramasService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/cronogramas`;

  const mockCronograma: Cronograma = {
    id: 1,
    nombre: 'Cronograma Semanal',
    descripcion: 'Test',
    activo: true,
    detalles_count: 3,
    created_at: '2026-01-01',
  };

  const mockConDetalle: CronogramaConDetalle = {
    ...mockCronograma,
    detalles: [
      { dia_semana: 1, puesto_id: 10, empleado_id: 100, tipo_turno: 'DIURNO' },
      { dia_semana: 2, puesto_id: 10, empleado_id: 100, tipo_turno: 'DIURNO' },
      { dia_semana: 3, puesto_id: 10, empleado_id: 101, tipo_turno: 'NOCTURNO' },
    ],
  };

  const mockResponse: CronogramasResponse = {
    data: [mockCronograma],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CronogramasService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CronogramasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getAll
  // ============================================================================

  describe('getAll()', () => {
    it('should GET cronogramas without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass pagination, search and activo filters', () => {
      service.getAll({ page: 1, pageSize: 10, search: 'semanal', activo: true }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('search')).toBe('semanal');
      expect(req.request.params.get('activo')).toBe('true');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById (returns CronogramaConDetalle)
  // ============================================================================

  describe('getById()', () => {
    it('should GET cronograma with detalles by ID', () => {
      service.getById(1).subscribe((c) => {
        expect(c.id).toBe(1);
        expect(c.detalles.length).toBe(3);
        expect(c.detalles[0].dia_semana).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConDetalle);
    });
  });

  // ============================================================================
  // create (master-detail)
  // ============================================================================

  describe('create()', () => {
    it('should POST cronograma with detalles', () => {
      const newData = {
        nombre: 'Nuevo Cronograma',
        detalles: [{ dia_semana: 1, puesto_id: 10, empleado_id: 100, tipo_turno: 'DIURNO' as const }],
      };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.nombre).toBe('Nuevo Cronograma');
      expect(req.request.body.detalles.length).toBe(1);
      req.flush({ ...mockConDetalle, id: 2 });
    });
  });

  // ============================================================================
  // update (master-detail)
  // ============================================================================

  describe('update()', () => {
    it('should PUT updated cronograma with detalles', () => {
      const updateData = {
        nombre: 'Updated',
        detalles: [{ dia_semana: 1, puesto_id: 10, empleado_id: 200, tipo_turno: 'NOCTURNO' as const }],
      };

      service.update(1, updateData).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.nombre).toBe('Updated');
      req.flush({ ...mockConDetalle, nombre: 'Updated' });
    });
  });

  // ============================================================================
  // delete
  // ============================================================================

  describe('delete()', () => {
    it('should DELETE cronograma', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
