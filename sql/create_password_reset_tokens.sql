-- ============================================================
-- Script SQL : Table password_reset_tokens
-- Système de réinitialisation de mot de passe
-- Commune Urbaine d'Antananarivo — Plateforme DOLEANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
);

-- Index pour recherche rapide par token
CREATE INDEX idx_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_user ON password_reset_tokens(id_utilisateur);

-- Nettoyage automatique des tokens expirés (optionnel, à exécuter périodiquement)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE;
