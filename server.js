const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  skip: (req) => process.env.NODE_ENV === 'development' // Skip en développement
});
app.use('/api', limiter);

// CORS configuration - À placer AVANT les routes
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

// Health check - À placer avant les autres routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const doleanceRoutes = require('./routes/doleanceRoutes');
const userRoutes = require('./routes/userRoutes');
const statistiqueRoutes = require('./routes/statistiqueRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const roleRoutes = require('./routes/roleRoutes');
const transfertRoutes = require('./routes/transfertRoutes');
const directionRoutes = require('./routes/directionRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/doleances', doleanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistiques', statistiqueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/transfert', transfertRoutes);
app.use('/api/directions', directionRoutes);
app.use('/api/services', serviceRoutes);

// WebSocket for real-time notifications
io.on('connection', (socket) => {
  console.log('🔌 Nouvelle connexion WebSocket:', socket.id);
  
  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user_${decoded.id}`);
      console.log(`✅ Utilisateur ${decoded.id} authentifié sur WebSocket`);
    } catch (error) {
      console.error('❌ Erreur authentification WebSocket:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Déconnexion WebSocket:', socket.id);
  });
});

// Make io accessible to controllers
app.set('io', io);

// Error handling middleware - À placer APRÈS les routes
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - À placer à la fin
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route non trouvée: ${req.method} ${req.url}` 
  });
});

// Database initialization
const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDatabase();
    console.log('✅ Base de données initialisée');
    
    server.listen(PORT, () => {
      console.log(`
      ==========================================
      🚀 Serveur démarré avec succès !
      📡 URL: http://localhost:${PORT}
      🏥 Health: http://localhost:${PORT}/api/health
      🔌 WebSocket: ws://localhost:${PORT}
      🔐 Environnement: ${process.env.NODE_ENV || 'development'}
      ==========================================
      `);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    console.error('Détails de l\'erreur:', error.message);
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

startServer();