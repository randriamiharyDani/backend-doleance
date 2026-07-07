// controllers/userController.js - Version corrigée avec gestion de la table transferts

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Récupérer tous les utilisateurs
const getUsers = async (req, res) => {
  try {
    console.log('📋 Récupération des utilisateurs');
    
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
      message: 'Erreur lors du chargement des utilisateurs: ' + error.message 
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
      message: 'Erreur lors du chargement: ' + error.message 
    });
  }
};

// CRÉER un utilisateur
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
    
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'utilisateurs' 
      AND (COLUMN_NAME = 'mot_de_passe' OR COLUMN_NAME = 'password')
    `);
    
    const passwordColumn = columns[0]?.COLUMN_NAME || 'password';
    console.log('🔐 Colonne mot de passe utilisée:', passwordColumn);
    
    const [result] = await pool.execute(
      `INSERT INTO utilisateurs (nom, prenom, email, ${passwordColumn}, telephone, id_role, id_direction, actif) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [nom, prenom, email, hashedPassword, telephone || null, id_role || 2, id_direction || null]
    );
    
    console.log('✅ Utilisateur créé avec succès, ID:', result.insertId);
    
    res.status(201).json({ 
      success: true, 
      message: 'Utilisateur créé avec succès',
      data: { id_utilisateur: result.insertId }
    });
    
  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création: ' + error.message 
    });
  }
};

// MODIFIER un utilisateur
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, id_role, id_direction, actif } = req.body;
    
    console.log('✏️ Mise à jour utilisateur ID:', id);
    
    const [existing] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE id_utilisateur = ?',
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

// SUPPRESSION DÉFINITIVE - Version complète avec gestion de toutes les tables
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Suppression définitive utilisateur ID:', id);
    
    // Vérifier si l'utilisateur existe
    const [user] = await pool.execute(
      'SELECT id_utilisateur, nom, prenom FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // ========== SUPPRESSION DES DÉPENDANCES DANS L'ORDRE ==========
    
    // 1. Supprimer les logs d'activité
    try {
      await pool.execute('DELETE FROM logs_activites WHERE id_utilisateur = ?', [id]);
      console.log('  - Logs d\'activité supprimés');
    } catch (err) {
      console.log('  - Logs: ignoré', err.message);
    }
    
    // 2. Supprimer les notifications
    try {
      await pool.execute('DELETE FROM notifications WHERE id_utilisateur = ?', [id]);
      console.log('  - Notifications supprimées');
    } catch (err) {
      try {
        await pool.execute('DELETE FROM notifications WHERE user_id = ?', [id]);
        console.log('  - Notifications supprimées (user_id)');
      } catch (err2) {
        console.log('  - Notifications: ignoré');
      }
    }
    
    // 3. Supprimer les commentaires
    try {
      await pool.execute('DELETE FROM commentaires WHERE id_utilisateur = ?', [id]);
      console.log('  - Commentaires supprimés');
    } catch (err) {
      try {
        await pool.execute('DELETE FROM commentaires WHERE user_id = ?', [id]);
        console.log('  - Commentaires supprimés (user_id)');
      } catch (err2) {
        console.log('  - Commentaires: ignoré');
      }
    }
    
    // 4. Supprimer les transferts (TABLE IMPORTANTE)
    try {
      await pool.execute('DELETE FROM transferts WHERE id_utilisateur = ?', [id]);
      console.log('  - Transferts supprimés');
    } catch (err) {
      try {
        await pool.execute('DELETE FROM transferts WHERE id_agent = ?', [id]);
        console.log('  - Transferts supprimés (id_agent)');
      } catch (err2) {
        try {
          await pool.execute('DELETE FROM transferts WHERE id_destinataire = ?', [id]);
          console.log('  - Transferts supprimés (id_destinataire)');
        } catch (err3) {
          console.log('  - Transferts: ignoré');
        }
      }
    }
    
    // 5. Mettre à jour les doléances (id_agent)
    try {
      await pool.execute('UPDATE doleances SET id_agent = NULL WHERE id_agent = ?', [id]);
      console.log('  - Doléances (agent) mises à jour');
    } catch (err) {
      console.log('  - Mise à jour doléances agent: ignoré');
    }
    
    // 6. Mettre à jour les doléances (id_utilisateur)
    try {
      await pool.execute('UPDATE doleances SET id_utilisateur = NULL WHERE id_utilisateur = ?', [id]);
      console.log('  - Doléances (citoyen) mises à jour');
    } catch (err) {
      console.log('  - Mise à jour doléances citoyen: ignoré');
    }
    
    // 7. Supprimer les réponses
    try {
      await pool.execute('DELETE FROM reponses WHERE id_utilisateur = ?', [id]);
      console.log('  - Réponses supprimées');
    } catch (err) {
      console.log('  - Réponses: ignoré');
    }
    
    // 8. Supprimer l'utilisateur lui-même
    await pool.execute('DELETE FROM utilisateurs WHERE id_utilisateur = ?', [id]);
    console.log('  - Utilisateur supprimé');
    
    console.log(`✅ Utilisateur "${user[0].prenom} ${user[0].nom}" supprimé définitivement avec succès`);
    
    res.json({ 
      success: true, 
      message: `Utilisateur "${user[0].prenom} ${user[0].nom}" a été supprimé définitivement`
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    
    // Vérifier quelle contrainte a échoué
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      // Extraire le nom de la table depuis le message d'erreur
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

// Activer/Désactiver un utilisateur
const toggleActif = async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;
    
    const [user] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE id_utilisateur = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    await pool.execute(
      'UPDATE utilisateurs SET actif = ? WHERE id_utilisateur = ?', 
      [actif, id]
    );
    
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

// Réinitialiser le mot de passe
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const temporaryPassword = Math.random().toString(36).slice(-8);
    
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'utilisateurs' 
      AND (COLUMN_NAME = 'mot_de_passe' OR COLUMN_NAME = 'password')
    `);
    
    const passwordColumn = columns[0]?.COLUMN_NAME || 'password';
    
    const [result] = await pool.execute(
      `UPDATE utilisateurs SET ${passwordColumn} = ? WHERE id_utilisateur = ?`,
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

// Récupérer les agents disponibles
const getAgentsDisponibles = async (req, res) => {
  try {
    const { direction_id } = req.query;
    
    let query = `
      SELECT u.id_utilisateur, u.nom, u.prenom, u.email, d.nom_direction
      FROM utilisateurs u
      LEFT JOIN directions d ON u.id_direction = d.id_direction
      JOIN roles r ON u.id_role = r.id_role
      WHERE (r.nom_role = 'agent' OR r.nom_role = 'agent_terrain') AND u.actif = 1
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