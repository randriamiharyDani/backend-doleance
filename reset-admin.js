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

async function resetAdmin() {
  try {
    console.log('🔧 Réinitialisation du compte administrateur...');
    
    // 1. Vérifier le rôle administrateur
    const [roles] = await pool.execute('SELECT id_role FROM roles WHERE nom_role = ?', ['administrateur']);
    let adminRoleId = 4;
    
    if (roles.length > 0) {
      adminRoleId = roles[0].id_role;
    } else {
      await pool.execute('INSERT INTO roles (id_role, nom_role, description) VALUES (4, "administrateur", "Administrateur système")');
    }
    
    // 2. Générer un nouveau hash
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✅ Hash généré:', hashedPassword);
    
    // 3. Supprimer l'ancien admin
    await pool.execute('DELETE FROM utilisateurs WHERE email = ?', ['admin@mairie.com']);
    
    // 4. Créer le nouvel admin
    const [result] = await pool.execute(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, id_role, actif) VALUES (?, ?, ?, ?, ?, ?)',
      ['Admin', 'Système', 'admin@mairie.com', hashedPassword, adminRoleId, 1]
    );
    
    console.log('✅ Administrateur créé avec ID:', result.insertId);
    console.log('📧 Email: admin@mairie.com');
    console.log('🔑 Mot de passe: admin123');
    
    // 5. Vérification
    const [users] = await pool.execute('SELECT id_utilisateur, email, id_role, actif FROM utilisateurs WHERE email = ?', ['admin@mairie.com']);
    console.log('📊 Vérification:', users);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetAdmin();