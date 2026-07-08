const { pool } = require('../config/database');

const findAll = async () => {
  const [rows] = await pool.execute(`
    SELECT s.*, d.nom_direction as direction_nom, d.categorie as direction_categorie
    FROM services s
    LEFT JOIN directions d ON s.id_direction = d.id_direction
    ORDER BY d.nom_direction, s.nom_service
  `);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(`
    SELECT s.*, d.nom_direction as direction_nom
    FROM services s
    LEFT JOIN directions d ON s.id_direction = d.id_direction
    WHERE s.id_service = ?
  `, [id]);
  return rows;
};

const findByIdBasic = async (id) => {
  const [rows] = await pool.execute('SELECT id_service, nom_service FROM services WHERE id_service = ?', [id]);
  return rows;
};

const findByDirection = async (id_direction) => {
  const [rows] = await pool.execute('SELECT * FROM services WHERE id_direction = ? ORDER BY nom_service', [id_direction]);
  return rows;
};

const create = async ({ id_direction, nom_service, description, email, telephone, responsable }) => {
  const [result] = await pool.execute(
    'INSERT INTO services (id_direction, nom_service, description, email, telephone, responsable) VALUES (?, ?, ?, ?, ?, ?)',
    [id_direction, nom_service, description || null, email || null, telephone || null, responsable || null]
  );
  return result.insertId;
};

const update = async (id, fields) => {
  const updates = Object.keys(fields).map(k => `${k} = ?`);
  const values = Object.values(fields);
  await pool.execute(
    `UPDATE services SET ${updates.join(', ')} WHERE id_service = ?`,
    [...values, id]
  );
};

const deleteById = async (id) => {
  await pool.execute('DELETE FROM services WHERE id_service = ?', [id]);
};

const countByDirection = async (id_direction) => {
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM services WHERE id_direction = ?', [id_direction]);
  return rows[0].count;
};

const countAll = async () => {
  const [rows] = await pool.execute('SELECT COUNT(*) as total_services FROM services');
  return rows[0].total_services;
};

module.exports = { findAll, findById, findByIdBasic, findByDirection, create, update, deleteById, countByDirection, countAll };
