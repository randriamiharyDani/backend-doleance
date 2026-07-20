const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Stockage des doléances en cours d'édition
const editingDoleances = {};

// Stockage des utilisateurs connectés
const onlineUsers = new Map(); // userId -> Map of socketId -> { userName, userRole, connectedAt }

// ================================
// Security middleware
// ================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

app.use(compression());

// ================================
// Rate Limiting
// ================================

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  skip: () => process.env.NODE_ENV === 'development'
});

app.use('/api', limiter);

// ================================
// CORS
// ================================

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// ================================
// Body Parser
// ================================

app.use(express.json({ limit: '50mb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb'
  })
);

// Servir les fichiers uploadés
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ================================
// Health Check
// ================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    editingCount: Object.keys(editingDoleances).length,
    onlineUsersCount: onlineUsers.size
  });
});

// ================================
// Routes
// ================================

const authRoutes = require('./routes/authRoutes');
const doleanceRoutes = require('./routes/doleanceRoutes');
const userRoutes = require('./routes/userRoutes');
const statistiqueRoutes = require('./routes/statistiqueRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const roleRoutes = require('./routes/roleRoutes');
const transfertRoutes = require('./routes/transfertRoutes');
const directionRoutes = require('./routes/directionRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const corbeilleRoutes = require('./routes/corbeilleRoutes');
const globalRoutes = require('./routes/globalRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/doleances', doleanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistiques', statistiqueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/transfert', transfertRoutes);
app.use('/api/directions', directionRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/corbeille', corbeilleRoutes);
app.use('/api', globalRoutes);

// ================================
// SOCKET.IO - Fonction broadcast
// ================================

function broadcastOnlineUsers() {
  const users = [];
  onlineUsers.forEach((sockets, userId) => {
    if (sockets.size > 0) {
      const first = sockets.values().next().value;
      users.push({
        userId,
        userName: first.userName,
        userRole: first.userRole,
        connectedAt: first.connectedAt
      });
    }
  });
  io.emit('online-users-updated', users);
}

// ================================
// SOCKET.IO - Version complète avec verrouillage
// ================================

io.on('connection', (socket) => {
  console.log(`🔌 Nouvelle connexion WebSocket : ${socket.id}`);

  // Authentification
  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.id_utilisateur;
      socket.userName = decoded.nom || decoded.userName || 'Utilisateur';
      socket.join(`user_${socket.userId}`);
      console.log(`✅ Utilisateur ${socket.userId} authentifié`);
    } catch (error) {
      console.error('❌ Erreur authentification WebSocket :', error.message);
    }
  });

  // ========== GESTION DES UTILISATEURS EN LIGNE ==========
  socket.on('user-connected', (data) => {
    const { userId, userName, userRole } = data;
    if (!userId) return;

    const numericUserId = Number(userId);

    if (!onlineUsers.has(numericUserId)) {
      onlineUsers.set(numericUserId, new Map());
    }
    onlineUsers.get(numericUserId).set(socket.id, {
      userName,
      userRole,
      connectedAt: new Date()
    });

    socket.userId = numericUserId;
    socket.userName = userName;
    socket.join(`user_${numericUserId}`);

    console.log(`👤 Utilisateur connecté : ${userName} (${numericUserId}) — socket ${socket.id}`);

    // Diffuser la liste mise à jour à tous les clients
    broadcastOnlineUsers();
  });

  socket.on('user-disconnected', (userId) => {
    const numericUserId = Number(userId);
    if (numericUserId && onlineUsers.has(numericUserId)) {
      const sockets = onlineUsers.get(numericUserId);
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(numericUserId);
      }
      console.log(`👤 Utilisateur déconnecté : ${numericUserId}`);
      broadcastOnlineUsers();
    }
  });

  // ========== GESTION DES SESSIONS ==========
  
  // Rejoindre un salon
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`📢 Socket ${socket.id} a rejoint le salon ${room}`);
  });

  // Quitter un salon
  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`📢 Socket ${socket.id} a quitté le salon ${room}`);
  });

  // ========== GESTION DES VERROUS ==========

  // Verrouiller une ressource (doléance)
  socket.on('lock-resource', (data, callback) => {
    const { resourceId, resourceType, userId, userName } = data;
    const key = `${resourceType}_${resourceId}`;

    console.log(`🔒 Tentative de verrouillage de ${key} par ${userName || 'Utilisateur'}`);

    // Vérifier si la ressource est déjà verrouillée
    if (editingDoleances[key]) {
      const lockInfo = editingDoleances[key];
      
      // Si le verrou a expiré (plus de 5 minutes)
      if (Date.now() - new Date(lockInfo.startedAt).getTime() > 300000) {
        console.log(`⏰ Verrou expiré pour ${key}, suppression`);
        delete editingDoleances[key];
      } else {
        // Le verrou est actif
        console.log(`🔒 Ressource ${key} déjà verrouillée par ${lockInfo.userName}`);
        if (callback) {
          callback({
            success: false,
            lockedBy: lockInfo.userName,
            userId: lockInfo.userId,
            timestamp: lockInfo.startedAt
          });
        }
        return;
      }
    }

    // Verrouiller la ressource
    editingDoleances[key] = {
      resourceId,
      resourceType,
      userId: userId || socket.userId,
      userName: userName || socket.userName || 'Utilisateur',
      socketId: socket.id,
      startedAt: new Date()
    };

    // Notifier tous les clients dans le salon
    io.to(`resource_${resourceId}`).emit('resource-locked', {
      resourceId,
      resourceType,
      userId: userId || socket.userId,
      userName: userName || socket.userName || 'Utilisateur',
      timestamp: new Date(),
      success: true
    });

    console.log(`🔒 Ressource ${key} verrouillée par ${userName || 'Utilisateur'}`);

    if (callback) {
      callback({
        success: true,
        expiry: new Date(Date.now() + 300000)
      });
    }
  });

  // Renouveler un verrou
  socket.on('renew-lock', (data, callback) => {
    const { resourceId, resourceType } = data;
    const key = `${resourceType}_${resourceId}`;

    if (editingDoleances[key] && editingDoleances[key].socketId === socket.id) {
      editingDoleances[key].startedAt = new Date();
      
      // Notifier le renouvellement
      io.to(`resource_${resourceId}`).emit('lock-renewed', {
        resourceId,
        resourceType,
        timestamp: new Date()
      });

      if (callback) {
        callback({
          success: true,
          expiry: new Date(Date.now() + 300000)
        });
      }
    } else {
      if (callback) {
        callback({
          success: false,
          message: 'Verrou non trouvé ou expiré'
        });
      }
    }
  });

  // Déverrouiller une ressource
  socket.on('unlock-resource', (data) => {
    const { resourceId, resourceType } = data;
    const key = `${resourceType}_${resourceId}`;

    if (editingDoleances[key] && editingDoleances[key].socketId === socket.id) {
      delete editingDoleances[key];
      
      io.to(`resource_${resourceId}`).emit('resource-unlocked', {
        resourceId,
        resourceType,
        reason: 'user',
        timestamp: new Date()
      });

      console.log(`🔓 Ressource ${key} déverrouillée`);
    }
  });

  // Début édition (compatibilité avec ancienne version)
  socket.on('startEditing', (data) => {
    const { doleanceId, utilisateur } = data;
    const key = `doleance_${doleanceId}`;

    if (!editingDoleances[key]) {
      editingDoleances[key] = {
        utilisateur,
        socketId: socket.id,
        startedAt: new Date()
      };

      io.emit('editingStatus', {
        doleanceId,
        utilisateur,
        isEditing: true
      });

      console.log(`✏️ Doléance ${doleanceId} éditée par ${utilisateur}`);
    }
  });

  // Fin édition (compatibilité avec ancienne version)
  socket.on('stopEditing', (doleanceId) => {
    const key = `doleance_${doleanceId}`;
    delete editingDoleances[key];

    io.emit('editingStatus', {
      doleanceId,
      isEditing: false
    });

    console.log(`✅ Fin édition doléance ${doleanceId}`);
  });

  // Mise à jour doléance
  socket.on('doleanceUpdated', (data) => {
    io.to(`resource_${data.id}`).emit('doleanceUpdated', data);
    console.log(`🔄 Doléance mise à jour : ${data.id}`);
  });

  // Nouvelle notification
  socket.on('newNotification', (data) => {
    io.emit('newNotification', data);
    console.log(`🔔 Nouvelle notification envoyée`);
  });

  // Confirmation de lecture des notifications
  socket.on('notificationRead', (data) => {
    io.to(`user_${data.userId}`).emit('notificationRead', data);
  });

  // ========== GESTION DES ERREURS ==========

  socket.on('error', (error) => {
    console.error(`❌ Erreur socket ${socket.id}:`, error);
  });

  // ========== DECONNEXION ==========

  socket.on('disconnect', () => {
    // Retirer l'utilisateur de la liste des connectés (uniquement ce socket)
    if (socket.userId && onlineUsers.has(socket.userId)) {
      const sockets = onlineUsers.get(socket.userId);
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(socket.userId);
      }
      console.log(`👤 Socket retiré de la liste en ligne : ${socket.userId} (${socket.id})`);
      broadcastOnlineUsers();
    }

    // Libérer tous les verrous de ce socket
    const keysToDelete = [];
    Object.keys(editingDoleances).forEach((key) => {
      if (editingDoleances[key].socketId === socket.id) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      delete editingDoleances[key];
      const [resourceType, resourceId] = key.split('_');
      io.to(`resource_${resourceId}`).emit('resource-unlocked', {
        resourceId,
        resourceType,
        reason: 'disconnect',
        timestamp: new Date()
      });
      console.log(`🔓 Ressource ${key} libérée (déconnexion)`);
    });

    console.log(`🔌 Déconnexion WebSocket : ${socket.id}`);
  });
});

// Rendre io accessible depuis les contrôleurs
app.set('io', io);

// ================================
// Error Handler
// ================================

app.use((err, req, res, next) => {
  console.error('❌ Erreur :', err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// ================================
// 404
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée : ${req.method} ${req.url}`
  });
});

// ================================
// Database Init
// ================================

const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDatabase();
    console.log('✅ Base de données initialisée');

    // Vérifier la connexion SMTP au démarrage
    const { verifyConnection, isSmtpConfigured } = require('./services/emailService');
    if (isSmtpConfigured()) {
      await verifyConnection();
    } else {
      console.log('⚠️ SMTP non configuré — Les e-mails ne seront pas envoyés.');
      console.log('⚠️ En mode dev, le lien de réinitialisation sera retourné dans la réponse API.');
      console.log('⚠️ Pour configurer : renseignez SMTP_USER et SMTP_PASS dans .env');
    }

    server.listen(PORT, () => {
      console.log(`
=================================================
🚀 Serveur démarré avec succès
📡 URL : http://localhost:${PORT}
🏥 Health : http://localhost:${PORT}/api/health
🔌 WebSocket : ws://localhost:${PORT}
🔐 Mode : ${process.env.NODE_ENV || 'development'}
=================================================
`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage :', error);
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée :', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesse rejetée non gérée :', reason);
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  console.log('🛑 Réception de SIGTERM, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Réception de SIGINT, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

startServer();