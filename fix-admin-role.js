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

async function fixAdminRole() {
  try {
    console.log('🔧 Correction du rôle administrateur système...');
    
    // 1. Vérifier si le rôle existe
    const [roles] = await pool.execute('SELECT id_role FROM roles WHERE nom_role = ?', ['administrateur_systeme']);
    let adminRoleId = 10;
    
    if (roles.length === 0) {
      console.log('⚠️ Rôle administrateur_systeme non trouvé, création...');
      const [result] = await pool.execute(
        'INSERT INTO roles (id_role, nom_role, description, is_system) VALUES (10, "administrateur_systeme", "Administrateur système - Contrôle total", 1)'
      );
      console.log('✅ Rôle créé avec ID: 10');
    } else {
      adminRoleId = roles[0].id_role;
      console.log('✅ Rôle administrateur_systeme trouvé avec ID:', adminRoleId);
    }
    
    // 2. Mettre à jour l'utilisateur
    const email = 'nmiharintsoa@gmail.com';
    const [result] = await pool.execute(
      'UPDATE utilisateurs SET id_role = ? WHERE email = ?',
      [adminRoleId, email]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Utilisateur ${email} mis à jour avec le rôle administrateur_systeme`);
    } else {
      console.log(`⚠️ Utilisateur ${email} non trouvé`);
    }
    
    // 3. Vérification
    const [users] = await pool.execute(
      `SELECT u.id_utilisateur, u.email, r.nom_role 
       FROM utilisateurs u
       JOIN roles r ON u.id_role = r.id_role
       WHERE u.email = ?`,
      [email]
    );
    
    console.log('\n📊 Résultat:');
    console.table(users);
    
    console.log('\n🔐 Maintenant, déconnectez-vous et reconnectez-vous !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixAdminRole();