// middleware/validationMiddleware.js

// Valider l'ID utilisateur
const validateUserId = (req, res, next) => {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            success: false,
            message: 'ID utilisateur invalide'
        });
    }
    
    next();
};

// Valider la création d'utilisateur
const validateUserCreate = (req, res, next) => {
    const { nom, prenom, email, password } = req.body;
    const errors = [];
    
    if (!nom || nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!prenom || prenom.trim().length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email invalide');
    }
    
    if (!password || password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors: errors
        });
    }
    
    // Nettoyer les données
    req.body.nom = nom.trim();
    req.body.prenom = prenom.trim();
    req.body.email = email.trim().toLowerCase();
    
    next();
};

// Valider la mise à jour d'utilisateur
const validateUserUpdate = (req, res, next) => {
    const { nom, prenom, email, telephone, id_role, id_direction } = req.body;
    const errors = [];
    
    if (nom && nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (prenom && prenom.trim().length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email invalide');
    }
    
    if (telephone && telephone !== '') {
        const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
        if (!phoneRegex.test(telephone)) {
            errors.push('Numéro de téléphone invalide');
        }
    }
    
    if (id_role && isNaN(parseInt(id_role))) {
        errors.push('Rôle invalide');
    }
    
    if (id_direction && id_direction !== '' && isNaN(parseInt(id_direction))) {
        errors.push('Direction invalide');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors: errors
        });
    }
    
    // Nettoyer les données si elles existent
    if (nom) req.body.nom = nom.trim();
    if (prenom) req.body.prenom = prenom.trim();
    if (email) req.body.email = email.trim().toLowerCase();
    if (telephone) req.body.telephone = telephone.trim() || null;
    if (id_role) req.body.id_role = parseInt(id_role);
    if (id_direction) req.body.id_direction = id_direction === '' ? null : parseInt(id_direction);
    
    next();
};

// Valider le changement de statut
const validateToggleStatus = (req, res, next) => {
    const { actif } = req.body;
    
    if (actif === undefined || (actif !== 0 && actif !== 1)) {
        return res.status(400).json({
            success: false,
            message: 'Le statut doit être 0 (inactif) ou 1 (actif)'
        });
    }
    
    next();
};

// Valider la réinitialisation du mot de passe
const validateResetPassword = (req, res, next) => {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            success: false,
            message: 'ID utilisateur invalide'
        });
    }
    
    next();
};

module.exports = {
    validateUserId,
    validateUserCreate,
    validateUserUpdate,
    validateToggleStatus,
    validateResetPassword
};