# Resultados de verificación

Fecha: 25 de noviembre de 2026. Entorno: Linux, Node.js 24.22.3 y npm 11.19.1. Los comandos siguientes se ejecutaron desde la raíz `JJ-SecureVault`. Estos resultados no sustituyen las pruebas en Windows ni en producción.

| Comando | Resultado observado |
|---|---|
| `npm ci --prefix backend --no-audit --no-fund` | Completado, 296 paquetes instalados. npm mostró advertencias de dependencias obsoletas y de revisión de scripts de instalación. |
| `npm ci --prefix frontend --no-audit --no-fund` | Completado, 153 paquetes instalados. npm mostró advertencias de versión y de revisión de scripts de instalación. |
| `npm run lint --prefix backend` | Aprobado, sin errores. |
| `npm test --prefix backend` | 4 pruebas aprobadas, 0 fallos y 1 omitida. La omitida requiere MySQL y prueba acceso ajeno y cierre de sesión. |
| `npm run lint --prefix frontend` | Aprobado, sin errores. |
| `npm run build --prefix frontend` | Aprobado; Vite construyó 47 módulos. |
| `npm audit --prefix backend --json` | 7 moderadas, 0 altas y 0 críticas. Véase `npm-audit-backend.json`. Incluyen dependencias transitivas asociadas a sequelize-cli y uuid/Sequelize; evaluar soluciones compatibles antes de producción. |
| `npm audit --prefix frontend --json` | 0 vulnerabilidades. Véase `npm-audit-frontend.json`. |

## No ejecutado

- Migraciones `up → down → up` ni pruebas de integración completas: MySQL y Docker no estaban disponibles en este entorno.
- Ejecución en Windows, entrega real de correo, validación funcional en navegador con base de datos, pruebas de administrador contra notas ajenas, 429 y excepción simulada.
- Pipeline en GitHub, publicación, TLS y pruebas SecurityHeaders, SSL Labs y ZAP: no se cuenta con repositorio, cuenta de despliegue ni URL pública conectados a este trabajo.

El pipeline está preparado para probar MySQL de manera aislada cuando se ejecute en GitHub. Se debe revisar su resultado real, corregir cualquier error y configurar el paso de publicación para que dependa de ese resultado.
