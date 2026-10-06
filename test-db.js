const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Test de connexion MySQL...');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Password:', process.env.DB_PASSWORD ? '***' : '(vide)');
console.log('Database:', process.env.DB_NAME);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur:', err.message);
    console.log('\nSolutions:');
    console.log('1. Vérifiez que MySQL est démarré (XAMPP)');
    console.log('2. Vérifiez le mot de passe dans .env');
    console.log('3. Essayez avec DB_PASSWORD= (vide)');
  } else {
    console.log('✅ Connexion réussie !');
    connection.end();
  }
});