// controllers/transfertController.js
const { pool } = require('../config/database');

// ========== RÉCUPÉRER LES DOLÉANCES À TRANSFÉRER ==========
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
        AND s.nom_statut NOT IN ('Clôturée', 'Résolue', 'Refusée')
      ORDER BY p.niveau DESC, d.date_creation ASC
    `);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ========== TRANSFÉRER VERS UNE DIRECTION ==========
const transfererVersDirection = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { id_direction, motif, commentaire } = req.body;
    const userId = req.user.id_utilisateur;
    
    await connection.beginTransaction();
    
    // 1. Vérifier la doléance
    const [doleance] = await connection.execute(
      `SELECT d.*, s.nom_statut, dir.nom_direction as direction_actuelle
       FROM doleances d
       LEFT JOIN statuts s ON d.id_statut = s.id_statut
       LEFT JOIN directions dir ON d.id_direction = dir.id_direction
       WHERE d.id_doleance = ?`,
      [id]
    );
    
    if (doleance.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }
    
    // 2. Vérifier la direction destination
    const [directionDest] = await connection.execute(
      'SELECT * FROM directions WHERE id_direction = ? AND actif = 1',
      [id_direction]
    );
    
    if (directionDest.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Direction non trouvée' });
    }
    
    // 3. Mettre à jour la doléance
    await connection.execute(
      `UPDATE doleances 
       SET id_direction = ?, 
           date_mise_a_jour = NOW(),
           id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'En attente')
       WHERE id_doleance = ?`,
      [id_direction, id]
    );
    
    // 4. Enregistrer le transfert
    const [transfertResult] = await connection.execute(
      `INSERT INTO transferts 
       (id_doleance, id_direction_source, id_direction_destination, motif, commentaire, id_utilisateur, date_transfert)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, doleance[0].id_direction || null, id_direction, motif || 'Transfert par agent central', commentaire || null, userId]
    );
    
    // 5. Ajouter dans l'historique
    await connection.execute(
      `INSERT INTO historique_statuts (id_doleance, commentaire, date_changement) 
       VALUES (?, ?, NOW())`,
      [id, `Transfert vers ${directionDest[0].nom_direction} - Motif: ${motif || 'Transfert'}`]
    );
    
    // 6. Créer une notification pour la direction
    await connection.execute(
      `INSERT INTO notifications_transfert 
       (id_transfert, id_destinataire, message, date_creation)
       VALUES (?, ?, ?, NOW())`,
      [transfertResult.insertId, directionDest[0].responsable_id || 1, 
       `Nouvelle doléance "${doleance[0].reference}" transférée à votre direction`]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: `Doléance ${doleance[0].reference} transférée avec succès vers ${directionDest[0].nom_direction}`,
      data: { transfert_id: transfertResult.insertId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du transfert' });
  } finally {
    connection.release();
  }
};

// ========== TRANSFÉRER VERS UN SERVICE SPÉCIFIQUE ==========
const transfererVersService = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { id_service, motif, commentaire } = req.body;
    const userId = req.user.id_utilisateur;
    
    await connection.beginTransaction();
    
    // 1. Vérifier la doléance
    const [doleance] = await connection.execute(
      'SELECT * FROM doleances WHERE id_doleance = ?',
      [id]
    );
    
    if (doleance.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }
    
    // 2. Vérifier le service
    const [service] = await connection.execute(
      `SELECT s.*, d.nom_direction, d.id_direction 
       FROM services s
       JOIN directions d ON s.id_direction = d.id_direction
       WHERE s.id_service = ? AND s.actif = 1`,
      [id_service]
    );
    
    if (service.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    
    // 3. Mettre à jour la doléance
    await connection.execute(
      `UPDATE doleances 
       SET id_service = ?, 
           id_direction = ?,
           date_mise_a_jour = NOW(),
           id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'En attente')
       WHERE id_doleance = ?`,
      [id_service, service[0].id_direction, id]
    );
    
    // 4. Enregistrer le transfert
    const [transfertResult] = await connection.execute(
      `INSERT INTO transferts 
       (id_doleance, id_direction_destination, id_service_destination, motif, commentaire, id_utilisateur, date_transfert)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, service[0].id_direction, id_service, motif || 'Transfert vers service', commentaire || null, userId]
    );
    
    // 5. Ajouter dans l'historique
    await connection.execute(
      `INSERT INTO historique_statuts (id_doleance, commentaire, date_changement) 
       VALUES (?, ?, NOW())`,
      [id, `Transfert vers le service: ${service[0].nom_service} (${service[0].nom_direction})`]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: `Doléance ${doleance[0].reference} transférée vers le service ${service[0].nom_service}`,
      data: { transfert_id: transfertResult.insertId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du transfert' });
  } finally {
    connection.release();
  }
};

// ========== RÉCUPÉRER L'HISTORIQUE DES TRANSFERTS ==========
const getHistoriqueTransferts = async (req, res) => {
  try {
    const { id_doleance, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        t.id_transfert,
        t.id_doleance,
        d.reference,
        d.titre,
        t.id_direction_source,
        ds.nom_direction as direction_source_nom,
        t.id_direction_destination,
        dd.nom_direction as direction_destination_nom,
        t.id_service_destination,
        s.nom_service as service_destination_nom,
        t.motif,
        t.commentaire,
        t.date_transfert,
        t.statut as transfert_statut,
        CONCAT(u.nom, ' ', u.prenom) as agent_nom,
        u.role as agent_role
      FROM transferts t
      JOIN doleances d ON t.id_doleance = d.id_doleance
      LEFT JOIN directions ds ON t.id_direction_source = ds.id_direction
      LEFT JOIN directions dd ON t.id_direction_destination = dd.id_direction
      LEFT JOIN services s ON t.id_service_destination = s.id_service
      LEFT JOIN utilisateurs u ON t.id_utilisateur = u.id_utilisateur
      WHERE 1=1
    `;
    
    const params = [];
    
    if (id_doleance) {
      query += ' AND t.id_doleance = ?';
      params.push(id_doleance);
    }
    
    query += ' ORDER BY t.date_transfert DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [rows] = await pool.execute(query, params);
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM transferts' + (id_doleance ? ' WHERE id_doleance = ?' : ''),
      id_doleance ? [id_doleance] : []
    );
    
    res.json({ 
      success: true, 
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ========== ANNULER UN TRANSFERT ==========
const annulerTransfert = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { motif_annulation } = req.body;
    const userId = req.user.id_utilisateur;
    
    await connection.beginTransaction();
    
    // Récupérer le transfert
    const [transfert] = await connection.execute(
      `SELECT t.*, d.reference 
       FROM transferts t
       JOIN doleances d ON t.id_doleance = d.id_doleance
       WHERE t.id_transfert = ?`,
      [id]
    );
    
    if (transfert.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Transfert non trouvé' });
    }
    
    // Restaurer l'ancienne direction
    await connection.execute(
      'UPDATE doleances SET id_direction = ?, id_service = NULL WHERE id_doleance = ?',
      [transfert[0].id_direction_source, transfert[0].id_doleance]
    );
    
    // Mettre à jour le statut du transfert
    await connection.execute(
      'UPDATE transferts SET statut = "annule", date_annulation = NOW() WHERE id_transfert = ?',
      [id]
    );
    
    // Ajouter dans l'historique
    await connection.execute(
      `INSERT INTO historique_statuts (id_doleance, commentaire, date_changement) 
       VALUES (?, ?, NOW())`,
      [transfert[0].id_doleance, `Transfert annulé - Motif: ${motif_annulation || 'Annulation par agent central'}`]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: `Transfert de la doléance ${transfert[0].reference} annulé avec succès` 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation' });
  } finally {
    connection.release();
  }
};

// ========== STATISTIQUES DES TRANSFERTS ==========
const getStatsTransferts = async (req, res) => {
  try {
    // Total des transferts
    const [total] = await pool.execute('SELECT COUNT(*) as total FROM transferts');
    
    // Transferts par direction
    const [parDirection] = await pool.execute(`
      SELECT d.nom_direction, COUNT(*) as nombre
      FROM transferts t
      JOIN directions d ON t.id_direction_destination = d.id_direction
      GROUP BY d.id_direction
      ORDER BY nombre DESC
    `);
    
    // Transferts par mois
    const [parMois] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date_transfert, '%Y-%m') as mois,
        COUNT(*) as nombre
      FROM transferts
      GROUP BY DATE_FORMAT(date_transfert, '%Y-%m')
      ORDER BY mois DESC
      LIMIT 12
    `);
    
    // Délai moyen de transfert
    const [delaiMoyen] = await pool.execute(`
      SELECT AVG(TIMESTAMPDIFF(HOUR, d.date_creation, t.date_transfert)) as heures
      FROM transferts t
      JOIN doleances d ON t.id_doleance = d.id_doleance
    `);
    
    res.json({ 
      success: true, 
      data: {
        total: total[0].total,
        par_direction: parDirection,
        par_mois: parMois,
        delai_moyen_heures: Math.round(delaiMoyen[0]?.heures || 0)
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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