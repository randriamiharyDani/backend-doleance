const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const utilisateurModel = require('../models/utilisateurModel');
const logModel = require('../models/logModel');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_default';

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const users = await utilisateurModel.findByEmailWithPassword(email);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    if (user.actif === 0) {
      return res.status(401).json({ success: false, message: 'Compte désactivé. Veuillez contacter l\'administrateur.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.mot_de_passe || '');
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id_utilisateur: user.id_utilisateur, email: user.email, role_nom: user.nom_role, nom: user.nom, prenom: user.prenom },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    await utilisateurModel.updateLastConnection(user.id_utilisateur);

    await logModel.create({
      id_utilisateur: user.id_utilisateur,
      action: 'Connexion',
      adresse_ip: req.ip || req.socket.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null
    });

    res.json({
      success: true, token,
      user: {
        id_utilisateur: user.id_utilisateur, nom: user.nom, prenom: user.prenom,
        email: user.email, role: user.nom_role, id_direction: user.id_direction,
        telephone: user.telephone, actif: user.actif
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la connexion: ' + error.message });
  }
};

const register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, id_role, id_direction } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nom, prénom, email et mot de passe sont requis' });
    }

    const existing = await utilisateurModel.findByEmail(email);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await utilisateurModel.create({ nom, prenom, email, mot_de_passe: hashedPassword, telephone, id_role: id_role || 2, id_direction });

    res.status(201).json({ success: true, message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription: ' + error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id_utilisateur || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    const users = await utilisateurModel.findById(userId);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil non trouvé' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement du profil: ' + error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id_utilisateur || req.user?.id;
    const { nom, prenom, telephone } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    await utilisateurModel.update(userId, { nom, prenom, telephone });
    res.json({ success: true, message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour: ' + error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id_utilisateur || req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Ancien et nouveau mot de passe requis' });
    }

    const users = await utilisateurModel.getPassword(userId);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const isValid = await bcrypt.compare(oldPassword, users[0].mot_de_passe);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Ancien mot de passe incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await utilisateurModel.updatePassword(userId, hashedPassword);

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du changement de mot de passe: ' + error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }

    const users = await utilisateurModel.findByIdBasic(email);
    // Ne pas révéler si l'email existe
    if (users.length === 0) {
      return res.json({ success: true, message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation' });
    }

    const resetToken = jwt.sign({ id: users[0].id_utilisateur }, JWT_SECRET, { expiresIn: '1h' });

    if (process.env.NODE_ENV === 'development') {
      return res.json({ success: true, message: 'Email de réinitialisation envoyé (mode développement)', resetToken });
    }

    res.json({ success: true, message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email: ' + error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe requis' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await utilisateurModel.updatePassword(decoded.id, hashedPassword);

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token non fourni' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, message: 'Token valide', user: decoded });
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

module.exports = { login, register, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, verifyToken };
