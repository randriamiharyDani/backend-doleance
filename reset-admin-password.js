const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

// Configuration de la base de données
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_doleances',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

async function resetAdminPassword() {
  try {
    console.log('🔧 Réinitialisation du mot de passe administrateur...');
    
    // Mot de passe à définir
    const plainPassword = 'admin123';
    
    // Générer un nouveau hash bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log(`📝 Mot de passe: ${plainPassword}`);
    console.log(`🔑 Hash généré: ${hashedPassword}`);
    console.log(`📏 Longueur du hash: ${hashedPassword.length} caractères`);
    
    // Mettre à jour directement avec le nouveau hash
    const [updateResult] = await pool.execute(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
      [hashedPassword, 'admin@mairie.com']
    );
    
    if (updateResult.affectedRows === 0) {
      console.log('⚠️ Aucun utilisateur trouvé avec cet email, création en cours...');
      
      // Vérifier le rôle administrateur
      const [roles] = await pool.execute('SELECT id_role FROM roles WHERE nom_role = ?', ['administrateur']);
      let adminRoleId = 4; // Valeur par défaut
      
      if (roles.length > 0) {
        adminRoleId = roles[0].id_role;
      }
      
      // Créer l'utilisateur s'il n'existe pas
      const [insertResult] = await pool.execute(
        `INSERT INTO utilisateurs (id_role, nom, prenom, email, mot_de_passe, actif, date_creation) 
         VALUES (?, 'Admin', 'Système', 'admin@mairie.com', ?, 1, NOW())`,
        [adminRoleId, hashedPassword]
      );
      
      console.log(`✅ Nouvel administrateur créé avec ID: ${insertResult.insertId}`);
    } else {
      console.log(`✅ Mot de passe mis à jour pour ${updateResult.affectedRows} utilisateur(s)`);
    }
    
    // Vérification
    const [users] = await pool.execute(
      'SELECT id_utilisateur, email, id_role, actif, LENGTH(mot_de_passe) as hash_len FROM utilisateurs WHERE email = ?',
      ['admin@mairie.com']
    );
    
    if (users.length > 0) {
      console.log('\n📊 Vérification dans la base de données:');
      console.table(users);
      
      // Tester le hash immédiatement
      const storedHash = users[0].mot_de_passe;
      const testResult = await bcrypt.compare(plainPassword, storedHash);
      console.log(`\n🧪 Test du mot de passe "${plainPassword}" avec le hash stocké: ${testResult ? '✅ VALIDE' : '❌ INVALIDE'}`);
      
      if (testResult) {
        console.log('\n🎉 SUCCÈS ! Le mot de passe fonctionne maintenant.');
        console.log('📧 Email: admin@mairie.com');
        console.log('🔑 Mot de passe: admin123');
      } else {
        console.log('\n❌ Le test a échoué. Vérifiez la connexion à la base de données.');
      }
    } else {
      console.log('❌ Impossible de trouver ou créer l\'utilisateur administrateur.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetAdminPassword();