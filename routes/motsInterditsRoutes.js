// routes/motsInterditsRoutes.js
// Mots interdits : liste des gros mots détectés dans les doléances.
// Réservé à l'espace administrateur.
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getMotsInterdits,
  createMotInterdit,
  updateMotInterdit,
  deleteMotInterdit
} = require('../controllers/motsInterditsController');

// Toutes les routes nécessitent une authentification + droits administrateur
router.use(protect);
router.use(isAdmin);

router.get('/', getMotsInterdits);
router.post('/', createMotInterdit);
router.put('/:id', updateMotInterdit);
router.delete('/:id', deleteMotInterdit);

module.exports = router;
