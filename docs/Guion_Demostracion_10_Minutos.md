# Guion de demostración — 10 minutos

Aplicación publicada en https://jj-securevault.vercel.app (abrir antes https://jj-securevault-api.onrender.com/health para despertar el plan gratuito). No usar datos reales. Mantener credenciales fuera de la presentación.

1. **Minuto 0–1:** mostrar la URL HTTPS, explicar la arquitectura y `/health`.
2. **Minuto 1–3:** crear una cuenta y una nota; enseñar la lista de notas. Mostrar en el Table Editor de Supabase que nombre, correo, título y contenido están cifrados (`v1:…`) y la contraseña es un hash `$2b$`, ocultando valores sensibles.
3. **Minuto 3–5:** con dos sesiones, intentar leer, editar y borrar la nota de otra cuenta usando el ID y un cliente de prueba; mostrar las respuestas 404. Repetir la lectura con un administrador.
4. **Minuto 5–6:** cerrar sesión; repetir una solicitud protegida con la cookie anterior en una herramienta privada y mostrar 401 sin enseñar la cookie.
5. **Minuto 6–7:** producir intentos fallidos con una cuenta de prueba; mostrar el bloqueo y HTTP 429. Evitar mostrar contraseñas.
6. **Minuto 7–8:** cambiar el teléfono y mostrar la respuesta enmascarada. Solicitar y usar un enlace de recuperación, sin mostrar el token en pantalla.
7. **Minuto 8–9:** con administrador, enseñar bitácora y cambiar el rol de una cuenta de prueba.
8. **Minuto 9–10:** mostrar resultados reales de CI, `npm audit`, SecurityHeaders, SSL Labs y ZAP; mencionar riesgos y pruebas pendientes.

Preparar las cuentas con anticipación. Compartir las credenciales con el profesor únicamente por canal privado.
