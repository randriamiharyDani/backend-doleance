const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    getUnreadCount,
    sendNotification,
    sendBulkNotification,
    getPreferences,
    updatePreferences
} = require('../controllers/notificationController');

// Routes pour l'utilisateur connecté
router.get('/', protect, getNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.get('/preferences', protect, getPreferences);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/read', protect, deleteAllRead);
router.put('/preferences', protect, updatePreferences);

// Routes admin
router.post('/send', protect, authorize('administrateur'), sendNotification);
router.post('/bulk', protect, authorize('administrateur'), sendBulkNotification);

module.exports = router;