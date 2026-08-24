-- ============================================================
-- Gestion des contacts d'urgence + paramètres réseaux sociaux
-- Contacts : CUA, Sapeurs-Pompiers, Police Municipale, BMH
-- Paramètres footer public : WhatsApp, Facebook, Instagram
-- (Le backend exécute aussi ces scripts automatiquement au démarrage)
-- ============================================================

CREATE TABLE IF NOT EXISTS contacts_urgence (
  id_contact INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  libelle VARCHAR(100) NOT NULL,
  telephone VARCHAR(30) NULL,
  ordre INT DEFAULT 0,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parametres_site (
  cle VARCHAR(50) PRIMARY KEY,
  valeur TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO contacts_urgence (code, libelle, telephone, ordre) VALUES
  ('CUA', 'CUA', '034 72 139 93', 1),
  ('SAPEURS_POMPIERS', 'Sapeurs Pompiers', '034 12 232 35', 2),
  ('POLICE_MUNICIPALE', 'Police Municipale', '034 58 694 10', 3),
  ('BMH', 'BMH', '032 22 655 25', 4);

INSERT IGNORE INTO parametres_site (cle, valeur) VALUES
  ('whatsapp', ''),
  ('facebook', ''),
  ('instagram', '');
