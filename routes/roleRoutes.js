// routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
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
router.get('/', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getRoles);
router.get('/hierarchy', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getRoleHierarchy);
router.get('/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getRoleById);
router.get('/:id/permissions', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getRolePermissions);

// ========== ROUTES D'ÉCRITURE ==========
router.post('/init', authorize('administrateur_systeme', 'administrateur', 'agent_central'), initDefaultRoles);
router.post('/', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createRole);
router.put('/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateRole);
router.delete('/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteRole);
router.put('/:id/permissions', authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateRolePermissions);

module.exports = router;
