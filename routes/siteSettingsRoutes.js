// routes/siteSettingsRoutes.js
// Paramètres du site public : contacts d'urgence + réseaux sociaux (footer)
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Récupère l'état complet : contacts d'urgence + réseaux sociaux
async function getSiteSettings() {
  const [contacts] = await pool.execute(
    'SELECT code, libelle, telephone, ordre FROM contacts_urgence ORDER BY ordre ASC, id_contact ASC'
  );
  const [params] = await pool.execute('SELECT cle, valeur FROM parametres_site');
  const socials = { whatsapp: '', facebook: '', instagram: '' };
  const greenNumbers = { greenNumberCua: '', greenNumberTelma: '', greenNumberOrange: '' };
  for (const row of params) {
    if (row.cle in socials) socials[row.cle] = row.valeur || '';
    if (row.cle in greenNumbers) greenNumbers[row.cle] = row.valeur || '';
  }
  return { contacts, socials, greenNumbers };
}

// ==================== PUBLIC ====================
router.get('/', async (req, res) => {
  try {
    const data = await getSiteSettings();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur GET /site-settings:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ADMIN (protégé) ====================

// Mise à jour des numéros des contacts d'urgence
// Body attendu : { contacts: [{ code, telephone }] }
router.put('/contacts', protect, isAdmin, async (req, res) => {
  try {
    const list = Array.isArray(req.body?.contacts) ? req.body.contacts : null;
    if (!list || list.length === 0) {
      return res.status(400).json({ success: false, message: 'Liste de contacts requise' });
    }

    for (const contact of list) {
      if (!contact.code) continue;
      await pool.execute(
        'UPDATE contacts_urgence SET telephone = ?, updated_by = ? WHERE code = ?',
        [contact.telephone ?? null, req.user.id_utilisateur || null, contact.code]
      );
    }

    const data = await getSiteSettings();
    return res.json({ success: true, message: 'Contacts d\'urgence mis à jour', data });
  } catch (error) {
    console.error('Erreur PUT /site-settings/contacts:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mise à jour du numéro WhatsApp et des liens Facebook / Instagram
// Body accepté (partiel possible) : { whatsapp, facebook, instagram }
router.put('/socials', protect, isAdmin, async (req, res) => {
  try {
    const allowed = ['whatsapp', 'facebook', 'instagram'];
    let updated = false;

    for (const cle of allowed) {
      if (!(cle in req.body)) continue;
      const valeur = typeof req.body[cle] === 'string' ? req.body[cle].trim() : '';
      await pool.execute(
        `INSERT INTO parametres_site (cle, valeur) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valeur = VALUES(valeur)`,
        [cle, valeur]
      );
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ success: false, message: 'Aucun paramètre fourni (whatsapp, facebook, instagram)' });
    }

    const data = await getSiteSettings();
    return res.json({ success: true, message: 'Réseaux sociaux mis à jour', data });
  } catch (error) {
    console.error('Erreur PUT /site-settings/socials:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mise à jour des numéros verts du footer public
// Body accepté (partiel possible) : { greenNumberCua, greenNumberTelma, greenNumberOrange }
router.put('/green-numbers', protect, isAdmin, async (req, res) => {
  try {
    const allowed = ['greenNumberCua', 'greenNumberTelma', 'greenNumberOrange'];
    let updated = false;

    for (const cle of allowed) {
      if (!(cle in req.body)) continue;
      const valeur = typeof req.body[cle] === 'string' ? req.body[cle].trim() : '';
      await pool.execute(
        `INSERT INTO parametres_site (cle, valeur) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valeur = VALUES(valeur)`,
        [cle, valeur]
      );
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ success: false, message: 'Aucun paramètre fourni (greenNumberCua, greenNumberTelma, greenNumberOrange)' });
    }

    const data = await getSiteSettings();
    return res.json({ success: true, message: 'Numéros verts mis à jour', data });
  } catch (error) {
    console.error('Erreur PUT /site-settings/green-numbers:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
