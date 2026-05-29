const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Récupérer tous les utilisateurs (plus de restriction sur les citoyens)
const getUsers = async (req, res) => {
  try {
    console.log('📋 Récupération des utilisateurs par:', req.user?.email, 'Rôle:', req.user?.role_nom);
    
    const [users] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.actif, u.date_creation,
              r.id_role, r.nom_role as role_nom, r.description as role_description,
              d.id_direction, d.nom_direction
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       LEFT JOIN directions d ON u.id_direction = d.id_direction
       ORDER BY u.date_creation DESC`
    );
    
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des utilisateurs' 
    });
  }
};

// Récupérer un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.actif, u.date_creation,
              r.id_role, r.nom_role as role_nom,
              d.id_direction, d.nom_direction
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       LEFT JOIN directions d ON u.id_direction = d.id_direction
       WHERE u.id_utilisateur = ?`,
      [id]
    );
    
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
      message: 'Erreur lors du chargement' 
    });
  }
};

// Créer un utilisateur (admin uniquement)
const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, id_role, id_direction } = req.body;
    
    console.log('📝 Création utilisateur:', { nom, prenom, email, id_role, id_direction });
    
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom, prénom, email et mot de passe sont requis' 
      });
    }
    
    const [existing] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cet email est déjà utilisé' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, id_role, id_direction, actif) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [nom, prenom, email, hashedPassword, telephone || null, id_role || 2, id_direction || null]
    );
    
    console.log('✅ Utilisateur créé avec ID:', result.insertId);
    
    res.status(201).json({ 
      success: true, 
      message: 'Utilisateur créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création: ' + error.message 
    });
  }
};

// MODIFIER un utilisateur (admin uniquement)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, id_role, id_direction, actif } = req.body;
    
    console.log('✏️ Mise à jour utilisateur ID:', id);
    
    const [existing] = await pool.execute(
      'SELECT id_utilisateur, id_role FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (email) {
      const [emailCheck] = await pool.execute(
        'SELECT id_utilisateur FROM utilisateurs WHERE email = ? AND id_utilisateur != ?',
        [email, id]
      );
      
      if (emailCheck.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cet email est déjà utilisé par un autre compte' 
        });
      }
    }
    
    const updates = [];
    const params = [];
    
    if (nom !== undefined) { updates.push('nom = ?'); params.push(nom); }
    if (prenom !== undefined) { updates.push('prenom = ?'); params.push(prenom); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (telephone !== undefined) { updates.push('telephone = ?'); params.push(telephone || null); }
    if (id_role !== undefined) { updates.push('id_role = ?'); params.push(id_role); }
    if (id_direction !== undefined) { updates.push('id_direction = ?'); params.push(id_direction || null); }
    if (actif !== undefined) { updates.push('actif = ?'); params.push(actif); }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucune donnée à mettre à jour' 
      });
    }
    
    params.push(id);
    
    await pool.execute(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id_utilisateur = ?`, params);
    
    const [updatedUser] = await pool.execute(
      `SELECT u.*, r.nom_role as role_nom, d.nom_direction
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       LEFT JOIN directions d ON u.id_direction = d.id_direction
       WHERE u.id_utilisateur = ?`,
      [id]
    );
    
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

// SUPPRIMER un utilisateur (admin uniquement)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Suppression utilisateur ID:', id);
    
    const [user] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, r.nom_role 
       FROM utilisateurs u 
       JOIN roles r ON u.id_role = r.id_role 
       WHERE u.id_utilisateur = ?`,
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    const userToDelete = user[0];
    
    if (userToDelete.nom_role === 'administrateur') {
      const [adminCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM utilisateurs u JOIN roles r ON u.id_role = r.id_role WHERE r.nom_role = "administrateur" AND u.actif = 1'
      );
      
      if (adminCount[0].count <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Impossible de supprimer le dernier administrateur du système' 
        });
      }
    }
    
    await pool.execute('DELETE FROM assignations WHERE id_utilisateur = ?', [id]);
    await pool.execute('DELETE FROM reponses WHERE id_utilisateur = ?', [id]);
    await pool.execute('DELETE FROM commentaires_internes WHERE id_utilisateur = ?', [id]);
    await pool.execute('DELETE FROM logs_activites WHERE id_utilisateur = ?', [id]);
    await pool.execute('DELETE FROM notifications WHERE id_destinataire = ?', [id]);
    await pool.execute('DELETE FROM utilisateurs WHERE id_utilisateur = ?', [id]);
    
    res.json({ 
      success: true, 
      message: `Utilisateur "${userToDelete.prenom} ${userToDelete.nom}" supprimé avec succès`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression: ' + error.message 
    });
  }
};

// Activer/Désactiver un utilisateur
const toggleActif = async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;
    
    const [user] = await pool.execute(
      'SELECT u.id_utilisateur, r.nom_role FROM utilisateurs u JOIN roles r ON u.id_role = r.id_role WHERE u.id_utilisateur = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (actif === 0 && user[0].nom_role === 'administrateur') {
      const [adminCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM utilisateurs u JOIN roles r ON u.id_role = r.id_role WHERE r.nom_role = "administrateur" AND u.actif = 1'
      );
      
      if (adminCount[0].count <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Impossible de désactiver le dernier administrateur' 
        });
      }
    }
    
    await pool.execute('UPDATE utilisateurs SET actif = ? WHERE id_utilisateur = ?', [actif, id]);
    
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

// Récupérer les agents disponibles
const getAgentsDisponibles = async (req, res) => {
  try {
    const { direction_id } = req.query;
    
    let query = `
      SELECT u.id_utilisateur, u.nom, u.prenom, u.email, d.nom_direction
      FROM utilisateurs u
      LEFT JOIN directions d ON u.id_direction = d.id_direction
      JOIN roles r ON u.id_role = r.id_role
      WHERE r.nom_role = 'agent' AND u.actif = 1
    `;
    const params = [];
    
    if (direction_id) {
      query += ' AND u.id_direction = ?';
      params.push(direction_id);
    }
    
    query += ' ORDER BY u.nom, u.prenom';
    
    const [agents] = await pool.execute(query, params);
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('Get available agents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des agents' 
    });
  }
};

// Récupérer les logs d'activité
const getActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const [logs] = await pool.execute(
      `SELECT * FROM logs_activites 
       WHERE id_utilisateur = ? 
       ORDER BY date_action DESC 
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM logs_activites WHERE id_utilisateur = ?',
      [id]
    );
    
    res.json({ 
      success: true, 
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
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

// Réinitialiser le mot de passe
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const temporaryPassword = Math.random().toString(36).slice(-8);
    
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    const [result] = await pool.execute(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id_utilisateur = ?',
      [hashedPassword, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    const [users] = await pool.execute(
      'SELECT email, nom, prenom FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );
    
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

// Récupérer les statistiques utilisateurs
const getUserStats = async (req, res) => {
  try {
    const [total] = await pool.execute('SELECT COUNT(*) as count FROM utilisateurs');
    const [actifs] = await pool.execute('SELECT COUNT(*) as count FROM utilisateurs WHERE actif = 1');
    const [byRole] = await pool.execute(
      `SELECT r.nom_role, COUNT(u.id_utilisateur) as count
       FROM roles r
       LEFT JOIN utilisateurs u ON r.id_role = u.id_role
       GROUP BY r.id_role`
    );
    
    res.json({ 
      success: true, 
      data: {
        total: total[0].count,
        actifs: actifs[0].count,
        inactifs: total[0].count - actifs[0].count,
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