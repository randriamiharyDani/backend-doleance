// middleware/concurrencyMiddleware.js
const { pool } = require('../config/database');

// Vérifier les modifications concurrentes
const checkConcurrentModification = (tableName, idField) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const { version, last_modified } = req.body;
      const userId = req.user.id_utilisateur;
      
      if (!version && !last_modified) {
        return next();
      }
      
      const [current] = await pool.execute(
        `SELECT updated_at, version FROM ${tableName} WHERE ${idField} = ?`,
        [id]
      );
      
      if (current.length === 0) {
        return next();
      }
      
      const currentVersion = current[0].version || 1;
      const currentUpdatedAt = new Date(current[0].updated_at).getTime();
      
      if (version && currentVersion !== version) {
        return res.status(409).json({
          success: false,
          message: 'Conflit de modification. Une autre session a modifié cette ressource.',
          code: 'CONCURRENT_MODIFICATION'
        });
      }
      
      if (last_modified && currentUpdatedAt !== last_modified) {
        return res.status(409).json({
          success: false,
          message: 'Conflit de modification. Veuillez recharger les données.',
          code: 'CONCURRENT_MODIFICATION'
        });
      }
      
      next();
    } catch (error) {
      console.error('Concurrent modification check error:', error);
      next();
    }
  };
};

// Verrouiller une ressource pour modification
const lockResource = (tableName, idField) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id_utilisateur;
      const lockKey = `${tableName}:${id}`;
      
      const [existingLock] = await pool.execute(
        `SELECT * FROM resource_locks 
         WHERE lock_key = ? AND (expires_at > NOW() OR locked_by = ?)`,
        [lockKey, userId]
      );
      
      if (existingLock.length > 0 && existingLock[0].locked_by !== userId) {
        return res.status(423).json({
          success: false,
          message: `Cette ressource est actuellement modifiée par un autre utilisateur. Veuillez réessayer dans quelques instants.`,
          locked_by: existingLock[0].locked_by,
          expires_at: existingLock[0].expires_at
        });
      }
      
      await pool.execute(
        `INSERT INTO resource_locks (lock_key, locked_by, locked_at, expires_at)
         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 SECOND))
         ON DUPLICATE KEY UPDATE
         locked_by = VALUES(locked_by),
         locked_at = VALUES(locked_at),
         expires_at = VALUES(expires_at)`,
        [lockKey, userId]
      );
      
      req.lockKey = lockKey;
      next();
    } catch (error) {
      console.error('Lock resource error:', error);
      next();
    }
  };
};

// Libérer le verrou
const unlockResource = async (lockKey) => {
  if (!lockKey) return;
  try {
    await pool.execute('DELETE FROM resource_locks WHERE lock_key = ?', [lockKey]);
  } catch (error) {
    console.error('Unlock resource error:', error);
  }
};

// Middleware pour libérer le verrou après la réponse
const autoUnlock = () => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (req.lockKey) {
        unlockResource(req.lockKey);
      }
      return originalSend.call(this, data);
    };
    next();
  };
};

module.exports = {
  checkConcurrentModification,
  lockResource,
  autoUnlock,
  unlockResource
};