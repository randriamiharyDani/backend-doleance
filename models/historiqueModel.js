const { pool } = require('../config/database');

const findByDoleanceId = async (id_doleance) => {
  const [rows] = await pool.execute(
    `SELECT h.date_changement, h.commentaire,
            s_ancien.nom_statut as ancien_statut,
            s_nouveau.nom_statut as nouveau_statut
     FROM historique_statuts h
     LEFT JOIN statuts s_ancien ON h.id_statut_ancien = s_ancien.id_statut
     LEFT JOIN statuts s_nouveau ON h.id_statut_nouveau = s_nouveau.id_statut
     WHERE h.id_doleance = ?
     ORDER BY h.date_changement ASC`,
    [id_doleance]
  );
  return rows;
};

const findByDoleanceIdSimple = async (id_doleance) => {
  const [rows] = await pool.execute(
    'SELECT date_changement, commentaire FROM historique_statuts WHERE id_doleance = ? ORDER BY date_changement ASC',
    [id_doleance]
  );
  return rows;
};

const create = async (connection, { id_doleance, id_statut_ancien, id_statut_nouveau, commentaire }) => {
  await connection.execute(
    `INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire, date_changement) 
     VALUES (?, ?, ?, ?, NOW())`,
    [id_doleance, id_statut_ancien || null, id_statut_nouveau, commentaire]
  );
};

const createDirect = async ({ id_doleance, id_statut_ancien, id_statut_nouveau, commentaire }) => {
  await pool.execute(
    `INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire, date_changement) 
     VALUES (?, ?, ?, ?, NOW())`,
    [id_doleance, id_statut_ancien || null, id_statut_nouveau, commentaire]
  );
};

const createSimple = async (id_doleance, commentaire) => {
  await pool.execute(
    `INSERT INTO historique_statuts (id_doleance, commentaire, date_changement) 
     VALUES (?, ?, NOW())`,
    [id_doleance, commentaire]
  );
};

module.exports = { findByDoleanceId, findByDoleanceIdSimple, create, createDirect, createSimple };
