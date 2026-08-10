// routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/authMiddleware');
const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    updateRolePermissions,
    initDefaultRoles,
    getRoleHierarchy
} = require('../controllers/roleController');

// Toutes les routes nécessitent une authentification
router.use(protect);

// ========== ROUTES DE LECTURE ==========
router.get('/', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), getRoles);
router.get('/hierarchy', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), getRoleHierarchy);
router.get('/:id', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), getRoleById);
router.get('/:id/permissions', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), getRolePermissions);

// ========== ROUTES D'ÉCRITURE ==========
router.post('/init', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), initDefaultRoles);
router.post('/', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), createRole);
router.put('/:id', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), updateRole);
router.delete('/:id', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteRole);
router.put('/:id/permissions', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), updateRolePermissions);

module.exports = router;
