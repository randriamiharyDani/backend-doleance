// services/citoyenCallService.js
// Appels directs Citoyen -> Agent (sans compte, sans doléance).
// Ce module centralise :
//   - la config de l'agent destinataire (stockée en base : parametres_appel_citoyen)
//   - le suivi des invités (citoyens) connectés en socket sans JWT
//   - l'acheminement des événements d'appel vers un invité ou un agent
const { pool } = require('../config/database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Utilisateur "sentinel" représentant les citoyens appelants (requis par les FK de chat_calls)
const CITOYEN_CALLER_ID = 999999;
const CITOYEN_CALLER_EMAIL = 'citoyen-appel@systeme.local';
const CITOYEN_CALLER_PHONE = 'CITOYEN-APPEL';

// Configuration par défaut (configurable depuis l'espace Admin)
const DEFAULT_AGENT_EMAIL = 'randriamiharysteev@gmail.com';
const DEFAULT_AGENT_DIRECTION = 'Direction CABINET';
const DEFAULT_AGENT_ROLE = 'administrateur_systeme';

// Utilisateurs connectés (Map partagée avec server.js)
const onlineUsers = new Map(); // userId -> Map(socketId -> { userName, userRole, connectedAt })

// Invités (citoyens) connectés en socket sans compte
const guestSockets = new Map(); // guestId -> socket

// Appels citoyens en cours : callId -> guestId
const citizenCallGuests = {};

function isUserOnline(userId) {
  if (!userId) return false;
  const sockets = onlineUsers.get(Number(userId));
  return !!(sockets && sockets.size > 0);
}

function getOnlineUsersSnapshot() {
  const users = [];
  onlineUsers.forEach((sockets, userId) => {
    if (sockets.size > 0) {
      const first = sockets.values().next().value;
      users.push({
        userId,
        userName: first.userName,
        userRole: first.userRole,
        connectedAt: first.connectedAt,
      });
    }
  });
  return users;
}

function registerGuest(socket) {
  guestSockets.set(socket.guestId, socket);
}

function unregisterGuest(socket) {
  guestSockets.delete(socket.guestId);
  for (const callId of Object.keys(citizenCallGuests)) {
    if (citizenCallGuests[callId] === socket.guestId) {
      delete citizenCallGuests[callId];
    }
  }
}

// Acheminement d'un événement vers un participant :
//   - si la cible est le citoyen sentinel -> on envoie à l'invité associé à l'appel
//   - sinon -> salon utilisateur classique (agent, inchangé)
function emitToParticipant(io, targetId, event, payload, callId) {
  if (String(targetId) === String(CITOYEN_CALLER_ID)) {
    const guestId = callId ? citizenCallGuests[callId] : null;
    if (guestId && guestSockets.has(guestId)) {
      io.to(`guest_${guestId}`).emit(event, payload);
    }
    return;
  }
  io.to(`user_${targetId}`).emit(event, payload);
}

// Crée l'utilisateur "sentinel" représentant les citoyens (appel sans compte)
async function ensureCitoyenCaller() {
  try {
    await pool.execute(
      `INSERT IGNORE INTO utilisateurs (id_utilisateur, id_role, nom, prenom, email, password, telephone, actif)
       VALUES (?, 1, 'Citoyen', 'Citoyen', ?, ?, ?, 1)`,
      [
        CITOYEN_CALLER_ID,
        CITOYEN_CALLER_EMAIL,
        await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
        CITOYEN_CALLER_PHONE,
      ]
    );
    console.log(`✅ Utilisateur citoyen sentinel vérifié (id ${CITOYEN_CALLER_ID})`);
  } catch (err) {
    console.warn('⚠️ ensureCitoyenCaller:', err.message);
  }
}

// Lit la configuration de l'agent destinataire depuis la base
async function getConfig() {
  const [rows] = await pool.execute(
    `SELECT * FROM parametres_appel_citoyen WHERE id = 1`
  );
  return rows[0] || null;
}

// Retourne l'agent destinataire configuré (avec direction, rôle et disponibilité)
async function getRecipientAgent() {
  const config = await getConfig();
  if (!config || !config.id_utilisateur) return null;

  const [users] = await pool.execute(
    `SELECT u.id_utilisateur, u.nom, u.prenom, u.email,
            d.nom_direction, r.nom_role
     FROM utilisateurs u
     LEFT JOIN directions d ON d.id_direction = u.id_direction
     LEFT JOIN roles r ON r.id_role = u.id_role
     WHERE u.id_utilisateur = ? AND u.actif = 1`,
    [config.id_utilisateur]
  );

  if (!users[0]) return null;
  const agent = users[0];
  return { ...agent, disponible: isUserOnline(agent.id_utilisateur) };
}

// Liste des agents candidats (pour la configuration Admin)
async function getCandidateAgents() {
  const [users] = await pool.execute(
    `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.actif,
            d.nom_direction, r.nom_role
     FROM utilisateurs u
     LEFT JOIN directions d ON d.id_direction = u.id_direction
     LEFT JOIN roles r ON r.id_role = u.id_role
     WHERE u.actif = 1
       AND r.nom_role IS NOT NULL
       AND r.nom_role NOT IN ('citoyen')
     ORDER BY u.nom ASC, u.prenom ASC`
  );
  return users.map((u) => ({ ...u, disponible: isUserOnline(u.id_utilisateur) }));
}

// Change l'agent destinataire (depuis l'espace Admin)
async function setRecipientAgent(agentId, updatedBy) {
  const [rows] = await pool.execute(
    'SELECT id_utilisateur FROM utilisateurs WHERE id_utilisateur = ? AND actif = 1',
    [agentId]
  );
  if (rows.length === 0) {
    throw new Error('Agent non trouvé ou inactif');
  }

  await pool.execute(
    `UPDATE parametres_appel_citoyen
     SET id_utilisateur = ?, updated_by = ?
     WHERE id = 1`,
    [agentId, updatedBy || null]
  );

  return getRecipientAgent();
}

// Seed de la configuration par défaut (ligne id=1, INSERT IGNORE : n'écrase jamais une config existante)
async function ensureDefaultRecipient() {
  try {
    let agentId = null;

    const [existing] = await pool.execute(
      'SELECT id_utilisateur FROM utilisateurs WHERE email = ?',
      [DEFAULT_AGENT_EMAIL]
    );

    if (existing[0]) {
      agentId = existing[0].id_utilisateur;
    } else {
      // Créer la direction CABINET si absente
      let dirId = null;
      const [dirs] = await pool.execute(
        'SELECT id_direction FROM directions WHERE nom_direction = ?',
        [DEFAULT_AGENT_DIRECTION]
      );
      if (dirs[0]) {
        dirId = dirs[0].id_direction;
      } else {
        const [r] = await pool.execute(
          'INSERT INTO directions (nom_direction, description, actif) VALUES (?, ?, 1)',
          [DEFAULT_AGENT_DIRECTION, 'Direction du Cabinet (destinataire par défaut des appels citoyens)']
        );
        dirId = r.insertId;
      }

      const [roles] = await pool.execute(
        'SELECT id_role FROM roles WHERE nom_role = ?',
        [DEFAULT_AGENT_ROLE]
      );
      const roleId = roles[0]?.id_role || 4;

      const [r] = await pool.execute(
        `INSERT INTO utilisateurs (id_role, id_direction, nom, prenom, email, password, actif)
         VALUES (?, ?, 'Cabinet', 'Agent', ?, ?, 1)`,
        [
          roleId,
          dirId,
          DEFAULT_AGENT_EMAIL,
          await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
        ]
      );
      agentId = r.insertId;
    }

    await pool.execute(
      `INSERT IGNORE INTO parametres_appel_citoyen (id, id_utilisateur, email, direction, role)
       VALUES (1, ?, ?, ?, ?)`,
      [agentId, DEFAULT_AGENT_EMAIL, DEFAULT_AGENT_DIRECTION, DEFAULT_AGENT_ROLE]
    );

    console.log(`✅ Destinataire par défaut des appels citoyens : ${DEFAULT_AGENT_EMAIL} (id ${agentId})`);
  } catch (err) {
    console.warn('⚠️ ensureDefaultRecipient:', err.message);
  }
}

module.exports = {
  CITOYEN_CALLER_ID,
  CITOYEN_CALLER_EMAIL,
  DEFAULT_AGENT_EMAIL,
  DEFAULT_AGENT_DIRECTION,
  DEFAULT_AGENT_ROLE,
  onlineUsers,
  guestSockets,
  citizenCallGuests,
  isUserOnline,
  getOnlineUsersSnapshot,
  registerGuest,
  unregisterGuest,
  emitToParticipant,
  ensureCitoyenCaller,
  ensureDefaultRecipient,
  getConfig,
  getRecipientAgent,
  getCandidateAgents,
  setRecipientAgent,
};
