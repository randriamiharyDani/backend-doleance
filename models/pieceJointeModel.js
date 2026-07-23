const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/doleances');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doleance-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Seules les images (JPG, PNG, GIF, WebP) sont acceptées.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
}).array('files', 5);

const insert = async (connection, { id_doleance, filename, filepath, type, taille }) => {
  const [result] = await connection.execute(
    `INSERT INTO pieces_jointes (id_doleance, nom_fichier, chemin, type_fichier, taille, date_upload)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [Number(id_doleance), filename, filepath, type, taille]
  );
  return result.insertId;
};

const findByDoleanceId = async (id_doleance) => {
  const [rows] = await pool.execute(
    `SELECT id_piece, nom_fichier, type_fichier, taille, date_upload
     FROM pieces_jointes 
     WHERE id_doleance = ?
     ORDER BY date_upload DESC`,
    [id_doleance]
  );
  return rows;
};

const findById = async (id_piece) => {
  const [rows] = await pool.execute(
    'SELECT nom_fichier, chemin FROM pieces_jointes WHERE id_piece = ?',
    [id_piece]
  );
  return rows;
};

const deleteById = async (id_piece) => {
  const [pieces] = await pool.execute('SELECT chemin FROM pieces_jointes WHERE id_piece = ?', [id_piece]);
  if (pieces.length > 0 && fs.existsSync(pieces[0].chemin)) {
    fs.unlinkSync(pieces[0].chemin);
  }
  await pool.execute('DELETE FROM pieces_jointes WHERE id_piece = ?', [id_piece]);
};

const deleteByDoleanceId = async (id_doleance) => {
  const [pieces] = await pool.execute('SELECT chemin FROM pieces_jointes WHERE id_doleance = ?', [id_doleance]);
  for (const piece of pieces) {
    try {
      if (fs.existsSync(piece.chemin)) {
        fs.unlinkSync(piece.chemin);
      }
    } catch (err) {
      console.warn('Impossible de supprimer le fichier:', piece.chemin, err.message);
    }
  }
  await pool.execute('DELETE FROM pieces_jointes WHERE id_doleance = ?', [id_doleance]);
};

const buildFileUrls = (pieces, req) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return pieces.map(piece => ({
    ...piece,
    url: `${baseUrl}/uploads/doleances/${piece.nom_fichier}`
  }));
};

module.exports = { upload, insert, findByDoleanceId, findById, deleteById, deleteByDoleanceId, buildFileUrls };
