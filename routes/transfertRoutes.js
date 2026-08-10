// routes/transfertRoutes.js
const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/authMiddleware');
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
router.get('/a-transférer', requirePermission('doleances', 'transfer', 'agent_central', 'administrateur_systeme', 'administrateur'), getDoleancesATransferer);
router.get('/historique', requirePermission('doleances', 'transfer', 'agent_central', 'administrateur_systeme', 'administrateur', 'directeur'), getHistoriqueTransferts);
router.get('/stats', requirePermission('doleances', 'transfer', 'agent_central', 'administrateur_systeme', 'administrateur'), getStatsTransferts);

// Actions de transfert
router.post('/:id/transferer-direction', requirePermission('doleances', 'transfer', 'agent_central', 'administrateur_systeme', 'administrateur'), transfererVersDirection);
router.post('/:id/transferer-service', requirePermission('doleances', 'transfer', 'agent_central', 'administrateur_systeme', 'administrateur'), transfererVersService);
router.post('/:id/annuler', requirePermission('doleances', 'transfer', 'agent_central', 'administrateur_systeme', 'administrateur'), annulerTransfert);

module.exports = router;
