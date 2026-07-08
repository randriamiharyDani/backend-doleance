const { pool } = require('../config/database');

const create = async ({ id_utilisateur, action, entity_type, entity_id, adresse_ip, user_agent }) => {
  const [result] = await pool.execute(
    'INSERT INTO logs_activites (id_utilisateur, action, entity_type, entity_id, adresse_ip, user_agent, date_action) VALUES (?, ?, ?, ?, ?, ?, NOW())',
    [id_utilisateur || null, action, entity_type || null, entity_id || null, adresse_ip || null, user_agent || null]
  );
  return result.insertId;
};

const findByUser = async (id_utilisateur, { page = 1, limit = 50 }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const [rows] = await pool.execute(
    'SELECT * FROM logs_activites WHERE id_utilisateur = ? ORDER BY date_action DESC LIMIT ? OFFSET ?',
    [id_utilisateur, Number(limit), offset]
  );
  return rows;
};

const countByUser = async (id_utilisateur) => {
  const [rows] = await pool.execute('SELECT COUNT(*) as total FROM logs_activites WHERE id_utilisateur = ?', [id_utilisateur]);
  return rows[0].total;
};

const deleteByUser = async (id_utilisateur) => {
  await pool.execute('DELETE FROM logs_activites WHERE id_utilisateur = ?', [id_utilisateur]);
};

module.exports = { create, findByUser, countByUser, deleteByUser };
