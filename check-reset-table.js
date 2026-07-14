const { pool } = require('./config/database');

async function test() {
  try {
    const [tables] = await pool.execute("SHOW TABLES LIKE 'password_reset_tokens'");
    console.log('Table existe:', tables.length > 0 ? 'OUI' : 'NON');

    if (tables.length === 0) {
      console.log('Creation de la table...');
      await pool.execute(`
        CREATE TABLE password_reset_tokens (
          id INT PRIMARY KEY AUTO_INCREMENT,
          id_utilisateur INT NOT NULL,
          token VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
        )
      `);
      await pool.execute('CREATE INDEX idx_reset_token ON password_reset_tokens(token)');
      console.log('Table creee avec succes !');
    }

    const [cols] = await pool.execute('DESCRIBE password_reset_tokens');
    console.log('Colonnes:', cols.map(c => c.Field).join(', '));

    const [count] = await pool.execute('SELECT COUNT(*) as total FROM password_reset_tokens');
    console.log('Tokens en base:', count[0].total);

    const [users] = await pool.execute('SELECT id_utilisateur, email FROM utilisateurs LIMIT 5');
    console.log('Utilisateurs:', users);

    process.exit(0);
  } catch(e) {
    console.error('ERREUR:', e.message);
    process.exit(1);
  }
}
test();
