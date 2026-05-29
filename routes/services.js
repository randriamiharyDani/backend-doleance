// backend/routes/services.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET tous les services
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*, d.nom_direction as direction_nom 
             FROM services s 
             JOIN directions d ON s.id_direction = d.id_direction 
             WHERE s.actif = 1 
             ORDER BY d.nom_direction, s.nom_service`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Erreur services:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// GET service par ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM services WHERE id_service = ? AND actif = 1',
            [req.params.id]
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

// POST créer un service
router.post('/', async (req, res) => {
    const { id_direction, nom_service, description, email, telephone, responsable } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO services (id_direction, nom_service, description, email, telephone, responsable) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_direction, nom_service, description, email, telephone, responsable]
        );
        res.json({ success: true, data: { id_service: result.insertId } });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// PUT modifier un service
router.put('/:id', async (req, res) => {
    const { id_direction, nom_service, description, email, telephone, responsable, actif } = req.body;
    try {
        await db.query(
            `UPDATE services SET id_direction = ?, nom_service = ?, description = ?, 
             email = ?, telephone = ?, responsable = ?, actif = ? WHERE id_service = ?`,
            [id_direction, nom_service, description, email, telephone, responsable, actif, req.params.id]
        );
        res.json({ success: true, message: 'Service mis à jour' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// DELETE service
router.delete('/:id', async (req, res) => {
    try {
        await db.query('UPDATE services SET actif = 0 WHERE id_service = ?', [req.params.id]);
        res.json({ success: true, message: 'Service désactivé' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

module.exports = router;