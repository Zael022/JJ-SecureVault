# Informe de seguridad y matriz OWASP 2025

Estado: desplegado en producción (frontend en Vercel `https://jj-securevault.vercel.app`, API en Render, PostgreSQL en Supabase). Los controles marcados como pendientes aún requieren ejecución sobre la URL de producción. No se asigna calificación a pruebas no realizadas.

| Categoría del laboratorio | Control y archivo | Evidencia y estado |
|---|---|---|
| A01 Control de acceso | Roles en `backend/src/middlewares/security.js`; propiedad en `services/business.js` | Prueba de integración con dos usuarios (lectura, edición y borrado ajeno → 404; logout invalida la cookie) aprobada contra PostgreSQL 16 en local y en GitHub Actions. Prueba con administrador pendiente. |
| A02 Configuración | Helmet, CSP, CORS y X-Powered-By en `backend/src/app.js` | Prueba local de cabecera en `/health` aprobada. Falta evaluar la URL real que sirve React con SecurityHeaders; objetivo A o superior. |
| A03 Cadena de suministro | Lockfiles, `npm ci`, `.github/dependabot.yml`, pipeline | Audit local en `npm-audit-*.json`; sin hallazgos altos o críticos después de actualizar. Siete moderados backend; ninguno frontend. CI no se ha ejecutado en GitHub. |
| A04 Criptografía | bcrypt en `services/business.js`; AES-GCM y SHA-256 en `services/crypto.js`; secretos en `.env.example` | Pruebas de IV nuevo, descifrado y alteración aprobadas. La prueba de integración consulta PostgreSQL directamente y confirma que nombre, correo, título, contenido y sesión no aparecen legibles. Conexión a Supabase con TLS. No almacenar capturas de datos sensibles. |
| A05 Inyección y XSS | Zod en `validators/schemas.js`, Sequelize y renderizado React | Entradas pasan por esquemas; Sequelize construye consultas; React escapa texto. Falta prueba manual con cargas de ejemplo en la app completa. |
| A06 Diseño inseguro | Límites en `services/business.js` y `validators/schemas.js`; amenazas abajo | 100 notas y 10 000 caracteres por nota. La comprobación de cantidad no es atómica entre solicitudes simultáneas: pendiente mejorar para alta concurrencia. |
| A07 Identificación y autenticación | bcrypt, bloqueo progresivo en business; rate limit en routes; regeneración en controllers | Costo 12 y límite de bytes; bloqueo progresivo después de cinco fallos, 429 al intentar durante bloqueo o exceder límite IP. La sesión se regenera al iniciar sesión (cubierto por la prueba de integración). Falta demostrar el 429 sobre la URL de producción. |
| A08 Integridad de software | `.github/workflows/ci.yml`, lockfiles | Pipeline de pruebas y audit preparado. Deploy condicionado aún no implementado ni ejecutado. No usa JWT ni scripts CDN. |
| A09 Logs y alertas | `services/business.js`, `models/index.js`, `app.js` | Eventos en base y logs JSON; alerta local tras cinco fallos para cuenta existente. Alerta externa y pruebas de retención pendientes. |
| A10 Condiciones excepcionales | `app.js` y `server.js` | Errores públicos genéricos, timeouts HTTP y cierre controlado. Falta prueba de excepción simulada en integración y análisis de monitoreo en producción. |

## Flujo de datos

Navegador → Vercel (HTTPS, React y cabeceras de seguridad) → rewrite de `/api` → Render (API Express) → Supabase (PostgreSQL por TLS). Como el navegador solo habla con el dominio de Vercel, la cookie de sesión es de primer origen. No hay proveedor de correo en producción (Render gratis bloquea SMTP). El navegador recibe cookies de sesión HttpOnly; las operaciones de cambio incluyen un token CSRF. En desarrollo, Vite redirige las llamadas API al backend.

## Amenazas y límites

| Amenaza | Mitigación | Limitación |
|---|---|---|
| Usuario accede a nota ajena | Consultas incluyen `userId` y nota | Cubierto por la prueba de integración con PostgreSQL; falta evidencia con administrador. |
| Robo de base | bcrypt y AES-256-GCM; token de recuperación con hash | Si también se roba la llave, los datos se pueden descifrar. |
| Fuerza bruta | Límite por IP y bloqueo por cuenta | El límite por IP está en memoria, no es compartido entre instancias; el bloqueo de cuenta puede ser explotado para denegación de servicio. |
| CSRF | Token de sesión y cookie SameSite | Requiere verificar cookies y comportamiento de la topología final. |
| Inyección/XSS | Validación, Sequelize y renderizado por React, CSP | Falta ejecutar pruebas integrales en navegador. |
| Pérdida de disponibilidad | Timeouts y cierre controlado | Sin URL, copia de seguridad probada, monitoreo externo o recuperación de desastres. |

## Hash, cifrado y HMAC

Contraseña: hash bcrypt con sal, no reversible. Token de recuperación: SHA-256 porque es aleatorio y de alta entropía; solo se conserva el hash. Nombre, correo, título y contenido de notas, teléfono y datos de sesión: AES-256-GCM porque se requiere recuperar su contenido; cada operación usa IV aleatorio de 12 bytes y etiqueta de 16 bytes (formato `v<versión>:<iv>:<tag>:<cifrado>` en las columnas `*_enc`). Como un correo cifrado con IV aleatorio no se puede buscar, se guarda además `email_hash`: HMAC-SHA256 del correo normalizado con una llave derivada por HKDF de la llave maestra (distinta de la de cifrado). Ese índice ciego permite iniciar sesión y exigir correos únicos sin guardar el correo legible; no se usa para contraseñas, que siguen con bcrypt. La migración `202611250002-encrypt-pii` cifra los datos existentes, elimina las columnas en texto claro y es reversible.

La pérdida de la llave impide descifrar los datos. El campo de versión permite diseñar una rotación, pero el servicio actual solo acepta una llave activa; la rotación y el manejo multillave no están implementados. La recuperación usa un token aleatorio de 32 bytes, 15 minutos de vigencia, un solo uso y transacción para cambio de contraseña, consumo de tokens e invalidación de sesiones.

## Verificado en producción

- HTTPS en Vercel y Render; `/health` responde a través del rewrite Vercel → Render.
- Cabeceras presentes en la respuesta del frontend: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options y Referrer-Policy.
- La cookie de sesión no es legible desde JavaScript (HttpOnly).
- Migraciones `202611250001-initial` y `202611250002-encrypt-pii` ejecutadas en Supabase durante el build de Render.
- En la tabla `users` de Supabase, nombre y correo aparecen solo cifrados (`v1:…`) y la contraseña como `$2b$12$…`.
- Despliegue automático en Render configurado como «After CI Checks Pass»; el CI de GitHub Actions pasa en `main`.

## Pendientes de producción

- Ejecutar OWASP ZAP Baseline, securityheaders.com y SSL Labs sobre la URL de producción y adjuntar los resultados.
- Demostrar el 429 del login y el bloqueo progresivo en producción.
- Verificar la conexión a Supabase con el certificado CA (`DB_SSL_CA`); hoy se exige TLS sin verificar el certificado (`DB_SSL=true`).
- Correo de recuperación: el token se genera, pero no se envía (sin proveedor de correo). Riesgo residual documentado.
- Respaldos de la base: dependen del plan de Supabase.
