const notificationModel = require('../models/notificationModel');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const notifications = await notificationModel.findRecentByUser(userId);

    res.json({
      success: true,
      data: { notifications, non_lues: notifications.filter(n => !n.lu).length }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_utilisateur;
    await notificationModel.markAsRead(id, userId);
    res.json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    await notificationModel.markAllAsRead(userId);
    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_utilisateur;
    await notificationModel.deleteById(id, userId);
    res.json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createNotification = async (userId, titre, message, type, details = null) => {
  try {
    await notificationModel.create({ id_destinataire: userId, titre, message, type, donnees: details });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

const notifyNewDoleance = async (directionId, doleanceRef, citoyenNom) => {
  try {
    const agents = await notificationModel.findUtilisateursByDirection(directionId);
    const titre = 'Nouvelle doléance';
    const message = `Une nouvelle doléance (${doleanceRef}) a été déposée par ${citoyenNom}`;

    for (const agent of agents) {
      await createNotification(agent.id_utilisateur, titre, message, 'nouvelle_doleance', `Direction concernée: ${directionId}`);
    }
  } catch (error) {
    console.error('Notify new doleance error:', error);
  }
};

const notifyUserModification = async (userId, nomUtilisateur, action) => {
  try {
    const admins = await notificationModel.findAdminIds();
    const titre = "Modification d'utilisateur";
    const message = `${nomUtilisateur} a été ${action} dans le système`;

    for (const admin of admins) {
      await createNotification(admin.id_utilisateur, titre, message, 'modification_utilisateur', `Utilisateur: ${nomUtilisateur}, Action: ${action}`);
    }
  } catch (error) {
    console.error('Notify user modification error:', error);
  }
};

const notifyPasswordReset = async (userId, email) => {
  try {
    const titre = 'Réinitialisation de mot de passe';
    const message = `Un mot de passe a été réinitialisé pour l'utilisateur ${email}`;
    await createNotification(userId, titre, message, 'reset_password', `Email: ${email}`);
  } catch (error) {
    console.error('Notify password reset error:', error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification, notifyNewDoleance, notifyUserModification, notifyPasswordReset };
