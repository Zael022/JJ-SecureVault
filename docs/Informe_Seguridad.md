# Informe de seguridad y matriz OWASP 2025

Estado: implementación para una práctica académica. Los controles indicados como pendientes requieren ejecución real con MySQL o una publicación propia. No se asigna calificación a pruebas no realizadas.

| Categoría del laboratorio | Control y archivo | Evidencia y estado |
|---|---|---|
| A01 Control de acceso | Roles en `backend/src/middlewares/security.js`; propiedad en `services/business.js` | Existe prueba de integración con dos usuarios para lectura, edición y borrado ajeno y logout. Pendiente ejecutar con MySQL; prueba con administrador pendiente. |
| A02 Configuración | Helmet, CSP, CORS y X-Powered-By en `backend/src/app.js` | Prueba local de cabecera en `/health` aprobada. Falta evaluar la URL real que sirve React con SecurityHeaders; objetivo A o superior. |
| A03 Cadena de suministro | Lockfiles, `npm ci`, `.github/dependabot.yml`, pipeline | Audit local en `npm-audit-*.json`; sin hallazgos altos o críticos después de actualizar. Siete moderados backend; ninguno frontend. CI no se ha ejecutado en GitHub. |
| A04 Criptografía | bcrypt en `services/business.js`; AES-GCM y SHA-256 en `services/crypto.js`; secretos en `.env.example` | Pruebas de IV nuevo, descifrado y alteración aprobadas. La prueba de integración consulta PostgreSQL directamente y confirma que nombre, correo, título, contenido y sesión no aparecen legibles. Conexión a Supabase con TLS. No almacenar capturas de datos sensibles. |
| A05 Inyección y XSS | Zod en `validators/schemas.js`, Sequelize y renderizado React | Entradas pasan por esquemas; Sequelize construye consultas; React escapa texto. Falta prueba manual con cargas de ejemplo en la app completa. |
| A06 Diseño inseguro | Límites en `services/business.js` y `validators/schemas.js`; amenazas abajo | 100 notas y 10 000 caracteres por nota. La comprobación de cantidad no es atómica entre solicitudes simultáneas: pendiente mejorar para alta concurrencia. |
| A07 Identificación y autenticación | bcrypt, bloqueo progresivo en business; rate limit en routes; regeneración en controllers | Costo 12 y límite de bytes; bloqueo progresivo después de cinco fallos, 429 al intentar durante bloqueo o exceder límite IP. Falta demostrar 429 y sesión regenerada con MySQL real. |
| A08 Integridad de software | `.github/workflows/ci.yml`, lockfiles | Pipeline de pruebas y audit preparado. Deploy condicionado aún no implementado ni ejecutado. No usa JWT ni scripts CDN. |
| A09 Logs y alertas | `services/business.js`, `models/index.js`, `app.js` | Eventos en base y logs JSON; alerta local tras cinco fallos para cuenta existente. Alerta externa y pruebas de retención pendientes. |
| A10 Condiciones excepcionales | `app.js` y `server.js` | Errores públicos genéricos, timeouts HTTP y cierre controlado. Falta prueba de excepción simulada en integración y análisis de monitoreo en producción. |

## Flujo de datos

Navegador → proxy HTTPS → React y API Express → MySQL. La API habla con un servicio SMTP para enviar enlaces. El navegador recibe cookies de sesión HttpOnly; las operaciones de cambio incluyen un token CSRF. En desarrollo, Vite redirige las llamadas API al backend.

## Amenazas y límites

| Amenaza | Mitigación | Limitación |
|---|---|---|
| Usuario accede a nota ajena | Consultas incluyen `userId` y nota | Falta evidencia con MySQL y administrador. |
| Robo de base | bcrypt y AES-256-GCM; token de recuperación con hash | Si también se roba la llave, los datos se pueden descifrar. |
| Fuerza bruta | Límite por IP y bloqueo por cuenta | El límite por IP está en memoria, no es compartido entre instancias; el bloqueo de cuenta puede ser explotado para denegación de servicio. |
| CSRF | Token de sesión y cookie SameSite | Requiere verificar cookies y comportamiento de la topología final. |
| Inyección/XSS | Validación, Sequelize y renderizado por React, CSP | Falta ejecutar pruebas integrales en navegador. |
| Pérdida de disponibilidad | Timeouts y cierre controlado | Sin URL, copia de seguridad probada, monitoreo externo o recuperación de desastres. |

## Hash, cifrado y HMAC

Contraseña: hash bcrypt con sal, no reversible. Token de recuperación: SHA-256 porque es aleatorio y de alta entropía; solo se conserva el hash. Nombre, correo, título y contenido de notas, teléfono y datos de sesión: AES-256-GCM porque se requiere recuperar su contenido; cada operación usa IV aleatorio de 12 bytes y etiqueta de 16 bytes (formato `v<versión>:<iv>:<tag>:<cifrado>` en las columnas `*_enc`). Como un correo cifrado con IV aleatorio no se puede buscar, se guarda además `email_hash`: HMAC-SHA256 del correo normalizado con una llave derivada por HKDF de la llave maestra (distinta de la de cifrado). Ese índice ciego permite iniciar sesión y exigir correos únicos sin guardar el correo legible; no se usa para contraseñas, que siguen con bcrypt. La migración `202611250002-encrypt-pii` cifra los datos existentes, elimina las columnas en texto claro y es reversible.

La pérdida de la llave impide descifrar los datos. El campo de versión permite diseñar una rotación, pero el servicio actual solo acepta una llave activa; la rotación y el manejo multillave no están implementados. La recuperación usa un token aleatorio de 32 bytes, 15 minutos de vigencia, un solo uso y transacción para cambio de contraseña, consumo de tokens e invalidación de sesiones.

## Pendientes de producción

Verificar HTTPS/TLS, certificados, redirección, `trust proxy`, CSRF, SMTP, base protegida y backups; probar SecurityHeaders, SSL Labs y ZAP Baseline sobre una URL propia; corregir todos los hallazgos pertinentes; conectar CI y deploy. Los resultados locales no prueban que el sistema sea seguro en producción.
