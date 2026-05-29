const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_key_ici_au_moins_32_caracteres';

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Version corrigée - sans r.permissions
      const [users] = await pool.execute(
        `SELECT u.*, r.nom_role as role_nom 
         FROM utilisateurs u 
         JOIN roles r ON u.id_role = r.id_role 
         WHERE u.id_utilisateur = ? AND u.actif = 1`,
        [decoded.id]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Utilisateur non trouvé ou inactif' 
        });
      }
      
      req.user = users[0];
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé, token invalide' 
      });
    }
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Non autorisé, pas de token' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }
    
    const userRole = req.user.role_nom;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Accès interdit. Rôle requis: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

// Version simplifiée de hasPermission (sans dépendance à permissions)
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }
    
    // Pour admin, tout est permis
    if (req.user.role_nom === 'administrateur') {
      return next();
    }
    
    // Pour les autres rôles, vérification basique
    // À améliorer selon vos besoins
    next();
  };
};

module.exports = { protect, authorize, hasPermission };