const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    getStatsByCategorie,
    getStatsByDirection,
    getStatsByStatut,
    getStatsByPriorite,
    getEvolutionTemporelle,
    getEvolutionStats,
    getCategoriesStats,
    getTempsTraitementMoyen,
    getPerformanceAgents,
    getStatsByQuartier,
    getTauxSatisfaction,
    exportStats
} = require('../controllers/statistiqueController');

// Toutes les routes nécessitent authentification
router.use(protect);

// ========== ROUTES ACCESSIBLES À TOUS LES UTILISATEURS AUTHENTIFIÉS ==========
router.get('/dashboard', getDashboardStats);
router.get('/evolution', getEvolutionStats);
router.get('/categories', getCategoriesStats);
router.get('/statuts', getStatsByStatut);
router.get('/satisfaction', getTauxSatisfaction);
router.get('/evolution-temporelle', getEvolutionTemporelle);
router.get('/temps-traitement', getTempsTraitementMoyen);

// ========== ROUTES ADMINISTRATION (admin système et administrateur uniquement) ==========
router.get('/by-categorie', requirePermission('doleances', 'stats_view', 'administrateur_systeme', 'administrateur', 'agent_central'), getStatsByCategorie);
router.get('/directions', getStatsByDirection);
router.get('/by-priorite', requirePermission('doleances', 'stats_view', 'administrateur_systeme', 'administrateur', 'agent_central'), getStatsByPriorite);
router.get('/by-quartier', requirePermission('doleances', 'stats_view', 'administrateur_systeme', 'administrateur', 'agent_central'), getStatsByQuartier);

// ========== ROUTES PERFORMANCE (tous les utilisateurs authentifiés) ==========
router.get('/performance-agents', getPerformanceAgents);

// ========== ROUTES D'EXPORT (admin système et administrateur uniquement) ==========
router.post('/export/:format', requirePermission('rapports', 'export', 'administrateur_systeme', 'administrateur'), exportStats);

module.exports = router;