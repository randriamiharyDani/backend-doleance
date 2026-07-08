// controllers/transfertController.js
const { pool } = require('../config/database');
const doleanceModel = require('../models/doleanceModel');
const directionModel = require('../models/directionModel');
const serviceModel = require('../models/serviceModel');
const historiqueModel = require('../models/historiqueModel');

// Récupérer les doléances à transférer
const getDoleancesATransferer = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        d.id_doleance,
        d.reference,
        d.titre,
        d.description,
        d.date_creation,
        c.nom_categorie,
        s.nom_statut,
        s.couleur as statut_couleur,
        p.nom_priorite,
        p.niveau,
        CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
        ct.telephone as citoyen_telephone,
        ct.email as citoyen_email,
        d.lieu_exact,
        d.suggestions,
        dir_actuelle.nom_direction as direction_actuelle
      FROM doleances d
      LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
      LEFT JOIN statuts s ON d.id_statut = s.id_statut
      LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
      LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
      LEFT JOIN directions dir_actuelle ON d.id_direction = dir_actuelle.id_direction
      WHERE (d.id_direction IS NULL OR d.id_direction = 0)
        AND (s.nom_statut NOT IN ('Clôturée', 'Résolue', 'Refusée') OR s.nom_statut IS NULL)
      ORDER BY p.niveau DESC, d.date_creation ASC
    `);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur getDoleancesATransferer:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
};

// Transférer vers une direction
const transfererVersDirection = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_direction, motif, commentaire } = req.body;

    console.log('🔄 Transfert direction - ID doléance:', id, 'ID direction:', id_direction);

    const doleance = await doleanceModel.findById(id);

    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const directionDest = await directionModel.findById(id_direction);

    if (directionDest.length === 0) {
      return res.status(404).json({ success: false, message: 'Direction de destination non trouvée' });
    }

    const directionSource = doleance[0].id_direction;
    const reference = doleance[0].reference;

    let sourceNom = 'Non assignée';
    if (directionSource) {
      const sourceDir = await directionModel.findById(directionSource);
      if (sourceDir.length > 0) sourceNom = sourceDir[0].nom_direction;
    }

    await pool.execute(
      'UPDATE doleances SET id_direction = ? WHERE id_doleance = ?',
      [id_direction, id]
    );

    const historiqueMessage = `Doléance transférée de "${sourceNom}" vers "${directionDest[0].nom_direction}" - Motif: ${motif || 'Transfert par agent central'}${commentaire ? ' - Commentaire: ' + commentaire : ''}`;

    await historiqueModel.createSimple(id, historiqueMessage);

    console.log('✅ Doléance transférée avec succès');
    
    res.json({ 
      success: true, 
      message: `Doléance ${reference} transférée avec succès vers ${directionDest[0].nom_direction}`,
      data: { id_direction, nom_direction: directionDest[0].nom_direction }
    });
    
  } catch (error) {
    console.error('Erreur transfererVersDirection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du transfert: ' + error.message 
    });
  }
};

// Transférer vers un service
const transfererVersService = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_service, motif, commentaire } = req.body;

    console.log('🔄 Transfert service - ID doléance:', id, 'ID service:', id_service);

    const doleance = await doleanceModel.findById(id);

    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    const service = await serviceModel.findById(id_service);

    if (service.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }

    await pool.execute(
      `UPDATE doleances 
       SET id_service = ?, id_direction = ?
       WHERE id_doleance = ?`,
      [id_service, service[0].id_direction, id]
    );

    const historiqueMessage = `Doléance transférée vers le service: ${service[0].nom_service} (${service[0].direction_nom}) - Motif: ${motif || 'Transfert par agent central'}${commentaire ? ' - Commentaire: ' + commentaire : ''}`;

    await historiqueModel.createSimple(id, historiqueMessage);

    console.log('✅ Doléance transférée vers service avec succès');
    
    res.json({ 
      success: true, 
      message: `Doléance ${doleance[0].reference} transférée vers le service ${service[0].nom_service}`,
      data: { id_service, nom_service: service[0].nom_service }
    });
    
  } catch (error) {
    console.error('Erreur transfererVersService:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du transfert: ' + error.message 
    });
  }
};

// Récupérer l'historique des transferts
const getHistoriqueTransferts = async (req, res) => {
  try {
    const { id_doleance, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        h.id_historique,
        h.id_doleance,
        d.reference,
        d.titre,
        h.commentaire as description,
        h.date_changement as date_transfert,
        'transfert' as action
      FROM historique_statuts h
      JOIN doleances d ON h.id_doleance = d.id_doleance
      WHERE h.commentaire LIKE '%transférée%'
    `;
    
    const params = [];
    
    if (id_doleance) {
      query += ' AND h.id_doleance = ?';
      params.push(id_doleance);
    }
    
    query += ' ORDER BY h.date_changement DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM historique_statuts WHERE commentaire LIKE "%transférée%"' + (id_doleance ? ' AND id_doleance = ?' : ''),
      id_doleance ? [id_doleance] : []
    );
    
    res.json({ 
      success: true, 
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0]?.total || 0,
        pages: Math.ceil((countResult[0]?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getHistoriqueTransferts:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
};

// Annuler un transfert
const annulerTransfert = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif_annulation } = req.body;
    
    const [transfert] = await pool.execute(
      `SELECT h.*, d.reference, d.id_direction 
       FROM historique_statuts h
       JOIN doleances d ON h.id_doleance = d.id_doleance
       WHERE h.id_historique = ? AND h.commentaire LIKE '%transférée%'`,
      [id]
    );
    
    if (transfert.length === 0) {
      return res.status(404).json({ success: false, message: 'Transfert non trouvé' });
    }
    
    await historiqueModel.createSimple(
      transfert[0].id_doleance,
      `Transfert annulé - Motif: ${motif_annulation || 'Annulation par agent central'}`
    );
    
    res.json({ 
      success: true, 
      message: `Transfert de la doléance ${transfert[0].reference} annulé avec succès` 
    });
    
  } catch (error) {
    console.error('Erreur annulerTransfert:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation: ' + error.message });
  }
};

// Statistiques des transferts
const getStatsTransferts = async (req, res) => {
  try {
    const [total] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM historique_statuts 
      WHERE commentaire LIKE '%transférée%'
    `);
    
    const [parMois] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date_changement, '%Y-%m') as mois,
        COUNT(*) as nombre
      FROM historique_statuts
      WHERE commentaire LIKE '%transférée%'
      GROUP BY DATE_FORMAT(date_changement, '%Y-%m')
      ORDER BY mois DESC
      LIMIT 12
    `);
    
    res.json({ 
      success: true, 
      data: {
        total: total[0]?.total || 0,
        par_mois: parMois
      }
    });
  } catch (error) {
    console.error('Erreur getStatsTransferts:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
};

module.exports = {
  getDoleancesATransferer,
  transfererVersDirection,
  transfererVersService,
  getHistoriqueTransferts,
  annulerTransfert,
  getStatsTransferts
};
