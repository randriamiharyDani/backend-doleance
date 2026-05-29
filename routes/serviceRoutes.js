// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET - Récupérer tous les services
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      `SELECT s.*, d.nom_direction 
       FROM services s 
       JOIN directions d ON s.id_direction = d.id_direction 
       WHERE s.actif = 1 
       ORDER BY d.nom_direction, s.nom_service`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET - Récupérer un service par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.pool.query(
      `SELECT s.*, d.nom_direction 
       FROM services s 
       JOIN directions d ON s.id_direction = d.id_direction 
       WHERE s.id_service = ? AND s.actif = 1`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST - Créer un service
router.post('/', async (req, res) => {
  try {
    const { id_direction, nom_service, description, email, telephone, responsable } = req.body;
    
    if (!id_direction || !nom_service) {
      return res.status(400).json({ success: false, message: 'Direction et nom du service requis' });
    }
    
    const [result] = await db.pool.query(
      `INSERT INTO services (id_direction, nom_service, description, email, telephone, responsable) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_direction, nom_service, description || null, email || null, telephone || null, responsable || null]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Service créé avec succès',
      data: { id_service: result.insertId }
    });
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT - Modifier un service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction, nom_service, description, email, telephone, responsable, actif } = req.body;
    
    await db.pool.query(
      `UPDATE services 
       SET id_direction = ?, nom_service = ?, description = ?, email = ?, telephone = ?, responsable = ?, actif = ?
       WHERE id_service = ?`,
      [id_direction, nom_service, description, email, telephone, responsable, actif !== undefined ? actif : 1, id]
    );
    
    res.json({ success: true, message: 'Service modifié avec succès' });
  } catch (error) {
    console.error('Erreur modification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un service
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.pool.query('UPDATE services SET actif = 0 WHERE id_service = ?', [id]);
    
    res.json({ success: true, message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;