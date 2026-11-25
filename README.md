# J.J — SecureVault

Aplicación universitaria de notas privadas con React + Vite, Express, MySQL, Sequelize y migraciones. Usa sesiones de servidor, dos roles, cifrado autenticado para notas y teléfono, recuperación por correo y una bitácora de seguridad.

**Estado:** implementación y comprobaciones locales parciales. No se ha desplegado ni se han ejecutado las pruebas con MySQL real en el entorno de creación. Ver `docs/Informe_Seguridad.md` y `docs/Resultados_Verificacion.md` antes de usarla. No usar como producto real hasta completar y revisar esas pruebas.

## 1. Requisitos para Windows

- Windows 10/11, PowerShell, VS Code, Git y Node.js 24 LTS con npm.
- MySQL Server 8.0 o 8.4 instalado y ejecutándose; cliente `mysql` accesible en PowerShell.
- Opcional: Mailpit para recibir correos de prueba localmente; configurar SMTP en `backend/.env`. En producción, usar un proveedor SMTP que permita entrega a usuarios reales.

Abrí el ZIP en una carpeta y, en PowerShell, entrá en la carpeta raíz `JJ-SecureVault`. En todos los comandos siguientes se indica la carpeta de ejecución. No incluir datos personales reales en el laboratorio.

## 2. Crear la base y el usuario de MySQL

Desde PowerShell, iniciá el cliente MySQL como administrador:

```powershell
mysql -u root -p
```

Dentro del cliente MySQL, creá una contraseña propia y reemplazá `TU_CLAVE_LOCAL` antes de ejecutar:

```sql
CREATE DATABASE securevault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'securevault_app'@'localhost' IDENTIFIED BY 'TU_CLAVE_LOCAL';
GRANT ALL PRIVILEGES ON securevault.* TO 'securevault_app'@'localhost';
EXIT;
```

El privilegio anterior se usa para ejecutar migraciones en el laboratorio. Para producción, separar el usuario que migra del usuario de la aplicación y otorgar solo los permisos necesarios. La contraseña no debe subirse al repositorio.

## 3. Configurar secretos locales

Desde la raíz `JJ-SecureVault`:

```powershell
Copy-Item backend\.env.example backend\.env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
code backend\.env
```

Copiá el primer valor en `ENCRYPTION_KEY_BASE64` y el segundo en `SESSION_SECRET`. Completá `DB_PASSWORD` con la contraseña local y `SMTP_FROM` con una dirección de prueba. Para Mailpit, los valores de ejemplo usan SMTP en `localhost:1025`; arrancá Mailpit por separado y consultá su interfaz web para leer el correo. La configuración del servidor SMTP es necesaria para recuperar contraseñas. No compartás `.env`.

Si se pierde la llave de cifrado, no se pueden recuperar las notas y teléfonos ya cifrados. Resguardá una copia segura fuera del repositorio. Para una futura rotación deben mantenerse temporalmente las llaves antiguas y volver a cifrar los registros con la nueva: esta rotación no está implementada.

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
$env:MYSQL_TEST = '1'
npm run migrate
npm run migrate:undo
npm run migrate
npm test
Remove-Item Env:MYSQL_TEST
Remove-Item Env:DB_NAME
```

Crear antes `securevault_test` y dar acceso al usuario de prueba. **`migrate:undo` elimina todas las tablas de la base configurada**: jamás ejecutarlo sobre datos que se quieran conservar.

## 7. Producción y CI

Construir frontend con `npm ci` y `npm run build` en `frontend`, instalar backend con `npm ci`, ejecutar migraciones y arrancar `npm start` en `backend`. Express sirve `frontend/dist` y la API bajo un mismo origen. Configurar `NODE_ENV=production`, puerto, `APP_URL`, MySQL, claves, correo y `TRUST_PROXY` según el proxy real. Para verificar TLS de MySQL, `DB_SSL_CA` puede contener el certificado CA PEM y el servidor debe aceptar TLS. Restringir la red y proteger secretos mediante el servicio de la plataforma.

`.github/workflows/ci.yml` ejecuta instalación, lint, migraciones, pruebas, build y auditoría en GitHub Actions con MySQL de prueba. **No incluye despliegue:** hay que configurar una integración de publicación que dependa de que CI pase y evitar que la plataforma publique commits sin validar. Este proyecto no contiene cuenta de hosting, URL, credenciales, historial Git, ni evidencias de producción.

Para la evaluación se debe confirmar HTTPS, redirección, TLS 1.2/1.3, cabeceras, disponibilidad, respaldos, correo, manejo de secretos, `trust proxy` y reconexión a la base. Compartir credenciales de evaluación exclusivamente por un canal privado.
