// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_key_ici_au_moins_32_caracteres';

// ========== MIDDLEWARE DE PROTECTION ==========
const protect = async (req, res, next) => {
  let token;
  
  // Vérifier si le token est présent dans le header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Vérifier si le token est vide ou invalide
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token invalide' 
        });
      }
      
      // Décoder le token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Récupérer l'ID utilisateur du token (supporte les deux formats)
      const userId = decoded.id_utilisateur || decoded.id || decoded.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token invalide - utilisateur non identifié' 
        });
      }
      
      // Récupérer l'utilisateur depuis la base de données
      const [users] = await pool.execute(
        `SELECT u.*, r.nom_role as role_nom, r.permissions as role_permissions 
         FROM utilisateurs u 
         LEFT JOIN roles r ON u.id_role = r.id_role 
         WHERE u.id_utilisateur = ? AND u.actif = 1`,
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Utilisateur non trouvé ou inactif' 
        });
      }
      
      // Ajouter l'utilisateur à la requête
      req.user = users[0];
      // Charger les permissions du rôle (JSON de la colonne permissions)
      req.user.permissions = parsePermissions(users[0].role_permissions);
      console.log(`🔐 Utilisateur authentifié: ${req.user.email} (${req.user.role_nom || 'rôle inconnu'})`);
      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token invalide' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expiré. Veuillez vous reconnecter.' 
        });
      }
      
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

// ========== MIDDLEWARE D'AUTORISATION ==========
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }
    
    const userRole = req.user.role_nom || req.user.nom_role;
    
    // Si aucun rôle spécifié, vérifier juste que l'utilisateur est authentifié
    if (roles.length === 0) {
      return next();
    }
    
    // Vérifier si l'utilisateur a un des rôles autorisés
    if (roles.includes(userRole)) {
      return next();
    }
    
    // Vérifier si l'utilisateur est administrateur (accès total)
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    if (adminRoles.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: `Accès interdit. Rôle requis: ${roles.join(', ')}. Votre rôle: ${userRole || 'non défini'}` 
    });
  };
};

// ========== MIDDLEWARE POUR ACCÈS À SON PROPRE PROFIL ==========
const authorizeSelf = (paramIdName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    const userRole = req.user.role_nom || req.user.nom_role;
    const resourceId = req.params[paramIdName];
    const userId = req.user.id_utilisateur;
    
    // Admin peut tout voir
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    if (adminRoles.includes(userRole)) {
      return next();
    }
    
    // Vérifier si l'utilisateur accède à sa propre ressource
    if (resourceId && parseInt(resourceId) === userId) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Accès interdit. Vous ne pouvez accéder qu\'à vos propres données.'
    });
  };
};

// ========== MIDDLEWARE POUR VÉRIFIER L'ACCÈS À UNE DIRECTION ==========
const authorizeDirection = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    const userRole = req.user.role_nom || req.user.nom_role;
    const directionId = req.params.id || req.params.directionId || req.params.id_direction;
    const userId = req.user.id_utilisateur;
    
    // Admin peut tout voir
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    if (adminRoles.includes(userRole)) {
      return next();
    }
    
    // Pour directeur, chef_service et agent
    const directionRoles = ['directeur', 'chef_service', 'agent'];
    if (directionRoles.includes(userRole)) {
      try {
        const [user] = await pool.execute(
          'SELECT id_direction FROM utilisateurs WHERE id_utilisateur = ?',
          [userId]
        );
        
        const userDirectionId = user[0]?.id_direction;
        
        if (!userDirectionId) {
          return res.status(403).json({
            success: false,
            message: 'Vous n\'êtes pas assigné à une direction.'
          });
        }
        
        // Si une direction spécifique est demandée, vérifier l'appartenance
        if (directionId && parseInt(directionId) !== userDirectionId) {
          return res.status(403).json({
            success: false,
            message: 'Accès interdit. Vous ne pouvez voir que votre propre direction.'
          });
        }
        
        // Ajouter l'ID de la direction au request pour filtrage
        req.filteredDirectionId = userDirectionId;
        return next();
      } catch (error) {
        console.error('Direction check error:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur lors de la vérification de la direction' });
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Accès interdit à cette direction.'
    });
  };
};

// ========== MIDDLEWARE POUR AGENT CENTRAL ==========
const isAgentCentral = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    const userRole = req.user.role_nom || req.user.nom_role;
    
    // Si l'utilisateur est administrateur, autoriser
    const adminRoles = ['administrateur_systeme', 'administrateur'];
    if (adminRoles.includes(userRole)) {
      return next();
    }
    
    // Vérifier si l'utilisateur est agent central
    if (userRole === 'agent_central') {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Accès interdit. Seul l\'agent central ou l\'administrateur peut effectuer cette action.' 
    });
  } catch (error) {
    console.error('Agent central check error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========== MIDDLEWARE POUR ADMIN ==========
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    const userRole = req.user.role_nom || req.user.nom_role;
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    
    if (adminRoles.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Accès interdit. Droits administrateur requis.' 
    });
  } catch (error) {
    console.error('Admin check error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========== MIDDLEWARE POUR SUPER ADMIN ==========
const isSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    const userRole = req.user.role_nom || req.user.nom_role;
    
    if (userRole === 'administrateur_systeme') {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Accès interdit. Droits super administrateur requis.' 
    });
  } catch (error) {
    console.error('Super admin check error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========== MIDDLEWARE POUR VÉRIFIER L'ACCÈS À UNE DOLÉANCE ==========
const authorizeDoleance = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    const userRole = req.user.role_nom || req.user.nom_role;
    const doleanceId = req.params.id || req.params.doleanceId;
    const userId = req.user.id_utilisateur;
    
    // Admin peut tout voir
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    if (adminRoles.includes(userRole)) {
      return next();
    }
    
    // Pour les autres rôles, vérifier l'accès à la doléance
    if (doleanceId) {
      try {
        const [doleance] = await pool.execute(
          'SELECT id_direction, id_utilisateur_assignee FROM doleances WHERE id_doleance = ?',
          [doleanceId]
        );
        
        if (doleance.length === 0) {
          return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
        }
        
        const [user] = await pool.execute(
          'SELECT id_direction FROM utilisateurs WHERE id_utilisateur = ?',
          [userId]
        );
        
        const userDirectionId = user[0]?.id_direction;

        // Accès par direction
        if (userDirectionId && doleance[0].id_direction === userDirectionId) {
          return next();
        }

        // Accès par assignation personnelle
        if (doleance[0].id_utilisateur_assignee === userId) {
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: 'Accès interdit à cette doléance.'
        });
      } catch (error) {
        console.error('Doleance check error:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur lors de la vérification' });
      }
    }
    
    return next();
  };
};

// ========== HELPERS PERMISSIONS ==========

// Convertit la colonne JSON "permissions" en objet (gère string JSON ou objet)
const parsePermissions = (value) => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) || {};
    } catch (e) {
      return {};
    }
  }
  if (typeof value === 'object') {
    return value;
  }
  return {};
};

// Vérifie si un objet de permissions contient une permission donnée
// Format attendu : { doleances: ['view_all', 'transfer', ...], all: ['*'] }
// - "all": ["*"] => super accès (toutes permissions)
// - module manquant ou action absente => refus
const hasPermission = (permissions, module, action) => {
  const perms = parsePermissions(permissions);
  if (!perms || typeof perms !== 'object') return false;

  // Accès total via all: ['*'] (compatible aussi avec all: '*')
  const allPerms = perms.all;
  if (allPerms === '*' || allPerms === true) return true;
  if (Array.isArray(allPerms) && (allPerms.includes('*') || allPerms.includes(action))) {
    return true;
  }

  // Permissions par module
  const modulePerms = perms[module];
  if (modulePerms === true || modulePerms === '*') return true;
  if (Array.isArray(modulePerms)) {
    return modulePerms.includes('*') || modulePerms.includes(action);
  }

  return false;
};

// Récupère les permissions effectives d'un utilisateur (rôle + permissions)
const getUserPermissions = (user) => {
  return parsePermissions(user?.permissions);
};

// ========== MIDDLEWARE DE PERMISSION ==========
// requirePermission('doleances', 'transfer', 'agent_central', 'administrateur_systeme')
// Vérifie la permission demandée; sinon, si le rôle est dans la liste fallback, autorise.
const requirePermission = (module, action, ...fallbackRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }

    const userRole = req.user.role_nom || req.user.nom_role;

    // 1) Autorisation via permissions
    if (hasPermission(req.user.permissions, module, action)) {
      return next();
    }

    // 2) Fallback rôles explicites (compatibilité avec les listes de rôles existantes)
    if (fallbackRoles.length > 0 && fallbackRoles.includes(userRole)) {
      return next();
    }

    // 3) Fallback rôles admin (accès total historique)
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    if (adminRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Accès interdit. Permission requise: ${module}.${action}. Votre rôle: ${userRole || 'non défini'}`
    });
  };
};

// ========== EXPORTS ==========
module.exports = { 
  protect, 
  authorize, 
  authorizeSelf,
  authorizeDirection,
  isAgentCentral,
  isAdmin,
  isSuperAdmin,
  authorizeDoleance,
  parsePermissions,
  hasPermission,
  getUserPermissions,
  requirePermission
};