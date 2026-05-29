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

// Routes GET - Accessibles à tous les utilisateurs authentifiés
router.get('/', getRoles);
router.get('/hierarchy', getRoleHierarchy);
router.get('/:id', getRoleById);
router.get('/:id/permissions', getRolePermissions);

// Routes d'initialisation (admin système uniquement)
router.post('/init', authorize('administrateur_systeme'), initDefaultRoles);

// Routes d'écriture - Admin système uniquement
router.post('/', authorize('administrateur_systeme'), createRole);
router.put('/:id', authorize('administrateur_systeme'), updateRole);
router.delete('/:id', authorize('administrateur_systeme'), deleteRole);
router.put('/:id/permissions', authorize('administrateur_systeme'), updateRolePermissions);

module.exports = router;