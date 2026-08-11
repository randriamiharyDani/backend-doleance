const fs = require('fs');
const { pool } = require('../config/database');
const doleanceModel = require('../models/doleanceModel');
const citoyenModel = require('../models/citoyenModel');
const pieceJointeModel = require('../models/pieceJointeModel');
const referenceModel = require('../models/referenceModel');
const reponseModel = require('../models/reponseModel');
const historiqueModel = require('../models/historiqueModel');
const transfertModel = require('../models/transfertModel');
const directionModel = require('../models/directionModel');
const notificationModel = require('../models/notificationModel');
const { sendTransferEmail, sendStatusUpdateEmail, isSmtpConfigured } = require('../services/emailService');
const notificationController = require('./notificationController');

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
        let type = 'image';
        if (file.mimetype.startsWith('video/')) type = 'video';
        else if (file.mimetype === 'application/pdf') type = 'pdf';
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
      for (const file of req.files) {
        try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) {}
      }
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
    if (!id) {
      return res.json({ success: true, data: [] });
    }
    const pieces = await pieceJointeModel.findByDoleanceId(id);
    const piecesWithUrl = pieceJointeModel.buildFileUrls(pieces || [], req);
    res.json({ success: true, data: piecesWithUrl || [] });
  } catch (error) {
    console.error('Get pieces jointes error:', error.message);
    res.json({ success: true, data: [] });
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
    if (!fs.existsSync(pieces[0].chemin)) {
      return res.status(404).json({ success: false, message: 'Fichier introuvable sur le serveur' });
    }
    res.download(pieces[0].chemin, pieces[0].nom_fichier);
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
    const userRole = req.user?.nom_role || req.user?.role_nom;
    const userDirectionId = req.user?.id_direction;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const result = await doleanceModel.listBackoffice({
      ...req.query,
      userId,
      userRole,
      userDirectionId
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

      const statutTransfere = await referenceModel.findStatutByNom(connection, 'transfert');
      const idStatut = statutTransfere[0]?.id_statut || 8;

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

      // Envoyer l'email à la direction après le commit
      const emailDirection = direction[0].email;
      if (!emailDirection) {
        console.warn(`⚠️ Pas d'email configuré pour la direction "${direction[0].nom_direction}" — email de transfert non envoyé`);
      }
      
      if (isSmtpConfigured() && emailDirection) {
        const priorites = await referenceModel.getPriorites();
        const priorite = priorites.find(p => p.id_priorite === doleance[0].id_priorite);
        const citoyenNom = doleance[0].citoyen_nom
          ? `${doleance[0].citoyen_prenom || ''} ${doleance[0].citoyen_nom}`.trim()
          : 'Non renseigné';

        sendTransferEmail(direction[0].email, direction[0].nom_direction, {
          reference: doleance[0].reference,
          titre: doleance[0].titre,
          description: doleance[0].description,
          categorie: doleance[0].nom_categorie,
          priorite: priorite?.nom_priorite || 'Moyenne',
          citoyen_nom: citoyenNom,
          date_creation: doleance[0].date_creation,
          lieu_exact: doleance[0].lieu_exact,
          id_direction: id_direction,
          motif: motif
        }).catch(err => console.error('Erreur envoi email transfert:', err.message));
      }

      console.log('✅ Doléance transférée avec succès');

      // Notifier les agents de la direction destinatrice + admins
      try {
        const agentsDir = await notificationModel.findUtilisateursByDirection(id_direction);
        const admins = await notificationModel.findAdminIds();
        const recipients = [...new Set([...agentsDir.map(a => a.id_utilisateur), ...admins.map(a => a.id_utilisateur)])];
        const titreNotif = 'Doléance transférée';
        const messageNotif = `La doléance ${doleance[0].reference} a été transférée vers ${direction[0].nom_direction}`;
        const io = req.app?.get?.('io');
        for (const uid of recipients) {
          const notifId = await notificationController.createNotification(
            uid, titreNotif, messageNotif, 'transfert_doleance', id,
            { reference: doleance[0].reference, titre: doleance[0].titre, direction: direction[0].nom_direction }
          );
          if (notifId && io) {
            const nonLues = await notificationModel.countUnreadByUser(uid);
            io.to(`user_${uid}`).emit('newNotification', {
              id_notification: notifId,
              type: 'transfert_doleance',
              titre: titreNotif,
              message: messageNotif,
              doleance_reference: doleance[0].reference,
              doleance_titre: doleance[0].titre,
              non_lues: nonLues,
              date_notification: new Date().toISOString()
            });
          }
        }
      } catch (notifErr) {
        console.error('Erreur notification transfert:', notifErr.message);
      }
      
      const emailEnvoye = !!(emailDirection && isSmtpConfigured());
      const messageRetour = emailEnvoye
        ? `Doléance ${doleance[0].reference} transférée vers ${direction[0].nom_direction} — Email de notification envoyé à ${emailDirection}`
        : `Doléance ${doleance[0].reference} transférée vers ${direction[0].nom_direction}${!emailDirection ? ' — Aucun email configuré pour cette direction' : ''}`;
      
      res.json({ 
        success: true, 
        message: messageRetour,
        data: { reference: doleance[0].reference, direction_destination: direction[0].nom_direction, email_envoye: emailEnvoye }
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
        reponseModel.findByDoleanceId(doleance.id_doleance, { includeInternal: false }),
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
        nom_direction: doleance.nom_direction || 'Non assignée',
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
      reponseModel.findByDoleanceId(doleance.id_doleance, { includeInternal: false }),
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
      titre, description, id_categorie, quartier,
      latitude, longitude, lieu_exact, suggestions, module
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
      const isSapeursPompiers = module === 'Sapeurs-Pompiers';
      const defaultStatut = isSapeursPompiers ? 9 : 1;
      const defaultPriorite = isSapeursPompiers ? 4 : 2;

      const quartierValue = quartier ? String(quartier).trim() : null;

      const id_doleance = await doleanceModel.create(connection, {
        reference, titre, description, id_citoyen, id_categorie,
        quartier: quartierValue, id_direction: null, id_statut: defaultStatut,
        id_priorite: defaultPriorite,
        latitude: latitude || null, longitude: longitude || null, lieu_exact: lieu_exact || null,
        suggestions: suggestions || null
      });

      await historiqueModel.create(connection, {
        id_doleance,
        id_statut_ancien: null,
        id_statut_nouveau: defaultStatut,
        commentaire: isSapeursPompiers ? 'Création de la doléance (Sapeurs-Pompiers) - Statut urgent' : 'Création de la doléance'
      });

      await connection.commit();

      notificationController.notifyNewDoleance(req, {
        id_doleance, reference, titre, id_direction: null,
        citoyenNom: `${prenom_citoyen} ${nom_citoyen}`
      }).catch(err => console.error('Erreur notification création:', err));

      res.status(201).json({
        success: true,
        message: 'Doléance créée avec succès',
        data: { id: id_doleance, id_doleance, reference, identifiant_citoyen: finalCitizenId, nom_direction: null }
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

    // Envoyer un email au citoyen si le statut change
    if (isSmtpConfigured()) {
      try {
        const doleanceData = await doleanceModel.findById(id);
        if (doleanceData.length > 0 && doleanceData[0].citoyen_email) {
          const nouveauStatut = await referenceModel.getStatuts();
          const statutTrouve = nouveauStatut.find(s => s.id_statut === Number(id_statut));
          const nomStatut = statutTrouve?.nom_statut || 'Mis à jour';

          sendStatusUpdateEmail(
            doleanceData[0].citoyen_email,
            doleanceData[0].citoyen_prenom || 'Citoyen',
            {
              reference: doleanceData[0].reference,
              titre: doleanceData[0].titre,
              id_direction: doleanceData[0].id_direction
            },
            nomStatut,
            commentaire || null
          ).catch(err => console.error('Erreur envoi email statut:', err.message));
        }
      } catch (emailErr) {
        console.error('Erreur préparation email statut:', emailErr.message);
      }
    }

    // Notifier les agents centraux du changement de statut
    try {
      const doleanceData = await doleanceModel.findById(id);
      if (doleanceData.length > 0) {
        const nouveauStatut = await referenceModel.getStatuts();
        const statutTrouve = nouveauStatut.find(s => s.id_statut === Number(id_statut));
        const nomStatut = statutTrouve?.nom_statut || 'Mis à jour';
        const admins = await notificationModel.findAdminIds();
        const titreNotif = 'Statut mis à jour';
        const messageNotif = `La doléance ${doleanceData[0].reference} a un nouveau statut: ${nomStatut}`;
        const io = req.app?.get?.('io');
        for (const admin of admins) {
          const notifId = await notificationController.createNotification(
            admin.id_utilisateur, titreNotif, messageNotif, 'changement_statut', id,
            { reference: doleanceData[0].reference, titre: doleanceData[0].titre, statut: nomStatut }
          );
          if (notifId && io) {
            const nonLues = await notificationModel.countUnreadByUser(admin.id_utilisateur);
            io.to(`user_${admin.id_utilisateur}`).emit('newNotification', {
              id_notification: notifId,
              type: 'changement_statut',
              titre: titreNotif,
              message: messageNotif,
              doleance_reference: doleanceData[0].reference,
              doleance_titre: doleanceData[0].titre,
              non_lues: nonLues,
              date_notification: new Date().toISOString()
            });
          }
        }
      }
    } catch (notifErr) {
      console.error('Erreur notification statut:', notifErr.message);
    }

    res.json({ success: true, message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Update statut error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== AJOUTER UNE RÉPONSE (AGENT/ADMIN) ==========
const addReponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, est_interne } = req.body;
    const userId = req.user?.id_utilisateur || 1;

    await reponseModel.create({ id_doleance: id, id_utilisateur: userId, message, est_interne });

    res.status(201).json({ success: true, message: 'Réponse ajoutée avec succès' });
  } catch (error) {
    console.error('Add reponse error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== AJOUTER UNE RÉPONSE CITOYEN (PUBLIC) ==========
const addReponseCitoyen = async (req, res) => {
  try {
    const { reference } = req.params;
    const { identifiant_citoyen, message } = req.body;

    if (!identifiant_citoyen || !identifiant_citoyen.trim()) {
      return res.status(400).json({ success: false, message: "L'identifiant citoyen est requis" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Le message est requis' });
    }

    const citoyens = await citoyenModel.findByIdentifiant(identifiant_citoyen.trim());
    if (citoyens.length === 0) {
      return res.status(404).json({ success: false, message: 'Identifiant citoyen invalide' });
    }

    const doleances = await doleanceModel.findByReference(reference);
    if (!doleances || doleances.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const doleance = doleances[0];
    if (doleance.id_citoyen !== citoyens[0].id_citoyen) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez répondre qu\'à vos propres doléances' });
    }

    await reponseModel.createByCitizen({
      id_doleance: doleance.id_doleance,
      id_citoyen: citoyens[0].id_citoyen,
      message: message.trim()
    });

    res.status(201).json({ success: true, message: 'Réponse envoyée avec succès' });
  } catch (error) {
    console.error('Add reponse citoyen error:', error);
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

// ========== SUPPRIMER UNE DOLÉANCE (SOFT DELETE) ==========
const deleteDoleance = async (req, res) => {
  try {
    const { id } = req.params;

    const doleance = await doleanceModel.findById(id);
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    await doleanceModel.softDelete(id);

    res.json({ success: true, message: 'Doléance déplacée vers la corbeille' });
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

// ========== METTRE À JOUR UNE DOLÉANCE ==========
const updateDoleance = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description, id_categorie, id_quartier, quartier, lieu_exact, suggestions, citoyen } = req.body;

    const existing = await doleanceModel.findById(id);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const doleanceFields = {};
    if (titre !== undefined) doleanceFields.titre = titre;
    if (description !== undefined) doleanceFields.description = description;
    if (id_categorie !== undefined) doleanceFields.id_categorie = Number(id_categorie);
    if (quartier !== undefined) doleanceFields.quartier = quartier || null;
    else if (id_quartier) doleanceFields.id_quartier = id_quartier || null;
    if (lieu_exact !== undefined) doleanceFields.lieu_exact = lieu_exact;
    if (suggestions !== undefined) doleanceFields.suggestions = suggestions;

    if (Object.keys(doleanceFields).length > 0) {
      await doleanceModel.updateDoleance(id, doleanceFields);
    }

    if (citoyen && existing[0].id_citoyen) {
      await doleanceModel.updateCitoyen(existing[0].id_citoyen, citoyen);
    }

    await historiqueModel.createSimple(id, 'Doléance modifiée par l\'administrateur');

    const updated = await doleanceModel.findById(id);
    res.json({ success: true, message: 'Doléance mise à jour avec succès', data: updated[0] });
  } catch (error) {
    console.error('Update doleance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== STATISTIQUES ==========
const getStatsOverview = async (req, res) => {
  try {
    const userRole = req.user?.nom_role || req.user?.role_nom;
    const userDirectionId = req.user?.id_direction;
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    const isDirectionRole = !adminRoles.includes(userRole);

    let directionFilter = '';
    let params = [];
    if (isDirectionRole) {
      if (userDirectionId) {
        directionFilter = ' AND id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND id_utilisateur_assignee = ?';
        params.push(req.user?.id_utilisateur);
      }
    }

    const [total] = await pool.execute(`SELECT COUNT(*) as total FROM doleances WHERE (supprime IS NULL OR supprime = 0)${directionFilter}`, params);
    const [enAttente] = await pool.execute(
      `SELECT COUNT(*) as en_attente FROM doleances WHERE id_statut IN (SELECT id_statut FROM statuts WHERE nom_statut IN ('Nouvelle', 'En attente')) AND (supprime IS NULL OR supprime = 0)${directionFilter}`, params
    );
    const [enCours] = await pool.execute(
      `SELECT COUNT(*) as en_cours FROM doleances WHERE id_statut IN (SELECT id_statut FROM statuts WHERE nom_statut IN ('Assignée', 'En traitement')) AND (supprime IS NULL OR supprime = 0)${directionFilter}`, params
    );
    const [resolues] = await pool.execute(
      `SELECT COUNT(*) as resolues FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'Résolue') AND (supprime IS NULL OR supprime = 0)${directionFilter}`, params
    );
    const [urgentes] = await pool.execute(
      `SELECT COUNT(*) as urgentes FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'Urgente') AND (supprime IS NULL OR supprime = 0)${directionFilter}`, params
    );
    const [transferts] = await pool.execute(
      `SELECT COUNT(*) as transferts FROM doleances WHERE id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'transfert') AND (supprime IS NULL OR supprime = 0)${directionFilter}`, params
    );

    const [parCategorie] = await pool.execute(`
      SELECT c.nom_categorie, COUNT(d.id_doleance) as total
      FROM categories_doleance c
      LEFT JOIN doleances d ON c.id_categorie = d.id_categorie AND (d.supprime IS NULL OR d.supprime = 0)
      WHERE 1=1${directionFilter.replace(/id_direction/g, 'd.id_direction').replace(/id_utilisateur_assignee/g, 'd.id_utilisateur_assignee')}
      GROUP BY c.id_categorie
      ORDER BY total DESC
      LIMIT 5
    `, params);

    const [parPriorite] = await pool.execute(`
      SELECT p.nom_priorite, p.niveau, COUNT(d.id_doleance) as total
      FROM priorites p
      LEFT JOIN doleances d ON p.id_priorite = d.id_priorite AND (d.supprime IS NULL OR d.supprime = 0)
      WHERE 1=1${directionFilter.replace(/id_direction/g, 'd.id_direction').replace(/id_utilisateur_assignee/g, 'd.id_utilisateur_assignee')}
      GROUP BY p.id_priorite
      ORDER BY p.niveau DESC
    `, params);

    res.json({
      success: true,
      data: {
        total: total[0].total || 0,
        en_attente: enAttente[0].en_attente || 0,
        en_cours: enCours[0].en_cours || 0,
        resolues: resolues[0].resolues || 0,
        urgentes: urgentes[0].urgentes || 0,
        transferts: transferts[0].transferts || 0,
        par_categorie: parCategorie || [],
        par_priorite: parPriorite || []
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== HISTORIQUE DES DOLÉANCES RÉSOLUES ==========
const getHistorique = async (req, res) => {
  try {
    const { filter = 'month', page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const userRole = req.user?.nom_role || req.user?.role_nom;
    const userDirectionId = req.user?.id_direction;
    const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
    const isDirectionRole = !adminRoles.includes(userRole);

    let directionCondition = '';
    let allParams = [];
    if (isDirectionRole) {
      if (userDirectionId) {
        directionCondition = ' AND d.id_direction = ?';
        allParams.push(userDirectionId);
      } else {
        directionCondition = ' AND d.id_utilisateur_assignee = ?';
        allParams.push(req.user?.id_utilisateur);
      }
    }

    let dateCondition = '';
    if (filter === 'week') {
      dateCondition = "AND d.date_mise_a_jour >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (filter === 'month') {
      dateCondition = "AND d.date_mise_a_jour >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    } else if (filter === 'year') {
      dateCondition = "AND d.date_mise_a_jour >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    }

    let searchCondition = '';
    let searchParams = [];
    if (search && search.trim()) {
      searchCondition = "AND (d.reference LIKE ? OR d.titre LIKE ?)";
      const term = `%${search.trim()}%`;
      searchParams = [term, term];
    }

    const resolvedStatuses = `(SELECT id_statut FROM statuts WHERE nom_statut IN ('Résolue', 'Clôturée'))`;

    const countParams = [...allParams, ...searchParams];
    const countQuery = `
      SELECT COUNT(*) as total FROM doleances d
      WHERE d.id_statut IN ${resolvedStatuses} AND (d.supprime IS NULL OR d.supprime = 0) ${directionCondition} ${dateCondition} ${searchCondition}
    `;
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    const dataQuery = `
      SELECT d.*, s.nom_statut, s.couleur as statut_couleur,
             p.nom_priorite, p.niveau,
             c.nom_categorie,
             dir.nom_direction,
             CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
             ct.email as citoyen_email, ct.telephone as citoyen_telephone
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      WHERE d.id_statut IN ${resolvedStatuses} AND (d.supprime IS NULL OR d.supprime = 0) ${directionCondition} ${dateCondition} ${searchCondition}
      ORDER BY d.date_mise_a_jour DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataQuery, [...allParams, ...searchParams, Number(limit), offset]);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Historique error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DONNÉES DE RÉFÉRENCE ==========
const getCategories = async (req, res) => {
  try {
    const { module } = req.query;
    let data;
    if (module) {
      data = await referenceModel.getCategoriesByModule(module);
    } else {
      data = await referenceModel.getCategories();
    }
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

const getQuartiersGeoJSON = async (req, res) => {
  try {
    const data = await referenceModel.getQuartiersGeoJSON();
    res.json(data);
  } catch (error) {
    console.error('Get quartiers geojson error:', error);
    res.status(500).json({ type: 'FeatureCollection', features: [] });
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

// ========== RETOURNER UNE DOLÉANCE AU CENTRAL ==========
const retournerDoleance = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;
    const userId = req.user?.id_utilisateur;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID manquant' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const doleance = await doleanceModel.findById(id);
      if (doleance.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
      }

      const statutNouvelle = await referenceModel.findStatutByNom(connection, 'Nouvelle');
      const idStatutNouvelle = statutNouvelle[0]?.id_statut || 1;
      const idDirectionSource = doleance[0].id_direction;

      await doleanceModel.updateDirectionAndStatut(connection, id, null, idStatutNouvelle);

      const motifText = (motif && motif.trim()) ? motif.trim() : 'Doléance retournée par l\'agent de la direction';

      if (idDirectionSource) {
        await transfertModel.create(connection, {
          id_doleance: id,
          id_direction_source: idDirectionSource,
          id_direction_destination: null,
          id_utilisateur: userId,
          motif: motifText
        });
      }

      await historiqueModel.create(connection, {
        id_doleance: Number(id),
        id_statut_ancien: doleance[0].id_statut,
        id_statut_nouveau: idStatutNouvelle,
        commentaire: `Doléance retournée au central - Motif: ${motifText}`
      });

      await connection.commit();

      // Notifier les agents centraux que la doléance est retournée
      try {
        const admins = await notificationModel.findAdminIds();
        const titreNotif = 'Doléance retournée';
        const messageNotif = `La doléance ${doleance[0].reference} a été retournée par l'agent de la direction — Motif: ${motifText}`;
        const io = req.app?.get?.('io');
        for (const admin of admins) {
          const notifId = await notificationController.createNotification(
            admin.id_utilisateur, titreNotif, messageNotif, 'retour_doleance', id,
            { reference: doleance[0].reference, titre: doleance[0].titre, motif: motifText }
          );
          if (notifId && io) {
            const nonLues = await notificationModel.countUnreadByUser(admin.id_utilisateur);
            io.to(`user_${admin.id_utilisateur}`).emit('newNotification', {
              id_notification: notifId,
              type: 'retour_doleance',
              titre: titreNotif,
              message: messageNotif,
              doleance_reference: doleance[0].reference,
              doleance_titre: doleance[0].titre,
              non_lues: nonLues,
              date_notification: new Date().toISOString()
            });
          }
        }
      } catch (notifErr) {
        console.error('Erreur notification retour:', notifErr.message);
      }

      res.json({
        success: true,
        message: `Doléance ${doleance[0].reference} retournée au central avec succès`
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Return doleance error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du retour: ' + error.message });
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
  addReponseCitoyen,
  addSatisfaction,
  deleteDoleance,
  updatePriorite,
  updateDoleance,
  getCategories,
  getStatuts,
  getPriorites,
  getDirections,
  getQuartiers,
  getQuartiersGeoJSON,
  getRoles,
  handleUploadPiecesJointes,
  getPiecesJointes,
  downloadPieceJointe,
  deletePieceJointe,
  sendReferenceByContact,
  getPiecesJointesByReference,
  getSuggestions,
  getStatsOverview,
  getHistorique,
  retournerDoleance
};
