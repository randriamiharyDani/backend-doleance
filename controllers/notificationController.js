const { pool } = require('../config/database');

// Récupérer toutes les notifications de l'utilisateur
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const userRole = req.user.nom_role;
    
    let query = `
      SELECT n.* FROM notifications n
      WHERE n.id_utilisateur = ? OR n.pour_tous = 1
      ORDER BY n.date_notification DESC
      LIMIT 50
    `;
    
    const [notifications] = await pool.execute(query, [userId]);
    
    res.json({ 
      success: true, 
      data: { 
        notifications,
        non_lues: notifications.filter(n => !n.lu).length
      } 
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_utilisateur;
    
    await pool.execute(
      'UPDATE notifications SET lu = 1, date_lecture = NOW() WHERE id_notification = ? AND id_utilisateur = ?',
      [id, userId]
    );
    
    res.json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    
    await pool.execute(
      'UPDATE notifications SET lu = 1, date_lecture = NOW() WHERE id_utilisateur = ? AND lu = 0',
      [userId]
    );
    
    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_utilisateur;
    
    await pool.execute(
      'DELETE FROM notifications WHERE id_notification = ? AND id_utilisateur = ?',
      [id, userId]
    );
    
    res.json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer une notification (fonction utilitaire)
const createNotification = async (userId, titre, message, type, details = null) => {
  try {
    await pool.execute(
      `INSERT INTO notifications (id_utilisateur, titre, message, type, details, date_notification, lu)
       VALUES (?, ?, ?, ?, ?, NOW(), 0)`,
      [userId, titre, message, type, details]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// Notification pour nouvelle doléance
const notifyNewDoleance = async (directionId, doleanceRef, citoyenNom) => {
  try {
    // Récupérer les agents de la direction
    const [agents] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE id_direction = ? AND actif = 1',
      [directionId]
    );
    
    const titre = 'Nouvelle doléance';
    const message = `Une nouvelle doléance (${doleanceRef}) a été déposée par ${citoyenNom}`;
    const type = 'nouvelle_doleance';
    
    for (const agent of agents) {
      await createNotification(agent.id_utilisateur, titre, message, type, `Direction concernée: ${directionId}`);
    }
  } catch (error) {
    console.error('Notify new doleance error:', error);
  }
};

// Notification pour modification d'utilisateur (admin seulement)
const notifyUserModification = async (userId, nomUtilisateur, action) => {
  try {
    // Récupérer les admins système
    const [admins] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE id_role = (SELECT id_role FROM roles WHERE nom_role = "administrateur_systeme")'
    );
    
    const titre = 'Modification d\'utilisateur';
    const message = `${nomUtilisateur} a été ${action} dans le système`;
    const type = 'modification_utilisateur';
    
    for (const admin of admins) {
      await createNotification(admin.id_utilisateur, titre, message, type, `Utilisateur: ${nomUtilisateur}, Action: ${action}`);
    }
  } catch (error) {
    console.error('Notify user modification error:', error);
  }
};

// Notification pour réinitialisation de mot de passe
const notifyPasswordReset = async (userId, email) => {
  try {
    const titre = 'Réinitialisation de mot de passe';
    const message = `Un mot de passe a été réinitialisé pour l'utilisateur ${email}`;
    const type = 'reset_password';
    const details = `Email: ${email}, Date: ${new Date().toLocaleString()}`;
    
    await createNotification(userId, titre, message, type, details);
  } catch (error) {
    console.error('Notify password reset error:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  notifyNewDoleance,
  notifyUserModification,
  notifyPasswordReset
};