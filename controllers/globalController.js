const { pool } = require('../config/database');
const utilisateurModel = require('../models/utilisateurModel');
const roleModel = require('../models/roleModel');
const directionModel = require('../models/directionModel');
const doleanceModel = require('../models/doleanceModel');
const referenceModel = require('../models/referenceModel');
const historiqueModel = require('../models/historiqueModel');
const notificationModel = require('../models/notificationModel');
const logModel = require('../models/logModel');
const pieceJointeModel = require('../models/pieceJointeModel');

// ==================== 1. TABLE utilisateurs ====================
const getUtilisateurs = async (req, res) => {
  try {
    const users = await utilisateurModel.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUtilisateurById = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await utilisateurModel.findById(id);
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUtilisateur = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, id_role, id_direction } = req.body;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const id = await utilisateurModel.create({ nom, prenom, email, mot_de_passe: hashedPassword, telephone, id_role, id_direction });
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, id_role, id_direction, actif } = req.body;
    await utilisateurModel.update(id, { nom, prenom, email, telephone, id_role, id_direction, actif });
    res.json({ success: true, message: 'Utilisateur mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    await utilisateurModel.deleteById(id);
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 2. TABLE roles ====================
const getRoles = async (req, res) => {
  try {
    const roles = await roleModel.findAll();
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const roles = await roleModel.findById(id);
    res.json({ success: true, data: roles[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { nom_role, description, permissions, is_system } = req.body;
    const id = await roleModel.create({ nom_role, description, permissions: JSON.stringify(permissions || {}), is_system: is_system || 0 });
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_role, description, permissions, is_system } = req.body;
    await pool.execute(
      'UPDATE roles SET nom_role=?, description=?, permissions=?, is_system=? WHERE id_role=?',
      [nom_role, description, JSON.stringify(permissions || {}), is_system, id]
    );
    res.json({ success: true, message: 'Rôle mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await roleModel.deleteById(id);
    res.json({ success: true, message: 'Rôle supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 3. TABLE directions ====================
const getDirections = async (req, res) => {
  try {
    const directions = await directionModel.findAll();
    res.json({ success: true, data: directions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDirectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const directions = await directionModel.findById(id);
    res.json({ success: true, data: directions[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDirection = async (req, res) => {
  try {
    const { nom_direction, description } = req.body;
    const id = await directionModel.create({ nom_direction, description });
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDirection = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_direction, description } = req.body;
    await directionModel.update(id, { nom_direction, description });
    res.json({ success: true, message: 'Direction mise à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDirection = async (req, res) => {
  try {
    const { id } = req.params;
    await directionModel.deleteById(id);
    res.json({ success: true, message: 'Direction supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 4. TABLE doleances ====================
const getDoleances = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, categorie, priorite, search } = req.query;
    const result = await doleanceModel.list({ page, limit, categorie, statut, priorite, search });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoleanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const doleances = await doleanceModel.findById(id);
    res.json({ success: true, data: doleances[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//  controlleur reference get
const getDoleanceByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    console.log("Reference reçue :", reference);

    const doleances = await doleanceModel.findByReference(reference);

    console.log(doleances);

    if (!doleances || doleances.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Référence introuvable"
      });
    }

    res.json({
      success: true,
      data: doleances[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createDoleance = async (req, res) => {
  try {
    const { reference, titre, description, id_citoyen, id_categorie, id_priorite, id_direction, id_quartier, latitude, longitude } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO doleances (reference, titre, description, id_citoyen, id_categorie, 
       id_priorite, id_direction, id_quartier, latitude, longitude, id_statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [reference, titre, description, id_citoyen, id_categorie, id_priorite, id_direction, id_quartier, latitude, longitude]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDoleance = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_statut, id_priorite, id_direction, satisfaction_note, satisfaction_commentaire } = req.body;
    await pool.execute(
      `UPDATE doleances SET id_statut=?, id_priorite=?, id_direction=?, 
       satisfaction_note=?, satisfaction_commentaire=?, date_mise_a_jour=NOW()
       WHERE id_doleance=?`,
      [id_statut, id_priorite, id_direction, satisfaction_note, satisfaction_commentaire, id]
    );
    res.json({ success: true, message: 'Doléance mise à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDoleance = async (req, res) => {
  try {
    const { id } = req.params;
    await doleanceModel.deleteById(id);
    res.json({ success: true, message: 'Doléance supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 5. TABLE citoyens ====================
const getCitoyens = async (req, res) => {
  try {
    const [citoyens] = await pool.execute('SELECT * FROM citoyens ORDER BY date_creation DESC');
    res.json({ success: true, data: citoyens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCitoyenById = async (req, res) => {
  try {
    const { id } = req.params;
    const [citoyens] = await pool.execute('SELECT * FROM citoyens WHERE id_citoyen = ?', [id]);
    res.json({ success: true, data: citoyens[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCitoyen = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO citoyens (nom, prenom, email, telephone, adresse) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, email, telephone, adresse]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 6. TABLE categories_doleance ====================
const getCategories = async (req, res) => {
  try {
    const categories = await referenceModel.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategorieById = async (req, res) => {
  try {
    const { id } = req.params;
    const [categories] = await pool.execute('SELECT * FROM categories_doleance WHERE id_categorie = ?', [id]);
    res.json({ success: true, data: categories[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCategorie = async (req, res) => {
  try {
    const { nom_categorie, description, couleur, icone } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO categories_doleance (nom_categorie, description, couleur, icone) VALUES (?, ?, ?, ?)',
      [nom_categorie, description, couleur, icone]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 7. TABLE statuts ====================
const getStatuts = async (req, res) => {
  try {
    const statuts = await referenceModel.getStatuts();
    res.json({ success: true, data: statuts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 8. TABLE priorites ====================
const getPriorites = async (req, res) => {
  try {
    const priorites = await referenceModel.getPriorites();
    res.json({ success: true, data: priorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 9. TABLE quartiers ====================
const getQuartiers = async (req, res) => {
  try {
    const quartiers = await referenceModel.getQuartiers();
    res.json({ success: true, data: quartiers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 10. TABLE arrondissements ====================
const getArrondissements = async (req, res) => {
  try {
    const [arrondissements] = await pool.execute('SELECT * FROM arrondissements');
    res.json({ success: true, data: arrondissements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 11. TABLE reponses ====================
const getReponses = async (req, res) => {
  try {
    const { id_doleance } = req.query;
    let query = 'SELECT r.*, CONCAT(u.nom, " ", u.prenom) as auteur FROM reponses r LEFT JOIN utilisateurs u ON r.id_utilisateur = u.id_utilisateur';
    const params = [];
    if (id_doleance) {
      query += ' WHERE r.id_doleance = ?';
      params.push(id_doleance);
    }
    query += ' ORDER BY r.date_reponse ASC';
    const [reponses] = await pool.execute(query, params);
    res.json({ success: true, data: reponses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createReponse = async (req, res) => {
  try {
    const { id_doleance, id_utilisateur, message, est_interne } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO reponses (id_doleance, id_utilisateur, message, est_interne) VALUES (?, ?, ?, ?)',
      [id_doleance, id_utilisateur, message, est_interne || 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 12. TABLE assignations ====================
const getAssignations = async (req, res) => {
  try {
    const { id_doleance, id_utilisateur } = req.query;
    let query = 'SELECT * FROM assignations WHERE 1=1';
    const params = [];
    if (id_doleance) { query += ' AND id_doleance = ?'; params.push(id_doleance); }
    if (id_utilisateur) { query += ' AND id_utilisateur = ?'; params.push(id_utilisateur); }
    const [assignations] = await pool.execute(query, params);
    res.json({ success: true, data: assignations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAssignation = async (req, res) => {
  try {
    const { id_doleance, id_utilisateur, commentaire } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO assignations (id_doleance, id_utilisateur, commentaire) VALUES (?, ?, ?)',
      [id_doleance, id_utilisateur, commentaire]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 13. TABLE historique_statuts ====================
const getHistoriqueStatuts = async (req, res) => {
  try {
    const { id_doleance } = req.query;
    const historique = await historiqueModel.findByDoleanceId(id_doleance);
    res.json({ success: true, data: historique });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createHistoriqueStatut = async (req, res) => {
  try {
    const { id_doleance, id_statut_ancien, id_statut_nouveau, commentaire } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO historique_statuts (id_doleance, id_statut_ancien, id_statut_nouveau, commentaire) VALUES (?, ?, ?, ?)',
      [id_doleance, id_statut_ancien, id_statut_nouveau, commentaire]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 14. TABLE transferts ====================
const getTransferts = async (req, res) => {
  try {
    const { id_doleance } = req.query;
    const [transferts] = await pool.execute(
      `SELECT t.*, ds.nom_direction as direction_source, dd.nom_direction as direction_destination,
              CONCAT(u.nom, ' ', u.prenom) as auteur
       FROM transferts t
       LEFT JOIN directions ds ON t.id_direction_source = ds.id_direction
       LEFT JOIN directions dd ON t.id_direction_destination = dd.id_direction
       LEFT JOIN utilisateurs u ON t.id_utilisateur = u.id_utilisateur
       WHERE t.id_doleance = ?
       ORDER BY t.date_transfert DESC`,
      [id_doleance]
    );
    res.json({ success: true, data: transferts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTransfert = async (req, res) => {
  try {
    const { id_doleance, id_direction_source, id_direction_destination, motif, id_utilisateur } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO transferts (id_doleance, id_direction_source, id_direction_destination, motif, id_utilisateur) VALUES (?, ?, ?, ?, ?)',
      [id_doleance, id_direction_source, id_direction_destination, motif, id_utilisateur]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 15. TABLE pieces_jointes ====================
const getPiecesJointes = async (req, res) => {
  try {
    const { id_doleance } = req.query;
    const pieces = await pieceJointeModel.findByDoleanceId(id_doleance);
    res.json({ success: true, data: pieces });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPieceJointe = async (req, res) => {
  try {
    const { id_doleance, nom_fichier, chemin, type_fichier, taille, id_utilisateur } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO pieces_jointes (id_doleance, nom_fichier, chemin, type_fichier, taille, id_utilisateur) VALUES (?, ?, ?, ?, ?, ?)',
      [id_doleance, nom_fichier, chemin, type_fichier, taille, id_utilisateur]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePieceJointe = async (req, res) => {
  try {
    const { id } = req.params;
    await pieceJointeModel.deleteById(id);
    res.json({ success: true, message: 'Pièce jointe supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 16. TABLE commentaires_internes ====================
const getCommentairesInternes = async (req, res) => {
  try {
    const { id_doleance } = req.query;
    const [commentaires] = await pool.execute(
      `SELECT c.*, CONCAT(u.nom, ' ', u.prenom) as auteur
       FROM commentaires_internes c
       LEFT JOIN utilisateurs u ON c.id_utilisateur = u.id_utilisateur
       WHERE c.id_doleance = ?
       ORDER BY c.date_commentaire ASC`,
      [id_doleance]
    );
    res.json({ success: true, data: commentaires });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCommentaireInterne = async (req, res) => {
  try {
    const { id_doleance, id_utilisateur, contenu } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO commentaires_internes (id_doleance, id_utilisateur, contenu) VALUES (?, ?, ?)',
      [id_doleance, id_utilisateur, contenu]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 17. TABLE notifications ====================
const getNotifications = async (req, res) => {
  try {
    const { id_destinataire } = req.query;
    const notifications = await notificationModel.findByUser(id_destinataire);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { id_destinataire, id_doleance, type, titre, message, donnees } = req.body;
    const id = await notificationModel.create({ id_destinataire, id_doleance, type, titre, message, donnees });
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE notifications SET lu = 1, lu_le = NOW() WHERE id_notification = ?', [id]);
    res.json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 18. TABLE logs_activites ====================
const getLogsActivites = async (req, res) => {
  try {
    const { id_utilisateur, limit = 50 } = req.query;
    let logs;
    if (id_utilisateur) {
      logs = await logModel.findByUser(id_utilisateur, { page: 1, limit: parseInt(limit) });
    } else {
      const [rows] = await pool.execute(
        'SELECT * FROM logs_activites ORDER BY date_action DESC LIMIT ?',
        [parseInt(limit)]
      );
      logs = rows;
    }
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLogActivite = async (req, res) => {
  try {
    const { id_utilisateur, action, entity_type, entity_id, adresse_ip, user_agent } = req.body;
    const id = await logModel.create({ id_utilisateur, action, entity_type, entity_id, adresse_ip, user_agent });
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUtilisateurs, getUtilisateurById, createUtilisateur, updateUtilisateur, deleteUtilisateur,
  getRoles, getRoleById, createRole, updateRole, deleteRole,
  getDirections, getDirectionById, createDirection, updateDirection, deleteDirection,
  getDoleances, getDoleanceById, createDoleance, updateDoleance, deleteDoleance,
  getCitoyens, getCitoyenById, createCitoyen,
  getCategories, getCategorieById, createCategorie,
  getStatuts,
  getPriorites,
  getQuartiers,
  getArrondissements,
  getReponses, createReponse,
  getAssignations, createAssignation,
  getHistoriqueStatuts, createHistoriqueStatut,
  getTransferts, createTransfert,
  getPiecesJointes, createPieceJointe, deletePieceJointe,
  getCommentairesInternes, createCommentaireInterne,
  getNotifications, createNotification, markNotificationAsRead,
  getLogsActivites, createLogActivite ,getDoleanceByReference
};
