const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const serviceModel = require('../models/serviceModel');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const rows = await serviceModel.findAll();
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await serviceModel.findById(id);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.post('/', authorize('administrateur_systeme', 'administrateur'), async (req, res) => {
  try {
    const { id_direction, nom_service, description, email, telephone, responsable } = req.body;
    if (!id_direction || !nom_service) {
      return res.status(400).json({ success: false, message: 'Direction et nom du service requis' });
    }
    const id_service = await serviceModel.create({ id_direction, nom_service, description, email, telephone, responsable });
    res.status(201).json({ success: true, message: 'Service créé avec succès', data: { id_service } });
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.put('/:id', authorize('administrateur_systeme', 'administrateur'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction, nom_service, description, email, telephone, responsable, actif } = req.body;
    const fields = { id_direction, nom_service, description, email, telephone, responsable };
    if (actif !== undefined) fields.actif = actif;
    await serviceModel.update(id, fields);
    res.json({ success: true, message: 'Service modifié avec succès' });
  } catch (error) {
    console.error('Erreur modification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.delete('/:id', authorize('administrateur_systeme', 'administrateur'), async (req, res) => {
  try {
    await serviceModel.deleteById(req.params.id);
    res.json({ success: true, message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
