const { pool } = require('../config/database');

// Récupérer toutes les directions
const getDirections = async (req, res) => {
  try {
    const [directions] = await pool.execute(`
      SELECT d.*, 
             (SELECT COUNT(*) FROM utilisateurs WHERE id_direction = d.id_direction AND id_role IN (2,3,4)) as nb_agents,
             (SELECT COUNT(*) FROM doleances WHERE id_direction = d.id_direction AND id_statut NOT IN (5,6)) as doleances_en_cours
      FROM directions d
      ORDER BY d.nom_direction
    `);
    
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
              (SELECT COUNT(*) FROM utilisateurs WHERE id_direction = d.id_direction AND id_role IN (2,3,4)) as nb_agents,
              (SELECT COUNT(*) FROM doleances WHERE id_direction = d.id_direction AND id_statut NOT IN (5,6)) as doleances_en_cours
       FROM directions d
       WHERE d.id_direction = ?`,
      [id]
    );
    
    if (directions.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    // Récupérer les agents de la direction
    const [agents] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, r.nom_role
       FROM utilisateurs u
       JOIN roles r ON u.id_role = r.id_role
       WHERE u.id_direction = ? AND u.id_role IN (2,3,4)
       ORDER BY u.nom, u.prenom`,
      [id]
    );
    
    // Récupérer les doléances transférées à cette direction
    const [doleances] = await pool.execute(
      `SELECT d.id_doleance, d.reference, d.titre, d.date_creation, s.nom_statut, p.nom_priorite
       FROM doleances d
       JOIN statuts s ON d.id_statut = s.id_statut
       JOIN priorites p ON d.id_priorite = p.id_priorite
       WHERE d.id_direction = ?
       ORDER BY d.date_creation DESC
       LIMIT 10`,
      [id]
    );
    
    res.json({ 
      success: true, 
      data: {
        ...directions[0],
        agents,
        doleances
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
    const { nom_direction, description, categorie } = req.body;
    
    if (!nom_direction) {
      return res.status(400).json({ success: false, message: 'Le nom de la direction est requis' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO directions (nom_direction, description, categorie) VALUES (?, ?, ?)',
      [nom_direction, description || null, categorie || null]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Direction créée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour une direction
const updateDirection = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_direction, description, categorie } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE directions SET nom_direction = ?, description = ?, categorie = ? WHERE id_direction = ?',
      [nom_direction, description || null, categorie || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    res.json({ success: true, message: 'Direction mise à jour' });
  } catch (error) {
    console.error('Update direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer une direction
const deleteDirection = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si des utilisateurs sont associés
    const [users] = await pool.execute(
      'SELECT COUNT(*) as count FROM utilisateurs WHERE id_direction = ?',
      [id]
    );
    
    if (users[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer cette direction car ${users[0].count} agent(s) y sont rattachés` 
      });
    }
    
    const [result] = await pool.execute('DELETE FROM directions WHERE id_direction = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    res.json({ success: true, message: 'Direction supprimée' });
  } catch (error) {
    console.error('Delete direction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assigner un agent à une direction
const assignAgentToDirection = async (req, res) => {
  try {
    const { id_direction, id_utilisateur } = req.body;
    
    await pool.execute(
      'UPDATE utilisateurs SET id_direction = ? WHERE id_utilisateur = ?',
      [id_direction, id_utilisateur]
    );
    
    res.json({ success: true, message: 'Agent assigné à la direction' });
  } catch (error) {
    console.error('Assign agent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les agents non assignés
const getUnassignedAgents = async (req, res) => {
  try {
    const [agents] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, r.nom_role
       FROM utilisateurs u
       JOIN roles r ON u.id_role = r.id_role
       WHERE u.id_direction IS NULL AND u.id_role IN (2,3,4)
       ORDER BY u.nom, u.prenom`
    );
    
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('Get unassigned agents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDirections,
  getDirectionById,
  createDirection,
  updateDirection,
  deleteDirection,
  assignAgentToDirection,
  getUnassignedAgents
};