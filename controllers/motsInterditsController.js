// controllers/motsInterditsController.js
// Gestion des mots interdits utilisés pour repérer les gros mots
// dans les doléances déposées (objet/titre + description).
const motsInterditsModel = require('../models/motsInterditsModel');

const DUPLICATE_ENTRY = 1062;

// Normalise la saisie : retrait des espaces superflus, casse préservée.
const normalizeMot = (mot) => (typeof mot === 'string' ? mot.trim() : '');

// Lister tous les mots interdits
const getMotsInterdits = async (req, res) => {
  try {
    const mots = await motsInterditsModel.findAll();
    res.json({ success: true, data: mots });
  } catch (error) {
    console.error('Get mots interdits error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ajouter un mot interdit
const createMotInterdit = async (req, res) => {
  try {
    const mot = normalizeMot(req.body?.mot);

    if (!mot) {
      return res.status(400).json({ success: false, message: 'Le mot est requis' });
    }
    if (mot.length > 100) {
      return res.status(400).json({ success: false, message: 'Le mot ne doit pas dépasser 100 caractères' });
    }

    const existing = await motsInterditsModel.findByMot(mot);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Le mot "${mot}" existe déjà` });
    }

    const id = await motsInterditsModel.create({ mot });
    const created = await motsInterditsModel.findById(id);

    res.status(201).json({ success: true, data: created[0], message: 'Mot interdit ajouté' });
  } catch (error) {
    console.error('Create mot interdit error:', error);
    if (error.errno === DUPLICATE_ENTRY) {
      return res.status(409).json({ success: false, message: 'Ce mot existe déjà' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Modifier un mot interdit
const updateMotInterdit = async (req, res) => {
  try {
    const { id } = req.params;
    const mot = normalizeMot(req.body?.mot);

    if (!mot) {
      return res.status(400).json({ success: false, message: 'Le mot est requis' });
    }
    if (mot.length > 100) {
      return res.status(400).json({ success: false, message: 'Le mot ne doit pas dépasser 100 caractères' });
    }

    const existing = await motsInterditsModel.findById(id);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Mot interdit non trouvé' });
    }

    const duplicate = await motsInterditsModel.findByMot(mot);
    if (duplicate.length > 0 && duplicate[0].id_mot !== Number(id)) {
      return res.status(409).json({ success: false, message: `Le mot "${mot}" existe déjà` });
    }

    await motsInterditsModel.update(id, { mot });
    const updated = await motsInterditsModel.findById(id);

    res.json({ success: true, data: updated[0], message: 'Mot interdit modifié' });
  } catch (error) {
    console.error('Update mot interdit error:', error);
    if (error.errno === DUPLICATE_ENTRY) {
      return res.status(409).json({ success: false, message: 'Ce mot existe déjà' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un mot interdit
const deleteMotInterdit = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await motsInterditsModel.findById(id);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Mot interdit non trouvé' });
    }

    await motsInterditsModel.deleteById(id);

    res.json({ success: true, message: `Mot "${existing[0].mot}" supprimé` });
  } catch (error) {
    console.error('Delete mot interdit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMotsInterdits,
  createMotInterdit,
  updateMotInterdit,
  deleteMotInterdit
};
