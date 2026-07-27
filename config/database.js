const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_doleances',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Insertion des données initiales
const insertInitialData = async () => {
  try {
    // Insertion des rôles
    await promisePool.execute(`
      INSERT IGNORE INTO roles (id_role, nom_role, description) VALUES
      (1, 'citoyen', 'Utilisateur standard - peut déposer des doléances'),
      (2, 'agent', 'Agent de traitement - peut traiter les doléances'),
      (3, 'directeur', 'Directeur de direction - supervise les traitements'),
      (4, 'administrateur_systeme', 'Administrateur système - gère tout le système'),
      (5, 'maire', 'Maire - validation finale et supervision'),
      (6, 'agent_central', 'Agent central - transfert des doléances'),
      (7, 'secretaire_general', 'Secrétaire général - coordination')
    `);
    
    // Insertion des statuts
    await promisePool.execute(`
      INSERT IGNORE INTO statuts (id_statut, nom_statut, description, couleur, ordre) VALUES
      (1, 'Nouvelle', 'Doléance récemment déposée', '#FF9800', 1),
      (2, 'En attente', 'En attente de traitement', '#FFC107', 2),
      (3, 'Assignée', 'Assignée à un agent', '#2196F3', 3),
      (4, 'En traitement', 'En cours de traitement', '#9C27B0', 4),
      (5, 'Résolue', 'Problème résolu', '#4CAF50', 5),
      (6, 'Clôturée', 'Doléance clôturée', '#9E9E9E', 6),
      (7, 'Rejetée', 'Doléance rejetée', '#F44336', 7),
      (8, 'transferee', 'Doléance transférée vers une direction', '#7C3AED', 8),
      (9, 'Urgente', 'Doléance nécessitant une intervention urgente', '#DC2626', 9)
    `);
    
    // Insertion des priorités
    await promisePool.execute(`
      INSERT IGNORE INTO priorites (id_priorite, nom_priorite, niveau, delai_traitement_heures, couleur) VALUES
      (1, 'Basse', 1, 168, '#4CAF50'),
      (2, 'Moyenne', 2, 72, '#FFC107'),
      (3, 'Haute', 3, 48, '#FF9800'),
      (4, 'Urgente', 4, 24, '#F44336')
    `);
    
    // Insertion des catégories
    // await promisePool.execute(`
    //   INSERT IGNORE INTO categories_doleance (id_categorie, nom_categorie, nom_malgache, description, direction_concernee, couleur, icone, module, actif) VALUES
    //   (1, 'Voirie', 'Lalana', 'Problèmes de routes, trottoirs et signalisation', 'Direction de la Voirie', '#2196F3', 'road', 'CUA', 1),
    //   (2, 'Éclairage public', 'Jiro', "Pannes d'éclairage et lampadaires", 'Direction de la Voirie', '#FFC107', 'lightbulb', 'CUA', 1),
    //   (3, 'Salubrité', 'Hadioana', 'Propreté, déchets et nuisance', "Direction de l'Environnement", '#4CAF50', 'trash', 'CUA', 1),
    //   (4, 'Espaces verts', 'Faritra maitso', 'Parcs, jardins et espaces naturels', "Direction de l'Environnement", '#8BC34A', 'tree', 'CUA', 1),
    //   (5, 'Transport', 'Fifindrana', 'Problèmes de transport en commun', 'Direction des Transports', '#9C27B0', 'bus', 'CUA', 1),
    //   (6, 'Sécurité', 'Fiarovana', 'Problèmes de sécurité publique', 'Direction de la Sécurité', '#F44336', 'security', 'CUA', 1),
    //   (7, 'Urbanisme', 'Fandaminana ny tanàna', 'Permis de construire et aménagement', "Direction de l'Urbanisme", '#795548', 'building', 'CUA', 1),
    //   (8, 'Social', 'Sosialy', 'Aides sociales et services publics', 'Direction des Affaires Sociales', '#E91E63', 'people', 'CUA', 1),
    //   (9, 'Incendie', 'Afo', 'Incendies domestiques et industriels', 'Chef de corps des Sapeurs Pompiers', '#EF4444', 'fire', 'Sapeurs-Pompiers', 1),
    //   (10, 'Accident de circulation', 'Loza', 'Accidents de la route et secours', 'Chef de corps des Sapeurs Pompiers', '#F97316', 'accident', 'Sapeurs-Pompiers', 1),
    //   (11, 'Secours à personne', 'Fanavotana', 'Personnes en danger ou blessées', 'Chef de corps des Sapeurs Pompiers', '#3B82F6', 'medical', 'Sapeurs-Pompiers', 1),
    //   (12, 'Inondation', 'Tondra-drano', 'Zones inondées et assistance', 'Chef de corps des Sapeurs Pompiers', '#06B6D4', 'flood', 'Sapeurs-Pompiers', 1),
    //   (13, 'Catastrophe naturelle', 'Loza voajanahary', 'Tremblements de terre, cyclones', 'Chef de corps des Sapeurs Pompiers', '#8B5CF6', 'disaster', 'Sapeurs-Pompiers', 1),
    //   (14, 'Animal dangereux', 'Biby mampidi-doza', 'Animaux errants ou dangereux', 'Chef de corps des Sapeurs Pompiers', '#84CC16', 'animal', 'Sapeurs-Pompiers', 1),
    //   (15, 'Produit dangereux', 'Zavatra mampidi-doza', 'Fuite de gaz, produits chimiques', 'Chef de corps des Sapeurs Pompiers', '#EC4899', 'hazard', 'Sapeurs-Pompiers', 1),
    //   (16, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', NULL, '#6B7280', 'other', 'CUA', 1),
    //   (17, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', 'Chef de corps des Sapeurs Pompiers', '#6B7280', 'other', 'Sapeurs-Pompiers', 1)
    // `);
    
    // Insertion des directions
    // await promisePool.execute(`
    //   INSERT IGNORE INTO directions (id_direction, nom_direction, description) VALUES
    //   (1, 'Direction de la Voirie', 'Gestion des routes et infrastructures routières'),
    //   (2, "Direction de l'Environnement", 'Gestion des espaces verts et de la propreté'),
    //   (3, 'Direction de la Sécurité', 'Gestion de la sécurité publique'),
    //   (4, 'Direction des Transports', 'Gestion des transports urbains'),
    //   (5, "Direction de l'Urbanisme", 'Gestion des permis et de l aménagement'),
    //   (6, 'Direction des Affaires Sociales', 'Gestion des aides sociales'),
    //   (7, 'Direction des Services Techniques', 'Gestion technique de la ville'),
    //   (35, 'Chef de corps des Sapeurs Pompiers', 'Incendies, secours et protection civile')
    // `);

    // Mise à jour des emails et infos des directions
    await promisePool.execute(`
      UPDATE directions SET email = 'voirie@mairie-tnr.mg', telephone = '+261 34 00 001', categorie = 'Technique', responsable = 'Directeur Voirie' WHERE id_direction = 1
    `).catch(() => {});
    await promisePool.execute(`
      UPDATE directions SET email = 'environnement@mairie-tnr.mg', telephone = '+261 34 00 002', categorie = 'Environnement', responsable = 'Directeur Environnement' WHERE id_direction = 2
    `).catch(() => {});
    await promisePool.execute(`
      UPDATE directions SET email = 'securite@mairie-tnr.mg', telephone = '+261 34 00 003', categorie = 'Sécurité', responsable = 'Directeur Sécurité' WHERE id_direction = 3
    `).catch(() => {});
    await promisePool.execute(`
      UPDATE directions SET email = 'transports@mairie-tnr.mg', telephone = '+261 34 00 004', categorie = 'Transport', responsable = 'Directeur Transport' WHERE id_direction = 4
    `).catch(() => {});
    await promisePool.execute(`
      UPDATE directions SET email = 'urbanisme@mairie-tnr.mg', telephone = '+261 34 00 005', categorie = 'Urbanisme', responsable = 'Directeur Urbanisme' WHERE id_direction = 5
    `).catch(() => {});
    await promisePool.execute(`
      UPDATE directions SET email = 'social@mairie-tnr.mg', telephone = '+261 34 00 006', categorie = 'Social', responsable = 'Directeur Affaires Sociales' WHERE id_direction = 6
    `).catch(() => {});
    await promisePool.execute(`
      UPDATE directions SET email = 'technique@mairie-tnr.mg', telephone = '+261 34 00 007', categorie = 'Technique', responsable = 'Directeur Services Techniques' WHERE id_direction = 7
    `).catch(() => {});
    await promisePool.execute(`
      UPDATE directions SET actif = 1, email = 'sapeurs-pompiers@mairie-tnr.mg', telephone = '+261 34 18', categorie = 'Sécurité', responsable = 'Chef de corps des Sapeurs Pompiers' WHERE id_direction = 35
    `).catch(() => {});
    
    // Insertion des arrondissements
    await promisePool.execute(`
      INSERT IGNORE INTO arrondissements (id_arrondissement, nom_arrondissement, code) VALUES
      (1, 'Centre', '75001'),
      (2, 'Nord', '75002'),
      (3, 'Sud', '75003'),
      (4, 'Est', '75004'),
      (5, 'Ouest', '75005')
    `);
    
    // Insertion des quartiers
    await promisePool.execute(`
      INSERT IGNORE INTO quartiers (id_arrondissement, nom_quartier, code_postal) VALUES
      (1, 'Quartier Central', '75001'),
      (1, 'Quartier Administratif', '75001'),
      (2, 'Quartier Industriel', '75002'),
      (2, 'Quartier Résidentiel Nord', '75002'),
      (3, 'Quartier Résidentiel Sud', '75003'),
      (3, 'Quartier Commercial', '75003'),
      (4, 'Quartier Résidentiel Est', '75004'),
      (4, "Zone d'Activités", '75004'),
      (5, 'Quartier Résidentiel Ouest', '75005'),
      (5, 'Zone Touristique', '75005')
    `);
    
    // Insertion des catégories Sapeurs-Pompiers (si absentes)
    // await promisePool.execute(`
    //   INSERT IGNORE INTO categories_doleance (id_categorie, nom_categorie, nom_malgache, description, direction_concernee, couleur, icone, module, actif) VALUES
    //   (30, 'Incendie', 'Afo', 'Incendies domestiques et industriels', 'Chef de corps des Sapeurs Pompiers', '#EF4444', 'fire', 'Sapeurs-Pompiers', 1),
    //   (31, 'Accident de circulation', 'Loza', 'Accidents de la route et secours', 'Chef de corps des Sapeurs Pompiers', '#F97316', 'accident', 'Sapeurs-Pompiers', 1),
    //   (32, 'Secours à personne', 'Fanavotana', 'Personnes en danger ou blessées', 'Chef de corps des Sapeurs Pompiers', '#3B82F6', 'medical', 'Sapeurs-Pompiers', 1),
    //   (33, 'Inondation', 'Tondra-drano', 'Zones inondées et assistance', 'Chef de corps des Sapeurs Pompiers', '#06B6D4', 'flood', 'Sapeurs-Pompiers', 1),
    //   (34, 'Catastrophe naturelle', 'Loza voajanahary', 'Tremblements de terre, cyclones', 'Chef de corps des Sapeurs Pompiers', '#8B5CF6', 'disaster', 'Sapeurs-Pompiers', 1),
    //   (35, 'Animal dangereux', 'Biby mampidi-doza', 'Animaux errants ou dangereux', 'Chef de corps des Sapeurs Pompiers', '#84CC16', 'animal', 'Sapeurs-Pompiers', 1),
    //   (36, 'Produit dangereux', 'Zavatra mampidi-doza', 'Fuite de gaz, produits chimiques', 'Chef de corps des Sapeurs Pompiers', '#EC4899', 'hazard', 'Sapeurs-Pompiers', 1),
    //   (37, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', NULL, '#6B7280', 'clipboard', 'Sapeurs-Pompiers', 1),
    //   (38, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', NULL, '#6B7280', 'clipboard', 'CUA', 1)
    // `).catch(() => {});

    // Insertion de l'administrateur par défaut (mot de passe: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await promisePool.execute(`
      INSERT IGNORE INTO utilisateurs (id_utilisateur, id_role, nom, prenom, email, password, actif) VALUES
      (1, 4, 'Admin', 'Système', 'admin@mairie.com', ?, 1)
    `, [hashedPassword]);
    
    console.log('✅ Données initiales insérées avec succès');
  } catch (error) {
    console.error('Erreur insertion données initiales:', error);
  }
};

// Création des tables
const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS roles (
      id_role INT PRIMARY KEY AUTO_INCREMENT,
      nom_role VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      permissions JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS directions (
      id_direction INT PRIMARY KEY AUTO_INCREMENT,
      nom_direction VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS utilisateurs (
      id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
      id_role INT,
      id_direction INT,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      telephone VARCHAR(30),
      actif BOOLEAN DEFAULT TRUE,
      derniere_connexion TIMESTAMP NULL,
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_role) REFERENCES roles(id_role),
      FOREIGN KEY (id_direction) REFERENCES directions(id_direction)
    )`,
    
    `CREATE TABLE IF NOT EXISTS citoyens (
      id_citoyen INT PRIMARY KEY AUTO_INCREMENT,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(150),
      telephone VARCHAR(30),
      adresse TEXT,
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS arrondissements (
      id_arrondissement INT PRIMARY KEY AUTO_INCREMENT,
      nom_arrondissement VARCHAR(100) NOT NULL,
      code VARCHAR(10)
    )`,
    
    `CREATE TABLE IF NOT EXISTS quartiers (
      id_quartier INT PRIMARY KEY AUTO_INCREMENT,
      id_arrondissement INT,
      nom_quartier VARCHAR(100) NOT NULL,
      code_postal VARCHAR(10),
      FOREIGN KEY (id_arrondissement) REFERENCES arrondissements(id_arrondissement)
    )`,
    
    `CREATE TABLE IF NOT EXISTS categories_doleance (
      id_categorie INT PRIMARY KEY AUTO_INCREMENT,
      nom_categorie VARCHAR(100) NOT NULL,
      description TEXT,
      couleur VARCHAR(20),
      icone VARCHAR(50)
    )`,
    
    `CREATE TABLE IF NOT EXISTS statuts (
      id_statut INT PRIMARY KEY AUTO_INCREMENT,
      nom_statut VARCHAR(50) NOT NULL,
      description TEXT,
      couleur VARCHAR(20),
      ordre INT DEFAULT 0
    )`,
    
    `CREATE TABLE IF NOT EXISTS priorites (
      id_priorite INT PRIMARY KEY AUTO_INCREMENT,
      nom_priorite VARCHAR(50) NOT NULL,
      niveau INT UNIQUE,
      delai_traitement_heures INT,
      couleur VARCHAR(20)
    )`,
    
    `CREATE TABLE IF NOT EXISTS doleances (
      id_doleance INT PRIMARY KEY AUTO_INCREMENT,
      reference VARCHAR(50) UNIQUE NOT NULL,
      titre VARCHAR(200) NOT NULL,
      description TEXT,
      id_citoyen INT,
      id_categorie INT,
      id_statut INT,
      id_priorite INT,
      id_direction INT,
      id_quartier INT,
      id_utilisateur_assignee INT,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      date_resolution TIMESTAMP NULL,
      satisfaction_note INT CHECK (satisfaction_note BETWEEN 1 AND 5),
      satisfaction_commentaire TEXT,
      lieu_exact TEXT,
      suggestions TEXT,
      FOREIGN KEY (id_citoyen) REFERENCES citoyens(id_citoyen),
      FOREIGN KEY (id_categorie) REFERENCES categories_doleance(id_categorie),
      FOREIGN KEY (id_statut) REFERENCES statuts(id_statut),
      FOREIGN KEY (id_priorite) REFERENCES priorites(id_priorite),
      FOREIGN KEY (id_direction) REFERENCES directions(id_direction),
      FOREIGN KEY (id_quartier) REFERENCES quartiers(id_quartier),
      FOREIGN KEY (id_utilisateur_assignee) REFERENCES utilisateurs(id_utilisateur)
    )`,
    
    `CREATE TABLE IF NOT EXISTS reponses (
      id_reponse INT PRIMARY KEY AUTO_INCREMENT,
      id_doleance INT,
      id_utilisateur INT,
      id_citoyen INT,
      message TEXT NOT NULL,
      est_interne BOOLEAN DEFAULT FALSE,
      date_reponse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE,
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
    )`,
    
    `CREATE TABLE IF NOT EXISTS assignations (
      id_assignation INT PRIMARY KEY AUTO_INCREMENT,
      id_doleance INT,
      id_utilisateur INT,
      commentaire TEXT,
      date_assignation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE,
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
    )`,
    
    `CREATE TABLE IF NOT EXISTS historique_statuts (
      id_historique INT PRIMARY KEY AUTO_INCREMENT,
      id_doleance INT,
      id_statut_ancien INT,
      id_statut_nouveau INT,
      commentaire TEXT,
      id_utilisateur INT,
      date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE,
      FOREIGN KEY (id_statut_ancien) REFERENCES statuts(id_statut),
      FOREIGN KEY (id_statut_nouveau) REFERENCES statuts(id_statut),
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
    )`,
    
    `CREATE TABLE IF NOT EXISTS transferts (
      id_transfert INT PRIMARY KEY AUTO_INCREMENT,
      id_doleance INT,
      id_direction_source INT,
      id_direction_destination INT,
      motif TEXT,
      id_utilisateur INT,
      date_transfert TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE,
      FOREIGN KEY (id_direction_source) REFERENCES directions(id_direction),
      FOREIGN KEY (id_direction_destination) REFERENCES directions(id_direction),
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
    )`,
    
    `CREATE TABLE IF NOT EXISTS pieces_jointes (
      id_piece INT PRIMARY KEY AUTO_INCREMENT,
      id_doleance INT,
      nom_fichier VARCHAR(255) NOT NULL,
      chemin VARCHAR(500) NOT NULL,
      type_fichier VARCHAR(50),
      taille BIGINT,
      date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS commentaires_internes (
      id_commentaire INT PRIMARY KEY AUTO_INCREMENT,
      id_doleance INT,
      id_utilisateur INT,
      contenu TEXT NOT NULL,
      date_commentaire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE,
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
    )`,
    
    `CREATE TABLE IF NOT EXISTS notifications (
      id_notification INT PRIMARY KEY AUTO_INCREMENT,
      id_destinataire INT,
      id_doleance INT,
      type VARCHAR(50),
      titre VARCHAR(200),
      message TEXT,
      donnees JSON,
      lu BOOLEAN DEFAULT FALSE,
      lu_le TIMESTAMP NULL,
      date_notification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_destinataire) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS logs_activites (
      id_log INT PRIMARY KEY AUTO_INCREMENT,
      id_utilisateur INT,
      action VARCHAR(255),
      entity_type VARCHAR(50),
      entity_id INT,
      adresse_ip VARCHAR(45),
      user_agent TEXT,
      date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
    )`,
    
    `CREATE TABLE IF NOT EXISTS services (
      id_service INT PRIMARY KEY AUTO_INCREMENT,
      id_direction INT,
      nom_service VARCHAR(100) NOT NULL,
      description TEXT,
      actif BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_direction) REFERENCES directions(id_direction) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT DEFAULT NULL,
      attachment_path VARCHAR(255) DEFAULT NULL,
      attachment_name VARCHAR(255) DEFAULT NULL,
      attachment_type VARCHAR(100) DEFAULT NULL,
      attachment_size INT DEFAULT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      FOREIGN KEY (sender_id) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
      INDEX idx_chat_conversation (sender_id, receiver_id, created_at),
      INDEX idx_chat_unread (receiver_id, is_read)
    )`,
    
    `CREATE TABLE IF NOT EXISTS chat_calls (
      id INT PRIMARY KEY AUTO_INCREMENT,
      caller_id INT NOT NULL,
      callee_id INT NOT NULL,
      call_type ENUM('audio', 'video') NOT NULL DEFAULT 'audio',
      status ENUM('ringing', 'accepted', 'rejected', 'ended', 'missed') DEFAULT 'ringing',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME DEFAULT NULL,
      FOREIGN KEY (caller_id) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
      FOREIGN KEY (callee_id) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
      INDEX idx_chat_call_callee (callee_id, status)
    )`,
    
    `CREATE TABLE IF NOT EXISTS chat_signals (
      id INT PRIMARY KEY AUTO_INCREMENT,
      call_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      signal_type ENUM('offer', 'answer', 'ice-candidate', 'hangup') NOT NULL,
      signal_data MEDIUMTEXT DEFAULT NULL,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      FOREIGN KEY (call_id) REFERENCES chat_calls(id) ON DELETE CASCADE,
      INDEX idx_chat_signal_polling (call_id, receiver_id, id)
    )`
  ];
  
  for (const query of queries) {
    try {
      await promisePool.execute(query);
    } catch (error) {
      console.error('Erreur création table:', error);
    }
  }
  console.log('✅ Tables créées/vérifiées');
};

// Migration : ajout des colonnes manquantes
const runMigrations = async () => {
  const migrations = [
    `ALTER TABLE citoyens ADD COLUMN IF NOT EXISTS identifiant_citoyen VARCHAR(50) NULL AFTER id_citoyen`,
    `ALTER TABLE doleances ADD COLUMN IF NOT EXISTS date_satisfaction TIMESTAMP NULL AFTER satisfaction_commentaire`,
    `ALTER TABLE doleances ADD COLUMN IF NOT EXISTS lieu_exact TEXT AFTER longitude`,
    `ALTER TABLE doleances ADD COLUMN IF NOT EXISTS suggestions TEXT AFTER lieu_exact`,
    `ALTER TABLE directions ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE AFTER description`,
    `ALTER TABLE directions ADD COLUMN IF NOT EXISTS email VARCHAR(150) NULL AFTER actif`,
    `ALTER TABLE directions ADD COLUMN IF NOT EXISTS telephone VARCHAR(30) NULL AFTER email`,
    `ALTER TABLE directions ADD COLUMN IF NOT EXISTS categorie VARCHAR(100) NULL AFTER telephone`,
    `ALTER TABLE directions ADD COLUMN IF NOT EXISTS responsable VARCHAR(200) NULL AFTER categorie`,
    `ALTER TABLE quartiers ADD COLUMN IF NOT EXISTS latitude_centre DOUBLE NULL AFTER code_postal`,
    `ALTER TABLE quartiers ADD COLUMN IF NOT EXISTS longitude_centre DOUBLE NULL AFTER latitude_centre`,
    `ALTER TABLE quartiers ADD COLUMN IF NOT EXISTS boundary JSON NULL AFTER longitude_centre`,
    `ALTER TABLE doleances ADD COLUMN IF NOT EXISTS supprime TINYINT(1) DEFAULT 0 AFTER date_mise_a_jour`,
    `ALTER TABLE doleances ADD COLUMN IF NOT EXISTS date_suppression TIMESTAMP NULL AFTER supprime`,
    `ALTER TABLE categories_doleance ADD COLUMN IF NOT EXISTS nom_malgache VARCHAR(200) NULL AFTER nom_categorie`,
    `ALTER TABLE categories_doleance ADD COLUMN IF NOT EXISTS direction_concernee VARCHAR(200) NULL AFTER description`,
    `ALTER TABLE categories_doleance ADD COLUMN IF NOT EXISTS module ENUM('CUA', 'Sapeurs-Pompiers') DEFAULT 'CUA' AFTER direction_concernee`,
    `ALTER TABLE categories_doleance ADD COLUMN IF NOT EXISTS actif TINYINT(1) DEFAULT 1 AFTER module`,
    `ALTER TABLE categories_doleance ADD COLUMN IF NOT EXISTS id_direction INT NULL AFTER actif`,
    `ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system TINYINT(1) DEFAULT 0 AFTER permissions`,
    `ALTER TABLE doleances ADD COLUMN IF NOT EXISTS id_service INT NULL AFTER id_direction`,
    `ALTER TABLE reponses ADD COLUMN id_citoyen INT NULL AFTER id_utilisateur`
  ];

  // Migration pièces jointes : aligner le schéma DB avec le code
  // La table peut avoir soit l'ancien schéma (chemin_fichier, type ENUM) soit le nouveau (chemin, type_fichier)
  try {
    const [cols] = await promisePool.execute(`SHOW COLUMNS FROM pieces_jointes LIKE 'chemin'`);
    if (cols.length === 0) {
      // Ancien schéma : colonne 'chemin_fichier' existe mais pas 'chemin'
      await promisePool.execute(`ALTER TABLE pieces_jointes ADD COLUMN chemin VARCHAR(500) NULL`).catch(() => {});
      await promisePool.execute(`UPDATE pieces_jointes SET chemin = chemin_fichier WHERE chemin IS NULL`).catch(() => {});
    }
  } catch (err) {
    console.warn('⚠️ Migration pieces_jointes chemin:', err.message);
  }
  try {
    const [cols] = await promisePool.execute(`SHOW COLUMNS FROM pieces_jointes LIKE 'type_fichier'`);
    if (cols.length === 0) {
      await promisePool.execute(`ALTER TABLE pieces_jointes ADD COLUMN type_fichier VARCHAR(50) NULL`).catch(() => {});
      await promisePool.execute(`UPDATE pieces_jointes SET type_fichier = type WHERE type_fichier IS NULL`).catch(() => {});
    }
  } catch (err) {
    console.warn('⚠️ Migration pieces_jointes type_fichier:', err.message);
  }

  // Création de la table password_reset_tokens
  try {
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        id_utilisateur INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
      )
    `);
    // Index (IGNORE si existe déjà)
    try {
      await promisePool.execute('CREATE INDEX idx_reset_token ON password_reset_tokens(token)');
    } catch (_) {}
    try {
      await promisePool.execute('CREATE INDEX idx_reset_user ON password_reset_tokens(id_utilisateur)');
    } catch (_) {}
    console.log('✅ Table password_reset_tokens vérifiée');
  } catch (err) {
    console.error('Erreur création table password_reset_tokens:', err.message);
  }

  for (const sql of migrations) {
    try {
      // On tente sans IF NOT EXISTS pour MySQL/MariaDB qui ne le supporte pas toujours
      // Note: erreur 1060 = duplicate column, ignorée
      await promisePool.execute(sql.replace('ADD COLUMN IF NOT EXISTS', 'ADD COLUMN'));
    } catch (err) {
      // Ignorer si la colonne existe déjà (duplicate column)
      if (err.errno !== 1060) {
        console.warn('⚠️ Migration warning:', err.message);
      }
    }
  }

  // Index corbeille
  try {
    await promisePool.execute('CREATE INDEX idx_doleances_supprime ON doleances(supprime)');
  } catch (_) {}
  try {
    await promisePool.execute('CREATE INDEX idx_doleances_date_suppression ON doleances(date_suppression)');
  } catch (_) {}

  // S'assurer que le statut 'transferee' existe
  try {
    await promisePool.execute(`
      INSERT IGNORE INTO statuts (id_statut, nom_statut, description, couleur, ordre) 
      VALUES (8, 'transferee', 'Doléance transférée vers une direction', '#7C3AED', 8)
    `);
    console.log('✅ Statut transferee vérifié');
  } catch (err) {
    console.warn('⚠️ Statut transferee:', err.message);
  }

  // S'assurer que le statut 'Urgente' existe
  try {
    await promisePool.execute(`
      INSERT IGNORE INTO statuts (id_statut, nom_statut, description, couleur, ordre) 
      VALUES (9, 'Urgente', 'Doléance nécessitant une intervention urgente', '#DC2626', 9)
    `);
    console.log('✅ Statut Urgente vérifié');
  } catch (err) {
    console.warn('⚠️ Statut Urgente:', err.message);
  }

  // Seed des quartiers d'Antananarivo avec limites
  try {
    const [existing] = await promisePool.execute('SELECT COUNT(*) as cnt FROM quartiers');
    if (existing[0].cnt <= 10) {
      await promisePool.execute('DELETE FROM quartiers');
      await promisePool.execute('DELETE FROM arrondissements');
      await promisePool.execute(`
        INSERT IGNORE INTO arrondissements (id_arrondissement, nom_arrondissement, code) VALUES
        (1, 'Iarivo (Analakely)', 'TNR-01'),
        (2, 'Andohatapaka', 'TNR-02'),
        (3, 'Isotry', 'TNR-03'),
        (4, 'Ambohidratrimo', 'TNR-04'),
        (5, 'Ankorondrano', 'TNR-05'),
        (6, 'Ambohijanaka', 'TNR-06')
      `);
      await promisePool.execute(`
        INSERT INTO quartiers (id_arrondissement, nom_quartier, code_postal, latitude_centre, longitude_centre, boundary) VALUES
        (1, 'Analakely', '101', -18.9127, 47.5264, '[[-18.905,47.518],[-18.905,47.535],[-18.920,47.535],[-18.920,47.518],[-18.905,47.518]]'),
        (1, 'Isoraka', '101', -18.9045, 47.5210, '[[-18.898,47.514],[-18.898,47.528],[-18.912,47.528],[-18.912,47.514],[-18.898,47.514]]'),
        (1, 'Andraharo', '101', -18.9200, 47.5170, '[[-18.914,47.509],[-18.914,47.525],[-18.928,47.525],[-18.928,47.509],[-18.914,47.509]]'),
        (2, 'Ankorondrano', '101', -18.8830, 47.5220, '[[-18.875,47.513],[-18.875,47.531],[-18.892,47.531],[-18.892,47.513],[-18.875,47.513]]'),
        (2, 'Mahamasina', '101', -18.8950, 47.5280, '[[-18.888,47.520],[-18.888,47.536],[-18.903,47.536],[-18.903,47.520],[-18.888,47.520]]'),
        (3, 'Isotry', '101', -18.9080, 47.5080, '[[-18.900,47.498],[-18.900,47.516],[-18.916,47.516],[-18.916,47.498],[-18.900,47.498]]'),
        (3, 'Ankazomiriotra', '101', -18.9180, 47.5050, '[[-18.910,47.495],[-18.910,47.514],[-18.926,47.514],[-18.926,47.495],[-18.910,47.495]]'),
        (4, 'Ambohidratrimo', '102', -18.8520, 47.5050, '[[-18.838,47.493],[-18.838,47.517],[-18.866,47.517],[-18.866,47.493],[-18.838,47.493]]'),
        (4, 'Ambohimanambola', '102', -18.8650, 47.5130, '[[-18.856,47.503],[-18.856,47.523],[-18.874,47.523],[-18.874,47.503],[-18.856,47.503]]'),
        (5, 'Andohatapaka', '101', -18.8750, 47.5350, '[[-18.866,47.526],[-18.866,47.544],[-18.884,47.544],[-18.884,47.526],[-18.866,47.526]]'),
        (5, 'Ankazotoatoa', '101', -18.8700, 47.5450, '[[-18.862,47.537],[-18.862,47.553],[-18.878,47.553],[-18.878,47.537],[-18.862,47.537]]'),
        (6, 'Ambohijanaka', '101', -18.9350, 47.5180, '[[-18.926,47.508],[-18.926,47.528],[-18.944,47.528],[-18.944,47.508],[-18.926,47.508]]'),
        (6, 'Talatamaty', '101', -18.9450, 47.5120, '[[-18.937,47.502],[-18.937,47.522],[-18.953,47.522],[-18.953,47.502],[-18.937,47.502]]')
      `);
      console.log('✅ Quartiers Antananarivo initialisés');
    }
  } catch (err) {
    console.warn('⚠️ Seed quartiers:', err.message);
  }

  console.log('✅ Migrations exécutées');
};

// Initialisation complète de la base de données
const initDatabase = async () => {
  try {
    await createTables();
    await runMigrations();
    await insertInitialData();
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error);
    throw error;
  }
};

module.exports = { pool: promisePool, initDatabase };