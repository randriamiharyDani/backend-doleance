const { pool } = require('../config/database');
const directionModel = require('../models/directionModel');
const serviceModel = require('../models/serviceModel');

// Statistiques du dashboard
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;
    const { id_categorie } = req.query;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        directionFilter = ' AND id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND id_utilisateur_assignee = ?';
        params.push(userId);
      }
    }

    let categorieFilter = '';
    if (id_categorie) {
      categorieFilter = ' AND id_categorie = ?';
      params.push(Number(id_categorie));
    }

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM doleances WHERE 1=1 ${directionFilter}${categorieFilter}`,
      params
    );

    const [enCoursResult] = await pool.execute(
      `SELECT COUNT(*) as enCours FROM doleances WHERE id_statut IN (1,2,3,4) ${directionFilter}${categorieFilter}`,
      params
    );

    const [resoluesResult] = await pool.execute(
      `SELECT COUNT(*) as resolues FROM doleances WHERE id_statut IN (5,6) ${directionFilter}${categorieFilter}`,
      params
    );

    const [urgentesResult] = await pool.execute(
      `SELECT COUNT(*) as urgentes FROM doleances WHERE (id_statut = 9 OR id_priorite = 4) AND id_statut NOT IN (5, 6) ${directionFilter}${categorieFilter}`,
      params
    );

    // Calcul de l'évolution (comparaison mois courant vs mois précédent)
    const [currentMonthResult] = await pool.execute(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN id_statut IN (1,2,3,4) THEN 1 ELSE 0 END) as enCours,
        SUM(CASE WHEN id_statut IN (5,6) THEN 1 ELSE 0 END) as resolues,
        SUM(CASE WHEN (id_statut = 9 OR id_priorite = 4) AND id_statut NOT IN (5,6) THEN 1 ELSE 0 END) as urgentes
      FROM doleances
      WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 1 MONTH) ${directionFilter}`,
      params
    );

    const [previousMonthResult] = await pool.execute(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN id_statut IN (1,2,3,4) THEN 1 ELSE 0 END) as enCours,
        SUM(CASE WHEN id_statut IN (5,6) THEN 1 ELSE 0 END) as resolues,
        SUM(CASE WHEN (id_statut = 9 OR id_priorite = 4) AND id_statut NOT IN (5,6) THEN 1 ELSE 0 END) as urgentes
      FROM doleances
      WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 2 MONTH)
        AND date_creation < DATE_SUB(NOW(), INTERVAL 1 MONTH) ${directionFilter}`,
      params
    );

    const calcChange = (current, previous) => {
      if (!previous || previous === 0) return { value: null, type: 'up' };
      const pct = ((current - previous) / previous * 100);
      return {
        value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
        type: pct >= 0 ? 'up' : 'down'
      };
    };

    const evolution = {
      total: calcChange(currentMonthResult[0].total, previousMonthResult[0].total),
      enCours: calcChange(currentMonthResult[0].enCours, previousMonthResult[0].enCours),
      resolues: calcChange(currentMonthResult[0].resolues, previousMonthResult[0].resolues),
      urgentes: calcChange(currentMonthResult[0].urgentes, previousMonthResult[0].urgentes)
    };

    // Données supplémentaires selon le rôle
    let additionalData = {};

    if (userRole === 'administrateur_systeme' || userRole === 'agent_central') {
      const totalDirections = await directionModel.countAll();
      const [agentsCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM utilisateurs WHERE id_role IN (2,3,4) AND actif = 1'
      );
      additionalData = {
        totalDirections: totalDirections || 0,
        totalAgents: agentsCount[0].total || 0
      };
    }

    if (userRole === 'agent_central') {
      const [enAttenteResult] = await pool.execute(
        `SELECT COUNT(*) as enAttente FROM doleances WHERE id_statut = 1`
      );
      additionalData.enAttente = enAttenteResult[0].enAttente || 0;
    }

    if (userRole === 'directeur' || userRole === 'chef_service') {
      if (userDirectionId) {
        const totalServices = await serviceModel.countByDirection(userDirectionId);
        const [agentsCount] = await pool.execute(
          'SELECT COUNT(*) as total FROM utilisateurs WHERE id_direction = ? AND actif = 1',
          [userDirectionId]
        );
        additionalData = {
          totalServices: totalServices || 0,
          totalAgents: agentsCount[0].total || 0
        };
      }
    }

    if (userRole === 'agent') {
      const [doleancesTraitees] = await pool.execute(
        'SELECT COUNT(*) as total FROM doleances WHERE id_utilisateur_assignee = ? AND id_statut IN (5,6)',
        [userId]
      );
      additionalData.doleancesTraitees = doleancesTraitees[0].total || 0;
    }

    res.json({
      success: true,
      data: {
        total: totalResult[0].total || 0,
        enCours: enCoursResult[0].enCours || 0,
        resolues: resoluesResult[0].resolues || 0,
        urgentes: urgentesResult[0].urgentes || 0,
        evolution,
        ...additionalData
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

// Statistiques par catégorie (version corrigée sans sous-requête problématique)
const getStatsByCategorie = async (req, res) => {
  try {
    const { periode = 'month' } = req.query;
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        directionFilter = ' AND d.id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND d.id_utilisateur_assignee = ?';
        params.push(userId);
      }
    }

    let dateCondition = '';
    if (periode === 'week') {
      dateCondition = 'AND d.date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (periode === 'month') {
      dateCondition = 'AND d.date_creation >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (periode === 'year') {
      dateCondition = 'AND d.date_creation >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
    }

    // Récupérer d'abord le total
    let totalQuery = 'SELECT COUNT(*) as total FROM doleances WHERE 1=1';
    let totalParams = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        totalQuery += ' AND id_direction = ?';
        totalParams.push(userDirectionId);
      } else {
        totalQuery += ' AND id_utilisateur_assignee = ?';
        totalParams.push(userId);
      }
    }

    const [totalResult] = await pool.execute(totalQuery, totalParams);
    const totalDoleances = totalResult[0].total || 1;

    // Récupérer les statistiques par catégorie
    const [stats] = await pool.execute(
      `SELECT c.id_categorie, c.nom_categorie, c.couleur,
              COUNT(d.id_doleance) as count,
              CASE WHEN ? > 0 THEN ROUND(COUNT(d.id_doleance) * 100.0 / ?, 2) ELSE 0 END as percentage
       FROM categories_doleance c
       LEFT JOIN doleances d ON c.id_categorie = d.id_categorie ${dateCondition} ${directionFilter}
       WHERE c.actif = 1
       GROUP BY c.id_categorie
       ORDER BY count DESC`,
      [totalDoleances, totalDoleances]
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
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur') {
      if (userDirectionId) {
        directionFilter = ' AND do.id_direction = ?';
        params.push(userDirectionId);
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    const [stats] = await pool.execute(
      `SELECT d.id_direction, d.nom_direction,
              COUNT(do.id_doleance) as count,
              ROUND(COUNT(do.id_doleance) * 100.0 / NULLIF((SELECT COUNT(*) FROM doleances), 0), 2) as percentage
       FROM directions d
       LEFT JOIN doleances do ON d.id_direction = do.id_direction ${directionFilter}
       GROUP BY d.id_direction
       ORDER BY count DESC`,
      params
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
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        directionFilter = ' AND d.id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND d.id_utilisateur_assignee = ?';
        params.push(userId);
      }
    }

    const [stats] = await pool.execute(
      `SELECT s.id_statut, s.nom_statut, s.couleur,
              COUNT(d.id_doleance) as count,
              ROUND(COUNT(d.id_doleance) * 100.0 / NULLIF((SELECT COUNT(*) FROM doleances), 0), 2) as percentage
       FROM statuts s
       LEFT JOIN doleances d ON s.id_statut = d.id_statut ${directionFilter}
       GROUP BY s.id_statut
       ORDER BY s.ordre`,
      params
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
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        directionFilter = ' AND d.id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND d.id_utilisateur_assignee = ?';
        params.push(userId);
      }
    }

    const [stats] = await pool.execute(
      `SELECT p.id_priorite, p.nom_priorite, p.niveau, p.couleur,
              COUNT(d.id_doleance) as count,
              AVG(TIMESTAMPDIFF(HOUR, d.date_creation, COALESCE(d.date_resolution, NOW()))) as delai_moyen_heures
       FROM priorites p
       LEFT JOIN doleances d ON p.id_priorite = d.id_priorite ${directionFilter}
       GROUP BY p.id_priorite
       ORDER BY p.niveau`,
      params
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
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        directionFilter = ' AND id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND id_utilisateur_assignee = ?';
        params.push(userId);
      }
    }

    let groupBy = '';
    let intervalUnit = '';

    if (periode === 'day') {
      groupBy = 'DATE(date_creation)';
      intervalUnit = 'DAY';
    } else if (periode === 'week') {
      groupBy = 'DATE_FORMAT(date_creation, "%Y-%u")';
      intervalUnit = 'WEEK';
    } else {
      groupBy = 'DATE_FORMAT(date_creation, "%Y-%m")';
      intervalUnit = 'MONTH';
    }

    params.unshift(parseInt(nb));

    const [stats] = await pool.execute(
      `SELECT ${groupBy} as periode,
              COUNT(*) as total,
              SUM(CASE WHEN id_statut IN (5,6) THEN 1 ELSE 0 END) as resolues,
              SUM(CASE WHEN id_priorite = 4 THEN 1 ELSE 0 END) as urgentes
       FROM doleances
       WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? ${intervalUnit}) ${directionFilter}
       GROUP BY periode
       ORDER BY periode ASC`,
      params
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

// Statistiques pour l'évolution (alias)
const getEvolutionStats = async (req, res) => {
  return getEvolutionTemporelle(req, res);
};

// Statistiques par catégorie (alias)
const getCategoriesStats = async (req, res) => {
  return getStatsByCategorie(req, res);
};

// Temps de traitement moyen
const getTempsTraitementMoyen = async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        directionFilter = ' AND id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND id_utilisateur_assignee = ?';
        params.push(userId);
      }
    }

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
       WHERE id_statut IN (5,6) ${directionFilter}`,
      params
    );

    res.json({ success: true, data: stats[0] || {
      moyen_heures: 0, min_heures: 0, max_heures: 0,
      basse_heures: 0, moyenne_heures: 0, haute_heures: 0, urgente_heures: 0
    } });
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
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur') {
      if (userDirectionId) {
        directionFilter = ' AND d.id_direction = ?';
        params.push(userDirectionId);
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    let dateCondition = '';
    if (periode === 'week') {
      dateCondition = 'AND d.date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (periode === 'month') {
      dateCondition = 'AND d.date_creation >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (periode === 'year') {
      dateCondition = 'AND d.date_creation >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
    }

    const [stats] = await pool.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom,
              COUNT(d.id_doleance) as doleances_traitees,
              COUNT(CASE WHEN d.id_statut IN (5,6) THEN 1 END) as doleances_resolues
       FROM utilisateurs u
        JOIN doleances d ON u.id_utilisateur = d.id_utilisateur_assignee
       WHERE u.actif = 1 ${dateCondition} ${directionFilter}
       GROUP BY u.id_utilisateur
       HAVING doleances_traitees > 0
       ORDER BY doleances_resolues DESC
       LIMIT 10`,
      params
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
      `SELECT q.id_quartier, q.nom_quartier,
              COUNT(d.id_doleance) as count
       FROM quartiers q
       LEFT JOIN doleances d ON q.id_quartier = d.id_quartier
       GROUP BY q.id_quartier
       ORDER BY count DESC
       LIMIT 20`,
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
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur' && userRole !== 'agent_central') {
      if (userDirectionId) {
        directionFilter = ' AND id_direction = ?';
        params.push(userDirectionId);
      } else {
        directionFilter = ' AND id_utilisateur_assignee = ?';
        params.push(userId);
      }
    }

    const [stats] = await pool.execute(
      `SELECT
        COUNT(*) as total_avis,
        ROUND(AVG(satisfaction_note), 2) as note_moyenne,
        SUM(CASE WHEN satisfaction_note >= 4 THEN 1 ELSE 0 END) as satisfaits,
        SUM(CASE WHEN satisfaction_note <= 2 THEN 1 ELSE 0 END) as insatisfaits,
        ROUND(SUM(CASE WHEN satisfaction_note >= 4 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as taux_satisfaction
       FROM doleances
       WHERE satisfaction_note IS NOT NULL ${directionFilter}`,
      params
    );

    const result = stats[0] || { total_avis: 0, note_moyenne: 0, satisfaits: 0, insatisfaits: 0, taux_satisfaction: 0 };
    res.json({ success: true, data: result });
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
    const userId = req.user.id_utilisateur;
    const userRole = req.user.role_nom || req.user.nom_role;
    const userDirectionId = req.user.id_direction;

    let directionFilter = '';
    let params = [];

    if (userRole !== 'administrateur_systeme' && userRole !== 'administrateur') {
      if (userDirectionId) {
        directionFilter = ' AND id_direction = ?';
        params.push(userDirectionId);
      } else {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
      }
    }

    let dateCondition = '';
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
       WHERE 1=1 ${dateCondition} ${directionFilter}
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
  getEvolutionStats,
  getCategoriesStats,
  getTempsTraitementMoyen,
  getPerformanceAgents,
  getStatsByQuartier,
  getTauxSatisfaction,
  exportStats
};
