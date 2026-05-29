const { pool } = require('../config/database');

// ==================== 1. TABLE utilisateurs ====================
const getUtilisateurs = async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.*, r.nom_role as role_nom, d.nom_direction 
      FROM utilisateurs u
      LEFT JOIN roles r ON u.id_role = r.id_role
      LEFT JOIN directions d ON u.id_direction = d.id_direction
      ORDER BY u.date_creation DESC
    `);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUtilisateurById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute(
      `SELECT u.*, r.nom_role as role_nom, d.nom_direction 
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       LEFT JOIN directions d ON u.id_direction = d.id_direction
       WHERE u.id_utilisateur = ?`,
      [id]
    );
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUtilisateur = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, id_role, id_direction, actif } = req.body;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    const [result] = await pool.execute(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, id_role, id_direction, actif)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, telephone, id_role, id_direction, actif || 1]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, id_role, id_direction, actif } = req.body;
    
    await pool.execute(
      `UPDATE utilisateurs SET nom=?, prenom=?, email=?, telephone=?, id_role=?, id_direction=?, actif=?
       WHERE id_utilisateur = ?`,
      [nom, prenom, email, telephone, id_role, id_direction, actif, id]
    );
    res.json({ success: true, message: 'Utilisateur mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM utilisateurs WHERE id_utilisateur = ?', [id]);
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 2. TABLE roles ====================
const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.execute('SELECT * FROM roles ORDER BY id_role');
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id_role = ?', [id]);
    res.json({ success: true, data: roles[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { nom_role, description, permissions, is_system } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO roles (nom_role, description, permissions, is_system) VALUES (?, ?, ?, ?)',
      [nom_role, description, JSON.stringify(permissions || {}), is_system || 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
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
    await pool.execute('DELETE FROM roles WHERE id_role = ?', [id]);
    res.json({ success: true, message: 'Rôle supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 3. TABLE directions ====================
const getDirections = async (req, res) => {
  try {
    const [directions] = await pool.execute('SELECT * FROM directions ORDER BY nom_direction');
    res.json({ success: true, data: directions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDirectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [directions] = await pool.execute('SELECT * FROM directions WHERE id_direction = ?', [id]);
    res.json({ success: true, data: directions[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDirection = async (req, res) => {
  try {
    const { nom_direction, description } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO directions (nom_direction, description) VALUES (?, ?)',
      [nom_direction, description]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDirection = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_direction, description } = req.body;
    await pool.execute(
      'UPDATE directions SET nom_direction=?, description=? WHERE id_direction=?',
      [nom_direction, description, id]
    );
    res.json({ success: true, message: 'Direction mise à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDirection = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM directions WHERE id_direction = ?', [id]);
    res.json({ success: true, message: 'Direction supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 4. TABLE doleances ====================
const getDoleances = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, categorie, priorite, search } = req.query;
    let query = `
      SELECT d.*, s.nom_statut, s.couleur as statut_couleur, 
             p.nom_priorite, p.niveau,
             c.nom_categorie,
             dir.nom_direction,
             CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
             q.nom_quartier,
             a.nom_arrondissement
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      LEFT JOIN quartiers q ON d.id_quartier = q.id_quartier
      LEFT JOIN arrondissements a ON q.id_arrondissement = a.id_arrondissement
      WHERE 1=1
    `;
    const params = [];
    
    if (statut) { query += ' AND d.id_statut = ?'; params.push(statut); }
    if (categorie) { query += ' AND d.id_categorie = ?'; params.push(categorie); }
    if (priorite) { query += ' AND d.id_priorite = ?'; params.push(priorite); }
    if (search) {
      query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const offset = (page - 1) * limit;
    query += ' ORDER BY d.date_creation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [doleances] = await pool.execute(query, params);
    res.json({ success: true, data: doleances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoleanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [doleances] = await pool.execute(`
      SELECT d.*, s.nom_statut, p.nom_priorite, c.nom_categorie, dir.nom_direction,
             CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom, ct.email, ct.telephone, ct.adresse
      FROM doleances d
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN directions dir ON d.id_direction = dir.id_direction
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      WHERE d.id_doleance = ?
    `, [id]);
    res.json({ success: true, data: doleances[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDoleance = async (req, res) => {
  try {
    const { reference, titre, description, id_citoyen, id_categorie, id_priorite, 
            id_direction, id_quartier, latitude, longitude } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO doleances (reference, titre, description, id_citoyen, id_categorie, 
       id_priorite, id_direction, id_quartier, latitude, longitude, id_statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [reference, titre, description, id_citoyen, id_categorie, id_priorite, 
       id_direction, id_quartier, latitude, longitude]
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
    await pool.execute('DELETE FROM doleances WHERE id_doleance = ?', [id]);
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
    const [categories] = await pool.execute('SELECT * FROM categories_doleance ORDER BY nom_categorie');
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
    const [statuts] = await pool.execute('SELECT * FROM statuts ORDER BY ordre');
    res.json({ success: true, data: statuts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 8. TABLE priorites ====================
const getPriorites = async (req, res) => {
  try {
    const [priorites] = await pool.execute('SELECT * FROM priorites ORDER BY niveau');
    res.json({ success: true, data: priorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 9. TABLE quartiers ====================
const getQuartiers = async (req, res) => {
  try {
    const [quartiers] = await pool.execute(`
      SELECT q.*, a.nom_arrondissement 
      FROM quartiers q
      LEFT JOIN arrondissements a ON q.id_arrondissement = a.id_arrondissement
    `);
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
    const [historique] = await pool.execute(
      `SELECT h.*, s_ancien.nom_statut as ancien_statut, s_nouveau.nom_statut as nouveau_statut
       FROM historique_statuts h
       LEFT JOIN statuts s_ancien ON h.id_statut_ancien = s_ancien.id_statut
       LEFT JOIN statuts s_nouveau ON h.id_statut_nouveau = s_nouveau.id_statut
       WHERE h.id_doleance = ?
       ORDER BY h.date_changement ASC`,
      [id_doleance]
    );
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
    const [pieces] = await pool.execute('SELECT * FROM pieces_jointes WHERE id_doleance = ?', [id_doleance]);
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
    await pool.execute('DELETE FROM pieces_jointes WHERE id_piece = ?', [id]);
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
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE id_destinataire = ? ORDER BY date_notification DESC',
      [id_destinataire]
    );
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { id_destinataire, id_doleance, type, titre, message, donnees } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO notifications (id_destinataire, id_doleance, type, titre, message, donnees) VALUES (?, ?, ?, ?, ?, ?)',
      [id_destinataire, id_doleance, type, titre, message, JSON.stringify(donnees || {})]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
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
    let query = 'SELECT * FROM logs_activites WHERE 1=1';
    const params = [];
    if (id_utilisateur) { query += ' AND id_utilisateur = ?'; params.push(id_utilisateur); }
    query += ' ORDER BY date_action DESC LIMIT ?';
    params.push(parseInt(limit));
    const [logs] = await pool.execute(query, params);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLogActivite = async (req, res) => {
  try {
    const { id_utilisateur, action, entity_type, entity_id, adresse_ip, user_agent } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO logs_activites (id_utilisateur, action, entity_type, entity_id, adresse_ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [id_utilisateur, action, entity_type, entity_id, adresse_ip, user_agent]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  // Utilisateurs
  getUtilisateurs, getUtilisateurById, createUtilisateur, updateUtilisateur, deleteUtilisateur,
  // Rôles
  getRoles, getRoleById, createRole, updateRole, deleteRole,
  // Directions
  getDirections, getDirectionById, createDirection, updateDirection, deleteDirection,
  // Doléances
  getDoleances, getDoleanceById, createDoleance, updateDoleance, deleteDoleance,
  // Citoyens
  getCitoyens, getCitoyenById, createCitoyen,
  // Catégories
  getCategories, getCategorieById, createCategorie,
  // Statuts
  getStatuts,
  // Priorités
  getPriorites,
  // Quartiers
  getQuartiers,
  // Arrondissements
  getArrondissements,
  // Réponses
  getReponses, createReponse,
  // Assignations
  getAssignations, createAssignation,
  // Historique
  getHistoriqueStatuts, createHistoriqueStatut,
  // Transferts
  getTransferts, createTransfert,
  // Pièces jointes
  getPiecesJointes, createPieceJointe, deletePieceJointe,
  // Commentaires internes
  getCommentairesInternes, createCommentaireInterne,
  // Notifications
  getNotifications, createNotification, markNotificationAsRead,
  // Logs
  getLogsActivites, createLogActivite
};