// routes/doleanceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, requirePermission, isAgentCentral, authorizeDoleance } = require('../middleware/authMiddleware');
const {
    createDoleance,
    checkReferenceAvailability,
    getDoleances,
    getDoleancesBackoffice,
    getDoleancesPublic,
    getDoleanceById,
    getDoleanceByReference,
    getDoleancesByCitizenId,
    getDoleanceByReferenceAndCitizenId,
    getDoleancesEnAttenteTransfert,
    transfererDoleanceCentral,
    updateStatut,
    addReponse,
    addReponseCitoyen,
    addSatisfaction,
    deleteDoleance,
    updatePriorite,
    updateDoleance,
    getCategories,
    getStatuts,
    getPriorites,
    getDirections,
    getQuartiers,
    getQuartiersGeoJSON,
    getRoles,
    handleUploadPiecesJointes,
    getPiecesJointes,
    downloadPieceJointe,
    deletePieceJointe,
    sendReferenceByContact,
    getPiecesJointesByReference,
    getSuggestions,
    getStatsOverview,
    getDoleancesAssignedLocations,
    getHistorique,
    retournerDoleance
} = require('../controllers/doleanceController');
const { upload } = require('../models/pieceJointeModel');

// ========== ROUTES PUBLIQUES (SANS AUTHENTIFICATION) ==========
// Routes accessibles à tous
router.get('/public', getDoleancesPublic);
router.post('/public', createDoleance);
router.get('/public/assigned-locations', getDoleancesAssignedLocations);
router.get('/public/suggestions', getSuggestions);
router.get('/public/check-reference/:reference', checkReferenceAvailability);
router.get('/public/:reference/pieces-jointes', getPiecesJointesByReference);
router.get('/public/:reference', getDoleanceByReference);
router.get('/public/citoyen/:identifiant/doleances', getDoleancesByCitizenId);
router.get('/public/citoyen/:identifiant/doleance/:reference', getDoleanceByReferenceAndCitizenId);
router.post('/public/:reference/reponse', addReponseCitoyen);
router.get('/public/pieces/:id/download', downloadPieceJointe);

// Routes publiques pour les données de référence
router.get('/categories', getCategories);
router.get('/statuts', getStatuts);
router.get('/priorites', getPriorites);
router.get('/directions', getDirections);
router.get('/quartiers', getQuartiers);
router.get('/quartiers/geojson', getQuartiersGeoJSON);
router.get('/roles', getRoles);

// Routes publiques pour les citoyens
router.post('/', createDoleance);
router.post('/public/upload', upload, handleUploadPiecesJointes);
router.post('/:id/satisfaction', addSatisfaction);
router.post('/send-reference', sendReferenceByContact);
router.get('/citoyen/:identifiant/doleances', getDoleancesByCitizenId);
router.get('/citoyen/:identifiant/doleance/:reference', getDoleanceByReferenceAndCitizenId);
router.get('/by-citizen/:identifiant', getDoleancesByCitizenId);

// ========== ROUTES PROTÉGÉES (BACKOFFICE) ==========
// Toutes les routes ci-dessous nécessitent une authentification
router.use(protect);

// ========== HISTORIQUE ==========
router.get('/historique', requirePermission(
    'doleances', 'view_all',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), getHistorique);

// ========== DOLÉANCES BACKOFFICE ==========
// Route principale backoffice avec filtres
router.get('/backoffice', requirePermission(
    'doleances', 'view_all',
    'administrateur_systeme', 
    'agent_central', 
    'administrateur', 
    'directeur', 
    'chef_service', 
    'agent'
), getDoleancesBackoffice);

// Route pour les doléances en attente de transfert (agent central uniquement)
router.get('/en-attente', isAgentCentral, getDoleancesEnAttenteTransfert);

// Route pour transférer une doléance (agent central uniquement)
router.post('/:id/transfert-central', isAgentCentral, transfererDoleanceCentral);

// Route pour retourner une doléance au central (agents de direction uniquement)
router.post('/:id/retourner', requirePermission('doleances', 'update_status', 'agent', 'chef_service', 'directeur', 'administrateur_systeme', 'agent_central', 'administrateur'), retournerDoleance);

// ========== CRUD DOLÉANCES ==========
// Récupérer toutes les doléances (admin et agent central)
router.get('/', requirePermission('doleances', 'view_all', 'administrateur_systeme', 'agent_central', 'administrateur'), getDoleances);

// Récupérer une doléance par ID
router.get('/:id', requirePermission(
    'doleances', 'view_all',
    'administrateur_systeme', 
    'agent_central', 
    'administrateur', 
    'directeur', 
    'chef_service',
    'agent'
), authorizeDoleance(), getDoleanceById);

// Modifier une doléance (titre, description, catégorie, etc.)
router.put('/:id', requirePermission(
    'doleances', 'update',
    'administrateur_systeme',
    'agent_central',
    'administrateur'
), updateDoleance);

// Mettre à jour le statut
router.put('/:id/statut', requirePermission(
    'doleances', 'update_status',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), authorizeDoleance(), updateStatut);

router.patch('/:id/statut', requirePermission(
    'doleances', 'update_status',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), authorizeDoleance(), updateStatut);

// Mettre à jour la priorité
router.put('/:id/priorite', requirePermission(
    'doleances', 'update',
    'administrateur_systeme',
    'agent_central',
    'administrateur'
), updatePriorite);

// Ajouter une réponse
router.post('/:id/reponses', requirePermission(
    'doleances', 'add_response',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), authorizeDoleance(), addReponse);

// Supprimer une doléance (admin et agent central uniquement)
router.delete('/:id', requirePermission('doleances', 'delete', 'agent_central', 'administrateur_systeme', 'administrateur'), deleteDoleance);

// ========== PIÈCES JOINTES ==========
// Upload de pièces jointes
router.post('/upload', requirePermission(
    'doleances', 'add_response',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), upload, handleUploadPiecesJointes);

// Récupérer les pièces jointes d'une doléance
router.get('/:id/pieces-jointes', requirePermission(
    'doleances', 'view_all',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), authorizeDoleance(), getPiecesJointes);

// Télécharger une pièce jointe spécifique
router.get('/pieces/:id/download', requirePermission(
    'doleances', 'view_all',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), downloadPieceJointe);

// Supprimer une pièce jointe (admin et agent central uniquement)
router.delete('/pieces/:id', requirePermission('doleances', 'delete', 'agent_central', 'administrateur_systeme', 'administrateur'), deletePieceJointe);

// ========== STATISTIQUES ==========
router.get('/stats/overview', requirePermission(
    'doleances', 'stats_view',
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service'
), getStatsOverview);

module.exports = router;