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
  getDirectionDetails,  // AJOUTÉ
  // Services
  getServices,
  getServicesByDirection,
  createService,
  updateService,
  deleteService,
  // Doléances
  getDoleancesByDirection,  // AJOUTÉ
  getDoleancesTransferees,   // AJOUTÉ
  transfererDoleance,         // AJOUTÉ
  // Stats
  getDirectionsStats,
  getUsersWithoutDirection
} = require('../controllers/directionController');

// ========== ROUTES PROTÉGÉES ==========
router.use(protect);

// ========== STATISTIQUES ==========
router.get('/stats', authorize('administrateur_systeme', 'administrateur'), getDirectionsStats);
router.get('/users/without-direction', authorize('administrateur_systeme', 'administrateur'), getUsersWithoutDirection);

// ========== DÉTAILS COMPLETS D'UNE DIRECTION ==========
router.get('/:id/details', authorize('administrateur_systeme', 'administrateur', 'directeur'), getDirectionDetails);

// ========== DOLÉANCES PAR DIRECTION ==========
router.get('/:id/doleances', authorize('administrateur_systeme', 'administrateur', 'directeur'), getDoleancesByDirection);
router.get('/:id/doleances-transferees', authorize('administrateur_systeme', 'administrateur', 'directeur'), getDoleancesTransferees);
router.post('/doleances/:id/transfert', authorize('administrateur_systeme', 'administrateur', 'directeur', 'agent_central'), transfererDoleance);

// ========== ROUTES DIRECTIONS ==========
router.route('/')
  .get(getDirections)
  .post(authorize('administrateur_systeme', 'administrateur'), createDirection);

router.route('/:id')
  .get(getDirectionById)
  .put(authorize('administrateur_systeme', 'administrateur'), updateDirection)
  .delete(authorize('administrateur_systeme', 'administrateur'), deleteDirection);

// ========== ROUTES SERVICES ==========
router.get('/services', getServices);
router.get('/:directionId/services', authorize('administrateur_systeme', 'administrateur', 'directeur'), getServicesByDirection);

router.route('/services/:id')
  .put(authorize('administrateur_systeme', 'administrateur'), updateService)
  .delete(authorize('administrateur_systeme', 'administrateur'), deleteService);

router.post('/services', authorize('administrateur_systeme', 'administrateur'), createService);

module.exports = router;