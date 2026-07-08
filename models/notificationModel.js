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
    `SELECT n.* FROM notifications n
     WHERE n.id_utilisateur = ? OR n.pour_tous = 1
     ORDER BY n.date_notification DESC LIMIT ?`,
    [id_utilisateur, limit]
  );
  return rows;
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
     WHERE id_role = (SELECT id_role FROM roles WHERE nom_role = 'administrateur_systeme')`
  );
  return rows;
};

module.exports = { findByUser, findRecentByUser, create, markAsRead, markAllAsRead, deleteById, findUtilisateursByDirection, findAdminIds };
