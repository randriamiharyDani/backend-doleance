const { pool } = require('../config/database');

const findByEmail = async (email) => {
  const [rows] = await pool.execute('SELECT id_utilisateur, nom, prenom, email FROM utilisateurs WHERE email = ?', [email]);
  return rows;
};

const findByEmailWithPassword = async (email) => {
  const passwordColumn = await getPasswordColumn();
  const [rows] = await pool.execute(
    `SELECT u.*, r.nom_role, u.${passwordColumn} as mot_de_passe
     FROM utilisateurs u
     LEFT JOIN roles r ON u.id_role = r.id_role
     WHERE u.email = ?`,
    [email]
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
            u.actif, u.date_creation, u.derniere_connexion,
            r.id_role, r.nom_role as role_nom,
            d.id_direction, d.nom_direction
     FROM utilisateurs u
     LEFT JOIN roles r ON u.id_role = r.id_role
     LEFT JOIN directions d ON u.id_direction = d.id_direction
     WHERE u.id_utilisateur = ?`,
    [id]
  );
  return rows;
};

const findByIdBasic = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id_utilisateur, nom, prenom FROM utilisateurs WHERE id_utilisateur = ?',
    [id]
  );
  return rows;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
            u.actif, u.date_creation,
            r.id_role, r.nom_role as role_nom, r.description as role_description,
            d.id_direction, d.nom_direction
     FROM utilisateurs u
     LEFT JOIN roles r ON u.id_role = r.id_role
     LEFT JOIN directions d ON u.id_direction = d.id_direction
     ORDER BY u.date_creation DESC`
  );
  return rows;
};

const create = async ({ nom, prenom, email, mot_de_passe, telephone, id_role, id_direction }) => {
  const passwordColumn = await getPasswordColumn();
  const [result] = await pool.execute(
    `INSERT INTO utilisateurs (nom, prenom, email, ${passwordColumn}, telephone, id_role, id_direction, actif)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [nom, prenom, email, mot_de_passe, telephone || null, id_role || null, id_direction || null]
  );
  return result.insertId;
};

const update = async (id, fields) => {
  if (Object.keys(fields).length === 0) return;
  const updates = Object.keys(fields).map(k => `${k} = ?`);
  const values = Object.values(fields);
  await pool.execute(
    `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id_utilisateur = ?`,
    [...values, id]
  );
};

const updatePassword = async (id, mot_de_passe) => {
  const passwordColumn = await getPasswordColumn();
  await pool.execute(
    `UPDATE utilisateurs SET ${passwordColumn} = ? WHERE id_utilisateur = ?`,
    [mot_de_passe, id]
  );
};

const getPassword = async (id) => {
  const passwordColumn = await getPasswordColumn();
  const [rows] = await pool.execute(
    `SELECT ${passwordColumn} as mot_de_passe FROM utilisateurs WHERE id_utilisateur = ?`,
    [id]
  );
  return rows;
};

const updateLastConnection = async (id) => {
  try {
    await pool.execute('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id_utilisateur = ?', [id]);
  } catch (_) {}
};

const toggleActif = async (id, actif) => {
  await pool.execute('UPDATE utilisateurs SET actif = ? WHERE id_utilisateur = ?', [actif ? 1 : 0, id]);
};

const deleteById = async (id) => {
  await pool.execute('DELETE FROM utilisateurs WHERE id_utilisateur = ?', [id]);
};

const countAll = async () => {
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM utilisateurs');
  return rows[0].count;
};

const countActifs = async () => {
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM utilisateurs WHERE actif = 1');
  return rows[0].count;
};

const countByRole = async () => {
  const [rows] = await pool.execute(
    `SELECT r.nom_role, COUNT(u.id_utilisateur) as count
     FROM roles r LEFT JOIN utilisateurs u ON r.id_role = u.id_role
     GROUP BY r.id_role`
  );
  return rows;
};

const findByDirection = async (id_direction) => {
  const [rows] = await pool.execute(
    `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.actif,
            COALESCE(r.nom_role, 'agent') as nom_role
     FROM utilisateurs u
     LEFT JOIN roles r ON u.id_role = r.id_role
     WHERE u.id_direction = ? AND u.actif = 1
     ORDER BY u.nom, u.prenom`,
    [id_direction]
  );
  return rows;
};

const findSansDirection = async () => {
  const [rows] = await pool.execute(
    `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
            COALESCE(r.nom_role, 'agent') as nom_role
     FROM utilisateurs u
     LEFT JOIN roles r ON u.id_role = r.id_role
     WHERE (u.id_direction IS NULL OR u.id_direction = '') AND u.actif = 1
     ORDER BY u.nom, u.prenom`
  );
  return rows;
};

const findAgentsDisponibles = async (id_direction) => {
  let query = `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, d.nom_direction
               FROM utilisateurs u
               LEFT JOIN directions d ON u.id_direction = d.id_direction
               JOIN roles r ON u.id_role = r.id_role
               WHERE (r.nom_role = 'agent' OR r.nom_role = 'agent_terrain') AND u.actif = 1`;
  const params = [];
  if (id_direction) {
    query += ' AND u.id_direction = ?';
    params.push(id_direction);
  }
  const [rows] = await pool.execute(query, params);
  return rows;
};

// === Password Reset Tokens ===

const createResetToken = async (id_utilisateur, token) => {
  await pool.execute(
    'INSERT INTO password_reset_tokens (id_utilisateur, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
    [id_utilisateur, token]
  );
};

const findValidResetToken = async (token) => {
  const [rows] = await pool.execute(
    `SELECT prt.id, prt.id_utilisateur, prt.token, prt.expires_at, prt.used,
            u.nom, u.prenom, u.email
     FROM password_reset_tokens prt
     JOIN utilisateurs u ON prt.id_utilisateur = u.id_utilisateur
     WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  return rows;
};

const markTokenAsUsed = async (token) => {
  await pool.execute(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
    [token]
  );
};

const deleteExpiredTokens = async () => {
  await pool.execute(
    'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE'
  );
};

const debugResetToken = async (tokenHash) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, id_utilisateur, LEFT(token, 16) as token_start, expires_at, used, date_creation
       FROM password_reset_tokens
       WHERE token = ?
       LIMIT 1`,
      [tokenHash]
    );
    return rows.length > 0 ? rows[0] : 'Aucun token trouvé avec ce hash';
  } catch (err) {
    return 'Erreur debug: ' + err.message;
  }
};

const getPasswordColumn = async () => {
  try {
    const [rows] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'utilisateurs' AND (COLUMN_NAME = 'mot_de_passe' OR COLUMN_NAME = 'password')`
    );
    return rows[0]?.COLUMN_NAME || 'password';
  } catch {
    return 'password';
  }
};

module.exports = {
  findByEmail, findByEmailWithPassword, findById, findByIdBasic,
  findAll, create, update, updatePassword, getPassword,
  updateLastConnection, toggleActif, deleteById,
  countAll, countActifs, countByRole,
  findByDirection, findSansDirection, findAgentsDisponibles,
  createResetToken, findValidResetToken, markTokenAsUsed, deleteExpiredTokens, debugResetToken
};
