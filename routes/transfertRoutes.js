// routes/transfertRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getDoleancesATransferer,
    transfererVersDirection,
    transfererVersService,
    getHistoriqueTransferts,
    annulerTransfert,
    getStatsTransferts
} = require('../controllers/transfertController');

// Toutes les routes nécessitent authentification
router.use(protect);

// Routes pour l'agent central
router.get('/a-transférer', authorize('agent_central', 'administrateur_systeme', 'administrateur'), getDoleancesATransferer);
router.get('/historique', authorize('agent_central', 'administrateur_systeme', 'administrateur', 'directeur'), getHistoriqueTransferts);
router.get('/stats', authorize('agent_central', 'administrateur_systeme', 'administrateur'), getStatsTransferts);

// Actions de transfert
router.post('/:id/transferer-direction', authorize('agent_central', 'administrateur_systeme', 'administrateur'), transfererVersDirection);
router.post('/:id/transferer-service', authorize('agent_central', 'administrateur_systeme', 'administrateur'), transfererVersService);
router.post('/:id/annuler', authorize('agent_central', 'administrateur_systeme', 'administrateur'), annulerTransfert);

module.exports = router;
