// Crea las tablas, restricciones y relaciones de SecureVault.
'use strict';
module.exports = {
 async up(q, S) {
  const id = { type: S.UUID, primaryKey: true, allowNull: false };
  const timestamps = { created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false } };
  await q.createTable('users', { id, name: { type: S.STRING(100), allowNull: false }, email: { type: S.STRING(254), allowNull: false, unique: true }, password_hash: { type: S.STRING(100), allowNull: false }, role: { type: S.ENUM('usuario', 'administrador'), allowNull: false, defaultValue: 'usuario' }, phone_cipher: S.TEXT, phone_iv: S.STRING(32), phone_tag: S.STRING(32), phone_key_version: S.INTEGER, failed_attempts: { type: S.INTEGER, allowNull: false, defaultValue: 0 }, locked_until: S.DATE, ...timestamps });
  await q.createTable('notes', { id, user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }, title: { type: S.STRING(150), allowNull: false }, content_cipher: { type: S.TEXT, allowNull: false }, content_iv: { type: S.STRING(32), allowNull: false }, content_tag: { type: S.STRING(32), allowNull: false }, key_version: { type: S.INTEGER, allowNull: false }, ...timestamps });
  await q.addIndex('notes', ['user_id']);
  await q.createTable('sessions', { sid: { type: S.STRING(128), primaryKey: true }, user_id: { type: S.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }, data: { type: S.TEXT, allowNull: false }, expires_at: { type: S.DATE, allowNull: false } });
  await q.addIndex('sessions', ['expires_at']);
  await q.createTable('password_reset_tokens', { id, user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }, token_hash: { type: S.STRING(64), allowNull: false, unique: true }, expires_at: { type: S.DATE, allowNull: false }, used_at: S.DATE, ...timestamps });
  await q.addIndex('password_reset_tokens', ['user_id', 'expires_at']);
  await q.createTable('security_events', { id, user_id: { type: S.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' }, event_type: { type: S.STRING(60), allowNull: false }, result: { type: S.STRING(32), allowNull: false }, details: S.STRING(255), ...timestamps });
  await q.addIndex('security_events', ['created_at']);
 },
 async down(q) { for (const name of ['security_events', 'password_reset_tokens', 'sessions', 'notes', 'users']) await q.dropTable(name); if (q.sequelize.getDialect() === 'postgres') await q.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";'); }
};
