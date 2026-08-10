// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/authMiddleware');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleActif,
    getAgentsDisponibles,
    getActivityLogs,
    resetPassword,
    getUserStats
} = require('../controllers/userController');

// Routes publiques (pour test)
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Route users fonctionne' });
});

// ========== ROUTES PROTÉGÉES ==========
router.use(protect);

// Profil (accessible par l'utilisateur lui-même)
router.get('/profile', getUserById);
router.put('/profile', updateUser);

// Gestion des utilisateurs
router.get('/', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getUsers);
router.get('/stats', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getUserStats);
router.get('/agents', requirePermission('users', 'view', 'agent_central', 'administrateur_systeme', 'administrateur'), getAgentsDisponibles);
router.get('/agents/disponibles', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getAgentsDisponibles);
router.get('/:id', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getUserById);
router.get('/:id/logs', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getActivityLogs);
router.post('/', requirePermission('users', 'create', 'administrateur_systeme', 'administrateur', 'agent_central'), createUser);
router.put('/:id', requirePermission('users', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), updateUser);
router.delete('/:id', requirePermission('users', 'delete', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteUser);
router.patch('/:id/toggle', requirePermission('users', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), toggleActif);
router.post('/:id/reset-password', requirePermission('users', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), resetPassword);

module.exports = router;
