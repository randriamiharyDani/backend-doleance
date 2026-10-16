const { pool } = require('../config/database');

// Liste complète des mots interdits, triée par ordre alphabétique.
const findAll = async () => {
  const [rows] = await pool.execute('SELECT * FROM mots_interdits ORDER BY mot ASC');
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM mots_interdits WHERE id_mot = ?', [id]);
  return rows;
};

// Sert à éviter les doublons insensiblement à la casse ("Merde" / "merde").
const findByMot = async (mot) => {
  const [rows] = await pool.execute('SELECT * FROM mots_interdits WHERE mot = ?', [mot]);
  return rows;
};

const create = async ({ mot }) => {
  const [result] = await pool.execute(
    'INSERT INTO mots_interdits (mot) VALUES (?)',
    [mot]
  );
  return result.insertId;
};

const update = async (id, { mot }) => {
  await pool.execute('UPDATE mots_interdits SET mot = ? WHERE id_mot = ?', [mot, id]);
};

const deleteById = async (id) => {
  await pool.execute('DELETE FROM mots_interdits WHERE id_mot = ?', [id]);
};

module.exports = { findAll, findById, findByMot, create, update, deleteById };
