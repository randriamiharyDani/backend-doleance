const { pool } = require('../config/database');

const generateReference = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DOL-${year}${month}${day}-${random}`;
};

const directionParCategorie = {
  1: 1, 2: 2, 3: 2, 4: 2, 5: 4, 6: 3, 7: 5, 8: 6
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT d.*, s.nom_statut, s.couleur as statut_couleur,
            p.nom_priorite, p.niveau, c.nom_categorie, dir.nom_direction,
            ct.nom as citoyen_nom, ct.prenom as citoyen_prenom,
            ct.email as citoyen_email, ct.telephone as citoyen_telephone,
            ct.adresse as citoyen_adresse,
            q.nom_quartier, a.nom_arrondissement
     FROM doleances d
     LEFT JOIN statuts s ON d.id_statut = s.id_statut
     LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
     LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
     LEFT JOIN directions dir ON d.id_direction = dir.id_direction
     LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
     LEFT JOIN quartiers q ON d.id_quartier = q.id_quartier
     LEFT JOIN arrondissements a ON q.id_arrondissement = a.id_arrondissement
     WHERE d.id_doleance = ? AND (d.supprime IS NULL OR d.supprime = 0)`,
    [id]
  );
  return rows;
};

const findByIdIncludeTrashed = async (id) => {
  const [rows] = await pool.execute(
    `SELECT d.*, s.nom_statut, s.couleur as statut_couleur,
            p.nom_priorite, p.niveau, c.nom_categorie, dir.nom_direction,
            ct.nom as citoyen_nom, ct.prenom as citoyen_prenom,
            ct.email as citoyen_email, ct.telephone as citoyen_telephone,
            ct.adresse as citoyen_adresse,
            q.nom_quartier, a.nom_arrondissement
     FROM doleances d
     LEFT JOIN statuts s ON d.id_statut = s.id_statut
     LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
     LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
     LEFT JOIN directions dir ON d.id_direction = dir.id_direction
     LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
     LEFT JOIN quartiers q ON d.id_quartier = q.id_quartier
     LEFT JOIN arrondissements a ON q.id_arrondissement = a.id_arrondissement
     WHERE d.id_doleance = ?`,
    [id]
  );
  return rows;
};

const findByReference = async (reference) => {
  const [rows] = await pool.execute(
    `SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie, q.nom_quartier
     FROM doleances d
     LEFT JOIN statuts s ON d.id_statut = s.id_statut
     LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
     LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
     LEFT JOIN quartiers q ON d.id_quartier = q.id_quartier
     WHERE d.reference = ? AND (d.supprime IS NULL OR d.supprime = 0)`,
    [reference]
  );
  return rows;
};

const findByReferenceAndCitoyen = async (reference, id_citoyen) => {
  const [rows] = await pool.execute(
    `SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie, dir.nom_direction
     FROM doleances d
     LEFT JOIN statuts s ON d.id_statut = s.id_statut
     LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
     LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
     LEFT JOIN directions dir ON d.id_direction = dir.id_direction
     WHERE d.reference = ? AND d.id_citoyen = ? AND (d.supprime IS NULL OR d.supprime = 0)`,
    [reference, id_citoyen]
  );
  return rows;
};

const findByCitoyenId = async (id_citoyen) => {
  const [rows] = await pool.execute(
    `SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie, dir.nom_direction
     FROM doleances d
     LEFT JOIN statuts s ON d.id_statut = s.id_statut
     LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
     LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
     LEFT JOIN directions dir ON d.id_direction = dir.id_direction
     WHERE d.id_citoyen = ? AND (d.supprime IS NULL OR d.supprime = 0)
     ORDER BY d.date_creation DESC`,
    [id_citoyen]
  );
  return rows;
};

const listPublic = async ({ categorie, statut, search, page = 1, limit = 10, sort = 'date_desc' }) => {
  let query = `
    SELECT 
      d.id_doleance, d.reference, d.titre, d.description, d.date_creation, d.date_mise_a_jour,
      s.id_statut, s.nom_statut, s.couleur as statut_couleur,
      p.id_priorite, p.nom_priorite, p.niveau,
      c.id_categorie, c.nom_categorie,
      dir.id_direction, dir.nom_direction
    FROM doleances d
    LEFT JOIN statuts s ON d.id_statut = s.id_statut
    LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
    LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
    LEFT JOIN directions dir ON d.id_direction = dir.id_direction
     WHERE (d.supprime IS NULL OR d.supprime = 0)
  `;
  const params = [];

  if (categorie) { query += ' AND d.id_categorie = ?'; params.push(Number(categorie)); }
  if (statut) { query += ' AND d.id_statut = ?'; params.push(Number(statut)); }
  if (search) {
    query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  let countQuery = 'SELECT COUNT(*) as total FROM doleances d WHERE (supprime IS NULL OR supprime = 0)';
  const countParams = [];
  if (categorie) { countQuery += ' AND id_categorie = ?'; countParams.push(Number(categorie)); }
  if (statut) { countQuery += ' AND id_statut = ?'; countParams.push(Number(statut)); }
  if (search) {
    countQuery += ' AND (reference LIKE ? OR titre LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    countParams.push(term, term, term);
  }
  const [countResult] = await pool.execute(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  const orderMap = {
    'date_desc': 'd.date_creation DESC',
    'date_asc': 'd.date_creation ASC',
    'priorite_desc': 'p.niveau DESC, d.date_creation DESC',
    'priorite_asc': 'p.niveau ASC, d.date_creation DESC'
  };
  const orderBy = orderMap[sort] || 'd.date_creation DESC';

  const offset = (Number(page) - 1) * Number(limit);
  query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  const [rows] = await pool.query(query, params);
  return { data: rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) };
};

const listBackoffice = async ({ page = 1, limit = 10, categorie, statut, priorite, search, userId, userRole, userDirectionId }) => {
  const adminRoles = ['administrateur_systeme', 'administrateur', 'agent_central'];
  const isDirectionRole = !adminRoles.includes(userRole);

  let query = `
    SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie,
           CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
           ct.email as citoyen_email, ct.telephone as citoyen_telephone,
           dir.nom_direction
    FROM doleances d
    LEFT JOIN statuts s ON d.id_statut = s.id_statut
    LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
    LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
    LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
    LEFT JOIN directions dir ON d.id_direction = dir.id_direction
     WHERE (d.supprime IS NULL OR d.supprime = 0)
  `;
  const params = [];

  if (isDirectionRole) {
    if (userDirectionId) {
      query += ' AND d.id_direction = ?';
      params.push(userDirectionId);
    } else if (userId) {
      query += ' AND (d.id_utilisateur_assignee = ? OR d.id_direction IS NULL)';
      params.push(userId);
    }
  }

  if (categorie) { query += ' AND d.id_categorie = ?'; params.push(Number(categorie)); }
  if (statut) { query += ' AND d.id_statut = ?'; params.push(Number(statut)); }
  if (priorite) { query += ' AND d.id_priorite = ?'; params.push(Number(priorite)); }
  if (search) {
    query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  let countWhere = '';
  const countParams = [];
  if (isDirectionRole) {
    if (userDirectionId) {
      countWhere += ' AND d.id_direction = ?';
      countParams.push(userDirectionId);
    } else if (userId) {
      countWhere += ' AND (d.id_utilisateur_assignee = ? OR d.id_direction IS NULL)';
      countParams.push(userId);
    }
  }
  if (categorie) { countWhere += ' AND d.id_categorie = ?'; countParams.push(Number(categorie)); }
  if (statut) { countWhere += ' AND d.id_statut = ?'; countParams.push(Number(statut)); }
  if (priorite) { countWhere += ' AND d.id_priorite = ?'; countParams.push(Number(priorite)); }
  if (search) {
    countWhere += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
    const term = `%${search}%`;
    countParams.push(term, term, term);
  }

  const [countResult] = await pool.execute(
    `SELECT COUNT(*) as total FROM doleances d WHERE (d.supprime IS NULL OR d.supprime = 0) ${countWhere}`,
    countParams
  );
  const total = countResult[0]?.total || 0;

  const offset = (Number(page) - 1) * Number(limit);
  query += ' ORDER BY d.date_creation DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const [rows] = await pool.query(query, params);
  return { data: rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) };
};

const list = async ({ page = 1, limit = 10, categorie, statut, priorite, search }) => {
  let query = `
    SELECT d.*, s.nom_statut, s.couleur as statut_couleur, p.nom_priorite, p.niveau, c.nom_categorie,
           CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
           ct.email as citoyen_email, ct.telephone as citoyen_telephone,
           dir.nom_direction
    FROM doleances d
    LEFT JOIN statuts s ON d.id_statut = s.id_statut
    LEFT JOIN priorites p ON d.id_priorite = p.id_priorite
    LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
    LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
    LEFT JOIN directions dir ON d.id_direction = dir.id_direction
     WHERE (d.supprime IS NULL OR d.supprime = 0)
  `;
  const params = [];

  if (categorie) { query += ' AND d.id_categorie = ?'; params.push(Number(categorie)); }
  if (statut) { query += ' AND d.id_statut = ?'; params.push(Number(statut)); }
  if (priorite) { query += ' AND d.id_priorite = ?'; params.push(Number(priorite)); }
  if (search) {
    query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  let countQuery = 'SELECT COUNT(*) as total FROM doleances d WHERE (supprime IS NULL OR supprime = 0)';
  const countParams = [];
  if (categorie) { countQuery += ' AND id_categorie = ?'; countParams.push(Number(categorie)); }
  if (statut) { countQuery += ' AND id_statut = ?'; countParams.push(Number(statut)); }
  if (priorite) { countQuery += ' AND id_priorite = ?'; countParams.push(Number(priorite)); }
  if (search) {
    countQuery += ' AND (reference LIKE ? OR titre LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    countParams.push(term, term, term);
  }
  const [countResult] = await pool.execute(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  const offset = (Number(page) - 1) * Number(limit);
  query += ' ORDER BY d.date_creation DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const [rows] = await pool.query(query, params);
  return { data: rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) };
};

const listEnAttenteTransfert = async ({ page = 1, limit = 10, categorie, search }) => {
  const offset = (Number(page) - 1) * Number(limit);

  let query = `
    SELECT d.*, 
           s.nom_statut, s.couleur as statut_couleur,
           c.nom_categorie,
           CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom,
           ct.telephone as citoyen_telephone
    FROM doleances d
    LEFT JOIN statuts s ON d.id_statut = s.id_statut
    LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
    LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
    WHERE d.id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_attente')
    AND (d.supprime IS NULL OR d.supprime = 0)
  `;
  const params = [];

  if (categorie) { query += ' AND d.id_categorie = ?'; params.push(Number(categorie)); }
  if (search) {
    query += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR d.description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const [countResult] = await pool.execute(
    `SELECT COUNT(*) as total FROM doleances d 
     WHERE d.id_statut = (SELECT id_statut FROM statuts WHERE nom_statut = 'en_attente')
     AND (d.supprime IS NULL OR d.supprime = 0)`
  );
  const total = countResult[0]?.total || 0;

  query += ' ORDER BY d.date_creation ASC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const [rows] = await pool.query(query, params);
  return { data: rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) };
};

const create = async (connection, { reference, titre, description, id_citoyen, id_categorie, id_quartier, id_direction, id_statut, id_priorite, latitude, longitude, lieu_exact, suggestions }) => {
  const defaultPriorite = id_priorite || 2;
  const [result] = await connection.execute(
    `INSERT INTO doleances 
     (reference, titre, description, id_citoyen, id_categorie, id_priorite, 
      id_quartier, id_direction, id_statut, latitude, longitude, lieu_exact, suggestions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [reference, titre, description, id_citoyen, Number(id_categorie), defaultPriorite,
     id_quartier, id_direction, id_statut, latitude, longitude, lieu_exact, suggestions]
  );
  return result.insertId;
};

const updateStatut = async (id_doleance, id_statut) => {
  await pool.execute(
    'UPDATE doleances SET id_statut = ?, date_mise_a_jour = NOW() WHERE id_doleance = ?',
    [id_statut, id_doleance]
  );
};

const getCurrentStatut = async (id_doleance) => {
  const [rows] = await pool.execute('SELECT id_statut FROM doleances WHERE id_doleance = ?', [id_doleance]);
  return rows;
};

const updatePriorite = async (id_doleance, id_priorite) => {
  await pool.execute('UPDATE doleances SET id_priorite = ? WHERE id_doleance = ?', [id_priorite, id_doleance]);
};

const updateDoleance = async (id_doleance, fields) => {
  const allowed = ['titre', 'description', 'id_categorie', 'id_quartier', 'lieu_exact', 'suggestions'];
  const setClauses = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(fields[key] || null);
    }
  }
  if (setClauses.length === 0) return;
  setClauses.push('date_mise_a_jour = NOW()');
  values.push(id_doleance);
  await pool.execute(`UPDATE doleances SET ${setClauses.join(', ')} WHERE id_doleance = ?`, values);
};

const updateCitoyen = async (id_citoyen, fields) => {
  const allowed = ['nom', 'prenom', 'email', 'telephone', 'adresse'];
  const setClauses = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(fields[key] || null);
    }
  }
  if (setClauses.length === 0) return;
  values.push(id_citoyen);
  await pool.execute(`UPDATE citoyens SET ${setClauses.join(', ')} WHERE id_citoyen = ?`, values);
};

const updateDirectionAndStatut = async (connection, id_doleance, id_direction, id_statut) => {
  await connection.execute(
    `UPDATE doleances 
     SET id_direction = ?, id_statut = ?, date_mise_a_jour = NOW()
     WHERE id_doleance = ?`,
    [Number(id_direction), id_statut, Number(id_doleance)]
  );
};

const addSatisfaction = async (id_doleance, note, commentaire) => {
  await pool.execute(
    `UPDATE doleances 
     SET satisfaction_note = ?, satisfaction_commentaire = ?, date_mise_a_jour = NOW()
     WHERE id_doleance = ?`,
    [note, commentaire || null, id_doleance]
  );
};

const deleteById = async (id_doleance) => {
  await pool.execute('DELETE FROM doleances WHERE id_doleance = ?', [id_doleance]);
};

const softDelete = async (id_doleance) => {
  await pool.execute(
    'UPDATE doleances SET supprime = 1, date_suppression = NOW() WHERE id_doleance = ? AND (supprime IS NULL OR supprime = 0)',
    [id_doleance]
  );
};

const restore = async (id_doleance) => {
  await pool.execute(
    'UPDATE doleances SET supprime = 0, date_suppression = NULL WHERE id_doleance = ?',
    [id_doleance]
  );
};

const listTrashed = async ({ page = 1, limit = 10, search, direction, dateFrom, dateTo }) => {
  let query = `
    SELECT d.id_doleance, d.reference, d.titre, d.date_creation, d.date_suppression,
           d.id_statut, d.id_direction,
           s.nom_statut, s.couleur as statut_couleur,
           dir.nom_direction,
           CONCAT(ct.nom, ' ', ct.prenom) as citoyen_nom
    FROM doleances d
    LEFT JOIN statuts s ON d.id_statut = s.id_statut
    LEFT JOIN directions dir ON d.id_direction = dir.id_direction
    LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen
    WHERE d.supprime = 1
  `;
  const params = [];

  if (search) {
    query += " AND (d.reference LIKE ? OR d.titre LIKE ? OR CONCAT(ct.nom, ' ', ct.prenom) LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (direction) {
    query += ' AND d.id_direction = ?';
    params.push(Number(direction));
  }
  if (dateFrom) {
    query += ' AND d.date_suppression >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    query += ' AND d.date_suppression <= ?';
    params.push(dateTo + ' 23:59:59');
  }

  let countQuery = 'SELECT COUNT(*) as total FROM doleances d LEFT JOIN citoyens ct ON d.id_citoyen = ct.id_citoyen WHERE d.supprime = 1';
  const countParams = [];
  if (search) {
    countQuery += ' AND (d.reference LIKE ? OR d.titre LIKE ? OR CONCAT(ct.nom, " ", ct.prenom) LIKE ?)';
    const term = `%${search}%`;
    countParams.push(term, term, term);
  }
  if (direction) {
    countQuery += ' AND d.id_direction = ?';
    countParams.push(Number(direction));
  }
  if (dateFrom) {
    countQuery += ' AND d.date_suppression >= ?';
    countParams.push(dateFrom);
  }
  if (dateTo) {
    countQuery += ' AND d.date_suppression <= ?';
    countParams.push(dateTo + ' 23:59:59');
  }

  const [countResult] = await pool.execute(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  const offset = (Number(page) - 1) * Number(limit);
  query += ' ORDER BY d.date_suppression DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const [rows] = await pool.query(query, params);
  return { data: rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) };
};

const countTrashed = async () => {
  const [rows] = await pool.execute('SELECT COUNT(*) as total FROM doleances WHERE supprime = 1');
  return rows[0]?.total || 0;
};

const permanentDelete = async (id_doleance) => {
  await pool.execute('DELETE FROM doleances WHERE id_doleance = ? AND supprime = 1', [id_doleance]);
};

const emptyTrash = async () => {
  const [result] = await pool.execute('DELETE FROM doleances WHERE supprime = 1');
  return result.affectedRows;
};

const emptyTrashSelected = async (ids) => {
  if (!ids || ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const [result] = await pool.execute(
    `DELETE FROM doleances WHERE id_doleance IN (${placeholders}) AND supprime = 1`,
    ids
  );
  return result.affectedRows;
};

const searchSuggestions = async (q) => {
  const searchTerm = `%${q}%`;
  const [rows] = await pool.execute(
    `SELECT DISTINCT titre as suggestion 
     FROM doleances 
     WHERE titre LIKE ? OR description LIKE ?
     LIMIT 10`,
    [searchTerm, searchTerm]
  );
  return rows.map(s => s.suggestion);
};

const getDefaultDirection = async (id_categorie) => {
  return directionParCategorie[Number(id_categorie)] ?? null;
};

const listAssignedLocations = async () => {
  const [rows] = await pool.execute(
    `SELECT d.id_doleance, d.reference, d.titre, d.latitude, d.longitude, d.lieu_exact,
            d.date_creation, s.nom_statut, c.nom_categorie,
            u.nom as assignee_nom, u.prenom as assignee_prenom
     FROM doleances d
     LEFT JOIN statuts s ON d.id_statut = s.id_statut
     LEFT JOIN categories_doleance c ON d.id_categorie = c.id_categorie
     LEFT JOIN utilisateurs u ON d.id_utilisateur_assignee = u.id_utilisateur
      WHERE d.latitude IS NOT NULL 
        AND d.longitude IS NOT NULL
        AND d.id_utilisateur_assignee IS NOT NULL
        AND (d.supprime IS NULL OR d.supprime = 0)`
  );
  return rows;
};

module.exports = {
  generateReference, findById, findByIdIncludeTrashed, findByReference, findByReferenceAndCitoyen,
  findByCitoyenId, listPublic, listBackoffice, list, listEnAttenteTransfert,
  create, updateStatut, getCurrentStatut, updatePriorite, updateDoleance, updateCitoyen,
  updateDirectionAndStatut, addSatisfaction, deleteById,
  softDelete, restore, listTrashed, countTrashed, permanentDelete, emptyTrash, emptyTrashSelected,
  searchSuggestions, getDefaultDirection,
  listAssignedLocations
};
