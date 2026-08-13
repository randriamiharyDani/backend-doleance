const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { pool } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

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

    if (!call_id || !['accept', 'reject', 'end'].includes(action)) {
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
        "UPDATE chat_calls SET status = 'accepted' WHERE id = ? AND callee_id = ? AND status = 'ringing'",
        [call_id, userId]
      );
      if (io) {
        io.to(`user_${call.caller_id}`).emit('call-accept', { callId: call_id, calleeId: userId });
      }
    } else if (action === 'reject') {
      await pool.execute(
        "UPDATE chat_calls SET status = 'rejected', ended_at = NOW() WHERE id = ? AND callee_id = ?",
        [call_id, userId]
      );
      if (io) {
        io.to(`user_${call.caller_id}`).emit('call-reject', { callId: call_id, calleeId: userId });
      }
    } else if (action === 'end') {
      await pool.execute(
        "UPDATE chat_calls SET status = 'ended', ended_at = NOW() WHERE id = ? AND (caller_id = ? OR callee_id = ?) AND status != 'ended'",
        [call_id, userId, userId]
      );
      const otherUserId = call.caller_id === userId ? call.callee_id : call.caller_id;
      if (io) {
        io.to(`user_${otherUserId}`).emit('call-end', { callId: call_id, userId });
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

module.exports = router;
