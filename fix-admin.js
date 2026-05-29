const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_doleances',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

async function fixAdmin() {
  try {
    console.log('🔧 Correction du compte administrateur...');
    
    // Générer un hash valide pour 'admin123'
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Hash généré:', hashedPassword);
    
    // Vérifier si l'utilisateur existe
    const [existing] = await pool.execute('SELECT id_utilisateur FROM utilisateurs WHERE email = ?', ['admin@mairie.com']);
    
    if (existing.length > 0) {
      // Mettre à jour l'utilisateur existant
      await pool.execute(
        'UPDATE utilisateurs SET nom = ?, prenom = ?, mot_de_passe = ?, id_role = ?, actif = 1 WHERE email = ?',
        ['Admin', 'Système', hashedPassword, 4, 'admin@mairie.com']
      );
      console.log('✅ Administrateur mis à jour');
    } else {
      // Créer un nouvel utilisateur
      await pool.execute(
        'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, id_role, actif) VALUES (?, ?, ?, ?, ?, 1)',
        ['Admin', 'Système', 'admin@mairie.com', hashedPassword, 4]
      );
      console.log('✅ Administrateur créé');
    }
    
    // Vérifier
    const [users] = await pool.execute('SELECT id_utilisateur, email, id_role, actif FROM utilisateurs WHERE email = ?', ['admin@mairie.com']);
    console.log('📊 Résultat:', users);
    console.log('\n🔐 Identifiants de connexion:');
    console.log('   Email: admin@mairie.com');
    console.log('   Mot de passe: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixAdmin();