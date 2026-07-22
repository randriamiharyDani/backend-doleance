-- Ajout des catégories par défaut "Autre (Hafa)" pour CUA et Sapeurs-Pompiers
-- Ces catégories permettent au citoyen de décrire librement son problème
-- lorsqu'aucune autre catégorie ne correspond à sa situation.

INSERT IGNORE INTO categories_doleance (id_categorie, nom_categorie, nom_malgache, description, direction_concernee, couleur, icone, module, actif) VALUES
(16, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', NULL, '#6B7280', 'other', 'CUA', 1),
(17, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', NULL, '#6B7280', 'other', 'Sapeurs-Pompiers', 1);
