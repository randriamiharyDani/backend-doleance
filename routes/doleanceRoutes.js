// routes/doleanceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, isAgentCentral } = require('../middleware/authMiddleware');
const {
    createDoleance,
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
    addSatisfaction,
    deleteDoleance,
    updatePriorite,
    getCategories,
    getStatuts,
    getPriorites,
    getDirections,
    getQuartiers,
    getRoles,
    uploadPiecesJointes,
    getPiecesJointes,
    downloadPieceJointe,
    deletePieceJointe,
    sendReferenceByContact,
    getSuggestions
} = require('../controllers/doleanceController');

// ========== ROUTES PUBLIQUES (SANS AUTHENTIFICATION) ==========
// Routes accessibles à tous
router.get('/public', getDoleancesPublic);
router.post('/public', createDoleance);
router.get('/public/:reference', getDoleanceByReference);
router.get('/public/suggestions', getSuggestions);
router.get('/public/citoyen/:identifiant/doleances', getDoleancesByCitizenId);
router.get('/public/citoyen/:identifiant/doleance/:reference', getDoleanceByReferenceAndCitizenId);

// Routes publiques pour les données de référence
router.get('/categories', getCategories);
router.get('/statuts', getStatuts);
router.get('/priorites', getPriorites);
router.get('/directions', getDirections);
router.get('/quartiers', getQuartiers);
router.get('/roles', getRoles);

// Routes publiques pour les citoyens
router.post('/', createDoleance);
router.post('/:id/satisfaction', addSatisfaction);
router.post('/send-reference', sendReferenceByContact);
router.get('/citoyen/:identifiant/doleances', getDoleancesByCitizenId);
router.get('/citoyen/:identifiant/doleance/:reference', getDoleanceByReferenceAndCitizenId);
router.get('/by-citizen/:identifiant', getDoleancesByCitizenId);

// ========== ROUTES PROTÉGÉES (BACKOFFICE) ==========
// Toutes les routes ci-dessous nécessitent une authentification
router.use(protect);

// ========== DOLÉANCES BACKOFFICE ==========
// Route principale backoffice avec filtres
router.get('/backoffice', authorize(
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

// ========== CRUD DOLÉANCES ==========
// Récupérer toutes les doléances (admin et agent central)
router.get('/', authorize('administrateur_systeme', 'agent_central', 'administrateur'), getDoleances);

// Récupérer une doléance par ID
router.get('/:id', authorize(
    'administrateur_systeme', 
    'agent_central', 
    'administrateur', 
    'directeur', 
    'agent'
), getDoleanceById);

// Mettre à jour le statut
router.put('/:id/statut', authorize(
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), updateStatut);

// Mettre à jour la priorité
router.put('/:id/priorite', authorize(
    'administrateur_systeme',
    'agent_central',
    'administrateur'
), updatePriorite);

// Ajouter une réponse
router.post('/:id/reponses', authorize(
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), addReponse);

// Supprimer une doléance (admin et agent central uniquement)
router.delete('/:id', authorize('agent_central', 'administrateur_systeme'), deleteDoleance);

// ========== PIÈCES JOINTES ==========
// Upload de pièces jointes
router.post('/upload', authorize(
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), uploadPiecesJointes);

// Récupérer les pièces jointes d'une doléance
router.get('/:id/pieces-jointes', authorize(
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), getPiecesJointes);

// Télécharger une pièce jointe spécifique
router.get('/pieces/:id/download', authorize(
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service',
    'agent'
), downloadPieceJointe);

// Supprimer une pièce jointe (admin et agent central uniquement)
router.delete('/pieces/:id', authorize('agent_central', 'administrateur_systeme'), deletePieceJointe);

// ========== STATISTIQUES ==========
router.get('/stats/overview', authorize(
    'administrateur_systeme',
    'agent_central',
    'administrateur',
    'directeur',
    'chef_service'
), async (req, res) => {
    try {
        const { pool } = require('../config/database');
        
        // Statistiques globales
        const [total] = await pool.execute('SELECT COUNT(*) as total FROM doleances');
        const [enAttente] = await pool.execute(
            "SELECT COUNT(*) as en_attente FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_attente')"
        );
        const [enCours] = await pool.execute(
            "SELECT COUNT(*) as en_cours FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_cours')"
        );
        const [resolues] = await pool.execute(
            "SELECT COUNT(*) as resolues FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'resolue')"
        );
        
        // Statistiques par catégorie
        const [parCategorie] = await pool.execute(`
            SELECT c.nom_categorie, COUNT(d.id_doleance) as total
            FROM categories_doleance c
            LEFT JOIN doleances d ON c.id_categorie = d.id_categorie
            GROUP BY c.id_categorie
            ORDER BY total DESC
            LIMIT 5
        `);
        
        // Statistiques par priorité
        const [parPriorite] = await pool.execute(`
            SELECT p.nom_priorite, p.niveau, COUNT(d.id_doleance) as total
            FROM priorites p
            LEFT JOIN doleances d ON p.id_priorite = d.id_priorite
            GROUP BY p.id_priorite
            ORDER BY p.niveau DESC
        `);
        
        res.json({
            success: true,
            data: {
                total: total[0].total || 0,
                en_attente: enAttente[0].en_attente || 0,
                en_cours: enCours[0].en_cours || 0,
                resolues: resolues[0].resolues || 0,
                par_categorie: parCategorie || [],
                par_priorite: parPriorite || []
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;