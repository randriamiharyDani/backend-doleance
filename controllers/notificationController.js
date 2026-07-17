const notificationModel = require('../models/notificationModel');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const notifications = await notificationModel.findRecentByUser(userId);
    const non_lues = await notificationModel.countUnreadByUser(userId);

    res.json({
      success: true,
      data: { notifications, non_lues }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const count = await notificationModel.countUnreadByUser(userId);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
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

const createNotification = async (id_destinataire, titre, message, type, id_doleance = null, donnees = null) => {
  try {
    const notifId = await notificationModel.create({ id_destinataire, id_doleance, type, titre, message, donnees });
    return notifId;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

const notifyNewDoleance = async (req, { id_doleance, reference, titre, id_direction, citoyenNom }) => {
  try {
    const agents = await notificationModel.findUtilisateursByDirection(id_direction);
    const admins = await notificationModel.findAdminIds();
    const recipients = [...new Set([...agents.map(a => a.id_utilisateur), ...admins.map(a => a.id_utilisateur)])];

    const titreNotif = 'Nouvelle doléance';
    const messageNotif = `Une nouvelle doléance (${reference}) a été déposée par ${citoyenNom}`;

    for (const userId of recipients) {
      const notifId = await createNotification(userId, titreNotif, messageNotif, 'nouvelle_doleance', id_doleance, { reference, titre });
      
      if (notifId && req.app) {
        const io = req.app.get('io');
        if (io) {
          const nonLues = await notificationModel.countUnreadByUser(userId);
          io.to(`user_${userId}`).emit('newNotification', {
            id_notification: notifId,
            type: 'nouvelle_doleance',
            titre: titreNotif,
            message: messageNotif,
            doleance_reference: reference,
            doleance_titre: titre,
            non_lues: nonLues,
            date_notification: new Date().toISOString()
          });
        }
      }
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
      await createNotification(admin.id_utilisateur, titre, message, 'modification_utilisateur', null, `Utilisateur: ${nomUtilisateur}, Action: ${action}`);
    }
  } catch (error) {
    console.error('Notify user modification error:', error);
  }
};

const notifyPasswordReset = async (userId, email) => {
  try {
    const titre = 'Réinitialisation de mot de passe';
    const message = `Un mot de passe a été réinitialisé pour l'utilisateur ${email}`;
    await createNotification(userId, titre, message, 'reset_password', null, `Email: ${email}`);
  } catch (error) {
    console.error('Notify password reset error:', error);
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, createNotification, notifyNewDoleance, notifyUserModification, notifyPasswordReset };
