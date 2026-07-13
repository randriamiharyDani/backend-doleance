const { pool } = require('../config/database');
const doleanceModel = require('../models/doleanceModel');
const citoyenModel = require('../models/citoyenModel');
const pieceJointeModel = require('../models/pieceJointeModel');
const referenceModel = require('../models/referenceModel');
const reponseModel = require('../models/reponseModel');
const historiqueModel = require('../models/historiqueModel');
const transfertModel = require('../models/transfertModel');

// ========== UPLOAD DES PIÈCES JOINTES ==========
const handleUploadPiecesJointes = async (req, res) => {
    const { doleance_id } = req.body;
    console.log('Upload called - doleance_id:', doleance_id, 'files:', req.files?.length);
    if (!doleance_id) {
      return res.status(400).json({ success: false, message: 'ID de la doléance requis' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun fichier sélectionné' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const doleance = await doleanceModel.findById(doleance_id);
      if (doleance.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
      }

      const uploadedFiles = [];
      for (const file of req.files) {
        const type = file.mimetype.startsWith('image/') ? 'image' : 'video';
        const id = await pieceJointeModel.insert(connection, {
          id_doleance: doleance_id,
          filename: file.filename,
          filepath: file.path,
          type,
          taille: file.size
        });

        uploadedFiles.push({
          id,
          nom_fichier: file.filename,
          type,
          taille: file.size
        });
      }

      await connection.commit();
      console.log('Upload success:', uploadedFiles.length, 'files for doleance', doleance_id);
      res.json({
        success: true,
        message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
        data: uploadedFiles
      });
    } catch (error) {
      await connection.rollback();
      console.error('Upload pieces jointes error:', error.message, error.code, error.sql);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'enregistrement des fichiers', detail: error.message });
    } finally {
      connection.release();
    }
};

// ========== RÉCUPÉRER LES PIÈCES JOINTES ==========
const getPiecesJointes = async (req, res) => {
  try {
    const { id } = req.params;
    const pieces = await pieceJointeModel.findByDoleanceId(id);
    const piecesWithUrl = pieceJointeModel.buildFileUrls(pieces, req);
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
    const pieces = await pieceJointeModel.findById(id);
    if (pieces.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    res.download(pieces[0].chemin_fichier, pieces[0].nom_fichier);
  } catch (error) {
    console.error('Download piece jointe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SUPPRIMER UNE PIÈCE JOINTE ==========
const deletePieceJointe = async (req, res) => {
  try {
    await pieceJointeModel.deleteById(req.params.id);
    res.json({ success: true, message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('Delete piece jointe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== PIÈCES JOINTES PUBLIQUES PAR RÉFÉRENCE ==========
const getPiecesJointesByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    const doleances = await doleanceModel.findByReference(reference);
    if (!doleances || doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }
    const pieces = await pieceJointeModel.findByDoleanceId(doleances[0].id_doleance);
    const piecesWithUrl = pieceJointeModel.buildFileUrls(pieces, req);
    res.json({ success: true, data: piecesWithUrl });
  } catch (error) {
    console.error('Get pieces jointes by reference error:', error);
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

    const doleance = await doleanceModel.findByReference(reference);
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

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
    const suggestions = await doleanceModel.searchSuggestions(q);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ success: false, data: [] });
  }
};

// ========== RÉCUPÉRER TOUTES LES DOLÉANCES (PUBLIC) ==========
const getDoleancesPublic = async (req, res) => {
  try {
    const result = await doleanceModel.listPublic(req.query);
    res.json({
      success: true,
      data: {
        doleances: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
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
    const userId = req.user?.id_utilisateur;
    const userRole = req.user?.nom_role;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const result = await doleanceModel.listBackoffice({
      ...req.query,
      userId,
      userRole
    });

    res.json({
      success: true,
      data: {
        doleances: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
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
    const result = await doleanceModel.list(req.query);
    res.json({
      success: true,
      data: {
        doleances: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
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
    const result = await doleanceModel.listEnAttenteTransfert(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
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
      const doleance = await doleanceModel.findById(id);
      if (doleance.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
      }

      const direction = await referenceModel.findDirectionById(connection, id_direction);
      if (direction.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Direction de destination non trouvée' });
      }

      const statutTransfere = await referenceModel.findStatutByNom(connection, 'transferee');
      const idStatut = statutTransfere[0]?.id_statut || 4;

      await doleanceModel.updateDirectionAndStatut(connection, id, id_direction, idStatut);

      const motif = (commentaire && commentaire.trim()) ? commentaire.trim() : 'Transfert par agent central';

      await transfertModel.create(connection, {
        id_doleance: id,
        id_direction_source: doleance[0].id_direction,
        id_direction_destination: id_direction,
        id_utilisateur: userId,
        motif
      });

      await historiqueModel.create(connection, {
        id_doleance: Number(id),
        id_statut_ancien: doleance[0].id_statut,
        id_statut_nouveau: idStatut,
        commentaire: `Doléance transférée vers ${direction[0].nom_direction} - Motif: ${motif}`
      });

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
    console.log('🔍 Recherche par référence:', reference);
    
    const doleances = await doleanceModel.findByReference(reference);
    console.log('📦 Résultat findByReference:', doleances?.length, 'trouvé(s)');
    
    if (!doleances || doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const doleance = doleances[0];
    console.log('✅ Doléance trouvée ID:', doleance.id_doleance);
    
    let reponses = [], historique = [], piecesJointes = [];
    try {
      const results = await Promise.all([
        reponseModel.findByDoleanceId(doleance.id_doleance),
        historiqueModel.findByDoleanceId(doleance.id_doleance),
        pieceJointeModel.findByDoleanceId(doleance.id_doleance)
      ]);
      reponses = results[0] || [];
      historique = results[1] || [];
      piecesJointes = results[2] || [];
    } catch (subError) {
      console.error('❌ Erreur Promises:', subError.message);
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const piecesWithUrl = (piecesJointes || []).map(piece => ({
      ...piece,
      url: `${baseUrl}/uploads/doleances/${piece.nom_fichier || ''}`
    }));

    res.json({
      success: true,
      data: {
        reference: doleance.reference,
        titre: doleance.titre,
        description: doleance.description,
        date_creation: doleance.date_creation,
        date_derniere_modification: doleance.date_mise_a_jour,
        lieu_exact: doleance.lieu_exact || null,
        nom_quartier: doleance.nom_quartier || null,
        suggestions: doleance.suggestions || null,
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
    console.error('❌ Get doleance by reference error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RÉCUPÉRER UNE DOLÉANCE PAR ID ==========
const getDoleanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const doleances = await doleanceModel.findById(id);
    if (doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const doleance = doleances[0];
    const [reponses, historique, piecesJointes] = await Promise.all([
      reponseModel.findByDoleanceId(doleance.id_doleance),
      historiqueModel.findByDoleanceIdSimple(doleance.id_doleance),
      pieceJointeModel.findByDoleanceId(doleance.id_doleance)
    ]);

    const piecesWithUrl = pieceJointeModel.buildFileUrls(piecesJointes, req);

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

    const citoyens = await citoyenModel.findByIdentifiant(identifiant);
    if (citoyens.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun citoyen trouvé avec cet identifiant' });
    }

    const doleances = await doleanceModel.findByCitoyenId(citoyens[0].id_citoyen);

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
    const citoyens = await citoyenModel.findByIdentifiant(identifiant);
    if (citoyens.length === 0) {
      return res.status(404).json({ success: false, message: 'Identifiant citoyen invalide' });
    }

    const doleances = await doleanceModel.findByReferenceAndCitoyen(reference, citoyens[0].id_citoyen);
    if (doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée ou accès non autorisé' });
    }

    const doleance = doleances[0];
    const [reponses, historique, piecesJointes] = await Promise.all([
      reponseModel.findByDoleanceId(doleance.id_doleance),
      historiqueModel.findByDoleanceId(doleance.id_doleance),
      pieceJointeModel.findByDoleanceId(doleance.id_doleance)
    ]);

    const piecesWithUrl = pieceJointeModel.buildFileUrls(piecesJointes, req);

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
      nom_citoyen, prenom_citoyen, telephone_citoyen, email_citoyen, adresse_citoyen,
      titre, description, id_categorie, id_quartier,
      latitude, longitude, lieu_exact, suggestions
    } = req.body;

    if (!nom_citoyen || !prenom_citoyen || !titre || !description || !id_categorie) {
      return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs obligatoires' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let finalCitizenId = identifiant_citoyen;
      let id_citoyen;

      if (identifiant_citoyen && identifiant_citoyen.trim()) {
        const existingCitoyen = await citoyenModel.findByIdentifiant(identifiant_citoyen);
        if (existingCitoyen.length > 0) {
          id_citoyen = existingCitoyen[0].id_citoyen;
          finalCitizenId = existingCitoyen[0].identifiant_citoyen;
        }
      }

      if (!id_citoyen) {
        finalCitizenId = citoyenModel.generateCitizenId();
        id_citoyen = await citoyenModel.create({
          nom: nom_citoyen,
          prenom: prenom_citoyen,
          telephone: telephone_citoyen,
          email: email_citoyen,
          adresse: adresse_citoyen,
          identifiant_citoyen: finalCitizenId
        });
      }

      const reference = doleanceModel.generateReference();
      const defaultStatut = 1;
      let defaultDirection = await doleanceModel.getDefaultDirection(id_categorie);

      const directionsExist = await referenceModel.findDirectionById(connection, defaultDirection);
      if (directionsExist.length === 0) {
        const firstDirection = await referenceModel.findFirstDirection(connection);
        defaultDirection = firstDirection[0]?.id_direction || 1;
      }

      const quartierValue = id_quartier ? Number(id_quartier) : null;

      const id_doleance = await doleanceModel.create(connection, {
        reference, titre, description, id_citoyen, id_categorie,
        id_quartier: quartierValue, id_direction: defaultDirection, id_statut: defaultStatut,
        latitude: latitude || null, longitude: longitude || null, lieu_exact: lieu_exact || null,
        suggestions: suggestions || null
      });

      await historiqueModel.create(connection, {
        id_doleance,
        id_statut_ancien: null,
        id_statut_nouveau: defaultStatut,
        commentaire: 'Création de la doléance'
      });

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Doléance créée avec succès',
        data: { id: id_doleance, id_doleance, reference, identifiant_citoyen: finalCitizenId }
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

    const oldStatut = await doleanceModel.getCurrentStatut(id);
    await doleanceModel.updateStatut(id, id_statut);
    await historiqueModel.createDirect({
      id_doleance: Number(id),
      id_statut_ancien: oldStatut[0]?.id_statut || null,
      id_statut_nouveau: Number(id_statut),
      commentaire: commentaire || 'Mise à jour du statut'
    });

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

    await reponseModel.create({ id_doleance: id, id_utilisateur: userId, message });

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

    await doleanceModel.addSatisfaction(id, note, commentaire);

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

    await pieceJointeModel.deleteByDoleanceId(id);
    await pool.execute('DELETE FROM reponses WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM historique_statuts WHERE id_doleance = ?', [id]);
    await pool.execute('DELETE FROM transferts WHERE id_doleance = ?', [id]);
    await doleanceModel.deleteById(id);

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

    const doleance = await doleanceModel.findById(id);
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const priorites = await referenceModel.getPriorites();
    const priorite = priorites.find(p => p.id_priorite === Number(id_priorite));
    if (!priorite) {
      return res.status(400).json({ success: false, message: 'Priorité invalide' });
    }

    await doleanceModel.updatePriorite(id, id_priorite);
    await historiqueModel.createSimple(id, `Priorité modifiée : ${priorite.nom_priorite}`);

    res.json({
      success: true,
      message: `Priorité de la doléance ${doleance[0].reference} mise à jour en ${priorite.nom_priorite}`,
      data: { id_priorite, nom_priorite: priorite.nom_priorite }
    });
  } catch (error) {
    console.error('Update priorite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== STATISTIQUES ==========
const getStatsOverview = async (req, res) => {
  try {
    const [total] = await pool.execute('SELECT COUNT(*) as total FROM doleances');
    const [enAttente] = await pool.execute(
      "SELECT COUNT(*) as en_attente FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_attente')"
    );
    const [enCours] = await pool.execute(
      "SELECT COUNT(*) as en_cours FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_cours')"
    );
    const [resolues] = await pool.execute(
      "SELECT COUNT(*) as resolues FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'resolue')"
    );

    const [parCategorie] = await pool.execute(`
      SELECT c.nom_categorie, COUNT(d.id_doleance) as total
      FROM categories_doleance c
      LEFT JOIN doleances d ON c.id_categorie = d.id_categorie
      GROUP BY c.id_categorie
      ORDER BY total DESC
      LIMIT 5
    `);

    const [parPriorite] = await pool.execute(`
      SELECT p.nom_priorite, p.niveau, COUNT(d.id_doleance) as total
      FROM priorites p
      LEFT JOIN doleances d ON p.id_priorite = d.id_priorite
      GROUP BY p.id_priorite
      ORDER BY p.niveau DESC
    `);

    res.json({
      success: true,
      data: {
        total: total[0].total || 0,
        en_attente: enAttente[0].en_attente || 0,
        en_cours: enCours[0].en_cours || 0,
        resolues: resolues[0].resolues || 0,
        par_categorie: parCategorie || [],
        par_priorite: parPriorite || []
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DONNÉES DE RÉFÉRENCE ==========
const getCategories = async (req, res) => {
  try {
    const data = await referenceModel.getCategories();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getStatuts = async (req, res) => {
  try {
    const data = await referenceModel.getStatuts();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getPriorites = async (req, res) => {
  try {
    const data = await referenceModel.getPriorites();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getDirections = async (req, res) => {
  try {
    const data = await referenceModel.getDirections();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getQuartiers = async (req, res) => {
  try {
    const data = await referenceModel.getQuartiers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

const getRoles = async (req, res) => {
  try {
    const data = await referenceModel.getRoles();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
};

// ========== RÉCUPÉRER LES DOLÉANCES ASSIGNÉES AVEC LOCALISATION ==========
const getDoleancesAssignedLocations = async (req, res) => {
  try {
    const doleances = await doleanceModel.listAssignedLocations();
    res.json({ success: true, data: doleances });
  } catch (error) {
    console.error('Get assigned locations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== EXPORTS ==========
module.exports = {
  createDoleance,
  getDoleances,
  getDoleancesBackoffice,
  getDoleancesAssignedLocations,
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
  handleUploadPiecesJointes,
  getPiecesJointes,
  downloadPieceJointe,
  deletePieceJointe,
  sendReferenceByContact,
  getPiecesJointesByReference,
  getSuggestions,
  getStatsOverview
};
