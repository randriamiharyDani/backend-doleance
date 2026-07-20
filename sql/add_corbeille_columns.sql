-- Migration: Ajout des colonnes corbeille (soft delete) à la table doleances
-- Exécuter ce script une seule fois

ALTER TABLE `doleances`
  ADD COLUMN `supprime` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = supprimé (corbeille), 0 = actif' AFTER `piece_jointe_date`,
  ADD COLUMN `date_suppression` TIMESTAMP NULL DEFAULT NULL COMMENT 'Date de suppression (mise en corbeille)' AFTER `supprime`;

-- Index pour optimiser les requêtes sur la corbeille
CREATE INDEX idx_doleances_supprime ON doleances(supprime);
CREATE INDEX idx_doleances_date_suppression ON doleances(date_suppression);
