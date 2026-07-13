const { pool } = require('../config/database');

const generateCitizenId = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CIT${year}-${random}`;
};

const findByIdentifiant = async (identifiant) => {
  const [rows] = await pool.execute(
    'SELECT id_citoyen, nom, prenom, telephone, adresse, identifiant_citoyen FROM citoyens WHERE identifiant_citoyen = ?',
    [identifiant]
  );
  return rows;
};

const create = async ({ nom, prenom, telephone, email, adresse, identifiant_citoyen }) => {
  const [result] = await pool.execute(
    `INSERT INTO citoyens (nom, prenom, telephone, email, adresse, identifiant_citoyen) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nom, prenom, telephone || null, email || null, adresse || null, identifiant_citoyen]
  );
  return result.insertId;
};

module.exports = { generateCitizenId, findByIdentifiant, create };
