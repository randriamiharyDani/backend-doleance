const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    login,
    register,
    verifyToken,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// Routes publiques (sans authentification)
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-token', verifyToken);

// Routes protégées (nécessitent authentification)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

module.exports = router;