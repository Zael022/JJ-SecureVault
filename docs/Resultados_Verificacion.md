# Resultados de verificación

Fecha: 25 de noviembre de 2026. Entorno: Linux, Node.js 24.22.3 y npm 11.19.1. Los comandos siguientes se ejecutaron desde la raíz `JJ-SecureVault`. Estos resultados no sustituyen las pruebas en Windows ni en producción.

| Comando | Resultado observado |
|---|---|
| `npm ci --prefix backend --no-audit --no-fund` | Completado, 296 paquetes instalados. npm mostró advertencias de dependencias obsoletas y de revisión de scripts de instalación. |
| `npm ci --prefix frontend --no-audit --no-fund` | Completado, 153 paquetes instalados. npm mostró advertencias de versión y de revisión de scripts de instalación. |
| `npm run lint --prefix backend` | Aprobado, sin errores. |
| `npm test --prefix backend` | 6 pruebas aprobadas, 0 fallos, contra PostgreSQL 16 (local y GitHub Actions). Incluye acceso ajeno, cierre de sesión y verificación de que la base no contiene datos personales legibles. |
| `npm run lint --prefix frontend` | Aprobado, sin errores. |
| `npm run build --prefix frontend` | Aprobado; Vite construyó 47 módulos. |
| `npm audit --prefix backend --json` | 7 moderadas, 0 altas y 0 críticas. Véase `npm-audit-backend.json`. Incluyen dependencias transitivas asociadas a sequelize-cli y uuid/Sequelize; evaluar soluciones compatibles antes de producción. |
| `npm audit --prefix frontend --json` | 0 vulnerabilidades. Véase `npm-audit-frontend.json`. |

## No ejecutado

- Resultados de ZAP, securityheaders.com y SSL Labs sobre la URL de producción (pendientes de ejecutar).
- Ejecución en Windows, entrega real de correo, validación funcional en navegador con base de datos, pruebas de administrador contra notas ajenas, 429 y excepción simulada.
- Pipeline en GitHub, publicación, TLS y pruebas SecurityHeaders, SSL Labs y ZAP: no se cuenta con repositorio, cuenta de despliegue ni URL pública conectados a este trabajo.

El pipeline de GitHub Actions ejecuta lint, migraciones `up → down → up`, pruebas, build y `npm audit` con PostgreSQL 16, y pasa en `main`. Render despliega solo después de que el CI pasa. La migración de cifrado `202611250002-encrypt-pii` se probó además de ida y vuelta con datos en texto claro: cifra, elimina las columnas legibles y, al revertirse, recupera los valores originales.
