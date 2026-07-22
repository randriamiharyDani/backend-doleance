// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
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
router.get('/', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getUsers);
router.get('/stats', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getUserStats);
router.get('/agents', authorize('agent_central', 'administrateur_systeme', 'administrateur'), getAgentsDisponibles);
router.get('/agents/disponibles', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getAgentsDisponibles);
router.get('/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getUserById);
router.get('/:id/logs', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getActivityLogs);
router.post('/', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createUser);
router.put('/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateUser);
router.delete('/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteUser);
router.patch('/:id/toggle', authorize('administrateur_systeme', 'administrateur', 'agent_central'), toggleActif);
router.post('/:id/reset-password', authorize('administrateur_systeme', 'administrateur', 'agent_central'), resetPassword);

module.exports = router;
