const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');
const {
  getTrashedDoleances,
  restoreDoleance,
  permanentDeleteDoleance,
  emptyTrash,
  getTrashCount
} = require('../controllers/corbeilleController');

// Toutes les routes corbeille nécessitent authentification + admin système
router.use(protect);
router.use(isSuperAdmin);

// Lister les doléances supprimées
router.get('/', getTrashedDoleances);

// Nombre d'éléments dans la corbeille
router.get('/count', getTrashCount);

// Restaurer une doléance
router.post('/:id/restore', restoreDoleance);

// Supprimer définitivement une doléance
router.delete('/:id', permanentDeleteDoleance);

// Vider la corbeille (toutes ou sélectionnées)
router.post('/empty', emptyTrash);

module.exports = router;
