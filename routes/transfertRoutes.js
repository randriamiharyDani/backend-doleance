// routes/transfertRoutes.js (version simplifiée sans auth)
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET - Récupérer les doléances à transférer
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      `SELECT d.*, c.nom_categorie, s.nom_statut, s.couleur as statut_couleur,
              p.nom_priorite, p.niveau,
              u.prenom as citoyen_prenom, u.nom as citoyen_nom,
              dir.nom_direction, dir.id_direction
       FROM doleances d
       LEFT JOIN categories c ON d.id_categorie = c.id_categorie
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
       LEFT JOIN users u ON d.id_utilisateur = u.id_utilisateur
       LEFT JOIN directions dir ON d.id_direction = dir.id_direction
       ORDER BY d.date_creation DESC`
    );
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST - Transférer une doléance
router.post('/:id/transferer', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction, id_service, motif } = req.body;
    
    let updateQuery = '';
    let updateParams = [];
    
    if (id_direction) {
      updateQuery = 'UPDATE doleances SET id_direction = ?, date_modification = NOW() WHERE id_doleance = ?';
      updateParams = [id_direction, id];
    } else if (id_service) {
      updateQuery = 'UPDATE doleances SET id_service = ?, date_modification = NOW() WHERE id_doleance = ?';
      updateParams = [id_service, id];
    } else {
      return res.status(400).json({ success: false, message: 'Direction ou service requis' });
    }
    
    await db.pool.query(updateQuery, updateParams);
    
    res.json({ 
      success: true, 
      message: 'Doléance transférée avec succès',
      data: { id_direction, id_service }
    });
    
  } catch (error) {
    console.error('Erreur transfert:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du transfert' });
  }
});

module.exports = router;