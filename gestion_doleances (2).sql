-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 29 mai 2026 à 14:07
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gestion_doleances`
--

-- --------------------------------------------------------

--
-- Structure de la table `arrondissements`
--

CREATE TABLE `arrondissements` (
  `id_arrondissement` int(11) NOT NULL,
  `nom_arrondissement` varchar(100) NOT NULL,
  `code` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `arrondissements`
--

INSERT INTO `arrondissements` (`id_arrondissement`, `nom_arrondissement`, `code`) VALUES
(1, 'Centre', '75001'),
(2, 'Nord', '75002'),
(3, 'Sud', '75003'),
(4, 'Est', '75004'),
(5, 'Ouest', '75005');

-- --------------------------------------------------------

--
-- Structure de la table `assignations`
--

CREATE TABLE `assignations` (
  `id_assignation` int(11) NOT NULL,
  `id_doleance` int(11) DEFAULT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `date_assignation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `categories_doleance`
--

CREATE TABLE `categories_doleance` (
  `id_categorie` int(11) NOT NULL,
  `nom_categorie` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `couleur` varchar(20) DEFAULT NULL,
  `icone` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories_doleance`
--

INSERT INTO `categories_doleance` (`id_categorie`, `nom_categorie`, `description`, `couleur`, `icone`) VALUES
(1, 'Voirie', 'Problèmes de routes, trottoirs et signalisation', '#2196F3', 'road'),
(2, 'Éclairage public', 'Pannes d\'éclairage et lampadaires', '#FFC107', 'lightbulb'),
(3, 'Salubrité', 'Propreté, déchets et nuisance', '#4CAF50', 'trash'),
(4, 'Espaces verts', 'Parcs, jardins et espaces naturels', '#8BC34A', 'tree'),
(5, 'Transport', 'Problèmes de transport en commun', '#9C27B0', 'bus'),
(6, 'Sécurité', 'Problèmes de sécurité publique', '#F44336', 'security'),
(7, 'Urbanisme', 'Permis de construire et aménagement', '#795548', 'building'),
(8, 'Social', 'Aides sociales et services publics', '#E91E63', 'people');

-- --------------------------------------------------------

--
-- Structure de la table `citoyens`
--

CREATE TABLE `citoyens` (
  `id_citoyen` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `citoyens`
--

INSERT INTO `citoyens` (`id_citoyen`, `nom`, `prenom`, `email`, `telephone`, `adresse`, `date_creation`) VALUES
(3, 'RASAMOELISONA', 'MIHARINTSOA', NULL, '0384489198', 'Ambohimalaza', '2026-05-19 06:40:54'),
(4, 'RASAMOELISONA', 'MIHARINTSOA', NULL, 'gfgfhghjhj', 'Ambohimalaza', '2026-05-19 06:42:12'),
(5, 'RASAMOELISONA', 'MIHARINTSOA', NULL, '0384489198', 'Ambohimalaza', '2026-05-19 12:45:31'),
(6, 'Miharintsoa', 'Nantenaina', NULL, '0384489198', 'LOT, Lot LOT, Fokontany Ankadindramamy, 6ème Arrondissement (Antananarivo-Est)', '2026-05-26 06:55:28'),
(7, 'RASAMOELISONA', 'MIHARINTSOA', NULL, 'hhhvhvbhf', 'Ambohimalaza, Lot LOT, Fokontany Andraharo, 6ème Arrondissement (Antananarivo-Est)', '2026-05-28 06:05:55');

-- --------------------------------------------------------

--
-- Structure de la table `commentaires_internes`
--

CREATE TABLE `commentaires_internes` (
  `id_commentaire` int(11) NOT NULL,
  `id_doleance` int(11) DEFAULT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `contenu` text NOT NULL,
  `date_commentaire` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `directions`
--

CREATE TABLE `directions` (
  `id_direction` int(11) NOT NULL,
  `nom_direction` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `categorie` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `directions`
--

INSERT INTO `directions` (`id_direction`, `nom_direction`, `description`, `categorie`, `created_at`) VALUES
(1, 'Direction de la Voirie', 'Gestion des routes et infrastructures routières', NULL, '2026-05-19 06:31:58'),
(2, 'Direction de l\'Environnement', 'Gestion des espaces verts et de la propreté', NULL, '2026-05-19 06:31:58'),
(3, 'Direction de la Sécurité', 'Gestion de la sécurité publique', NULL, '2026-05-19 06:31:58'),
(4, 'Direction des Transports', 'Gestion des transports urbains', NULL, '2026-05-19 06:31:58'),
(5, 'Direction de l\'Urbanisme', 'Gestion des permis et de l aménagement', NULL, '2026-05-19 06:31:58'),
(6, 'Direction des Affaires Sociales', 'Gestion des aides sociales', NULL, '2026-05-19 06:31:58'),
(7, 'Direction des Services Techniques', 'Gestion technique de la ville', NULL, '2026-05-19 06:31:58'),
(8, 'Direction de la Culture', NULL, NULL, '2026-05-19 07:13:07'),
(9, 'Corps des Sapeurs Pompiers', NULL, NULL, '2026-05-19 07:13:07'),
(10, 'Corps de la Police Municipale', NULL, NULL, '2026-05-19 07:13:07'),
(11, 'PRMP', NULL, NULL, '2026-05-19 07:13:07'),
(12, 'Secrétaire Général', NULL, NULL, '2026-05-19 07:13:07'),
(13, 'Direction Affaires Juridiques et Contentieux', NULL, NULL, '2026-05-19 07:13:07'),
(14, 'Direction des Ressources Humaines', NULL, NULL, '2026-05-19 07:13:07'),
(15, 'Direction Gestion des Risques et Catastrophes', NULL, NULL, '2026-05-19 07:13:07'),
(16, 'Direction des Relations avec les Institutions', NULL, NULL, '2026-05-19 07:13:07'),
(17, 'Direction Gestion Financière', NULL, NULL, '2026-05-19 07:13:07'),
(18, 'Direction Ressources Financières', NULL, NULL, '2026-05-19 07:13:07'),
(19, 'Direction du Patrimoine', NULL, NULL, '2026-05-19 07:13:07'),
(20, 'Direction d\'Éducation Numérique et Système Informatique', NULL, NULL, '2026-05-19 07:13:07'),
(21, 'Direction des Marchés', NULL, NULL, '2026-05-19 07:13:07'),
(22, 'Direction de l\'Intendance de Palais, de la Logistique', NULL, NULL, '2026-05-19 07:13:07'),
(23, 'Directeur de Cabinet', NULL, NULL, '2026-05-19 07:13:07'),
(24, 'Adjoint Chargé des Infrastructures', NULL, NULL, '2026-05-19 07:13:07'),
(25, 'Direction Bâtiments et Travaux Publics', NULL, NULL, '2026-05-19 07:13:07'),
(26, 'Direction des Marchés Publics', NULL, NULL, '2026-05-19 07:13:07'),
(27, 'Adjoint Chargé des Affaires Socio-Culturelles', NULL, NULL, '2026-05-19 07:13:07'),
(28, 'Direction des Arts et de la Culture', NULL, NULL, '2026-05-19 07:13:07'),
(29, 'Direction des Actions Sociales et de la Santé', NULL, NULL, '2026-05-19 07:13:07'),
(30, 'Direction de l\'Eau et de l\'Assainissement', NULL, NULL, '2026-05-19 07:13:07'),
(31, 'Direction du Développement Économique', NULL, NULL, '2026-05-19 07:13:07');

-- --------------------------------------------------------

--
-- Structure de la table `doleances`
--

CREATE TABLE `doleances` (
  `id_doleance` int(11) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `titre` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `id_citoyen` int(11) DEFAULT NULL,
  `id_categorie` int(11) DEFAULT NULL,
  `id_statut` int(11) DEFAULT NULL,
  `id_priorite` int(11) DEFAULT NULL,
  `id_direction` int(11) DEFAULT NULL,
  `id_quartier` int(11) DEFAULT NULL,
  `id_utilisateur_assignee` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_mise_a_jour` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_resolution` timestamp NULL DEFAULT NULL,
  `satisfaction_note` int(11) DEFAULT NULL CHECK (`satisfaction_note` between 1 and 5),
  `satisfaction_commentaire` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `doleances`
--

INSERT INTO `doleances` (`id_doleance`, `reference`, `titre`, `description`, `id_citoyen`, `id_categorie`, `id_statut`, `id_priorite`, `id_direction`, `id_quartier`, `id_utilisateur_assignee`, `latitude`, `longitude`, `date_creation`, `date_mise_a_jour`, `date_resolution`, `satisfaction_note`, `satisfaction_commentaire`) VALUES
(3, 'DOL-20260519-5349', 'hbhjfvjhfjh', 'jkfjhvjkhfvjhjhvjhf', 3, 7, 6, 2, 5, NULL, NULL, NULL, NULL, '2026-05-19 06:40:54', '2026-05-19 09:50:45', NULL, NULL, NULL),
(4, 'DOL-20260519-6749', 'sredfghjk', 'ghghhjbjnk,jknhgvgfc', 4, 6, 5, 2, 3, NULL, NULL, NULL, NULL, '2026-05-19 06:42:12', '2026-05-19 07:29:15', NULL, NULL, NULL),
(5, 'DOL-20260519-5947', 'kodjkhjhfbjkjnvbh', ':lkjhjghjnk,l;mù', 5, 6, 1, 2, 3, NULL, NULL, NULL, NULL, '2026-05-19 12:45:31', '2026-05-19 12:45:31', NULL, NULL, NULL),
(7, 'DOL-20260528-0254', 'marché', 'dfghjk,\n\nLieu exact: Analakely\nSuggestions: dfxgchjkl', 7, 8, 1, 2, 6, 8, NULL, NULL, NULL, '2026-05-28 06:05:55', '2026-05-28 06:05:55', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `fokontany`
--

CREATE TABLE `fokontany` (
  `id_fokontany` int(11) NOT NULL,
  `id_arrondissement` int(11) NOT NULL,
  `nom_fokontany` varchar(255) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `chef_fokontany` varchar(255) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `historique_statuts`
--

CREATE TABLE `historique_statuts` (
  `id_historique` int(11) NOT NULL,
  `id_doleance` int(11) NOT NULL,
  `id_statut_ancien` int(11) DEFAULT NULL,
  `id_statut_nouveau` int(11) DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `date_changement` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `historique_statuts`
--

INSERT INTO `historique_statuts` (`id_historique`, `id_doleance`, `id_statut_ancien`, `id_statut_nouveau`, `commentaire`, `date_changement`) VALUES
(1, 3, NULL, 1, 'Création de la doléance', '2026-05-19 06:40:55'),
(2, 4, NULL, 1, 'Création de la doléance', '2026-05-19 06:42:12'),
(3, 4, NULL, 5, 'Mise à jour du statut', '2026-05-19 07:29:15'),
(4, 3, NULL, 4, 'Mise à jour du statut', '2026-05-19 07:31:05'),
(5, 3, NULL, 6, 'Mise à jour du statut', '2026-05-19 09:50:45'),
(6, 5, NULL, 1, 'Création de la doléance', '2026-05-19 12:45:32'),
(10, 7, NULL, 1, 'Création de la doléance', '2026-05-28 06:05:55');

-- --------------------------------------------------------

--
-- Structure de la table `logs_activites`
--

CREATE TABLE `logs_activites` (
  `id_log` int(11) NOT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `adresse_ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `date_action` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `logs_activites`
--

INSERT INTO `logs_activites` (`id_log`, `id_utilisateur`, `action`, `entity_type`, `entity_id`, `adresse_ip`, `user_agent`, `date_action`) VALUES
(25, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-26 06:13:41'),
(26, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-05-26 06:18:18'),
(27, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-05-26 06:23:48'),
(31, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-05-26 07:41:58'),
(35, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-05-26 08:55:11'),
(37, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-05-26 10:44:15'),
(39, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 05:59:05'),
(41, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 06:01:25'),
(43, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 06:07:17'),
(44, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 06:09:18'),
(46, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 06:30:44'),
(48, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 07:26:05'),
(50, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 07:38:30'),
(51, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 07:58:51'),
(53, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 08:06:06'),
(55, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 08:29:34'),
(56, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 10:21:22'),
(57, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 10:53:57'),
(58, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-28 11:22:04'),
(59, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-29 06:35:08'),
(60, 15, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-29 06:36:42'),
(61, 9, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-29 06:38:32'),
(62, 16, 'Connexion', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-29 06:39:32');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id_notification` int(11) NOT NULL,
  `id_destinataire` int(11) DEFAULT NULL,
  `id_doleance` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `titre` varchar(200) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `donnees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`donnees`)),
  `lu` tinyint(1) DEFAULT 0,
  `lu_le` timestamp NULL DEFAULT NULL,
  `date_notification` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications_transfert`
--

CREATE TABLE `notifications_transfert` (
  `id_notification` int(11) NOT NULL,
  `id_transfert` int(11) NOT NULL,
  `id_destinataire` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `lu` tinyint(1) DEFAULT 0,
  `date_creation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `pieces_jointes`
--

CREATE TABLE `pieces_jointes` (
  `id_piece` int(11) NOT NULL,
  `id_doleance` int(11) DEFAULT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `chemin` varchar(500) NOT NULL,
  `type_fichier` varchar(50) DEFAULT NULL,
  `taille` int(11) DEFAULT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `date_upload` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `priorites`
--

CREATE TABLE `priorites` (
  `id_priorite` int(11) NOT NULL,
  `nom_priorite` varchar(50) NOT NULL,
  `niveau` int(11) DEFAULT NULL,
  `delai_traitement_heures` int(11) DEFAULT NULL,
  `couleur` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `priorites`
--

INSERT INTO `priorites` (`id_priorite`, `nom_priorite`, `niveau`, `delai_traitement_heures`, `couleur`) VALUES
(1, 'Basse', 1, 168, '#4CAF50'),
(2, 'Moyenne', 2, 72, '#FFC107'),
(3, 'Haute', 3, 48, '#FF9800'),
(4, 'Urgente', 4, 24, '#F44336');

-- --------------------------------------------------------

--
-- Structure de la table `quartiers`
--

CREATE TABLE `quartiers` (
  `id_quartier` int(11) NOT NULL,
  `id_arrondissement` int(11) DEFAULT NULL,
  `nom_quartier` varchar(100) NOT NULL,
  `code_postal` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `quartiers`
--

INSERT INTO `quartiers` (`id_quartier`, `id_arrondissement`, `nom_quartier`, `code_postal`) VALUES
(1, 1, 'Quartier Central', '75001'),
(2, 1, 'Quartier Administratif', '75001'),
(3, 2, 'Quartier Industriel', '75002'),
(4, 2, 'Quartier Résidentiel Nord', '75002'),
(5, 3, 'Quartier Résidentiel Sud', '75003'),
(6, 3, 'Quartier Commercial', '75003'),
(7, 4, 'Quartier Résidentiel Est', '75004'),
(8, 4, 'Zone d\'Activités', '75004'),
(9, 5, 'Quartier Résidentiel Ouest', '75005'),
(10, 5, 'Zone Touristique', '75005'),
(11, 1, 'Quartier Central', '75001'),
(12, 1, 'Quartier Administratif', '75001'),
(13, 2, 'Quartier Industriel', '75002'),
(14, 2, 'Quartier Résidentiel Nord', '75002'),
(15, 3, 'Quartier Résidentiel Sud', '75003'),
(16, 3, 'Quartier Commercial', '75003'),
(17, 4, 'Quartier Résidentiel Est', '75004'),
(18, 4, 'Zone d\'Activités', '75004'),
(19, 5, 'Quartier Résidentiel Ouest', '75005'),
(20, 5, 'Zone Touristique', '75005'),
(21, 1, 'Quartier Central', '75001'),
(22, 1, 'Quartier Administratif', '75001'),
(23, 2, 'Quartier Industriel', '75002'),
(24, 2, 'Quartier Résidentiel Nord', '75002'),
(25, 3, 'Quartier Résidentiel Sud', '75003'),
(26, 3, 'Quartier Commercial', '75003'),
(27, 4, 'Quartier Résidentiel Est', '75004'),
(28, 4, 'Zone d\'Activités', '75004'),
(29, 5, 'Quartier Résidentiel Ouest', '75005'),
(30, 5, 'Zone Touristique', '75005'),
(31, 1, 'Quartier Central', '75001'),
(32, 1, 'Quartier Administratif', '75001'),
(33, 2, 'Quartier Industriel', '75002'),
(34, 2, 'Quartier Résidentiel Nord', '75002'),
(35, 3, 'Quartier Résidentiel Sud', '75003'),
(36, 3, 'Quartier Commercial', '75003'),
(37, 4, 'Quartier Résidentiel Est', '75004'),
(38, 4, 'Zone d\'Activités', '75004'),
(39, 5, 'Quartier Résidentiel Ouest', '75005'),
(40, 5, 'Zone Touristique', '75005'),
(41, 1, 'Quartier Central', '75001'),
(42, 1, 'Quartier Administratif', '75001'),
(43, 2, 'Quartier Industriel', '75002'),
(44, 2, 'Quartier Résidentiel Nord', '75002'),
(45, 3, 'Quartier Résidentiel Sud', '75003'),
(46, 3, 'Quartier Commercial', '75003'),
(47, 4, 'Quartier Résidentiel Est', '75004'),
(48, 4, 'Zone d\'Activités', '75004'),
(49, 5, 'Quartier Résidentiel Ouest', '75005'),
(50, 5, 'Zone Touristique', '75005'),
(51, 1, 'Quartier Central', '75001'),
(52, 1, 'Quartier Administratif', '75001'),
(53, 2, 'Quartier Industriel', '75002'),
(54, 2, 'Quartier Résidentiel Nord', '75002'),
(55, 3, 'Quartier Résidentiel Sud', '75003'),
(56, 3, 'Quartier Commercial', '75003'),
(57, 4, 'Quartier Résidentiel Est', '75004'),
(58, 4, 'Zone d\'Activités', '75004'),
(59, 5, 'Quartier Résidentiel Ouest', '75005'),
(60, 5, 'Zone Touristique', '75005'),
(61, 1, 'Quartier Central', '75001'),
(62, 1, 'Quartier Administratif', '75001'),
(63, 2, 'Quartier Industriel', '75002'),
(64, 2, 'Quartier Résidentiel Nord', '75002'),
(65, 3, 'Quartier Résidentiel Sud', '75003'),
(66, 3, 'Quartier Commercial', '75003'),
(67, 4, 'Quartier Résidentiel Est', '75004'),
(68, 4, 'Zone d\'Activités', '75004'),
(69, 5, 'Quartier Résidentiel Ouest', '75005'),
(70, 5, 'Zone Touristique', '75005'),
(71, 1, 'Quartier Central', '75001'),
(72, 1, 'Quartier Administratif', '75001'),
(73, 2, 'Quartier Industriel', '75002'),
(74, 2, 'Quartier Résidentiel Nord', '75002'),
(75, 3, 'Quartier Résidentiel Sud', '75003'),
(76, 3, 'Quartier Commercial', '75003'),
(77, 4, 'Quartier Résidentiel Est', '75004'),
(78, 4, 'Zone d\'Activités', '75004'),
(79, 5, 'Quartier Résidentiel Ouest', '75005'),
(80, 5, 'Zone Touristique', '75005'),
(81, 1, 'Quartier Central', '75001'),
(82, 1, 'Quartier Administratif', '75001'),
(83, 2, 'Quartier Industriel', '75002'),
(84, 2, 'Quartier Résidentiel Nord', '75002'),
(85, 3, 'Quartier Résidentiel Sud', '75003'),
(86, 3, 'Quartier Commercial', '75003'),
(87, 4, 'Quartier Résidentiel Est', '75004'),
(88, 4, 'Zone d\'Activités', '75004'),
(89, 5, 'Quartier Résidentiel Ouest', '75005'),
(90, 5, 'Zone Touristique', '75005'),
(91, 1, 'Quartier Central', '75001'),
(92, 1, 'Quartier Administratif', '75001'),
(93, 2, 'Quartier Industriel', '75002'),
(94, 2, 'Quartier Résidentiel Nord', '75002'),
(95, 3, 'Quartier Résidentiel Sud', '75003'),
(96, 3, 'Quartier Commercial', '75003'),
(97, 4, 'Quartier Résidentiel Est', '75004'),
(98, 4, 'Zone d\'Activités', '75004'),
(99, 5, 'Quartier Résidentiel Ouest', '75005'),
(100, 5, 'Zone Touristique', '75005'),
(101, 1, 'Quartier Central', '75001'),
(102, 1, 'Quartier Administratif', '75001'),
(103, 2, 'Quartier Industriel', '75002'),
(104, 2, 'Quartier Résidentiel Nord', '75002'),
(105, 3, 'Quartier Résidentiel Sud', '75003'),
(106, 3, 'Quartier Commercial', '75003'),
(107, 4, 'Quartier Résidentiel Est', '75004'),
(108, 4, 'Zone d\'Activités', '75004'),
(109, 5, 'Quartier Résidentiel Ouest', '75005'),
(110, 5, 'Zone Touristique', '75005'),
(111, 1, 'Quartier Central', '75001'),
(112, 1, 'Quartier Administratif', '75001'),
(113, 2, 'Quartier Industriel', '75002'),
(114, 2, 'Quartier Résidentiel Nord', '75002'),
(115, 3, 'Quartier Résidentiel Sud', '75003'),
(116, 3, 'Quartier Commercial', '75003'),
(117, 4, 'Quartier Résidentiel Est', '75004'),
(118, 4, 'Zone d\'Activités', '75004'),
(119, 5, 'Quartier Résidentiel Ouest', '75005'),
(120, 5, 'Zone Touristique', '75005'),
(121, 1, 'Quartier Central', '75001'),
(122, 1, 'Quartier Administratif', '75001'),
(123, 2, 'Quartier Industriel', '75002'),
(124, 2, 'Quartier Résidentiel Nord', '75002'),
(125, 3, 'Quartier Résidentiel Sud', '75003'),
(126, 3, 'Quartier Commercial', '75003'),
(127, 4, 'Quartier Résidentiel Est', '75004'),
(128, 4, 'Zone d\'Activités', '75004'),
(129, 5, 'Quartier Résidentiel Ouest', '75005'),
(130, 5, 'Zone Touristique', '75005'),
(131, 1, 'Quartier Central', '75001'),
(132, 1, 'Quartier Administratif', '75001'),
(133, 2, 'Quartier Industriel', '75002'),
(134, 2, 'Quartier Résidentiel Nord', '75002'),
(135, 3, 'Quartier Résidentiel Sud', '75003'),
(136, 3, 'Quartier Commercial', '75003'),
(137, 4, 'Quartier Résidentiel Est', '75004'),
(138, 4, 'Zone d\'Activités', '75004'),
(139, 5, 'Quartier Résidentiel Ouest', '75005'),
(140, 5, 'Zone Touristique', '75005'),
(141, 1, 'Quartier Central', '75001'),
(142, 1, 'Quartier Administratif', '75001'),
(143, 2, 'Quartier Industriel', '75002'),
(144, 2, 'Quartier Résidentiel Nord', '75002'),
(145, 3, 'Quartier Résidentiel Sud', '75003'),
(146, 3, 'Quartier Commercial', '75003'),
(147, 4, 'Quartier Résidentiel Est', '75004'),
(148, 4, 'Zone d\'Activités', '75004'),
(149, 5, 'Quartier Résidentiel Ouest', '75005'),
(150, 5, 'Zone Touristique', '75005'),
(151, 1, 'Quartier Central', '75001'),
(152, 1, 'Quartier Administratif', '75001'),
(153, 2, 'Quartier Industriel', '75002'),
(154, 2, 'Quartier Résidentiel Nord', '75002'),
(155, 3, 'Quartier Résidentiel Sud', '75003'),
(156, 3, 'Quartier Commercial', '75003'),
(157, 4, 'Quartier Résidentiel Est', '75004'),
(158, 4, 'Zone d\'Activités', '75004'),
(159, 5, 'Quartier Résidentiel Ouest', '75005'),
(160, 5, 'Zone Touristique', '75005'),
(161, 1, 'Quartier Central', '75001'),
(162, 1, 'Quartier Administratif', '75001'),
(163, 2, 'Quartier Industriel', '75002'),
(164, 2, 'Quartier Résidentiel Nord', '75002'),
(165, 3, 'Quartier Résidentiel Sud', '75003'),
(166, 3, 'Quartier Commercial', '75003'),
(167, 4, 'Quartier Résidentiel Est', '75004'),
(168, 4, 'Zone d\'Activités', '75004'),
(169, 5, 'Quartier Résidentiel Ouest', '75005'),
(170, 5, 'Zone Touristique', '75005'),
(171, 1, 'Quartier Central', '75001'),
(172, 1, 'Quartier Administratif', '75001'),
(173, 2, 'Quartier Industriel', '75002'),
(174, 2, 'Quartier Résidentiel Nord', '75002'),
(175, 3, 'Quartier Résidentiel Sud', '75003'),
(176, 3, 'Quartier Commercial', '75003'),
(177, 4, 'Quartier Résidentiel Est', '75004'),
(178, 4, 'Zone d\'Activités', '75004'),
(179, 5, 'Quartier Résidentiel Ouest', '75005'),
(180, 5, 'Zone Touristique', '75005'),
(181, 1, 'Quartier Central', '75001'),
(182, 1, 'Quartier Administratif', '75001'),
(183, 2, 'Quartier Industriel', '75002'),
(184, 2, 'Quartier Résidentiel Nord', '75002'),
(185, 3, 'Quartier Résidentiel Sud', '75003'),
(186, 3, 'Quartier Commercial', '75003'),
(187, 4, 'Quartier Résidentiel Est', '75004'),
(188, 4, 'Zone d\'Activités', '75004'),
(189, 5, 'Quartier Résidentiel Ouest', '75005'),
(190, 5, 'Zone Touristique', '75005'),
(191, 1, 'Quartier Central', '75001'),
(192, 1, 'Quartier Administratif', '75001'),
(193, 2, 'Quartier Industriel', '75002'),
(194, 2, 'Quartier Résidentiel Nord', '75002'),
(195, 3, 'Quartier Résidentiel Sud', '75003'),
(196, 3, 'Quartier Commercial', '75003'),
(197, 4, 'Quartier Résidentiel Est', '75004'),
(198, 4, 'Zone d\'Activités', '75004'),
(199, 5, 'Quartier Résidentiel Ouest', '75005'),
(200, 5, 'Zone Touristique', '75005'),
(201, 1, 'Quartier Central', '75001'),
(202, 1, 'Quartier Administratif', '75001'),
(203, 2, 'Quartier Industriel', '75002'),
(204, 2, 'Quartier Résidentiel Nord', '75002'),
(205, 3, 'Quartier Résidentiel Sud', '75003'),
(206, 3, 'Quartier Commercial', '75003'),
(207, 4, 'Quartier Résidentiel Est', '75004'),
(208, 4, 'Zone d\'Activités', '75004'),
(209, 5, 'Quartier Résidentiel Ouest', '75005'),
(210, 5, 'Zone Touristique', '75005'),
(211, 1, 'Quartier Central', '75001'),
(212, 1, 'Quartier Administratif', '75001'),
(213, 2, 'Quartier Industriel', '75002'),
(214, 2, 'Quartier Résidentiel Nord', '75002'),
(215, 3, 'Quartier Résidentiel Sud', '75003'),
(216, 3, 'Quartier Commercial', '75003'),
(217, 4, 'Quartier Résidentiel Est', '75004'),
(218, 4, 'Zone d\'Activités', '75004'),
(219, 5, 'Quartier Résidentiel Ouest', '75005'),
(220, 5, 'Zone Touristique', '75005'),
(221, 1, 'Quartier Central', '75001'),
(222, 1, 'Quartier Administratif', '75001'),
(223, 2, 'Quartier Industriel', '75002'),
(224, 2, 'Quartier Résidentiel Nord', '75002'),
(225, 3, 'Quartier Résidentiel Sud', '75003'),
(226, 3, 'Quartier Commercial', '75003'),
(227, 4, 'Quartier Résidentiel Est', '75004'),
(228, 4, 'Zone d\'Activités', '75004'),
(229, 5, 'Quartier Résidentiel Ouest', '75005'),
(230, 5, 'Zone Touristique', '75005'),
(231, 1, 'Quartier Central', '75001'),
(232, 1, 'Quartier Administratif', '75001'),
(233, 2, 'Quartier Industriel', '75002'),
(234, 2, 'Quartier Résidentiel Nord', '75002'),
(235, 3, 'Quartier Résidentiel Sud', '75003'),
(236, 3, 'Quartier Commercial', '75003'),
(237, 4, 'Quartier Résidentiel Est', '75004'),
(238, 4, 'Zone d\'Activités', '75004'),
(239, 5, 'Quartier Résidentiel Ouest', '75005'),
(240, 5, 'Zone Touristique', '75005'),
(241, 1, 'Quartier Central', '75001'),
(242, 1, 'Quartier Administratif', '75001'),
(243, 2, 'Quartier Industriel', '75002'),
(244, 2, 'Quartier Résidentiel Nord', '75002'),
(245, 3, 'Quartier Résidentiel Sud', '75003'),
(246, 3, 'Quartier Commercial', '75003'),
(247, 4, 'Quartier Résidentiel Est', '75004'),
(248, 4, 'Zone d\'Activités', '75004'),
(249, 5, 'Quartier Résidentiel Ouest', '75005'),
(250, 5, 'Zone Touristique', '75005'),
(251, 1, 'Quartier Central', '75001'),
(252, 1, 'Quartier Administratif', '75001'),
(253, 2, 'Quartier Industriel', '75002'),
(254, 2, 'Quartier Résidentiel Nord', '75002'),
(255, 3, 'Quartier Résidentiel Sud', '75003'),
(256, 3, 'Quartier Commercial', '75003'),
(257, 4, 'Quartier Résidentiel Est', '75004'),
(258, 4, 'Zone d\'Activités', '75004'),
(259, 5, 'Quartier Résidentiel Ouest', '75005'),
(260, 5, 'Zone Touristique', '75005'),
(261, 1, 'Quartier Central', '75001'),
(262, 1, 'Quartier Administratif', '75001'),
(263, 2, 'Quartier Industriel', '75002'),
(264, 2, 'Quartier Résidentiel Nord', '75002'),
(265, 3, 'Quartier Résidentiel Sud', '75003'),
(266, 3, 'Quartier Commercial', '75003'),
(267, 4, 'Quartier Résidentiel Est', '75004'),
(268, 4, 'Zone d\'Activités', '75004'),
(269, 5, 'Quartier Résidentiel Ouest', '75005'),
(270, 5, 'Zone Touristique', '75005'),
(271, 1, 'Quartier Central', '75001'),
(272, 1, 'Quartier Administratif', '75001'),
(273, 2, 'Quartier Industriel', '75002'),
(274, 2, 'Quartier Résidentiel Nord', '75002'),
(275, 3, 'Quartier Résidentiel Sud', '75003'),
(276, 3, 'Quartier Commercial', '75003'),
(277, 4, 'Quartier Résidentiel Est', '75004'),
(278, 4, 'Zone d\'Activités', '75004'),
(279, 5, 'Quartier Résidentiel Ouest', '75005'),
(280, 5, 'Zone Touristique', '75005'),
(281, 1, 'Quartier Central', '75001'),
(282, 1, 'Quartier Administratif', '75001'),
(283, 2, 'Quartier Industriel', '75002'),
(284, 2, 'Quartier Résidentiel Nord', '75002'),
(285, 3, 'Quartier Résidentiel Sud', '75003'),
(286, 3, 'Quartier Commercial', '75003'),
(287, 4, 'Quartier Résidentiel Est', '75004'),
(288, 4, 'Zone d\'Activités', '75004'),
(289, 5, 'Quartier Résidentiel Ouest', '75005'),
(290, 5, 'Zone Touristique', '75005'),
(291, 1, 'Quartier Central', '75001'),
(292, 1, 'Quartier Administratif', '75001'),
(293, 2, 'Quartier Industriel', '75002'),
(294, 2, 'Quartier Résidentiel Nord', '75002'),
(295, 3, 'Quartier Résidentiel Sud', '75003'),
(296, 3, 'Quartier Commercial', '75003'),
(297, 4, 'Quartier Résidentiel Est', '75004'),
(298, 4, 'Zone d\'Activités', '75004'),
(299, 5, 'Quartier Résidentiel Ouest', '75005'),
(300, 5, 'Zone Touristique', '75005'),
(301, 1, 'Quartier Central', '75001'),
(302, 1, 'Quartier Administratif', '75001'),
(303, 2, 'Quartier Industriel', '75002'),
(304, 2, 'Quartier Résidentiel Nord', '75002'),
(305, 3, 'Quartier Résidentiel Sud', '75003'),
(306, 3, 'Quartier Commercial', '75003'),
(307, 4, 'Quartier Résidentiel Est', '75004'),
(308, 4, 'Zone d\'Activités', '75004'),
(309, 5, 'Quartier Résidentiel Ouest', '75005'),
(310, 5, 'Zone Touristique', '75005'),
(311, 1, 'Quartier Central', '75001'),
(312, 1, 'Quartier Administratif', '75001'),
(313, 2, 'Quartier Industriel', '75002'),
(314, 2, 'Quartier Résidentiel Nord', '75002'),
(315, 3, 'Quartier Résidentiel Sud', '75003'),
(316, 3, 'Quartier Commercial', '75003'),
(317, 4, 'Quartier Résidentiel Est', '75004'),
(318, 4, 'Zone d\'Activités', '75004'),
(319, 5, 'Quartier Résidentiel Ouest', '75005'),
(320, 5, 'Zone Touristique', '75005'),
(321, 1, 'Quartier Central', '75001'),
(322, 1, 'Quartier Administratif', '75001'),
(323, 2, 'Quartier Industriel', '75002'),
(324, 2, 'Quartier Résidentiel Nord', '75002'),
(325, 3, 'Quartier Résidentiel Sud', '75003'),
(326, 3, 'Quartier Commercial', '75003'),
(327, 4, 'Quartier Résidentiel Est', '75004'),
(328, 4, 'Zone d\'Activités', '75004'),
(329, 5, 'Quartier Résidentiel Ouest', '75005'),
(330, 5, 'Zone Touristique', '75005'),
(331, 1, 'Quartier Central', '75001'),
(332, 1, 'Quartier Administratif', '75001'),
(333, 2, 'Quartier Industriel', '75002'),
(334, 2, 'Quartier Résidentiel Nord', '75002'),
(335, 3, 'Quartier Résidentiel Sud', '75003'),
(336, 3, 'Quartier Commercial', '75003'),
(337, 4, 'Quartier Résidentiel Est', '75004'),
(338, 4, 'Zone d\'Activités', '75004'),
(339, 5, 'Quartier Résidentiel Ouest', '75005'),
(340, 5, 'Zone Touristique', '75005'),
(341, 1, 'Quartier Central', '75001'),
(342, 1, 'Quartier Administratif', '75001'),
(343, 2, 'Quartier Industriel', '75002'),
(344, 2, 'Quartier Résidentiel Nord', '75002'),
(345, 3, 'Quartier Résidentiel Sud', '75003'),
(346, 3, 'Quartier Commercial', '75003'),
(347, 4, 'Quartier Résidentiel Est', '75004'),
(348, 4, 'Zone d\'Activités', '75004'),
(349, 5, 'Quartier Résidentiel Ouest', '75005'),
(350, 5, 'Zone Touristique', '75005'),
(351, 1, 'Quartier Central', '75001'),
(352, 1, 'Quartier Administratif', '75001'),
(353, 2, 'Quartier Industriel', '75002'),
(354, 2, 'Quartier Résidentiel Nord', '75002'),
(355, 3, 'Quartier Résidentiel Sud', '75003'),
(356, 3, 'Quartier Commercial', '75003'),
(357, 4, 'Quartier Résidentiel Est', '75004'),
(358, 4, 'Zone d\'Activités', '75004'),
(359, 5, 'Quartier Résidentiel Ouest', '75005'),
(360, 5, 'Zone Touristique', '75005'),
(361, 1, 'Quartier Central', '75001'),
(362, 1, 'Quartier Administratif', '75001'),
(363, 2, 'Quartier Industriel', '75002'),
(364, 2, 'Quartier Résidentiel Nord', '75002'),
(365, 3, 'Quartier Résidentiel Sud', '75003'),
(366, 3, 'Quartier Commercial', '75003'),
(367, 4, 'Quartier Résidentiel Est', '75004'),
(368, 4, 'Zone d\'Activités', '75004'),
(369, 5, 'Quartier Résidentiel Ouest', '75005'),
(370, 5, 'Zone Touristique', '75005'),
(371, 1, 'Quartier Central', '75001'),
(372, 1, 'Quartier Administratif', '75001'),
(373, 2, 'Quartier Industriel', '75002'),
(374, 2, 'Quartier Résidentiel Nord', '75002'),
(375, 3, 'Quartier Résidentiel Sud', '75003'),
(376, 3, 'Quartier Commercial', '75003'),
(377, 4, 'Quartier Résidentiel Est', '75004'),
(378, 4, 'Zone d\'Activités', '75004'),
(379, 5, 'Quartier Résidentiel Ouest', '75005'),
(380, 5, 'Zone Touristique', '75005'),
(381, 1, 'Quartier Central', '75001'),
(382, 1, 'Quartier Administratif', '75001'),
(383, 2, 'Quartier Industriel', '75002'),
(384, 2, 'Quartier Résidentiel Nord', '75002'),
(385, 3, 'Quartier Résidentiel Sud', '75003'),
(386, 3, 'Quartier Commercial', '75003'),
(387, 4, 'Quartier Résidentiel Est', '75004'),
(388, 4, 'Zone d\'Activités', '75004'),
(389, 5, 'Quartier Résidentiel Ouest', '75005'),
(390, 5, 'Zone Touristique', '75005'),
(391, 1, 'Quartier Central', '75001'),
(392, 1, 'Quartier Administratif', '75001'),
(393, 2, 'Quartier Industriel', '75002'),
(394, 2, 'Quartier Résidentiel Nord', '75002'),
(395, 3, 'Quartier Résidentiel Sud', '75003'),
(396, 3, 'Quartier Commercial', '75003'),
(397, 4, 'Quartier Résidentiel Est', '75004'),
(398, 4, 'Zone d\'Activités', '75004'),
(399, 5, 'Quartier Résidentiel Ouest', '75005'),
(400, 5, 'Zone Touristique', '75005'),
(401, 1, 'Quartier Central', '75001'),
(402, 1, 'Quartier Administratif', '75001'),
(403, 2, 'Quartier Industriel', '75002'),
(404, 2, 'Quartier Résidentiel Nord', '75002'),
(405, 3, 'Quartier Résidentiel Sud', '75003'),
(406, 3, 'Quartier Commercial', '75003'),
(407, 4, 'Quartier Résidentiel Est', '75004'),
(408, 4, 'Zone d\'Activités', '75004'),
(409, 5, 'Quartier Résidentiel Ouest', '75005'),
(410, 5, 'Zone Touristique', '75005'),
(411, 1, 'Quartier Central', '75001'),
(412, 1, 'Quartier Administratif', '75001'),
(413, 2, 'Quartier Industriel', '75002'),
(414, 2, 'Quartier Résidentiel Nord', '75002'),
(415, 3, 'Quartier Résidentiel Sud', '75003'),
(416, 3, 'Quartier Commercial', '75003'),
(417, 4, 'Quartier Résidentiel Est', '75004'),
(418, 4, 'Zone d\'Activités', '75004'),
(419, 5, 'Quartier Résidentiel Ouest', '75005'),
(420, 5, 'Zone Touristique', '75005'),
(421, 1, 'Quartier Central', '75001'),
(422, 1, 'Quartier Administratif', '75001'),
(423, 2, 'Quartier Industriel', '75002'),
(424, 2, 'Quartier Résidentiel Nord', '75002'),
(425, 3, 'Quartier Résidentiel Sud', '75003'),
(426, 3, 'Quartier Commercial', '75003'),
(427, 4, 'Quartier Résidentiel Est', '75004'),
(428, 4, 'Zone d\'Activités', '75004'),
(429, 5, 'Quartier Résidentiel Ouest', '75005'),
(430, 5, 'Zone Touristique', '75005'),
(431, 1, 'Quartier Central', '75001'),
(432, 1, 'Quartier Administratif', '75001'),
(433, 2, 'Quartier Industriel', '75002'),
(434, 2, 'Quartier Résidentiel Nord', '75002'),
(435, 3, 'Quartier Résidentiel Sud', '75003'),
(436, 3, 'Quartier Commercial', '75003'),
(437, 4, 'Quartier Résidentiel Est', '75004'),
(438, 4, 'Zone d\'Activités', '75004'),
(439, 5, 'Quartier Résidentiel Ouest', '75005'),
(440, 5, 'Zone Touristique', '75005'),
(441, 1, 'Quartier Central', '75001'),
(442, 1, 'Quartier Administratif', '75001'),
(443, 2, 'Quartier Industriel', '75002'),
(444, 2, 'Quartier Résidentiel Nord', '75002'),
(445, 3, 'Quartier Résidentiel Sud', '75003'),
(446, 3, 'Quartier Commercial', '75003'),
(447, 4, 'Quartier Résidentiel Est', '75004'),
(448, 4, 'Zone d\'Activités', '75004'),
(449, 5, 'Quartier Résidentiel Ouest', '75005'),
(450, 5, 'Zone Touristique', '75005'),
(451, 1, 'Quartier Central', '75001'),
(452, 1, 'Quartier Administratif', '75001'),
(453, 2, 'Quartier Industriel', '75002'),
(454, 2, 'Quartier Résidentiel Nord', '75002'),
(455, 3, 'Quartier Résidentiel Sud', '75003'),
(456, 3, 'Quartier Commercial', '75003'),
(457, 4, 'Quartier Résidentiel Est', '75004'),
(458, 4, 'Zone d\'Activités', '75004'),
(459, 5, 'Quartier Résidentiel Ouest', '75005'),
(460, 5, 'Zone Touristique', '75005'),
(461, 1, 'Quartier Central', '75001'),
(462, 1, 'Quartier Administratif', '75001'),
(463, 2, 'Quartier Industriel', '75002'),
(464, 2, 'Quartier Résidentiel Nord', '75002'),
(465, 3, 'Quartier Résidentiel Sud', '75003'),
(466, 3, 'Quartier Commercial', '75003'),
(467, 4, 'Quartier Résidentiel Est', '75004'),
(468, 4, 'Zone d\'Activités', '75004'),
(469, 5, 'Quartier Résidentiel Ouest', '75005'),
(470, 5, 'Zone Touristique', '75005'),
(471, 1, 'Quartier Central', '75001'),
(472, 1, 'Quartier Administratif', '75001'),
(473, 2, 'Quartier Industriel', '75002'),
(474, 2, 'Quartier Résidentiel Nord', '75002'),
(475, 3, 'Quartier Résidentiel Sud', '75003'),
(476, 3, 'Quartier Commercial', '75003'),
(477, 4, 'Quartier Résidentiel Est', '75004'),
(478, 4, 'Zone d\'Activités', '75004'),
(479, 5, 'Quartier Résidentiel Ouest', '75005'),
(480, 5, 'Zone Touristique', '75005'),
(481, 1, 'Quartier Central', '75001'),
(482, 1, 'Quartier Administratif', '75001'),
(483, 2, 'Quartier Industriel', '75002'),
(484, 2, 'Quartier Résidentiel Nord', '75002'),
(485, 3, 'Quartier Résidentiel Sud', '75003'),
(486, 3, 'Quartier Commercial', '75003'),
(487, 4, 'Quartier Résidentiel Est', '75004'),
(488, 4, 'Zone d\'Activités', '75004'),
(489, 5, 'Quartier Résidentiel Ouest', '75005'),
(490, 5, 'Zone Touristique', '75005'),
(491, 1, 'Quartier Central', '75001'),
(492, 1, 'Quartier Administratif', '75001'),
(493, 2, 'Quartier Industriel', '75002'),
(494, 2, 'Quartier Résidentiel Nord', '75002'),
(495, 3, 'Quartier Résidentiel Sud', '75003'),
(496, 3, 'Quartier Commercial', '75003'),
(497, 4, 'Quartier Résidentiel Est', '75004'),
(498, 4, 'Zone d\'Activités', '75004'),
(499, 5, 'Quartier Résidentiel Ouest', '75005'),
(500, 5, 'Zone Touristique', '75005'),
(501, 1, 'Quartier Central', '75001'),
(502, 1, 'Quartier Administratif', '75001'),
(503, 2, 'Quartier Industriel', '75002'),
(504, 2, 'Quartier Résidentiel Nord', '75002'),
(505, 3, 'Quartier Résidentiel Sud', '75003'),
(506, 3, 'Quartier Commercial', '75003'),
(507, 4, 'Quartier Résidentiel Est', '75004'),
(508, 4, 'Zone d\'Activités', '75004'),
(509, 5, 'Quartier Résidentiel Ouest', '75005'),
(510, 5, 'Zone Touristique', '75005'),
(511, 1, 'Quartier Central', '75001'),
(512, 1, 'Quartier Administratif', '75001'),
(513, 2, 'Quartier Industriel', '75002'),
(514, 2, 'Quartier Résidentiel Nord', '75002'),
(515, 3, 'Quartier Résidentiel Sud', '75003'),
(516, 3, 'Quartier Commercial', '75003'),
(517, 4, 'Quartier Résidentiel Est', '75004'),
(518, 4, 'Zone d\'Activités', '75004'),
(519, 5, 'Quartier Résidentiel Ouest', '75005'),
(520, 5, 'Zone Touristique', '75005'),
(521, 1, 'Quartier Central', '75001'),
(522, 1, 'Quartier Administratif', '75001'),
(523, 2, 'Quartier Industriel', '75002'),
(524, 2, 'Quartier Résidentiel Nord', '75002'),
(525, 3, 'Quartier Résidentiel Sud', '75003'),
(526, 3, 'Quartier Commercial', '75003'),
(527, 4, 'Quartier Résidentiel Est', '75004'),
(528, 4, 'Zone d\'Activités', '75004'),
(529, 5, 'Quartier Résidentiel Ouest', '75005'),
(530, 5, 'Zone Touristique', '75005'),
(531, 1, 'Quartier Central', '75001'),
(532, 1, 'Quartier Administratif', '75001'),
(533, 2, 'Quartier Industriel', '75002'),
(534, 2, 'Quartier Résidentiel Nord', '75002'),
(535, 3, 'Quartier Résidentiel Sud', '75003'),
(536, 3, 'Quartier Commercial', '75003'),
(537, 4, 'Quartier Résidentiel Est', '75004'),
(538, 4, 'Zone d\'Activités', '75004'),
(539, 5, 'Quartier Résidentiel Ouest', '75005'),
(540, 5, 'Zone Touristique', '75005'),
(541, 1, 'Quartier Central', '75001'),
(542, 1, 'Quartier Administratif', '75001'),
(543, 2, 'Quartier Industriel', '75002'),
(544, 2, 'Quartier Résidentiel Nord', '75002'),
(545, 3, 'Quartier Résidentiel Sud', '75003'),
(546, 3, 'Quartier Commercial', '75003'),
(547, 4, 'Quartier Résidentiel Est', '75004'),
(548, 4, 'Zone d\'Activités', '75004'),
(549, 5, 'Quartier Résidentiel Ouest', '75005'),
(550, 5, 'Zone Touristique', '75005'),
(551, 1, 'Quartier Central', '75001'),
(552, 1, 'Quartier Administratif', '75001'),
(553, 2, 'Quartier Industriel', '75002'),
(554, 2, 'Quartier Résidentiel Nord', '75002'),
(555, 3, 'Quartier Résidentiel Sud', '75003'),
(556, 3, 'Quartier Commercial', '75003'),
(557, 4, 'Quartier Résidentiel Est', '75004'),
(558, 4, 'Zone d\'Activités', '75004'),
(559, 5, 'Quartier Résidentiel Ouest', '75005'),
(560, 5, 'Zone Touristique', '75005'),
(561, 1, 'Quartier Central', '75001'),
(562, 1, 'Quartier Administratif', '75001'),
(563, 2, 'Quartier Industriel', '75002'),
(564, 2, 'Quartier Résidentiel Nord', '75002'),
(565, 3, 'Quartier Résidentiel Sud', '75003'),
(566, 3, 'Quartier Commercial', '75003'),
(567, 4, 'Quartier Résidentiel Est', '75004'),
(568, 4, 'Zone d\'Activités', '75004'),
(569, 5, 'Quartier Résidentiel Ouest', '75005'),
(570, 5, 'Zone Touristique', '75005'),
(571, 1, 'Quartier Central', '75001'),
(572, 1, 'Quartier Administratif', '75001'),
(573, 2, 'Quartier Industriel', '75002'),
(574, 2, 'Quartier Résidentiel Nord', '75002'),
(575, 3, 'Quartier Résidentiel Sud', '75003'),
(576, 3, 'Quartier Commercial', '75003'),
(577, 4, 'Quartier Résidentiel Est', '75004'),
(578, 4, 'Zone d\'Activités', '75004'),
(579, 5, 'Quartier Résidentiel Ouest', '75005'),
(580, 5, 'Zone Touristique', '75005'),
(581, 1, 'Quartier Central', '75001'),
(582, 1, 'Quartier Administratif', '75001'),
(583, 2, 'Quartier Industriel', '75002'),
(584, 2, 'Quartier Résidentiel Nord', '75002'),
(585, 3, 'Quartier Résidentiel Sud', '75003'),
(586, 3, 'Quartier Commercial', '75003'),
(587, 4, 'Quartier Résidentiel Est', '75004'),
(588, 4, 'Zone d\'Activités', '75004'),
(589, 5, 'Quartier Résidentiel Ouest', '75005'),
(590, 5, 'Zone Touristique', '75005'),
(591, 1, 'Quartier Central', '75001'),
(592, 1, 'Quartier Administratif', '75001'),
(593, 2, 'Quartier Industriel', '75002'),
(594, 2, 'Quartier Résidentiel Nord', '75002'),
(595, 3, 'Quartier Résidentiel Sud', '75003'),
(596, 3, 'Quartier Commercial', '75003'),
(597, 4, 'Quartier Résidentiel Est', '75004'),
(598, 4, 'Zone d\'Activités', '75004'),
(599, 5, 'Quartier Résidentiel Ouest', '75005'),
(600, 5, 'Zone Touristique', '75005'),
(601, 1, 'Quartier Central', '75001'),
(602, 1, 'Quartier Administratif', '75001'),
(603, 2, 'Quartier Industriel', '75002'),
(604, 2, 'Quartier Résidentiel Nord', '75002'),
(605, 3, 'Quartier Résidentiel Sud', '75003'),
(606, 3, 'Quartier Commercial', '75003'),
(607, 4, 'Quartier Résidentiel Est', '75004'),
(608, 4, 'Zone d\'Activités', '75004'),
(609, 5, 'Quartier Résidentiel Ouest', '75005'),
(610, 5, 'Zone Touristique', '75005'),
(611, 1, 'Quartier Central', '75001'),
(612, 1, 'Quartier Administratif', '75001'),
(613, 2, 'Quartier Industriel', '75002'),
(614, 2, 'Quartier Résidentiel Nord', '75002'),
(615, 3, 'Quartier Résidentiel Sud', '75003'),
(616, 3, 'Quartier Commercial', '75003'),
(617, 4, 'Quartier Résidentiel Est', '75004'),
(618, 4, 'Zone d\'Activités', '75004'),
(619, 5, 'Quartier Résidentiel Ouest', '75005'),
(620, 5, 'Zone Touristique', '75005'),
(621, 1, 'Quartier Central', '75001'),
(622, 1, 'Quartier Administratif', '75001'),
(623, 2, 'Quartier Industriel', '75002'),
(624, 2, 'Quartier Résidentiel Nord', '75002'),
(625, 3, 'Quartier Résidentiel Sud', '75003'),
(626, 3, 'Quartier Commercial', '75003'),
(627, 4, 'Quartier Résidentiel Est', '75004'),
(628, 4, 'Zone d\'Activités', '75004'),
(629, 5, 'Quartier Résidentiel Ouest', '75005'),
(630, 5, 'Zone Touristique', '75005'),
(631, 1, 'Quartier Central', '75001'),
(632, 1, 'Quartier Administratif', '75001'),
(633, 2, 'Quartier Industriel', '75002'),
(634, 2, 'Quartier Résidentiel Nord', '75002'),
(635, 3, 'Quartier Résidentiel Sud', '75003'),
(636, 3, 'Quartier Commercial', '75003'),
(637, 4, 'Quartier Résidentiel Est', '75004'),
(638, 4, 'Zone d\'Activités', '75004'),
(639, 5, 'Quartier Résidentiel Ouest', '75005'),
(640, 5, 'Zone Touristique', '75005'),
(641, 1, 'Quartier Central', '75001'),
(642, 1, 'Quartier Administratif', '75001'),
(643, 2, 'Quartier Industriel', '75002'),
(644, 2, 'Quartier Résidentiel Nord', '75002'),
(645, 3, 'Quartier Résidentiel Sud', '75003'),
(646, 3, 'Quartier Commercial', '75003'),
(647, 4, 'Quartier Résidentiel Est', '75004'),
(648, 4, 'Zone d\'Activités', '75004'),
(649, 5, 'Quartier Résidentiel Ouest', '75005'),
(650, 5, 'Zone Touristique', '75005'),
(651, 1, 'Quartier Central', '75001'),
(652, 1, 'Quartier Administratif', '75001'),
(653, 2, 'Quartier Industriel', '75002'),
(654, 2, 'Quartier Résidentiel Nord', '75002'),
(655, 3, 'Quartier Résidentiel Sud', '75003'),
(656, 3, 'Quartier Commercial', '75003'),
(657, 4, 'Quartier Résidentiel Est', '75004'),
(658, 4, 'Zone d\'Activités', '75004'),
(659, 5, 'Quartier Résidentiel Ouest', '75005'),
(660, 5, 'Zone Touristique', '75005');

-- --------------------------------------------------------

--
-- Structure de la table `reponses`
--

CREATE TABLE `reponses` (
  `id_reponse` int(11) NOT NULL,
  `id_doleance` int(11) DEFAULT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `est_interne` tinyint(1) DEFAULT 0,
  `date_reponse` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE `roles` (
  `id_role` int(11) NOT NULL,
  `nom_role` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_system` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id_role`, `nom_role`, `description`, `permissions`, `created_at`, `is_system`) VALUES
(1, 'citoyen', 'Citoyen - Peut déposer des doléances', '{\"doleances\": [\"create\", \"view_own\"], \"profile\": [\"view\", \"edit\"]}', '2026-05-19 06:31:58', 0),
(2, 'agent', 'Agent de traitement - peut traiter les doléances', NULL, '2026-05-28 08:34:22', 0),
(3, 'directeur', 'Directeur de direction - supervise les traitements', NULL, '2026-05-28 08:34:22', 0),
(4, 'administrateur', 'Administrateur système - gère tout le système', NULL, '2026-05-28 08:34:22', 0),
(5, 'maire', 'Maire - validation finale et supervision', NULL, '2026-05-28 08:34:22', 0),
(10, 'administrateur_systeme', 'Administrateur Système - Gère tout le système', '{\"all\": [\"*\"]}', '2026-05-19 11:13:01', 1),
(11, 'agent_central', 'Agent Central - Répartition des doléances', '{\"doleances\":[\"assign\",\"delete\",\"view_all\",\"transfer\",\"update_status\",\"stats_view\"],\"users\":[\"view\"],\"profile\":[],\"rapports\":[\"generate\",\"export\"]}', '2026-05-28 05:56:35', 1);

-- --------------------------------------------------------

--
-- Structure de la table `services`
--

CREATE TABLE `services` (
  `id_service` int(11) NOT NULL,
  `id_direction` int(11) NOT NULL,
  `nom_service` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `responsable` varchar(255) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `statuts`
--

CREATE TABLE `statuts` (
  `id_statut` int(11) NOT NULL,
  `nom_statut` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `couleur` varchar(20) DEFAULT NULL,
  `ordre` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `statuts`
--

INSERT INTO `statuts` (`id_statut`, `nom_statut`, `description`, `couleur`, `ordre`) VALUES
(1, 'Nouvelle', 'Doléance récemment déposée', '#FF9800', 1),
(2, 'En attente', 'En attente de traitement', '#FFC107', 2),
(3, 'Assignée', 'Assignée à un agent', '#2196F3', 3),
(4, 'En traitement', 'En cours de traitement', '#9C27B0', 4),
(5, 'Résolue', 'Problème résolu', '#4CAF50', 5),
(6, 'Clôturée', 'Doléance clôturée', '#9E9E9E', 6),
(7, 'Rejetée', 'Doléance rejetée', '#F44336', 7);

-- --------------------------------------------------------

--
-- Structure de la table `transferts`
--

CREATE TABLE `transferts` (
  `id_transfert` int(11) NOT NULL,
  `id_doleance` int(11) DEFAULT NULL,
  `id_direction_source` int(11) DEFAULT NULL,
  `id_direction_destination` int(11) DEFAULT NULL,
  `motif` text DEFAULT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `date_transfert` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id_utilisateur` int(11) NOT NULL,
  `id_role` int(11) DEFAULT NULL,
  `id_direction` int(11) DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `mot_de_passe` text NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `derniere_connexion` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id_utilisateur`, `id_role`, `id_direction`, `nom`, `prenom`, `email`, `mot_de_passe`, `telephone`, `actif`, `derniere_connexion`, `date_creation`) VALUES
(1, 4, NULL, 'Admin', 'Système', 'admin@mairie.com', '$2a$10$elUr2REVrT0o4Se5wNawp..ZG4QeS7nsL19W6IJ21Lv9k2bZmYCDq', NULL, 1, NULL, '2026-05-28 08:34:22'),
(9, 10, 23, 'RASAMOELISONA', 'MIHARINTSOA', 'nmiharintsoa@gmail.com', '$2a$10$P401GmnuJxOT3AY2ZUbcl.H9zBdLvFcMLLZd9gQQ57RQAXWR16o9W', '0384489198', 1, '2026-05-29 06:38:32', '2026-05-26 06:13:25'),
(15, 11, 23, 'RASAMOELISONA', 'MIHARINTSOA', 'nmiharintsoa0@gmail.com', '$2a$10$uSLTebZUEVs3zPwHCj8GOOx/DLUrHlb5GYMLuU1PoNQooBwDzNAxa', '0384489198', 1, '2026-05-29 06:36:42', '2026-05-29 06:36:28'),
(16, 2, 17, 'RASAMOELISONA', 'MIHARINTSOA', '0@gmail.com', '$2a$10$mGtt57mbNBFz5c9l9r.ksOoTrRSSeKBMAyE7JJ58/lyTJK115xJqy', '0222222222', 1, '2026-05-29 06:39:32', '2026-05-29 06:39:08');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `arrondissements`
--
ALTER TABLE `arrondissements`
  ADD PRIMARY KEY (`id_arrondissement`);

--
-- Index pour la table `assignations`
--
ALTER TABLE `assignations`
  ADD PRIMARY KEY (`id_assignation`),
  ADD KEY `id_doleance` (`id_doleance`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Index pour la table `categories_doleance`
--
ALTER TABLE `categories_doleance`
  ADD PRIMARY KEY (`id_categorie`);

--
-- Index pour la table `citoyens`
--
ALTER TABLE `citoyens`
  ADD PRIMARY KEY (`id_citoyen`);

--
-- Index pour la table `commentaires_internes`
--
ALTER TABLE `commentaires_internes`
  ADD PRIMARY KEY (`id_commentaire`),
  ADD KEY `id_doleance` (`id_doleance`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Index pour la table `directions`
--
ALTER TABLE `directions`
  ADD PRIMARY KEY (`id_direction`);

--
-- Index pour la table `doleances`
--
ALTER TABLE `doleances`
  ADD PRIMARY KEY (`id_doleance`),
  ADD UNIQUE KEY `reference` (`reference`),
  ADD KEY `id_citoyen` (`id_citoyen`),
  ADD KEY `id_categorie` (`id_categorie`),
  ADD KEY `id_statut` (`id_statut`),
  ADD KEY `id_priorite` (`id_priorite`),
  ADD KEY `id_direction` (`id_direction`),
  ADD KEY `id_quartier` (`id_quartier`),
  ADD KEY `id_utilisateur_assignee` (`id_utilisateur_assignee`);

--
-- Index pour la table `fokontany`
--
ALTER TABLE `fokontany`
  ADD PRIMARY KEY (`id_fokontany`),
  ADD KEY `id_arrondissement` (`id_arrondissement`);

--
-- Index pour la table `historique_statuts`
--
ALTER TABLE `historique_statuts`
  ADD PRIMARY KEY (`id_historique`),
  ADD KEY `id_doleance` (`id_doleance`),
  ADD KEY `id_statut_ancien` (`id_statut_ancien`),
  ADD KEY `id_statut_nouveau` (`id_statut_nouveau`);

--
-- Index pour la table `logs_activites`
--
ALTER TABLE `logs_activites`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id_notification`),
  ADD KEY `id_destinataire` (`id_destinataire`),
  ADD KEY `id_doleance` (`id_doleance`);

--
-- Index pour la table `notifications_transfert`
--
ALTER TABLE `notifications_transfert`
  ADD PRIMARY KEY (`id_notification`),
  ADD KEY `id_transfert` (`id_transfert`),
  ADD KEY `id_destinataire` (`id_destinataire`);

--
-- Index pour la table `pieces_jointes`
--
ALTER TABLE `pieces_jointes`
  ADD PRIMARY KEY (`id_piece`),
  ADD KEY `id_doleance` (`id_doleance`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Index pour la table `priorites`
--
ALTER TABLE `priorites`
  ADD PRIMARY KEY (`id_priorite`),
  ADD UNIQUE KEY `niveau` (`niveau`);

--
-- Index pour la table `quartiers`
--
ALTER TABLE `quartiers`
  ADD PRIMARY KEY (`id_quartier`),
  ADD KEY `id_arrondissement` (`id_arrondissement`);

--
-- Index pour la table `reponses`
--
ALTER TABLE `reponses`
  ADD PRIMARY KEY (`id_reponse`),
  ADD KEY `id_doleance` (`id_doleance`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Index pour la table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_role`),
  ADD UNIQUE KEY `nom_role` (`nom_role`);

--
-- Index pour la table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id_service`),
  ADD KEY `id_direction` (`id_direction`);

--
-- Index pour la table `statuts`
--
ALTER TABLE `statuts`
  ADD PRIMARY KEY (`id_statut`);

--
-- Index pour la table `transferts`
--
ALTER TABLE `transferts`
  ADD PRIMARY KEY (`id_transfert`),
  ADD KEY `id_doleance` (`id_doleance`),
  ADD KEY `id_direction_source` (`id_direction_source`),
  ADD KEY `id_direction_destination` (`id_direction_destination`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id_utilisateur`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_role` (`id_role`),
  ADD KEY `id_direction` (`id_direction`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `arrondissements`
--
ALTER TABLE `arrondissements`
  MODIFY `id_arrondissement` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `assignations`
--
ALTER TABLE `assignations`
  MODIFY `id_assignation` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `categories_doleance`
--
ALTER TABLE `categories_doleance`
  MODIFY `id_categorie` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `citoyens`
--
ALTER TABLE `citoyens`
  MODIFY `id_citoyen` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `commentaires_internes`
--
ALTER TABLE `commentaires_internes`
  MODIFY `id_commentaire` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `directions`
--
ALTER TABLE `directions`
  MODIFY `id_direction` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT pour la table `doleances`
--
ALTER TABLE `doleances`
  MODIFY `id_doleance` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `fokontany`
--
ALTER TABLE `fokontany`
  MODIFY `id_fokontany` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `historique_statuts`
--
ALTER TABLE `historique_statuts`
  MODIFY `id_historique` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `logs_activites`
--
ALTER TABLE `logs_activites`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id_notification` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications_transfert`
--
ALTER TABLE `notifications_transfert`
  MODIFY `id_notification` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pieces_jointes`
--
ALTER TABLE `pieces_jointes`
  MODIFY `id_piece` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `priorites`
--
ALTER TABLE `priorites`
  MODIFY `id_priorite` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `quartiers`
--
ALTER TABLE `quartiers`
  MODIFY `id_quartier` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=661;

--
-- AUTO_INCREMENT pour la table `reponses`
--
ALTER TABLE `reponses`
  MODIFY `id_reponse` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `roles`
--
ALTER TABLE `roles`
  MODIFY `id_role` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT pour la table `services`
--
ALTER TABLE `services`
  MODIFY `id_service` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `statuts`
--
ALTER TABLE `statuts`
  MODIFY `id_statut` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `transferts`
--
ALTER TABLE `transferts`
  MODIFY `id_transfert` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id_utilisateur` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `assignations`
--
ALTER TABLE `assignations`
  ADD CONSTRAINT `assignations_ibfk_1` FOREIGN KEY (`id_doleance`) REFERENCES `doleances` (`id_doleance`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignations_ibfk_2` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `commentaires_internes`
--
ALTER TABLE `commentaires_internes`
  ADD CONSTRAINT `commentaires_internes_ibfk_1` FOREIGN KEY (`id_doleance`) REFERENCES `doleances` (`id_doleance`) ON DELETE CASCADE,
  ADD CONSTRAINT `commentaires_internes_ibfk_2` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `doleances`
--
ALTER TABLE `doleances`
  ADD CONSTRAINT `doleances_ibfk_1` FOREIGN KEY (`id_citoyen`) REFERENCES `citoyens` (`id_citoyen`),
  ADD CONSTRAINT `doleances_ibfk_2` FOREIGN KEY (`id_categorie`) REFERENCES `categories_doleance` (`id_categorie`),
  ADD CONSTRAINT `doleances_ibfk_3` FOREIGN KEY (`id_statut`) REFERENCES `statuts` (`id_statut`),
  ADD CONSTRAINT `doleances_ibfk_4` FOREIGN KEY (`id_priorite`) REFERENCES `priorites` (`id_priorite`),
  ADD CONSTRAINT `doleances_ibfk_5` FOREIGN KEY (`id_direction`) REFERENCES `directions` (`id_direction`),
  ADD CONSTRAINT `doleances_ibfk_6` FOREIGN KEY (`id_quartier`) REFERENCES `quartiers` (`id_quartier`),
  ADD CONSTRAINT `doleances_ibfk_7` FOREIGN KEY (`id_utilisateur_assignee`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `fokontany`
--
ALTER TABLE `fokontany`
  ADD CONSTRAINT `fokontany_ibfk_1` FOREIGN KEY (`id_arrondissement`) REFERENCES `arrondissements` (`id_arrondissement`) ON DELETE CASCADE;

--
-- Contraintes pour la table `historique_statuts`
--
ALTER TABLE `historique_statuts`
  ADD CONSTRAINT `historique_statuts_ibfk_1` FOREIGN KEY (`id_doleance`) REFERENCES `doleances` (`id_doleance`) ON DELETE CASCADE,
  ADD CONSTRAINT `historique_statuts_ibfk_2` FOREIGN KEY (`id_statut_ancien`) REFERENCES `statuts` (`id_statut`),
  ADD CONSTRAINT `historique_statuts_ibfk_3` FOREIGN KEY (`id_statut_nouveau`) REFERENCES `statuts` (`id_statut`);

--
-- Contraintes pour la table `logs_activites`
--
ALTER TABLE `logs_activites`
  ADD CONSTRAINT `logs_activites_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`id_destinataire`) REFERENCES `utilisateurs` (`id_utilisateur`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`id_doleance`) REFERENCES `doleances` (`id_doleance`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notifications_transfert`
--
ALTER TABLE `notifications_transfert`
  ADD CONSTRAINT `notifications_transfert_ibfk_1` FOREIGN KEY (`id_transfert`) REFERENCES `transferts` (`id_transfert`),
  ADD CONSTRAINT `notifications_transfert_ibfk_2` FOREIGN KEY (`id_destinataire`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `pieces_jointes`
--
ALTER TABLE `pieces_jointes`
  ADD CONSTRAINT `pieces_jointes_ibfk_1` FOREIGN KEY (`id_doleance`) REFERENCES `doleances` (`id_doleance`) ON DELETE CASCADE,
  ADD CONSTRAINT `pieces_jointes_ibfk_2` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `quartiers`
--
ALTER TABLE `quartiers`
  ADD CONSTRAINT `quartiers_ibfk_1` FOREIGN KEY (`id_arrondissement`) REFERENCES `arrondissements` (`id_arrondissement`);

--
-- Contraintes pour la table `reponses`
--
ALTER TABLE `reponses`
  ADD CONSTRAINT `reponses_ibfk_1` FOREIGN KEY (`id_doleance`) REFERENCES `doleances` (`id_doleance`) ON DELETE CASCADE,
  ADD CONSTRAINT `reponses_ibfk_2` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`id_direction`) REFERENCES `directions` (`id_direction`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transferts`
--
ALTER TABLE `transferts`
  ADD CONSTRAINT `transferts_ibfk_1` FOREIGN KEY (`id_doleance`) REFERENCES `doleances` (`id_doleance`) ON DELETE CASCADE,
  ADD CONSTRAINT `transferts_ibfk_2` FOREIGN KEY (`id_direction_source`) REFERENCES `directions` (`id_direction`),
  ADD CONSTRAINT `transferts_ibfk_3` FOREIGN KEY (`id_direction_destination`) REFERENCES `directions` (`id_direction`),
  ADD CONSTRAINT `transferts_ibfk_4` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Contraintes pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD CONSTRAINT `utilisateurs_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `roles` (`id_role`),
  ADD CONSTRAINT `utilisateurs_ibfk_2` FOREIGN KEY (`id_direction`) REFERENCES `directions` (`id_direction`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
