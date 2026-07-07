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
// Seul le super admin peut voir les rôles et permissions
router.get('/', authorize('administrateur_systeme'), getRoles);
router.get('/hierarchy', authorize('administrateur_systeme'), getRoleHierarchy);
router.get('/:id', authorize('administrateur_systeme'), getRoleById);
router.get('/:id/permissions', authorize('administrateur_systeme'), getRolePermissions);

// ========== ROUTES D'ÉCRITURE ==========
// Admin système uniquement
router.post('/init', authorize('administrateur_systeme'), initDefaultRoles);
router.post('/', authorize('administrateur_systeme'), createRole);
router.put('/:id', authorize('administrateur_systeme'), updateRole);
router.delete('/:id', authorize('administrateur_systeme'), deleteRole);
router.put('/:id/permissions', authorize('administrateur_systeme'), updateRolePermissions);

module.exports = router;