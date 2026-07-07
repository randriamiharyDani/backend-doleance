const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
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
router.get('/by-categorie', authorize('administrateur_systeme', 'administrateur'), getStatsByCategorie);
router.get('/by-direction', authorize('administrateur_systeme', 'administrateur'), getStatsByDirection);
router.get('/by-priorite', authorize('administrateur_systeme', 'administrateur'), getStatsByPriorite);
router.get('/by-quartier', authorize('administrateur_systeme', 'administrateur'), getStatsByQuartier);

// ========== ROUTES PERFORMANCE (admin système, admin et directeur) ==========
router.get('/performance-agents', authorize('administrateur_systeme', 'administrateur', 'directeur'), getPerformanceAgents);

// ========== ROUTES D'EXPORT (admin système et administrateur uniquement) ==========
router.post('/export/:format', authorize('administrateur_systeme', 'administrateur'), exportStats);

module.exports = router;