// Configura el acceso a PostgreSQL (Supabase en producción) usando variables de entorno.
require('dotenv').config();
// Con DB_SSL_CA se verifica el certificado del servidor; con DB_SSL=true sin CA solo se exige TLS (no recomendado en producción).
const ssl = process.env.DB_SSL_CA ? { require: true, ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true } : process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined;
const settings = { username: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), dialect: 'postgres', logging: false, dialectOptions: { ...(ssl ? { ssl } : {}), connectionTimeoutMillis: 10000, statement_timeout: 15000 }, pool: { max: 5, min: 0, acquire: 15000, idle: 10000 } };
module.exports = { development: settings, production: settings, test: settings };
