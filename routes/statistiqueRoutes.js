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
    getTempsTraitementMoyen,
    getPerformanceAgents,
    getStatsByQuartier,
    getTauxSatisfaction,
    exportStats
} = require('../controllers/statistiqueController');

router.get('/dashboard', protect, getDashboardStats);
router.get('/categories', protect, authorize('directeur', 'administrateur', 'maire'), getStatsByCategorie);
router.get('/directions', protect, authorize('directeur', 'administrateur', 'maire'), getStatsByDirection);
router.get('/statuts', protect, authorize('directeur', 'administrateur', 'maire'), getStatsByStatut);
router.get('/priorites', protect, authorize('directeur', 'administrateur', 'maire'), getStatsByPriorite);
router.get('/evolution', protect, authorize('directeur', 'administrateur', 'maire'), getEvolutionTemporelle);
router.get('/temps-traitement', protect, authorize('directeur', 'administrateur', 'maire'), getTempsTraitementMoyen);
router.get('/agents-performance', protect, authorize('directeur', 'administrateur', 'maire'), getPerformanceAgents);
router.get('/quartiers', protect, authorize('directeur', 'administrateur', 'maire'), getStatsByQuartier);
router.get('/satisfaction', protect, authorize('directeur', 'administrateur', 'maire'), getTauxSatisfaction);
router.post('/export/:format', protect, authorize('directeur', 'administrateur'), exportStats);

module.exports = router;