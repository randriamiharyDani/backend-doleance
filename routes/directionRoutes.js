const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/authMiddleware');
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
router.get('/stats', requirePermission('directions', 'view_team', 'administrateur_systeme', 'administrateur', 'agent_central'), getDirectionsStats);
router.get('/users/without-direction', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getUsersWithoutDirection);

// ========== DÉTAILS COMPLETS D'UNE DIRECTION ==========
router.get('/:id/details', requirePermission('directions', 'view_team', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getDirectionDetails);

// ========== DOLÉANCES PAR DIRECTION ==========
router.get('/:id/doleances', requirePermission('doleances', 'view_all', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getDoleancesByDirection);
router.get('/:id/doleances-transferees', requirePermission('doleances', 'view_all', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getDoleancesTransferees);
router.post('/doleances/:id/transfert', requirePermission('doleances', 'transfer', 'administrateur_systeme', 'administrateur', 'directeur', 'agent_central'), transfererDoleance);

// ========== ROUTES DIRECTIONS ==========
router.route('/')
  .get(getDirections)
  .post(requirePermission('directions', 'manage_direction', 'administrateur_systeme', 'administrateur', 'agent_central'), createDirection);

router.route('/:id')
  .get(getDirectionById)
  .put(requirePermission('directions', 'manage_direction', 'administrateur_systeme', 'administrateur', 'agent_central'), updateDirection)
  .delete(requirePermission('directions', 'manage_direction', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteDirection);

// ========== ROUTES SERVICES ==========
router.get('/services', getServices);
router.get('/:directionId/services', requirePermission('directions', 'view_team', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getServicesByDirection);

router.route('/services/:id')
  .put(requirePermission('directions', 'manage_service', 'administrateur_systeme', 'administrateur', 'agent_central'), updateService)
  .delete(requirePermission('directions', 'manage_service', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteService);

router.post('/services', requirePermission('directions', 'manage_service', 'administrateur_systeme', 'administrateur', 'agent_central'), createService);

module.exports = router;
