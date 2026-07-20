const doleanceModel = require('../models/doleanceModel');
const pieceJointeModel = require('../models/pieceJointeModel');
const { pool } = require('../config/database');

// ========== LISTER LES DOLÉANCES SUPPRIMÉES (CORBEILLE) ==========
const getTrashedDoleances = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, direction, dateFrom, dateTo } = req.query;

    const result = await doleanceModel.listTrashed({
      page, limit, search, direction, dateFrom, dateTo
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
    console.error('Get trashed doleances error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RESTAURER UNE DOLÉANCE ==========
const restoreDoleance = async (req, res) => {
  try {
    const { id } = req.params;

    const doleance = await doleanceModel.findByIdIncludeTrashed(id);
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    if (!doleance[0].supprime) {
      return res.status(400).json({ success: false, message: 'Cette doléance n\'est pas dans la corbeille' });
    }

    await doleanceModel.restore(id);

    res.json({
      success: true,
      message: `Doléance ${doleance[0].reference} restaurée avec succès`
    });
  } catch (error) {
    console.error('Restore doleance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SUPPRIMER DÉFINITIVEMENT UNE DOLÉANCE ==========
const permanentDeleteDoleance = async (req, res) => {
  try {
    const { id } = req.params;

    const doleance = await doleanceModel.findByIdIncludeTrashed(id);
    if (doleance.length === 0) {
      return res.status(404).json({ success: false, message: 'Doléance non trouvée' });
    }

    if (!doleance[0].supprime) {
      return res.status(400).json({ success: false, message: 'Cette doléance n\'est pas dans la corbeille. Supprimez-la d\'abord.' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await pieceJointeModel.deleteByDoleanceId(id);
      await connection.execute('DELETE FROM reponses WHERE id_doleance = ?', [id]);
      await connection.execute('DELETE FROM historique_statuts WHERE id_doleance = ?', [id]);
      await connection.execute('DELETE FROM transferts WHERE id_doleance = ?', [id]);
      await connection.execute('DELETE FROM doleances WHERE id_doleance = ?', [id]);

      await connection.commit();

      res.json({
        success: true,
        message: `Doléance ${doleance[0].reference} supprimée définitivement`
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Permanent delete doleance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== VIDER TOUTE LA CORBEILLE ==========
const emptyTrash = async (req, res) => {
  try {
    const { ids } = req.body;

    let deletedCount;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      deletedCount = await doleanceModel.emptyTrashSelected(ids);
    } else {
      deletedCount = await doleanceModel.emptyTrash();
    }

    res.json({
      success: true,
      message: `${deletedCount} doléance(s) supprimée(s) définitivement`
    });
  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== NOMBRE D'ÉLÉMENTS DANS LA CORBEILLE ==========
const getTrashCount = async (req, res) => {
  try {
    const total = await doleanceModel.countTrashed();
    res.json({ success: true, data: { total } });
  } catch (error) {
    console.error('Get trash count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTrashedDoleances,
  restoreDoleance,
  permanentDeleteDoleance,
  emptyTrash,
  getTrashCount
};
