const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
// const { sendEmail } = require('../utils/emailService'); // Commenté temporairement

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }
    
    const [users] = await pool.execute(
      `SELECT u.*, r.nom_role as role_nom 
       FROM utilisateurs u 
       JOIN roles r ON u.id_role = r.id_role 
       WHERE u.email = ?`,
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    const user = users[0];
    
    if (!user.actif) {
      return res.status(401).json({ 
        success: false, 
        message: 'Compte désactivé. Veuillez contacter l\'administrateur.' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email, role: user.role_nom },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    // Mettre à jour la dernière connexion - Version corrigée sans colonne inexistante
    try {
      // Vérifier si la colonne existe avant de l'utiliser
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'utilisateurs' AND COLUMN_NAME = 'derniere_connexion'
      `);
      
      if (columns.length > 0) {
        await pool.execute(
          'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id_utilisateur = ?',
          [user.id_utilisateur]
        );
      }
    } catch (updateError) {
      console.log('⚠️ Impossible de mettre à jour derniere_connexion:', updateError.message);
    }
    
    // Logger l'activité - Version corrigée
    try {
      await pool.execute(
        `INSERT INTO logs_activites (id_utilisateur, action, adresse_ip, user_agent) 
         VALUES (?, 'Connexion', ?, ?)`,
        [user.id_utilisateur, req.ip || req.socket.remoteAddress, req.headers['user-agent'] || null]
      );
    } catch (logError) {
      console.log('⚠️ Impossible d\'enregistrer le log:', logError.message);
    }
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id_utilisateur,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role_nom,
        id_direction: user.id_direction,
        telephone: user.telephone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion: ' + error.message
    });
  }
};

const register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, id_role, id_direction } = req.body;
    
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
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, id_role, id_direction) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, telephone || null, id_role || 1, id_direction || null]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Utilisateur créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription' 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.actif, u.date_creation,
              r.nom_role as role, d.nom_direction as direction
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       LEFT JOIN directions d ON u.id_direction = d.id_direction
       WHERE u.id_utilisateur = ?`,
      [req.user.id_utilisateur]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profil non trouvé' 
      });
    }
    
    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement du profil' 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;
    
    await pool.execute(
      `UPDATE utilisateurs 
       SET nom = ?, prenom = ?, telephone = ? 
       WHERE id_utilisateur = ?`,
      [nom, prenom, telephone, req.user.id_utilisateur]
    );
    
    res.json({ 
      success: true, 
      message: 'Profil mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour' 
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const [users] = await pool.execute(
      'SELECT mot_de_passe FROM utilisateurs WHERE id_utilisateur = ?',
      [req.user.id_utilisateur]
    );
    
    const isValid = await bcrypt.compare(oldPassword, users[0].mot_de_passe);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ancien mot de passe incorrect' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.execute(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id_utilisateur = ?',
      [hashedPassword, req.user.id_utilisateur]
    );
    
    res.json({ 
      success: true, 
      message: 'Mot de passe modifié avec succès' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du changement de mot de passe' 
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const [users] = await pool.execute(
      'SELECT id_utilisateur, nom, prenom FROM utilisateurs WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aucun compte trouvé avec cet email' 
      });
    }
    
    const resetToken = jwt.sign(
      { id: users[0].id_utilisateur },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ 
      success: true, 
      message: 'Email de réinitialisation envoyé (simulation)',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'email' 
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.execute(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id_utilisateur = ?',
      [hashedPassword, decoded.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Token invalide ou expiré' 
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};