const { pool } = require('../config/database');

const create = async (connection, { id_doleance, id_direction_source, id_direction_destination, id_utilisateur, motif }) => {
  await connection.execute(
    `INSERT INTO transferts (id_doleance, id_direction_source, id_direction_destination, id_utilisateur, motif, date_transfert)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [Number(id_doleance), id_direction_source || null, id_direction_destination ? Number(id_direction_destination) : null, Number(id_utilisateur), motif]
  );
};

module.exports = { create };
