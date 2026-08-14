// routes/citoyenCallRoutes.js
// Configuration des appels directs Citoyen -> Agent
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const service = require('../services/citoyenCallService');

// Public : configuration de l'appel citoyen (affichée sur la page publique)
router.get('/config', async (req, res) => {
  try {
    const agent = await service.getRecipientAgent();
    if (!agent) {
      return res.json({ success: true, config: null, disponible: false });
    }
    return res.json({
      success: true,
      config: {
        id_utilisateur: agent.id_utilisateur,
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        direction: agent.nom_direction || null,
        role: agent.nom_role || null,
        disponible: agent.disponible,
      },
    });
  } catch (error) {
    console.error('Erreur GET /citoyen-call/config:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Protégé admin : configuration actuelle + liste des agents candidats
router.get('/recipient', protect, isAdmin, async (req, res) => {
  try {
    const config = await service.getRecipientAgent();
    const agents = await service.getCandidateAgents();
    return res.json({ success: true, config, agents });
  } catch (error) {
    console.error('Erreur GET /citoyen-call/recipient:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Protégé admin : changer l'agent destinataire (sans modifier le code)
router.put('/recipient', protect, isAdmin, async (req, res) => {
  try {
    const { id_utilisateur } = req.body;
    if (!id_utilisateur) {
      return res.status(400).json({ success: false, message: 'id_utilisateur requis' });
    }
    const agent = await service.setRecipientAgent(id_utilisateur, req.user.id_utilisateur);
    return res.json({ success: true, config: agent });
  } catch (error) {
    console.error('Erreur PUT /citoyen-call/recipient:', error);
    return res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
  }
});

module.exports = router;
