-- ============================================
-- SYSTÈME DE GESTION DES DOLÉANCES CITOYENNES
-- Script complet de création de la base de données
-- ============================================

-- Supprimer la base de données si elle existe
DROP DATABASE IF EXISTS gestion_doleances;

-- Créer la base de données
CREATE DATABASE gestion_doleances
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE gestion_doleances;

-- ============================================
-- 1. TABLES PRINCIPALES
-- ============================================

-- Table des rôles
CREATE TABLE roles (
    id_role INT PRIMARY KEY AUTO_INCREMENT,
    nom_role VARCHAR(100) NOT NULL,
    description TEXT
);

-- Table des directions
CREATE TABLE directions (
    id_direction INT PRIMARY KEY AUTO_INCREMENT,
    nom_direction VARCHAR(100) NOT NULL,
    description TEXT
);

-- Table des utilisateurs
CREATE TABLE utilisateurs (
    id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    id_role INT,
    id_direction INT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    telephone VARCHAR(30),
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES roles(id_role),
    FOREIGN KEY (id_direction) REFERENCES directions(id_direction)
);

-- Table des citoyens
CREATE TABLE citoyens (
    id_citoyen INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telephone VARCHAR(30),
    adresse TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des arrondissements
CREATE TABLE arrondissements (
    id_arrondissement INT PRIMARY KEY AUTO_INCREMENT,
    nom_arrondissement VARCHAR(100) NOT NULL
);

-- Table des quartiers
CREATE TABLE quartiers (
    id_quartier INT PRIMARY KEY AUTO_INCREMENT,
    id_arrondissement INT,
    nom_quartier VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_arrondissement) REFERENCES arrondissements(id_arrondissement)
);

-- Table des catégories de doléances
CREATE TABLE categories_doleance (
    id_categorie INT PRIMARY KEY AUTO_INCREMENT,
    nom_categorie VARCHAR(100) NOT NULL,
    description TEXT
);

-- Table des statuts
CREATE TABLE statuts (
    id_statut INT PRIMARY KEY AUTO_INCREMENT,
    nom_statut VARCHAR(50) NOT NULL,
    couleur VARCHAR(20)
);

-- Table des priorités
CREATE TABLE priorites (
    id_priorite INT PRIMARY KEY AUTO_INCREMENT,
    nom_priorite VARCHAR(50) NOT NULL,
    niveau INT
);

-- ============================================
-- 2. TABLE CENTRALE : DOLÉANCES
-- ============================================

CREATE TABLE doleances (
    id_doleance INT PRIMARY KEY AUTO_INCREMENT,
    id_citoyen INT,
    id_categorie INT,
    id_statut INT,
    id_priorite INT,
    id_direction INT,
    id_quartier INT,
    reference VARCHAR(50) UNIQUE,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_citoyen) REFERENCES citoyens(id_citoyen),
    FOREIGN KEY (id_categorie) REFERENCES categories_doleance(id_categorie),
    FOREIGN KEY (id_statut) REFERENCES statuts(id_statut),
    FOREIGN KEY (id_priorite) REFERENCES priorites(id_priorite),
    FOREIGN KEY (id_direction) REFERENCES directions(id_direction),
    FOREIGN KEY (id_quartier) REFERENCES quartiers(id_quartier)
);

-- ============================================
-- 3. TABLES DE TRAITEMENT
-- ============================================

-- Table des réponses
CREATE TABLE reponses (
    id_reponse INT PRIMARY KEY AUTO_INCREMENT,
    id_doleance INT,
    id_utilisateur INT,
    message TEXT NOT NULL,
    date_reponse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

-- Table des assignations
CREATE TABLE assignations (
    id_assignation INT PRIMARY KEY AUTO_INCREMENT,
    id_doleance INT,
    id_utilisateur INT,
    commentaire TEXT,
    date_assignation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

-- Table de l'historique des statuts
CREATE TABLE historique_statuts (
    id_historique INT PRIMARY KEY AUTO_INCREMENT,
    id_doleance INT,
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance)
);

-- Table des transferts entre directions
CREATE TABLE transferts (
    id_transfert INT PRIMARY KEY AUTO_INCREMENT,
    id_doleance INT,
    direction_source VARCHAR(100),
    direction_destination VARCHAR(100),
    motif TEXT,
    date_transfert TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance)
);

-- Table des pièces jointes
CREATE TABLE pieces_jointes (
    id_piece INT PRIMARY KEY AUTO_INCREMENT,
    id_doleance INT,
    nom_fichier VARCHAR(255),
    chemin VARCHAR(500),
    type_fichier VARCHAR(50),
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance)
);

-- Table des commentaires internes
CREATE TABLE commentaires_internes (
    id_commentaire INT PRIMARY KEY AUTO_INCREMENT,
    id_doleance INT,
    id_utilisateur INT,
    contenu TEXT NOT NULL,
    date_commentaire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

-- Table des notifications
CREATE TABLE notifications (
    id_notification INT PRIMARY KEY AUTO_INCREMENT,
    id_doleance INT,
    id_utilisateur INT,
    titre VARCHAR(200),
    message TEXT,
    lu BOOLEAN DEFAULT FALSE,
    date_notification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doleance) REFERENCES doleances(id_doleance),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

-- Table des logs d'activités
CREATE TABLE logs_activites (
    id_log INT PRIMARY KEY AUTO_INCREMENT,
    id_utilisateur INT,
    action VARCHAR(255),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adresse_ip VARCHAR(45),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

-- ============================================
-- 4. INSERTION DES DONNÉES INITIALES
-- ============================================

-- Insertion des rôles
INSERT INTO roles (id_role, nom_role, description) VALUES
(1, 'citoyen', 'Utilisateur standard - peut déposer des doléances'),
(2, 'agent', 'Agent de traitement - peut traiter les doléances'),
(3, 'directeur', 'Directeur de direction - supervise les traitements'),
(4, 'administrateur', 'Administrateur système - gère le système'),
(5, 'maire', 'Maire - validation finale');

-- Insertion des statuts
INSERT INTO statuts (id_statut, nom_statut, couleur) VALUES
(1, 'Nouvelle', '#FF9800'),
(2, 'En attente', '#FFC107'),
(3, 'Assignee', '#2196F3'),
(4, 'En traitement', '#9C27B0'),
(5, 'Resolue', '#4CAF50'),
(6, 'Cloturee', '#9E9E9E');

-- Insertion des priorités
INSERT INTO priorites (id_priorite, nom_priorite, niveau) VALUES
(1, 'Basse', 1),
(2, 'Moyenne', 2),
(3, 'Haute', 3),
(4, 'Urgente', 4);

-- Insertion des catégories
INSERT INTO categories_doleance (id_categorie, nom_categorie, description) VALUES
(1, 'Voirie', 'Problemes de routes et trottoirs'),
(2, 'Eclairage public', 'Pannes d\'eclairage'),
(3, 'Salubrite', 'Proprete et dechets'),
(4, 'Espaces verts', 'Parcs et jardins'),
(5, 'Transport', 'Problemes de transport'),
(6, 'Securite', 'Problemes de securite');

-- Insertion des directions
INSERT INTO directions (id_direction, nom_direction, description) VALUES
(1, 'Direction de la Voirie', 'Gestion des routes et infrastructures'),
(2, 'Direction de l\'Environnement', 'Gestion des espaces verts et salubrite'),
(3, 'Direction de la Securite', 'Gestion de la securite publique'),
(4, 'Direction des Transports', 'Gestion des transports urbains'),
(5, 'Direction des Services Techniques', 'Gestion technique de la ville');

-- Insertion des arrondissements
INSERT INTO arrondissements (id_arrondissement, nom_arrondissement) VALUES
(1, 'Centre'),
(2, 'Nord'),
(3, 'Sud'),
(4, 'Est'),
(5, 'Ouest');

-- Insertion des quartiers
INSERT INTO quartiers (id_arrondissement, nom_quartier) VALUES
(1, 'Quartier Central'),
(1, 'Quartier Administratif'),
(2, 'Quartier Industriel'),
(2, 'Quartier Residentiel Nord'),
(3, 'Quartier Residentiel Sud'),
(3, 'Quartier Commercial'),
(4, 'Quartier Residentiel Est'),
(4, 'Zone d\'Activites'),
(5, 'Quartier Residentiel Ouest'),
(5, 'Zone Touristique');

-- Insertion d'un utilisateur administrateur par défaut
-- Mot de passe: admin123 (hash bcrypt)
INSERT INTO utilisateurs (id_utilisateur, id_role, nom, prenom, email, mot_de_passe, actif) VALUES
(1, 4, 'Admin', 'Systeme', 'admin@mairie.com', '$2a$10$rVqZqMqQqQqQqQqQqQqQq', 1);

-- Insertion d'un agent exemple
INSERT INTO utilisateurs (id_utilisateur, id_role, id_direction, nom, prenom, email, mot_de_passe, actif) VALUES
(2, 2, 1, 'Dupont', 'Jean', 'jean.dupont@mairie.com', '$2a$10$rVqZqMqQqQqQqQqQqQqQq', 1);

-- Insertion d'un directeur exemple
INSERT INTO utilisateurs (id_utilisateur, id_role, id_direction, nom, prenom, email, mot_de_passe, actif) VALUES
(3, 3, 1, 'Martin', 'Sophie', 'sophie.martin@mairie.com', '$2a$10$rVqZqMqQqQqQqQqQqQqQq', 1);

-- ============================================
-- 5. EXEMPLES DE DONNÉES DE TEST
-- ============================================

-- Insertion d'un citoyen exemple
INSERT INTO citoyens (nom, prenom, email, telephone, adresse) VALUES
('Durand', 'Marie', 'marie.durand@email.com', '0612345678', '12 Rue de la Paix, Centre');

-- Insertion d'une doléance exemple
INSERT INTO doleances (
    reference, titre, description, id_citoyen, id_categorie, 
    id_statut, id_priorite, id_direction, id_quartier
) VALUES (
    'DOL-202401-0001', 
    'Nid-de-poule dangereux', 
    'Un nid-de-poule s\'est forme rue de la Republique. Il presente un danger pour les cyclistes.',
    1, 1, 1, 2, 1, 1
);

-- ============================================
-- 6. CRÉATION DES VUES (OPTIONNELLES)
-- ============================================

-- Vue pour les statistiques des doléances
CREATE VIEW vue_stats_doleances AS
SELECT 
    DATE(date_creation) as date,
    COUNT(*) as total,
    SUM(CASE WHEN id_statut IN (1,2,3,4) THEN 1 ELSE 0 END) as en_cours,
    SUM(CASE WHEN id_statut IN (5,6) THEN 1 ELSE 0 END) as resolues,
    SUM(CASE WHEN id_priorite = 4 THEN 1 ELSE 0 END) as urgentes
FROM doleances
GROUP BY DATE(date_creation)
ORDER BY date DESC;

-- Vue pour les doléances par catégorie
CREATE VIEW vue_doleances_categorie AS
SELECT 
    c.nom_categorie,
    COUNT(d.id_doleance) as nombre,
    ROUND(COUNT(d.id_doleance) * 100.0 / (SELECT COUNT(*) FROM doleances), 2) as pourcentage
FROM categories_doleance c
LEFT JOIN doleances d ON c.id_categorie = d.id_categorie
GROUP BY c.id_categorie;

-- ============================================
-- 7. CRÉATION DES INDEX POUR OPTIMISATION
-- ============================================

-- Index sur les dates
CREATE INDEX idx_doleances_date ON doleances(date_creation);
CREATE INDEX idx_doleances_update ON doleances(date_mise_a_jour);

-- Index sur les clés étrangères
CREATE INDEX idx_doleances_citoyen ON doleances(id_citoyen);
CREATE INDEX idx_doleances_statut ON doleances(id_statut);
CREATE INDEX idx_doleances_categorie ON doleances(id_categorie);
CREATE INDEX idx_doleances_priorite ON doleances(id_priorite);
CREATE INDEX idx_doleances_direction ON doleances(id_direction);

-- Index pour les recherches
CREATE INDEX idx_doleances_reference ON doleances(reference);
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_notifications_user ON notifications(id_utilisateur, lu);

-- Index pour les logs
CREATE INDEX idx_logs_date ON logs_activites(date_action);
CREATE INDEX idx_logs_utilisateur ON logs_activites(id_utilisateur);

-- ============================================
-- 8. TRIGGERS (OPTIONNELS)
-- ============================================

-- Trigger pour mettre à jour la date de mise à jour automatiquement
DELIMITER //
CREATE TRIGGER update_doleance_timestamp
BEFORE UPDATE ON doleances
FOR EACH ROW
BEGIN
    SET NEW.date_mise_a_jour = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Trigger pour logger les changements de statut
DELIMITER //
CREATE TRIGGER log_statut_change
AFTER UPDATE ON doleances
FOR EACH ROW
BEGIN
    IF OLD.id_statut != NEW.id_statut THEN
        INSERT INTO historique_statuts (id_doleance, ancien_statut, nouveau_statut)
        VALUES (
            NEW.id_doleance,
            (SELECT nom_statut FROM statuts WHERE id_statut = OLD.id_statut),
            (SELECT nom_statut FROM statuts WHERE id_statut = NEW.id_statut)
        );
    END IF;
END//
DELIMITER ;

-- ============================================
-- 9. PERMISSIONS ET UTILISATEURS
-- ============================================

-- Créer un utilisateur dédié pour l'application
CREATE USER IF NOT EXISTS 'doleances_app'@'localhost' IDENTIFIED BY 'doleances123';

-- Donner les droits nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON gestion_doleances.* TO 'doleances_app'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Vérification rapide
SELECT 'Base de données créée avec succès !' as Message;
SELECT COUNT(*) as Nombre_roles FROM roles;
SELECT COUNT(*) as Nombre_statuts FROM statuts;
SELECT COUNT(*) as Nombre_priorites FROM priorites;
SELECT COUNT(*) as Nombre_categories FROM categories_doleance;
SELECT COUNT(*) as Nombre_utilisateurs FROM utilisateurs;