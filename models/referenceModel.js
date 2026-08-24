const { pool } = require('../config/database');

const getCategories = async () => {
  const [rows] = await pool.execute(
    `SELECT c.*, d.nom_direction FROM categories_doleance c
     LEFT JOIN directions d ON c.id_direction = d.id_direction
     ORDER BY c.module, c.nom_categorie`
  );
  return rows;
};

const getCategoriesByModule = async (module) => {
  const [rows] = await pool.execute(
    `SELECT c.*, d.nom_direction FROM categories_doleance c
     LEFT JOIN directions d ON c.id_direction = d.id_direction
     WHERE c.module = ? AND c.actif = 1 ORDER BY c.nom_categorie`,
    [module]
  );
  return rows;
};

const getCategorieById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM categories_doleance WHERE id_categorie = ?', [id]);
  return rows[0];
};

const createCategorie = async (data) => {
  const { nom_categorie, nom_malgache, description, description_malagasy, direction_concernee, id_direction, couleur, icone, module } = data;
  const [result] = await pool.execute(
    `INSERT INTO categories_doleance (nom_categorie, nom_malgache, description, description_malagasy, direction_concernee, id_direction, couleur, icone, module)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nom_categorie, nom_malgache || null, description || null, description_malagasy || null, direction_concernee || null, id_direction || null, couleur || null, icone || null, module || 'CUA']
  );
  return result.insertId;
};

const updateCategorie = async (id, data) => {
  const { nom_categorie, nom_malgache, description, description_malagasy, direction_concernee, id_direction, couleur, icone, module, actif } = data;
  const [result] = await pool.execute(
    `UPDATE categories_doleance SET
       nom_categorie = ?, nom_malgache = ?, description = ?, description_malagasy = ?,
       direction_concernee = ?,
       id_direction = ?, couleur = ?, icone = ?, module = ?, actif = ?
     WHERE id_categorie = ?`,
    [nom_categorie, nom_malgache || null, description || null, description_malagasy || null,
     direction_concernee || null,
     id_direction || null, couleur || null, icone || null, module || 'CUA', actif !== undefined ? actif : 1, id]
  );
  return result.affectedRows;
};

const deleteCategorie = async (id) => {
  await pool.execute('UPDATE doleances SET id_categorie = NULL WHERE id_categorie = ?', [id]);
  const [result] = await pool.execute('DELETE FROM categories_doleance WHERE id_categorie = ?', [id]);
  return result.affectedRows;
};

const getStatuts = async () => {
  const [rows] = await pool.execute('SELECT * FROM statuts WHERE id_statut <> 9 ORDER BY ordre');
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

const getQuartiersGeoJSON = async () => {
  const [rows] = await pool.execute(`
    SELECT q.id_quartier, q.nom_quartier, q.code_postal,
           q.latitude_centre, q.longitude_centre, q.boundary,
           a.nom_arrondissement
    FROM quartiers q
    LEFT JOIN arrondissements a ON q.id_arrondissement = a.id_arrondissement
    WHERE q.boundary IS NOT NULL
  `);

  const features = rows.map(row => {
    let coordinates = [];
    try {
      coordinates = typeof row.boundary === 'string' ? JSON.parse(row.boundary) : row.boundary;
    } catch (e) {
      coordinates = [];
    }
    return {
      type: 'Feature',
      properties: {
        id_quartier: row.id_quartier,
        nom_quartier: row.nom_quartier,
        nom_arrondissement: row.nom_arrondissement,
        code_postal: row.code_postal
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates.map(c => [c[1], c[0]])]
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features
  };
};

const getRoles = async () => {
  const [rows] = await pool.execute('SELECT * FROM roles');
  return rows;
};

const findDirectionById = async (connection, id_direction) => {
  const [rows] = await connection.execute(
    'SELECT id_direction, nom_direction, email, telephone, categorie, responsable FROM directions WHERE id_direction = ? AND actif = 1',
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


const findByReference = async (reference) => {
    const [rows] = await pool.execute(
        "SELECT * FROM doleances WHERE reference = ?",
        [reference]
    );

    return rows;
};

module.exports = { getCategories, getCategoriesByModule, getCategorieById, createCategorie, updateCategorie, deleteCategorie, getStatuts, getPriorites, getDirections, getQuartiers, getQuartiersGeoJSON, getRoles, findDirectionById, findFirstDirection, findStatutByNom ,findByReference };