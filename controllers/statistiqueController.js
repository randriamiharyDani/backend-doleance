const { pool } = require('../config/database');

// Statistiques du dashboard
const getDashboardStats = async (req, res) => {
  try {
    // Total des doléances
    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM doleances');
    
    // Doléances en cours (statuts 1-4)
    const [enCoursResult] = await pool.execute(
      'SELECT COUNT(*) as enCours FROM doleances WHERE id_statut IN (1,2,3,4)'
    );
    
    // Doléances résolues (statuts 5-6)
    const [resoluesResult] = await pool.execute(
      'SELECT COUNT(*) as resolues FROM doleances WHERE id_statut IN (5,6)'
    );
    
    // Doléances urgentes
    const [urgentesResult] = await pool.execute(
      'SELECT COUNT(*) as urgentes FROM doleances WHERE id_priorite = 4'
    );
    
    res.json({
      success: true,
      data: {
        total: totalResult[0].total,
        enCours: enCoursResult[0].enCours,
        resolues: resoluesResult[0].resolues,
        urgentes: urgentesResult[0].urgentes
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Statistiques par catégorie
const getStatsByCategorie = async (req, res) => {
  try {
    const { periode = 'month' } = req.query;
    
    let dateCondition = '';
    if (periode === 'week') {
      dateCondition = 'AND date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (periode === 'month') {
      dateCondition = 'AND date_creation >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (periode === 'year') {
      dateCondition = 'AND date_creation >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
    }
    
    const [stats] = await pool.execute(
      `SELECT c.id_categorie, c.nom_categorie, c.couleur, 
              COUNT(d.id_doleance) as count,
              ROUND(COUNT(d.id_doleance) * 100.0 / NULLIF((SELECT COUNT(*) FROM doleances WHERE 1=1 ${dateCondition}), 0), 2) as percentage
       FROM categories_doleance c
       LEFT JOIN doleances d ON c.id_categorie = d.id_categorie ${dateCondition ? `AND ${dateCondition.substring(4)}` : ''}
       GROUP BY c.id_categorie
       ORDER BY count DESC`,
      []
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats by category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Statistiques par direction
const getStatsByDirection = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT d.id_direction, d.nom_direction, 
              COUNT(do.id_doleance) as count,
              ROUND(COUNT(do.id_doleance) * 100.0 / NULLIF((SELECT COUNT(*) FROM doleances), 0), 2) as percentage
       FROM directions d
       LEFT JOIN doleances do ON d.id_direction = do.id_direction
       GROUP BY d.id_direction
       ORDER BY count DESC`,
      []
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats by direction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Statistiques par statut
const getStatsByStatut = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT s.id_statut, s.nom_statut, s.couleur, 
              COUNT(d.id_doleance) as count,
              ROUND(COUNT(d.id_doleance) * 100.0 / NULLIF((SELECT COUNT(*) FROM doleances), 0), 2) as percentage
       FROM statuts s
       LEFT JOIN doleances d ON s.id_statut = d.id_statut
       GROUP BY s.id_statut
       ORDER BY s.ordre`,
      []
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats by status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Statistiques par priorité
const getStatsByPriorite = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT p.id_priorite, p.nom_priorite, p.niveau, p.couleur,
              COUNT(d.id_doleance) as count,
              AVG(DATEDIFF(COALESCE(d.date_resolution, NOW()), d.date_creation)) as delai_moyen_jours
       FROM priorites p
       LEFT JOIN doleances d ON p.id_priorite = d.id_priorite
       GROUP BY p.id_priorite
       ORDER BY p.niveau`,
      []
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats by priority error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Évolution temporelle
const getEvolutionTemporelle = async (req, res) => {
  try {
    const { periode = 'month', nb = 12 } = req.query;
    
    let groupBy = '';
    let dateFormat = '';
    
    if (periode === 'day') {
      groupBy = 'DATE(date_creation)';
      dateFormat = '%Y-%m-%d';
    } else if (periode === 'week') {
      groupBy = 'YEARWEEK(date_creation)';
      dateFormat = '%Y-%m-%d';
    } else if (periode === 'month') {
      groupBy = 'DATE_FORMAT(date_creation, "%Y-%m")';
      dateFormat = '%Y-%m';
    } else {
      groupBy = 'DATE_FORMAT(date_creation, "%Y-%m")';
      dateFormat = '%Y-%m';
    }
    
    const [stats] = await pool.execute(
      `SELECT ${groupBy} as periode,
              COUNT(*) as total,
              SUM(CASE WHEN id_statut IN (5,6) THEN 1 ELSE 0 END) as resolues,
              SUM(CASE WHEN id_priorite = 4 THEN 1 ELSE 0 END) as urgentes
       FROM doleances
       WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? ${periode === 'month' ? 'MONTH' : (periode === 'week' ? 'WEEK' : 'DAY')})
       GROUP BY ${groupBy}
       ORDER BY periode DESC
       LIMIT ?`,
      [parseInt(nb), parseInt(nb)]
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get temporal evolution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Temps de traitement moyen
const getTempsTraitementMoyen = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        AVG(TIMESTAMPDIFF(HOUR, date_creation, COALESCE(date_resolution, NOW()))) as moyen_heures,
        MIN(TIMESTAMPDIFF(HOUR, date_creation, COALESCE(date_resolution, NOW()))) as min_heures,
        MAX(TIMESTAMPDIFF(HOUR, date_creation, COALESCE(date_resolution, NOW()))) as max_heures,
        AVG(CASE WHEN id_priorite = 1 THEN TIMESTAMPDIFF(HOUR, date_creation, COALESCE(date_resolution, NOW())) END) as basse_heures,
        AVG(CASE WHEN id_priorite = 2 THEN TIMESTAMPDIFF(HOUR, date_creation, COALESCE(date_resolution, NOW())) END) as moyenne_heures,
        AVG(CASE WHEN id_priorite = 3 THEN TIMESTAMPDIFF(HOUR, date_creation, COALESCE(date_resolution, NOW())) END) as haute_heures,
        AVG(CASE WHEN id_priorite = 4 THEN TIMESTAMPDIFF(HOUR, date_creation, COALESCE(date_resolution, NOW())) END) as urgente_heures
       FROM doleances
       WHERE id_statut IN (5,6)`,
      []
    );
    
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Get average processing time error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Performance des agents
const getPerformanceAgents = async (req, res) => {
  try {
    const { periode = 'month' } = req.query;
    
    let dateCondition = '';
    if (periode === 'week') {
      dateCondition = 'AND date_assignation >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (periode === 'month') {
      dateCondition = 'AND date_assignation >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (periode === 'year') {
      dateCondition = 'AND date_assignation >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
    }
    
    const [stats] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom,
              COUNT(DISTINCT a.id_doleance) as doleances_traitees,
              COUNT(DISTINCT CASE WHEN d.id_statut IN (5,6) THEN d.id_doleance END) as doleances_resolues,
              ROUND(AVG(TIMESTAMPDIFF(HOUR, a.date_assignation, COALESCE(d.date_resolution, NOW())))) as temps_moyen_heures
       FROM utilisateurs u
       JOIN assignations a ON u.id_utilisateur = a.id_utilisateur
       JOIN doleances d ON a.id_doleance = d.id_doleance
       WHERE u.id_role = 2 ${dateCondition}
       GROUP BY u.id_utilisateur
       ORDER BY doleances_resolues DESC`,
      []
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get agents performance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Statistiques par quartier
const getStatsByQuartier = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT a.id_arrondissement, a.nom_arrondissement,
              q.id_quartier, q.nom_quartier,
              COUNT(d.id_doleance) as count
       FROM arrondissements a
       LEFT JOIN quartiers q ON a.id_arrondissement = q.id_arrondissement
       LEFT JOIN doleances d ON q.id_quartier = d.id_quartier
       GROUP BY q.id_quartier
       ORDER BY count DESC`,
      []
    );
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats by district error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Taux de satisfaction
const getTauxSatisfaction = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_avis,
        ROUND(AVG(satisfaction_note), 2) as note_moyenne,
        SUM(CASE WHEN satisfaction_note >= 4 THEN 1 ELSE 0 END) as satisfaits,
        SUM(CASE WHEN satisfaction_note <= 2 THEN 1 ELSE 0 END) as insatisfaits,
        ROUND(SUM(CASE WHEN satisfaction_note >= 4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as taux_satisfaction
       FROM doleances
       WHERE satisfaction_note IS NOT NULL`,
      []
    );
    
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Get satisfaction rate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
};

// Export des statistiques
const exportStats = async (req, res) => {
  try {
    const { format = 'json' } = req.params;
    const { date_debut, date_fin } = req.body;
    
    let dateCondition = '';
    const params = [];
    
    if (date_debut) {
      dateCondition += ' AND date_creation >= ?';
      params.push(date_debut);
    }
    if (date_fin) {
      dateCondition += ' AND date_creation <= ?';
      params.push(date_fin);
    }
    
    const [stats] = await pool.execute(
      `SELECT 
        DATE(date_creation) as date,
        COUNT(*) as total,
        SUM(CASE WHEN id_statut IN (1,2,3,4) THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN id_statut IN (5,6) THEN 1 ELSE 0 END) as resolues,
        SUM(CASE WHEN id_priorite = 4 THEN 1 ELSE 0 END) as urgentes
       FROM doleances
       WHERE 1=1 ${dateCondition}
       GROUP BY DATE(date_creation)
       ORDER BY date DESC`,
      params
    );
    
    if (format === 'csv') {
      const csvRows = [];
      const headers = ['Date', 'Total', 'En cours', 'Résolues', 'Urgentes'];
      csvRows.push(headers.join(','));
      
      for (const stat of stats) {
        csvRows.push([stat.date, stat.total, stat.en_cours, stat.resolues, stat.urgentes].join(','));
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=statistiques.csv');
      return res.send(csvRows.join('\n'));
    }
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Export stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'export' 
    });
  }
};

module.exports = {
  getDashboardStats,
  getStatsByCategorie,
  getStatsByDirection,
  getStatsByStatut,
  getStatsByPriorite,
  getEvolutionTemporelle,
  getTempsTraitementMoyen,
  getPerformanceAgents,
  getStatsByQuartier,
  getTauxSatisfaction,
  exportStats
};