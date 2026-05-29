// backend/routes/directions.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET toutes les directions
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM directions WHERE actif = 1 ORDER BY categorie, nom_direction'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Erreur directions:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// GET direction par ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM directions WHERE id_direction = ? AND actif = 1',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Direction non trouvée' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// GET services d'une direction
router.get('/:id/services', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM services WHERE id_direction = ? AND actif = 1 ORDER BY nom_service',
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// POST créer une direction
router.post('/', async (req, res) => {
    const { nom_direction, description, categorie, email, telephone, responsable } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO directions (nom_direction, description, categorie, email, telephone, responsable) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nom_direction, description, categorie, email, telephone, responsable]
        );
        res.json({ success: true, data: { id_direction: result.insertId } });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// PUT modifier une direction
router.put('/:id', async (req, res) => {
    const { nom_direction, description, categorie, email, telephone, responsable, actif } = req.body;
    try {
        await db.query(
            `UPDATE directions SET nom_direction = ?, description = ?, categorie = ?, 
             email = ?, telephone = ?, responsable = ?, actif = ? WHERE id_direction = ?`,
            [nom_direction, description, categorie, email, telephone, responsable, actif, req.params.id]
        );
        res.json({ success: true, message: 'Direction mise à jour' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// DELETE direction
router.delete('/:id', async (req, res) => {
    try {
        await db.query('UPDATE directions SET actif = 0 WHERE id_direction = ?', [req.params.id]);
        res.json({ success: true, message: 'Direction désactivée' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

module.exports = router;