-- Ajout des catégories par défaut "Autre (Hafa)" pour CUA et Sapeurs-Pompiers
-- Ces catégories permettent au citoyen de décrire librement son problème
-- lorsqu'aucune autre catégorie ne correspond à sa situation.

-- S'assurer que les catégories Sapeurs-Pompiers existent
INSERT IGNORE INTO categories_doleance (id_categorie, nom_categorie, nom_malgache, description, direction_concernee, couleur, icone, module, actif) VALUES
(30, 'Incendie', 'Afo', 'Incendies domestiques et industriels', 'Chef de corps des Sapeurs Pompiers', '#EF4444', 'fire', 'Sapeurs-Pompiers', 1),
(31, 'Accident de circulation', 'Loza', 'Accidents de la route et secours', 'Chef de corps des Sapeurs Pompiers', '#F97316', 'accident', 'Sapeurs-Pompiers', 1),
(32, 'Secours à personne', 'Fanavotana', 'Personnes en danger ou blessées', 'Chef de corps des Sapeurs Pompiers', '#3B82F6', 'medical', 'Sapeurs-Pompiers', 1),
(33, 'Inondation', 'Tondra-drano', 'Zones inondées et assistance', 'Chef de corps des Sapeurs Pompiers', '#06B6D4', 'flood', 'Sapeurs-Pompiers', 1),
(34, 'Catastrophe naturelle', 'Loza voajanahary', 'Tremblements de terre, cyclones', 'Chef de corps des Sapeurs Pompiers', '#8B5CF6', 'disaster', 'Sapeurs-Pompiers', 1),
(35, 'Animal dangereux', 'Biby mampidi-doza', 'Animaux errants ou dangereux', 'Chef de corps des Sapeurs Pompiers', '#84CC16', 'animal', 'Sapeurs-Pompiers', 1),
(36, 'Produit dangereux', 'Zavatra mampidi-doza', 'Fuite de gaz, produits chimiques', 'Chef de corps des Sapeurs Pompiers', '#EC4899', 'hazard', 'Sapeurs-Pompiers', 1),
(37, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', NULL, '#6B7280', 'clipboard', 'Sapeurs-Pompiers', 1),
(38, 'Autre (Hafa)', 'Hafa', 'Décrivez librement votre problème si aucune catégorie ne correspond', NULL, '#6B7280', 'clipboard', 'CUA', 1);
