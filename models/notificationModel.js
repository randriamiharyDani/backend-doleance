const { pool } = require('../config/database');

const findByUser = async (id_utilisateur) => {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE id_destinataire = ? ORDER BY date_notification DESC',
    [id_utilisateur]
  );
  return rows;
};

const findRecentByUser = async (id_utilisateur, limit = 50) => {
  const [rows] = await pool.execute(
    `SELECT n.*, d.reference as doleance_reference, d.titre as doleance_titre
     FROM notifications n
     LEFT JOIN doleances d ON n.id_doleance = d.id_doleance
     WHERE n.id_destinataire = ?
     ORDER BY n.date_notification DESC LIMIT ?`,
    [id_utilisateur, String(limit)]
  );
  return rows;
};

const countUnreadByUser = async (id_utilisateur) => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as count FROM notifications WHERE id_destinataire = ? AND lu = 0',
    [id_utilisateur]
  );
  return rows[0]?.count || 0;
};

const create = async ({ id_destinataire, id_doleance, type, titre, message, donnees }) => {
  const [result] = await pool.execute(
    'INSERT INTO notifications (id_destinataire, id_doleance, type, titre, message, donnees) VALUES (?, ?, ?, ?, ?, ?)',
    [id_destinataire, id_doleance || null, type || null, titre, message, donnees ? JSON.stringify(donnees) : null]
  );
  return result.insertId;
};

const markAsRead = async (id_notification, id_utilisateur) => {
  await pool.execute(
    'UPDATE notifications SET lu = 1, lu_le = NOW() WHERE id_notification = ? AND id_destinataire = ?',
    [id_notification, id_utilisateur]
  );
};

const markAllAsRead = async (id_utilisateur) => {
  await pool.execute(
    'UPDATE notifications SET lu = 1, lu_le = NOW() WHERE id_destinataire = ? AND lu = 0',
    [id_utilisateur]
  );
};

const deleteById = async (id_notification, id_utilisateur) => {
  await pool.execute('DELETE FROM notifications WHERE id_notification = ? AND id_destinataire = ?', [id_notification, id_utilisateur]);
};

const findUtilisateursByDirection = async (id_direction) => {
  const [rows] = await pool.execute(
    'SELECT id_utilisateur FROM utilisateurs WHERE id_direction = ? AND actif = 1',
    [id_direction]
  );
  return rows;
};

const findAdminIds = async () => {
  const [rows] = await pool.execute(
    `SELECT id_utilisateur FROM utilisateurs
     WHERE id_role IN (SELECT id_role FROM roles WHERE nom_role IN ('administrateur_systeme', 'administrateur', 'agent_central'))`
  );
  return rows;
};

module.exports = { findByUser, findRecentByUser, countUnreadByUser, create, markAsRead, markAllAsRead, deleteById, findUtilisateursByDirection, findAdminIds };
