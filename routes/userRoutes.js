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

// ========== ROUTES POUR AGENT CENTRAL ==========
// Route pour récupérer les agents (accessible à agent_central et administrateur_systeme)
router.get('/agents', authorize('agent_central', 'administrateur_systeme', 'administrateur'), getAgentsDisponibles);

// ========== ROUTES ADMINISTRATION (Super Admin uniquement) ==========
// Seul l'administrateur_systeme peut gérer les utilisateurs

// Gestion des utilisateurs
router.get('/', authorize('administrateur_systeme'), getUsers);
router.get('/stats', authorize('administrateur_systeme'), getUserStats);
router.get('/agents/disponibles', authorize('administrateur_systeme'), getAgentsDisponibles);
router.get('/:id', authorize('administrateur_systeme'), getUserById);
router.get('/:id/logs', authorize('administrateur_systeme'), getActivityLogs);
router.post('/', authorize('administrateur_systeme'), createUser);
router.put('/:id', authorize('administrateur_systeme'), updateUser);
router.delete('/:id', authorize('administrateur_systeme'), deleteUser);
router.patch('/:id/toggle', authorize('administrateur_systeme'), toggleActif);
router.post('/:id/reset-password', authorize('administrateur_systeme'), resetPassword);

module.exports = router;