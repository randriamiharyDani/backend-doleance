const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createDoleance,
    getDoleances,
    getDoleancesPublic,
    getDoleanceById,
    getDoleanceByReference,
    updateStatut,
    addReponse,
    addSatisfaction,
    deleteDoleance,
    updatePriorite,
    transferer,
    getCategories,
    getStatuts,
    getPriorites,
    getDirections,
    getQuartiers,
    getRoles
} = require('../controllers/doleanceController');

// ========== ROUTES PUBLIQUES ==========
router.get('/public', getDoleancesPublic);
router.post('/', createDoleance);
router.get('/public/:reference', getDoleanceByReference);
router.post('/:id/satisfaction', addSatisfaction);
router.get('/categories', getCategories);
router.get('/priorites', getPriorites);
router.get('/directions', getDirections);
router.get('/quartiers', getQuartiers);
router.get('/statuts', getStatuts);
router.get('/roles', getRoles);

// ========== ROUTES PROTÉGÉES ==========
router.use(protect);

router.get('/', getDoleances);
router.get('/:id', getDoleanceById);
router.put('/:id/statut', authorize('agent', 'directeur', 'administrateur', 'agent_central'), updateStatut);
router.put('/:id/priorite', authorize('agent', 'directeur', 'administrateur', 'agent_central'), updatePriorite);
router.post('/:id/reponses', authorize('agent', 'directeur', 'administrateur'), addReponse);
router.delete('/:id', authorize('agent_central', 'administrateur', 'administrateur_systeme'), deleteDoleance);
router.post('/:id/transferer', protect, authorize('agent_central', 'administrateur_systeme'), transferer);

module.exports = router;