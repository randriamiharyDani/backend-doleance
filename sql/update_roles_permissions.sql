UPDATE roles SET permissions = '{"doleances":["view_all","assign","respond","update_status","transfer","stats_view","view_own"],"profile":["view","edit","change_password"],"users":["view","view_agents"],"directions":["manage_service","view_team"],"rapports":["stats_view"]}' WHERE nom_role = 'directeur';

UPDATE roles SET permissions = '{"doleances":["view_all","respond","validate","update_status","stats_view","view_own","assign","transfer"],"profile":["view","edit","change_password"],"users":["view","create","update","delete","manage_roles","view_agents"],"directions":["manage_direction","manage_service","view_team"],"rapports":["export","generate"]}' WHERE nom_role = 'maire';

UPDATE roles SET permissions = '{"doleances":["view_all","transfer","assign","respond","update_status","stats_view","validate","view_own"],"profile":["view","edit","change_password"],"users":["view","create","update","delete","view_agents"],"directions":["manage_direction","manage_service","view_team"],"rapports":["export","generate"]}' WHERE nom_role = 'secretaire_general';

UPDATE roles SET permissions = '{"all":["*"]}' WHERE nom_role = 'administrateur';

UPDATE roles SET permissions = '{"all":["*"]}' WHERE nom_role = 'agent_central';
