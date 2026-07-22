const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  // Directions
  getDirections,
  getDirectionById,
  createDirection,
  updateDirection,
  deleteDirection,
  getDirectionDetails,
  // Services
  getServices,
  getServicesByDirection,
  createService,
  updateService,
  deleteService,
  // Doléances
  getDoleancesByDirection,
  getDoleancesTransferees,
  transfererDoleance,
  // Stats
  getDirectionsStats,
  getUsersWithoutDirection
} = require('../controllers/directionController');

// ========== ROUTES PROTÉGÉES ==========
router.use(protect);

// ========== STATISTIQUES ==========
router.get('/stats', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getDirectionsStats);
router.get('/users/without-direction', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getUsersWithoutDirection);

// ========== DÉTAILS COMPLETS D'UNE DIRECTION ==========
router.get('/:id/details', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getDirectionDetails);

// ========== DOLÉANCES PAR DIRECTION ==========
router.get('/:id/doleances', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getDoleancesByDirection);
router.get('/:id/doleances-transferees', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getDoleancesTransferees);
router.post('/doleances/:id/transfert', authorize('administrateur_systeme', 'administrateur', 'directeur', 'agent_central'), transfererDoleance);

// ========== ROUTES DIRECTIONS ==========
router.route('/')
  .get(getDirections)
  .post(authorize('administrateur_systeme', 'administrateur', 'agent_central'), createDirection);

router.route('/:id')
  .get(getDirectionById)
  .put(authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateDirection)
  .delete(authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteDirection);

// ========== ROUTES SERVICES ==========
router.get('/services', getServices);
router.get('/:directionId/services', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getServicesByDirection);

router.route('/services/:id')
  .put(authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateService)
  .delete(authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteService);

router.post('/services', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createService);

module.exports = router;
