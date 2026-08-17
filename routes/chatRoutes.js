const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { pool } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');
const citoyenCallService = require('../services/citoyenCallService');

const router = express.Router();

// ==================== MESSAGES SYSTÈME D'APPEL ====================
function formatDuration(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Insère un message système d'appel pour chaque participant (visible dans la conversation, comme Messenger)
async function addCallEvent(io, call, texts) {
  const rows = [];
  for (const viewerId of Object.keys(texts)) {
    const otherId = String(viewerId) === String(call.caller_id) ? call.callee_id : call.caller_id;
    const [res] = await pool.execute(
      'INSERT INTO chat_messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, 1)',
      [viewerId, otherId, JSON.stringify({ t: 'call', d: texts[viewerId] })]
    );
    const [m] = await pool.execute('SELECT * FROM chat_messages WHERE id = ?', [res.insertId]);
    if (m[0]) {
      rows.push(m[0]);
      if (io) io.to(`user_${viewerId}`).emit('new-message', m[0]);
    }
  }
  return rows;
}

// ==================== MULTER CONFIG ====================
const chatUploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.rar',
];

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${ext}`));
    }
  },
});

// ==================== CONTACTS ====================
router.get('/contacts', protect, async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;

    const [contacts] = await pool.execute(`
      SELECT 
        u.id_utilisateur, u.nom, u.prenom, u.email,
        CASE 
          WHEN u.derniere_connexion >= DATE_SUB(NOW(), INTERVAL 2 MINUTE) THEN 'online'
          ELSE 'offline'
        END AS live_status,
        COALESCE(unread.cnt, 0) AS unread_count,
        last_msg.message AS last_message,
        last_msg.created_at AS last_message_time,
        last_msg.sender_id AS last_message_sender
      FROM utilisateurs u
      LEFT JOIN (
        SELECT sender_id, COUNT(*) AS cnt
        FROM chat_messages
        WHERE receiver_id = ? AND is_read = 0
        GROUP BY sender_id
      ) unread ON unread.sender_id = u.id_utilisateur
      LEFT JOIN chat_messages last_msg
        ON last_msg.id = (
          SELECT lm.id
          FROM chat_messages lm
          WHERE (lm.sender_id = ? AND lm.receiver_id = u.id_utilisateur)
             OR (lm.sender_id = u.id_utilisateur AND lm.receiver_id = ?)
          ORDER BY lm.created_at DESC, lm.id DESC
          LIMIT 1
        )
      WHERE u.id_utilisateur != ? AND u.actif = 1
      ORDER BY 
        COALESCE(unread.cnt, 0) DESC,
        last_msg.created_at DESC,
        u.nom ASC
    `, [userId, userId, userId, userId]);

    return res.json({ success: true, contacts });
  } catch (error) {
    console.error('Erreur GET /chat/contacts:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ENVOYER UN MESSAGE ====================
router.post('/messages/send', protect, chatUpload.single('attachment'), async (req, res) => {
  try {
    const senderId = req.user.id_utilisateur;
    const { receiver_id, message } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ success: false, message: 'receiver_id requis' });
    }

    const trimmedMsg = message ? message.trim().slice(0, 2000) : null;

    if (!trimmedMsg && !req.file) {
      return res.status(400).json({ success: false, message: 'Message ou pièce jointe requis' });
    }

    // Vérifier que le destinataire existe
    const [destUser] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE id_utilisateur = ? AND actif = 1',
      [receiver_id]
    );
    if (destUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Destinataire non trouvé' });
    }

    let attachmentPath = null, attachmentName = null, attachmentType = null, attachmentSize = null;

    if (req.file) {
      attachmentPath = req.file.filename;
      attachmentName = req.file.originalname;
      attachmentType = req.file.mimetype;
      attachmentSize = req.file.size;
    }

    const [result] = await pool.execute(
      `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment_path, attachment_name, attachment_type, attachment_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [senderId, receiver_id, trimmedMsg, attachmentPath, attachmentName, attachmentType, attachmentSize]
    );

    const insertId = result.insertId;

    const [rows] = await pool.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [insertId]
    );

    const newMessage = rows[0];

    // Mettre à jour la dernière connexion
    await pool.execute(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id_utilisateur = ?',
      [senderId]
    );

    // Émettre via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiver_id}`).emit('new-message', {
        ...newMessage,
        sender_name: `${req.user.prenom || ''} ${req.user.nom || ''}`.trim(),
      });
    }

    return res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Erreur POST /chat/messages/send:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== RÉCUPÉRER LES MESSAGES ====================
router.get('/messages/:withUserId', protect, async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const otherUserId = parseInt(req.params.withUserId);
    const sinceId = parseInt(req.query.since_id) || 0;

    if (isNaN(otherUserId)) {
      return res.status(400).json({ success: false, message: 'ID utilisateur invalide' });
    }

    let sql, params;

    if (sinceId > 0) {
      sql = `SELECT * FROM chat_messages 
             WHERE id > ? AND 
               ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
             ORDER BY id ASC`;
      params = [sinceId, userId, otherUserId, otherUserId, userId];
    } else {
      sql = `SELECT * FROM chat_messages 
             WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
             ORDER BY id DESC LIMIT 100`;
      params = [userId, otherUserId, otherUserId, userId];
    }

    const [messages] = await pool.execute(sql, params);

    // Si pas de since_id, on inverse pour avoir l'ordre chronologique
    if (sinceId === 0) {
      messages.reverse();
    }

    // Marquer comme lu les messages reçus
    if (sinceId === 0) {
      await pool.execute(
        `UPDATE chat_messages SET is_read = 1 
         WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
        [otherUserId, userId]
      );
    }

    return res.json({ success: true, messages });
  } catch (error) {
    console.error('Erreur GET /chat/messages/:withUserId:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== MARQUER COMME LU ====================
router.post('/messages/mark-read/:senderId', protect, async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const senderId = parseInt(req.params.senderId);

    await pool.execute(
      'UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
      [senderId, userId]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur POST /chat/messages/mark-read:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== LANCER UN APPEL ====================
router.post('/calls/start', protect, async (req, res) => {
  try {
    const callerId = req.user.id_utilisateur;
    const { callee_id, call_type } = req.body;

    if (!callee_id || !['audio', 'video'].includes(call_type)) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' });
    }

    // Vérifier que le destinataire existe
    const [destUser] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE id_utilisateur = ? AND actif = 1',
      [callee_id]
    );
    if (destUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Nettoyer les anciens appels ringing
    await pool.execute(
      `UPDATE chat_calls SET status = 'missed', ended_at = NOW() 
       WHERE caller_id = ? AND callee_id = ? AND status = 'ringing'`,
      [callerId, callee_id]
    );

    const [result] = await pool.execute(
      `INSERT INTO chat_calls (caller_id, callee_id, call_type, status)
       VALUES (?, ?, ?, 'ringing')`,
      [callerId, callee_id, call_type]
    );

    const [rows] = await pool.execute('SELECT * FROM chat_calls WHERE id = ?', [result.insertId]);
    const call = rows[0];

    // Émettre via Socket.IO pour notifier l'appel entrant
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${callee_id}`).emit('call-invite', {
        callId: call.id,
        callerId,
        callerName: `${req.user.prenom || ''} ${req.user.nom || ''}`.trim(),
        callType: call_type,
      });
    }

    return res.json({ success: true, call });
  } catch (error) {
    console.error('Erreur POST /chat/calls/start:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ACTIONS D'APPEL ====================
router.post('/calls/action', protect, async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const { call_id, action } = req.body;

    if (!call_id || !['accept', 'reject', 'end', 'fail', 'miss'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' });
    }

    const [calls] = await pool.execute('SELECT * FROM chat_calls WHERE id = ?', [call_id]);
    if (calls.length === 0) {
      return res.status(404).json({ success: false, message: 'Appel non trouvé' });
    }
    const call = calls[0];

    const io = req.app.get('io');

    if (action === 'accept') {
      await pool.execute(
        "UPDATE chat_calls SET status = 'accepted', started_at = NOW() WHERE id = ? AND callee_id = ? AND status = 'ringing'",
        [call_id, userId]
      );
      if (io) {
        citoyenCallService.emitToParticipant(io, call.caller_id, 'call-accept', { callId: call_id, calleeId: userId }, call_id);
      }
    } else if (action === 'reject') {
      const [upd] = await pool.execute(
        "UPDATE chat_calls SET status = 'rejected', ended_at = NOW() WHERE id = ? AND callee_id = ? AND status = 'ringing'",
        [call_id, userId]
      );
      if (io) {
        citoyenCallService.emitToParticipant(io, call.caller_id, 'call-reject', { callId: call_id, calleeId: userId }, call_id);
      }
      if (upd.affectedRows > 0) {
        await addCallEvent(io, call, {
          [call.caller_id]: '🚫 Appel refusé',
          [call.callee_id]: '🚫 Appel refusé',
        });
      }
    } else if (action === 'end') {
      if (call.status === 'accepted') {
        await pool.execute(
          "UPDATE chat_calls SET status = 'ended', ended_at = NOW() WHERE id = ? AND (caller_id = ? OR callee_id = ?) AND status != 'ended'",
          [call_id, userId, userId]
        );
        const otherUserId = call.caller_id === userId ? call.callee_id : call.caller_id;
        if (io) {
          citoyenCallService.emitToParticipant(io, otherUserId, 'call-end', { callId: call_id, userId }, call_id);
        }
        const startedAt = call.started_at
          ? new Date(String(call.started_at).replace(' ', 'T'))
          : null;
        const durationSec = startedAt && !isNaN(startedAt.getTime())
          ? Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
          : 0;
        const label = durationSec > 0
          ? `📞 Appel terminé — ${formatDuration(durationSec)}`
          : '📞 Appel terminé';
        await addCallEvent(io, call, {
          [call.caller_id]: label,
          [call.callee_id]: label,
        });
      } else if (call.status === 'ringing') {
        const [upd] = await pool.execute(
          "UPDATE chat_calls SET status = 'ended', ended_at = NOW() WHERE id = ? AND (caller_id = ? OR callee_id = ?) AND status = 'ringing'",
          [call_id, userId, userId]
        );
        const otherUserId = call.caller_id === userId ? call.callee_id : call.caller_id;
        if (upd.affectedRows > 0) {
          if (userId === call.caller_id) {
            // L'appelant a raccroché pendant la sonnerie
            if (io) citoyenCallService.emitToParticipant(io, otherUserId, 'call-missed', { callId: call_id, callerId: userId }, call_id);
            await addCallEvent(io, call, {
              [call.caller_id]: '🔕 Appel annulé',
              [call.callee_id]: '📵 Appel manqué',
            });
          } else {
            // L'appelé a raccroché pendant la sonnerie
            if (io) citoyenCallService.emitToParticipant(io, otherUserId, 'call-missed', { callId: call_id, calleeId: userId }, call_id);
            await addCallEvent(io, call, {
              [call.caller_id]: '📵 Appel manqué',
              [call.callee_id]: '🔕 Appel annulé',
            });
          }
        }
      }
    } else if (action === 'fail') {
      const [upd] = await pool.execute(
        "UPDATE chat_calls SET status = 'ended', ended_at = NOW() WHERE id = ? AND status IN ('accepted', 'ringing')",
        [call_id]
      );
      if (upd.affectedRows > 0) {
        const otherUserId = call.caller_id === userId ? call.callee_id : call.caller_id;
        if (io) citoyenCallService.emitToParticipant(io, otherUserId, 'call-failed', { callId: call_id, userId }, call_id);
        await addCallEvent(io, call, {
          [call.caller_id]: '❌ Appel échoué',
          [call.callee_id]: '❌ Appel échoué',
        });
      }
    } else if (action === 'miss') {
      const [upd] = await pool.execute(
        "UPDATE chat_calls SET status = 'missed', ended_at = NOW() WHERE id = ? AND callee_id = ? AND status = 'ringing'",
        [call_id, userId]
      );
      if (upd.affectedRows > 0) {
        if (io) citoyenCallService.emitToParticipant(io, call.caller_id, 'call-missed', { callId: call_id, calleeId: userId }, call_id);
        await addCallEvent(io, call, {
          [call.caller_id]: '📵 Appel manqué',
          [call.callee_id]: '📵 Appel manqué',
        });
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur POST /chat/calls/action:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== STATUT D'APPEL ====================
router.get('/calls/status', protect, async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const callId = req.query.call_id;

    let call = null;

    if (callId) {
      const [rows] = await pool.execute('SELECT * FROM chat_calls WHERE id = ?', [callId]);
      call = rows.length > 0 ? rows[0] : null;
    } else {
      const [rows] = await pool.execute(
        `SELECT * FROM chat_calls 
         WHERE callee_id = ? AND status = 'ringing' 
         AND started_at >= DATE_SUB(NOW(), INTERVAL 45 SECOND)
         ORDER BY started_at DESC LIMIT 1`,
        [userId]
      );
      call = rows.length > 0 ? rows[0] : null;
    }

    return res.json({ success: true, call });
  } catch (error) {
    console.error('Erreur GET /chat/calls/status:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== HISTORIQUE DES APPELS ====================
router.get('/calls/history', protect, async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;

    const [calls] = await pool.execute(
      `SELECT 
         c.id, c.caller_id, c.callee_id, c.call_type, c.status,
         c.started_at, c.ended_at,
         other.id_utilisateur AS other_id,
         other.nom, other.prenom,
         CASE WHEN c.caller_id = ? THEN 'outgoing' ELSE 'incoming' END AS direction,
         TIMESTAMPDIFF(SECOND, c.started_at, c.ended_at) AS duration_seconds
       FROM chat_calls c
       JOIN utilisateurs other
         ON other.id_utilisateur = IF(c.caller_id = ?, c.callee_id, c.caller_id)
       WHERE c.caller_id = ? OR c.callee_id = ?
       ORDER BY c.started_at DESC
       LIMIT 100`,
      [userId, userId, userId, userId]
    );

    return res.json({ success: true, calls });
  } catch (error) {
    console.error('Erreur GET /chat/calls/history:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ENVOYER UN SIGNAL WEBRTC ====================
router.post('/signals', protect, async (req, res) => {
  try {
    const senderId = req.user.id_utilisateur;
    const { call_id, receiver_id, signal_type, signal_data } = req.body;

    if (!call_id || !receiver_id || !signal_type) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' });
    }

    const dataStr = typeof signal_data === 'object' ? JSON.stringify(signal_data) : signal_data;

    const [result] = await pool.execute(
      `INSERT INTO chat_signals (call_id, sender_id, receiver_id, signal_type, signal_data)
       VALUES (?, ?, ?, ?, ?)`,
      [call_id, senderId, receiver_id, signal_type, dataStr]
    );

    const [rows] = await pool.execute('SELECT * FROM chat_signals WHERE id = ?', [result.insertId]);

    return res.json({ success: true, signal: rows[0] });
  } catch (error) {
    console.error('Erreur POST /chat/signals:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== RÉCUPÉRER LES SIGNALS ====================
router.get('/signals', protect, async (req, res) => {
  try {
    const userId = req.user.id_utilisateur;
    const { call_id, since_id } = req.query;
    const sinceId = parseInt(since_id) || 0;

    if (!call_id) {
      return res.status(400).json({ success: false, message: 'call_id requis' });
    }

    const [signals] = await pool.execute(
      `SELECT * FROM chat_signals 
       WHERE call_id = ? AND receiver_id = ? AND id > ?
       ORDER BY id ASC`,
      [call_id, userId, sinceId]
    );

    return res.json({ success: true, signals });
  } catch (error) {
    console.error('Erreur GET /chat/signals:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ADMIN : LISTE DES APPELS ====================
router.get('/calls/admin', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, call_type, date_from, date_to, search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let where = [];
    let params = [];

    if (status && ['ringing', 'accepted', 'rejected', 'ended', 'missed'].includes(status)) {
      where.push('c.status = ?');
      params.push(status);
    }
    if (call_type && ['audio', 'video'].includes(call_type)) {
      where.push('c.call_type = ?');
      params.push(call_type);
    }
    if (date_from) {
      where.push('c.started_at >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('c.started_at <= ?');
      params.push(date_to + ' 23:59:59');
    }
    if (search && search.trim()) {
      where.push('(caller.nom LIKE ? OR caller.prenom LIKE ? OR callee.nom LIKE ? OR callee.prenom LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countParams = [...params];
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM chat_calls c
       LEFT JOIN utilisateurs caller ON caller.id_utilisateur = c.caller_id
       LEFT JOIN utilisateurs callee ON callee.id_utilisateur = c.callee_id
       ${whereClause}`,
      countParams
    );
    const total = countResult[0].total;
    const pages = Math.ceil(total / limitNum);

    const dataParams = [...params, String(limitNum), String(offset)];
    const [calls] = await pool.execute(
      `SELECT 
         c.id, c.caller_id, c.callee_id, c.call_type, c.status,
         c.started_at, c.ended_at,
         CASE WHEN c.caller_id = 999999 THEN 'Citoyen'
              ELSE CONCAT(caller.prenom, ' ', caller.nom)
         END AS caller_name,
         CONCAT(callee.prenom, ' ', callee.nom) AS callee_name,
         c.caller_id = 999999 AS is_citizen_call,
         TIMESTAMPDIFF(SECOND, c.started_at, c.ended_at) AS duration_seconds
       FROM chat_calls c
       LEFT JOIN utilisateurs caller ON caller.id_utilisateur = c.caller_id
       LEFT JOIN utilisateurs callee ON callee.id_utilisateur = c.callee_id
       ${whereClause}
       ORDER BY c.started_at DESC
       LIMIT ? OFFSET ?`,
      dataParams
    );

    return res.json({ success: true, data: calls, pagination: { page: pageNum, limit: limitNum, total, pages } });
  } catch (error) {
    console.error('Erreur GET /chat/calls/admin:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ADMIN : STATISTIQUES DES APPELS ====================
router.get('/calls/admin/stats', protect, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let where = [];
    let params = [];

    if (date_from) {
      where.push('started_at >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('started_at <= ?');
      params.push(date_to + ' 23:59:59');
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [totals] = await pool.execute(
      `SELECT 
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
         SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) AS missed,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
         SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) AS ended,
         SUM(CASE WHEN status = 'ringing' THEN 1 ELSE 0 END) AS ringing,
         SUM(CASE WHEN caller_id = 999999 THEN 1 ELSE 0 END) AS citizen_calls,
         SUM(CASE WHEN caller_id != 999999 THEN 1 ELSE 0 END) AS agent_calls,
         ROUND(AVG(CASE WHEN ended_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, ended_at) END), 0) AS avg_duration
       FROM chat_calls ${whereClause}`,
      params
    );

    const [byDay] = await pool.execute(
      `SELECT 
         DATE(started_at) AS date,
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
         SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) AS missed,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
         SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) AS ended
       FROM chat_calls ${whereClause}
       GROUP BY DATE(started_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    const [byHour] = await pool.execute(
      `SELECT 
         HOUR(started_at) AS hour,
         COUNT(*) AS total
       FROM chat_calls ${whereClause}
       GROUP BY HOUR(started_at)
       ORDER BY hour ASC`,
      params
    );

    return res.json({
      success: true,
      totals: totals[0] || {},
      byDay: byDay.reverse(),
      byHour,
    });
  } catch (error) {
    console.error('Erreur GET /chat/calls/admin/stats:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ADMIN : DÉTAILS D'UN APPEL ====================
router.get('/calls/admin/:id', protect, async (req, res) => {
  try {
    const callId = req.params.id;

    const [calls] = await pool.execute(
      `SELECT 
         c.id, c.caller_id, c.callee_id, c.call_type, c.status,
         c.started_at, c.ended_at,
         CASE WHEN c.caller_id = 999999 THEN 'Citoyen'
              ELSE CONCAT(caller.prenom, ' ', caller.nom)
         END AS caller_name,
         CONCAT(callee.prenom, ' ', callee.nom) AS callee_name,
         CASE WHEN c.caller_id = 999999 THEN NULL ELSE caller.email END AS caller_email,
         callee.email AS callee_email,
         c.caller_id = 999999 AS is_citizen_call,
         TIMESTAMPDIFF(SECOND, c.started_at, c.ended_at) AS duration_seconds
       FROM chat_calls c
       LEFT JOIN utilisateurs caller ON caller.id_utilisateur = c.caller_id
       LEFT JOIN utilisateurs callee ON callee.id_utilisateur = c.callee_id
       WHERE c.id = ?`,
      [callId]
    );

    if (calls.length === 0) {
      return res.status(404).json({ success: false, message: 'Appel non trouvé' });
    }

    return res.json({ success: true, call: calls[0] });
  } catch (error) {
    console.error('Erreur GET /chat/calls/admin/:id:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
