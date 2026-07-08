const { pool } = require('../config/database');

const findAll = async () => {
  const [rows] = await pool.execute('SELECT * FROM roles ORDER BY id_role');
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM roles WHERE id_role = ?', [id]);
  return rows;
};

const findByNom = async (nom) => {
  const [rows] = await pool.execute('SELECT id_role FROM roles WHERE nom_role = ?', [nom]);
  return rows;
};

const findByNomExcluding = async (nom, excludeId) => {
  const [rows] = await pool.execute('SELECT id_role FROM roles WHERE nom_role = ? AND id_role != ?', [nom, excludeId]);
  return rows;
};

const create = async ({ nom_role, description, permissions, is_system }) => {
  const [result] = await pool.execute(
    'INSERT INTO roles (nom_role, description, permissions, is_system) VALUES (?, ?, ?, ?)',
    [nom_role, description || null, permissions || null, is_system || false]
  );
  return result.insertId;
};

const update = async (id, { nom_role, description, permissions }) => {
  await pool.execute(
    'UPDATE roles SET nom_role = ?, description = ?, permissions = ? WHERE id_role = ?',
    [nom_role, description, permissions, id]
  );
};

const updatePermissions = async (id, permissions) => {
  await pool.execute('UPDATE roles SET permissions = ? WHERE id_role = ?', [permissions, id]);
};

const deleteById = async (id) => {
  await pool.execute('DELETE FROM roles WHERE id_role = ?', [id]);
};

const countUsersByRole = async (id) => {
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM utilisateurs WHERE id_role = ?', [id]);
  return rows[0].count;
};

const getSystemStatus = async (id) => {
  const [rows] = await pool.execute('SELECT nom_role, is_system FROM roles WHERE id_role = ?', [id]);
  return rows;
};

const getPermissionsByUserId = async (id_utilisateur) => {
  const [rows] = await pool.execute(
    `SELECT r.permissions FROM utilisateurs u JOIN roles r ON u.id_role = r.id_role WHERE u.id_utilisateur = ?`,
    [id_utilisateur]
  );
  return rows;
};

module.exports = { findAll, findById, findByNom, findByNomExcluding, create, update, updatePermissions, deleteById, countUsersByRole, getSystemStatus, getPermissionsByUserId };
