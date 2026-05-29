const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

// Chargement des variables d'environnement
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

// ========== MIDDLEWARES DE SÉCURITÉ ==========

// Helmet pour la sécurité des headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression pour les réponses
app.use(compression());

// Rate limiting pour prévenir les attaques
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requêtes par fenêtre
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== ROUTES ==========

// Import des routes
const authRoutes = require('./routes/authRoutes');
const doleanceRoutes = require('./routes/doleanceRoutes');
const userRoutes = require('./routes/userRoutes');
const statistiqueRoutes = require('./routes/statistiqueRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const roleRoutes = require('./routes/roleRoutes');

// Health check - Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Serveur démarré avec succès',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Utilisation des routes API
app.use('/api/auth', authRoutes);
app.use('/api/doleances', doleanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistiques', statistiqueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);

// ========== WEBSOCKET ==========

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Nouvelle connexion WebSocket:', socket.id);
  
  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user_${decoded.id}`);
      console.log(`✅ Utilisateur ${decoded.id} authentifié sur WebSocket`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      console.error('❌ Erreur authentification WebSocket:', error.message);
      socket.emit('authenticated', { success: false, message: 'Token invalide' });
    }
  });
  
  socket.on('join_doleance', (doleanceId) => {
    socket.join(`doleance_${doleanceId}`);
    console.log(`📢 Socket ${socket.id} a rejoint la doleance ${doleanceId}`);
  });
  
  socket.on('leave_doleance', (doleanceId) => {
    socket.leave(`doleance_${doleanceId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Déconnexion WebSocket:', socket.id);
  });
});

// Rendre io accessible aux contrôleurs
app.set('io', io);

// ========== GESTION DES ERREURS ==========

// Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  
  // Erreur de validation JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
  
  // Erreur de token expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré, veuillez vous reconnecter'
    });
  }
  
  // Erreur de Multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.url}`
  });
});

// ========== INITIALISATION DE LA BASE DE DONNÉES ==========

const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Initialisation de la base de données
    await initDatabase();
    console.log('✅ Base de données initialisée avec succès');
    
    // Démarrage du serveur
    server.listen(PORT, () => {
      console.log(`
      ════════════════════════════════════════════════════════════
      🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS !
      ════════════════════════════════════════════════════════════
      📡 URL: http://localhost:${PORT}
      🏥 Health: http://localhost:${PORT}/api/health
      🔌 WebSocket: ws://localhost:${PORT}
      🔐 Environnement: ${process.env.NODE_ENV || 'development'}
      ════════════════════════════════════════════════════════════
      `);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
});

// Démarrage
startServer();

module.exports = { app, server, io };