const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/authMiddleware');
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
router.get('/utilisateurs', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getUtilisateurs);
router.get('/utilisateurs/:id', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getUtilisateurById);
router.post('/utilisateurs', requirePermission('users', 'create', 'administrateur_systeme', 'administrateur', 'agent_central'), createUtilisateur);
router.put('/utilisateurs/:id', requirePermission('users', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), updateUtilisateur);
router.delete('/utilisateurs/:id', requirePermission('users', 'delete', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteUtilisateur);

// Rôles
router.get('/roles', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), getRoles);
router.get('/roles/:id', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), getRoleById);
router.post('/roles', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), createRole);
router.put('/roles/:id', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), updateRole);
router.delete('/roles/:id', requirePermission('users', 'manage_roles', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteRole);

// Directions
router.get('/directions', getDirections);
router.get('/directions/:id', getDirectionById);
router.post('/directions', requirePermission('directions', 'manage_direction', 'administrateur_systeme', 'administrateur', 'agent_central'), createDirection);
router.put('/directions/:id', requirePermission('directions', 'manage_direction', 'administrateur_systeme', 'administrateur', 'agent_central'), updateDirection);
router.delete('/directions/:id', requirePermission('directions', 'manage_direction', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteDirection);

// Doléances
router.get('/doleances', getDoleances);
router.get('/doleances/:id', getDoleanceById);
router.put('/doleances/:id', requirePermission('doleances', 'update', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent_central'), updateDoleance);
router.delete('/doleances/:id', requirePermission('doleances', 'delete', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteDoleance);

// Citoyens
router.get('/citoyens', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getCitoyens);
router.get('/citoyens/:id', requirePermission('users', 'view', 'administrateur_systeme', 'administrateur', 'agent_central'), getCitoyenById);
router.post('/citoyens', requirePermission('users', 'create', 'administrateur_systeme', 'administrateur', 'agent_central'), createCitoyen);

// Catégories
router.get('/categories/:id', requirePermission('doleances', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), getCategorieById);
router.post('/categories', requirePermission('doleances', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), createCategorie);
router.put('/categories/:id', requirePermission('doleances', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), updateCategorie);
router.delete('/categories/:id', requirePermission('doleances', 'update', 'administrateur_systeme', 'administrateur', 'agent_central'), deleteCategorie);

// Réponses
router.get('/reponses', requirePermission('doleances', 'add_response', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getReponses);
router.post('/reponses', requirePermission('doleances', 'add_response', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createReponse);

// Assignations
router.get('/assignations', requirePermission('doleances', 'assign', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getAssignations);
router.post('/assignations', requirePermission('doleances', 'assign', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), createAssignation);

// Historique
router.get('/historique-statuts', requirePermission('doleances', 'update_status', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getHistoriqueStatuts);
router.post('/historique-statuts', requirePermission('doleances', 'update_status', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createHistoriqueStatut);

// Transferts
router.get('/transferts', requirePermission('doleances', 'transfer', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur'), getTransferts);
router.post('/transferts', requirePermission('doleances', 'transfer', 'administrateur_systeme', 'administrateur', 'agent_central'), createTransfert);

// Pièces jointes
router.get('/pieces-jointes', requirePermission('doleances', 'add_response', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getPiecesJointes);
router.post('/pieces-jointes', requirePermission('doleances', 'add_response', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createPieceJointe);
router.delete('/pieces-jointes/:id', requirePermission('doleances', 'delete', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), deletePieceJointe);

// Commentaires internes
router.get('/commentaires-internes', requirePermission('doleances', 'add_response', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), getCommentairesInternes);
router.post('/commentaires-internes', requirePermission('doleances', 'add_response', 'administrateur_systeme', 'administrateur', 'agent_central', 'directeur', 'agent'), createCommentaireInterne);

// Notifications
router.get('/notifications', getNotifications);
router.post('/notifications', requirePermission('users', 'manage_roles', 'administrateur_systeme'), createNotification);
router.put('/notifications/:id/read', markNotificationAsRead);

// Logs
router.get('/logs-activites', requirePermission('users', 'manage_roles', 'administrateur_systeme'), getLogsActivites);
router.post('/logs-activites', requirePermission('users', 'manage_roles', 'administrateur_systeme'), createLogActivite);

module.exports = router;
