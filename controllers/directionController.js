const { pool } = require('../config/database');
const directionModel = require('../models/directionModel');
const serviceModel = require('../models/serviceModel');
const utilisateurModel = require('../models/utilisateurModel');
const doleanceModel = require('../models/doleanceModel');

// ========== DIRECTIONS ==========

// Récupérer toutes les directions
const getDirections = async (req, res) => {
  try {
    const directions = await directionModel.findAll();

    res.json({ success: true, data: directions });
  } catch (error) {
    console.error('Get directions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer une direction par ID
const getDirectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const directions = await directionModel.findByIdWithCounts(id);

    if (directions.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }

    const services = await serviceModel.findByDirection(id);

    const agents = await utilisateurModel.findByDirection(id);

    res.json({
      success: true,
      data: {
        ...directions[0],
        services,
        agents
      }
    });
  } catch (error) {
    console.error('Get direction by id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer une direction
const createDirection = async (req, res) => {
  try {
    const { nom_direction, description, categorie, email, telephone, responsable } = req.body;

    if (!nom_direction) {
      return res.status(400).json({ success: false, message: 'Le nom de la direction est requis' });
    }

    const insertId = await directionModel.create({
      nom_direction,
      description: description || null,
      categorie: categorie || null,
      email: email || null,
      telephone: telephone || null,
      responsable: responsable || null
    });

    const newDirection = await directionModel.findById(insertId);

    res.status(201).json({ success: true, data: newDirection[0], message: 'Direction créée avec succès' });
  } catch (error) {
    console.error('Create direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Modifier une direction
const updateDirection = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_direction, description, categorie, email, telephone, responsable } = req.body;

    const existing = await directionModel.findById(id);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }

    await directionModel.update(id, {
      nom_direction,
      description: description || null,
      categorie: categorie || null,
      email: email || null,
      telephone: telephone || null,
      responsable: responsable || null
    });

    const updatedDirection = await directionModel.findById(id);

    res.json({ success: true, data: updatedDirection[0], message: 'Direction modifiée avec succès' });
  } catch (error) {
    console.error('Update direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer une direction
const deleteDirection = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await directionModel.findById(id);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }

    const servicesCount = await directionModel.countServices(id);

    if (servicesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette direction car elle contient ${servicesCount} service(s). Supprimez d'abord les services.`
      });
    }

    const agentsCount = await directionModel.countUsers(id);

    if (agentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette direction car elle contient ${agentsCount} agent(s). Réaffectez d'abord les agents.`
      });
    }

    await directionModel.deleteById(id);

    res.json({ success: true, message: `Direction "${existing[0].nom_direction}" supprimée avec succès` });
  } catch (error) {
    console.error('Delete direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SERVICES ==========

// Récupérer tous les services
const getServices = async (req, res) => {
  try {
    const services = await serviceModel.findAll();

    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les services par direction
const getServicesByDirection = async (req, res) => {
  try {
    const { directionId } = req.params;

    const services = await serviceModel.findByDirection(directionId);

    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Get services by direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer un service
const createService = async (req, res) => {
  try {
    const { id_direction, nom_service, description, email, telephone, responsable } = req.body;

    if (!nom_service || !id_direction) {
      return res.status(400).json({ success: false, message: 'Le nom du service et la direction sont requis' });
    }

    const insertId = await serviceModel.create({
      id_direction,
      nom_service,
      description: description || null,
      email: email || null,
      telephone: telephone || null,
      responsable: responsable || null
    });

    const newService = await serviceModel.findById(insertId);

    res.status(201).json({ success: true, data: newService[0], message: 'Service créé avec succès' });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Modifier un service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction, nom_service, description, email, telephone, responsable } = req.body;

    const existing = await serviceModel.findById(id);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }

    await serviceModel.update(id, {
      id_direction,
      nom_service,
      description: description || null,
      email: email || null,
      telephone: telephone || null,
      responsable: responsable || null
    });

    const updatedService = await serviceModel.findById(id);

    res.json({ success: true, data: updatedService[0], message: 'Service modifié avec succès' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await serviceModel.findById(id);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }

    await serviceModel.deleteById(id);

    res.json({ success: true, message: `Service "${existing[0].nom_service}" supprimé avec succès` });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DOLÉANCES PAR DIRECTION ==========

// Récupérer toutes les doléances d'une direction
const getDoleancesByDirection = async (req, res) => {
  try {
    const { id } = req.params;

    const direction = await directionModel.findById(id);

    if (direction.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }

    const [doleances] = await pool.execute(
      `SELECT d.*, 
       c.nom as citoyen_nom, c.prenom as citoyen_prenom,
       COALESCE(cat.nom_categorie, 'Non catégorisé') as nom_categorie,
       s.nom_statut,
       u.nom as agent_nom, u.prenom as agent_prenom
       FROM doleances d
       LEFT JOIN citoyens c ON d.id_citoyen = c.id_citoyen
       LEFT JOIN categories_doleance cat ON d.id_categorie = cat.id_categorie
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN utilisateurs u ON d.id_utilisateur_assignee = u.id_utilisateur
       WHERE d.id_direction = ?
       ORDER BY d.date_creation DESC`,
      [id]
    );

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN s.nom_statut IN ('En attente', 'Assignée', 'En traitement') THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN s.nom_statut IN ('Résolue', 'Clôturée') THEN 1 ELSE 0 END) as traitees,
        SUM(CASE WHEN s.nom_statut = 'transferee' THEN 1 ELSE 0 END) as transferees,
        SUM(CASE WHEN s.nom_statut = 'Rejetée' THEN 1 ELSE 0 END) as rejetees,
        SUM(CASE WHEN d.id_priorite = 4 AND d.id_statut NOT IN (5, 6) THEN 1 ELSE 0 END) as urgentes
       FROM doleances d
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       WHERE d.id_direction = ?`,
      [id]
    );

    res.json({
      success: true,
      data: doleances,
      stats: stats[0] || { total: 0, en_cours: 0, traitees: 0, transferees: 0, rejetees: 0 }
    });
  } catch (error) {
    console.error('Get doleances by direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les doléances transférées à une direction
const getDoleancesTransferees = async (req, res) => {
  try {
    const { id } = req.params;

    const [doleances] = await pool.execute(
      `SELECT d.*, 
       c.nom as citoyen_nom, c.prenom as citoyen_prenom,
       COALESCE(cat.nom_categorie, 'Non catégorisé') as nom_categorie,
       s.nom_statut,
       dir_src.nom_direction as direction_origine,
       t.date_transfert,
       t.motif as commentaire_transfert
       FROM transferts t
       INNER JOIN doleances d ON t.id_doleance = d.id_doleance
       LEFT JOIN citoyens c ON d.id_citoyen = c.id_citoyen
       LEFT JOIN categories_doleance cat ON d.id_categorie = cat.id_categorie
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN directions dir_src ON t.id_direction_source = dir_src.id_direction
       WHERE t.id_direction_destination = ?
       ORDER BY t.date_transfert DESC, d.date_creation DESC`,
      [id]
    );

    res.json({ success: true, data: doleances });
  } catch (error) {
    console.error('Get doleances transferees error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Transférer une doléance à une direction
const transfererDoleance = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction_dest, id_agent, commentaire } = req.body;
    const userId = req.user.id_utilisateur;

    const doleance = await doleanceModel.findById(id);

    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const id_direction_source = doleance[0].id_direction;

    const [statutTransfere] = await pool.execute(
      "SELECT id_statut FROM statuts WHERE nom_statut = 'transferee'"
    );
    const id_statut = statutTransfere[0]?.id_statut || 8;

    await pool.execute(
      `INSERT INTO transferts (id_doleance, id_direction_source, id_direction_destination, motif, id_utilisateur, date_transfert)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, id_direction_source || null, id_direction_dest, commentaire || null, userId]
    );

    await pool.execute(
      `UPDATE doleances 
       SET id_direction = ?,
           id_statut = ?,
           id_utilisateur_assignee = ?,
           date_mise_a_jour = NOW()
       WHERE id_doleance = ?`,
      [id_direction_dest, id_statut, id_agent || null, id]
    );

    await pool.execute(
      `INSERT INTO logs_activites (id_utilisateur, action, entity_type, entity_id, date_action)
       VALUES (?, 'transfert_doleance', 'doleances', ?, NOW())`,
      [userId, id]
    );

    const [updatedDoleance] = await pool.execute(
      `SELECT d.*, dir.nom_direction as direction_destinataire
       FROM doleances d
       LEFT JOIN directions dir ON d.id_direction = dir.id_direction
       WHERE d.id_doleance = ?`,
      [id]
    );

    res.json({
      success: true,
      data: updatedDoleance[0],
      message: 'Doléance transférée avec succès'
    });
  } catch (error) {
    console.error('Transferer doleance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DÉTAILS COMPLETS D'UNE DIRECTION ==========

const getDirectionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const direction = await directionModel.findById(id);

    if (direction.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }

    const services = await serviceModel.findByDirection(id);

    const agents = await utilisateurModel.findByDirection(id);

    let doleances = [];
    try {
      const [doleancesData] = await pool.execute(
        `SELECT d.*, 
                c.nom as citoyen_nom, c.prenom as citoyen_prenom,
                COALESCE(cat.nom_categorie, 'Non catégorisé') as nom_categorie,
                s.nom_statut
         FROM doleances d
         LEFT JOIN citoyens c ON d.id_citoyen = c.id_citoyen
         LEFT JOIN categories_doleance cat ON d.id_categorie = cat.id_categorie
         LEFT JOIN statuts s ON d.id_statut = s.id_statut
         WHERE d.id_direction = ?
         ORDER BY d.date_creation DESC
         LIMIT 50`,
        [id]
      );
      doleances = doleancesData;
    } catch (err) {
      console.log('Erreur récupération doléances:', err.message);
    }

    let doleancesTransferees = [];
    try {
      const [doleancesTransfereesData] = await pool.execute(
        `SELECT d.*, 
                c.nom as citoyen_nom, c.prenom as citoyen_prenom,
                COALESCE(cat.nom_categorie, 'Non catégorisé') as nom_categorie,
                s.nom_statut,
                dir_src.nom_direction as direction_origine,
                t.date_transfert,
                t.motif as commentaire_transfert
         FROM transferts t
         INNER JOIN doleances d ON t.id_doleance = d.id_doleance
         LEFT JOIN citoyens c ON d.id_citoyen = c.id_citoyen
         LEFT JOIN categories_doleance cat ON d.id_categorie = cat.id_categorie
         LEFT JOIN statuts s ON d.id_statut = s.id_statut
         LEFT JOIN directions dir_src ON t.id_direction_source = dir_src.id_direction
         WHERE t.id_direction_destination = ?
         ORDER BY t.date_transfert DESC
         LIMIT 50`,
        [id]
      );
      doleancesTransferees = doleancesTransfereesData;
    } catch (err) {
      console.log('Erreur récupération doléances transférées:', err.message);
    }

    let stats = {
      total_doleances: 0,
      doleances_en_cours: 0,
      doleances_traitees: 0,
      doleances_transferees: 0,
      total_services: services.length,
      total_agents: agents.length
    };

    try {
      const [statsData] = await pool.execute(
        `SELECT 
          COUNT(DISTINCT d.id_doleance) as total_doleances,
          SUM(CASE WHEN s.nom_statut IN ('En attente', 'Assignée', 'En traitement') THEN 1 ELSE 0 END) as doleances_en_cours,
          SUM(CASE WHEN s.nom_statut IN ('Résolue', 'Clôturée') THEN 1 ELSE 0 END) as doleances_traitees,
          SUM(CASE WHEN s.nom_statut = 'transferee' THEN 1 ELSE 0 END) as doleances_transferees,
          SUM(CASE WHEN d.id_priorite = 4 AND d.id_statut NOT IN (5, 6) THEN 1 ELSE 0 END) as doleances_urgentes
         FROM doleances d
         LEFT JOIN statuts s ON d.id_statut = s.id_statut
         WHERE d.id_direction = ?`,
        [id]
      );
      if (statsData && statsData[0]) {
        stats = {
          total_doleances: statsData[0].total_doleances || 0,
          doleances_en_cours: statsData[0].doleances_en_cours || 0,
          doleances_traitees: statsData[0].doleances_traitees || 0,
          doleances_transferees: statsData[0].doleances_transferees || 0,
          doleances_urgentes: statsData[0].doleances_urgentes || 0,
          total_services: services.length,
          total_agents: agents.length
        };
      }
    } catch (err) {
      console.log('Erreur récupération statistiques:', err.message);
    }

    res.json({
      success: true,
      data: {
        direction: direction[0],
        services: services || [],
        agents: agents || [],
        doleances: doleances || [],
        doleancesTransferees: doleancesTransferees || [],
        stats: stats
      }
    });
  } catch (error) {
    console.error('Get direction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des détails de la direction: ' + error.message
    });
  }
};

// ========== STATISTIQUES ==========

const getDirectionsStats = async (req, res) => {
  try {
    const total = await directionModel.countAll();

    const byCategory = await directionModel.countByCategorie();

    const topDirections = await directionModel.countDoleances();

    const totalServices = await serviceModel.countAll();

    const agentsByDirection = await directionModel.countAgents();

    res.json({
      success: true,
      data: {
        total_directions: total,
        total_services: totalServices,
        by_category: byCategory,
        top_directions: topDirections,
        agents_by_direction: agentsByDirection
      }
    });
  } catch (error) {
    console.error('Get directions stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsersWithoutDirection = async (req, res) => {
  try {
    const users = await utilisateurModel.findSansDirection();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users without direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllDirectionsWithStats = async (req, res) => {
  try {
    const directions = await directionModel.findAllWithStats();

    res.json({ success: true, data: directions });
  } catch (error) {
    console.error('Get all directions with stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== EXPORTS ==========

module.exports = {
  getDirections,
  getDirectionById,
  createDirection,
  updateDirection,
  deleteDirection,
  getServices,
  getServicesByDirection,
  createService,
  updateService,
  deleteService,
  getDoleancesByDirection,
  getDoleancesTransferees,
  transfererDoleance,
  getDirectionDetails,
  getAllDirectionsWithStats,
  getDirectionsStats,
  getUsersWithoutDirection
};
