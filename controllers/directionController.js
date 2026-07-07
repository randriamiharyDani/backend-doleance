const { pool } = require('../config/database');

// ========== DIRECTIONS ==========

// Récupérer toutes les directions
const getDirections = async (req, res) => {
  try {
    const [directions] = await pool.execute(
      `SELECT d.*, 
       COUNT(DISTINCT s.id_service) as total_services,
       COUNT(DISTINCT u.id_utilisateur) as total_agents,
       COUNT(DISTINCT dl.id_doleance) as total_doleances
       FROM directions d
       LEFT JOIN services s ON d.id_direction = s.id_direction
       LEFT JOIN utilisateurs u ON d.id_direction = u.id_direction AND u.actif = 1
       LEFT JOIN doleances dl ON d.id_direction = dl.id_direction
       GROUP BY d.id_direction
       ORDER BY d.categorie, d.nom_direction`
    );
    
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
    
    const [directions] = await pool.execute(
      `SELECT d.*, 
       COUNT(DISTINCT s.id_service) as total_services,
       COUNT(DISTINCT u.id_utilisateur) as total_agents
       FROM directions d
       LEFT JOIN services s ON d.id_direction = s.id_direction
       LEFT JOIN utilisateurs u ON d.id_direction = u.id_direction AND u.actif = 1
       WHERE d.id_direction = ?
       GROUP BY d.id_direction`,
      [id]
    );
    
    if (directions.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    const [services] = await pool.execute(
      'SELECT * FROM services WHERE id_direction = ? ORDER BY nom_service',
      [id]
    );
    
    const [agents] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.actif, COALESCE(r.nom_role, 'agent') as nom_role
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       WHERE u.id_direction = ? AND u.actif = 1
       ORDER BY u.nom, u.prenom`,
      [id]
    );
    
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
    
    const [result] = await pool.execute(
      `INSERT INTO directions (nom_direction, description, categorie, email, telephone, responsable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom_direction, description || null, categorie || null, email || null, telephone || null, responsable || null]
    );
    
    const [newDirection] = await pool.execute(
      'SELECT * FROM directions WHERE id_direction = ?',
      [result.insertId]
    );
    
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
    
    const [existing] = await pool.execute(
      'SELECT id_direction FROM directions WHERE id_direction = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    await pool.execute(
      `UPDATE directions 
       SET nom_direction = ?, description = ?, categorie = ?, email = ?, telephone = ?, responsable = ?
       WHERE id_direction = ?`,
      [nom_direction, description || null, categorie || null, email || null, telephone || null, responsable || null, id]
    );
    
    const [updatedDirection] = await pool.execute(
      'SELECT * FROM directions WHERE id_direction = ?',
      [id]
    );
    
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
    
    const [existing] = await pool.execute(
      'SELECT id_direction, nom_direction FROM directions WHERE id_direction = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    const [services] = await pool.execute(
      'SELECT COUNT(*) as count FROM services WHERE id_direction = ?',
      [id]
    );
    
    if (services[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer cette direction car elle contient ${services[0].count} service(s). Supprimez d'abord les services.` 
      });
    }
    
    const [agents] = await pool.execute(
      'SELECT COUNT(*) as count FROM utilisateurs WHERE id_direction = ?',
      [id]
    );
    
    if (agents[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer cette direction car elle contient ${agents[0].count} agent(s). Réaffectez d'abord les agents.` 
      });
    }
    
    await pool.execute('DELETE FROM directions WHERE id_direction = ?', [id]);
    
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
    const [services] = await pool.execute(
      `SELECT s.*, d.nom_direction as direction_nom, d.categorie as direction_categorie
       FROM services s
       LEFT JOIN directions d ON s.id_direction = d.id_direction
       ORDER BY d.nom_direction, s.nom_service`
    );
    
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
    
    const [services] = await pool.execute(
      'SELECT * FROM services WHERE id_direction = ? ORDER BY nom_service',
      [directionId]
    );
    
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
    
    const [result] = await pool.execute(
      `INSERT INTO services (id_direction, nom_service, description, email, telephone, responsable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_direction, nom_service, description || null, email || null, telephone || null, responsable || null]
    );
    
    const [newService] = await pool.execute(
      'SELECT s.*, d.nom_direction as direction_nom FROM services s LEFT JOIN directions d ON s.id_direction = d.id_direction WHERE s.id_service = ?',
      [result.insertId]
    );
    
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
    
    const [existing] = await pool.execute(
      'SELECT id_service FROM services WHERE id_service = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    
    await pool.execute(
      `UPDATE services 
       SET id_direction = ?, nom_service = ?, description = ?, email = ?, telephone = ?, responsable = ?
       WHERE id_service = ?`,
      [id_direction, nom_service, description || null, email || null, telephone || null, responsable || null, id]
    );
    
    const [updatedService] = await pool.execute(
      'SELECT s.*, d.nom_direction as direction_nom FROM services s LEFT JOIN directions d ON s.id_direction = d.id_direction WHERE s.id_service = ?',
      [id]
    );
    
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
    
    const [existing] = await pool.execute(
      'SELECT id_service, nom_service FROM services WHERE id_service = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    
    await pool.execute('DELETE FROM services WHERE id_service = ?', [id]);
    
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
    
    const [direction] = await pool.execute(
      'SELECT * FROM directions WHERE id_direction = ?',
      [id]
    );
    
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
       LEFT JOIN utilisateurs u ON d.id_agent = u.id_utilisateur
       WHERE d.id_direction = ?
       ORDER BY d.date_creation DESC`,
      [id]
    );
    
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN s.nom_statut IN ('en_attente', 'en_cours') THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN s.nom_statut IN ('traitee', 'resolue', 'cloturee') THEN 1 ELSE 0 END) as traitees,
        SUM(CASE WHEN s.nom_statut = 'transferee' THEN 1 ELSE 0 END) as transferees,
        SUM(CASE WHEN s.nom_statut = 'rejetee' THEN 1 ELSE 0 END) as rejetees
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
       dir_orig.nom_direction as direction_origine
       FROM doleances d
       LEFT JOIN citoyens c ON d.id_citoyen = c.id_citoyen
       LEFT JOIN categories_doleance cat ON d.id_categorie = cat.id_categorie
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN directions dir_orig ON d.id_direction_origine = dir_orig.id_direction
       WHERE d.id_direction_transfert = ?
       ORDER BY d.date_transfert DESC, d.date_creation DESC`,
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
    
    const [doleance] = await pool.execute(
      'SELECT * FROM doleances WHERE id_doleance = ?',
      [id]
    );
    
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }
    
    if (!doleance[0].id_direction_origine && doleance[0].id_direction) {
      await pool.execute(
        'UPDATE doleances SET id_direction_origine = ? WHERE id_doleance = ?',
        [doleance[0].id_direction, id]
      );
    }
    
    const [statutTransfere] = await pool.execute(
      "SELECT id_statut FROM statuts WHERE nom_statut = 'transferee'"
    );
    const id_statut = statutTransfere[0]?.id_statut || 5;
    
    await pool.execute(
      `UPDATE doleances 
       SET id_direction_transfert = ?, 
           id_agent = ?, 
           id_statut = ?,
           commentaire_transfert = ?,
           date_transfert = NOW(),
           id_direction = ?
       WHERE id_doleance = ?`,
      [id_direction_dest, id_agent || null, id_statut, commentaire || null, id_direction_dest, id]
    );
    
    await pool.execute(
      `INSERT INTO logs_activites (id_utilisateur, action, table_name, id_enregistrement, details, date_action)
       VALUES (?, 'transfert_doleance', 'doleances', ?, ?, NOW())`,
      [userId, id, `Doléance transférée à la direction ID: ${id_direction_dest}`]
    );
    
    const [updatedDoleance] = await pool.execute(
      `SELECT d.*, dir.nom_direction as direction_destinataire
       FROM doleances d
       LEFT JOIN directions dir ON d.id_direction_transfert = dir.id_direction
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
    
    const [direction] = await pool.execute(
      'SELECT * FROM directions WHERE id_direction = ?',
      [id]
    );
    
    if (direction.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    const [services] = await pool.execute(
      'SELECT * FROM services WHERE id_direction = ? ORDER BY nom_service',
      [id]
    );
    
    const [agents] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.actif,
              COALESCE(r.nom_role, 'agent') as nom_role
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       WHERE u.id_direction = ? AND u.actif = 1
       ORDER BY r.nom_role, u.nom, u.prenom`,
      [id]
    );
    
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
                dir_orig.nom_direction as direction_origine
         FROM doleances d
         LEFT JOIN citoyens c ON d.id_citoyen = c.id_citoyen
         LEFT JOIN categories_doleance cat ON d.id_categorie = cat.id_categorie
         LEFT JOIN statuts s ON d.id_statut = s.id_statut
         LEFT JOIN directions dir_orig ON d.id_direction_origine = dir_orig.id_direction
         WHERE d.id_direction_transfert = ?
         ORDER BY d.date_transfert DESC
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
          SUM(CASE WHEN s.nom_statut IN ('en_attente', 'en_cours') THEN 1 ELSE 0 END) as doleances_en_cours,
          SUM(CASE WHEN s.nom_statut IN ('traitee', 'resolue', 'cloturee') THEN 1 ELSE 0 END) as doleances_traitees,
          SUM(CASE WHEN s.nom_statut = 'transferee' THEN 1 ELSE 0 END) as doleances_transferees
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
    const [total] = await pool.execute('SELECT COUNT(*) as total FROM directions');
    
    const [byCategory] = await pool.execute(
      'SELECT categorie, COUNT(*) as count FROM directions GROUP BY categorie ORDER BY count DESC'
    );
    
    const [topDirections] = await pool.execute(
      `SELECT d.nom_direction, COUNT(dl.id_doleance) as total_doleances
       FROM directions d
       LEFT JOIN doleances dl ON d.id_direction = dl.id_direction
       GROUP BY d.id_direction
       ORDER BY total_doleances DESC
       LIMIT 5`
    );
    
    const [servicesStats] = await pool.execute(
      'SELECT COUNT(*) as total_services FROM services'
    );
    
    const [agentsByDirection] = await pool.execute(
      `SELECT d.nom_direction, COUNT(u.id_utilisateur) as total_agents
       FROM directions d
       LEFT JOIN utilisateurs u ON d.id_direction = u.id_direction AND u.actif = 1
       GROUP BY d.id_direction
       ORDER BY total_agents DESC
       LIMIT 5`
    );
    
    res.json({
      success: true,
      data: {
        total_directions: total[0].total,
        total_services: servicesStats[0].total_services,
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
    const [users] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, COALESCE(r.nom_role, 'agent') as nom_role
       FROM utilisateurs u
       LEFT JOIN roles r ON u.id_role = r.id_role
       WHERE (u.id_direction IS NULL OR u.id_direction = '') AND u.actif = 1
       ORDER BY u.nom, u.prenom`
    );
    
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users without direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllDirectionsWithStats = async (req, res) => {
  try {
    const [directions] = await pool.execute(
      `SELECT 
        d.*,
        COUNT(DISTINCT s.id_service) as total_services,
        COUNT(DISTINCT u.id_utilisateur) as total_agents,
        COUNT(DISTINCT dl.id_doleance) as total_doleances,
        SUM(CASE WHEN dl.id_statut IN (SELECT id_statut FROM statuts WHERE nom_statut IN ('en_attente', 'en_cours')) THEN 1 ELSE 0 END) as doleances_en_cours,
        SUM(CASE WHEN dl.id_statut IN (SELECT id_statut FROM statuts WHERE nom_statut = 'traitee') THEN 1 ELSE 0 END) as doleances_traitees
       FROM directions d
       LEFT JOIN services s ON d.id_direction = s.id_direction
       LEFT JOIN utilisateurs u ON d.id_direction = u.id_direction AND u.actif = 1
       LEFT JOIN doleances dl ON d.id_direction = dl.id_direction
       GROUP BY d.id_direction
       ORDER BY d.nom_direction`
    );
    
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