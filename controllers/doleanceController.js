const { pool } = require('../config/database');

const generateReference = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DOL-${year}${month}${day}-${random}`;
};

// ========== RÉCUPÉRER TOUTES LES DOLÉANCES (PUBLIC) ==========
const getDoleancesPublic = async (req, res) => {
  try {
    const { 
      categorie, 
      statut, 
      search, 
      page = 1, 
      limit = 10,
      sort = 'date_desc'
    } = req.query;
    
    console.log('📋 Récupération des doléances publiques - Filtres:', { categorie, statut, search, page, limit, sort });
    
    let query = `
      SELECT 
        d.id_doleance,
        d.reference,
        d.titre,
        d.description,
        d.date_creation,
        d.date_mise_a_jour,
        s.id_statut,
        s.nom_statut,
        s.couleur as statut_couleur,
        p.id_priorite,
        p.nom_priorite,
        p.niveau,
        c.id_categorie,
        c.nom_categorie,
        dir.id_direction,
        dir.nom_direction
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      WHERE 1=1
    `;
    
    const params = [];
    
    if (categorie && categorie !== '') {
      query += ' AND d.id_categorie = ?';
      params.push(parseInt(categorie));
    }
    
    if (statut && statut !== '') {
      query += ' AND d.id_statut = ?';
      params.push(parseInt(statut));
    }
    
    if (search && search !== '') {
      query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    let countQuery = `SELECT COUNT(*) as total FROM doleances d WHERE 1=1`;
    const countParams = [];
    
    if (categorie && categorie !== '') {
      countQuery += ' AND d.id_categorie = ?';
      countParams.push(parseInt(categorie));
    }
    
    if (statut && statut !== '') {
      countQuery += ' AND d.id_statut = ?';
      countParams.push(parseInt(statut));
    }
    
    if (search && search !== '') {
      countQuery += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let orderBy = '';
    if (sort === 'date_desc') orderBy = 'd.date_creation DESC';
    else if (sort === 'date_asc') orderBy = 'd.date_creation ASC';
    else if (sort === 'priorite_desc') orderBy = 'p.niveau DESC, d.date_creation DESC';
    else if (sort === 'priorite_asc') orderBy = 'p.niveau ASC, d.date_creation DESC';
    else orderBy = 'd.date_creation DESC';
    
    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const [doleances] = await pool.execute(query, params);
    
    console.log(`✅ ${doleances.length} doléances trouvées sur ${total} total`);
    
    res.json({
      success: true,
      data: {
        doleances: doleances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur getDoleancesPublic:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des doléances',
      error: error.message 
    });
  }
};

// ========== RÉCUPÉRER TOUTES LES DOLÉANCES (BACKOFFICE) ==========
const getDoleances = async (req, res) => {
  try {
    const { page = 1, limit = 10, categorie, statut, priorite, search } = req.query;
    
    let query = `
      SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie, 
             CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
             ct.email as citoyen_email, ct.telephone as citoyen_telephone,
             dir.nom_direction,
             CONCAT(u.nom, ' ', u.prenom) as assignee_nom
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      LEFT JOIN utilisateurs u ON d.id_utilisateur_assignee = u.id_utilisateur
      WHERE 1=1
    `;
    
    const params = [];
    
    if (categorie && categorie !== '') {
      query += ' AND d.id_categorie = ?';
      params.push(parseInt(categorie));
    }
    if (statut && statut !== '') {
      query += ' AND d.id_statut = ?';
      params.push(parseInt(statut));
    }
    if (priorite && priorite !== '') {
      query += ' AND d.id_priorite = ?';
      params.push(parseInt(priorite));
    }
    if (search && search !== '') {
      query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    let countQuery = `SELECT COUNT(*) as total FROM doleances d WHERE 1=1`;
    const countParams = [];
    
    if (categorie && categorie !== '') {
      countQuery += ' AND d.id_categorie = ?';
      countParams.push(parseInt(categorie));
    }
    if (statut && statut !== '') {
      countQuery += ' AND d.id_statut = ?';
      countParams.push(parseInt(statut));
    }
    if (priorite && priorite !== '') {
      countQuery += ' AND d.id_priorite = ?';
      countParams.push(parseInt(priorite));
    }
    if (search && search !== '') {
      countQuery += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY d.date_creation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [doleances] = await pool.execute(query, params);
    
    res.json({ 
      success: true, 
      data: { 
        doleances, 
        pagination: { 
          page: parseInt(page), 
          limit: parseInt(limit), 
          total: total,
          pages: Math.ceil(total / limit)
        } 
      } 
    });
  } catch (error) {
    console.error('Get doleances error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement' });
  }
};

// ========== RÉCUPÉRER UNE DOLÉANCE PAR RÉFÉRENCE (PUBLIC) ==========
const getDoleanceByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    
    console.log('🔍 Recherche doléance avec référence:', reference);
    
    const [doleances] = await pool.execute(
      `SELECT d.*, 
              s.nom_statut, 
              s.couleur as statut_couleur, 
              p.nom_priorite,
              p.niveau,
              c.nom_categorie
       FROM doleances d
       JOIN statuts s ON d.id_statut = s.id_statut
       JOIN priorites p ON d.id_priorite = p.id_priorite
       LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
       WHERE d.reference = ?`,
      [reference]
    );
    
    if (doleances.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doléance non trouvée' 
      });
    }
    
    const doleance = doleances[0];
    
    const [reponses] = await pool.execute(
      `SELECT message, date_reponse 
       FROM reponses 
       WHERE id_doleance = ?
       ORDER BY date_reponse ASC`,
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
        historique: historique || []
      }
    });
  } catch (error) {
    console.error('Get doleance by reference error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement de la doléance' 
    });
  }
};

// ========== RÉCUPÉRER UNE DOLÉANCE PAR ID (BACKOFFICE) ==========
const getDoleanceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [doleances] = await pool.execute(
      `SELECT d.*, 
              s.nom_statut, s.couleur as statut_couleur,
              p.nom_priorite, p.niveau,
              c.nom_categorie,
              dir.nom_direction,
              ct.nom as citoyen_nom, ct.prenom as citoyen_prenom,
              ct.email as citoyen_email, ct.telephone as citoyen_telephone,
              ct.adresse as citoyen_adresse,
              CONCAT(u.nom, ' ', u.prenom) as assignee_nom
       FROM doleances d
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
       LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
       LEFT JOIN directions dir ON d.id_direction = dir.id_direction
       LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
       LEFT JOIN utilisateurs u ON d.id_utilisateur_assignee = u.id_utilisateur
       WHERE d.id_doleance = ?`,
      [id]
    );
    
    if (doleances.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doléance non trouvée' 
      });
    }
    
    const [reponses] = await pool.execute(
      `SELECT r.*, CONCAT(u.nom, ' ', u.prenom) as auteur, r.date_reponse
       FROM reponses r
       JOIN utilisateurs u ON r.id_utilisateur = u.id_utilisateur
       WHERE r.id_doleance = ?
       ORDER BY r.date_reponse ASC`,
      [id]
    );
    
    const [historique] = await pool.execute(
      `SELECT h.*, 
              s_ancien.nom_statut as ancien_statut_nom,
              s_nouveau.nom_statut as nouveau_statut_nom,
              h.date_changement
       FROM historique_statuts h
       LEFT JOIN statuts s_ancien ON h.id_statut_ancien = s_ancien.id_statut
       LEFT JOIN statuts s_nouveau ON h.id_statut_nouveau = s_nouveau.id_statut
       WHERE h.id_doleance = ?
       ORDER BY h.date_changement DESC`,
      [id]
    );
    
    res.json({ 
      success: true, 
      data: {
        ...doleances[0],
        reponses: reponses || [],
        historique_statuts: historique || []
      }
    });
  } catch (error) {
    console.error('Get doleance by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement de la doléance' 
    });
  }
};

// ========== CRÉER UNE DOLÉANCE ==========
const createDoleance = async (req, res) => {
  try {
    const { 
      nom_citoyen, prenom_citoyen, telephone_citoyen, adresse_citoyen,
      titre, description, id_categorie, id_quartier
    } = req.body;
    
    console.log('📝 Données reçues:', req.body);
    
    if (!nom_citoyen || !prenom_citoyen || !titre || !description || !id_categorie) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez remplir tous les champs obligatoires' 
      });
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const [resultCitoyen] = await connection.execute(
        `INSERT INTO citoyens (nom, prenom, telephone, adresse) VALUES (?, ?, ?, ?)`,
        [nom_citoyen, prenom_citoyen, telephone_citoyen || null, adresse_citoyen || null]
      );
      const id_citoyen = resultCitoyen.insertId;
      
      const reference = generateReference();
      const defaultPriorite = 2;
      const defaultStatut = 1;
      
      const directionParCategorie = {
        1: 1, 2: 2, 3: 2, 4: 2, 5: 4, 6: 3, 7: 5, 8: 6
      };
      
      let defaultDirection = directionParCategorie[parseInt(id_categorie)] || 1;
      
      const [directionsExist] = await connection.execute(
        'SELECT id_direction FROM directions WHERE id_direction = ?',
        [defaultDirection]
      );
      
      if (directionsExist.length === 0) {
        const [firstDirection] = await connection.execute(
          'SELECT id_direction FROM directions LIMIT 1'
        );
        defaultDirection = firstDirection[0]?.id_direction || 1;
      }
      
      const quartierValue = id_quartier && id_quartier !== '' ? parseInt(id_quartier) : null;
      
      const [resultDoleance] = await connection.execute(
        `INSERT INTO doleances 
         (reference, titre, description, id_citoyen, id_categorie, id_priorite, 
          id_quartier, id_direction, id_statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reference, titre, description, id_citoyen, 
          parseInt(id_categorie), defaultPriorite,
          quartierValue, defaultDirection, defaultStatut
        ]
      );
      
      await connection.execute(
        `INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire) 
         VALUES (?, NULL, ?, 'Création de la doléance')`,
        [resultDoleance.insertId, defaultStatut]
      );
      
      await connection.commit();
      
      console.log(`✅ Doléance créée: ${reference}`);
      
      res.status(201).json({ 
        success: true,
        message: 'Doléance créée avec succès', 
        data: { id: resultDoleance.insertId, reference }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Create doleance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création: ' + error.message
    });
  }
};

// ========== METTRE À JOUR LE STATUT ==========
const updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_statut, commentaire } = req.body;
    
    const [oldStatut] = await pool.execute(
      'SELECT id_statut FROM doleances WHERE id_doleance = ?',
      [id]
    );
    
    await pool.execute(
      'UPDATE doleances SET id_statut = ?, date_mise_a_jour = NOW() WHERE id_doleance = ?',
      [id_statut, id]
    );
    
    await pool.execute(
      `INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire, date_changement) 
       VALUES (?, ?, ?, ?, NOW())`,
      [id, oldStatut[0]?.id_statut || null, id_statut, commentaire || 'Mise à jour du statut']
    );
    
    res.json({ success: true, message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Update statut error:', error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
};

// ========== AJOUTER UNE RÉPONSE ==========
const addReponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    await pool.execute(
      `INSERT INTO reponses (id_doleance, id_utilisateur, message, date_reponse) 
       VALUES (?, ?, ?, NOW())`,
      [id, req.user?.id_utilisateur || 1, message]
    );
    
    res.status(201).json({ success: true, message: 'Réponse ajoutée avec succès' });
  } catch (error) {
    console.error('Add reponse error:', error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
};

// ========== AJOUTER UNE SATISFACTION ==========
const addSatisfaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, commentaire } = req.body;
    
    if (note < 1 || note > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'La note doit être comprise entre 1 et 5' 
      });
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
    res.status(500).json({ success: false, message: 'Erreur' });
  }
};

// ========== SUPPRIMER UNE DOLÉANCE ==========
const deleteDoleance = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Suppression doléance ID:', id);
    
    const [doleance] = await pool.execute(
      'SELECT reference FROM doleances WHERE id_doleance = ?',
      [id]
    );
    
    if (doleance.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doléance non trouvée' 
      });
    }
    
    await pool.execute('DELETE FROM reponses WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM historique_statuts WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM assignations WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM transferts WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM pieces_jointes WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM commentaires_internes WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM notifications WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM doleances WHERE id_doleance = ?', [id]);
    
    console.log('✅ Doléance supprimée');
    
    res.json({ 
      success: true, 
      message: `Doléance "${doleance[0].reference}" supprimée avec succès` 
    });
  } catch (error) {
    console.error('Delete doleance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression: ' + error.message 
    });
  }
};

// ========== METTRE À JOUR LA PRIORITÉ ==========
const updatePriorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_priorite } = req.body;
    
    console.log('📝 Mise à jour priorité - ID doléance:', id, 'Nouvelle priorité:', id_priorite);
    
    if (!id || !id_priorite) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID doléance et priorité requis' 
      });
    }
    
    const [doleance] = await pool.execute(
      'SELECT reference FROM doleances WHERE id_doleance = ?',
      [id]
    );
    
    if (doleance.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doléance non trouvée' 
      });
    }
    
    const [priorite] = await pool.execute(
      'SELECT nom_priorite FROM priorites WHERE id_priorite = ?',
      [id_priorite]
    );
    
    if (priorite.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Priorité invalide' 
      });
    }
    
    const prioriteNom = priorite[0].nom_priorite;
    
    await pool.execute(
      'UPDATE doleances SET id_priorite = ? WHERE id_doleance = ?',
      [id_priorite, id]
    );
    
    await pool.execute(
      `INSERT INTO historique_statuts (id_doleance, commentaire, date_changement) 
       VALUES (?, ?, NOW())`,
      [id, `Priorité modifiée : ${prioriteNom}`]
    );
    
    console.log('✅ Priorité mise à jour avec succès');
    
    res.json({ 
      success: true, 
      message: `Priorité de la doléance ${doleance[0].reference} mise à jour en ${prioriteNom}`,
      data: {
        id_priorite: id_priorite,
        nom_priorite: prioriteNom
      }
    });
  } catch (error) {
    console.error('❌ Update priorite error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la priorité: ' + error.message 
    });
  }
};

// ========== TRANSFÉRER UNE DOLÉANCE VERS UNE DIRECTION ==========
const transferer = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction, motif } = req.body;
    
    console.log('🔄 Transfert doléance ID:', id, 'Vers direction:', id_direction);
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const [doleance] = await connection.execute(
        'SELECT id_direction, reference FROM doleances WHERE id_doleance = ?',
        [id]
      );
      
      if (doleance.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Doléance non trouvée' 
        });
      }
      
      const directionSource = doleance[0].id_direction;
      const reference = doleance[0].reference;
      
      const [sourceDir] = await connection.execute(
        'SELECT nom_direction FROM directions WHERE id_direction = ?',
        [directionSource]
      );
      
      const [destDir] = await connection.execute(
        'SELECT nom_direction FROM directions WHERE id_direction = ? AND actif = 1',
        [id_direction]
      );
      
      if (destDir.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Direction de destination non trouvée' 
        });
      }
      
      await connection.execute(
        'UPDATE doleances SET id_direction = ?, date_mise_a_jour = NOW() WHERE id_doleance = ?',
        [id_direction, id]
      );
      
      await connection.execute(
        `INSERT INTO transferts (id_doleance, id_direction_source, id_direction_destination, motif, id_utilisateur, date_transfert) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, directionSource || null, id_direction, motif || 'Transfert par agent central', req.user?.id_utilisateur || 1]
      );
      
      await connection.execute(
        `INSERT INTO historique_statuts (id_doleance, commentaire, date_changement) 
         VALUES (?, ?, NOW())`,
        [id, `Doléance transférée de "${sourceDir[0]?.nom_direction || 'Non assignée'}" vers "${destDir[0].nom_direction}" - Motif: ${motif || 'Transfert'}`]
      );
      
      await connection.commit();
      
      console.log('✅ Doléance transférée avec succès');
      
      res.json({ 
        success: true, 
        message: `Doléance ${reference} transférée avec succès vers ${destDir[0].nom_direction}` 
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du transfert: ' + error.message 
    });
  }
};

// ========== DONNÉES DE RÉFÉRENCE ==========
const getCategories = async (req, res) => {
  try {
    const [data] = await pool.execute('SELECT * FROM categories_doleance ORDER BY nom_categorie');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, data: [] });
  }
};

const getStatuts = async (req, res) => {
  try {
    const [data] = await pool.execute('SELECT * FROM statuts ORDER BY ordre');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get statuts error:', error);
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
  getDoleancesPublic,
  getDoleanceById,
  getDoleanceByReference,
  updateStatut,
  addReponse,
  addSatisfaction,
  deleteDoleance,
  updatePriorite,
  transferer,
  getCategories,
  getStatuts,
  getPriorites,
  getDirections,
  getQuartiers,
  getRoles
};
