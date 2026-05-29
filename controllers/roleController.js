const { pool } = require('../config/database');

// Liste des rôles système de la CUA
const SYSTEM_ROLES = [
  'administrateur_systeme',
  'maire',
  'agent_central',
  'directeur',
  'chef_service',
  'agent',
  'secretaire_general',
  'responsable_arrondissement',
  'agent_terrain',
  'superviseur',
  'consultant'
];

// Permissions par défaut pour chaque rôle - COMPLÈTES
const DEFAULT_PERMISSIONS = {
  administrateur_systeme: {
    doleances: ['create', 'view_all', 'update', 'delete', 'assign', 'transfer', 'add_response', 'stats_view'],
    users: ['create', 'view', 'update', 'delete', 'manage_roles'],
    profile: ['view', 'edit', 'change_password'],
    directions: ['manage_direction', 'manage_service', 'view_team'],
    rapports: ['generate', 'export']
  },
  maire: {
    doleances: ['view_all', 'add_response', 'stats_view', 'validate'],
    profile: ['view', 'edit', 'change_password']
  },
  agent_central: {
    doleances: ['view_all', 'transfer', 'assign', 'delete', 'stats_view'],
    users: ['view_agents'],
    profile: ['view', 'edit', 'change_password']
  },
  directeur: {
    doleances: ['view_all', 'assign', 'stats_view', 'update_status'],
    users: ['view_agents'],
    directions: ['manage_direction', 'view_team'],
    profile: ['view', 'edit', 'change_password']
  },
  chef_service: {
    doleances: ['view_all', 'assign', 'update_status', 'add_response'],
    users: ['view_agents'],
    directions: ['manage_service', 'view_team'],
    profile: ['view', 'edit', 'change_password']
  },
  agent: {
    doleances: ['create', 'view_own', 'update_status', 'add_response'],
    profile: ['view', 'edit', 'change_password']
  },
  secretaire_general: {
    doleances: ['view_all', 'stats_view'],
    users: ['view_agents'],
    rapports: ['generate'],
    profile: ['view', 'edit', 'change_password']
  },
  responsable_arrondissement: {
    doleances: ['view_all', 'update_status', 'add_response'],
    profile: ['view', 'edit', 'change_password']
  },
  agent_terrain: {
    doleances: ['view_own', 'update_status'],
    profile: ['view', 'edit', 'change_password']
  },
  superviseur: {
    doleances: ['view_all', 'validate', 'stats_view'],
    profile: ['view', 'edit', 'change_password']
  },
  consultant: {
    doleances: ['view_all'],
    profile: ['view', 'edit', 'change_password']
  }
};

// Récupérer tous les rôles - Accessible à tout utilisateur authentifié
const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.execute('SELECT * FROM roles ORDER BY id_role');
    
    const enrichedRoles = roles.map(role => {
      let permissions = {};
      if (role.permissions) {
        try {
          permissions = typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions) 
            : role.permissions;
        } catch (e) {
          permissions = {};
        }
      }
      
      return {
        ...role,
        isSystem: SYSTEM_ROLES.includes(role.nom_role),
        defaultPermissions: DEFAULT_PERMISSIONS[role.nom_role] || {},
        permissions: permissions
      };
    });
    
    res.json({ success: true, data: enrichedRoles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des rôles' 
    });
  }
};

// Récupérer un rôle par ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id_role = ?', [id]);
    
    if (roles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rôle non trouvé' 
      });
    }
    
    const role = roles[0];
    let permissions = {};
    if (role.permissions) {
      try {
        permissions = typeof role.permissions === 'string' 
          ? JSON.parse(role.permissions) 
          : role.permissions;
      } catch (e) {
        permissions = {};
      }
    }
    
    const enrichedRole = {
      ...role,
      isSystem: SYSTEM_ROLES.includes(role.nom_role),
      defaultPermissions: DEFAULT_PERMISSIONS[role.nom_role] || {},
      permissions: permissions
    };
    
    res.json({ success: true, data: enrichedRole });
  } catch (error) {
    console.error('Get role by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement' 
    });
  }
};

// Créer un nouveau rôle
const createRole = async (req, res) => {
  try {
    const { nom_role, description, permissions, isSystem } = req.body;
    
    console.log('📝 Création rôle:', { nom_role, description });
    
    if (!nom_role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom du rôle est requis' 
      });
    }
    
    // Vérifier si le rôle existe déjà
    const [existing] = await pool.execute(
      'SELECT id_role FROM roles WHERE nom_role = ?',
      [nom_role]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ce nom de rôle existe déjà' 
      });
    }
    
    // Si c'est un rôle système, utiliser les permissions par défaut
    let finalPermissions = permissions || {};
    if (SYSTEM_ROLES.includes(nom_role)) {
      finalPermissions = DEFAULT_PERMISSIONS[nom_role] || {};
    }
    
    const permissionsJson = JSON.stringify(finalPermissions);
    const isSystemRole = isSystem || SYSTEM_ROLES.includes(nom_role);
    
    const [result] = await pool.execute(
      'INSERT INTO roles (nom_role, description, permissions, is_system) VALUES (?, ?, ?, ?)',
      [nom_role, description || null, permissionsJson, isSystemRole]
    );
    
    console.log('✅ Rôle créé avec ID:', result.insertId);
    
    res.status(201).json({ 
      success: true, 
      message: 'Rôle créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création: ' + error.message 
    });
  }
};

// Mettre à jour un rôle
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_role, description, permissions } = req.body;
    
    console.log('✏️ Mise à jour rôle ID:', id);
    
    // Vérifier si le rôle existe
    const [existing] = await pool.execute(
      'SELECT nom_role, is_system FROM roles WHERE id_role = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rôle non trouvé' 
      });
    }
    
    const isSystemRole = existing[0].is_system || SYSTEM_ROLES.includes(existing[0].nom_role);
    
    // Empêcher la modification des rôles système
    if (isSystemRole && nom_role && nom_role !== existing[0].nom_role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible de modifier le nom d\'un rôle système' 
      });
    }
    
    // Vérifier si le nouveau nom n'est pas déjà pris
    if (nom_role && nom_role !== existing[0].nom_role) {
      const [duplicate] = await pool.execute(
        'SELECT id_role FROM roles WHERE nom_role = ? AND id_role != ?',
        [nom_role, id]
      );
      
      if (duplicate.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ce nom de rôle est déjà utilisé' 
        });
      }
    }
    
    // Pour les rôles système, fusionner avec les permissions par défaut
    let finalPermissions = permissions;
    if (isSystemRole && permissions) {
      const defaultPerms = DEFAULT_PERMISSIONS[existing[0].nom_role] || {};
      finalPermissions = { ...defaultPerms, ...permissions };
    }
    
    const permissionsJson = finalPermissions ? JSON.stringify(finalPermissions) : null;
    
    await pool.execute(
      'UPDATE roles SET nom_role = ?, description = ?, permissions = ? WHERE id_role = ?',
      [nom_role || existing[0].nom_role, description || null, permissionsJson, id]
    );
    
    console.log('✅ Rôle mis à jour');
    
    res.json({ 
      success: true, 
      message: 'Rôle mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour: ' + error.message 
    });
  }
};

// Supprimer un rôle
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Suppression rôle ID:', id);
    
    // Vérifier si le rôle existe
    const [role] = await pool.execute(
      'SELECT nom_role, is_system FROM roles WHERE id_role = ?',
      [id]
    );
    
    if (role.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rôle non trouvé' 
      });
    }
    
    const roleName = role[0].nom_role;
    const isSystemRole = role[0].is_system || SYSTEM_ROLES.includes(roleName);
    
    // Empêcher la suppression des rôles système
    if (isSystemRole) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer le rôle système "${roleName}"` 
      });
    }
    
    // Vérifier si des utilisateurs utilisent ce rôle
    const [usersWithRole] = await pool.execute(
      'SELECT COUNT(*) as count FROM utilisateurs WHERE id_role = ?',
      [id]
    );
    
    if (usersWithRole[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer ce rôle car ${usersWithRole[0].count} utilisateur(s) y sont associés. Veuillez d'abord réaffecter ces utilisateurs.` 
      });
    }
    
    await pool.execute('DELETE FROM roles WHERE id_role = ?', [id]);
    
    console.log('✅ Rôle supprimé');
    
    res.json({ 
      success: true, 
      message: `Rôle "${roleName}" supprimé avec succès` 
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression: ' + error.message 
    });
  }
};

// Récupérer les permissions d'un rôle
const getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [roles] = await pool.execute(
      'SELECT nom_role, permissions, is_system FROM roles WHERE id_role = ?',
      [id]
    );
    
    if (roles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rôle non trouvé' 
      });
    }
    
    let permissions = {};
    if (roles[0].permissions) {
      try {
        permissions = typeof roles[0].permissions === 'string' 
          ? JSON.parse(roles[0].permissions) 
          : roles[0].permissions;
      } catch (e) {
        permissions = {};
      }
    }
    
    const isSystem = roles[0].is_system || SYSTEM_ROLES.includes(roles[0].nom_role);
    const defaultPermissions = isSystem ? DEFAULT_PERMISSIONS[roles[0].nom_role] || {} : {};
    
    res.json({ 
      success: true, 
      data: {
        custom: permissions,
        default: defaultPermissions,
        merged: { ...defaultPermissions, ...permissions }
      }
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des permissions' 
    });
  }
};

// Mettre à jour les permissions d'un rôle
const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    const [role] = await pool.execute(
      'SELECT nom_role, is_system FROM roles WHERE id_role = ?',
      [id]
    );
    
    if (role.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rôle non trouvé' 
      });
    }
    
    const isSystemRole = role[0].is_system || SYSTEM_ROLES.includes(role[0].nom_role);
    
    // Pour les rôles système, fusionner avec les permissions par défaut
    let finalPermissions = permissions;
    if (isSystemRole) {
      const defaultPerms = DEFAULT_PERMISSIONS[role[0].nom_role] || {};
      finalPermissions = { ...defaultPerms, ...permissions };
    }
    
    const permissionsJson = JSON.stringify(finalPermissions || {});
    
    await pool.execute(
      'UPDATE roles SET permissions = ? WHERE id_role = ?',
      [permissionsJson, id]
    );
    
    console.log('✅ Permissions mises à jour pour le rôle:', role[0].nom_role);
    
    res.json({ 
      success: true, 
      message: 'Permissions mises à jour avec succès',
      data: finalPermissions
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour des permissions: ' + error.message 
    });
  }
};

// Initialiser les rôles par défaut de la CUA
const initDefaultRoles = async (req, res) => {
  try {
    console.log('🚀 Initialisation des rôles par défaut de la CUA...');
    
    let createdCount = 0;
    
    for (const roleName of SYSTEM_ROLES) {
      const [existing] = await pool.execute(
        'SELECT id_role FROM roles WHERE nom_role = ?',
        [roleName]
      );
      
      if (existing.length === 0) {
        const permissions = DEFAULT_PERMISSIONS[roleName] || {};
        const permissionsJson = JSON.stringify(permissions);
        const description = getRoleDescription(roleName);
        
        await pool.execute(
          'INSERT INTO roles (nom_role, description, permissions, is_system) VALUES (?, ?, ?, ?)',
          [roleName, description, permissionsJson, true]
        );
        console.log(`✅ Rôle "${roleName}" créé`);
        createdCount++;
      } else {
        console.log(`ℹ️ Rôle "${roleName}" existe déjà`);
      }
    }
    
    res.json({ 
      success: true, 
      message: `${createdCount} rôle(s) par défaut initialisé(s) avec succès`,
      data: { created: createdCount }
    });
  } catch (error) {
    console.error('Init default roles error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'initialisation des rôles: ' + error.message 
    });
  }
};

// Helper pour obtenir la description d'un rôle
const getRoleDescription = (roleName) => {
  const descriptions = {
    administrateur_systeme: 'Administrateur Système - Contrôle total du système',
    maire: 'Maire - Validation finale des doléances et décisions importantes',
    agent_central: 'Agent Central - Répartition et transfert des doléances',
    directeur: 'Directeur - Gestion d\'une direction municipale',
    chef_service: 'Chef de Service - Supervision d\'un service',
    agent: 'Agent de traitement - Traitement des doléances',
    secretaire_general: 'Secrétaire Général - Coordination générale',
    responsable_arrondissement: 'Responsable d\'Arrondissement - Gestion locale',
    agent_terrain: 'Agent de Terrain - Interventions physiques',
    superviseur: 'Superviseur - Supervision des agents',
    consultant: 'Consultant - Consultation uniquement'
  };
  return descriptions[roleName] || `Rôle système: ${roleName}`;
};

// Obtenir la hiérarchie des rôles
const getRoleHierarchy = async (req, res) => {
  try {
    const hierarchy = {
      administrateur_systeme: { level: 7, canManage: ['*'], description: 'Administrateur Système' },
      maire: { level: 6, canManage: ['directeur', 'chef_service', 'agent', 'agent_terrain'], description: 'Maire' },
      secretaire_general: { level: 5, canManage: ['directeur', 'chef_service'], description: 'Secrétaire Général' },
      agent_central: { level: 5, canManage: ['directeur', 'chef_service'], description: 'Agent Central' },
      directeur: { level: 4, canManage: ['chef_service', 'agent', 'agent_terrain'], description: 'Directeur' },
      chef_service: { level: 3, canManage: ['agent', 'agent_terrain'], description: 'Chef de Service' },
      superviseur: { level: 3, canManage: ['agent', 'agent_terrain'], description: 'Superviseur' },
      responsable_arrondissement: { level: 3, canManage: ['agent', 'agent_terrain'], description: 'Responsable d\'Arrondissement' },
      agent: { level: 2, canManage: [], description: 'Agent' },
      agent_terrain: { level: 1, canManage: [], description: 'Agent de Terrain' },
      consultant: { level: 1, canManage: [], description: 'Consultant' }
    };
    
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    console.error('Get role hierarchy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement de la hiérarchie' 
    });
  }
};

// Vérifier si un utilisateur a une permission spécifique
const checkPermission = async (userId, permission) => {
  try {
    const [users] = await pool.execute(
      `SELECT r.permissions 
       FROM utilisateurs u
       JOIN roles r ON u.id_role = r.id_role
       WHERE u.id_utilisateur = ?`,
      [userId]
    );
    
    if (users.length === 0) return false;
    
    let permissions = users[0].permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = {};
      }
    }
    
    // Vérifier si l'utilisateur a la permission
    return permissions?.all?.includes('*') || permissions?.[permission] === true;
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  initDefaultRoles,
  getRoleHierarchy,
  checkPermission
};