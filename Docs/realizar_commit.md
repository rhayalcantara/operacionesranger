# Guía: Realizar Commit y Push en Proyectos Backend y Frontend

## Resumen de Tarea

Modificación del cálculo de AFP/ARS en segunda quincena para calcular sobre salario mensual cuando no hubo descuento en la primera quincena.

---

## Comandos Utilizados

### 1. Backend (backend-ranger-nomina)

#### 1.1 Verificar estado del repositorio
```bash
cd "E:\ranger sistemas\backend-ranger-nomina"
git status
```

**Resultado:** Mostró archivos modificados:
- `.env`
- `error.log`
- `models/cuotaModel.js`
- `models/nominaModel.js`
- Archivos nuevos en `migrations/`

#### 1.2 Ver cambios específicos
```bash
cd "E:\ranger sistemas\backend-ranger-nomina"
git diff models/nominaModel.js
```

**Propósito:** Revisar los cambios realizados en el archivo principal antes de commitear.

#### 1.3 Ver historial reciente
```bash
cd "E:\ranger sistemas\backend-ranger-nomina"
git log -5 --oneline
```

**Propósito:** Verificar el estilo de mensajes de commit anteriores para mantener consistencia.

#### 1.4 Agregar archivos al staging area
```bash
cd "E:\ranger sistemas\backend-ranger-nomina"
git add models/nominaModel.js models/cuotaModel.js migrations/
```

**Nota:** Solo agregamos los archivos relevantes a la funcionalidad. Excluimos `.env` y `error.log` por ser archivos de configuración/logs.

#### 1.5 Crear commit
```bash
cd "E:\ranger sistemas\backend-ranger-nomina"
git commit -m "$(cat <<'EOF'
feat: mejorar cálculo AFP/ARS en segunda quincena

Se implementó lógica para calcular AFP y ARS sobre salario mensual completo
en la segunda quincena cuando no hubo descuento en la primera quincena.

Cambios realizados:
- Verificación de descuentos de primera quincena antes de calcular segunda
- Cálculo de AFP sobre salario mensual si no hubo descuento en Q1
- Cálculo de ARS sobre salario mensual si no hubo descuento en Q1
- Mejoras en control de quincena de aplicación para desc/cred

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Resultado:** Commit `5accd9c` creado con 6 archivos modificados.

#### 1.6 Push a repositorio remoto
```bash
cd "E:\ranger sistemas\backend-ranger-nomina"
git push
```

**Resultado:** Push exitoso a `origin/main` en GitHub.

---

### 2. Frontend (rangernomina-frontend)

#### 2.1 Verificar estado del repositorio
```bash
cd "E:\ranger sistemas\rangernomina-frontend"
git status
```

**Resultado:** Mostró archivos modificados:
- `src/app/no-desc-cred/` (múltiples archivos)
- `src/app/nomina/` (múltiples archivos)
- `src/app/services/nomina.services.ts`

#### 2.2 Ver historial reciente
```bash
cd "E:\ranger sistemas\rangernomina-frontend"
git log -5 --oneline
```

#### 2.3 Ver cambios específicos (opcional)
```bash
cd "E:\ranger sistemas\rangernomina-frontend"
git diff src/app/no-desc-cred/no-desc-cred-form.component.ts | head -100
```

**Propósito:** Verificar los cambios en un archivo clave antes de commitear.

#### 2.4 Agregar archivos al staging area
```bash
cd "E:\ranger sistemas\rangernomina-frontend"
git add src/app/no-desc-cred/ src/app/nomina/ src/app/services/nomina.services.ts
```

#### 2.5 Crear commit
```bash
cd "E:\ranger sistemas\rangernomina-frontend"
git commit -m "$(cat <<'EOF'
feat: agregar soporte UI para quincena de aplicación y manejo de cuotas

Se agregó la interfaz de usuario para gestionar la quincena de aplicación
de descuentos/créditos y el manejo de cuotas en el sistema de nómina.

Cambios realizados:
- Agregar campo quincena_aplicacion en formulario de desc/cred
- Actualizar componentes de lista y formulario para manejo de cuotas
- Mejorar validaciones y flujo de creación de desc/cred
- Ajustes en formulario de nómina para control de ISR por quincena

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Resultado:** Commit `74f1b84` creado con 9 archivos modificados.

#### 2.6 Push a repositorio remoto
```bash
cd "E:\ranger sistemas\rangernomina-frontend"
git push
```

**Resultado:** Push exitoso a `origin/master` en GitHub.

---

## Patrón de Comandos (Flujo de Trabajo)

### Flujo estándar para hacer commit y push:

```bash
# 1. Navegar al directorio del proyecto
cd "E:\ranger sistemas\[nombre-proyecto]"

# 2. Verificar estado
git status

# 3. Ver cambios (opcional pero recomendado)
git diff [archivo]

# 4. Ver historial para mantener consistencia en mensajes
git log -5 --oneline

# 5. Agregar archivos al staging
git add [archivos o carpetas]

# 6. Crear commit con mensaje descriptivo
git commit -m "$(cat <<'EOF'
[tipo]: [título corto]

[Descripción detallada]

[Lista de cambios]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 7. Push a remoto
git push
```

---

## Convenciones de Mensajes de Commit

### Tipos de commit usados en este proyecto:
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `docs:` - Cambios en documentación
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Tareas de mantenimiento

### Estructura del mensaje:
1. **Título:** Breve descripción (50-72 caracteres)
2. **Cuerpo:** Explicación detallada del cambio
3. **Lista de cambios:** Bullet points con los cambios específicos
4. **Footer:** Firma de Claude Code (automatizada)

---

## Notas Importantes

1. **Archivos a excluir:** Nunca commitear archivos como `.env`, `error.log`, o archivos temporales.

2. **Heredoc en mensajes:** Usar `cat <<'EOF'` permite mensajes multilínea sin problemas de escape:
   ```bash
   git commit -m "$(cat <<'EOF'
   mensaje
   multilínea
   EOF
   )"
   ```

3. **Advertencias de CRLF:** Las advertencias sobre LF/CRLF son normales en Windows y no afectan el commit.

4. **Ramas diferentes:** Backend usa `main`, Frontend usa `master` - verificar antes de hacer push.

5. **Verificación post-push:** Siempre verificar en GitHub que los cambios se reflejaron correctamente.

---

## Comandos Útiles Adicionales

### Ver cambios sin commitear
```bash
git diff
```

### Ver cambios ya staged
```bash
git diff --staged
```

### Ver historial completo
```bash
git log --oneline --graph --all
```

### Deshacer staging de un archivo
```bash
git restore --staged [archivo]
```

### Ver archivos en staging
```bash
git status --short
```

### Verificar remoto configurado
```bash
git remote -v
```

---

## Resultado Final

### Backend
- **Repositorio:** https://github.com/rhayalcantara/backend-ranger-nomina.git
- **Commit:** `5accd9c`
- **Rama:** `main`
- **Archivos:** 6 modificados (335 inserciones, 38 eliminaciones)

### Frontend
- **Repositorio:** https://github.com/rhayalcantara/rangernomina-frontend.git
- **Commit:** `74f1b84`
- **Rama:** `master`
- **Archivos:** 9 modificados (104 inserciones, 18 eliminaciones)

---

**Fecha de creación:** 2025-10-09
**Autor:** Claude Code
