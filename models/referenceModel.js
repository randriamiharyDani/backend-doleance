const { pool } = require('../config/database');

const getCategories = async () => {
  const [rows] = await pool.execute('SELECT * FROM categories_doleance ORDER BY nom_categorie');
  return rows;
};

const getStatuts = async () => {
  const [rows] = await pool.execute('SELECT * FROM statuts ORDER BY ordre');
  return rows;
};

const getPriorites = async () => {
  const [rows] = await pool.execute('SELECT * FROM priorites ORDER BY niveau');
  return rows;
};

const getDirections = async () => {
  const [rows] = await pool.execute('SELECT * FROM directions WHERE actif = 1 ORDER BY nom_direction');
  return rows;
};

const getQuartiers = async () => {
  const [rows] = await pool.execute(`
    SELECT q.*, a.nom_arrondissement 
    FROM quartiers q
    LEFT JOIN arrondissements a ON q.id_arrondissement = a.id_arrondissement
  `);
  return rows;
};

const getRoles = async () => {
  const [rows] = await pool.execute('SELECT * FROM roles');
  return rows;
};

const findDirectionById = async (connection, id_direction) => {
  const [rows] = await connection.execute(
    'SELECT id_direction, nom_direction FROM directions WHERE id_direction = ? AND actif = 1',
    [Number(id_direction)]
  );
  return rows;
};

const findFirstDirection = async (connection) => {
  const [rows] = await connection.execute('SELECT id_direction FROM directions LIMIT 1');
  return rows;
};

const findStatutByNom = async (connection, nom_statut) => {
  const [rows] = await connection.execute(
    'SELECT id_statut FROM statuts WHERE nom_statut = ?',
    [nom_statut]
  );
  return rows;
};

module.exports = { getCategories, getStatuts, getPriorites, getDirections, getQuartiers, getRoles, findDirectionById, findFirstDirection, findStatutByNom };
