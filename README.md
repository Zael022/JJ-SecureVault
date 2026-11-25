# J.J — SecureVault

Aplicación universitaria de notas privadas con React + Vite, Express, PostgreSQL, Sequelize y migraciones. Producción: frontend en Vercel, API en Render y base de datos en Supabase. Ningún dato personal se guarda legible en la base: el correo se busca mediante un índice ciego HMAC-SHA256 (`email_hash`). Usa sesiones de servidor, dos roles, cifrado autenticado (AES-256-GCM) para nombre, correo, título y contenido de notas, teléfono y datos de sesión, recuperación por correo y una bitácora de seguridad.

**Estado:** implementación y comprobaciones locales parciales. Migraciones up/down/up y las 5 pruebas (incluida la de integración) pasaron contra PostgreSQL 16 local. Ver `docs/Informe_Seguridad.md` y `docs/Resultados_Verificacion.md` antes de usarla. No usar como producto real hasta completar y revisar esas pruebas.

## 1. Requisitos para Windows

- Windows 10/11, PowerShell, VS Code, Git y Node.js 24 LTS con npm.
- PostgreSQL 16 instalado y ejecutándose (incluye `psql` y pgAdmin).
- Correo: en desarrollo, si `BREVO_API_KEY` está vacío, el enlace de recuperación se muestra en la consola del backend. En producción no hay proveedor de correo configurado (ver «Correo de recuperación (limitación)»).

Abrí el ZIP en una carpeta y, en PowerShell, entrá en la carpeta raíz `JJ-SecureVault`. En todos los comandos siguientes se indica la carpeta de ejecución. No incluir datos personales reales en el laboratorio.

## 2. Crear la base y el usuario de PostgreSQL

Desde PowerShell, abrí `psql` como el usuario administrador `postgres`:

```powershell
psql -U postgres
```

Dentro de `psql`, reemplazá `TU_CLAVE_LOCAL` antes de ejecutar:

```sql
CREATE USER securevault_app WITH PASSWORD 'TU_CLAVE_LOCAL';
CREATE DATABASE securevault OWNER securevault_app;
\q
```

La contraseña no debe subirse al repositorio.

## 3. Configurar secretos locales

Desde la raíz `JJ-SecureVault`:

```powershell
Copy-Item backend\.env.example backend\.env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
code backend\.env
```

Copiá el primer valor en `ENCRYPTION_KEY_BASE64` y el segundo en `SESSION_SECRET`. Completá `DB_PASSWORD` con la contraseña local. `BREVO_API_KEY` puede quedar vacío en desarrollo. No compartás `.env`.

Si se pierde la llave de cifrado, no se pueden recuperar los datos cifrados (nombres, correos, notas, teléfonos) y nadie podrá iniciar sesión, porque el índice del correo también depende de la llave. Resguardá una copia segura fuera del repositorio. Para una futura rotación deben mantenerse temporalmente las llaves antiguas y volver a cifrar los registros con la nueva: esta rotación no está implementada.

## 4. Instalar y preparar el backend

Desde la raíz `JJ-SecureVault`:

```powershell
cd backend
npm ci
npm run migrate
npm run admin
npm run dev
```

`npm run admin` solicita nombre, correo y contraseña en la terminal y crea el primer administrador. No usa credenciales predeterminadas. Si ya existe un administrador, gestionar roles desde el panel. Dejá esta terminal abierta. El backend queda en `http://localhost:3000` y su endpoint de estado en `http://localhost:3000/health`.

## 5. Iniciar el frontend

Abrí una segunda terminal PowerShell, partiendo de `JJ-SecureVault`:

```powershell
cd frontend
npm ci
npm run dev
```

Abrí la URL que muestre Vite, normalmente `http://localhost:5173`. Vite redirige `/api` al backend. Registrá una cuenta normal desde la web: su rol será `usuario`.

## 6. Comprobar

Desde `backend`:

```powershell
npm run lint
npm test
npm audit
```

Desde `frontend`:

```powershell
npm run lint
npm run build
npm audit
```

La prueba de integración requiere una **base de prueba vacía y separada**, con migraciones aplicadas. Para ejecutarla, configurá temporalmente sus datos en las variables de entorno de una terminal en la carpeta `backend`; verificá tres veces el nombre de la base antes de usar `migrate:undo`:

```powershell
$env:DB_NAME = 'securevault_test'
$env:DB_TEST = '1'
npm run migrate
npm run migrate:undo
npm run migrate
npm test
Remove-Item Env:DB_TEST
Remove-Item Env:DB_NAME
```

Crear antes `securevault_test` y dar acceso al usuario de prueba. **`migrate:undo` elimina todas las tablas de la base configurada**: jamás ejecutarlo sobre datos que se quieran conservar.

## 7. Producción y CI

Arquitectura: Navegador → Vercel (HTTPS, frontend React + cabeceras de seguridad) → rewrite `/api/*` y `/health` → Render (API Express) → Supabase (PostgreSQL con TLS). Como el navegador solo habla con el dominio de Vercel, la cookie de sesión es de primer origen (`HttpOnly`, `Secure`, `SameSite=Lax`).

### Supabase (base de datos)
1. Crear un proyecto y guardar la contraseña de la base en un gestor seguro.
2. En **Connect**, copiar los datos del **Session pooler** (no la conexión directa, que es IPv6): host, puerto `5432`, usuario `postgres.<ref>` y base `postgres`.
3. En **Database Settings → SSL Configuration**, descargar el certificado CA y activar **Enforce SSL**.
4. Los proyectos gratuitos se pausan tras 7 días sin actividad: entrar al panel durante la evaluación.

### Render (API)
- Root Directory: `backend` · Build: `npm ci && npm run migrate` · Start: `npm start` · Health check: `/health`.
- Variables (solo nombres): `NODE_ENV=production`, `TRUST_PROXY`, `APP_URL`, `FRONTEND_ORIGIN`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_CA`, `SESSION_SECRET`, `ENCRYPTION_KEY_BASE64`, `KEY_VERSION`.
- `APP_URL` y `FRONTEND_ORIGIN` son la URL de Vercel. Crear el primer administrador con `npm run admin` desde una terminal local apuntando temporalmente a la base de producción.
- Render reinicia el proceso automáticamente si falla. El plan gratuito se duerme por inactividad: abrir `/health` antes de la demostración.

### Vercel (frontend)
- Root Directory: `frontend` (Vite). `frontend/vercel.json` define el rewrite hacia Render, el fallback de la SPA y las cabeceras (CSP, HSTS, etc.). Reemplazar `jj-securevault-api.onrender.com` por el dominio de Render.

### Correo de recuperación (limitación)
El despliegue usa solo Render, Vercel y Supabase. Render gratis bloquea los puertos SMTP, por lo que en producción el token de recuperación se genera y se guarda como hash SHA-256 con expiración de 15 minutos, pero el correo no se envía y se registra el evento `reset_email_unavailable` sin incluir el token. El código admite un proveedor por API HTTPS (`BREVO_API_KEY`, `MAIL_FROM`) si se quisiera activar el envío. Se documenta como riesgo residual.

### CI
`.github/workflows/ci.yml` ejecuta instalación, lint, migraciones up/down/up, pruebas, build y `npm audit` con PostgreSQL 16. Vercel y Render despliegan desde la rama principal; activar en Render **Auto-Deploy: After CI Checks Pass** para no publicar commits sin validar.

Compartir credenciales de evaluación exclusivamente por un canal privado.
