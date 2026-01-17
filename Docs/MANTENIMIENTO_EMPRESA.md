# Mantenimiento de Empresa

**Fecha de Implementación:** 2025-11-17
**Desarrollador:** Claude Code

## Descripción General

El módulo de **Mantenimiento de Empresa** permite configurar los datos corporativos de la empresa que se utilizarán en reportes, documentos oficiales y personalización del frontend.

Este módulo sigue el patrón **Singleton**: solo puede existir **un único registro** de empresa en el sistema.

## Características Implementadas

### ✅ Campos de la Empresa

1. **Nombre de la Empresa** (requerido)
2. **RNC** - Registro Nacional del Contribuyente (requerido, formato: XXX-XXXXXXX-X)
3. **Dirección**
4. **Logo** - Imagen almacenada como Base64 en LONGBLOB (PNG/JPG, máximo 2MB)
5. **Representante Legal**
6. **Teléfono**
7. **Email** - Validado con formato email válido

### ✅ Seguridad y Permisos

- **Solo usuarios con nivel 9 (administradores)** pueden crear o editar la empresa
- Otros niveles pueden visualizar los datos pero NO editarlos
- Auditoría completa: campos `creado_por`, `fecha_creacion`, `modificado_por`, `fecha_modificacion`

### ✅ Validaciones Implementadas

#### Backend (Sequelize):
- **Nombre**: Requerido, máximo 200 caracteres
- **RNC**: Requerido, único, formato regex `/^\d{3}-\d{7}-\d$/`
- **Email**: Formato email válido
- **Hook de creación**: Previene crear más de un registro

#### Frontend (Angular):
- **Nombre**: Requerido, máximo 200 caracteres
- **RNC**: Requerido, validación de patrón XXX-XXXXXXX-X
- **Email**: Validación de email
- **Logo**: Máximo 2MB, solo PNG/JPG
- Todos los campos con mensajes de error descriptivos

## Estructura de Archivos

### Backend

```
backend-ranger-nomina/
├── database/
│   └── create_no_empresa.sql          # Script SQL de creación
├── models/
│   └── empresaSequelizeModel.js       # Modelo Sequelize con validaciones
└── routes/
    └── empresaRoutes.js               # API REST endpoints
```

### Frontend

```
rangernomina-frontend/src/app/
├── interfaces/
│   └── empresa.interface.ts           # Interface TypeScript
├── services/
│   └── empresa.service.ts             # Servicio HTTP
└── empresa/
    ├── empresa.component.ts           # Componente principal
    ├── empresa.component.html         # Template
    └── empresa.component.css          # Estilos
```

## API Endpoints

### `GET /api/empresa`
Obtener la única empresa del sistema (singleton).

**Autenticación**: Requerida (JWT)

**Response 200:**
```json
{
  "id_empresa": 1,
  "nombre": "Mi Empresa S.A.",
  "rnc": "123-4567890-1",
  "direccion": "Calle Principal #123, Santo Domingo",
  "logo": "base64encodedstring...",
  "representante_legal": "Juan Pérez",
  "telefono": "(809) 555-5555",
  "email": "contacto@empresa.com",
  "creado_por": "admin",
  "fecha_creacion": "2025-11-17T10:00:00.000Z",
  "modificado_por": "admin",
  "fecha_modificacion": "2025-11-17T15:30:00.000Z"
}
```

**Response 404:** No hay empresa configurada

---

### `POST /api/empresa`
Crear nueva empresa (solo si no existe ninguna).

**Autenticación**: Requerida (JWT)
**Permiso**: Solo nivel 9

**Request Body:**
```json
{
  "nombre": "Mi Empresa S.A.",
  "rnc": "123-4567890-1",
  "direccion": "Calle Principal #123",
  "logo": "base64encodedstring...",
  "representante_legal": "Juan Pérez",
  "telefono": "(809) 555-5555",
  "email": "contacto@empresa.com"
}
```

**Response 201:** Empresa creada exitosamente
**Response 400:** Error de validación (RNC duplicado, formato incorrecto, etc.)
**Response 403:** Sin permisos
**Response 500:** Ya existe un registro de empresa

---

### `PUT /api/empresa/:id`
Actualizar empresa existente.

**Autenticación**: Requerida (JWT)
**Permiso**: Solo nivel 9

**Request Body:** (todos los campos opcionales)
```json
{
  "nombre": "Mi Empresa S.A. Actualizada",
  "rnc": "123-4567890-1",
  "direccion": "Nueva Dirección",
  "logo": "base64encodedstring...",
  "representante_legal": "María González",
  "telefono": "(809) 555-6666",
  "email": "nuevo@empresa.com"
}
```

**Response 200:** Empresa actualizada exitosamente
**Response 400:** Error de validación
**Response 403:** Sin permisos
**Response 404:** Empresa no encontrada

---

## Base de Datos

### Tabla: `no_empresa`

```sql
CREATE TABLE IF NOT EXISTS no_empresa (
  id_empresa INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(200) NOT NULL,
  rnc VARCHAR(15) NOT NULL UNIQUE COMMENT 'Formato: XXX-XXXXXXX-X',
  direccion VARCHAR(500),
  logo LONGBLOB COMMENT 'Logo en Base64',
  representante_legal VARCHAR(150),
  telefono VARCHAR(20),
  email VARCHAR(100),
  creado_por VARCHAR(50),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  modificado_por VARCHAR(50),
  fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Índices:**
- Primary Key: `id_empresa`
- Unique: `rnc`
- Index: `idx_empresa_rnc`

---

## Uso en el Frontend

### Acceso al Módulo

1. Iniciar sesión como usuario con **nivel 9**
2. Ir al menú **Mantenimientos** → **Empresa**
3. La ruta es: `/empresa`

### Funcionalidades de la UI

#### Vista de Solo Lectura (todos los usuarios):
- Ver todos los datos de la empresa
- Ver logo (si existe)
- Ver información de auditoría

#### Modo Edición (solo nivel 9):
- Botón **"Editar"** para activar el modo edición
- Editar todos los campos
- Subir/cambiar/eliminar logo
- Validaciones en tiempo real
- Botón **"Cancelar"** para descartar cambios
- Botón **"Guardar"** para persistir cambios

### Upload de Logo

- Click en **"Seleccionar Logo"**
- Formatos permitidos: PNG, JPG, JPEG
- Tamaño máximo: 2MB
- Preview en tiempo real
- Botón X para eliminar logo

---

## Integraciones Futuras

Este módulo servirá como base para:

### 1. Reportes PDF
- Volantes de pago con logo y datos de empresa
- Reportes de vacaciones
- Certificaciones laborales
- Constancias

### 2. Personalización Frontend
- Logo en header del sistema
- Datos en pie de página
- Pantalla de login personalizada

### 3. Documentos Oficiales
- Firma digital con datos de representante legal
- Generación de contratos
- Cartas oficiales

---

## Ejemplos de Uso

### Crear Primera Empresa (desde frontend)

1. Login como administrador (nivel 9)
2. Ir a Mantenimientos → Empresa
3. Si no existe empresa, el sistema mostrará advertencia
4. Click en "Editar"
5. Llenar todos los campos:
   - Nombre: "Ranger Sistemas S.R.L."
   - RNC: "130-58921-6"
   - Dirección: "Av. Winston Churchill #1099, Santo Domingo"
   - Teléfono: "(809) 555-1234"
   - Email: "info@rangersistemas.com"
   - Representante Legal: "Carlos Martínez"
6. Seleccionar logo (opcional)
7. Click en "Guardar"

### Actualizar Datos de Empresa

1. Login como administrador
2. Ir a Mantenimientos → Empresa
3. Click en "Editar"
4. Modificar campos deseados
5. Click en "Guardar"

---

## Validación de RNC Dominicano

El sistema valida que el RNC tenga el formato correcto según lo establecido por la DGII (Dirección General de Impuestos Internos).

### Formato Válido:

**RNC:** `XXX-XXXXX-X`
- 3 dígitos
- Guion (-)
- 5 dígitos
- Guion (-)
- 1 dígito de verificación
- **Total: 9 dígitos + 2 guiones = 11 caracteres**

### Ejemplos válidos:
- `130-58921-6` ✅
- `101-23456-7` ✅
- `402-12345-1` ✅

### Ejemplos inválidos:
- `130589216` ❌ (sin guiones)
- `130-5892-6` ❌ (solo 4 dígitos en sección media)
- `130-589216-6` ❌ (6 dígitos en sección media)
- `ABC-58921-6` ❌ (letras)
- `13-58921-6` ❌ (solo 2 dígitos al inicio)

---

## Testing

### Casos de Prueba

#### ✅ Backend
1. **Crear empresa válida**: POST con todos los campos válidos
2. **Crear segunda empresa**: Debe fallar (singleton)
3. **RNC inválido**: Debe rechazar formato incorrecto (solo acepta XXX-XXXXX-X)
4. **Email inválido**: Debe rechazar email sin formato válido
5. **Sin permisos**: Usuario nivel < 9 no puede crear/editar
6. **Logo Base64**: Verificar conversión correcta

#### ✅ Frontend
1. **Carga inicial**: Verificar que cargue datos correctamente
2. **Modo edición**: Solo nivel 9 ve botón Editar
3. **Validaciones**: Campos con errores muestran mensajes
4. **Upload de logo**: Preview correcto, validación de tamaño
5. **Guardar**: Actualización correcta y notificación

---

## Troubleshooting

### Error: "Ya existe un registro de empresa"

**Causa:** Intentando crear segunda empresa
**Solución:** Usar PUT para actualizar la existente

### Error: "El formato del RNC debe ser XXX-XXXXX-X (ejemplo: 130-58921-6)"

**Causa:** RNC no cumple con el formato válido
**Solución:**
- Usar formato XXX-XXXXX-X (9 dígitos con 2 guiones)
- Ejemplo válido: `130-58921-6`
- Verificar que tenga:
  - 3 dígitos al inicio
  - Guion
  - 5 dígitos en el medio
  - Guion
  - 1 dígito verificador al final

### Logo no se muestra

**Causa:** Imagen muy grande o formato no soportado
**Solución:**
- Reducir tamaño a menos de 2MB
- Usar PNG o JPG
- Verificar que sea Base64 válido

### Botón "Editar" no aparece

**Causa:** Usuario no tiene nivel 9
**Solución:** Login con usuario administrador

---

## Notas Técnicas

### Patrón Singleton en Backend

```javascript
// Hook en empresaSequelizeModel.js
hooks: {
  beforeCreate: async (empresa) => {
    const count = await EmpresaSequelize.count();
    if (count > 0) {
      throw new Error('Ya existe un registro de empresa. Solo puede haber uno.');
    }
  }
}
```

### Conversión de Logo (Base64 ↔ Buffer)

**Backend (guardar):**
```javascript
let logoBuffer = null;
if (logo) {
  logoBuffer = Buffer.from(logo, 'base64');
}
```

**Backend (leer):**
```javascript
if (empresaData.logo) {
  empresaData.logo = empresaData.logo.toString('base64');
}
```

**Frontend (mostrar):**
```typescript
this.logoPreview = 'data:image/png;base64,' + empresa.logo;
```

---

## Próximos Pasos

- [ ] Integrar datos de empresa en volante de pago PDF
- [ ] Agregar logo a header del sistema
- [ ] Usar datos de empresa en reportes
- [ ] Generar certificaciones con firma digital del representante legal
- [ ] Permitir múltiples formatos de logo (SVG)

---

## Autor

**Claude Code**
Fecha: 2025-11-17

---

## Changelog

### v1.0.0 - 2025-11-17
- ✅ Implementación inicial completa
- ✅ CRUD de empresa (singleton)
- ✅ Upload de logo Base64
- ✅ Validaciones RNC dominicano
- ✅ Permisos nivel 9
- ✅ Auditoría completa
- ✅ UI responsive con Angular Material
