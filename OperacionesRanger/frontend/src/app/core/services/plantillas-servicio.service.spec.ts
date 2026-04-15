import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  PlantillasServicioService,
  PlantillaServicio,
  PlantillaConDetalle,
  PlantillasServicioResponse,
} from './plantillas-servicio.service';
import { environment } from '../../../environments/environment';

describe('PlantillasServicioService', () => {
  let service: PlantillasServicioService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/plantillas-servicio`;

  const mockPlantilla: PlantillaServicio = {
    id: 1,
    nombre: 'Plantilla Test',
    descripcion: 'Descripcion test',
    activo: true,
    cantidad_detalles: 2,
    created_at: '2026-01-01',
  };

  const mockPlantillaConDetalle: PlantillaConDetalle = {
    ...mockPlantilla,
    detalles: [
      { puesto_id: 10, servicio_puesto_id: 20, puesto_nombre: 'Puesto A' },
      { puesto_id: 11, servicio_puesto_id: 21, puesto_nombre: 'Puesto B' },
    ],
  };

  const mockResponse: PlantillasServicioResponse = {
    data: [mockPlantilla],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlantillasServicioService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlantillasServicioService);
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
    it('should GET plantillas without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass pagination, search and activo filters', () => {
      service.getAll({ page: 1, pageSize: 10, search: 'test', activo: true }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('search')).toBe('test');
      expect(req.request.params.get('activo')).toBe('true');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById (returns PlantillaConDetalle)
  // ============================================================================

  describe('getById()', () => {
    it('should GET plantilla with detalles by ID', () => {
      service.getById(1).subscribe((p) => {
        expect(p.id).toBe(1);
        expect(p.detalles.length).toBe(2);
        expect(p.detalles[0].puesto_nombre).toBe('Puesto A');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlantillaConDetalle);
    });
  });

  // ============================================================================
  // create (master-detail)
  // ============================================================================

  describe('create()', () => {
    it('should POST plantilla with detalles', () => {
      const newData = {
        nombre: 'Nueva Plantilla',
        descripcion: 'Desc',
        detalles: [{ puesto_id: 10, servicio_puesto_id: 20 }],
      };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
        expect(created.detalles.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.nombre).toBe('Nueva Plantilla');
      expect(req.request.body.detalles.length).toBe(1);
      req.flush({ ...mockPlantillaConDetalle, id: 2, detalles: [{ puesto_id: 10, servicio_puesto_id: 20 }] });
    });
  });

  // ============================================================================
  // update (master-detail)
  // ============================================================================

  describe('update()', () => {
    it('should PUT updated plantilla with detalles', () => {
      const updateData = {
        nombre: 'Updated',
        detalles: [{ puesto_id: 10, servicio_puesto_id: 20 }],
      };

      service.update(1, updateData).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.nombre).toBe('Updated');
      req.flush({ ...mockPlantillaConDetalle, nombre: 'Updated' });
    });
  });

  // ============================================================================
  // delete
  // ============================================================================

  describe('delete()', () => {
    it('should DELETE plantilla', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
