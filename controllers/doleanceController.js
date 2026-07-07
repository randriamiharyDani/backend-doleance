// ============================================================
// FICHIER : controllers/doleanceController.js
// VERSION FINALE - TOUTES LES FONCTIONNALITÉS
// ============================================================

const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== CONFIGURATION UPLOAD (MULTER) ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/doleances');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doleance-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 Mo
}).array('files', 5);

// ========== GÉNÉRATEURS ==========
const generateReference = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DOL-${year}${month}${day}-${random}`;
};

const generateCitizenId = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CIT${year}-${random}`;
};

// ========== UPLOAD DES PIÈCES JOINTES ==========
const uploadPiecesJointes = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Erreur lors de l\'upload' });
    }

    const { doleance_id } = req.body;
    if (!doleance_id) {
      return res.status(400).json({ success: false, message: 'ID de la doléance requis' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun fichier sélectionné' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [doleance] = await connection.execute(
        'SELECT id_doleance FROM doleances WHERE id_doleance = ?',
        [doleance_id]
      );
      if (doleance.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
      }

      const uploadedFiles = [];
      for (const file of req.files) {
        const type = file.mimetype.startsWith('image/') ? 'image' : 'video';
        const taille = file.size;

        const [result] = await connection.execute(
          `INSERT INTO pieces_jointes (id_doleance, nom_fichier, chemin_fichier, type, taille, date_upload)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [doleance_id, file.filename, file.path, type, taille]
        );

        uploadedFiles.push({
          id: result.insertId,
          nom_fichier: file.filename,
          type,
          taille
        });
      }

      await connection.commit();
      res.json({
        success: true,
        message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
        data: uploadedFiles
      });
    } catch (error) {
      await connection.rollback();
      console.error('Upload pieces jointes error:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'enregistrement des fichiers' });
    } finally {
      connection.release();
    }
  });
};

// ========== RÉCUPÉRER LES PIÈCES JOINTES ==========
const getPiecesJointes = async (req, res) => {
  try {
    const { id } = req.params;
    const [pieces] = await pool.execute(
      `SELECT id_piece, nom_fichier, type, taille, date_upload
       FROM pieces_jointes 
       WHERE id_doleance = ?
       ORDER BY date_upload DESC`,
      [id]
    );

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const piecesWithUrl = pieces.map(piece => ({
      ...piece,
      url: `${baseUrl}/uploads/doleances/${piece.nom_fichier}`
    }));

    res.json({ success: true, data: piecesWithUrl });
  } catch (error) {
    console.error('Get pieces jointes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== TÉLÉCHARGER UNE PIÈCE JOINTE ==========
const downloadPieceJointe = async (req, res) => {
  try {
    const { id } = req.params;
    const [pieces] = await pool.execute(
      'SELECT nom_fichier, chemin_fichier FROM pieces_jointes WHERE id_piece = ?',
      [id]
    );
    if (pieces.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }

    const piece = pieces[0];
    if (!fs.existsSync(piece.chemin_fichier)) {
      return res.status(404).json({ success: false, message: 'Le fichier n\'existe plus sur le serveur' });
    }

    res.download(piece.chemin_fichier, piece.nom_fichier);
  } catch (error) {
    console.error('Download piece jointe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SUPPRIMER UNE PIÈCE JOINTE ==========
const deletePieceJointe = async (req, res) => {
  try {
    const { id } = req.params;
    const [pieces] = await pool.execute(
      'SELECT chemin_fichier FROM pieces_jointes WHERE id_piece = ?',
      [id]
    );
    if (pieces.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }

    if (fs.existsSync(pieces[0].chemin_fichier)) {
      fs.unlinkSync(pieces[0].chemin_fichier);
    }

    await pool.execute('DELETE FROM pieces_jointes WHERE id_piece = ?', [id]);
    res.json({ success: true, message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('Delete piece jointe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== ENVOYER UNE RÉFÉRENCE PAR EMAIL / SMS ==========
const sendReferenceByContact = async (req, res) => {
  try {
    const { contact, contactType, reference } = req.body;
    if (!contact || !contactType || !reference) {
      return res.status(400).json({ success: false, message: 'Contact, type et référence requis' });
    }

    const [doleance] = await pool.execute(
      'SELECT reference, titre FROM doleances WHERE reference = ?',
      [reference]
    );
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    // Simulation d'envoi (à remplacer par un vrai service)
    if (contactType === 'email') {
      console.log(`📧 Envoi d'email à ${contact} avec la référence ${reference}`);
    } else if (contactType === 'phone') {
      console.log(`📱 Envoi de SMS à ${contact} avec la référence ${reference}`);
    }

    res.json({
      success: true,
      message: `Référence envoyée par ${contactType === 'email' ? 'email' : 'SMS'}`
    });
  } catch (error) {
    console.error('Send reference error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RECHERCHE DE SUGGESTIONS ==========
const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q}%`;
    const [suggestions] = await pool.execute(
      `SELECT DISTINCT titre as suggestion 
       FROM doleances 
       WHERE titre LIKE ? OR description LIKE ?
       LIMIT 10`,
      [searchTerm, searchTerm]
    );
    res.json({ success: true, data: suggestions.map(s => s.suggestion) });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ success: false, data: [] });
  }
};

// ========== RÉCUPÉRER TOUTES LES DOLÉANCES (PUBLIC) ==========
const getDoleancesPublic = async (req, res) => {
  try {
    const { categorie, statut, search, page = 1, limit = 10, sort = 'date_desc' } = req.query;

    let query = `
      SELECT 
        d.id_doleance, d.reference, d.titre, d.description, d.date_creation, d.date_mise_a_jour,
        s.id_statut, s.nom_statut, s.couleur as statut_couleur,
        p.id_priorite, p.nom_priorite, p.niveau,
        c.id_categorie, c.nom_categorie,
        dir.id_direction, dir.nom_direction
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      WHERE 1=1
    `;
    const params = [];

    if (categorie) {
      query += ' AND d.id_categorie = ?';
      params.push(Number(categorie));
    }
    if (statut) {
      query += ' AND d.id_statut = ?';
      params.push(Number(statut));
    }
    if (search) {
      query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    // Count
    let countQuery = 'SELECT COUNT(*) as total FROM doleances d WHERE 1=1';
    const countParams = [];
    if (categorie) { countQuery += ' AND id_categorie = ?'; countParams.push(Number(categorie)); }
    if (statut) { countQuery += ' AND id_statut = ?'; countParams.push(Number(statut)); }
    if (search) {
      countQuery += ' AND (reference LIKE ? OR titre LIKE ? OR description LIKE ?)';
      const term = `%${search}%`;
      countParams.push(term, term, term);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    // Order
    const orderMap = {
      'date_desc': 'd.date_creation DESC',
      'date_asc': 'd.date_creation ASC',
      'priorite_desc': 'p.niveau DESC, d.date_creation DESC',
      'priorite_asc': 'p.niveau ASC, d.date_creation DESC'
    };
    const orderBy = orderMap[sort] || 'd.date_creation DESC';

    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [doleances] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        doleances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get doleances public error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RÉCUPÉRER DOLÉANCES (BACKOFFICE) ==========
const getDoleancesBackoffice = async (req, res) => {
  try {
    const { page = 1, limit = 10, categorie, statut, priorite, search } = req.query;
    const userId = req.user?.id_utilisateur;
    const userRole = req.user?.nom_role;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Construction de la requête
    let query = `
      SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie,
             CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
             ct.email as citoyen_email, ct.telephone as citoyen_telephone,
             dir.nom_direction
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      WHERE 1=1
    `;
    const params = [];

    // Filtrage par rôle
    const adminRoles = ['administrateur_systeme', 'agent_central', 'administrateur'];
    if (adminRoles.includes(userRole)) {
      // Admin voit tout
    } else {
      const [user] = await pool.execute('SELECT id_direction FROM utilisateurs WHERE id_utilisateur = ?', [userId]);
      const directionId = user[0]?.id_direction;
      if (directionId) {
        query += ' AND d.id_direction = ?';
        params.push(directionId);
      }
      // Si pas de direction, on affiche tout (pour déboguer) – peut être modifié en AND 1=0
    }

    // Filtres supplémentaires
    if (categorie) { query += ' AND d.id_categorie = ?'; params.push(Number(categorie)); }
    if (statut) { query += ' AND d.id_statut = ?'; params.push(Number(statut)); }
    if (priorite) { query += ' AND d.id_priorite = ?'; params.push(Number(priorite)); }
    if (search) {
      query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    // Comptage total
    let countQuery = 'SELECT COUNT(*) as total FROM doleances d WHERE 1=1';
    const countParams = [];
    let countWhere = '';
    if (!adminRoles.includes(userRole)) {
      const [user] = await pool.execute('SELECT id_direction FROM utilisateurs WHERE id_utilisateur = ?', [userId]);
      const directionId = user[0]?.id_direction;
      if (directionId) {
        countWhere += ' AND d.id_direction = ?';
        countParams.push(directionId);
      }
    }
    if (categorie) { countWhere += ' AND d.id_categorie = ?'; countParams.push(Number(categorie)); }
    if (statut) { countWhere += ' AND d.id_statut = ?'; countParams.push(Number(statut)); }
    if (priorite) { countWhere += ' AND d.id_priorite = ?'; countParams.push(Number(priorite)); }
    if (search) {
      countWhere += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const term = `%${search}%`;
      countParams.push(term, term, term);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM doleances d WHERE 1=1 ${countWhere}`,
      countParams
    );
    const total = countResult[0]?.total || 0;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' ORDER BY d.date_creation DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [doleances] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        doleances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get doleances backoffice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RÉCUPÉRER TOUTES LES DOLÉANCES (SIMPLE) ==========
const getDoleances = async (req, res) => {
  try {
    const { page = 1, limit = 10, categorie, statut, priorite, search } = req.query;

    let query = `
      SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie,
             CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
             ct.email as citoyen_email, ct.telephone as citoyen_telephone,
             dir.nom_direction
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      WHERE 1=1
    `;
    const params = [];

    if (categorie) { query += ' AND d.id_categorie = ?'; params.push(Number(categorie)); }
    if (statut) { query += ' AND d.id_statut = ?'; params.push(Number(statut)); }
    if (priorite) { query += ' AND d.id_priorite = ?'; params.push(Number(priorite)); }
    if (search) {
      query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    // Count
    let countQuery = 'SELECT COUNT(*) as total FROM doleances d WHERE 1=1';
    const countParams = [];
    if (categorie) { countQuery += ' AND id_categorie = ?'; countParams.push(Number(categorie)); }
    if (statut) { countQuery += ' AND id_statut = ?'; countParams.push(Number(statut)); }
    if (priorite) { countQuery += ' AND id_priorite = ?'; countParams.push(Number(priorite)); }
    if (search) {
      countQuery += ' AND (reference LIKE ? OR titre LIKE ? OR description LIKE ?)';
      const term = `%${search}%`;
      countParams.push(term, term, term);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    const offset = (Number(page) - 1) * Number(limit);
    query += ' ORDER BY d.date_creation DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [doleances] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        doleances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get doleances error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DOLÉANCES EN ATTENTE DE TRANSFERT ==========
const getDoleancesEnAttenteTransfert = async (req, res) => {
  try {
    const { page = 1, limit = 10, categorie, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT d.*, 
             s.nom_statut, s.couleur as statut_couleur,
             c.nom_categorie,
             CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
             ct.telephone as citoyen_telephone
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      WHERE d.id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_attente')
    `;
    const params = [];

    if (categorie) { query += ' AND d.id_categorie = ?'; params.push(Number(categorie)); }
    if (search) {
      query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM doleances d 
       WHERE d.id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_attente')`
    );
    const total = countResult[0]?.total || 0;

    query += ' ORDER BY d.date_creation ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [doleances] = await pool.execute(query, params);

    res.json({
      success: true,
      data: doleances,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get doleances en attente transfert error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== TRANSFÉRER UNE DOLÉANCE (AGENT CENTRAL) ==========
const transfererDoleanceCentral = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction, commentaire } = req.body;
    const userId = req.user?.id_utilisateur;

    if (!id || !id_direction || !userId) {
      return res.status(400).json({ success: false, message: 'Paramètres manquants' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [doleance] = await connection.execute(
        'SELECT id_doleance, reference, id_direction, id_statut FROM doleances WHERE id_doleance = ?',
        [Number(id)]
      );
      if (doleance.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
      }

      const [direction] = await connection.execute(
        'SELECT id_direction, nom_direction FROM directions WHERE id_direction = ? AND actif = 1',
        [Number(id_direction)]
      );
      if (direction.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Direction de destination non trouvée' });
      }

      const [statutTransfere] = await connection.execute(
        "SELECT id_statut FROM statuts WHERE nom_statut = 'transferee'"
      );
      const idStatut = statutTransfere[0]?.id_statut || 4;

      await connection.execute(
        `UPDATE doleances 
         SET id_direction = ?, id_statut = ?, date_mise_a_jour = NOW()
         WHERE id_doleance = ?`,
        [Number(id_direction), idStatut, Number(id)]
      );

      const motif = (commentaire && commentaire.trim()) ? commentaire.trim() : 'Transfert par agent central';

      await connection.execute(
        `INSERT INTO transferts (id_doleance, id_direction_source, id_direction_destination, id_utilisateur, motif, date_transfert)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [Number(id), doleance[0].id_direction || null, Number(id_direction), Number(userId), motif]
      );

      await connection.execute(
        `INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire, date_changement)
         VALUES (?, ?, ?, ?, NOW())`,
        [Number(id), doleance[0].id_statut || null, idStatut, `Doléance transférée vers ${direction[0].nom_direction} - Motif: ${motif}`]
      );

      await connection.commit();

      res.json({
        success: true,
        message: `Doléance ${doleance[0].reference} transférée vers ${direction[0].nom_direction}`,
        data: { reference: doleance[0].reference, direction_destination: direction[0].nom_direction }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du transfert: ' + error.message });
  }
};

// ========== RÉCUPÉRER UNE DOLÉANCE PAR RÉFÉRENCE ==========
const getDoleanceByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    const [doleances] = await pool.execute(
      `SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie
       FROM doleances d
       JOIN statuts s ON d.id_statut = s.id_statut
       JOIN priorites p ON d.id_priorite = p.id_priorite
       LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
       WHERE d.reference = ?`,
      [reference]
    );
    if (doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const doleance = doleances[0];
    const [reponses] = await pool.execute(
      'SELECT message, date_reponse FROM reponses WHERE id_doleance = ? ORDER BY date_reponse ASC',
      [doleance.id_doleance]
    );
    const [historique] = await pool.execute(
      `SELECT h.date_changement, h.commentaire,
              s_ancien.nom_statut as ancien_statut,
              s_nouveau.nom_statut as nouveau_statut
       FROM historique_statuts h
       LEFT JOIN statuts s_ancien ON h.id_statut_ancien = s_ancien.id_statut
       LEFT JOIN statuts s_nouveau ON h.id_statut_nouveau = s_nouveau.id_statut
       WHERE h.id_doleance = ?
       ORDER BY h.date_changement ASC`,
      [doleance.id_doleance]
    );
    const [piecesJointes] = await pool.execute(
      'SELECT id_piece, nom_fichier, type, taille, date_upload FROM pieces_jointes WHERE id_doleance = ? ORDER BY date_upload DESC',
      [doleance.id_doleance]
    );

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const piecesWithUrl = piecesJointes.map(piece => ({
      ...piece,
      url: `${baseUrl}/uploads/doleances/${piece.nom_fichier}`
    }));

    res.json({
      success: true,
      data: {
        reference: doleance.reference,
        titre: doleance.titre,
        description: doleance.description,
        date_creation: doleance.date_creation,
        statut: doleance.nom_statut,
        statut_couleur: doleance.statut_couleur,
        priorite: doleance.nom_priorite,
        niveau: doleance.niveau,
        categorie: doleance.nom_categorie || 'Non catégorisée',
        reponses: reponses || [],
        historique: historique || [],
        pieces_jointes: piecesWithUrl || []
      }
    });
  } catch (error) {
    console.error('Get doleance by reference error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RÉCUPÉRER UNE DOLÉANCE PAR ID ==========
const getDoleanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [doleances] = await pool.execute(
      `SELECT d.*, s.nom_statut, s.couleur as statut_couleur,
              p.nom_priorite, p.niveau, c.nom_categorie, dir.nom_direction,
              ct.nom as citoyen_nom, ct.prenom as citoyen_prenom,
              ct.email as citoyen_email, ct.telephone as citoyen_telephone,
              ct.adresse as citoyen_adresse
       FROM doleances d
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
       LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
       LEFT JOIN directions dir ON d.id_direction = dir.id_direction
       LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
       WHERE d.id_doleance = ?`,
      [id]
    );
    if (doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const doleance = doleances[0];
    const [reponses] = await pool.execute(
      'SELECT id_reponse, message, date_reponse FROM reponses WHERE id_doleance = ? ORDER BY date_reponse ASC',
      [doleance.id_doleance]
    );
    const [historique] = await pool.execute(
      'SELECT date_changement, commentaire FROM historique_statuts WHERE id_doleance = ? ORDER BY date_changement ASC',
      [doleance.id_doleance]
    );
    const [piecesJointes] = await pool.execute(
      'SELECT id_piece, nom_fichier, type, taille, date_upload FROM pieces_jointes WHERE id_doleance = ? ORDER BY date_upload DESC',
      [doleance.id_doleance]
    );

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const piecesWithUrl = piecesJointes.map(piece => ({
      ...piece,
      url: `${baseUrl}/uploads/doleances/${piece.nom_fichier}`
    }));

    res.json({
      success: true,
      data: {
        ...doleance,
        reponses: reponses || [],
        historique_statuts: historique || [],
        pieces_jointes: piecesWithUrl || []
      }
    });
  } catch (error) {
    console.error('Get doleance by id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RÉCUPÉRER LES DOLÉANCES PAR IDENTIFIANT CITOYEN ==========
const getDoleancesByCitizenId = async (req, res) => {
  try {
    const { identifiant } = req.params;
    if (!identifiant || !identifiant.trim()) {
      return res.status(400).json({ success: false, message: "L'identifiant citoyen est requis" });
    }

    const [citoyens] = await pool.execute(
      'SELECT id_citoyen, nom, prenom, telephone, adresse, identifiant_citoyen FROM citoyens WHERE identifiant_citoyen = ?',
      [identifiant]
    );
    if (citoyens.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun citoyen trouvé avec cet identifiant' });
    }

    const id_citoyen = citoyens[0].id_citoyen;
    const [doleances] = await pool.execute(
      `SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie, dir.nom_direction
       FROM doleances d
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
       LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
       LEFT JOIN directions dir ON d.id_direction = dir.id_direction
       WHERE d.id_citoyen = ?
       ORDER BY d.date_creation DESC`,
      [id_citoyen]
    );

    res.json({ success: true, data: doleances, citoyen: citoyens[0], count: doleances.length });
  } catch (error) {
    console.error('Get doleances by citizen id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RÉCUPÉRER UNE DOLÉANCE PAR RÉFÉRENCE ET IDENTIFIANT ==========
const getDoleanceByReferenceAndCitizenId = async (req, res) => {
  try {
    const { reference, identifiant } = req.params;
    const [citoyens] = await pool.execute(
      'SELECT id_citoyen FROM citoyens WHERE identifiant_citoyen = ?',
      [identifiant]
    );
    if (citoyens.length === 0) {
      return res.status(404).json({ success: false, message: 'Identifiant citoyen invalide' });
    }

    const [doleances] = await pool.execute(
      `SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie, dir.nom_direction
       FROM doleances d
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
       LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
       LEFT JOIN directions dir ON d.id_direction = dir.id_direction
       WHERE d.reference = ? AND d.id_citoyen = ?`,
      [reference, citoyens[0].id_citoyen]
    );
    if (doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée ou accès non autorisé' });
    }

    const doleance = doleances[0];
    const [reponses] = await pool.execute(
      'SELECT message, date_reponse FROM reponses WHERE id_doleance = ? ORDER BY date_reponse ASC',
      [doleance.id_doleance]
    );
    const [historique] = await pool.execute(
      `SELECT h.date_changement, h.commentaire,
              s_ancien.nom_statut as ancien_statut,
              s_nouveau.nom_statut as nouveau_statut
       FROM historique_statuts h
       LEFT JOIN statuts s_ancien ON h.id_statut_ancien = s_ancien.id_statut
       LEFT JOIN statuts s_nouveau ON h.id_statut_nouveau = s_nouveau.id_statut
       WHERE h.id_doleance = ?
       ORDER BY h.date_changement ASC`,
      [doleance.id_doleance]
    );
    const [piecesJointes] = await pool.execute(
      'SELECT id_piece, nom_fichier, type, taille, date_upload FROM pieces_jointes WHERE id_doleance = ? ORDER BY date_upload DESC',
      [doleance.id_doleance]
    );

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const piecesWithUrl = piecesJointes.map(piece => ({
      ...piece,
      url: `${baseUrl}/uploads/doleances/${piece.nom_fichier}`
    }));

    res.json({
      success: true,
      data: {
        reference: doleance.reference,
        titre: doleance.titre,
        description: doleance.description,
        date_creation: doleance.date_creation,
        statut: doleance.nom_statut,
        statut_couleur: doleance.statut_couleur,
        priorite: doleance.nom_priorite,
        niveau: doleance.niveau,
        categorie: doleance.nom_categorie || 'Non catégorisée',
        direction: doleance.nom_direction,
        reponses: reponses || [],
        historique: historique || [],
        pieces_jointes: piecesWithUrl || []
      }
    });
  } catch (error) {
    console.error('Get doleance by reference and citizen id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== CRÉER UNE DOLÉANCE ==========
const createDoleance = async (req, res) => {
  try {
    const { 
      identifiant_citoyen,
      nom_citoyen, prenom_citoyen, telephone_citoyen, adresse_citoyen,
      titre, description, id_categorie, id_quartier
    } = req.body;

    if (!nom_citoyen || !prenom_citoyen || !titre || !description || !id_categorie) {
      return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs obligatoires' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let finalCitizenId = identifiant_citoyen;
      let existingCitoyen = null;

      if (identifiant_citoyen && identifiant_citoyen.trim()) {
        [existingCitoyen] = await connection.execute(
          'SELECT id_citoyen, identifiant_citoyen FROM citoyens WHERE identifiant_citoyen = ?',
          [identifiant_citoyen]
        );
      }

      let id_citoyen;
      if (existingCitoyen && existingCitoyen.length > 0) {
        id_citoyen = existingCitoyen[0].id_citoyen;
        finalCitizenId = existingCitoyen[0].identifiant_citoyen;
      } else {
        finalCitizenId = generateCitizenId();
        const [resultCitoyen] = await connection.execute(
          `INSERT INTO citoyens (nom, prenom, telephone, adresse, identifiant_citoyen) 
           VALUES (?, ?, ?, ?, ?)`,
          [nom_citoyen, prenom_citoyen, telephone_citoyen || null, adresse_citoyen || null, finalCitizenId]
        );
        id_citoyen = resultCitoyen.insertId;
      }

      const reference = generateReference();
      const defaultPriorite = 2;
      const defaultStatut = 1;

      // Mapping catégorie → direction par défaut
      const directionParCategorie = {
        1: 1, 2: 2, 3: 2, 4: 2, 5: 4, 6: 3, 7: 5, 8: 6
      };
      let defaultDirection = directionParCategorie[Number(id_categorie)] || 1;

      // Vérifier que la direction existe
      const [directionsExist] = await connection.execute(
        'SELECT id_direction FROM directions WHERE id_direction = ?',
        [defaultDirection]
      );
      if (directionsExist.length === 0) {
        const [firstDirection] = await connection.execute('SELECT id_direction FROM directions LIMIT 1');
        defaultDirection = firstDirection[0]?.id_direction || 1;
      }

      const quartierValue = id_quartier ? Number(id_quartier) : null;

      const [resultDoleance] = await connection.execute(
        `INSERT INTO doleances 
         (reference, titre, description, id_citoyen, id_categorie, id_priorite, 
          id_quartier, id_direction, id_statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reference, titre, description, id_citoyen, Number(id_categorie), defaultPriorite,
         quartierValue, defaultDirection, defaultStatut]
      );

      await connection.execute(
        `INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire) 
         VALUES (?, NULL, ?, 'Création de la doléance')`,
        [resultDoleance.insertId, defaultStatut]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Doléance créée avec succès',
        data: { id: resultDoleance.insertId, reference, identifiant_citoyen: finalCitizenId }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create doleance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== METTRE À JOUR LE STATUT ==========
const updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_statut, commentaire } = req.body;
    if (!id_statut) {
      return res.status(400).json({ success: false, message: 'Statut requis' });
    }

    const [oldStatut] = await pool.execute('SELECT id_statut FROM doleances WHERE id_doleance = ?', [id]);
    await pool.execute('UPDATE doleances SET id_statut = ?, date_mise_a_jour = NOW() WHERE id_doleance = ?', [id_statut, id]);
    await pool.execute(
      `INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire, date_changement) 
       VALUES (?, ?, ?, ?, NOW())`,
      [id, oldStatut[0]?.id_statut || null, id_statut, commentaire || 'Mise à jour du statut']
    );

    res.json({ success: true, message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Update statut error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== AJOUTER UNE RÉPONSE ==========
const addReponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id_utilisateur || 1;

    await pool.execute(
      `INSERT INTO reponses (id_doleance, id_utilisateur, message, date_reponse) 
       VALUES (?, ?, ?, NOW())`,
      [id, userId, message]
    );

    res.status(201).json({ success: true, message: 'Réponse ajoutée avec succès' });
  } catch (error) {
    console.error('Add reponse error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== AJOUTER UNE SATISFACTION ==========
const addSatisfaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, commentaire } = req.body;
    if (note < 1 || note > 5) {
      return res.status(400).json({ success: false, message: 'La note doit être comprise entre 1 et 5' });
    }

    await pool.execute(
      `UPDATE doleances 
       SET satisfaction_note = ?, satisfaction_commentaire = ?, date_satisfaction = NOW()
       WHERE id_doleance = ?`,
      [note, commentaire || null, id]
    );

    res.json({ success: true, message: 'Merci pour votre évaluation !' });
  } catch (error) {
    console.error('Add satisfaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SUPPRIMER UNE DOLÉANCE ==========
const deleteDoleance = async (req, res) => {
  try {
    const { id } = req.params;

    // Supprimer les pièces jointes
    const [pieces] = await pool.execute('SELECT chemin_fichier FROM pieces_jointes WHERE id_doleance = ?', [id]);
    for (const piece of pieces) {
      try {
        if (fs.existsSync(piece.chemin_fichier)) {
          fs.unlinkSync(piece.chemin_fichier);
        }
      } catch (err) {
        console.warn('Impossible de supprimer le fichier:', piece.chemin_fichier, err.message);
      }
    }

    await pool.execute('DELETE FROM pieces_jointes WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM reponses WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM historique_statuts WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM transferts WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM doleances WHERE id_doleance = ?', [id]);

    res.json({ success: true, message: 'Doléance supprimée avec succès' });
  } catch (error) {
    console.error('Delete doleance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== METTRE À JOUR LA PRIORITÉ ==========
const updatePriorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_priorite } = req.body;
    if (!id_priorite) {
      return res.status(400).json({ success: false, message: 'Priorité requise' });
    }

    const [doleance] = await pool.execute('SELECT reference FROM doleances WHERE id_doleance = ?', [id]);
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const [priorite] = await pool.execute('SELECT nom_priorite FROM priorites WHERE id_priorite = ?', [id_priorite]);
    if (priorite.length === 0) {
      return res.status(400).json({ success: false, message: 'Priorité invalide' });
    }

    const prioriteNom = priorite[0].nom_priorite;
    await pool.execute('UPDATE doleances SET id_priorite = ? WHERE id_doleance = ?', [id_priorite, id]);
    await pool.execute(
      `INSERT INTO historique_statuts (id_doleance, commentaire, date_changement) 
       VALUES (?, ?, NOW())`,
      [id, `Priorité modifiée : ${prioriteNom}`]
    );

    res.json({
      success: true,
      message: `Priorité de la doléance ${doleance[0].reference} mise à jour en ${prioriteNom}`,
      data: { id_priorite, nom_priorite: prioriteNom }
    });
  } catch (error) {
    console.error('Update priorite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DONNÉES DE RÉFÉRENCE ==========
const getCategories = async (req, res) => {
  try {
    const [data] = await pool.execute('SELECT * FROM categories_doleance ORDER BY nom_categorie');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getStatuts = async (req, res) => {
  try {
    const [data] = await pool.execute('SELECT * FROM statuts ORDER BY ordre');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getPriorites = async (req, res) => {
  try {
    const [data] = await pool.execute('SELECT * FROM priorites ORDER BY niveau');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getDirections = async (req, res) => {
  try {
    const [data] = await pool.execute('SELECT * FROM directions WHERE actif = 1 ORDER BY nom_direction');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getQuartiers = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT q.*, a.nom_arrondissement 
      FROM quartiers q
      LEFT JOIN arrondissements a ON q.id_arrondissement = a.id_arrondissement
    `);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getRoles = async (req, res) => {
  try {
    const [data] = await pool.execute('SELECT * FROM roles');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

// ========== EXPORTS ==========
module.exports = {
  createDoleance,
  getDoleances,
  getDoleancesBackoffice,
  getDoleancesPublic,
  getDoleancesEnAttenteTransfert,
  transfererDoleanceCentral,
  getDoleanceById,
  getDoleanceByReference,
  getDoleancesByCitizenId,
  getDoleanceByReferenceAndCitizenId,
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
};