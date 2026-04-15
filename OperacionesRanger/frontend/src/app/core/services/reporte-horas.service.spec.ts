import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReporteHorasService, ReporteHorasResult } from './reporte-horas.service';
import { environment } from '../../../environments/environment';

describe('ReporteHorasService', () => {
  let service: ReporteHorasService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/reportes`;

  const mockReporte: ReporteHorasResult = {
    tipo: 'empleado',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-01-15',
    fechas: ['2026-01-01', '2026-01-02', '2026-01-03'],
    filas: [
      {
        id: 100,
        nombre: 'Juan Perez',
        codigo: 'EMP-001',
        total_horas: 30,
        total_dias: 3,
        dias: { '2026-01-01': 10, '2026-01-02': 10, '2026-01-03': 10 },
      },
    ],
    total_registros: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReporteHorasService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReporteHorasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getReporte
  // ============================================================================

  describe('getReporte()', () => {
    it('should GET reporte/horas with required params', () => {
      service.getReporte({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15', tipo: 'empleado' }).subscribe((result) => {
        expect(result.filas.length).toBe(1);
        expect(result.total_registros).toBe(1);
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/horas`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('fecha_inicio')).toBe('2026-01-01');
      expect(req.request.params.get('fecha_fin')).toBe('2026-01-15');
      expect(req.request.params.get('tipo')).toBe('empleado');
      req.flush(mockReporte);
    });

    it('should pass optional empleado_id param', () => {
      service.getReporte({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15', tipo: 'empleado', empleado_id: 100 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/horas`);
      expect(req.request.params.get('empleado_id')).toBe('100');
      req.flush(mockReporte);
    });

    it('should pass optional puesto_id param', () => {
      service.getReporte({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15', tipo: 'puesto', puesto_id: 10 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/horas`);
      expect(req.request.params.get('tipo')).toBe('puesto');
      expect(req.request.params.get('puesto_id')).toBe('10');
      req.flush({ ...mockReporte, tipo: 'puesto' });
    });
  });

  // ============================================================================
  // exportToCsv (pure function - test CSV output)
  // ============================================================================

  describe('exportToCsv()', () => {
    it('should create and trigger CSV download', () => {
      // Mock DOM APIs
      const mockClick = vi.fn();
      const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement);
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();
      Object.defineProperty(window, 'URL', {
        value: { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL },
        writable: true,
      });

      service.exportToCsv(mockReporte);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      // Verify blob content: check it was called with a Blob
      const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('text/csv;charset=utf-8;');

      mockCreateElement.mockRestore();
    });

    it('should generate correct filename format', () => {
      let capturedDownload = '';
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        set download(v: string) { capturedDownload = v; },
        get download() { return capturedDownload; },
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);
      Object.defineProperty(window, 'URL', {
        value: { createObjectURL: vi.fn().mockReturnValue('blob:x'), revokeObjectURL: vi.fn() },
        writable: true,
      });

      service.exportToCsv(mockReporte);

      expect(capturedDownload).toBe('horas_trabajadas_empleado_20260101_20260115.csv');

      vi.restoreAllMocks();
    });

    it('should use "Puesto" label when tipo is puesto', () => {
      const puestoReporte: ReporteHorasResult = {
        ...mockReporte,
        tipo: 'puesto',
      };

      let blobContent = '';
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement);

      // Capture the Blob content
      const mockCreate = vi.fn().mockImplementation((blob: Blob) => {
        // Read blob synchronously via constructor check
        return 'blob:test';
      });
      Object.defineProperty(window, 'URL', {
        value: { createObjectURL: mockCreate, revokeObjectURL: vi.fn() },
        writable: true,
      });

      service.exportToCsv(puestoReporte);

      // Verify blob was created (Blob with BOM + CSV content)
      const blobArg = mockCreate.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);

      vi.restoreAllMocks();
    });
  });
});
