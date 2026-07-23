const { pool } = require('../config/database');

const findByDoleanceId = async (id_doleance, { includeInternal = true } = {}) => {
  const internalFilter = includeInternal ? '' : ' AND r.est_interne = 0';
  const [rows] = await pool.execute(
    `SELECT r.id_reponse, r.message, r.date_reponse, r.est_interne, r.id_utilisateur, r.id_citoyen,
            CASE 
              WHEN r.id_utilisateur IS NOT NULL THEN CONCAT(u.prenom, ' ', u.nom)
              WHEN r.id_citoyen IS NOT NULL THEN CONCAT(c.prenom, ' ', c.nom)
              ELSE 'Agent'
            END AS auteur,
            CASE 
              WHEN r.id_utilisateur IS NOT NULL THEN 'agent'
              WHEN r.id_citoyen IS NOT NULL THEN 'citoyen'
              ELSE 'agent'
            END AS type_auteur
     FROM reponses r
     LEFT JOIN utilisateurs u ON r.id_utilisateur = u.id_utilisateur
     LEFT JOIN citoyens c ON r.id_citoyen = c.id_citoyen
     WHERE r.id_doleance = ?${internalFilter}
     ORDER BY r.date_reponse ASC`,
    [id_doleance]
  );
  return rows;
};

const create = async ({ id_doleance, id_utilisateur, message, est_interne = false }) => {
  await pool.execute(
    `INSERT INTO reponses (id_doleance, id_utilisateur, message, est_interne, date_reponse) 
     VALUES (?, ?, ?, ?, NOW())`,
    [id_doleance, id_utilisateur, message, est_interne ? 1 : 0]
  );
};

const createByCitizen = async ({ id_doleance, id_citoyen, message }) => {
  await pool.execute(
    `INSERT INTO reponses (id_doleance, id_citoyen, message, est_interne, date_reponse) 
     VALUES (?, ?, ?, 0, NOW())`,
    [id_doleance, id_citoyen, message]
  );
};

module.exports = { findByDoleanceId, create, createByCitizen };
