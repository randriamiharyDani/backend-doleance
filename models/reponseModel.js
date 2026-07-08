const { pool } = require('../config/database');

const findByDoleanceId = async (id_doleance) => {
  const [rows] = await pool.execute(
    'SELECT id_reponse, message, date_reponse FROM reponses WHERE id_doleance = ? ORDER BY date_reponse ASC',
    [id_doleance]
  );
  return rows;
};

const create = async ({ id_doleance, id_utilisateur, message }) => {
  await pool.execute(
    `INSERT INTO reponses (id_doleance, id_utilisateur, message, date_reponse) 
     VALUES (?, ?, ?, NOW())`,
    [id_doleance, id_utilisateur, message]
  );
};

module.exports = { findByDoleanceId, create };
