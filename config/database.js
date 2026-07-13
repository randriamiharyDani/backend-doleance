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
      (7, 'Rejetée', 'Doléance rejetée', '#F44336', 7)
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
    await promisePool.execute(`
      INSERT IGNORE INTO categories_doleance (id_categorie, nom_categorie, description, couleur, icone) VALUES
      (1, 'Voirie', 'Problèmes de routes, trottoirs et signalisation', '#2196F3', 'road'),
      (2, 'Éclairage public', "Pannes d'éclairage et lampadaires", '#FFC107', 'lightbulb'),
      (3, 'Salubrité', 'Propreté, déchets et nuisance', '#4CAF50', 'trash'),
      (4, 'Espaces verts', 'Parcs, jardins et espaces naturels', '#8BC34A', 'tree'),
      (5, 'Transport', 'Problèmes de transport en commun', '#9C27B0', 'bus'),
      (6, 'Sécurité', 'Problèmes de sécurité publique', '#F44336', 'security'),
      (7, 'Urbanisme', 'Permis de construire et aménagement', '#795548', 'building'),
      (8, 'Social', 'Aides sociales et services publics', '#E91E63', 'people')
    `);
    
    // Insertion des directions
    await promisePool.execute(`
      INSERT IGNORE INTO directions (id_direction, nom_direction, description) VALUES
      (1, 'Direction de la Voirie', 'Gestion des routes et infrastructures routières'),
      (2, "Direction de l'Environnement", 'Gestion des espaces verts et de la propreté'),
      (3, 'Direction de la Sécurité', 'Gestion de la sécurité publique'),
      (4, 'Direction des Transports', 'Gestion des transports urbains'),
      (5, "Direction de l'Urbanisme", 'Gestion des permis et de l aménagement'),
      (6, 'Direction des Affaires Sociales', 'Gestion des aides sociales'),
      (7, 'Direction des Services Techniques', 'Gestion technique de la ville')
    `);
    
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
      taille INT,
      id_utilisateur INT,
      date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance) ON DELETE CASCADE,
      FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
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
    `ALTER TABLE directions ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE AFTER description`
  ];

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