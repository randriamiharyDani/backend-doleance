const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const utilisateurModel = require('../models/utilisateurModel');
const logModel = require('../models/logModel');
const notificationController = require('./notificationController');

const getUsers = async (req, res) => {
  try {
    const users = await utilisateurModel.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des utilisateurs: ' + error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await utilisateurModel.findById(id);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement: ' + error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, id_role, id_direction } = req.body;

    console.log('📝 Création utilisateur - Données reçues:', { nom, prenom, email, id_role, id_direction, password: password ? '***' : 'non fourni' });

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, email et mot de passe sont requis'
      });
    }

    const existing = await utilisateurModel.findByEmail(email);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertId = await utilisateurModel.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      telephone,
      id_role: id_role || 2,
      id_direction: id_direction || null
    });

    console.log('✅ Utilisateur créé avec succès, ID:', insertId);

    notificationController.notifyUserModification(insertId, `${prenom} ${nom}`, 'créé').catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { id_utilisateur: insertId }
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création: ' + error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, id_role, id_direction, actif } = req.body;

    console.log('✏️ Mise à jour utilisateur ID:', id);

    const existing = await utilisateurModel.findByIdBasic(id);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (email) {
      const emailCheck = await utilisateurModel.findByEmail(email);

      if (emailCheck.length > 0 && emailCheck[0].id_utilisateur != id) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre compte'
        });
      }
    }

    const fields = {};
    if (nom !== undefined) fields.nom = nom;
    if (prenom !== undefined) fields.prenom = prenom;
    if (email !== undefined) fields.email = email;
    if (telephone !== undefined) fields.telephone = telephone || null;
    if (id_role !== undefined) fields.id_role = id_role;
    if (id_direction !== undefined) fields.id_direction = id_direction || null;
    if (actif !== undefined) fields.actif = actif;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    await utilisateurModel.update(id, fields);

    const updatedUser = await utilisateurModel.findById(id);

    notificationController.notifyUserModification(id, `${updatedUser[0].prenom} ${updatedUser[0].nom}`, 'modifié').catch(() => {});

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour: ' + error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Suppression définitive utilisateur ID:', id);

    const user = await utilisateurModel.findByIdBasic(id);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    try {
      await logModel.deleteByUser(id);
      console.log('  - Logs d\'activité supprimés');
    } catch (err) {
      console.log('  - Logs: ignoré', err.message);
    }

    try {
      await pool.execute('DELETE FROM notifications WHERE id_destinataire = ?', [id]);
      console.log('  - Notifications supprimées');
    } catch (err) {
      console.log('  - Notifications: ignoré', err.message);
    }

    try {
      await pool.execute('DELETE FROM commentaires_internes WHERE id_utilisateur = ?', [id]);
      console.log('  - Commentaires internes supprimés');
    } catch (err) {
      console.log('  - Commentaires internes: ignoré');
    }

    try {
      await pool.execute('DELETE FROM transferts WHERE id_utilisateur = ?', [id]);
      console.log('  - Transferts supprimés');
    } catch (err) {
      console.log('  - Transferts: ignoré');
    }

    try {
      await pool.execute('UPDATE doleances SET id_utilisateur_assignee = NULL WHERE id_utilisateur_assignee = ?', [id]);
      console.log('  - Doléances (assignee) mises à jour');
    } catch (err) {
      console.log('  - Mise à jour doléances assignee: ignoré');
    }

    try {
      await pool.execute('UPDATE doleances SET id_citoyen = NULL WHERE id_citoyen = ?', [id]);
      console.log('  - Doléances (citoyen) mises à jour');
    } catch (err) {
      console.log('  - Mise à jour doléances citoyen: ignoré');
    }

    try {
      await pool.execute('DELETE FROM reponses WHERE id_utilisateur = ?', [id]);
      console.log('  - Réponses supprimées');
    } catch (err) {
      console.log('  - Réponses: ignoré');
    }

    await utilisateurModel.deleteById(id);
    console.log('  - Utilisateur supprimé');

    console.log(`✅ Utilisateur "${user[0].prenom} ${user[0].nom}" supprimé définitivement avec succès`);

    notificationController.notifyUserModification(id, `${user[0].prenom} ${user[0].nom}`, 'supprimé').catch(() => {});

    res.json({
      success: true,
      message: `Utilisateur "${user[0].prenom} ${user[0].nom}" a été supprimé définitivement`
    });

  } catch (error) {
    console.error('Delete user error:', error);

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      const tableMatch = error.sqlMessage.match(/REFERENCES `(\w+)`/);
      const tableName = tableMatch ? tableMatch[1] : 'inconnue';

      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cet utilisateur car il a des enregistrements dans la table "${tableName}". Veuillez d'abord supprimer ces dépendances.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression: ' + error.message
    });
  }
};

const toggleActif = async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;

    const user = await utilisateurModel.findByIdBasic(id);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await utilisateurModel.toggleActif(id, actif);

    notificationController.notifyUserModification(id, `${user[0].prenom} ${user[0].nom}`, actif ? 'activé' : 'désactivé').catch(() => {});

    res.json({
      success: true,
      message: `Utilisateur ${actif ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const temporaryPassword = Math.random().toString(36).slice(-8);

    const user = await utilisateurModel.findByIdBasic(id);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await utilisateurModel.updatePassword(id, hashedPassword);

    const users = await utilisateurModel.findById(id);

    notificationController.notifyPasswordReset(id, users[0].email).catch(() => {});

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé',
      data: { temporaryPassword, email: users[0].email }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation'
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const total = await utilisateurModel.countAll();
    const actifs = await utilisateurModel.countActifs();
    const byRole = await utilisateurModel.countByRole();

    res.json({
      success: true,
      data: {
        total,
        actifs,
        inactifs: total - actifs,
        byRole
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques'
    });
  }
};

const getAgentsDisponibles = async (req, res) => {
  try {
    const { direction_id } = req.query;
    const agents = await utilisateurModel.findAgentsDisponibles(direction_id);
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('Get available agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des agents'
    });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const logs = await logModel.findByUser(id, { page: parseInt(page), limit: parseInt(limit) });
    const total = await logModel.countByUser(id);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des logs'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleActif,
  getAgentsDisponibles,
  getActivityLogs,
  resetPassword,
  getUserStats
};
