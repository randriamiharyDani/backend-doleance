const { pool } = require('../config/database');

const findAll = async () => {
  const [rows] = await pool.execute(`
    SELECT d.*,
           COUNT(DISTINCT s.id_service) as total_services,
           COUNT(DISTINCT u.id_utilisateur) as total_agents,
           COUNT(DISTINCT dl.id_doleance) as total_doleances
    FROM directions d
    LEFT JOIN services s ON d.id_direction = s.id_direction
    LEFT JOIN utilisateurs u ON d.id_direction = u.id_direction
    LEFT JOIN doleances dl ON d.id_direction = dl.id_direction
    GROUP BY d.id_direction
    ORDER BY d.categorie, d.nom_direction
  `);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM directions WHERE id_direction = ?', [id]);
  return rows;
};

const findByIdWithCounts = async (id) => {
  const [rows] = await pool.execute(`
    SELECT d.*,
           COUNT(DISTINCT s.id_service) as total_services,
           COUNT(DISTINCT u.id_utilisateur) as total_agents
    FROM directions d
    LEFT JOIN services s ON d.id_direction = s.id_direction
    LEFT JOIN utilisateurs u ON d.id_direction = u.id_direction
    WHERE d.id_direction = ?
    GROUP BY d.id_direction
  `, [id]);
  return rows;
};

const create = async ({ nom_direction, description, categorie, email, telephone, responsable }) => {
  const [result] = await pool.execute(
    'INSERT INTO directions (nom_direction, description, categorie, email, telephone, responsable) VALUES (?, ?, ?, ?, ?, ?)',
    [nom_direction, description, categorie, email, telephone, responsable]
  );
  return result.insertId;
};

const update = async (id, fields) => {
  const updates = Object.keys(fields).map(k => `${k} = ?`);
  const values = Object.values(fields);
  await pool.execute(
    `UPDATE directions SET ${updates.join(', ')} WHERE id_direction = ?`,
    [...values, id]
  );
};

const deleteById = async (id) => {
  await pool.execute('DELETE FROM directions WHERE id_direction = ?', [id]);
};

const countAll = async () => {
  const [rows] = await pool.execute('SELECT COUNT(*) as total FROM directions');
  return rows[0].total;
};

const countAgents = async () => {
  const [rows] = await pool.execute(
    `SELECT d.nom_direction, COUNT(u.id_utilisateur) as total_agents
     FROM directions d LEFT JOIN utilisateurs u ON d.id_direction = u.id_direction AND u.actif = 1
     GROUP BY d.id_direction ORDER BY total_agents DESC LIMIT 5`
  );
  return rows;
};

const countDoleances = async () => {
  const [rows] = await pool.execute(
    `SELECT d.nom_direction, COUNT(dl.id_doleance) as total_doleances
     FROM directions d LEFT JOIN doleances dl ON d.id_direction = dl.id_direction
     GROUP BY d.id_direction ORDER BY total_doleances DESC LIMIT 5`
  );
  return rows;
};

const countByCategorie = async () => {
  const [rows] = await pool.execute(
    `SELECT categorie, COUNT(*) as count FROM directions GROUP BY categorie ORDER BY count DESC`
  );
  return rows;
};

const countServices = async (id_direction) => {
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM services WHERE id_direction = ?', [id_direction]);
  return rows[0].count;
};

const countUsers = async (id_direction) => {
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM utilisateurs WHERE id_direction = ?', [id_direction]);
  return rows[0].count;
};

const findAllWithStats = async () => {
  const [rows] = await pool.execute(`
    SELECT d.*,
      (SELECT COUNT(*) FROM doleances WHERE id_direction = d.id_direction) as total_doleances,
      (SELECT COUNT(*) FROM doleances WHERE id_direction = d.id_direction AND id_statut = 1) as nouvelles,
      (SELECT COUNT(*) FROM doleances WHERE id_direction = d.id_direction AND id_statut = 2) as en_attente,
      (SELECT COUNT(*) FROM doleances WHERE id_direction = d.id_direction AND id_statut IN (3, 4)) as en_cours,
      (SELECT COUNT(*) FROM doleances WHERE id_direction = d.id_direction AND id_statut IN (5, 6)) as resolues,
      (SELECT COUNT(*) FROM utilisateurs WHERE id_direction = d.id_direction) as total_agents,
      (SELECT COUNT(*) FROM services WHERE id_direction = d.id_direction) as total_services
    FROM directions d
    ORDER BY d.nom_direction
  `);
  return rows;
};

module.exports = { findAll, findById, findByIdWithCounts, create, update, deleteById, countAll, countAgents, countDoleances, countByCategorie, countServices, countUsers, findAllWithStats };
