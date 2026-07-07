const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_default';

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Tentative de connexion:', email);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }
    
    const [users] = await pool.execute(
      `SELECT u.*, r.nom_role as role_nom 
       FROM utilisateurs u 
       LEFT JOIN roles r ON u.id_role = r.id_role 
       WHERE u.email = ?`,
      [email]
    );
    
    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    const user = users[0];
    
    // Vérifier si le compte est actif (si la colonne existe)
    if (user.actif === 0) {
      console.log('❌ Compte désactivé:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Compte désactivé. Veuillez contacter l\'administrateur.' 
      });
    }
    
    // Vérifier le mot de passe (essayer avec mot_de_passe ou password)
    let isValidPassword = false;
    if (user.mot_de_passe) {
      isValidPassword = await bcrypt.compare(password, user.mot_de_passe);
    } else if (user.password) {
      isValidPassword = await bcrypt.compare(password, user.password);
    }
    
    if (!isValidPassword) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    const token = jwt.sign(
      { 
        id_utilisateur: user.id_utilisateur, 
        email: user.email, 
        role_nom: user.role_nom,
        nom: user.nom,
        prenom: user.prenom
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    // Mettre à jour la dernière connexion (si la colonne existe)
    try {
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
    
    // Logger l'activité (si la table existe)
    try {
      await pool.execute(
        `INSERT INTO logs_activites (id_utilisateur, action, adresse_ip, user_agent, date_action) 
         VALUES (?, 'Connexion', ?, ?, NOW())`,
        [user.id_utilisateur, req.ip || req.socket.remoteAddress || null, req.headers['user-agent'] || null]
      );
    } catch (logError) {
      console.log('⚠️ Impossible d\'enregistrer le log:', logError.message);
    }
    
    console.log('✅ Connexion réussie:', email);
    
    res.json({
      success: true,
      token,
      user: {
        id_utilisateur: user.id_utilisateur,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role_nom,
        id_direction: user.id_direction,
        telephone: user.telephone,
        actif: user.actif
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion: ' + error.message
    });
  }
};

const register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, id_role, id_direction } = req.body;
    
    console.log('📝 Tentative d\'inscription:', email);
    
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
    
    console.log('✅ Utilisateur créé:', email);
    
    res.status(201).json({ 
      success: true, 
      message: 'Utilisateur créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription: ' + error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id_utilisateur || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié' 
      });
    }
    
    const [users] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.actif, u.date_creation,
              r.id_role, r.nom_role as role, d.id_direction, d.nom_direction as direction
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       LEFT JOIN directions d ON u.id_direction = d.id_direction
       WHERE u.id_utilisateur = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profil non trouvé' 
      });
    }
    
    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement du profil: ' + error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id_utilisateur || req.user?.id;
    const { nom, prenom, telephone } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié' 
      });
    }
    
    await pool.execute(
      `UPDATE utilisateurs 
       SET nom = ?, prenom = ?, telephone = ? 
       WHERE id_utilisateur = ?`,
      [nom, prenom, telephone, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Profil mis à jour avec succès' 
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour: ' + error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id_utilisateur || req.user?.id;
    const { oldPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié' 
      });
    }
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ancien et nouveau mot de passe requis' 
      });
    }
    
    const [users] = await pool.execute(
      'SELECT mot_de_passe FROM utilisateurs WHERE id_utilisateur = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
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
      [hashedPassword, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Mot de passe modifié avec succès' 
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du changement de mot de passe: ' + error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email requis' 
      });
    }
    
    const [users] = await pool.execute(
      'SELECT id_utilisateur, nom, prenom FROM utilisateurs WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      // Ne pas révéler que l'email n'existe pas pour des raisons de sécurité
      return res.json({ 
        success: true, 
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation' 
      });
    }
    
    const resetToken = jwt.sign(
      { id: users[0].id_utilisateur },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // En développement, renvoyer le token
    if (process.env.NODE_ENV === 'development') {
      return res.json({ 
        success: true, 
        message: 'Email de réinitialisation envoyé (mode développement)',
        resetToken: resetToken
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation' 
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'email: ' + error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token et nouveau mot de passe requis' 
      });
    }
    
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
    console.error('❌ Reset password error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Token invalide ou expiré' 
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token non fourni' 
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({ 
      success: true, 
      message: 'Token valide',
      user: decoded
    });
  } catch (error) {
    console.error('❌ Verify token error:', error);
    res.status(403).json({ 
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
  resetPassword,
  verifyToken
};