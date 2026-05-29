const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    login,
    register,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

module.exports = router;