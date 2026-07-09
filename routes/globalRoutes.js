const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getUtilisateurs, getUtilisateurById, createUtilisateur, updateUtilisateur, deleteUtilisateur,
  getRoles, getRoleById, createRole, updateRole, deleteRole,
  getDirections, getDirectionById, createDirection, updateDirection, deleteDirection,
  getDoleances, getDoleanceById, createDoleance, updateDoleance, deleteDoleance,
  getCitoyens, getCitoyenById, createCitoyen,
  getCategories, getCategorieById, createCategorie,
  getStatuts, getPriorites, getQuartiers, getArrondissements,
  getReponses, createReponse,
  getAssignations, createAssignation,
  getHistoriqueStatuts, createHistoriqueStatut,
  getTransferts, createTransfert,
  getPiecesJointes, createPieceJointe, deletePieceJointe,
  getCommentairesInternes, createCommentaireInterne,
  getNotifications, createNotification, markNotificationAsRead,
  getLogsActivites, createLogActivite,
  getDoleanceByReference
} = require('../controllers/globalController');

// ==================== ROUTES PUBLIQUES ====================
router.get('/doleances/public', getDoleances);
router.get('/doleances/public/:id', getDoleanceById);


// router.get("/public/:reference", getDoleanceByReference);
router.get("/public/:reference", getDoleanceByReference);


router.post('/doleances', createDoleance);
router.get('/categories', getCategories);
router.get('/priorites', getPriorites);
router.get('/directions', getDirections);
router.get('/quartiers', getQuartiers);
router.get('/arrondissements', getArrondissements);
router.get('/statuts', getStatuts);

// ==================== ROUTES PROTÉGÉES ====================
router.use(protect);

// Utilisateurs
router.get('/utilisateurs', authorize('administrateur_systeme', 'administrateur'), getUtilisateurs);
router.get('/utilisateurs/:id', authorize('administrateur_systeme', 'administrateur'), getUtilisateurById);
router.post('/utilisateurs', authorize('administrateur_systeme', 'administrateur'), createUtilisateur);
router.put('/utilisateurs/:id', authorize('administrateur_systeme', 'administrateur'), updateUtilisateur);
router.delete('/utilisateurs/:id', authorize('administrateur_systeme', 'administrateur'), deleteUtilisateur);

// Rôles
router.get('/roles', authorize('administrateur_systeme'), getRoles);
router.get('/roles/:id', authorize('administrateur_systeme'), getRoleById);
router.post('/roles', authorize('administrateur_systeme'), createRole);
router.put('/roles/:id', authorize('administrateur_systeme'), updateRole);
router.delete('/roles/:id', authorize('administrateur_systeme'), deleteRole);

// Directions
router.get('/directions', getDirections);
router.get('/directions/:id', getDirectionById);
router.post('/directions', authorize('administrateur_systeme'), createDirection);
router.put('/directions/:id', authorize('administrateur_systeme'), updateDirection);
router.delete('/directions/:id', authorize('administrateur_systeme'), deleteDirection);

// Doléances
router.get('/doleances', getDoleances);
router.get('/doleances/:id', getDoleanceById);
router.put('/doleances/:id', updateDoleance);
router.delete('/doleances/:id', authorize('administrateur_systeme', 'administrateur'), deleteDoleance);

// Citoyens
router.get('/citoyens', getCitoyens);
router.get('/citoyens/:id', getCitoyenById);
router.post('/citoyens', createCitoyen);

// Catégories
router.get('/categories', getCategories);
router.get('/categories/:id', getCategorieById);
router.post('/categories', authorize('administrateur_systeme'), createCategorie);

// Réponses
router.get('/reponses', getReponses);
router.post('/reponses', createReponse);

// Assignations
router.get('/assignations', getAssignations);
router.post('/assignations', createAssignation);

// Historique
router.get('/historique-statuts', getHistoriqueStatuts);
router.post('/historique-statuts', createHistoriqueStatut);

// Transferts
router.get('/transferts', getTransferts);
router.post('/transferts', createTransfert);

// Pièces jointes
router.get('/pieces-jointes', getPiecesJointes);
router.post('/pieces-jointes', createPieceJointe);
router.delete('/pieces-jointes/:id', deletePieceJointe);

// Commentaires internes
router.get('/commentaires-internes', getCommentairesInternes);
router.post('/commentaires-internes', createCommentaireInterne);

// Notifications
router.get('/notifications', getNotifications);
router.post('/notifications', createNotification);
router.put('/notifications/:id/read', markNotificationAsRead);

// Logs
router.get('/logs-activites', getLogsActivites);
router.post('/logs-activites', createLogActivite);

module.exports = router;