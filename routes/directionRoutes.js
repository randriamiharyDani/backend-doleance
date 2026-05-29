const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getDirections,
    getDirectionById,
    createDirection,
    updateDirection,
    deleteDirection,
    assignAgentToDirection,
    getUnassignedAgents
} = require('../controllers/directionController');

// Routes publiques (protégées par authentification)
router.get('/', protect, getDirections);
router.get('/unassigned-agents', protect, getUnassignedAgents);
router.get('/:id', protect, getDirectionById);
router.post('/', protect, createDirection);
router.put('/:id', protect, updateDirection);
router.delete('/:id', protect, deleteDirection);
router.post('/assign-agent', protect, assignAgentToDirection);

module.exports = router;