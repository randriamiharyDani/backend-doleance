const { pool } = require('../config/database');

// Récupérer les notifications de l'utilisateur
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT n.*, d.reference as doleance_reference, d.titre as doleance_titre
      FROM notifications n
      LEFT JOIN doleances d ON n.id_doleance = d.id_doleance
      WHERE n.id_destinataire = ?
    `;
    const params = [req.user.id_utilisateur];
    
    if (unreadOnly === 'true') {
      query += ' AND n.lu = 0';
    }
    
    query += ' ORDER BY n.date_notification DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [notifications] = await pool.execute(query, params);
    
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM notifications WHERE id_destinataire = ?`,
      [req.user.id_utilisateur]
    );
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des notifications'
    });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      `UPDATE notifications 
       SET lu = 1, lu_le = NOW() 
       WHERE id_notification = ? AND id_destinataire = ?`,
      [id, req.user.id_utilisateur]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
  try {
    await pool.execute(
      `UPDATE notifications 
       SET lu = 1, lu_le = NOW() 
       WHERE id_destinataire = ? AND lu = 0`,
      [req.user.id_utilisateur]
    );
    
    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id_notification = ? AND id_destinataire = ?',
      [id, req.user.id_utilisateur]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification supprimée'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

// Supprimer toutes les notifications lues
const deleteAllRead = async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM notifications WHERE id_destinataire = ? AND lu = 1',
      [req.user.id_utilisateur]
    );
    
    res.json({
      success: true,
      message: 'Notifications lues supprimées'
    });
  } catch (error) {
    console.error('Delete all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

// Récupérer le nombre de notifications non lues
const getUnreadCount = async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE id_destinataire = ? AND lu = 0',
      [req.user.id_utilisateur]
    );
    
    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement'
    });
  }
};

// Envoyer une notification (admin uniquement)
const sendNotification = async (req, res) => {
  try {
    const { id_destinataire, type, titre, message, id_doleance, donnees } = req.body;
    
    if (!id_destinataire || !titre || !message) {
      return res.status(400).json({
        success: false,
        message: 'Destinataire, titre et message sont requis'
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO notifications (id_destinataire, type, titre, message, id_doleance, donnees) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_destinataire, type || 'info', titre, message, id_doleance || null, donnees ? JSON.stringify(donnees) : null]
    );
    
    // Émettre via WebSocket si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${id_destinataire}`).emit('new_notification', {
        id: result.insertId,
        titre,
        message,
        type
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Notification envoyée',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi'
    });
  }
};

// Envoyer une notification groupée (admin uniquement)
const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, type, titre, message, id_doleance, donnees } = req.body;
    
    if (!userIds || !userIds.length || !titre || !message) {
      return res.status(400).json({
        success: false,
        message: 'Liste d\'utilisateurs, titre et message sont requis'
      });
    }
    
    let insertedCount = 0;
    
    for (const userId of userIds) {
      await pool.execute(
        `INSERT INTO notifications (id_destinataire, type, titre, message, id_doleance, donnees) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, type || 'info', titre, message, id_doleance || null, donnees ? JSON.stringify(donnees) : null]
      );
      insertedCount++;
      
      // Émettre via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('new_notification', {
          titre,
          message,
          type
        });
      }
    }
    
    res.json({
      success: true,
      message: `${insertedCount} notification(s) envoyée(s)`,
      data: { count: insertedCount }
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi groupé'
    });
  }
};

// Récupérer les préférences de notification
const getPreferences = async (req, res) => {
  try {
    // Pour l'instant, retourner des préférences par défaut
    // Idéalement, stocker les préférences dans une table séparée
    res.json({
      success: true,
      data: {
        email: true,
        push: true,
        sms: false
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des préférences'
    });
  }
};

// Mettre à jour les préférences de notification
const updatePreferences = async (req, res) => {
  try {
    const { email, push, sms } = req.body;
    
    // À implémenter : sauvegarder les préférences dans une table
    // Pour l'instant, juste retourner un succès
    res.json({
      success: true,
      message: 'Préférences mises à jour',
      data: { email, push, sms }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Créer une notification système (interne)
const createSystemNotification = async (userId, titre, message, type = 'info', doleanceId = null) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO notifications (id_destinataire, type, titre, message, id_doleance) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, titre, message, doleanceId]
    );
    return result.insertId;
  } catch (error) {
    console.error('Create system notification error:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getUnreadCount,
  sendNotification,
  sendBulkNotification,
  getPreferences,
  updatePreferences,
  createSystemNotification
};