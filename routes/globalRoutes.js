const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getUtilisateurs, getUtilisateurById, createUtilisateur, updateUtilisateur, deleteUtilisateur,
  getRoles, getRoleById, createRole, updateRole, deleteRole,
  getDirections, getDirectionById, createDirection, updateDirection, deleteDirection,
  getDoleances, getDoleanceById, createDoleance, updateDoleance, deleteDoleance,
  getCitoyens, getCitoyenById, createCitoyen,
  getCategories, getCategorieById, createCategorie, updateCategorie, deleteCategorie,
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
router.get('/utilisateurs', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getUtilisateurs);
router.get('/utilisateurs/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getUtilisateurById);
router.post('/utilisateurs', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createUtilisateur);
router.put('/utilisateurs/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateUtilisateur);
router.delete('/utilisateurs/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteUtilisateur);

// Rôles
router.get('/roles', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getRoles);
router.get('/roles/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getRoleById);
router.post('/roles', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createRole);
router.put('/roles/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateRole);
router.delete('/roles/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteRole);

// Directions
router.get('/directions', getDirections);
router.get('/directions/:id', getDirectionById);
router.post('/directions', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createDirection);
router.put('/directions/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateDirection);
router.delete('/directions/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteDirection);

// Doléances
router.get('/doleances', getDoleances);
router.get('/doleances/:id', getDoleanceById);
router.put('/doleances/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent_central'), updateDoleance);
router.delete('/doleances/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteDoleance);

// Citoyens
router.get('/citoyens', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getCitoyens);
router.get('/citoyens/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getCitoyenById);
router.post('/citoyens', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createCitoyen);

// Catégories
router.get('/categories/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), getCategorieById);
router.post('/categories', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createCategorie);
router.put('/categories/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), updateCategorie);
router.delete('/categories/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central'), deleteCategorie);

// Réponses
router.get('/reponses', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getReponses);
router.post('/reponses', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createReponse);

// Assignations
router.get('/assignations', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getAssignations);
router.post('/assignations', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), createAssignation);

// Historique
router.get('/historique-statuts', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getHistoriqueStatuts);
router.post('/historique-statuts', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createHistoriqueStatut);

// Transferts
router.get('/transferts', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getTransferts);
router.post('/transferts', authorize('administrateur_systeme', 'administrateur', 'agent_central'), createTransfert);

// Pièces jointes
router.get('/pieces-jointes', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getPiecesJointes);
router.post('/pieces-jointes', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createPieceJointe);
router.delete('/pieces-jointes/:id', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), deletePieceJointe);

// Commentaires internes
router.get('/commentaires-internes', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getCommentairesInternes);
router.post('/commentaires-internes', authorize('administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createCommentaireInterne);

// Notifications
router.get('/notifications', getNotifications);
router.post('/notifications', authorize('administrateur_systeme'), createNotification);
router.put('/notifications/:id/read', markNotificationAsRead);

// Logs
router.get('/logs-activites', authorize('administrateur_systeme'), getLogsActivites);
router.post('/logs-activites', authorize('administrateur_systeme'), createLogActivite);

module.exports = router;
