# Instrucciones para trabajar en SecureVault

- Conservar los cambios del equipo y revisar el estado del repositorio antes de editar.
- No añadir carpetas nuevas a la raíz de `frontend/src` o `backend/src`.
- Usar React y JSX; Express, PostgreSQL, Sequelize y migraciones; no usar `sequelize.sync()`.
- Crear cambios de base mediante migraciones reversibles y reflejarlos en modelos.
- Mantener controladores delgados, validación en validators y lógica en services.
- Validar el propietario en las consultas de lectura, edición y borrado de notas.
- Nunca guardar ni registrar contraseñas, tokens, cookies, notas o teléfonos en texto claro.
- Usar bcrypt costo 12 y validar 72 bytes; usar AES-256-GCM con IV nuevo por operación.
- Mantener CSRF, sesiones de servidor, roles, límites y errores públicos genéricos.
- No inventar resultados de pruebas, URLs, despliegues, capturas o commits.
- No agregar secretos, `.env`, `node_modules` ni bases reales al repositorio o al ZIP.
- Ejecutar lint, pruebas y build; reportar limitaciones de forma explícita.
- Antes de deshacer migraciones, comprobar que la base sea una base de prueba vacía.
